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

const requiredTables = [
  "workspaces",
  "workspace_members",
  "assessment_years",
  "clients",
  "client_credentials",
];

test("G04 creates every required foundational table", () => {
  for (const table of requiredTables) {
    assert.match(
      migration,
      new RegExp(`create table public\\.${table}\\s*\\(`, "i"),
      `${table} must be created`,
    );
  }
});

test("every exposed G04 table enables row-level security", () => {
  for (const table of requiredTables) {
    assert.match(
      migration,
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        "i",
      ),
      `${table} must enable RLS`,
    );

    assert.match(
      migration,
      new RegExp(
        `revoke all on table public\\.${table} from public, anon, authenticated, service_role`,
        "i",
      ),
      `${table} must reset inherited/default privileges before explicit grants`,
    );
  }

  assert.doesNotMatch(migration, /grant\s+.+\s+to\s+anon/i);
});

test("workspace authorization helpers remain outside the exposed public schema", () => {
  assert.match(migration, /create schema if not exists private/i);
  assert.match(
    migration,
    /create or replace function private\.is_workspace_member/i,
  );
  assert.match(
    migration,
    /create or replace function private\.is_workspace_owner/i,
  );
  assert.doesNotMatch(
    migration,
    /create or replace function public\.is_workspace_(member|owner)/i,
  );

  const securityDefinerFunctions = migration.match(
    /security definer\s+set search_path = ''/gi,
  );
  assert.equal(
    securityDefinerFunctions?.length,
    2,
    "both security-definer authorization helpers must pin an empty search path",
  );
});

test("client identity and assessment-year invariants are enforced", () => {
  assert.match(migration, /clients_pan_canonical/i);
  assert.match(migration, /\^\[A-Z\]\{5\}\[0-9\]\{4\}\[A-Z\]\$/i);
  assert.match(migration, /clients_workspace_pan_active_unique_idx/i);
  assert.match(migration, /assessment_years_workspace_label_unique/i);
  assert.match(migration, /assessment_years_one_current_per_workspace_idx/i);
});

test("credential storage accepts encrypted envelopes only", () => {
  const credentialTable = migration.match(
    /create table public\.client_credentials\s*\(([\s\S]*?)\n\);/i,
  )?.[1];

  assert.ok(credentialTable, "client_credentials definition must be present");
  assert.match(credentialTable, /encrypted_payload\s+jsonb\s+not null/i);
  assert.match(credentialTable, /encryption_version\s+smallint\s+not null/i);
  assert.match(credentialTable, /jsonb_typeof\(encrypted_payload\) = 'object'/i);
  assert.doesNotMatch(credentialTable, /\bpassword\b/i);
  assert.doesNotMatch(credentialTable, /\bplaintext\b/i);
});

test("foreign-key lookup paths required by G04 are indexed", () => {
  assert.match(migration, /workspace_members_user_active_idx/i);
  assert.match(migration, /assessment_years_workspace_open_idx/i);
  assert.match(migration, /clients_workspace_active_name_idx/i);
  assert.match(migration, /client_credentials_workspace_client_idx/i);
  assert.match(migration, /client_credentials_updated_by_idx/i);
});

test("membership policy prevents the current owner from deactivating itself", () => {
  assert.match(
    migration,
    /and \(user_id <> \(select auth\.uid\(\)\) or active\)/i,
  );
});

test("destructive business-row deletes are not granted", () => {
  assert.doesNotMatch(
    migration,
    /grant\s+[^;]*delete[^;]*on table public\.(clients|client_credentials|assessment_years|workspaces)/i,
  );
  assert.doesNotMatch(
    migration,
    /create policy\s+\S+\s+on public\.(clients|client_credentials|assessment_years|workspaces)\s+for delete/i,
  );
});
