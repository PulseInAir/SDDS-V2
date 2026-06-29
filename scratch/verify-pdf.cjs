// node scratch/verify-pdf.cjs — verify fixed parser output
const { readFileSync } = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

async function main() {
  const pdfPath = path.join(__dirname, "../ACK502014940210626.pdf");
  const buffer = readFileSync(pdfPath);

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let text = "";
  try {
    const data = await parser.getText();
    text = data.text;
  } finally {
    await parser.destroy();
  }

  const searchSpace = text;

  // === ITR Form (fixed: prefer Form Number field) ===
  const formNumberFieldRegex = /Form\s+Number\s+(?:[^\n\t]+\t)?\s*(ITR-\d[A-Z]?)/i;
  const formNumberFieldMatch = searchSpace.match(formNumberFieldRegex);
  let itrForm = formNumberFieldMatch ? formNumberFieldMatch[1].toUpperCase() : null;
  if (!itrForm) {
    const fallback = searchSpace.match(/\b(ITR-\d[A-Z]?|ITR-V)\b/i);
    itrForm = fallback ? fallback[0].toUpperCase() : null;
  }
  console.log("ITR Form:", itrForm); // Expected: ITR-1

  // === Assessment Year ===
  const ayMatch = searchSpace.match(/(20\d{2})[-/](\d{2,4})/);
  let assessmentYear = null;
  if (ayMatch) {
    let endYear = ayMatch[2];
    if (endYear.length === 4) endYear = endYear.slice(2);
    assessmentYear = `${ayMatch[1]}-${endYear}`;
  }
  console.log("Assessment Year:", assessmentYear); // Expected: 2026-27

  // === PAN ===
  const panMatch = searchSpace.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
  console.log("PAN:", panMatch ? panMatch[0] : null); // Expected: AEDPH9905C

  // === Total Income ===
  const totalIncomeMatch = searchSpace.match(/total\s+income\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i);
  let totalIncome = null;
  if (totalIncomeMatch) {
    const amt = parseFloat(totalIncomeMatch[1].replace(/,/g, ""));
    if (!isNaN(amt)) totalIncome = amt;
  }
  console.log("Total Income:", totalIncome); // Expected: 1206000

  // === Tax Payable / Refundable ===
  const taxPayableRefundableRegex =
    /\(\+\)\s*Tax\s+Payable\s*\/[-\(]*\)\s*Refundable\s*(?:\([^\)]+\))?\s*(?:\t\s*\w+\s*)?\t\s*(\([+-]?\))?\s*([\d,]+(?:\.\d+)?)/i;
  const taxRefundMatch = searchSpace.match(taxPayableRefundableRegex);
  let refundAmount = null;
  let taxPayable = null;
  if (taxRefundMatch) {
    const isRefund = taxRefundMatch[1]?.includes("-");
    const amt = parseFloat(taxRefundMatch[2].replace(/,/g, ""));
    if (!isNaN(amt) && amt > 0) {
      if (isRefund) refundAmount = amt;
      else taxPayable = amt;
    }
  }
  console.log("Refund Amount:", refundAmount);   // Expected: 60570
  console.log("Tax Payable:", taxPayable);         // Expected: null

  // === Client Name (fixed) ===
  const lines = searchSpace.split("\n").map((l) => l.trim()).filter(Boolean);
  let clientName = null;
  for (const line of lines) {
    if (/^name\s*:/i.test(line)) { clientName = line.replace(/^name\s*:\s*/i, "").trim(); break; }
    if (/^name\s+of/i.test(line)) { clientName = line.replace(/^name\s+of[^:]*:\s*/i, "").trim(); break; }
    if (/^name\t/i.test(line)) { clientName = line.replace(/^name\s*/i, "").replace(/\t/g, " ").trim(); break; }
  }
  console.log("Client Name:", clientName); // Expected: BITUPAN HANDIQUE

  console.log("\n=== SUMMARY ===");
  console.log({ itrForm, assessmentYear, pan: panMatch?.[0], totalIncome, refundAmount, taxPayable, clientName });
}

main().catch(console.error);
