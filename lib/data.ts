import type { Prisma } from "@/generated/prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

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

export const model = new ChatOpenAI({
  modelName: "qwen/qwen3.6-27b",
  maxRetries: 5,
  timeout: 100_000,
  apiKey: process.env.GROQ_API_KEY,
  configuration: { baseURL: "https://api.groq.com/openai/v1" },
  temperature: 0,
  modelKwargs: { reasoning_effort: "none" },
});
