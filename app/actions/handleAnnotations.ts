"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function handleSaveAnnotations(
  documentId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotations: any[],
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { success: false, message: "Unauthenticated" };

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser) return { success: false, message: "User not found" };

  const doc = await prisma.document.findFirst({
	where: { id: documentId, userId: dbUser.id },
	select: { id: true },
  });
  if (!doc) return { success: false, message: "Document not found" };

  await prisma.document.update({
	where: { id: documentId },
	data: { annotationData: annotations },
  });

  return { success: true, message: "annotations saved successfully" };
}

export async function handleGetAnnotations(documentId: string) {
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

  return doc.annotationData as any[];
}
