"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

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

export async function handleDeleteProject(projectId: string) {
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
	return { success: false, message: "Invalid or missing user id." };
  }

  const project = await prisma.project.findFirst({
	where: { id: projectId, userId: dbUser.id },
	include: {
	  documents: true,
	},
  });
  if (!project) return { success: false, message: "Project not found." };

  const paths = project.documents
	.map((doc) => getStoragePathFromUrl(doc.fileUrl))
	.filter(Boolean);

  if (paths.length > 0) {
	const { error } = await supabase.storage
	  .from(SUPABASE_BUCKET as string)
	  .remove(paths);

	if (error) {
	  return { success: false, message: "Could not delete files." };
	}
  }
  await prisma.project.delete({
	where: {
	  id: project.id,
	},
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/documents");
  return { success: true, message: "Project has been deleted successfully" };
}
