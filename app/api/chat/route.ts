import { toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { managerAgent } from "@/lib/rag/managerAgent";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
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

  let dbUser = await prisma.user.findUnique({
	where: { clerkUserId },
	select: { id: true },
  });

  if (!dbUser) {
	try {
	  const clerk = await clerkClient();
	  const clerkUser = await clerk.users.getUser(clerkUserId);
	  const primaryEmail = clerkUser.emailAddresses?.find(
		(e) => e.id === clerkUser.primaryEmailAddressId,
	  );
	  dbUser = await prisma.user.create({
		data: {
		  clerkUserId,
		  email: primaryEmail?.emailAddress ?? `${clerkUserId}@placeholder.dev`,
		  firstName: clerkUser.firstName ?? "",
		  lastName: clerkUser.lastName ?? "",
		  imageUrl: clerkUser.imageUrl ?? "",
		  role: "FREE",
		},
		select: { id: true },
	  });
	} catch (createErr) {
	  console.error("[chat] Failed to auto-create user:", createErr);
	  return new Response("User not found", { status: 401 });
	}
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

  const MAX_RETRIES = 2;

  const stream = createUIMessageStream({
	execute: async ({ writer }) => {
	  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const lastValuesResolvers: { resolve: ((data: any) => void) | null; reject: ((error: any) => void) | null } = { resolve: null, reject: null };
		const lastValuesPromise = new Promise<any>((resolve, reject) => {
		  lastValuesResolvers.resolve = resolve;
		  lastValuesResolvers.reject = reject;
		});

		const graphStream = await managerAgent.stream(
		  { messages: langchainMessages },
		  { streamMode: ["messages", "values"], callbacks: [tracker] },
		);

		const wrappedStream = (async function* () {
		  for await (const chunk of graphStream) {
			yield chunk;
		  }
		})();

		const innerStream = toUIMessageStream(wrappedStream as any, {
		  onFinish: (data) => lastValuesResolvers.resolve?.(data),
		  onError: (error) => {
			console.error("[chat/route] stream error:", error);
			lastValuesResolvers.reject?.(error);
		  },
		});

		const reader = innerStream.getReader();
		let streamFailed = false;
		try {
		  while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			writer.write(value);
		  }
		} catch (e) {
		  console.error(`[chat/route] Stream error (attempt ${attempt + 1}):`, e);
		  lastValuesResolvers.reject?.(e);
		  streamFailed = true;
		}

		if (streamFailed && attempt < MAX_RETRIES - 1) {
		  console.log(`[chat/route] Retrying... (attempt ${attempt + 2})`);
		  continue;
		}

		let lastValuesData: any = null;
		try {
		  const timeoutPromise = new Promise<any>((resolve) => setTimeout(() => resolve(null), 5000));
		  lastValuesData = await Promise.race([lastValuesPromise, timeoutPromise]);
		} catch {
		  lastValuesData = null;
		}

		let answerContent = "";
		if (lastValuesData?.messages && Array.isArray(lastValuesData.messages)) {
		  for (let i = lastValuesData.messages.length - 1; i >= 0; i--) {
			const msg = lastValuesData.messages[i];
			const type = msg._getType?.() ?? msg.type;
			if (type === "ai" || type === "AIMessageChunk" || type === "AIMessage") {
			  answerContent = typeof msg.content === "string" ? msg.content : "";
			  break;
			}
		  }
		}

		let parsedAnswer = answerContent;
		let parsedReferences: any[] = [];
		try {
		  const trimmed = answerContent.trim();
		  const jsonStart = trimmed.indexOf("{");
		  const jsonEnd = trimmed.lastIndexOf("}");
		  if (jsonStart !== -1 && jsonEnd > jsonStart) {
			const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
			if (typeof parsed.answer === "string") {
			  parsedAnswer = parsed.answer;
			  parsedReferences = Array.isArray(parsed.references) ? parsed.references : [];
			}
		  }
		} catch {}

		if (lastValuesData?.messages) {
		  let researcherChunks: any[] | null = null;

		  for (const msg of lastValuesData.messages) {
			if (msg._getType?.() !== "tool" || typeof msg.content !== "string") continue;
			try {
			  const toolResult = JSON.parse(msg.content);

			  // Check if this is generatorAgent or webSearchTool result
			  if (toolResult?.references || toolResult?.answer) {
				if (
				  Array.isArray(toolResult.references) &&
				  toolResult.references.length > 0
				) {
				  parsedReferences = toolResult.references;
				  if (typeof toolResult.answer === "string" && toolResult.answer) {
					parsedAnswer = toolResult.answer;
				  }
				  break;
				}
				if (typeof toolResult.answer === "string" && toolResult.answer) {
				  parsedAnswer = toolResult.answer;
				}
			  }

			  if (Array.isArray(toolResult) && toolResult.length > 0 && toolResult[0]?.content) {
				researcherChunks = toolResult;
			  }
			} catch {}
		  }

		  if (parsedReferences.length === 0 && researcherChunks?.length) {
			const seen = new Set<string>();
			parsedReferences = researcherChunks
			  .map((c) => ({
				title:
				  c.metadata?.fileName ||
				  c.metadata?.title ||
				  c.metadata?.documentId ||
				  "Unknown",
				url: c.metadata?.url,
				documentId: c.metadata?.documentId,
				pageNumber: c.metadata?.pageNumber ?? null,
			  }))
			  .filter((r) => {
				const key = `${r.title}|${r.pageNumber ?? ""}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return r.title !== "Unknown" || r.documentId != null;
			  });
		  }

		  if (!parsedAnswer && researcherChunks) {
			try {
			  const { generateFromChunks } = await import("@/lib/rag/subagents/generatorAgent");
			  const generated = await generateFromChunks(researcherChunks, userText, categoryLabel);
			  const parsed = JSON.parse(generated);
			  if (typeof parsed.answer === "string" && parsed.answer) {
				parsedAnswer = parsed.answer;
			  }
			  if (Array.isArray(parsed.references)) {
				parsedReferences = parsed.references;
			  }
			} catch (e) {
			  console.error("[chat/route] Direct generateFromChunks failed:", e);
			}
		  }
		}

		if (parsedAnswer) {
		  await saveMessage(
			dbUser.id,
			projectId,
			"AI",
			JSON.stringify({
			  answer: parsedAnswer,
			  references: parsedReferences ?? [],
			}),
		  );
		}

		const input = tracker.input;
		const output = tracker.output;
		if (input > 0 || output > 0) {
		  await addUsage(dbUser.id, input, output);
		}

		break;
	  }
	},
  });

  return createUIMessageStreamResponse({ stream });
}
