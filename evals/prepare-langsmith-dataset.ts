import fs from "fs";
import csv from "csv-parser";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const QA_FILES = [
  {
	path: path.join(__dirname, "single_passage_answer_questions.csv"),
	type: "single_passage",
  },
  {
	path: path.join(__dirname, "multi_passage_answer_questions.csv"),
	type: "multi_passage",
  },
  { path: path.join(__dirname, "no_answer_questions.csv"), type: "no_answer" },
];

const OUTPUT_JSON_FILE = path.join(__dirname, "langsmith_eval_dataset.json");

async function main() {
  console.log("🔍 Fetching Project MongoDB ObjectIds from database...");

  // 1. Fetch all evaluation projects from MongoDB
  const projects = await prisma.project.findMany({
	select: {
	  id: true, // MongoDB ObjectId string (e.g., '6a69b67583b5fb5db4b20c8d')
	  title: true, // Title (e.g., 'eval_document_0')
	},
  });

  // 2. Create a fast lookup map: { "eval_document_0": "6a69b67583b5fb5db4b20c8d", ... }
  const projectMap = new Map<string, string>();
  projects.forEach((p) => {
	projectMap.set(p.title, p.id);
  });

  console.log(`✅ Loaded ${projectMap.size} projects from MongoDB.`);

  const langsmithDataset: any[] = [];

  // 3. Parse CSV files and attach real ObjectId string
  for (const fileInfo of QA_FILES) {
	if (!fs.existsSync(fileInfo.path)) {
	  console.warn(`⚠️ File missing: ${fileInfo.path}`);
	  continue;
	}

	await new Promise<void>((resolve, reject) => {
	  fs.createReadStream(fileInfo.path)
		.pipe(csv())
		.on("data", (row) => {
		  const question = row.question || row.Question;
		  const answer = row.answer || row.Answer || "I do not know";
		  const docIndex = row.document_index ?? row.index ?? row.doc_id;

		  if (!question || docIndex === undefined) return;

		  const projectTitle = `eval_document_${docIndex}`;
		  const mongoObjectId = projectMap.get(projectTitle);

		  if (!mongoObjectId) {
			console.warn(
			  `⚠️ Warning: No MongoDB project found matching title: ${projectTitle}`,
			);
			return;
		  }

		  langsmithDataset.push({
			inputs: {
			  // Now passes the real MongoDB ObjectId string required by your Next.js POST API route!
			  projectId: mongoObjectId,
			  question: question.trim(),
			},
			outputs: {
			  ground_truth: answer.trim(),
			},
			metadata: {
			  qa_type: fileInfo.type,
			  document_index: docIndex,
			  projectTitle: projectTitle,
			  mongoProjectId: mongoObjectId,
			},
		  });
		})
		.on("end", () => {
		  console.log(`✅ Processed: ${fileInfo.path} (${fileInfo.type})`);
		  resolve();
		})
		.on("error", (err) => reject(err));
	});
  }

  fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(langsmithDataset, null, 2));
  console.log(
	`\n🎉 Success! Created '${OUTPUT_JSON_FILE}' with ${langsmithDataset.length} examples.`,
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
