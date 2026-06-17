import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const homePage = await readFile(
  new URL("../src/app/(app)/page.tsx", import.meta.url),
  "utf8",
);

test("project remains private and exposes the required quality commands", () => {
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.ok(packageJson.scripts.build);
  assert.ok(packageJson.scripts.check);
});

test("foundation page is SDDS-specific and contains no starter branding", () => {
  assert.match(homePage, /Single Digit Data Solutions/);
  assert.doesNotMatch(homePage, /create-next-app/i);
  assert.doesNotMatch(homePage, /vercel\.svg/i);
  assert.doesNotMatch(homePage, /next\.svg/i);
});
