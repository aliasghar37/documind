"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function isValidObjectId(id: string) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

function getStoragePathFromUrl(fileUrl: string) {
    try {
        const url = new URL(fileUrl);
        return decodeURIComponent(url.pathname.split("/").slice(-2).join("/"));
    } catch {
        return "";
    }
}

export async function handleDeleteDocument(documentId: string) {
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
        return { success: false, message: "Invalid user." };
    }
    const document = await prisma.document.findFirst({
        where: { id: documentId, userId: dbUser.id },
    });
    if (!document) {
        return { success: false, message: "Document not found." };
    }

    const path = getStoragePathFromUrl(document.fileUrl);
    if (path) {
        await supabase.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .remove([path]);
    }
    await prisma.document.delete({
        where: { id: documentId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/documents");
    return { success: true, message: "Document has been deleted permanently" };
}
