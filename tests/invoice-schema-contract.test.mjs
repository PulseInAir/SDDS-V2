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
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"));
  });
}

test("invoice numbering is database allocated and AY scoped", () => {
  assert.match(sql, /private\.allocate_invoice_number/i);
  assert.match(sql, /on conflict \(workspace_id, assessment_year_id\)/i);
  assert.match(sql, /SDDS\/ITR\//i);
  assert.match(sql, /invoices_serial_unique/i);
  assert.match(sql, /invoice_sequences_assessment_year_workspace_fk/i);
});

test("invoice due date and financial reconciliation are constrained", () => {
  assert.match(sql, /new\.issue_date \+ 30/i);
  assert.match(sql, /invoices_due_date_valid/i);
  assert.match(sql, /invoices_total_reconciles/i);
  assert.match(sql, /invoices_balance_reconciles/i);
  assert.match(sql, /invoices_discount_not_over_subtotal/i);
});

test("line items calculate amounts and can change only while draft", () => {
  assert.match(sql, /generated always as \(round\(quantity \* unit_amount, 2\)\) stored/i);
  assert.match(sql, /invoice items may only change while invoice is draft/i);
  assert.match(sql, /invoice_items_recalculate/i);
});

test("payments support partial collection without silent overpayment", () => {
  assert.match(sql, /payments_mode_allowed/i);
  assert.match(sql, /mode in \('cash','upi'\)/i);
  assert.match(sql, /payment would exceed invoice total/i);
  assert.match(sql, /where payment\.reversed_at is null/i);
  assert.match(sql, /payments_recalculate/i);
});

test("financial history has no destructive authenticated delete grants", () => {
  assert.doesNotMatch(sql, /grant\s+[^;]*delete[^;]*on table public\.(invoices|invoice_items|payments)/i);
  assert.doesNotMatch(sql, /create policy\s+\S+\s+on public\.(invoices|invoice_items|payments)\s+for delete/i);
});

test("atomic and reconciliation helpers remain private and pinned", () => {
  for (const fn of [
    "allocate_invoice_number",
    "normalize_invoice_state",
    "recalculate_invoice_items",
    "validate_payment_change",
    "recalculate_invoice_payments",
  ]) {
    assert.match(sql, new RegExp(`create or replace function private\\.${fn}[\\s\\S]*?set search_path = ''`, "i"));
  }
  assert.doesNotMatch(sql, /create or replace function public\.(allocate_invoice_number|recalculate_invoice_payments)/i);
});
