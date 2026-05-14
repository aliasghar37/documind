"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { ProjectCategory } from "@/generated/prisma/enums";

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

export type HandleUpdateProjectResult = {
    success: boolean;
    projectId?: string;
    message?: string;
};

export async function handleUpdateProject(
    formData: FormData,
    projectId: string,
): Promise<HandleUpdateProjectResult> {
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

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: dbUser.id },
        include: {
            documents: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
    if (!project) return { success: false, message: "Project not found" };

    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const webSearchRaw = (formData.get("webSearch") as string) || "true";
    const webSearch = webSearchRaw === "true";
    const projectCategoryRaw =
        (formData.get("projectCategory") as string) || "General Purpose";

    console.log("projectCategoryRaw:", projectCategoryRaw);
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
    if (typeof description !== "string" || description.length > 1500)
        return { success: false, message: "Description is too long." };

    const files = formData.getAll("docs") as File[];
    const existingDocumentCount = project.documents.length;
    if ((!files || files.length === 0) && existingDocumentCount === 0)
        return { success: false, message: "Please upload at least one PDF." };
    if (files.length > 3)
        return { success: false, message: "Maximum 3 files allowed." };
    const remainingSlots = 3 - existingDocumentCount;
    if (files.length > remainingSlots)
        return {
            success: false,
            message:
                remainingSlots === 0
                    ? "You can't add more than 3 documents"
                    : `You can only add ${remainingSlots} more document`,
        };

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

    console.log(title, description, webSearch, projectCategory);

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
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                title: title.trim(),
                description,
                projectCategory,
                projectSettings: {
                    ...(typeof project.projectSettings === "object" &&
                    project.projectSettings
                        ? project.projectSettings
                        : {}),
                    webSearch,
                },
                documents: {
                    create: uploadedFiles.map((f) => ({
                        fileUrl: f.url,
                        fileName: f.name,
                        fileType: f.type || "application/pdf",
                        pages: 0,
                        userId: dbUser.id,
                    })),
                },
            },
        });

        return { success: true, projectId: updatedProject.id };
    } catch (e) {
        console.error("Prisma update error:", e);
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

        return { success: false, message: "Failed to update project." };
    }
}

function getStoragePathFromUrl(fileUrl: string) {
    try {
        const url = new URL(fileUrl);
        return decodeURIComponent(url.pathname.split("/").slice(-2).join("/"));
    } catch {
        return "";
    }
}

export async function handleDeleteProject(projectId: string) {
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

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: dbUser.id },
        include: {
            documents: true,
        },
    });
    if (!project) return { success: false, message: "Project not found." };

    const paths = project.documents
        .map((doc) => getStoragePathFromUrl(doc.fileUrl))
        .filter(Boolean);

    if (paths.length > 0) {
        const { error } = await supabase.storage
            .from(SUPABASE_BUCKET as string)
            .remove(paths);

        if (error) {
            return { success: false, message: "Could not delete files." };
        }
    }
    await prisma.project.delete({
        where: {
            id: project.id,
        },
    });
    return { success: true, message: "Project has been deleted successfully" };
}
