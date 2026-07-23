import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

type ModelName = "qwen/qwen3.6-27b" | "openai/gpt-oss-20b";

export function createModel(
  temperature = 0,
  modelName: ModelName = "qwen/qwen3.6-27b",
) {
  return new ChatOpenAI({
	modelName,
	maxRetries: 3,
	timeout: 100_000,
	apiKey: process.env.GROQ_API_KEY,
	configuration: { baseURL: "https://api.groq.com/openai/v1" },
	temperature,
	// modelKwargs: { reasoning_effort: "none" },
  });
}

export const model = createModel();
