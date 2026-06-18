import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function read(path) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("G28 dashboard keeps keyboard-visible focus styles on interactive dashboard links", async () => {
  const component = await read("src/components/dashboard/OperationalDashboard.tsx");

  assert.match(component, /focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2/);
  assert.match(component, /Open attention view/);
  assert.match(component, /Open invoice/);
  assert.match(component, /Open queue/);
});

test("G28 top utility bar provides a real mobile navigation control instead of a stub", async () => {
  const topUtilityBar = await read("src/components/layout/TopUtilityBar.tsx");

  assert.match(topUtilityBar, /aria-label="Open navigation"/);
  assert.match(topUtilityBar, /role="dialog"/);
  assert.match(topUtilityBar, /mobile-navigation-title/);
  assert.doesNotMatch(topUtilityBar, /Mobile menu button stub/);
});
