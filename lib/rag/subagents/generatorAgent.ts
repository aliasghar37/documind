import { z } from "zod";
import { createAgent, tool } from "langchain";
import { createModel } from "../llm";
import { tracker } from "../tokenTracker";

const systemPrompt = `You are GeneratorAgent in a multi-agent Question Answering system.
Your role is to generate the final, user-facing answer from validated document chunks.

>>> INPUT YOU RECEIVE:
1. The original user question.
2. An array of validated document chunks (already graded and filtered for relevance).
3. Each chunk may have metadata with source information (documentId, title, url).

>>> YOUR TASK:
Generate a clear, concise, and accurate answer using ONLY the information present in the provided chunks.

>>> RULES:
- Answer based ONLY on the provided chunks. Do not use external knowledge.
- If the chunks contain the answer, provide it directly and concisely.
- If the chunks are partially relevant, answer what you can and note what is missing.
- Do not fabricate or speculate. If information is missing, say so.
- Do not mention chunk IDs, scores, or internal system details.
- Do not repeat the question. Just provide the answer.
- Do NOT include source URLs, file names, or reference markers in the answer text itself. Just answer cleanly.
- Use a professional, helpful tone.`;

const responseFormat = z.object({
  answer: z.string().describe("The final answer to the user's question, without any inline references or URLs"),
  references: z.array(z.object({
	title: z.string().describe("Source title or document name"),
	url: z.string().optional().describe("URL if available (web search results)"),
	documentId: z.string().optional().describe("Document ID if from uploaded documents"),
  })).describe("List of source references used to generate the answer"),
});

const model = createModel(0.3);

const agent = createAgent({
  name: "generatorAgent",
  model,
  systemPrompt,
  responseFormat,
});

export async function generateFromChunks(
  chunks: { content: string; score?: number; metadata?: Record<string, any> }[],
  query: string,
): Promise<string> {
  const context = chunks
	.map((c, i) => `[${i + 1}] ${c.content}`)
	.join("\n\n");

  const result = await agent.invoke({
	messages: [
	  {
		role: "user",
		content: `Question: ${query}\n\nValidated Context:\n${context}`,
	  },
	],
  });
  tracker.track("generatorAgent", result.messages);

  const answer = result.structuredResponse?.answer ?? "I was unable to generate an answer. Please try again.";
  const references = chunks
	.filter((c) => c.metadata)
	.map((c) => ({
	  title: c.metadata!.title ?? c.metadata!.documentId ?? "Unknown",
	  url: c.metadata!.url,
	  documentId: c.metadata!.documentId,
	}));

  return JSON.stringify({ answer, references });
}

export const generatorAgent = tool(
  async ({
	chunks,
	query,
  }: {
	chunks: { content: string; score?: number; metadata?: Record<string, any> }[];
	query: string;
  }) => {
	return generateFromChunks(chunks, query);
  },
  {
	name: "generatorAgent",
	description:
	  "Generates the final answer from validated document chunks and the user's question.",
	schema: z.object({
	  chunks: z
		.array(
		  z.object({
			content: z.string(),
			score: z.number().optional(),
			metadata: z.record(z.any(), z.any()).optional(),
		  }),
		)
		.describe("Validated chunks to generate answer from"),
	  query: z.string().describe("Original user question"),
	}),
  },
);
