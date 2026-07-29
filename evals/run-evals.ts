import { evaluate } from "langsmith/evaluation";
import type { Run, Example } from "langsmith/schemas";
import "dotenv/config";

// --- CONFIGURATION ---
const DATASET_NAME = "DocuMind Evaluation";
const TARGET_API_URL = "http://localhost:3000/api/chat"; // Your Next.js local server URL

// 1. Target Function: This function receives inputs from LangSmith and calls your system's endpoint.

async function targetApp(inputs: { question: string; projectId: string }) {
  const { question, projectId } = inputs;

  try {
	const response = await fetch(TARGET_API_URL, {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json",
		"x-eval-mode": "true",
	  },
	  body: JSON.stringify({
		projectId,
		messages: [{ role: "user", content: question }],
	  }),
	});

	if (!response.ok) {
	  console.error(`API Error (${response.status}): ${await response.text()}`);
	  return { output: "Error: Request failed" };
	}

	const data = await response.json();

	const outputAnswer =
	  data.structuredResponse?.answer || "I don't know";

	return {
	  output: outputAnswer,
	};
  } catch (error) {
	console.error("Failed to invoke target API:", error);
	return { output: "Error: Exception occurred" };
  }
}


// 2. Evaluator: Compares generated answer against ground_truth

const simpleCorrectnessEvaluator = async (
  run: Run,
  example?: Example,
) => {
  const generated = (run.outputs?.output as string)?.toLowerCase() ?? "";
  const target = (example?.outputs?.ground_truth as string)?.toLowerCase() ?? "";

  // Basic overlap check (Can be upgraded to LLM-as-a-judge)
  const isMatch = generated.includes(target) || target.includes(generated);

  return {
	key: "basic_correctness",
	score: isMatch ? 1.0 : 0.0,
  };
};


// 3. Run Execution
async function runEvaluation() {
  console.log(
	"🚀 Launching LangSmith Evaluation against DocuMind local API...",
  );

  await evaluate(targetApp, {
	data: DATASET_NAME,
	evaluators: [simpleCorrectnessEvaluator],
	experimentPrefix: "documind-10docs-threshold30",
	maxConcurrency: 1, 
  });

  console.log("\n🎉 Evaluation run completed!");
  console.log(
	"👉 Check your results on LangSmith: https://smith.langchain.com/",
  );
}

runEvaluation().catch(console.error);
