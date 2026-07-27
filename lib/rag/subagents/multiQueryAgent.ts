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

const normalPrompt = `You are a multi-query expansion agent for a RAG system that searches across documents from any field — academic, medical, legal, business, general, etc.

Given the user's original question, generate exactly 3 semantically diverse search queries to maximize document retrieval recall.

Query 1 (Core): Keep ALL specific terms (names, numbers, proper nouns, dates, drug names, diagnoses, legal terms, financial terms, brand names, etc.) from the original question intact. Only rephrase the surrounding words. This query MUST contain every specific term from the original.

Query 2 (Broad): Zoom out to the broader topic or general concept. Use synonyms and related concepts.

Query 3 (Decomposed): Isolate a specific sub-aspect or key entity from the question.

EXAMPLES:

User: "What dosage of Metformin is recommended for Type 2 diabetes in elderly patients?"
→ Q1: "Metformin dosage Type 2 diabetes elderly patients"
→ Q2: "oral medication dosing guidelines for diabetes in older adults"
→ Q3: "Metformin pharmacokinetics in geriatric population"

User: "Why did they use 8 NVIDIA P100 GPUs to train their models?"
→ Q1: "8 NVIDIA P100 GPUs model training hardware"
→ Q2: "GPU hardware configuration for deep learning model training"
→ Q3: "multi-GPU training setup and hardware selection"

User: "What is the statute of limitations for breach of contract in California?"
→ Q1: "statute of limitations breach of contract California"
→ Q2: "time limits for filing contract dispute lawsuits"
→ Q3: "California civil code contract claim deadline"

User: "How does the company's Q3 2025 revenue compare to Q3 2024?"
→ Q1: "Q3 2025 revenue compared to Q3 2024"
→ Q2: "quarterly revenue year-over-year financial performance"
→ Q3: "third quarter 2025 earnings results"

User: "What are the side effects of combining aspirin and warfarin?"
→ Q1: "aspirin warfarin drug interaction side effects"
→ Q2: "anticoagulant combination therapy risks"
→ Q3: "aspirin and warfarin concurrent use bleeding risk"

Rules:
- All 3 queries must target the same underlying intent as the original question.
- Do NOT answer the user's question.
- Do NOT invent facts or assumptions not present in the original question.
- Each query must be a standalone search string suitable for vector similarity search.
- NEVER drop specific terms (names, numbers, proper nouns, technical terms) from Query 1.`;

const retryPrompt = `You are a multi-query expansion agent for a RAG system that searches across documents from any field — academic, medical, legal, business, general, etc.

The previous search found partially relevant results but not specific enough. Generate exactly 3 NEW search queries that are MORE specific and narrower than the original question.

Strategies:
- Focus on exact terms and precise details from the original question.
- Use more specific synonyms or technical terms.
- Break down the question into very specific sub-queries.

EXAMPLES:

User: "What dosage of Metformin is recommended for Type 2 diabetes in elderly patients?"
(Previous search found general diabetes info but not Metformin-specific dosing)
→ Q1: "Metformin starting dose elderly Type 2 diabetes mg daily"
→ Q2: "Metformin titration protocol geriatric patients renal function"
→ Q3: "metformin hydrochloride maximum dose age over 65"

User: "Why did they use 8 NVIDIA P100 GPUs to train their models?"
(Previous search found GPU info but not the specific training justification)
→ Q1: "8 NVIDIA P100 GPUs training time steps hardware schedule"
→ Q2: "P100 Pascal architecture training throughput deep learning"
→ Q3: "multi-GPU scaling efficiency 8 GPU configuration"

User: "What are the side effects of combining aspirin and warfarin?"
(Previous search found individual drug info but not the combination)
→ Q1: "aspirin warfarin concurrent use gastrointestinal bleeding risk"
→ Q2: "dual antithrombotic therapy aspirin warfarin INR monitoring"
→ Q3: "aspirin warfarin drug interaction mechanism platelet inhibition"

Rules:
- All 3 queries must target the same underlying intent as the original question.
- Do NOT answer the user's question.
- Do NOT invent facts or assumptions not present in the original question.
- Each query must be a standalone search string suitable for vector similarity search.
- NEVER drop specific terms from any query.
- These queries must be DIFFERENT and MORE SPECIFIC than the original question.`;

const normalAgent = createAgent({
  name: "multiQueryAgent",
  model: createModel(0.2, "openai/gpt-oss-20b"),
  systemPrompt: normalPrompt,
  responseFormat,
});

const retryAgent = createAgent({
  name: "multiQueryAgent-retry",
  model: createModel(0.2, "openai/gpt-oss-20b"),
  systemPrompt: retryPrompt,
  responseFormat,
});

export const multiQueryAgent = tool(
  async ({ query, retry }: { query: string; retry?: boolean }) => {
	const agent = retry ? retryAgent : normalAgent;
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
	  retry: z
		.boolean()
		.optional()
		.describe("Set to true for retry with more specific queries"),
	}),
  },
);
