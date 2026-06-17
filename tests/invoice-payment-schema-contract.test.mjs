import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("../supabase/migrations/", import.meta.url);
const sql = (
  await Promise.all(
    (await readdir(directory))
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => readFile(new URL(name, directory), "utf8")),
  )
).join("\n");

for (const table of ["invoice_sequences", "invoices", "invoice_items", "payments"]) {
  test(`G07 creates and secures ${table}`, () => {
    assert.match(sql, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
}

test("invoice numbers are allocated atomically by workspace and assessment year", () => {
  assert.match(sql, /on conflict \(workspace_id, assessment_year_id\)/i);
  assert.match(sql, /next_serial = public\.invoice_sequences\.next_serial \+ 1/i);
  assert.match(sql, /'SDDS\/ITR\/' \|\| assessment_year_label \|\| '\/' \|\| allocated_serial::text/i);
  assert.match(sql, /invoices_serial_unique/i);
});

test("invoice items reconcile stored totals", () => {
  assert.match(sql, /line_amount numeric\(14,2\) generated always/i);
  assert.match(sql, /invoice_items_recalculate/i);
  assert.match(sql, /invoices_total_reconciles/i);
  assert.match(sql, /discount cannot exceed invoice subtotal/i);
});

test("payments prevent overpayment and support explicit reversal", () => {
  assert.match(sql, /payment would exceed invoice total/i);
  assert.match(sql, /payments_reversal_after_creation/i);
  assert.match(sql, /payments_reconcile/i);
  assert.doesNotMatch(sql, /grant\s+[^;]*delete[^;]*on table public\.payments/i);
});

test("issued invoice financial identity is immutable", () => {
  assert.match(sql, /issued invoice financials are immutable/i);
  assert.match(sql, /invoice items may change only while invoice is draft/i);
  assert.match(sql, /invoice identity and ownership are immutable/i);
});

test("default due date and controlled statuses are enforced", () => {
  assert.match(sql, /new\.due_date := new\.issue_date \+ 30/i);
  assert.match(sql, /invoices_status_allowed/i);
  assert.match(sql, /partially paid status does not match payments/i);
  assert.match(sql, /paid status does not match payments/i);
});

test("authenticated grants are least privilege", () => {
  assert.match(sql, /grant update \(reversed_at\) on table public\.payments to authenticated/i);
  assert.match(sql, /grant update \(description, quantity, unit_amount, display_order\) on table public\.invoice_items to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+update\s+on table public\.payments to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+delete\s+on table public\.invoices to authenticated/i);
});
