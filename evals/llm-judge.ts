import fs from "fs";
import csv from "csv-parser";
import { createModel } from "../lib/rag/llm";
import "dotenv/config";

const INPUT_CSV = "public/documind-evaluation.csv";
const OUTPUT_CSV = "public/documind-evaluation-scored.csv";

interface Row {
  id: string;
  inputs: string;
  reference_outputs: string;
  outputs: string;
  qa_type: string;
  ground_truth: string;
  answer: string;
  question: string;
}

async function judge(
  question: string,
  answer: string,
  groundTruth: string,
): Promise<{ score: number; reason: string }> {
  const llm = createModel(0, "openai/gpt-oss-120b");

  const prompt = `You are a strict correctness evaluator for a RAG system.

Question: ${question}

Model Answer: ${answer}

Ground Truth (reference): ${groundTruth}

Score the model answer on a scale of 0 to 5:
- 5 = Perfect match to ground truth, semantically identical
- 4 = Mostly correct, minor differences in wording or detail
- 3 = Partially correct, some key points present but others missing
- 2 = Minimally correct, barely addresses the question
- 1 = Wrong answer (contradicts ground truth)
- 0 = Refused to answer ("I don't know") when ground truth has an answer
Note: "I don't know" is correct only when ground truth also says "I do not know".

IMPORTANT: If the model answer says "I don't know" and the ground truth has an actual answer, score is 0.
If the model answer provides information consistent with the ground truth (even if worded differently), score it accordingly.

Output ONLY a JSON object with two fields: "score" (number 0-5) and "reason" (short explanation).`;

  try {
	const response = await llm.invoke([
	  { role: "system", content: "You are a strict but fair evaluation judge." },
	  { role: "user", content: prompt },
	]);
	const text =
	  typeof response.content === "string"
		? response.content
		: Array.isArray(response.content)
		  ? response.content.map((c: any) => c.text).join("")
		  : "";

	const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
	return { score: parsed.score ?? 0, reason: parsed.reason ?? "" };
  } catch (e) {
	return { score: 0, reason: `Judge error: ${e}` };
  }
}

async function main() {
  const rows: Row[] = [];

  await new Promise<void>((resolve, reject) => {
	fs.createReadStream(INPUT_CSV)
	  .pipe(csv())
	  .on("data", (row: any) => {
		const inp = JSON.parse(row.inputs);
		const ref = JSON.parse(row.reference_outputs);
		const out = JSON.parse(row.outputs);
		rows.push({
		  id: row.id,
		  inputs: row.inputs,
		  reference_outputs: row.reference_outputs,
		  outputs: row.outputs,
		  qa_type: row.qa_type || "",
		  ground_truth: ref.ground_truth || "",
		  answer: out.output || "",
		  question: inp.question || "",
		});
	  })
	  .on("end", () => resolve())
	  .on("error", reject);
  });

  console.log(`Loaded ${rows.length} rows. Evaluating...\n`);

  const results: Array<{
	id: string;
	question: string;
	answer: string;
	ground_truth: string;
	qa_type: string;
	score: number;
	reason: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
	const r = rows[i];
	process.stdout.write(`[${i + 1}/${rows.length}] ${r.question.slice(0, 50)}... `);
	const { score, reason } = await judge(r.question, r.answer, r.ground_truth);
	results.push({ id: r.id, question: r.question, answer: r.answer, ground_truth: r.ground_truth, qa_type: r.qa_type, score, reason });
	console.log(`score=${score}`);
  }

  const total = results.length;
  const avgScore = results.reduce((s, r) => s + r.score, 0) / total;
  const correctCount = results.filter((r) => r.score >= 3).length;
  const perfectCount = results.filter((r) => r.score === 5).length;
  const zeroCount = results.filter((r) => r.score === 0).length;
  const byType: Record<string, { total: number; score: number }> = {};
  for (const r of results) {
	if (!byType[r.qa_type]) byType[r.qa_type] = { total: 0, score: 0 };
	byType[r.qa_type].total++;
	byType[r.qa_type].score += r.score;
  }

  console.log("\n========== RESULTS ==========");
  console.log(`Average score (0-5): ${avgScore.toFixed(2)}`);
  console.log(`Scored >= 3 (pass):  ${correctCount}/${total} (${((correctCount / total) * 100).toFixed(1)}%)`);
  console.log(`Scored == 5 (perfect): ${perfectCount}/${total} (${((perfectCount / total) * 100).toFixed(1)}%)`);
  console.log(`Scored == 0 (fail):   ${zeroCount}/${total} (${((zeroCount / total) * 100).toFixed(1)}%)`);
  console.log("\nBy category:");
  for (const [t, v] of Object.entries(byType)) {
	console.log(`  ${t}: avg ${(v.score / v.total).toFixed(2)} (${v.total} questions)`);
  }

  const csvOut = "id,question,answer,ground_truth,qa_type,score,reason\n" +
	results.map((r) =>
	  `"${r.id}","${r.question.replace(/"/g, '""')}","${r.answer.replace(/"/g, '""')}","${r.ground_truth.replace(/"/g, '""')}","${r.qa_type}",${r.score},"${r.reason.replace(/"/g, '""')}"`
	).join("\n");
  fs.writeFileSync(OUTPUT_CSV, csvOut);
  console.log(`\nResults written to ${OUTPUT_CSV}`);
}

main().catch(console.error);
