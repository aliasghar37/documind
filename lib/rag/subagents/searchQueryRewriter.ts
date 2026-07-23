import { tool } from "langchain";
import { z } from "zod";
import { createModel } from "../llm";

export const searchQueryRewriterAgent = tool(
  async ({ query }: { query: string }) => {
	const model = createModel(0.2, "openai/gpt-oss-20b");
	const response = await model.invoke([
	  {
		role: "system",
		content: `You are a search query optimizer. Your ONLY job is to rewrite the user's query into a concise, keyword-rich search engine query.

>>> Rules:
- Remove all conversational phrases, filler words, and polite requests
- Remove questions — convert to topic keywords
- Keep technical terms, proper nouns, and specific details intact
- Output ONLY the rewritten query. No explanation, no quotes, no punctuation at the end
- If the query is already clean, return it as-is

>>> Example:
User: "Hey, I was wondering if you could maybe tell me about the side effects of mixing ibuprofen with blood thinners, like what happens if someone takes them together?"
Rewrite: ibuprofen blood thinners interaction side effects`,
	  },
	  { role: "user", content: query },
	]);

	const rewritten = (response.content as string).trim();
	console.log("Executed tool ===============: searchQueryRewriter");
	return rewritten || query;
  },
  {
	name: "searchQueryRewriter",
	description:
	  "Rewrites a conversational user query into a concise, keyword-rich search query using an LLM. Removes filler words, questions, and conversational phrases. Returns a single cleaned query string for web search.",
	schema: z.object({
	  query: z
		.string()
		.describe("The original conversational query to rewrite"),
	}),
  },
);
