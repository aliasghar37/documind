"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { ProjectCategory } from "@/generated/prisma/enums";

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

function sanitizeFileName(name: string) {
    return name
        .replace(/[^a-zA-Z0-9.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function isValidObjectId(id: string) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

export type HandleCreateProjectResult = {
    success: boolean;
    projectId?: string;
    message?: string;
};

export async function handleCreateProject(
    formData: FormData,
): Promise<HandleCreateProjectResult> {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return {
            success: false,
            message: "Server configuration error: Supabase not configured.",
        };
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return { success: false, message: "Unauthenticated." };
    }

    const dbUser = await prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
    });

    if (!dbUser || !isValidObjectId(dbUser.id)) {
        return { success: false, message: "Invalid or missing user id." };
    }

    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const webSearchRaw = formData.get("webSearch") as string | null;
    const webSearch = webSearchRaw === "true";
    const projectCategoryRaw =
        (formData.get("projectCategory") as string) || "General Purpose";

    const CATEGORY_MAP: Record<string, string> = {
        "General Purpose": "GENERAL_PURPOSE",
        "Academic & Education": "ACADEMIC_AND_EDUCATION",
        "Professional & Office": "PROFESSIONAL_AND_OFFICE",
        "Medical & Healthcare": "MEDICAL_AND_HEALTH",
    };
    const projectCategory = (CATEGORY_MAP[projectCategoryRaw] ??
        "GENERAL_PURPOSE") as ProjectCategory;

    if (
        typeof title !== "string" ||
        title.trim().length === 0 ||
        title.trim().length > 50
    ) {
        return {
            success: false,
            message: "Title must be between 1 and 50 characters.",
        };
    }
    if (typeof description !== "string" || description.length > 1500) {
        return { success: false, message: "Description is too long." };
    }
    const files = formData.getAll("docs") as File[];
    const documentCount = files.length;
    if (!files || files.length === 0) {
        return { success: false, message: "Please upload at least one PDF." };
    }
    if (files.length > 3) {
        return { success: false, message: "Maximum 3 files allowed." };
    }

    for (const file of files) {
        const isPdf =
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            return {
                success: false,
                message: `File ${file.name} is not a PDF.`,
            };
        }
        const size = file.size || 0;
        if (size > 5 * 1024 * 1024) {
            return {
                success: false,
                message: `File ${file.name} exceeds 5 MB.`,
            };
        }
    }

    const uploadedFiles: {
        path: string;
        url: string;
        name: string;
        size: number;
        type: string;
    }[] = [];

    for (const file of files) {
        const safeName = sanitizeFileName(
            file.name || `file-${randomUUID()}.pdf`,
        );
        const key = `${dbUser.id}/${randomUUID()}-${safeName}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET as string)
            .upload(key, buffer, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return {
                success: false,
                message: `Failed to upload ${file.name}.`,
            };
        }

        const { data: publicData } = supabase.storage
            .from(SUPABASE_BUCKET as string)
            .getPublicUrl(key);
        const publicUrl = publicData?.publicUrl || "";

        uploadedFiles.push({
            path: key,
            url: publicUrl,
            name: file.name,
            size: file.size,
            type: file.type,
        });
    }

    try {
        const user = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
                projectsCount: { increment: 1 },
                documentsCount: { increment: documentCount },

                projects: {
                    create: {
                        title: title.trim(),
                        description,
                        projectCategory,
                        projectSettings: {
                            webSearch,
                        },
                        documentCount,
                        documents: {
                            create: uploadedFiles.map((f) => ({
                                fileUrl: f.url,
                                fileName: f.name,
                                fileType: f.type || "application/pdf",
                                pages: 0,
                                userId: dbUser.id,
                                projectName: title.trim(),
                            })),
                        },
                    },
                },
            },
            include: {
                projects: {
                    take: 1,
                    orderBy: { id: "desc" },
                },
            },
        });
        const project = user.projects[0];
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/projects");
        revalidatePath("/dashboard/documents");
        return { success: true, projectId: project.id };
    } catch (e) {
        console.error("Prisma create error:", e);
        // rollback uploaded files on failure
        for (const f of uploadedFiles) {
            try {
                await supabase.storage
                    .from(SUPABASE_BUCKET as string)
                    .remove([f.path]);
            } catch (err) {
                console.warn("Failed to cleanup file", f.path, err);
            }
        }

        return { success: false, message: "Failed to create project." };
    }
}

export default handleCreateProject;
