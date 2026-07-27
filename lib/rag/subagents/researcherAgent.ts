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
	  metadata: {
		documentId: c.documentId,
		isTable: c.isTable,
		fileName: c.fileName ?? null,
		pageNumber: c.pageNumber ?? null,
	  },
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
