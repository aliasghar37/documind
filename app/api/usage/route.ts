import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/usage";
import { success } from "zod";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
	return NextResponse.json(
	  { success: false, message: "Unauthenticated" },
	  { status: 401 },
	);
  }

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser) {
	return NextResponse.json(
	  { success: false, message: "User not found" },
	  { status: 401 },
	);
  }

  const usage = await getUsage(dbUser.id);

  return NextResponse.json({ success: true, data: usage });
}
