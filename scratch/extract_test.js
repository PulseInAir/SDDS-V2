const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const pdfPath = path.join('d:\\Websites\\SDDS-V2', 'ACK502014940210626.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const data = await parser.getText();
    console.log("=== RAW TEXT EXTRACTED ===");
    console.log(data.text);
    console.log("=== END OF RAW TEXT ===");
  } catch (err) {
    console.error(err);
  } finally {
    await parser.destroy();
  }
}

main();
