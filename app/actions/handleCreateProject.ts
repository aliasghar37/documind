"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { ProjectCategory } from "@/generated/prisma/enums";
import "dotenv/config";
import { documentIngestion } from "@/lib/documentIngestion";
import { Prisma } from "@/generated/prisma/client";
import type { IndexedBatch, DocumentMetadata } from "@/lib/documentIngestion";
import { TIER_LIMITS } from "@/lib/data";

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
  if (!SUPABASE_BUCKET)
	return { success: false, message: "Supabase bucket not found!" };
  const bucket = SUPABASE_BUCKET;
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
	select: { id: true, role: true, projectsCount: true },
  });

  if (!dbUser || !isValidObjectId(dbUser.id)) {
	return { success: false, message: "Invalid or missing user id." };
  }

  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
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
  if (files.length === 0) {
	return { success: false, message: "Please upload at least one PDF." };
  }
  if (files.length > 3) {
	return { success: false, message: "Maximum 3 files allowed." };
  }
  const documentCount = files.length;

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

  const role = dbUser.role ?? "FREE";
  const maxProjects = TIER_LIMITS[role].maxProjects;
  if (dbUser.projectsCount >= maxProjects) {
	return {
	  success: false,
	  message: `You've reached the maximum of ${maxProjects} projects on your current plan. Upgrade to PRO to create up to ${TIER_LIMITS.PRO.maxProjects} projects.`,
	};
  }

  const uploadedPaths: string[] = [];
  const uploadedFiles: {
	path: string;
	url: string;
	name: string;
	size: number;
	type: string;
  }[] = [];

  async function cleanupUploadedFiles() {
	for (const path of uploadedPaths) {
	  try {
		await supabase.storage.from(bucket).remove([path]);
	  } catch (err) {
		console.warn("Failed to cleanup file", path, err);
	  }
	}
  }

  let recommendationQuestions: Prisma.RecommendedQuestionCreateWithoutProjectInput[] =
	[];

  const ingestions: Array<{
	fileUrl: string;
	batches: IndexedBatch[];
	metadata: DocumentMetadata;
  }> = [];

  try {
	const results = await Promise.all(
	  files.map(async (file) => {
		const safeName = sanitizeFileName(
		  file.name || `file-${randomUUID()}.pdf`,
		);
		const key = `${dbUser.id}/${randomUUID()}-${safeName}`;
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { error: uploadError } = await supabase.storage
		  .from(bucket)
		  .upload(key, buffer, {
			contentType: "application/pdf",
			upsert: false,
			metadata: {
			  userId: dbUser.id,
			  originalName: file.name,
			  uploadedAt: new Date().toISOString(),
			},
		  });

		if (uploadError) {
		  console.error("Supabase upload error:", uploadError);
		  throw new Error(`Failed to upload ${file.name}.`);
		}

		uploadedPaths.push(key);

		const { data: publicData } = supabase.storage
		  .from(bucket)
		  .getPublicUrl(key);
		const publicUrl = publicData?.publicUrl || "";

		const resp = await documentIngestion(file);
		if (!resp || !resp.success) {
		  throw new Error(`Failed process the document ${file.name}`);
		}

		return {
		  uploadedFile: {
			path: key,
			url: publicUrl,
			name: file.name,
			size: file.size,
			type: file.type,
		  },
		  ingestion: resp.batches
			? {
				fileUrl: publicUrl,
				batches: resp.batches,
				metadata: resp.metadata,
			  }
			: null,
		  recommendationQns: (resp.recommendationQns || []).map((qn) => ({
			questionText: qn,
			createdAt: new Date(),
			document: {
			  connect: {
				fileUrl: publicUrl,
			  },
			},
		  })),
		};
	  }),
	);

	for (const result of results) {
	  uploadedFiles.push(result.uploadedFile);
	  if (result.ingestion) {
		ingestions.push(result.ingestion);
	  }
	  recommendationQuestions.push(...result.recommendationQns);
	}
  } catch (error) {
	await cleanupUploadedFiles();
	return {
	  success: false,
	  message:
		error instanceof Error ? error.message : "Failed to process files.",
	};
  }

  try {
	const project = await prisma.$transaction(
	  async (tx) => {
		const user = await tx.user.update({
		  where: { id: dbUser.id },
		  data: {
			projectsCount: { increment: 1 },
			documentsCount: { increment: documentCount },

			projects: {
			  create: {
				title: title.trim(),
				description,
				recommendationQns: { create: recommendationQuestions },
				projectCategory,
				documentCount,
				documents: {
				  create: uploadedFiles.map((f) => ({
					fileUrl: f.url,
					fileName: f.name,
					fileType: f.type || "application/pdf",
					pages:
					  ingestions.find((ing) => ing.fileUrl === f.url)?.metadata
						.pageCount || 0,
					metadata: (ingestions.find((ing) => ing.fileUrl === f.url)
					  ?.metadata ||
					  null) as unknown as Prisma.InputJsonValue | null,
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
			  orderBy: { createdAt: "desc" },
			  include: { documents: true },
			},
		  },
		});
		const project = user.projects[0];
		const documentByUrl = new Map(
		  project.documents.map((doc) => [doc.fileUrl, doc]),
		);

		await tx.documentChunk.createMany({
		  data: ingestions.flatMap(({ fileUrl, batches }) => {
			const document = documentByUrl.get(fileUrl);
			if (!document) return [];

			return batches.map((batch, index) => ({
			  order: index,
			  content: batch.content,
			  summary: batch.summary ?? null,
			  isTable: batch.isTable,
			  embedding: batch.embedding,
			  documentId: document.id,
			  projectId: project.id,
			  fileName: document.fileName,
			  pageNumber: batch.pageNumber ?? null,
			}));
		  }),
		});

		return project;
	  },
	  { timeout: 30000 },
	);

	revalidatePath("/dashboard");
	revalidatePath("/dashboard/projects");
	revalidatePath("/dashboard/documents");
	return { success: true, projectId: project.id };
  } catch (e) {
	console.error("Prisma create error:", e);
	await cleanupUploadedFiles();
	return { success: false, message: "Failed to create project." };
  }
}

export default handleCreateProject;
