import { createAgent, tool } from "langchain";
import { z } from "zod";
import { createModel } from "../llm";

export const chunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  summary: z.string(),
  isTable: z.boolean(),
  order: z.number(),
  documentId: z.string(),
  projectId: z.string(),
  rrfScore: z.number(),
  vectorRank: z.number(),
  textRank: z.number(),
  relevanceScore: z.number().optional(),
});

const responseFormat = z.object({
  grades: z.array(
	z.object({
	  chunkNumber: z
		.number()
		.describe("1-based index matching the input JSON array"),
	  id: z.string().describe("The chunk's id from the input"),
	  confidenceScore: z
		.number()
		.min(0)
		.max(100)
		.describe("Score for this chunk"),
	  isValid: z.boolean().describe("Passes threshold (>= 70)"),
	  reasoning: z.string().describe("Why this score (in short)"),
	}),
  ),
});

const systemPrompt = `You are GraderAgent in a multi-agent Question Answering system.
Your role is to evaluate retrieved chunks before they can be used to answer the user.
You act as a factual validation and relevance detection layer.

You DO NOT answer the user's question.
You ONLY evaluate the quality, relevance, and factual grounding of retrieved data.

>>> INPUT YOU RECEIVE:

1. The user's original question (as they typed it).
2. Retrieved chunks from the user's uploaded documents.

>>> YOUR TASK — grade EACH chunk individually:

1. RELEVANCE — Does this chunk directly help answer the user's specific question?
   - Match the user's INTENT, not just keywords. "Layer 4 in this document" means the document's own Layer 4, not OSI model Layer 4.
   - If the chunk discusses a different context of the same term, it is NOT relevant.
   - If the chunk is on a related topic but doesn't address the specific question, it is NOT relevant.

2. GROUNDING — Are all factual claims in the chunk supported? No fabrication or unsupported inference.

3. HALLUCINATION RISK — Does the chunk introduce claims not present in the source data?

4. CONFIDENCE SCORE (0-100):
   90-100 → Directly and fully answers the question. Strongly grounded.
   70-89  → Mostly relevant, minor gaps but usable.
   50-69  → Weak relevance, partial alignment at best.
   0-49   → Irrelevant or wrong context.

>>> RULES:
- Never answer the user question yourself.
- Never speculate or improve the data.
- Grade EACH chunk individually. One grade per chunk.
- Be strict. If a chunk is about the right keyword but wrong context, score it below 50.
- When in doubt, lower the score.
- Your output must be a grades array with exactly the same number of entries as input chunks, in the same order.`;

const model = createModel(0.2, "openai/gpt-oss-20b");

const agent = createAgent({
  name: "graderAgent",
  model,
  systemPrompt,
  responseFormat,
});

export const graderAgent = tool(
  async ({ chunks, query }) => {
	const chunksJson = chunks.map((c, i) => ({
	  chunkNumber: i + 1,
	  id: c.id,
	  relevanceScore: c.relevanceScore ?? null,
	  content: c.content,
	}));

	const result = await agent.invoke({
	  messages: [
		{
		  role: "user",
		  content: `Query: ${query}\n\nRetrieved Chunks (JSON array):\n${JSON.stringify(chunksJson, null, 2)}`,
		},
	  ],
	});

	const rawGrades = (result.structuredResponse as any)?.grades ?? [];
	const grades = rawGrades.map((g: any) => ({
	  ...g,
	  isValid: (g.confidenceScore ?? 0) >= 70,
	}));
	return { grades };
  },
  {
	name: "graderAgent",
	description:
	  "Grades each retrieved chunk individually (0-100) based on relevancy to the user's query. Returns per-chunk confidence scores, validity, and reasoning.",
	schema: z.object({
	  chunks: z.array(chunkSchema).describe("Reranked chunks to evaluate"),
	  query: z.string().describe("Original user query"),
	}),
  },
);
