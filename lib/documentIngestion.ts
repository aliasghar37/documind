import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { InferenceClient } from "@huggingface/inference";
import { PDFParse } from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { model } from "./rag/llm";
import { generateRecommendationQns } from "./generateQns";

interface IngestionBatch {
  id: string;
  content: string;
  isTable: boolean;
}

export interface IndexedBatch extends IngestionBatch {
  summary?: string;
  embedding: number[];
}

interface PreparedBatch {
  batch: IndexedBatch;
  textToEmbed: string;
}

export interface DocumentMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pdfFormat?: string;
  totalChunks: number;
  tableChunks: number;
  totalCharacters: number;
}

export interface DocumentIngestionResponse {
  success: boolean;
  message: string;
  recommendationQns: string[];
  batches: IndexedBatch[];
  metadata: DocumentMetadata;
}

const hf = new InferenceClient(process.env.HUGGINGFACE_ACCESS_TOKEN);

function isStructuredLayout(content: string): boolean {
  const lines = content
	.split("\n")
	.map((l) => l.trim())
	.filter(Boolean);
  if (lines.length === 0) return false;

  let structuralLinesCount = 0;
  for (const line of lines) {
	const words = line.split(/\s+/).filter(Boolean);
	const isMultiValueLine = words.length >= 2 && words.length <= 12;
	const isShortLayoutLine = line.length < 80;
	const hasDataIndicators = /[:|\-|—●•\d]/.test(line);

	if (isMultiValueLine && (isShortLayoutLine || hasDataIndicators)) {
	  structuralLinesCount++;
	}
  }
  return structuralLinesCount / lines.length >= 0.5;
}

export async function documentIngestion(document: File) {
  let parser: PDFParse | undefined;
  try {
	// 1) Loading pdf dataa,parsing and splitting it

	// const pdfBuffer = await readFile(`${process.cwd()}/public/difference.pdf`);
	const pdfBuffer = Buffer.from(await document.arrayBuffer());
	parser = new PDFParse({ data: pdfBuffer });
	const resultForQns = await parser.getText({ partial: [1] });
	const recommendationQns = await generateRecommendationQns(
	  resultForQns.text,
	);

	const result = await parser.getText();
	const infoResult = await parser.getInfo();

	const pdfMetadata: DocumentMetadata = {
	  pageCount: infoResult.total || 0,
	  title: infoResult.info?.Title || undefined,
	  author: infoResult.info?.Author || undefined,
	  subject: infoResult.info?.Subject || undefined,
	  creator: infoResult.info?.Creator || undefined,
	  producer: infoResult.info?.Producer || undefined,
	  creationDate: infoResult.info?.CreationDate || undefined,
	  modDate: infoResult.info?.ModDate || undefined,
	  pdfFormat: infoResult.info?.format || undefined,
	  totalChunks: 0,
	  tableChunks: 0,
	  totalCharacters: result.text?.length || 0,
	};

	const textSplitter = new RecursiveCharacterTextSplitter({
	  chunkSize: 1200,
	  chunkOverlap: 120,
	  separators: ["\n\n"],
	});
	const rawStrings = await textSplitter.splitText(result.text);

	// 3) merging multichunk tables under a single id context
	const processedBatches: IngestionBatch[] = [];
	const preparedBatches: PreparedBatch[] = [];
	const indexedBatches: IndexedBatch[] = [];
	let activeTableChunks: string[] = [];
	let activeTableId: string | null = null;

	for (const rawChunk of rawStrings) {
	  const content = rawChunk.trim();
	  if (!content) continue;

	  if (isStructuredLayout(content)) {
		if (!activeTableId) {
		  activeTableId = uuidv4();
		}
		activeTableChunks.push(content);
	  } else {
		if (activeTableChunks.length > 0 && activeTableId) {
		  processedBatches.push({
			id: activeTableId,
			content: activeTableChunks.join("\n\n"),
			isTable: true,
		  });
		  activeTableChunks = [];
		  activeTableId = null;
		}

		processedBatches.push({
		  id: uuidv4(),
		  content: content,
		  isTable: false,
		});
	  }
	}

	if (activeTableChunks.length > 0 && activeTableId) {
	  processedBatches.push({
		id: activeTableId,
		content: activeTableChunks.join("\n\n"),
		isTable: true,
	  });
	}

	// 4) EMBEDDING & SUMMARY AGGREGATION
	const tableBatches = processedBatches.filter((b) => b.isTable);
	const nonTableBatches = processedBatches.filter((b) => !b.isTable);

	const tableSummaries = await Promise.all(
	  tableBatches.map(async (batch) => {
		const summaryResponse = await model.invoke([
		  {
			role: "system",
			content:
			  "You are a dense indexing assistant. Summarize the following table data in 3-4 concise sentences. Focus strictly on what items, keys, or metrics are being compared so it can be easily searched via vector similarity math.",
		  },
		  { role: "user", content: batch.content },
		]);
		return { batch, summary: String(summaryResponse.content) };
	  }),
	);

	for (const { batch, summary } of tableSummaries) {
	  preparedBatches.push({
		batch: { ...batch, summary, embedding: [] },
		textToEmbed: summary,
	  });
	}
	for (const batch of nonTableBatches) {
	  preparedBatches.push({
		batch: { ...batch, embedding: [] },
		textToEmbed: batch.content,
	  });
	}

	const MAX_RETRIES = 3;
	const EMBEDDING_BATCH_SIZE = 16;
	for (let i = 0; i < preparedBatches.length; i += EMBEDDING_BATCH_SIZE) {
	  const batchGroup = preparedBatches.slice(i, i + EMBEDDING_BATCH_SIZE);
	  const inputs = batchGroup.map((item) => item.textToEmbed);
	  let embeddings: number[][] = [];

	  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
		  embeddings = (await hf.featureExtraction({
			model: "BAAI/bge-base-en-v1.5",
			inputs,
		  })) as number[][];
		  break;
		} catch (err) {
		  if (attempt === MAX_RETRIES) throw err;
		  await new Promise((r) => setTimeout(r, 1000 * attempt));
		}
	  }
	  batchGroup.forEach((item, index) => {
		item.batch.embedding = embeddings[index]!;
		indexedBatches.push(item.batch);
	  });
	}

	pdfMetadata.totalChunks = indexedBatches.length;
	pdfMetadata.tableChunks = indexedBatches.filter((b) => b.isTable).length;

	return {
	  success: true,
	  message: "Document processed successfully.",
	  recommendationQns,
	  batches: indexedBatches,
	  metadata: pdfMetadata,
	};
  } catch (error) {
	console.error("Pipeline failed:", error);
	return {
	  success: false,
	  message:
		error instanceof Error
		  ? error.message
		  : "Document Ingestion process failed.",
	  recommendationQns: [],
	  batches: [],
	  metadata: {
		pageCount: 0,
		totalChunks: 0,
		tableChunks: 0,
		totalCharacters: 0,
	  },
	};
  } finally {
	await parser?.destroy();
  }
}
