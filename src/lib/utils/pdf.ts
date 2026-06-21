import pdfParse from "pdf-parse";

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
  const { text } = await pdfParse(buffer);

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

  // Find ITR Form type — prefer the explicit "Form Number \tITR-x" field on the acknowledgement
  // e.g. "Status \tIndividual \tForm Number \tITR-1"
  const formNumberFieldRegex = /Form\s+Number\s+(?:[^\n\t]+\t)?\s*(ITR-\d[A-Z]?)/i;
  const formNumberFieldMatch = searchSpace.match(formNumberFieldRegex);
  let itrForm: string | null = formNumberFieldMatch
    ? formNumberFieldMatch[1].toUpperCase()
    : null;

  // Fallback: use the settings-derived pattern if the dedicated field wasn't found
  if (!itrForm) {
    const itrFormPattern = settings?.itr_form_pattern || "ITR-\\d[A-Z]?|ITR-V";
    const itrFormRegex = new RegExp(`\\b(${itrFormPattern})\\b`, "i");
    const itrFormMatch = searchSpace.match(itrFormRegex);
    itrForm = itrFormMatch ? itrFormMatch[0].toUpperCase() : null;
  }

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
  // Matches "Total Income" followed by optional code (like 1A or 1) and tabs/spaces, then the amount
  const totalIncomeRegex = /total\s+income\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i;
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
  // Example matches: "(+) Tax Payable /(-) Refundable (6-7) \t8 \t(-) 60,570"
  // Let's capture the sign (+ or -) and the amount.
  const taxPayableRefundableRegex = /\(\+\)\s*Tax\s+Payable\s*\/[-\(]*\)\s*Refundable\s*(?:\([^\)]+\))?\s*(?:\t\s*\w+\s*)?\t\s*(\([+-]?\))?\s*([\d,]+(?:\.\d+)?)/i;
  const taxPayableRefundableMatch = searchSpace.match(taxPayableRefundableRegex);
  let taxPayable: number | null = null;

  if (taxPayableRefundableMatch) {
    const isRefund = taxPayableRefundableMatch[1]?.includes("-");
    const cleanAmt = taxPayableRefundableMatch[2].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    // Only update if the amount is non-zero (skip the summary row which may be 0)
    if (!isNaN(parsedAmt) && parsedAmt > 0) {
      if (isRefund) {
        refundAmount = parsedAmt;
      } else {
        taxPayable = parsedAmt;
      }
    }
  } else {
    // Fallback simple regexes if the complex line isn't present
    const taxPayableRegex = /(?:net\s+)?tax\s+payable\b\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i;
    const taxPayableMatch = searchSpace.match(taxPayableRegex);
    if (taxPayableMatch && taxPayableMatch[1]) {
      const cleanAmt = taxPayableMatch[1].replace(/,/g, "");
      const parsedAmt = parseFloat(cleanAmt);
      if (!isNaN(parsedAmt)) {
        taxPayable = parsedAmt;
      }
    }
  }

  // Attempt to extract client name
  // Usually, in ITR-V it's preceded by "Name:" or "Received from" or at the top.
  // Let's do a simple extraction from the first few lines of the searchSpace.
  const lines = searchSpace.split("\n").map((l: string) => l.trim()).filter(Boolean);
  let clientName: string | null = null;
  
  for (const line of lines) {
    // Match "Name: Value" (colon-separated) or "Name \tValue" (tab-separated, ITR-V style)
    if (/^name\s*:/i.test(line)) {
      clientName = line.replace(/^name\s*:\s*/i, "").trim();
      break;
    }
    if (/^name\s+of/i.test(line)) {
      clientName = line.replace(/^name\s+of[^:]*:\s*/i, "").trim();
      break;
    }
    // ITR-V acknowledgement: "Name \tFIRST \tLAST" — starts with "Name" followed by any whitespace
    if (/^name[\s\t]/i.test(line)) {
      clientName = line.replace(/^name\s*/i, "").replace(/\t/g, " ").trim();
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
