import type { Prisma } from "@/generated/prisma/client";

export const projectCategories = [
    "General Purpose",
    "Academic & Education",
    "Professional & Office",
    "Medical & Healthcare",
] as const;

export type ProjectCategoryType = (typeof projectCategories)[number];

export type ProjectWithDocuments = Prisma.ProjectGetPayload<{
    include: { documents: true };
}>;
