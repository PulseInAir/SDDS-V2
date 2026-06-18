import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function read(path) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("G32 app shell exposes skip navigation and route-loading feedback", async () => {
  const appShell = await read("src/components/layout/AppShell.tsx");
  const appLoading = await read("src/app/(app)/loading.tsx");

  assert.match(appShell, /Skip to main content/);
  assert.match(appShell, /id="main-content"/);
  assert.match(appLoading, /aria-busy="true"/);
  assert.match(appLoading, /LoadingSkeleton/);
});

test("G32 top utility bar and global search support keyboard-first navigation", async () => {
  const topUtilityBar = await read("src/components/layout/TopUtilityBar.tsx");
  const globalSearch = await read("src/components/layout/GlobalSearch.tsx");

  assert.match(topUtilityBar, /closeButtonRef/);
  assert.match(topUtilityBar, /document\.body\.style\.overflow = "hidden"/);
  assert.match(globalSearch, /role="combobox"/);
  assert.match(globalSearch, /role="listbox"/);
  assert.match(globalSearch, /ArrowDown/);
  assert.match(globalSearch, /window\.location\.assign/);
});

test("G32 filing queue query paginates at the database layer and keeps attention scope server-side", async () => {
  const casesAction = await read("src/lib/actions/cases.ts");
  const caseBoard = await read("src/components/cases/CaseBoard.tsx");
  const caseTable = await read("src/components/cases/CaseTable.tsx");
  const filingQueueFunction = casesAction.match(/export async function getFilingQueueCases[\s\S]*?return \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(casesAction, /\.range\(from, to\)/);
  assert.match(casesAction, /blocker_note/);
  assert.match(casesAction, /case_status\.eq\.Rectification Required/);
  assert.doesNotMatch(filingQueueFunction, /\.select\(`\s*\*,/);
  assert.match(caseBoard, /useMemo/);
  assert.match(caseTable, /focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2/);
});
