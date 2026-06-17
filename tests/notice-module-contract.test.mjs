import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G22 workspace notices route wires create + register views", async () => {
  const page = await read("src/app/(app)/notices/page.tsx");

  assert.match(page, /TaxEventCreateForm/);
  assert.match(page, /TaxEventPageContent/);
  assert.match(page, /getNoticesModuleData/);
});

test("G22 client notices tab replaces the placeholder with the real module", async () => {
  const page = await read("src/app/(app)/clients/[clientId]/notices/page.tsx");

  assert.match(page, /getClientNoticesModuleData/);
  assert.match(page, /TaxEventCreateForm/);
  assert.doesNotMatch(page, /This module will handle tax notices/);
});

test("G22 notices content exposes due dates, response fields, document context, and closure updates", async () => {
  const content = await read("src/components/notices/TaxEventPageContent.tsx");
  const updateForm = await read("src/components/notices/TaxEventUpdateForm.tsx");

  assert.match(content, /Documents/);
  assert.match(content, /Due \{formatTaxEventDate\(event\.response_due_date\)\}/);
  assert.match(updateForm, /responseDueDate/);
  assert.match(updateForm, /submissionDate/);
  assert.match(updateForm, /closureDate/);
  assert.match(updateForm, /referenceNumber/);
});
