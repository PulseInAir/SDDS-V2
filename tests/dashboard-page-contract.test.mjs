import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function read(path) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("G27 dashboard route loads real operational data instead of placeholder copy", async () => {
  const page = await read("src/app/(app)/page.tsx");

  assert.match(page, /getOperationalDashboardData/);
  assert.match(page, /OperationalDashboard/);
  assert.doesNotMatch(page, /Summary of all cases by status/);
  assert.doesNotMatch(page, /List of immediate blockers and overdue items/);
});

test("G27 operational dashboard exposes the locked dashboard sections", async () => {
  const component = await read("src/components/dashboard/OperationalDashboard.tsx");

  assert.match(component, /Operational dashboard/);
  assert.match(component, /Workflow distribution/);
  assert.match(component, /Immediate work queue/);
  assert.match(component, /Financial exceptions/);
  assert.match(component, /Follow-ups due/);
  assert.match(component, /Recent activity/);
  assert.match(component, /Resolution watchlist/);
});
