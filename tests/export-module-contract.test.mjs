import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G30 wires the settings export route to real page data", async () => {
  const page = await read("src/app/(app)/settings/export/page.tsx");

  assert.match(page, /getExportPageData/);
  assert.match(page, /ExportPageContent/);
});

test("G30 generates audited server-side CSV exports", async () => {
  const exportModule = await read("src/lib/exports/business.ts");
  const route = await read("src/app/api/exports/[exportKey]/route.ts");

  assert.match(exportModule, /generateBusinessExportCsv/);
  assert.match(exportModule, /activity_events/);
  assert.match(exportModule, /business_export_generated/);
  assert.match(route, /text\/csv; charset=utf-8/);
  assert.match(route, /content-disposition/);
  assert.doesNotMatch(exportModule, /client_credentials/);
});

test("G30 exposes business exports from Settings and the dedicated export page", async () => {
  const settingsContent = await read("src/components/settings/SettingsPageContent.tsx");
  const exportContent = await read("src/components/settings/ExportPageContent.tsx");
  const exportModule = await read("src/lib/exports/business.ts");

  assert.match(settingsContent, /Open exports and backup/);
  assert.match(settingsContent, /Google Drive backup policy/i);
  assert.match(exportModule, /BACKUP_POLICY/);
  assert.match(exportModule, /Private Google Drive folder/);
  assert.match(exportModule, /30 days/);
  assert.match(exportContent, /decrypted portal passwords are excluded/i);
  assert.match(exportContent, /Document exports include metadata and storage inventory/i);
  assert.match(exportContent, /Supabase private Storage[\s\S]*live document source of truth/i);
  assert.match(exportContent, /Approved backup destination/i);
  assert.match(exportContent, /Restore checklist/i);
  assert.match(exportContent, /Recent export activity/);
});
