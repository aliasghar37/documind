import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
	return NextResponse.json(
	  { success: true, message: "Unauthenticated" },
	  { status: 401 },
	);
  }

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true, role: true },
  });
  if (!dbUser) {
	return NextResponse.json(
	  { success: true, message: "User not found" },
	  { status: 401 },
	);
  }

  if (dbUser.role === "PRO") {
	return NextResponse.json({ success: false, message: "Already Pro" });
  }

  await prisma.user.update({
	where: { id: dbUser.id },
	data: { role: "PRO" },
  });

  return NextResponse.json({
	success: true,
	message: "Account upgraded successfully",
  });
}
