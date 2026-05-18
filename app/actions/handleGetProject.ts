"use server";

import type { ProjectWithDocuments } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type GetProjectError = { success: false; message: string };
export type HandleGetProjectResult = ProjectWithDocuments | GetProjectError;

function isValidObjectId(id: string) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function handleGetProject(
    projectId: string,
): Promise<HandleGetProjectResult> {
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
    return project;
}
