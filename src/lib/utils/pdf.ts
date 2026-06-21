import { PDFParse } from "pdf-parse";

export type ExtractedPdfData = {
  pan: string | null;
  assessmentYear: string | null;
  itrForm: string | null;
  clientName: string | null;
  refundAmount: number | null;
  totalIncome: number | null;
  taxPayable: number | null;
  rawText: string;
};

export async function parsePdfBuffer(
  buffer: Buffer,
  settings?: {
    page_scope?: string;
    itr_form_pattern?: string;
    refund_amount_pattern?: string;
  }
): Promise<ExtractedPdfData> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let text = "";
  try {
    const data = await parser.getText();
    text = data.text;
  } finally {
    await parser.destroy();
  }

  // 1. Determine search space based on page scope settings
  let searchSpace = text;
  if (settings?.page_scope === "first_page") {
    const pages = text.split("\f");
    if (pages.length > 0) {
      searchSpace = pages[0];
    }
  }

  // Regex to extract PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const panMatch = searchSpace.match(panRegex);
  const pan = panMatch ? panMatch[0] : null;

  // Regex to extract Assessment Year (e.g. 2026-27 or 2026-2027)
  const ayRegex = /(20\d{2})[-/](\d{2,4})/;
  const ayMatch = searchSpace.match(ayRegex);
  let assessmentYear = null;
  if (ayMatch) {
    const startYear = ayMatch[1];
    let endYear = ayMatch[2];
    if (endYear.length === 4) {
      endYear = endYear.slice(2);
    }
    assessmentYear = `${startYear}-${endYear}`;
  }

  // Find ITR Form type using settings-derived pattern
  const itrFormPattern = settings?.itr_form_pattern || "ITR-\\d[A-Z]?|ITR-V";
  const itrFormRegex = new RegExp(`\\b(${itrFormPattern})\\b`, "i");
  const itrFormMatch = searchSpace.match(itrFormRegex);
  const itrForm = itrFormMatch ? itrFormMatch[0].toUpperCase() : null;

  // Attempt to extract Refund amount using settings-derived pattern
  const refundAmountPattern = settings?.refund_amount_pattern || "refund\\s*due|refund|refundable";
  const refundRegex = new RegExp(`(?:${refundAmountPattern})\\b\\s*[:\\-]?\\s*([\\d,]+(?:\\.\\d+)?)`, "i");
  const refundMatch = searchSpace.match(refundRegex);
  let refundAmount: number | null = null;
  if (refundMatch && refundMatch[1]) {
    const cleanAmt = refundMatch[1].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    if (!isNaN(parsedAmt)) {
      refundAmount = parsedAmt;
    }
  }

  // Attempt to extract Total Income
  // Typically "Total Income" or "Gross Total Income" or "Total Income / Taxable Income" followed by a number
  const totalIncomeRegex = /total\s+income\b\s*[:\-\u2013\u2014]?\s*([\d,]+(?:\.\d+)?)/i;
  const totalIncomeMatch = searchSpace.match(totalIncomeRegex);
  let totalIncome: number | null = null;
  if (totalIncomeMatch && totalIncomeMatch[1]) {
    const cleanAmt = totalIncomeMatch[1].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    if (!isNaN(parsedAmt)) {
      totalIncome = parsedAmt;
    }
  }

  // Attempt to extract Tax Payable / Refundable
  // Tax Payable/Refundable is often written as "Net tax payable", "tax payable", "refundable", "amount payable", or "refund/payable"
  // Let's search for "tax payable" or "refundable" or "refund" specifically in lines or text.
  // Note: if refundAmount is parsed, that is the refundable amount (or if negative, payable).
  // Let's scan for "tax payable", "net tax payable", "amount payable"
  const taxPayableRegex = /(?:net\s+)?tax\s+payable\b\s*[:\-\u2013\u2014]?\s*([\d,]+(?:\.\d+)?)/i;
  const taxPayableMatch = searchSpace.match(taxPayableRegex);
  let taxPayable: number | null = null;
  if (taxPayableMatch && taxPayableMatch[1]) {
    const cleanAmt = taxPayableMatch[1].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    if (!isNaN(parsedAmt)) {
      taxPayable = parsedAmt;
    }
  }

  // Attempt to extract client name
  // Usually, in ITR-V it's preceded by "Name:" or "Received from" or at the top.
  // Let's do a simple extraction from the first few lines of the searchSpace.
  const lines = searchSpace.split("\n").map((l: string) => l.trim()).filter(Boolean);
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
    refundAmount,
    totalIncome,
    taxPayable,
    rawText: text,
  };
}
