import { tool } from "langchain";
import { z } from "zod";
import { multiQueryAgent } from "./multiQueryAgent";
import { hybridSearch } from "../retriever/hybridSearch";
import { rerankChunks } from "../retriever/reranker";

export const retrieverAgent = tool(
  async ({ query, projectId }: { query: string; projectId: string }) => {
	const multiQueryAgentResp = await multiQueryAgent.invoke({ query });
	if (!multiQueryAgentResp.success || !multiQueryAgentResp.data?.length)
	  return `ERROR: ${multiQueryAgentResp.message ?? "Query expansion failed"}`;
	const queries = multiQueryAgentResp.data;

	const hybridSearchResp = await hybridSearch({ queries, projectId });
	if (!hybridSearchResp.success || !hybridSearchResp.data?.length)
	  return `ERROR: ${hybridSearchResp.message ?? "No documents found"}`;
	const rawChunks = hybridSearchResp.data;

	const rerankerResp = await rerankChunks(queries[0], rawChunks, 4);
	if (!rerankerResp.success || !rerankerResp.data?.chunks.length)
	  return `ERROR: ${rerankerResp.message ?? "Reranking failed"}`;

	const { chunks: rerankedChunks } = rerankerResp.data;

	return JSON.stringify(
	  rerankedChunks.map((c) => ({
		chunkId: c.chunkId,
		content: c.content,
		summary: c.summary,
		isTable: c.isTable,
		order: c.order,
		documentId: c.documentId,
		relevanceScore: c.relevanceScore,
	  })),
	);
  },
  {
	name: "retrieverAgent",
	description: "Retrieves and reranks document chunks for a query",
	schema: z.object({
	  query: z.string(),
	  projectId: z.string(),
	}),
  },
);
