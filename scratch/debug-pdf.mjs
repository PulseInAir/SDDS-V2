// Run with: node scratch/debug-pdf.mjs
// Uses the same pdf-parse library as the app

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically import pdf-parse
const pdfParseModule = await import("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

const pdfPath = join(__dirname, "../ACK502014940210626.pdf");
const buffer = readFileSync(pdfPath);

try {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  console.log("=== RAW PDF TEXT (first 5000 chars) ===\n");
  console.log(text.substring(0, 5000));
  console.log("\n=== END RAW TEXT ===\n");
  
  // Show individual lines
  const lines = text.split("\n").map((l, i) => `[${i}]: ${JSON.stringify(l)}`);
  console.log("\n=== LINE-BY-LINE (first 100 lines) ===\n");
  lines.slice(0, 100).forEach(l => console.log(l));
  
  // Test current regex patterns
  console.log("\n=== REGEX TESTS ===\n");
  
  // ITR form
  const itrFormRegex = /\b(ITR-\d[A-Z]?|ITR-V)\b/i;
  const itrMatch = text.match(itrFormRegex);
  console.log("ITR Form match:", itrMatch ? itrMatch[0] : "NO MATCH");
  
  // Assessment Year
  const ayRegex = /(20\d{2})[-/](\d{2,4})/;
  const ayMatch = text.match(ayRegex);
  console.log("Assessment Year match:", ayMatch ? ayMatch[0] : "NO MATCH");
  
  // PAN
  const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  const panMatch = text.match(panRegex);
  console.log("PAN match:", panMatch ? panMatch[0] : "NO MATCH");
  
  // Total Income
  const totalIncomeRegex = /total\s+income\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i;
  const totalIncomeMatch = text.match(totalIncomeRegex);
  console.log("Total Income (tab-based) match:", totalIncomeMatch ? totalIncomeMatch[1] : "NO MATCH");
  
  // Tax Payable/Refundable complex
  const taxPayableRefundableRegex = /\(\+\)\s*Tax\s+Payable\s*\/[-\(]*\)\s*Refundable\s*(?:\([^\)]+\))?\s*(?:\t\s*\w+\s*)?\t\s*(\([+-]?\))?\s*([\d,]+(?:\.\d+)?)/i;
  const taxRefundMatch = text.match(taxPayableRefundableRegex);
  console.log("Tax Payable/Refundable (complex) match:", taxRefundMatch ? JSON.stringify(taxRefundMatch.slice(0, 3)) : "NO MATCH");
  
  // Simple tax payable fallback
  const taxPayableRegex = /(?:net\s+)?tax\s+payable\b\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i;
  const taxPayMatch = text.match(taxPayableRegex);
  console.log("Tax Payable (simple) match:", taxPayMatch ? taxPayMatch[1] : "NO MATCH");
  
  // Refund
  const refundRegex = /(?:refund\s*due|refund|refundable)\b\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i;
  const refundMatch = text.match(refundRegex);
  console.log("Refund (current) match:", refundMatch ? refundMatch[1] : "NO MATCH");
  
  // Show all lines containing key words
  console.log("\n=== LINES WITH KEY WORDS ===\n");
  const keywords = ["total income", "tax payable", "refund", "itr", "acknowledgement", "form", "₹", "rs.", "income"];
  for (const kw of keywords) {
    const matching = lines.filter(l => l.toLowerCase().includes(kw));
    if (matching.length > 0) {
      console.log(`\n--- "${kw}" ---`);
      matching.slice(0, 10).forEach(l => console.log(l));
    }
  }

} catch (err) {
  console.error("Error parsing PDF:", err.message);
  console.error(err.stack);
}
