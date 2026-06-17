import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G24 settings route wires the real settings page data and content", async () => {
  const page = await read("src/app/(app)/settings/page.tsx");

  assert.match(page, /getSettingsPageData/);
  assert.match(page, /SettingsPageContent/);
});

test("G24 shell layout hydrates assessment year and privacy preferences from settings data", async () => {
  const layout = await read("src/app/(app)/layout.tsx");
  const context = await read("src/contexts/AppContext.tsx");

  assert.match(layout, /getShellContextData/);
  assert.match(layout, /assessmentYears=/);
  assert.match(context, /assessmentYearId/);
  assert.match(context, /initialPrivacyMode/);
});

test("G24 settings actions expose controlled assessment year, invoice, and privacy configuration", async () => {
  const settingsAction = await read("src/lib/actions/settings.ts");
  const settingsContent = await read("src/components/settings/SettingsPageContent.tsx");

  assert.match(settingsAction, /createAssessmentYearAction/);
  assert.match(settingsAction, /setCurrentAssessmentYearAction/);
  assert.match(settingsAction, /setPrivacyModePreferenceAction/);
  assert.match(settingsContent, /Numbering contract/);
  assert.match(settingsContent, /SDDS\/ITR\//);
  assert.match(settingsContent, /open decision O-002/);
});
