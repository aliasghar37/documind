import { prisma } from "./prisma";
import { MessageRole } from "@/generated/prisma/enums";

const LAST_N_MESSAGES = 10;
const SUMMARIZE_EVERY = 10;

export async function saveMessage(
  userId: string,
  projectId: string,
  role: "USER" | "AI",
  content: string,
  citations?: any,
) {
  const lastMessage = await prisma.message.findFirst({
	where: { projectId },
	orderBy: { messageNumber: "desc" },
	select: { messageNumber: true },
  });

  const messageNumber = (lastMessage?.messageNumber ?? 0) + 1;

  const message = await prisma.message.create({
	data: {
	  role: role as MessageRole,
	  content,
	  citations: citations ?? undefined,
	  messageNumber,
	  projectId,
	  userId,
	},
  });

  if (messageNumber % SUMMARIZE_EVERY === 0) {
	await updateSummary(userId, projectId, messageNumber);
  }

  return message;
}

export async function fetchMessages(userId: string, projectId: string) {
  const summary = await prisma.conversationSummary.findUnique({
	where: { userId_projectId: { userId, projectId } },
	select: { summary: true, lastMessageNumber: true },
  });

  const rawMessages = await prisma.message.findMany({
	where: { projectId, userId },
	orderBy: { createdAt: "desc" },
	take: LAST_N_MESSAGES,
	select: {
	  role: true,
	  content: true,
	  citations: true,
	  messageNumber: true,
	},
  });

  rawMessages.reverse();

  const context: Array<{
	role: "system" | "user" | "assistant";
	content: string;
  }> = [];

  if (summary) {
	context.push({
	  role: "system",
	  content: `Previous conversation summary:\n${summary.summary}`,
	});
  }

  for (const msg of rawMessages) {
	context.push({
	  role: msg.role === "USER" ? "user" : "assistant",
	  content: msg.content,
	});
  }

  return context;
}

export async function updateSummary(
  userId: string,
  projectId: string,
  currentMessageNumber: number,
) {
  const summaryRecord = await prisma.conversationSummary.findUnique({
	where: { userId_projectId: { userId, projectId } },
	select: { summary: true, lastMessageNumber: true },
  });

  const fromNumber = (summaryRecord?.lastMessageNumber ?? 0) + 1;

  const messagesToSummarize = await prisma.message.findMany({
	where: {
	  projectId,
	  userId,
	  messageNumber: { gte: fromNumber, lte: currentMessageNumber },
	},
	orderBy: { createdAt: "asc" },
	select: { role: true, content: true },
  });

  if (messagesToSummarize.length === 0) return;

  const transcript = messagesToSummarize
	.map((m) => `${m.role === "USER" ? "Human" : "Assistant"}: ${m.content}`)
	.join("\n\n");

  const existingSummary = summaryRecord?.summary ?? "";

  const combinedInput = existingSummary
	? `${existingSummary}\n\nNew messages:\n${transcript}`
	: transcript;

  const { createModel } = await import("./rag/llm");
  const llm = createModel(0.3, "openai/gpt-oss-120b");

  const response = await llm.invoke([
	{
	  role: "system",
	  content:
		"You are a conversation summarizer. Compress the following conversation into a concise summary that captures key topics, decisions, and context. Keep it under 300 words. Output ONLY the summary text, nothing else.",
	},
	{
	  role: "user",
	  content: combinedInput,
	},
  ]);

  const newSummary =
	typeof response.content === "string"
	  ? response.content
	  : Array.isArray(response.content)
		? response.content
			.filter((c: any) => c.type === "text")
			.map((c: any) => c.text)
			.join("")
		: "";

  await prisma.conversationSummary.upsert({
	where: { userId_projectId: { userId, projectId } },
	update: {
	  summary: newSummary,
	  lastMessageNumber: currentMessageNumber,
	},
	create: {
	  summary: newSummary,
	  lastMessageNumber: currentMessageNumber,
	  userId,
	  projectId,
	},
  });
}
