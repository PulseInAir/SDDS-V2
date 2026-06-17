import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G20 workspace invoices route wires create + register views", async () => {
  const page = await read("src/app/(app)/invoices/page.tsx");

  assert.match(page, /InvoiceCreateForm/);
  assert.match(page, /InvoicePageContent/);
  assert.match(page, /getInvoicesModuleData/);
});

test("G20 client invoice tab replaces placeholder with the real module", async () => {
  const page = await read("src/app/(app)/clients/[clientId]/invoices/page.tsx");

  assert.match(page, /getClientInvoicesModuleData/);
  assert.match(page, /InvoiceCreateForm/);
  assert.doesNotMatch(page, /This module will track billing/);
});

test("G20 invoice detail view includes issue, payment, and print affordances", async () => {
  const detailComponent = await read("src/components/invoices/InvoiceDetailContent.tsx");

  assert.match(detailComponent, /IssueInvoiceForm/);
  assert.match(detailComponent, /PaymentForm/);
  assert.match(detailComponent, /PrintInvoiceButton/);
  assert.match(detailComponent, /Legal invoice identity, GST treatment/);
});
