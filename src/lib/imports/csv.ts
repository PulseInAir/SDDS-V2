export function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (inQuotes) {
    throw new Error("The CSV file contains an unclosed quoted value.");
  }

  currentRow.push(currentCell);
  if (currentRow.some((value) => value.length > 0)) {
    rows.push(currentRow);
  }

  return rows.map((row) => row.map((value) => value.trim()));
}

export const CSV_HEADERS = [
  "client_full_name",
  "pan",
  "date_of_birth",
  "mobile",
  "email",
  "address",
  "family_group",
  "assessment_year",
  "case_status",
  "return_category",
  "next_action",
  "due_date",
  "expected_completion_date",
  "blocker_code",
  "blocker_note",
  "follow_up_excluded",
  "filing_kind",
  "filing_date",
  "acknowledgement_number",
  "verification_status",
  "verification_date",
  "processing_status",
  "filing_notes",
  "source_invoice_reference",
  "invoice_issue_date",
  "invoice_due_date",
  "invoice_item_description",
  "invoice_item_quantity",
  "invoice_item_unit_amount",
  "invoice_discount_amount",
  "invoice_notes",
  "payment_date",
  "payment_amount",
  "payment_mode",
  "payment_reference",
  "payment_note",
] as const;
