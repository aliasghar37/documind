import { Client } from "langsmith";
import fs from "fs";
import "dotenv/config";

const client = new Client();

async function uploadDataset(): Promise<void> {
  const datasetName = "DocuMind Evaluation";
  const jsonFilePath = new URL("./langsmith_eval_dataset_10docs.json", import.meta.url).pathname;

  if (!fs.existsSync(jsonFilePath)) {
	console.error(`❌ ${jsonFilePath} not found!`);
	process.exit(1);
  }

  console.log(`📂 Reading filtered dataset from '${jsonFilePath}'...`);
  const examples = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

  console.log(`⚙️ Creating dataset '${datasetName}' in LangSmith...`);
  const dataset = await client.createDataset(datasetName, {
	description: "DocuMind 60 QA pairs (10 docs, 3 categories, 2 questions each)",
  });

  console.log(`✅ Dataset created! ID: ${dataset.id}`);
  console.log(`🚀 Uploading ${examples.length} examples...`);

  for (let i = 0; i < examples.length; i++) {
	const item = examples[i];
	await client.createExample(item.inputs, item.outputs, {
	  datasetId: dataset.id,
	  metadata: item.metadata,
	});
	console.log(`Uploaded [${i + 1}/${examples.length}]: ${item.inputs.question.slice(0, 50)}...`);
  }

  console.log(`\n🎉 All ${examples.length} examples uploaded to '${datasetName}'`);
  console.log(`👉 Check at: https://smith.langchain.com/`);
}

uploadDataset().catch((err: Error) => {
  console.error("❌ Upload failed:", err);
  process.exit(1);
});
