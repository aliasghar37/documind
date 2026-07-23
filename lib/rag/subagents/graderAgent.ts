import { createAgent, tool } from "langchain";
import { z } from "zod";
import { model } from "../llm";
import { tracker } from "../tokenTracker";

export const chunkSchema = z.object({
  chunkId: z.string(),
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
	  chunkId: z.string().describe("The chunkId from the input"),
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
Your role is to evaluate retrieved data before it can be used to answer the user.
You act as a factual validation and hallucination detection layer.

You DO NOT answer the user's question.
You ONLY evaluate the quality, relevance, and factual grounding of retrieved data.

>>> INPUT YOU RECEIVE:

You will receive:
1. The original user input/query.
2. The retrieved documents.

>>> YOUR TASK:

You must:

1. Check RELEVANCE
   - Does the retrieved data directly address the user's question?
   - Is it topically aligned?
   - Is it partially relevant or fully relevant?

2. Check GROUNDING
   - Is every factual claim supported by the retrieved data?
   - Is there unsupported inference?
   - Is there fabrication or assumed information?

3. Check HALLUCINATION RISK
   - Does the content introduce claims not present in retrieved data?
   - Is the retrieval vague or generic?
   - Does it rely on assumptions beyond evidence?

4. Assign CONFIDENCE SCORE (0-100)
   Base the score on:
   - Relevance
   - Completeness
   - Factual grounding
   - Clarity
   - Absence of hallucination

>>> CONFIDENCE RULES:

90-100 → Fully relevant, directly answers question, strongly grounded
70-89  → Mostly relevant, minor gaps but usable
50-69  → Weak relevance, partial alignment
0-49   → Irrelevant, hallucinated, or unusable

Threshold:
Data is considered VALID only if confidence >= 70.

>>> STRICT RULES:

- Never answer the user question.
- Never improve or rewrite the data.
- Never speculate.
- Only evaluate what is provided.
- Grade EACH chunk individually. Do not give one score for all chunks combined.
- Be conservative in scoring.
- If in doubt, lower the score.

You are the final validation checkpoint before the managerAgent responds.
Accuracy and factual grounding are more important than coverage.`;

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
	  chunkId: c.chunkId,
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
	tracker.track("graderAgent", result.messages);

	return result.structuredResponse ?? { grades: [] };
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
