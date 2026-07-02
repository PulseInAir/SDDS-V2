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

/**
 * Parse a comma-formatted Indian number string (e.g. "8,40,000") to a number.
 * Returns null if the string is empty, zero, or unparseable.
 */
function toNumber(s: string): number | null {
  if (!s) return null;
  const v = parseFloat(s.replace(/,/g, "").trim());
  return isNaN(v) || v <= 0 ? null : v;
}

/**
 * Try an ordered list of RegExp patterns against the text.
 * Returns the first successfully parsed number from the specified capture group.
 */
function firstNumericMatch(
  text: string,
  patterns: RegExp[],
  groupIndex = 1
): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    const raw = m?.[groupIndex];
    if (raw) {
      const v = toNumber(raw);
      if (v !== null) return v;
    }
  }
  return null;
}

export async function parsePdfBuffer(
  buffer: Buffer,
  settings?: {
    page_scope?: string;
    itr_form_pattern?: string;
    refund_amount_pattern?: string;
  }
): Promise<ExtractedPdfData> {
  const { text } = await pdfParse(buffer);

  // Determine search scope
  let searchSpace = text;
  if (settings?.page_scope === "first_page") {
    const pages = text.split("\f");
    if (pages.length > 0) searchSpace = pages[0];
  }

  // ── PAN ──────────────────────────────────────────────────────────────────
  // Standard PAN: 5 uppercase, 4 digits, 1 uppercase
  const pan = searchSpace.match(/[A-Z]{5}[0-9]{4}[A-Z]/)?.[0] ?? null;

  // ── Assessment Year ───────────────────────────────────────────────────────
  // Matches: "2026-27", "2026/27", "2026-2027"
  let assessmentYear: string | null = null;
  const ayMatch = searchSpace.match(/(20\d{2})[-/](\d{2,4})/);
  if (ayMatch) {
    const end = ayMatch[2].length === 4 ? ayMatch[2].slice(2) : ayMatch[2];
    assessmentYear = `${ayMatch[1]}-${end}`;
  }

  // ── ITR Form ─────────────────────────────────────────────────────────────
  let itrForm: string | null = null;
  // Look for "Form Number" first (possibly stuck together as "Form NumberITR-1")
  const itrMatch = searchSpace.match(/Form\s*Number\s*(?:[^\n\t\d]+)?(ITR-\d[A-Z]?|ITR-V)/i);
  if (itrMatch) {
    itrForm = itrMatch[1].toUpperCase();
  } else {
    // Fallback: search for any ITR Form, but exclude the standard header line
    const lines = searchSpace.split("\n");
    for (const line of lines) {
      if (line.includes("Return of Income in Form")) continue; // skip header line
      const m = line.match(/\b(ITR-\d[A-Z]?|ITR-V)\b/i);
      if (m) {
        itrForm = m[1].toUpperCase();
        break;
      }
    }
  }

  // Fallback 2: General scan if still not found
  if (!itrForm) {
    const pat = settings?.itr_form_pattern ?? "ITR-\\d[A-Z]?|ITR-V";
    itrForm =
      searchSpace
        .match(new RegExp(`\\b(${pat})\\b`, "i"))?.[1]
        ?.toUpperCase() ?? null;
  }

  // ── Total Income ─────────────────────────────────────────────────────────
  // We match "Total Income" then look for any characters up to the final number on that line
  let totalIncome: number | null = null;
  const tiMatch = searchSpace.match(/Total\s+Income[^\n\r]*?([\d,]+(?:\.\d+)?)\s*$/im) || 
                  searchSpace.match(/Total\s+Income\s*(?:[A-Z0-9]{1,4})?\s*([\d,]+(?:\.\d+)?)/i);
  if (tiMatch) {
    totalIncome = toNumber(tiMatch[1]);
  }

  // ── Tax Payable / Refundable ──────────────────────────────────────────────
  let taxPayable: number | null = null;
  let refundAmount: number | null = null;

  // Strategy 1: Parse the ITR-V summary net row specifically
  // e.g. "(+) Tax Payable /(-) Refundable (6-7)8(-) 60,570"
  // Match specifically (\(\-\)|\(\+\)) followed by spaces and a number
  const netMatch = searchSpace.match(/\(\+\)\s*Tax\s+Payable\s*\/[-\(]*\)\s*Refundable[^\n\r]*?(\(\-\)|\(\+\))\s*([\d,]+(?:\.\d+)?)/i);
  if (netMatch) {
    const sign = netMatch[1];
    const val = toNumber(netMatch[2]);
    if (sign === "(-)") {
      refundAmount = val;
    } else {
      taxPayable = val;
    }
  }

  // Strategy 2: Explicit refund lines fallback
  if (refundAmount === null) {
    const customPat = settings?.refund_amount_pattern;
    const extraPatterns: RegExp[] = customPat
      ? [new RegExp(`(?:${customPat})[^0-9\\n\\r]*(\\d[\\d,]*(?:\\.\\d+)?)`, "i")]
      : [];

    refundAmount = firstNumericMatch(searchSpace, [
      ...extraPatterns,
      /refund\s+due\s*[:\-]?\s*([\d,]{3,}(?:\.\d+)?)/i,
      /net\s+refund(?:able)?\s*[:\-]?\s*([\d,]{3,}(?:\.\d+)?)/i,
      /refundable\s+amount\s*[:\-]?\s*([\d,]{3,}(?:\.\d+)?)/i,
      /\brefund\b[^0-9\n\r]{0,20}([\d,]{4,}(?:\.\d+)?)/i,
    ]);
  }

  // Strategy 3: Explicit tax payable lines fallback
  if (taxPayable === null && refundAmount === null) {
    taxPayable = firstNumericMatch(searchSpace, [
      /(?:net\s+)?tax\s+payable\s*(?:\([^)]*\))?\s*[\t]+\s*(?:[A-Z0-9]{1,4}\s*[\t]+\s*)?([\d,]{4,}(?:\.\d+)?)/i,
      /(?:net\s+)?tax\s+payable\s*(?:\([^)]*\))?\s{2,}(?:[A-Z0-9]{1,4}\s{2,})?\s*([\d,]{4,}(?:\.\d+)?)/i,
      /(?:net\s+)?tax\s+payable\s*[:\-]\s*([\d,]{3,}(?:\.\d+)?)/i,
      /(?:net\s+)?tax\s+payable[^\d\n\r]{0,40}([\d]{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d{5,}(?:\.\d+)?)/i,
    ]);
  }

  // ── Client Name ───────────────────────────────────────────────────────────
  let clientName: string | null = null;
  // Match "Name" followed by colon, spaces, or capital letter (stuck together), then name characters, up to newline or "Address" or "PAN"
  const nameMatch = searchSpace.match(/Name(?:\s*:\s*|\s+|(?=[A-Z]))([A-Z\t ]{3,60})/i);
  if (nameMatch) {
    clientName = nameMatch[1].trim();
  }

  // Final fallback: first non-empty line that doesn't look like metadata
  if (!clientName) {
    const lines = searchSpace
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const nonNamePatterns = [
      /acknowledgement/i,
      /^\d{10,}/, // pure numeric (ack number)
      /[A-Z]{5}\d{4}[A-Z]/, // PAN on its own
      /date\s+of\s+filing/i,
      /income\s+tax/i,
      /assessment\s+year/i,
      /form\s+number/i,
      /e-filing/i,
      /^\d{2}[-/]\w{3}[-/]\d{4}/, // date string
      /Return\s+of\s+Income/i, // Skip the standard ITR-V header line
      /Please\s+see\s+Rule/i, // Skip standard rule line
      /DO\s+NOT\s+SEND/i,
      /System\s+Generated/i,
      /Barcode/i,
    ];

    for (const line of lines) {
      const isNonName = nonNamePatterns.some((p) => p.test(line));
      // Must contain at least two word characters (a real name has letters)
      if (!isNonName && /[A-Za-z]{2,}/.test(line)) {
        clientName = line;
        break;
      }
    }
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
