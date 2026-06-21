// @ts-expect-error pdf-parse lacks default export compatibility under bundler module resolution
import pdfParse from "pdf-parse";

export type ExtractedPdfData = {
  pan: string | null;
  assessmentYear: string | null;
  itrForm: string | null;
  clientName: string | null;
  rawText: string;
};

export async function parsePdfBuffer(buffer: Buffer): Promise<ExtractedPdfData> {
  const data = await pdfParse(buffer);
  const text = data.text;

  // Regex to extract PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const panMatch = text.match(panRegex);
  const pan = panMatch ? panMatch[0] : null;

  // Regex to extract Assessment Year (e.g. 2026-27 or 2026-2027)
  const ayRegex = /(20\d{2})[-/](\d{2,4})/;
  const ayMatch = text.match(ayRegex);
  let assessmentYear = null;
  if (ayMatch) {
    const startYear = ayMatch[1];
    let endYear = ayMatch[2];
    if (endYear.length === 4) {
      endYear = endYear.slice(2);
    }
    assessmentYear = `${startYear}-${endYear}`;
  }

  // Find ITR Form type (e.g., ITR-1, ITR-4, ITR-V, etc.)
  const itrFormRegex = /\b(ITR-\d[A-Z]?|ITR-V)\b/i;
  const itrFormMatch = text.match(itrFormRegex);
  const itrForm = itrFormMatch ? itrFormMatch[0].toUpperCase() : null;

  // Attempt to extract client name
  // Usually, in ITR-V it's preceded by "Name:" or "Received from" or at the top.
  // Let's do a simple extraction from the first few lines.
  const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
  let clientName: string | null = null;
  
  for (const line of lines) {
    if (line.toLowerCase().startsWith("name:") || line.toLowerCase().startsWith("name of")) {
      clientName = line.replace(/^(name:|name of[^:]*:)/i, "").trim();
      break;
    }
  }

  // Fallback for clientName: if we didn't find "Name:", look for lines containing PAN or near the top
  if (!clientName && lines.length > 0) {
    // Commonly the first 1-3 lines might contain client name.
    clientName = lines[0];
  }

  return {
    pan,
    assessmentYear,
    itrForm,
    clientName,
    rawText: text,
  };
}
