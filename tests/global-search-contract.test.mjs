import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G25 top utility bar exposes the global search component in the authenticated shell", async () => {
  const topUtilityBar = await read("src/components/layout/TopUtilityBar.tsx");
  const globalSearch = await read("src/components/layout/GlobalSearch.tsx");

  assert.match(topUtilityBar, /GlobalSearch/);
  assert.match(globalSearch, /Search scope:/);
  assert.match(globalSearch, /Type at least \{MIN_SEARCH_LENGTH\} characters/);
});

test("G25 global search API is wired to the authenticated workspace search query", async () => {
  const route = await read("src/app/api/global-search/route.ts");
  const searchLib = await read("src/lib/search/global.ts");

  assert.match(route, /searchWorkspaceRecords/);
  assert.match(searchLib, /getAuthenticatedWorkspaceSession/);
  assert.match(searchLib, /Client name/);
  assert.match(searchLib, /invoice_number/);
  assert.match(searchLib, /acknowledgement_number/);
  assert.match(searchLib, /destination/);
});
