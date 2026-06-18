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

  assert.match(settingsContent, /Open business exports/);
  assert.match(exportContent, /decrypted portal passwords are excluded/i);
  assert.match(exportContent, /Document exports include metadata and storage inventory/i);
  assert.match(exportContent, /Recent export activity/);
});
