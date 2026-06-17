import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((filename) => filename.endsWith(".sql"))
  .sort();
const migration = (
  await Promise.all(
    migrationFiles.map((filename) =>
      readFile(new URL(filename, migrationsDirectory), "utf8"),
    ),
  )
).join("\n");

test("G07 creates invoice, item, payment, and sequence tables", () => {
  for (const table of ["invoice_sequences", "invoices", "invoice_items", "payments"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
  }
});

test("invoice identity is database-allocated and placeholder defaults are removed", () => {
  assert.match(migration, /create or replace function private\.prepare_invoice/i);
  assert.match(migration, /invoice identity is allocated by the database/i);
  assert.match(migration, /alter column invoice_number drop default/i);
  assert.match(migration, /alter column serial_number drop default/i);
});

test("financial constraints enforce numbering, due dates, totals, and overpayment prevention", () => {
  for (const marker of [
    "invoices_status_allowed",
    "invoices_due_date_order",
    "invoices_total_reconciles",
    "invoice_sequences_next_serial_positive",
    "payments_amount_positive",
    "payments_mode_allowed",
    "payment would exceed invoice total",
  ]) {
    assert.match(migration, new RegExp(marker, "i"));
  }
});

test("invoice item edits are draft-only and line totals are recalculated", () => {
  assert.match(migration, /invoice items may change only while invoice is draft/i);
  assert.match(migration, /new\.line_amount := round\(new\.quantity \* new\.unit_amount, 2\)/i);
  assert.match(migration, /create trigger invoice_items_recalculate/i);
});

test("invoice payment status reconciliation uses active non-reversed payments", () => {
  assert.match(migration, /create or replace function private\.active_invoice_paid_amount/i);
  assert.match(migration, /reconcile_invoice_payment_status/i);
  assert.match(migration, /reversed_at is null/i);
  assert.match(migration, /next_status := 'paid'/i);
  assert.match(migration, /next_status := 'partially_paid'/i);
  assert.match(migration, /next_status := 'overdue'/i);
});

test("G07 RLS grants least privilege to authenticated users", () => {
  for (const table of ["invoice_sequences", "invoices", "invoice_items", "payments"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"),
    );
  }

  assert.doesNotMatch(migration, /grant\s+[^;]*delete[^;]*on table public\.(invoices|payments)/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*update[^;]*on table public\.(invoices|payments) to authenticated/i);
});
