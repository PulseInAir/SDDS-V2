const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// Basic mockup of pdf parser logic
async function runParser() {
  const pdfPath = path.join('d:\\Websites\\SDDS-V2', 'ACK502014940210626.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const data = await parser.getText();
  await parser.destroy();
  
  const searchSpace = data.text;
  
  // Total Income
  const totalIncomeRegex = /total\s+income\s*(?:\t\s*\w+\s*)?\t\s*([\d,]+(?:\.\d+)?)/i;
  const totalIncomeMatch = searchSpace.match(totalIncomeRegex);
  let totalIncome = null;
  if (totalIncomeMatch) {
    totalIncome = parseFloat(totalIncomeMatch[1].replace(/,/g, ""));
  }

  // Tax Payable / Refundable
  const taxPayableRefundableRegex = /\(\+\)\s*Tax\s+Payable\s*\/[-\(]*\)\s*Refundable\s*(?:\([^\)]+\))?\s*(?:\t\s*\w+\s*)?\t\s*(\([+-]?\))?\s*([\d,]+(?:\.\d+)?)/i;
  const taxPayableRefundableMatch = searchSpace.match(taxPayableRefundableRegex);
  let taxPayable = null;
  let refundAmount = null;
  
  if (taxPayableRefundableMatch) {
    const isRefund = taxPayableRefundableMatch[1] && taxPayableRefundableMatch[1].includes("-");
    const parsedAmt = parseFloat(taxPayableRefundableMatch[2].replace(/,/g, ""));
    if (isRefund) {
      refundAmount = parsedAmt;
    } else {
      taxPayable = parsedAmt;
    }
  }

  console.log("Extracted values:");
  console.log("Total Income:", totalIncome);
  console.log("Refund Amount:", refundAmount);
  console.log("Tax Payable:", taxPayable);
}

runParser();
