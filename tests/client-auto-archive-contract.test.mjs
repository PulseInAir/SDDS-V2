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

test("CLIENT-AUTO-ARCHIVE-01 defines trigger function and triggers auto-archiving on current assessment year rollover", () => {
  // Check trigger function existence
  assert.match(
    migration,
    /create or replace function public\.auto_archive_inactive_clients/i,
    "Trigger function auto_archive_inactive_clients must be defined"
  );

  // Check check logic on starting year >= 2026 (AY 2026-27)
  assert.match(
    migration,
    /current_ay_start_year\s*(>=|>=:)\s*2026/i,
    "Trigger function must run for AY 2026-27 or later (starting year >= 2026)"
  );

  // Check previous year label calculations
  assert.match(
    migration,
    /current_ay_start_year\s*-\s*1/i,
    "Trigger function must calculate previous AY A-1 label"
  );
  assert.match(
    migration,
    /current_ay_start_year\s*-\s*2/i,
    "Trigger function must calculate previous AY A-2 label"
  );

  // Check query update logic on clients table
  assert.match(
    migration,
    /update public\.clients/i,
    "Trigger function must update clients table"
  );
  assert.match(
    migration,
    /active\s*=\s*false/i,
    "Trigger function must mark inactive clients inactive"
  );
  assert.match(
    migration,
    /archived_at/i,
    "Trigger function must set archived_at for inactive clients"
  );

  // Check case presence check
  assert.match(
    migration,
    /not exists\s*\(\s*select\s+1\s+from\s+public\.filing_cases/i,
    "Trigger function must check for lack of filing cases"
  );

  // Check trigger definition
  assert.match(
    migration,
    /create trigger assessment_years_auto_archive/i,
    "assessment_years_auto_archive trigger must be created"
  );
  assert.match(
    migration,
    /after\s+(insert\s+or\s+update|update)\s+on\s+public\.assessment_years/i,
    "Trigger must fire after update/insert on assessment_years"
  );
  assert.match(
    migration,
    /when\s*\(\s*(new\.is_current\s*=\s*true|new\.is_current)\s*\)/i,
    "Trigger must fire when is_current is true"
  );
});
