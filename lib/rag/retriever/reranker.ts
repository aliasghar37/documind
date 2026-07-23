import { Chunk } from "@/lib/data";
import "dotenv/config";

type ApiResult = { results: Result[]; usage: { total_tokens: number } };

type Result = {
  index: number;
  relevance_score: number;
  document: { text: string };
};

type RerankerResponse = {
  success: boolean;
  data?: { chunks: Chunk[]; usage: { total_tokens: number } };
  message?: string;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rerankChunks(
  query: string,
  rawChunks: Chunk[],
  topN = 4,
): Promise<RerankerResponse> {
  const chunks: string[] = rawChunks.map((chunk) => {
	if (chunk.isTable) return chunk.summary;
	else return chunk.content;
  });

  const data = JSON.stringify({
	model: "jina-reranker-v3",
	query: query,
	top_n: topN,
	documents: chunks,
	return_documents: true,
  });

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
	try {
	  const resp = await fetch("https://api.jina.ai/v1/rerank", {
		headers: {
		  "Content-Type": "application/json",
		  Authorization: `Bearer ${process.env.JINA_API_KEY}`,
		},
		method: "POST",
		body: data,
	  });

	  if (!resp.ok) {
		if (attempt < MAX_RETRIES) {
		  const delay = 1000 * Math.pow(2, attempt - 1);
		  await sleep(delay);
		  continue;
		}
		const errorBody = await resp.text();
		return { success: false, message: `Jina API error ${resp.status}: ${errorBody}` };
	  }

	  const { results, usage }: ApiResult = await resp.json();
	  if (!results.length)
		return { success: false, message: "Failed to rerank documents" };

	  const rerankedChunks: Chunk[] = results.map((chunk) => {
		return {
		  ...rawChunks[chunk.index],
		  relevanceScore: chunk.relevance_score,
		};
	  });

	  return { success: true, data: { chunks: rerankedChunks, usage } };
	} catch (error) {
	  if (attempt < MAX_RETRIES) {
		const delay = 1000 * Math.pow(2, attempt - 1);
		await sleep(delay);
		continue;
	  }
	  if (error instanceof Error) {
		return { success: false, message: error.message };
	  }
	}
  }
  return { success: false, message: "unknown error" };
}
