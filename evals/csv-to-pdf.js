import fs from "fs";
import csv from "csv-parser";
import PDFDocument from "pdfkit";
import path from "path";

const CSV_FILE_PATH = "./documents.csv";
const OUTPUT_DIR = "./output_pdfs";
const MAX_PDFS_TO_GENERATE = 20;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

let generatedCount = 0;

console.log(
  `Processing CSV... Generating up to ${MAX_PDFS_TO_GENERATE} sample PDFs...`,
);

fs.createReadStream(CSV_FILE_PATH)
  .pipe(csv())
  .on("data", (row) => {
	if (generatedCount >= MAX_PDFS_TO_GENERATE) return;

	// Target the 'text' and 'index' columns identified from your output
	const docText = row.text ? row.text.trim() : null;
	const docIndex = row.index || `doc_${generatedCount + 1}`;

	if (!docText) return;

	generatedCount++;
	const fileName = `eval_document_${docIndex}.pdf`;
	const pdfPath = path.join(OUTPUT_DIR, fileName);

	// Create PDF document
	const doc = new PDFDocument({ margin: 50 });
	const writeStream = fs.createWriteStream(pdfPath);
	doc.pipe(writeStream);

	// Write content
	doc
	  .fontSize(16)
	  .text(`Evaluation Document #${docIndex}`, { underline: true });
	doc.moveDown();
	if (row.source_url) {
	  doc.fontSize(9).fillColor("gray").text(`Source URL: ${row.source_url}`);
	  doc.moveDown();
	}
	doc
	  .fontSize(10)
	  .fillColor("black")
	  .text(docText, { align: "justify", lineGap: 3 });
	doc.end();

	console.log(
	  ` Generated [${generatedCount}/${MAX_PDFS_TO_GENERATE}]: ${fileName}`,
	);
  })
  .on("end", () => {
	console.log(
	  `\n Success! ${generatedCount} PDF files created in '${OUTPUT_DIR}'`,
	);
	console.log(
	  ` You can now upload these PDFs into a dedicated 'Evaluation' project in DocuMind.`,
	);
  });
