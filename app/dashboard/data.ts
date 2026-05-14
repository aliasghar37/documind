import "server-only";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Project, Document } from "./page";

type DashboardDataResult =
    | {
          success: true;
          projects: Project[];
          documents: Document[];
          documentsCount: number;
          projectsCount: number;
      }
    | {
          success: false;
          reason: "unauthenticated" | "missing-user" | "error";
      };

export async function getDashboardData(): Promise<DashboardDataResult> {
    const { userId } = await auth();
    if (!userId) return { success: false, reason: "unauthenticated" };

    try {
        const dbUser = await prisma.user.findUnique({
            where: { clerkUserId: userId },
            select: { id: true, documentsCount: true, projectsCount: true },
        });
        if (!dbUser) return { success: false, reason: "missing-user" };
        const [projects, documents] = await Promise.all([
            prisma.project.findMany({ where: { userId: dbUser.id } }),
            prisma.document.findMany({ where: { userId: dbUser.id } }),
        ]);
        return {
            success: true,
            projects: projects as Project[],
            documents: documents as Document[],
            documentsCount: dbUser.documentsCount,
            projectsCount: dbUser.projectsCount,
        };
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        return { success: false, reason: "error" };
    }
}
