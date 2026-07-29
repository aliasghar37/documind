import fs from "fs";

const OUT_DIR = "public/charts";

function svgBarCategory(): string {
  const labels = ["Single-passage", "Multi-passage", "No answer"];
  const answered = [18, 18, 19];
  const failed = [2, 2, 1];

  const w = 600, h = 400;
  const mt = 50, mr = 40, mb = 60, ml = 60;
  const cw = w - ml - mr, ch = h - mt - mb;
  const barW = cw / 3 / 2 - 8;
  const maxVal = 22;

  let bars = "";
  labels.forEach((_, i) => {
	const cx = ml + (i + 0.5) * (cw / 3);
	const hA = (answered[i] / maxVal) * ch;
	const hR = (failed[i] / maxVal) * ch;
	bars += `<rect x="${cx - barW - 4}" y="${mt + ch - hA}" width="${barW}" height="${hA}" fill="#4CAF50" rx="3"/>`;
	bars += `<rect x="${cx + 4}" y="${mt + ch - hR}" width="${barW}" height="${hR}" fill="#f44336" rx="3"/>`;
	bars += `<text x="${cx}" y="${mt + ch + 20}" text-anchor="middle" font-size="13" fill="#333">${labels[i]}</text>`;
	bars += `<text x="${cx - barW / 2 - 4}" y="${mt + ch - hA - 6}" text-anchor="middle" font-size="12" fill="#4CAF50">${answered[i]}</text>`;
	bars += `<text x="${cx + barW / 2 + 4}" y="${mt + ch - hR - 6}" text-anchor="middle" font-size="12" fill="#f44336">${failed[i]}</text>`;
  });

  for (let v = 0; v <= maxVal; v += 5) {
	const y = mt + ch - (v / maxVal) * ch;
	bars += `<line x1="${ml - 5}" y1="${y}" x2="${ml}" y2="${y}" stroke="#ddd"/>`;
	bars += `<text x="${ml - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${v}</text>`;
  }
  bars += `<line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ch}" stroke="#ccc"/>`;
  bars += `<line x1="${ml}" y1="${mt + ch}" x2="${w - mr}" y2="${mt + ch}" stroke="#ccc"/>`;

  bars += `<rect x="${w - 180}" y="16" width="12" height="12" fill="#4CAF50" rx="2"/><text x="${w - 162}" y="27" font-size="12" fill="#333">Correct (≥3)</text>`;
  bars += `<rect x="${w - 90}" y="16" width="12" height="12" fill="#f44336" rx="2"/><text x="${w - 72}" y="27" font-size="12" fill="#333">Failed (0)</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
	<rect width="${w}" height="${h}" fill="white"/>
	<text x="${w / 2}" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#222">Correct Answers by Category</text>
	${bars}
  </svg>`;
}

function svgScoreDistribution(): string {
  const dist = [5, 0, 0, 9, 3, 43];
  const w = 600, h = 400;
  const mt = 50, mr = 40, mb = 60, ml = 60;
  const cw = w - ml - mr, ch = h - mt - mb;
  const barW = cw / 6 - 10;
  const maxVal = 48;

  const colors = ["#f44336", "#ff9800", "#ffc107", "#8bc34a", "#4CAF50", "#2e7d32"];
  let bars = "";
  dist.forEach((v, i) => {
	const bx = ml + i * (cw / 6) + (cw / 6 - barW) / 2;
	const bh = (v / maxVal) * ch;
	bars += `<rect x="${bx}" y="${mt + ch - bh}" width="${barW}" height="${bh}" fill="${colors[i]}" rx="3"/>`;
	if (v > 0) bars += `<text x="${bx + barW / 2}" y="${mt + ch - bh - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="${colors[i]}">${v}</text>`;
	bars += `<text x="${bx + barW / 2}" y="${mt + ch + 20}" text-anchor="middle" font-size="13" fill="#333">${i}</text>`;
  });

  for (let v = 0; v <= maxVal; v += 10) {
	const y = mt + ch - (v / maxVal) * ch;
	bars += `<line x1="${ml - 5}" y1="${y}" x2="${ml}" y2="${y}" stroke="#ddd"/>`;
	bars += `<text x="${ml - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${v}</text>`;
  }
  bars += `<line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ch}" stroke="#ccc"/>`;
  bars += `<line x1="${ml}" y1="${mt + ch}" x2="${w - mr}" y2="${mt + ch}" stroke="#ccc"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
	<rect width="${w}" height="${h}" fill="white"/>
	<text x="${w / 2}" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#222">Score Distribution (0–5)</text>
	<text x="${w / 2}" y="44" text-anchor="middle" font-size="12" fill="#666">0 = refused, 5 = perfect</text>
	${bars}
  </svg>`;
}

function svgPie(): string {
  const correct = 55, partial = 0, failed = 5;
  const w = 500, h = 400;
  const cx = 200, cy = 200, r = 130;

  const data = [
	{ label: "Correct (≥3)", value: correct, color: "#4CAF50" },
	{ label: "Failed (0)", value: failed, color: "#f44336" },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);
  let arcs = "";
  let startAngle = -Math.PI / 2;
  data.forEach((d) => {
	const sliceAngle = (d.value / total) * 2 * Math.PI;
	const endAngle = startAngle + sliceAngle;
	const x1 = cx + r * Math.cos(startAngle);
	const y1 = cy + r * Math.sin(startAngle);
	const x2 = cx + r * Math.cos(endAngle);
	const y2 = cy + r * Math.sin(endAngle);
	const large = sliceAngle > Math.PI ? 1 : 0;
	arcs += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${d.color}" stroke="white" stroke-width="2"/>`;
	const midAngle = startAngle + sliceAngle / 2;
	const lx = cx + (r * 0.65) * Math.cos(midAngle);
	const ly = cy + (r * 0.65) * Math.sin(midAngle);
	const pct = ((d.value / total) * 100).toFixed(1);
	arcs += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">${pct}%</text>`;
	startAngle = endAngle;
  });

  let legend = "";
  data.forEach((d, i) => {
	const ly = 30 + i * 25;
	legend += `<rect x="${w - 180}" y="${ly}" width="14" height="14" fill="${d.color}" rx="2"/>`;
	legend += `<text x="${w - 160}" y="${ly + 12}" font-size="13" fill="#333">${d.label} (${d.value})</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
	<rect width="${w}" height="${h}" fill="white"/>
	${arcs}
	${legend}
	<text x="${w / 2}" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#222">Overall Correctness</text>
  </svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(`${OUT_DIR}/category-bars.svg`, svgBarCategory());
  fs.writeFileSync(`${OUT_DIR}/score-distribution.svg`, svgScoreDistribution());
  fs.writeFileSync(`${OUT_DIR}/error-pie.svg`, svgPie());
  console.log(`Charts written to ${OUT_DIR}/`);
}

main().catch(console.error);
