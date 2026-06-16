import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [envExample, envModule, browserClient, serverClient, packageJsonText] =
  await Promise.all([
    readProjectFile(".env.example"),
    readProjectFile("src/lib/env/supabase.ts"),
    readProjectFile("src/lib/supabase/browser.ts"),
    readProjectFile("src/lib/supabase/server.ts"),
    readProjectFile("package.json"),
  ]);

const packageJson = JSON.parse(packageJsonText);

test("environment contract exposes only Supabase public connection values", () => {
  assert.match(envExample, /^NEXT_PUBLIC_SUPABASE_URL=/m);
  assert.match(envExample, /^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/m);
  assert.doesNotMatch(envExample, /SERVICE_ROLE/i);
  assert.doesNotMatch(envExample, /SECRET_KEY/i);
  assert.doesNotMatch(envExample, /sb_secret_/i);
});

test("Supabase environment values are validated lazily", () => {
  assert.match(envModule, /export function getSupabasePublicEnv/);
  assert.match(envModule, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(
    envModule,
    /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
  assert.doesNotMatch(envModule, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("browser and server clients preserve their runtime boundaries", () => {
  assert.match(browserClient, /^"use client";/);
  assert.match(browserClient, /createBrowserClient/);
  assert.doesNotMatch(browserClient, /next\/headers/);

  assert.match(serverClient, /import "server-only"/);
  assert.match(serverClient, /createServerClient/);
  assert.match(serverClient, /cookies.*next\/headers/s);
  assert.doesNotMatch(serverClient, /service_role/i);
});

test("approved Supabase packages are runtime dependencies", () => {
  assert.ok(packageJson.dependencies?.["@supabase/ssr"]);
  assert.ok(packageJson.dependencies?.["@supabase/supabase-js"]);
});
