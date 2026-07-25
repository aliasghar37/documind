import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

type ModelName = "openai/gpt-oss-20b" | "openai/gpt-oss-120b";

export function createModel(
  temperature = 0,
  modelName: ModelName = "openai/gpt-oss-120b",
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
