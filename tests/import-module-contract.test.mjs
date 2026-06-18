import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G29 wires the settings import route to real page data", async () => {
  const page = await read("src/app/(app)/settings/import/page.tsx");

  assert.match(page, /getImportPageData/);
  assert.match(page, /ImportPageContent/);
});

test("G29 adds server-side dry-run and commit actions", async () => {
  const actions = await read("src/lib/actions/imports.ts");

  assert.match(actions, /createImportDryRunAction/);
  assert.match(actions, /commitImportJobAction/);
  assert.match(actions, /source_key/);
  assert.match(actions, /import_rows/);
  assert.match(actions, /activity_events/);
});

test("G29 surfaces CSV import from Settings and the dedicated import page", async () => {
  const settingsContent = await read("src/components/settings/SettingsPageContent.tsx");
  const importContent = await read("src/components/settings/ImportPageContent.tsx");
  const commitForm = await read("src/components/settings/ImportCommitForm.tsx");

  assert.match(settingsContent, /Open CSV import/);
  assert.match(commitForm, /Commit approved rows/);
  assert.match(importContent, /Rows already committed by a previous import job/);
  assert.match(importContent, /locked filing-case template/i);
});
