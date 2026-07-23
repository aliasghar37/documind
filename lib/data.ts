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

export type Chunk = {
  chunkId: string;
  content: string;
  summary: string;
  isTable: boolean;
  order: number;
  documentId: string;
  projectId: string;
  rrfScore: number;
  vectorRank: number;
  textRank: number;
  relevanceScore?: number;
};
