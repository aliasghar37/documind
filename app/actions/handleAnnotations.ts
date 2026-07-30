"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { AnnotationType } from "@/generated/prisma/enums";

function mapAnnotationType(type: unknown): AnnotationType {
  if (typeof type !== "string" || !type) return "COMMENT" as AnnotationType;
  switch (type.toUpperCase()) {
	case "HIGHLIGHT":
	  return "HIGHLIGHT" as AnnotationType;
	case "NOTE":
	case "STICKY_NOTE":
	case "TEXT":
	  return "NOTE" as AnnotationType;
	case "SHAPE":
	case "RECTANGLE":
	case "CIRCLE":
	case "ARROW":
	case "LINE":
	case "FREEHAND":
	  return "SHAPE" as AnnotationType;
	default:
	  return "COMMENT" as AnnotationType;
  }
}

export async function handleSaveAnnotations(
  documentId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotations: any[],
) {
  try {
	const { userId: clerkUserId } = await auth();
	if (!clerkUserId) return { success: false, message: "Unauthenticated" };

	const dbUser = await prisma.user.findUnique({
	  where: { clerkUserId },
	  select: { id: true },
	});
	if (!dbUser) return { success: false, message: "User not found" };

	const doc = await prisma.document.findFirst({
	  where: { id: documentId, userId: dbUser.id },
	  select: { id: true, projectId: true },
	});
	if (!doc) return { success: false, message: "Document not found" };

	// Save to annotationData (reliable path — worked before)
	await prisma.document.update({
	  where: { id: documentId },
	  data: { annotationData: annotations },
	});

	// Also save to Annotation model (for dashboard queries)
	const firstItem = annotations[0];
	const a = firstItem?.annotation ?? firstItem;
	if (a?.type || a?.contents || a?.pageIndex != null) {
	  await prisma.annotation.deleteMany({ where: { documentId } });
	  await prisma.annotation.create({
		data: {
		  type: mapAnnotationType(a?.type),
		  pageNumber: a?.pageIndex ?? 0,
		  note: a?.contents ?? null,
		  color: a?.color ?? null,
		  payload: annotations,
		  projectId: doc.projectId,
		  documentId: doc.id,
		  userId: dbUser.id,
		},
	  });
	}

	return { success: true, message: `${annotations.length} annotations saved` };
  } catch (err) {
	console.error("handleSaveAnnotations error:", err);
	return { success: false, message: String(err) };
  }
}

export async function handleGetAnnotations(documentId: string) {
  try {
	const { userId: clerkUserId } = await auth();
	if (!clerkUserId) return [];

	const dbUser = await prisma.user.findUnique({
	  where: { clerkUserId },
	  select: { id: true },
	});
	if (!dbUser) return [];

	const doc = await prisma.document.findFirst({
	  where: { id: documentId, userId: dbUser.id },
	  select: { annotationData: true },
	});

	if (!doc?.annotationData) return [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return doc.annotationData as any[];
  } catch (err) {
	console.error("handleGetAnnotations error:", err);
	return [];
  }
}

export type UserAnnotation = {
  id: string;
  documentId: string;
  documentName: string;
  projectTitle: string;
  pageNumber: number;
  text: string;
  author: string;
  createdAt: string;
  isReply: boolean;
};

export async function handleGetUserAnnotations(): Promise<UserAnnotation[]> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser) return [];

  const docs = await prisma.document.findMany({
	where: { userId: dbUser.id, annotationData: { not: null } },
	select: {
	  id: true,
	  fileName: true,
	  projectName: true,
	  annotationData: true,
	},
  });

  const result: UserAnnotation[] = [];

  for (const doc of docs) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const items = doc.annotationData as any[];
	if (!items?.length) continue;

	for (const item of items) {
	  const a = item?.annotation ?? item;
	  const text = a?.contents?.trim();
	  if (!text) continue;

	  result.push({
		id: a.id ?? `${doc.id}-${result.length}`,
		documentId: doc.id,
		documentName: doc.fileName,
		projectTitle: doc.projectName,
		pageNumber: (a.pageIndex ?? 0) + 1,
		text,
		author: a.author ?? "Unknown",
		createdAt: a.created ?? a.modified ?? new Date().toISOString(),
		isReply: !!a.inReplyToId,
	  });
	}
  }

  return result.sort(
	(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
