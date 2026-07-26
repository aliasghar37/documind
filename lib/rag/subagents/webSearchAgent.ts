import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import { z } from "zod";
import { generateFromChunks } from "./generatorAgent";

const tavily = new TavilySearch({
  maxResults: 5,
  includeAnswer: true,
  includeRawContent: false,
  searchDepth: "advanced",
  topic: "general",
});

function cleanContent(text: string): string {
  return text
	.replace(/\b(Close Button|Read more|Show more|Load more|Sign up|Log in|Subscribe|Share|Tweet|Pin|Email|Print|Comments?\s*\(\d*\))\b/gi, "")
	.replace(/^(facebook|twitter|linkedin|reddit|whatsapp|telegram|bluesky|threads|pinterest|email|flipboard|vk)\s*$/gim, "")
	.replace(/\s{3,}/g, " ")
	.trim();
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

type TavilyResult = { title: string; url: string; content: string; score: number };

async function tavilyWithRetry(query: string, attempt = 0): Promise<TavilyResult[]> {
  try {
	const resp = await tavily.invoke({ query });
	return (resp as any).results ?? [];
  } catch (error) {
	if (attempt < MAX_RETRIES) {
	  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
	  await new Promise((r) => setTimeout(r, delay));
	  return tavilyWithRetry(query, attempt + 1);
	}
	throw error;
  }
}

export const webSearchAgent = tool(
  async ({ query }: { query: string }) => {
	let results: TavilyResult[];

	try {
	  results = await tavilyWithRetry(query);
	} catch (error) {
	  const message = error instanceof Error ? error.message : "Tavily search failed";
	  return JSON.stringify({
		answer: `I encountered an error while searching the web: ${message}`,
		references: [],
	  });
	}

	if (!results.length) {
	  return JSON.stringify({
		answer: "No web search results found for this query.",
		references: [],
	  });
	}

	const chunks = results.slice(0, 3).map((r) => ({
	  content: cleanContent(r.content.slice(0, 1500)),
	  score: r.score,
	  metadata: { title: r.title, url: r.url },
	}));

	try {
	  const answer = await generateFromChunks(chunks, query);
	  return answer;
	} catch {
	  const references = chunks.map((c) => ({
		title: c.metadata.title,
		url: c.metadata.url,
	  }));
	  const formatted = chunks
		.map((c, i) => `[${i + 1}] ${c.content}`)
		.join("\n\n");
	  return JSON.stringify({
		answer: formatted,
		references,
	  });
	}
  },
  {
	name: "webSearchTool",
	description:
	  "Searches the web for a query and generates an answer. Use for: recent events, latest news, current products, anything time-sensitive, or when document retrieval fails.",
	schema: z.object({
	  query: z.string().describe("Search query rewritten for web search"),
	}),
  },
);
