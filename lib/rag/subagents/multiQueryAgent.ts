import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { createAgent } from "langchain";
import { createModel } from "./../llm";

const responseFormat = z.object({
  queries: z
	.array(z.string())
	.length(3)
	.describe(
	  "Exactly 3 semantically diverse search queries derived from the user's question",
	),
});

const agent = createAgent({
  name: "multiQueryAgent",
  model: createModel(0.2, "openai/gpt-oss-20b"),
  systemPrompt: `You are a multi-query expansion agent for a RAG system.

Given the user's original question, generate exactly 3 semantically diverse search queries to maximize document retrieval recall.

Strategies to apply across the 3 queries:
- Paraphrase: rephrase the question using different wording and synonyms.
- Broadening: zoom out to the broader topic or general concept behind the question.
- Decomposition: isolate a specific sub-aspect or key entity from the question.

Rules:
- All 3 queries must target the same underlying intent as the original question.
- Do NOT answer the user's question.
- Do NOT invent facts or assumptions not present in the original question.
- Each query must be a standalone search string suitable for vector similarity search.`,
  responseFormat,
});

export const multiQueryAgent = tool(
  async ({ query }: { query: string }) => {
	const result = await agent.invoke({
	  messages: [{ role: "user", content: query }],
	});
	const queries = result.structuredResponse?.queries;
	if (!queries?.length)
	  return { success: false, message: "Failed to get queries" };

	return { success: true, data: queries };
  },
  {
	name: "multiQueryAgent",
	description:
	  "Generates exactly 3 semantically diverse search queries from the user's question to improve document retrieval.",
	schema: z.object({
	  query: z.string().describe("Original user query"),
	}),
  },
);
