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

const g08Tables = [
  "refunds",
  "tax_events",
  "follow_ups",
  "communications",
  "activity_events",
  "import_jobs",
  "import_rows",
];

test("G08 creates every operational extension table", () => {
  for (const table of g08Tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
  }
});

test("G08 links records to client, workspace, and case context", () => {
  assert.match(migration, /refunds_case_context_fk/i);
  assert.match(migration, /tax_events_case_context_fk/i);
  assert.match(migration, /follow_ups_case_workspace_fk/i);
  assert.match(migration, /communications_case_workspace_fk/i);
  assert.match(migration, /activity_events_case_workspace_fk/i);
});

test("G08 enforces operational invariants", () => {
  assert.match(migration, /refunds_status_allowed/i);
  assert.match(migration, /tax_events_status_allowed/i);
  assert.match(migration, /follow_ups_status_allowed/i);
  assert.match(migration, /import_jobs_status_allowed/i);
  assert.match(migration, /refunds_amounts_nonnegative/i);
  assert.match(migration, /tax_events_amount_nonnegative/i);
  assert.match(migration, /follow_ups_excluded_rule/i);
  assert.match(migration, /refunds_received_requires_date/i);
  assert.match(migration, /import_rows_status_allowed/i);
  assert.match(migration, /import_rows_committed_rule/i);
});

test("G08 provides dashboard and workflow indexes", () => {
  assert.match(migration, /tax_events_due_idx/i);
  assert.match(migration, /follow_ups_due_idx/i);
  assert.match(migration, /communications_client_time_idx/i);
  assert.match(migration, /activity_events_workspace_time_idx/i);
  assert.match(migration, /import_rows_source_key_idx/i);
});

test("every G08 table enables RLS and denies anon grants", () => {
  for (const table of g08Tables) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"));
  }
  assert.doesNotMatch(migration, /grant\s+.+\s+to\s+anon/i);
});
