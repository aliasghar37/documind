import { InferenceClient } from "@huggingface/inference";
import { type FeatureExtractionOutput } from "@huggingface/inference";
import "dotenv/config";

type GenerateQueryEmbeddingsResp = Promise<{
  success: boolean;
  data?: FeatureExtractionOutput;
  message?: string;
}>;

const hf = new InferenceClient(process.env.HUGGINGFACE_ACCESS_TOKEN);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateQueryEmbeddings(
  queries: string[],
): GenerateQueryEmbeddingsResp {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
	try {
	  const resp = await hf.featureExtraction({
		model: "BAAI/bge-base-en-v1.5",
		inputs: queries,
	  });
	  if (!resp || !Array.isArray(resp) || !resp.length)
		throw new Error("Could not generate embeddings");
	  return { success: true, data: resp as FeatureExtractionOutput };
	} catch (error) {
	  if (attempt < MAX_RETRIES) {
		const delay = 1000 * Math.pow(2, attempt - 1);
		await sleep(delay);
		continue;
	  }
	  if (error instanceof Error) {
		return { success: false, message: error.message };
	  }
	  return { success: false, message: "unknown error" };
	}
  }

  return { success: false, message: "unknown error" };
}
