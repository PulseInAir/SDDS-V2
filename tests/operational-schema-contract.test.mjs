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

const operationalTables = [
  "refunds",
  "tax_events",
  "follow_ups",
  "communications",
  "activity_events",
  "audit_events",
  "import_jobs",
  "import_rows",
];

test("G08 creates the remaining operational tables", () => {
  for (const table of operationalTables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
  }
});

test("refund and tax-event lifecycles use controlled minimum states", () => {
  for (const marker of [
    "refunds_status_allowed",
    "refunds_received_state_consistent",
    "tax_events_type_allowed",
    "tax_events_status_allowed",
    "tax_events_closure_consistent",
    "tax_events_due_date_order",
  ]) {
    assert.match(migration, new RegExp(marker, "i"));
  }
});

test("tax-event documents retain case-scoped ownership and immutable identity", () => {
  assert.match(migration, /add column tax_event_id uuid/i);
  assert.match(migration, /documents_tax_event_workspace_fk/i);
  assert.match(migration, /documents_case_required_for_tax_event/i);
  assert.match(migration, /old\.tax_event_id[\s\S]*new\.tax_event_id/i);
  assert.match(migration, /documents_validate_operational_context/i);
});

test("follow-up, communication, and activity case context is validated", () => {
  assert.match(migration, /create or replace function private\.validate_follow_up_case_context/i);
  assert.match(migration, /follow-up case does not match supplied client and assessment year/i);
  assert.match(migration, /create or replace function private\.validate_client_case_context/i);
  assert.match(migration, /case does not belong to the supplied workspace and client/i);
  assert.match(migration, /activity_events_workspace_fk/i);
});

test("communications and event histories are append-only", () => {
  assert.match(migration, /create or replace function private\.prevent_append_only_mutation/i);
  for (const trigger of [
    "communications_append_only",
    "activity_events_append_only",
    "audit_events_append_only",
  ]) {
    assert.match(migration, new RegExp(`create trigger ${trigger}`, "i"));
  }
});

test("import jobs and rows enforce validation and commit reconciliation", () => {
  for (const marker of [
    "import_jobs_counts_reconcile",
    "import_jobs_completion_consistent",
    "import_rows_job_row_unique",
    "import_rows_invalid_has_errors",
    "import_rows_committed_has_target",
  ]) {
    assert.match(migration, new RegExp(marker, "i"));
  }
});

test("G08 enables RLS and revokes broad table privileges", () => {
  for (const table of operationalTables) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
    assert.match(
      migration,
      new RegExp(
        `revoke all on table public\\.${table} from public, anon, authenticated, service_role`,
        "i",
      ),
    );
  }
});

test("append-only activity and audit writes remain trusted-server operations", () => {
  assert.match(migration, /grant select on table public\.activity_events to authenticated/i);
  assert.match(migration, /grant select on table public\.audit_events to authenticated/i);
  assert.doesNotMatch(
    migration,
    /grant\s+[^;]*insert[^;]*on table public\.(activity_events|audit_events) to authenticated/i,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+[^;]*(update|delete)[^;]*on table public\.(communications|activity_events|audit_events)/i,
  );
});
