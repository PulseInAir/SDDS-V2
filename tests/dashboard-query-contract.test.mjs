import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G26 dashboard contract defines every locked metric with a concrete destination", async () => {
  const contracts = await read("src/lib/dashboard/contracts.ts");

  for (const metricId of [
    "active_clients",
    "new_yet_to_start",
    "filed",
    "attention_cases",
    "refunds_pending",
    "notices_due",
    "billed",
    "received",
    "outstanding",
    "overdue",
    "follow_ups_due",
  ]) {
    assert.match(contracts, new RegExp(`id: "${metricId}"`));
  }

  assert.match(contracts, /destination: "\/filing-queue\?scope=attention"/);
  assert.match(contracts, /destination: "\/invoices\?scope=billed"/);
  assert.match(contracts, /destination: "\/invoices\?scope=received"/);
  assert.match(contracts, /destination: "\/invoices\?scope=outstanding"/);
  assert.match(contracts, /destination: "\/invoices\?scope=overdue"/);
  assert.match(contracts, /destination: "\/refunds\?unresolvedOnly=true"/);
  assert.match(contracts, /destination: "\/notices\?attentionOnly=true&unresolvedOnly=true"/);
  assert.match(contracts, /destination: "\/follow-up\?attentionOnly=true"/);
});

test("G26 dashboard metric helpers reconcile workflow, document, financial, refund, notice, and follow-up sources", async () => {
  const contracts = await read("src/lib/dashboard/contracts.ts");

  assert.match(contracts, /countAttentionCases/);
  assert.match(contracts, /summarizeInvoices/);
  assert.match(contracts, /deriveRefundAttention/);
  assert.match(contracts, /deriveTaxEventAttention/);
  assert.match(contracts, /deriveFollowUpAttention/);
  assert.match(contracts, /getDashboardWorkflowDistribution/);
  assert.match(contracts, /deriveDashboardMetrics/);
});

test("G26 dashboard destinations are wired into filing queue, documents, and invoices route filters", async () => {
  const filingQueuePage = await read("src/app/(app)/filing-queue/page.tsx");
  const casesAction = await read("src/lib/actions/cases.ts");
  const documentsPage = await read("src/app/(app)/documents/page.tsx");
  const documentsAction = await read("src/lib/actions/documents.ts");
  const invoicesPage = await read("src/app/(app)/invoices/page.tsx");
  const invoicesAction = await read("src/lib/actions/invoices.ts");

  assert.match(filingQueuePage, /const scope = typeof params\.scope === 'string' \? params\.scope : ''/);
  assert.match(casesAction, /scope\?: string;/);
  assert.match(casesAction, /scope !== 'attention'/);

  assert.match(documentsPage, /scope: typeof params\.scope === "string" \? params\.scope : ""/);
  assert.match(documentsAction, /filters\.scope === "exceptions"/);

  assert.match(invoicesPage, /scope: typeof params\.scope === "string" \? params\.scope : ""/);
  assert.match(invoicesAction, /filters\.scope === "billed"/);
  assert.match(invoicesAction, /filters\.scope === "received"/);
  assert.match(invoicesAction, /filters\.scope === "outstanding"/);
  assert.match(invoicesAction, /filters\.scope === "overdue"/);
});
