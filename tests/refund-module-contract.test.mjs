import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G21 workspace refunds route wires create + register views", async () => {
  const page = await read("src/app/(app)/refunds/page.tsx");

  assert.match(page, /RefundCreateForm/);
  assert.match(page, /RefundPageContent/);
  assert.match(page, /getRefundsModuleData/);
});

test("G21 client refunds tab replaces placeholder with the real module", async () => {
  const page = await read("src/app/(app)/clients/[clientId]/refunds/page.tsx");

  assert.match(page, /getClientRefundsModuleData/);
  assert.match(page, /RefundCreateForm/);
  assert.doesNotMatch(page, /This module will track expected refunds/);
});

test("G21 refund page content exposes statuses, amounts, dates, and next-action updates", async () => {
  const content = await read("src/components/refunds/RefundPageContent.tsx");
  const updateForm = await read("src/components/refunds/RefundUpdateForm.tsx");

  assert.match(content, /Expected/);
  assert.match(content, /Received/);
  assert.match(content, /Pending/);
  assert.match(updateForm, /nextAction/);
  assert.match(updateForm, /receivedDate/);
  assert.match(updateForm, /expectedAmount/);
});
