"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export type ProjectMessage = {
  id: string;
  role: "USER" | "AI";
  content: string;
  citations: unknown;
  createdAt: string;
};

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function handleGetProjectMessages(
  projectId: string,
): Promise<ProjectMessage[]> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser || !isValidObjectId(dbUser.id)) return [];

  const messages = await prisma.message.findMany({
	where: { projectId, userId: dbUser.id },
	orderBy: { messageNumber: "asc" },
	select: {
	  id: true,
	  role: true,
	  content: true,
	  citations: true,
	  createdAt: true,
	},
  });

  return messages.map((m) => ({
	id: m.id,
	role: m.role,
	content: m.content,
	citations: m.citations,
	createdAt: m.createdAt.toISOString(),
  }));
}
