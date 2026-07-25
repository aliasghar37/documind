// import { createAgent, createMiddleware } from "langchain";
// import { tool } from "@langchain/core/tools";
// import { model } from "./../llm";
// import { z } from "zod";
// import { graderAgent } from "./graderAgent";
// import { retrieverAgent } from "./retrieverAgent";
// import { tracker } from "../tokenTracker";
// import "dotenv/config";

// export const toolMonitoringMiddleware = createMiddleware({
//   name: "ToolMonitoringMiddleware",
//   wrapToolCall: async (request, handler) => {
//     console.log(`Executing tool ===============: ${request.toolCall.name}`);

//     try {
//       const result = await handler(request);
//       console.log(
//         `Tool completed successfully===========: ${request.toolCall.name}`,
//       );
//       return result;
//     } catch (e) {
//       console.log(`Tool failed: ${e}`);
//       throw e;
//     }
//   },
// });

// //////////////// (ReAct) More Tokens

// const researcherPrompt = `
// You are researcherAgent.
// You retrieve document chunks, grade them, and return only valid chunks. You do NOT directly answer the user.

// INPUT:
// A JSON object with "query" and "projectId".

// WORKFLOW — follow these steps IN ORDER. Do not skip any step:

// STEP 1: Call retrieverAgent with the exact query and projectId from the input.
// - If the response starts with "ERROR:" → return "NO_RELEVANT_DATA_FOUND"
// - If the response is a JSON array → proceed to STEP 2

// STEP 2: Call graderAgent with:
// - query: the original user query (from the input)
// - chunks: the JSON array from STEP 1 (pass the raw array, do not wrap it)

// STEP 3: From graderAgent's response, keep ONLY chunks where isValid is true (confidenceScore >= 70).
// - If 1 or more valid chunks: return them as a JSON array
// - If 0 valid chunks: return "NO_RELEVANT_DATA_FOUND"

// STRICT RULES:
// - Never answer the user's question directly.
// - Never fabricate facts.
// - Never skip graderAgent.
// - Always filter chunks by isValid before returning.
// - Never expose scores, reasoning, or internal workflow.

// Groundedness > completeness.
// Validation > speed.
// `;

// const agent = createAgent({
//   name: "researcherAgent",
//   model,
//   systemPrompt: researcherPrompt,
//   tools: [retrieverAgent, graderAgent],
//   middleware: [toolMonitoringMiddleware],
// });

// export const researcherAgent = tool(
//   async ({ query, projectId }: { query: string; projectId: string }) => {
//     const result = await agent.invoke({
//       messages: [
//         {
//           role: "user",
//           content: JSON.stringify({ query, projectId }),
//         },
//       ],
//     });
//     tracker.track("researcherAgent", result.messages);
//     return result.messages.at(-1)?.text;
//   },
//   {
//     name: "researcherAgent",
//     description: `Retrieves, reranks, and validates document chunks for a query. Returns only chunks that pass grading.`,
//     schema: z.object({
//       query: z.string().describe("User's original question"),
//       projectId: z.string().describe("The project ID"),
//     }),
//   },
// );

/////////// Simpler, save llm calls and token consumption

import { tool } from "langchain";
import { z } from "zod";
import { multiQueryAgent } from "./multiQueryAgent";
import { hybridSearch } from "../retriever/hybridSearch";
import { rerankChunks } from "../retriever/reranker";
import { graderAgent } from "./graderAgent";

export const researcherAgent = tool(
  async ({ query, projectId }: { query: string; projectId: string }) => {
	try {

	// 1. Expand query into 3 diverse search queries
	const multiQueryResp = await multiQueryAgent.invoke({ query });
	console.log("researcherAgent: multiQuery response:", JSON.stringify(multiQueryResp));
	if (!multiQueryResp.success || !multiQueryResp.data?.length) {
	  console.log("researcherAgent: multiQuery FAILED, returning NO_RELEVANT_DATA_FOUND");
	  return "NO_RELEVANT_DATA_FOUND";
	}
	const queries = multiQueryResp.data;
	// Always include the original query so it's never dropped
	const allQueries = [query, ...queries];
	console.log("researcherAgent: search queries:", allQueries);

	// 2. Hybrid search + rerank
	const hybridResp = await hybridSearch({ queries: allQueries, projectId });
	console.log("researcherAgent: hybridSearch response success:", hybridResp.success, "count:", hybridResp.data?.length ?? 0);
	if (!hybridResp.success || !hybridResp.data?.length) {
	  console.log("researcherAgent: hybridSearch FAILED:", hybridResp.message);
	  return "NO_RELEVANT_DATA_FOUND";
	}
	const rawChunks = hybridResp.data;

	const rerankResp = await rerankChunks(query, rawChunks, 4);
	console.log("researcherAgent: rerank response success:", rerankResp.success, "count:", rerankResp.data?.chunks?.length ?? 0);
	if (!rerankResp.success || !rerankResp.data?.chunks.length) {
	  console.log("researcherAgent: rerank FAILED:", rerankResp.message);
	  return "NO_RELEVANT_DATA_FOUND";
	}
	const rerankedChunks = rerankResp.data.chunks;
	console.log("researcherAgent: reranked", rerankedChunks.length, "chunks");

	// 3. Grade each chunk
	const gradeResp = await graderAgent.invoke({ chunks: rerankedChunks, query });
	const grades = (gradeResp as any).grades as {
	  chunkNumber: number;
	  id: string;
	  confidenceScore: number;
	  isValid: boolean;
	  reasoning: string;
	}[];
	console.log("researcherAgent: grades:", grades);

	// 4. Filter: keep only valid chunks
	const validChunkIds = new Set(
	  grades.filter((g) => g.isValid).map((g) => g.id),
	);
	const validChunks = rerankedChunks.filter((c) => validChunkIds.has(c.id));

	console.log("researcherAgent: valid chunks:", validChunks.length, "/", rerankedChunks.length);

	if (validChunks.length === 0) {
	  return "NO_RELEVANT_DATA_FOUND";
	}

	return validChunks.map((c) => ({
	  content: c.isTable ? c.summary : c.content,
	  score: c.relevanceScore,
	  metadata: { documentId: c.documentId, isTable: c.isTable },
	}));
	} catch (err) {
	  console.error("researcherAgent: UNEXPECTED ERROR:", err);
	  return "NO_RELEVANT_DATA_FOUND";
	}
  },
  {
	name: "researcherAgent",
	description:
	  "Retrieves, reranks, and validates document chunks for a query. Returns only chunks that pass grading.",
	schema: z.object({
	  query: z.string().describe("User's original question"),
	  projectId: z.string().describe("The project ID"),
	}),
  },
);
