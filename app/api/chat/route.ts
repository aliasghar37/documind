import { toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse } from "ai";
import { managerAgent } from "@/lib/rag/managerAgent";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function parseAgentResponse(raw: string): {
  answer: string;
  references: any[];
} {
  try {
	const parsed = JSON.parse(raw);
	if (parsed.answer && Array.isArray(parsed.references)) {
	  return { answer: parsed.answer, references: parsed.references };
	}
  } catch {}
  return { answer: raw, references: [] };
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
	return new Response("Unauthorized", { status: 401 });
  }

  const { messages, projectId } = await req.json();

  if (!projectId || !isValidObjectId(projectId)) {
	return new Response("Invalid projectId", { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });
  if (!dbUser) {
	return new Response("User not found", { status: 401 });
  }

  const project = await prisma.project.findFirst({
	where: { id: projectId, userId: dbUser.id },
	select: { id: true },
  });
  if (!project) {
	return new Response("Project not found or access denied", { status: 404 });
  }

  const langchainMessages: BaseMessage[] = (messages as { role: string; content: string }[]).map(
	(m) =>
	  m.role === "user"
		? new HumanMessage(m.content)
		: new AIMessage(m.content),
  );

  langchainMessages.push(
	new SystemMessage(
	  `Context: Project ID "${projectId}". ` +
		`When calling researcherAgent, always pass this projectId. ` +
		`The user's question is in the last message.`,
	),
  );

  const stream = managerAgent.streamEvents(
	{ messages: langchainMessages },
	{ version: "v2" },
  );

  return createUIMessageStreamResponse({
	stream: toUIMessageStream(stream),
  });
}
