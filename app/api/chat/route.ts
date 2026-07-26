import { toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { managerAgent } from "@/lib/rag/managerAgent";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
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

  const langchainMessages: BaseMessage[] = [];
  if (Array.isArray(messages)) {
	for (const m of messages as any[]) {
	  const text =
		typeof m.content === "string"
		  ? m.content
		  : Array.isArray(m.parts)
			? m.parts
				.filter((p: any) => p?.type === "text" && typeof p.text === "string")
				.map((p: any) => p.text)
				.join("")
			: "";
	  if (!text.trim()) continue;
	  langchainMessages.push(
		m.role === "user" ? new HumanMessage(text) : new AIMessage(text),
	  );
	}
  }

  langchainMessages.push(
	new SystemMessage(
	  `Context: Project ID "${projectId}". ` +
		`When calling researcherAgent, always pass this projectId. ` +
		`The user's question is in the last message.`,
	),
  );

  const graphStream = await managerAgent.stream(
	{ messages: langchainMessages },
	{ streamMode: ["messages", "values"] },
  );

  const stream = createUIMessageStream({
	execute: async ({ writer }) => {
	  const state: { structuredResponse?: { answer: string; references: any[] } } = {};

	  const innerStream = toUIMessageStream<{
		structuredResponse?: { answer: string; references: any[] };
	  }>(graphStream, {
		onFinish: async (finalState) => {
		  if (finalState?.structuredResponse) {
			state.structuredResponse = finalState.structuredResponse;
		  }
		},
	  });

	  const reader = innerStream.getReader();
	  while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		writer.write(value);
	  }

	  if (state.structuredResponse) {
		const text = JSON.stringify(state.structuredResponse);
		writer.write({ type: "text-start", id: "structured-answer" });
		writer.write({ type: "text-delta", delta: text, id: "structured-answer" });
		writer.write({ type: "text-end", id: "structured-answer" });
	  }
	},
  });

  return createUIMessageStreamResponse({ stream });
}
