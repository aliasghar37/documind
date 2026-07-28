import { toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { managerAgent } from "@/lib/rag/managerAgent";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { fetchMessages, saveMessage } from "@/lib/chatUtils";
import { checkAndUpsertUsage, getUsage, addUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function extractText(message: any): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.parts)) {
	return message.parts
	  .filter((p: any) => p?.type === "text" && typeof p.text === "string")
	  .map((p: any) => p.text)
	  .join("");
  }
  return "";
}

class TokenTracker extends BaseCallbackHandler {
  name = "token_tracker";
  input = 0;
  output = 0;

  handleLLMEnd(output: { llmOutput?: { tokenUsage?: { promptTokens?: number; completionTokens?: number } } }) {
	const usage = output.llmOutput?.tokenUsage;
	if (usage) {
	  this.input += usage.promptTokens ?? 0;
	  this.output += usage.completionTokens ?? 0;
	}
  }
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

  const usage = await checkAndUpsertUsage(dbUser.id);
  if (!usage || usage.totalTokens >= usage.limit) {
	const resetDate = (await getUsage(dbUser.id))?.periodEnd;
	return Response.json(
	  {
		error: "limit_reached",
		resetAt: resetDate?.toISOString() ?? null,
	  },
	  { status: 429 },
	);
  }

  const project = await prisma.project.findFirst({
	where: { id: projectId, userId: dbUser.id },
	select: { id: true, projectCategory: true },
  });
  if (!project) {
	return new Response("Project not found or access denied", { status: 404 });
  }

  const CATEGORY_DISPLAY: Record<string, string> = {
	GENERAL_PURPOSE: "General Purpose",
	ACADEMIC_AND_EDUCATION: "Academic & Education",
	PROFESSIONAL_AND_OFFICE: "Professional & Office",
	MEDICAL_AND_HEALTH: "Medical & Healthcare",
  };
  const categoryLabel = CATEGORY_DISPLAY[project.projectCategory] ?? "General Purpose";

  const lastClientMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const userText = lastClientMessage ? extractText(lastClientMessage) : "";
  if (!userText.trim()) {
	return new Response("Empty message", { status: 400 });
  }

  await saveMessage(dbUser.id, projectId, "USER", userText);

  const dbContext = await fetchMessages(dbUser.id, projectId);

  const langchainMessages: BaseMessage[] = [];
  for (const msg of dbContext) {
	if (!msg.content.trim()) continue;
	if (msg.role === "system") {
	  langchainMessages.push(new SystemMessage(msg.content));
	} else if (msg.role === "user") {
	  langchainMessages.push(new HumanMessage(msg.content));
	} else {
	  langchainMessages.push(new AIMessage(msg.content));
	}
  }

  langchainMessages.push(
	new SystemMessage(
	  `Context: Project ID "${projectId}", Category: "${categoryLabel}". ` +
		`When calling researcherAgent, always pass this projectId. ` +
		`When calling generatorAgent, always pass the Category as the "category" parameter. ` +
		`The user's question is in the last HumanMessage above.`,
	),
  );

  const tracker = new TokenTracker();

  const graphStream = await managerAgent.stream(
	{ messages: langchainMessages },
	{ streamMode: ["messages", "values"], callbacks: [tracker] },
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
		  await saveMessage(
			dbUser.id,
			projectId,
			"AI",
			state.structuredResponse.answer,
			state.structuredResponse.references,
		  );

		  const input = tracker.input;
		  const output = tracker.output;
		  if (input > 0 || output > 0) {
			await addUsage(dbUser.id, input, output);
		  }

		  const text = JSON.stringify(state.structuredResponse);
		  writer.write({ type: "text-start", id: "structured-answer" });
		  writer.write({ type: "text-delta", delta: text, id: "structured-answer" });
		  writer.write({ type: "text-end", id: "structured-answer" });
		}
	  },
	});

  return createUIMessageStreamResponse({ stream });
}
