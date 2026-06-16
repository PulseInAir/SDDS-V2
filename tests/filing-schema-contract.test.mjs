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

const tables = ["filing_cases", "filing_records", "case_status_history"];

test("G05 creates separate case, filing-record, and status-history tables", () => {
  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
  }
});

test("one active case per workspace, client, and assessment year is enforced", () => {
  assert.match(migration, /filing_cases_one_active_per_client_ay_idx/i);
  assert.match(
    migration,
    /on public\.filing_cases \(workspace_id, client_id, assessment_year_id\)[\s\S]*where archived_at is null/i,
  );
});

test("filing kinds, statuses, verification, and processing values are constrained", () => {
  assert.match(migration, /filing_cases_status_allowed/i);
  assert.match(migration, /filing_records_kind_allowed/i);
  assert.match(migration, /filing_records_verification_status_allowed/i);
  assert.match(migration, /filing_records_processing_status_allowed/i);
  assert.match(migration, /filing_records_parent_same_case_fk/i);
});

test("status history is append-only", () => {
  assert.match(migration, /case_status_history_append_only/i);
  assert.match(migration, /raise exception 'case_status_history is append-only'/i);
  assert.doesNotMatch(
    migration,
    /grant\s+[^;]*(update|delete)[^;]*on table public\.case_status_history/i,
  );
});

test("all G05 tables enable RLS and revoke inherited privileges", () => {
  for (const table of tables) {
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

test("business tables are archived rather than destructively deleted", () => {
  assert.doesNotMatch(
    migration,
    /grant\s+[^;]*delete[^;]*on table public\.(filing_cases|filing_records)/i,
  );
  assert.doesNotMatch(
    migration,
    /create policy\s+\S+\s+on public\.(filing_cases|filing_records)\s+for delete/i,
  );
});

test("search and foreign-key paths have supporting indexes", () => {
  assert.match(migration, /filing_cases_workspace_status_idx/i);
  assert.match(migration, /filing_cases_client_idx/i);
  assert.match(migration, /filing_records_case_date_idx/i);
  assert.match(migration, /filing_records_parent_idx/i);
  assert.match(migration, /filing_records_active_ack_unique_idx/i);
  assert.match(migration, /case_status_history_case_time_idx/i);
  assert.match(migration, /case_status_history_changed_by_idx/i);
});
