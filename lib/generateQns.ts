import { model } from "./rag/llm";
import z from "zod";

export async function generateRecommendationQns(text: string) {
  const RecommendationQnsSchema = z.object({
	questions: z.array(z.string().describe("The question")).length(3),
  });

  const response = await model.invoke(
	`
		You are generating starter questions for a document UI.

		Task:
		- Read the document preview below.
		- Generate exactly 3 useful questions a user would naturally ask after seeing this document for the first time.
		- Questions should be specific, concise, and diverse.
		- Do not answer the questions.
		- Do not add explanations.
		- Return only valid JSON matching the schema.

		Rules:
		- Output exactly 3 questions.
		- Each question must be a single string.
		- Avoid duplicates or near-duplicates.
		- Prefer questions that help a beginner understand the document, its purpose, main ideas, key differences, or practical use.
		- Return ONLY valid JSON with this exact shape:
		{
			"questions": ["question 1", "question 2", "question 3"]
		}

		Document preview:
		${text}
		`,
	{
	  response_format: {
		type: "json_object",
	  },
	},
  );
  const parsed = JSON.parse(String(response.content));
  const validated = RecommendationQnsSchema.parse(parsed);

  return validated.questions;
}
