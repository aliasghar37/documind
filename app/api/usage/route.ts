import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/usage";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
	return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser) {
	return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const usage = await getUsage(dbUser.id);

  return NextResponse.json(usage);
}
