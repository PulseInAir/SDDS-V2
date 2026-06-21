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
  // Primary: dedicated "Form Number" field (ITR-V acknowledgement header)
  // e.g. "Form Number  ITR-1" or "Form Number \tITR-1\t"
  let itrForm: string | null =
    searchSpace
      .match(/Form\s+Number\s+(?:[^\n\t]+\t)?\s*(ITR-\d[A-Z]?)/i)?.[1]
      ?.toUpperCase() ?? null;

  // Fallback: any ITR-x mention (ITR-1 through ITR-7, ITR-V, etc.)
  if (!itrForm) {
    const pat = settings?.itr_form_pattern ?? "ITR-\\d[A-Z]?|ITR-V";
    itrForm =
      searchSpace
        .match(new RegExp(`\\b(${pat})\\b`, "i"))?.[1]
        ?.toUpperCase() ?? null;
  }

  // ── Total Income ─────────────────────────────────────────────────────────
  // ITR-V PDFs may use tabs, 2+ spaces, or colons between label and value.
  // The label may be followed by an optional field code like "(1A)" or "1A".
  const totalIncome = firstNumericMatch(searchSpace, [
    // Tab-separated with optional row code: "Total Income \t 1A \t 8,40,000"
    /total\s+income\s*(?:\([^)]*\))?\s*[\t]+\s*(?:[A-Z0-9]{1,4}\s*[\t]+\s*)?([\d,]{4,}(?:\.\d+)?)/i,
    // Multi-space-separated with optional row code
    /total\s+income\s*(?:\([^)]*\))?\s{2,}(?:[A-Z0-9]{1,4}\s{2,})?\s*([\d,]{4,}(?:\.\d+)?)/i,
    // Colon or dash separator
    /total\s+income\s*[:\-]\s*([\d,]{4,}(?:\.\d+)?)/i,
    // Most permissive: any non-digit non-newline chars between label and amount
    // Require >=4 chars in the number to avoid row codes like "1A" or "18"
    /total\s+income[^\d\n\r]{0,40}([\d]{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d{5,}(?:\.\d+)?)/i,
  ]);

  // ── Tax Payable / Refundable ──────────────────────────────────────────────
  let taxPayable: number | null = null;
  let refundAmount: number | null = null;

  // Strategy 1: Parse the ITR-V summary row
  // "(+) Tax Payable /(-) Refundable (6-7)  8  (-) 60,570"
  // OR "(+) Tax Payable /(-) Refundable  (+) 45,000"
  const summaryLine = searchSpace.match(
    /\(\+\)\s*Tax\s+Payable\s*\/\s*\(-\)\s*Refundable[^\n]*/i
  )?.[0];

  if (summaryLine) {
    // Collect all (sign)number pairs on this line
    const pairs = [...summaryLine.matchAll(/\(([+\-])\)\s*([\d,]+(?:\.\d+)?)/g)];
    if (pairs.length > 0) {
      // The LAST pair is the net figure (earlier ones are intermediate calculations)
      const last = pairs[pairs.length - 1];
      const sign = last[1];
      const val = toNumber(last[2]);
      if (val !== null) {
        if (sign === "-") refundAmount = val;
        else taxPayable = val;
      }
    } else {
      // No (sign) pairs — find the last number on the line
      const nums = [...summaryLine.matchAll(/([\d,]{3,}(?:\.\d+)?)/g)];
      if (nums.length > 0) {
        const val = toNumber(nums[nums.length - 1][1]);
        // Determine sign by checking for a bare minus before the last number
        const tail = summaryLine.split(/Refundable/i).pop() ?? "";
        if (/\(\-\)|[\-]\s+[\d]/.test(tail) && val !== null) refundAmount = val;
        else if (val !== null) taxPayable = val;
      }
    }
  }

  // Strategy 2: Explicit refund lines
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

  // Strategy 3: Explicit tax payable lines (only if the summary row didn't resolve it)
  if (taxPayable === null) {
    taxPayable = firstNumericMatch(searchSpace, [
      // Tab-separated with optional row code
      /(?:net\s+)?tax\s+payable\s*(?:\([^)]*\))?\s*[\t]+\s*(?:[A-Z0-9]{1,4}\s*[\t]+\s*)?([\d,]{4,}(?:\.\d+)?)/i,
      // Multi-space
      /(?:net\s+)?tax\s+payable\s*(?:\([^)]*\))?\s{2,}(?:[A-Z0-9]{1,4}\s{2,})?\s*([\d,]{4,}(?:\.\d+)?)/i,
      // Colon/dash
      /(?:net\s+)?tax\s+payable\s*[:\-]\s*([\d,]{3,}(?:\.\d+)?)/i,
      // Most permissive
      /(?:net\s+)?tax\s+payable[^\d\n\r]{0,40}([\d]{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d{5,}(?:\.\d+)?)/i,
    ]);
  }

  // ── Mutual exclusivity enforcement ───────────────────────────────────────
  // refundAmount and taxPayable cannot both be non-null.
  // The summary-row parse (Strategy 1) is authoritative; if refundAmount was
  // set there, any taxPayable found by Strategy 3 is a false positive.
  if (refundAmount !== null && taxPayable !== null) {
    taxPayable = null; // refund case — discard the taxPayable false positive
  }

  // ── Client Name ───────────────────────────────────────────────────────────
  const lines = searchSpace
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);

  // Patterns that indicate a line is NOT a person's name (used in fallback)
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
  ];

  let clientName: string | null = null;
  for (const line of lines) {
    // Explicit "Name:" or "Name of assessee:" label
    if (/^name\s*:/i.test(line)) {
      clientName = line.replace(/^name\s*:\s*/i, "").trim();
      break;
    }
    if (/^name\s+of/i.test(line)) {
      clientName = line.replace(/^name\s+of[^:]*:\s*/i, "").trim();
      break;
    }
    // ITR-V acknowledgement: "Name  FIRST LAST" or "Name\tFIRST\tLAST"
    if (/^name[\s\t]/i.test(line)) {
      clientName = line.replace(/^name\s*/i, "").replace(/\t/g, " ").trim();
      break;
    }
  }

  // Final fallback: first non-empty line that doesn't look like metadata
  if (!clientName) {
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
