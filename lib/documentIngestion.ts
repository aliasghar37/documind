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
  pageNumber?: number;
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
  const lines = content.split("\n").filter(Boolean);
  if (lines.length === 0) return false;

  let tableLikeLines = 0;
  for (const line of lines) {
	const hasTabs = /\t/.test(line);
	const hasPipes = /\|/.test(line);
	if (hasTabs || hasPipes) tableLikeLines++;
  }
  return tableLikeLines / lines.length >= 0.2;
}

export async function documentIngestion(document: File) {
  let parser: PDFParse | undefined;
  try {
	// Loading pdf dataa,parsing and splitting it

	// const pdfBuffer = await readFile(`${process.cwd()}/public/difference.pdf`);
	const pdfBuffer = Buffer.from(await document.arrayBuffer());
	parser = new PDFParse({ data: pdfBuffer });
	const resultForQns = await parser.getText({ partial: [1, 2, 3, 4] });
	const recommendationQns = await generateRecommendationQns(
	  resultForQns.text,
	);

	const infoResult = await parser.getInfo();
	const totalPages = infoResult.total || 1;

	const pdfMetadata: DocumentMetadata = {
	  pageCount: totalPages,
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
	  totalCharacters: 0,
	};

	const pageBoundaries: { page: number; start: number; end: number }[] = [];
	let fullText = "";
	const pageMarkerPattern = /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/;
	for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
	  const pageResult = await parser.getText({ partial: [pageNum] });
	  const pageText = (pageResult.text ?? "").trim();
	  if (!pageText || pageMarkerPattern.test(pageText)) {
		console.log(`[ingestion] Skipping page ${pageNum}: "${pageText.slice(0, 50)}"`);
		continue;
	  }
	  console.log(`[ingestion] Page ${pageNum}: ${pageText.length} chars`);
	  pageBoundaries.push({
		page: pageNum,
		start: fullText.length,
		end: fullText.length + pageText.length,
	  });
	  fullText += pageText + "\n\n";
	}
	pdfMetadata.totalCharacters = fullText.length;

	function getPageNumber(charOffset: number): number {
	  for (const boundary of pageBoundaries) {
		if (charOffset >= boundary.start && charOffset < boundary.end) {
		  return boundary.page;
		}
	  }
	  return pageBoundaries.length > 0
		? pageBoundaries[pageBoundaries.length - 1].page
		: 1;
	}

	// Split the full text — cross-page paragraphs stay intact
	const textSplitter = new RecursiveCharacterTextSplitter({
	  chunkSize: 1200,
	  chunkOverlap: 200,
	  separators: ["\n\n"],
	});
	const rawChunks = (await textSplitter.splitText(fullText)).filter(
	  (chunk) => !pageMarkerPattern.test(chunk.trim()),
	);
	console.log(`[ingestion] textSplitter produced ${rawChunks.length} chunks after filtering page markers`);

	// Process each chunk independently — no merging
	const processedBatches: IngestionBatch[] = [];
	const preparedBatches: PreparedBatch[] = [];
	const indexedBatches: IndexedBatch[] = [];
	let searchFrom = 0;

	for (const rawChunk of rawChunks) {
	  const content = rawChunk.trim();
	  if (!content) continue;

	  const charIndex = fullText.indexOf(content, searchFrom);
	  const pageNumber = getPageNumber(charIndex >= 0 ? charIndex : searchFrom);
	  if (charIndex >= 0) searchFrom = charIndex + content.length;

	  processedBatches.push({
		id: uuidv4(),
		content,
		isTable: isStructuredLayout(content),
		pageNumber,
	  });
	}

	//EMBEDDING & SUMMARY AGGREGATION
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
