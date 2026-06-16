# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: none
- Next READY task: G04 — Create workspace, membership, AY, client, and credential migrations
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- G03 merge commit: `ff1f323e2fd67d14af8e2ff554450a48b02ada75`
- Vercel project: not linked yet
- Supabase project: not linked yet

## Completed work

- G00 completed: project-brain baseline installed and verified.
- G01 completed: greenfield Next.js foundation merged.
- G02 completed: deterministic dependencies, tests, and CI merged.
- G03 completed and merged through PR #4.
- Added a placeholder-only `.env.example` containing the public Supabase URL and publishable key contract.
- Installed and locked `@supabase/ssr` `0.12.0` and `@supabase/supabase-js` `2.108.2`.
- Added lazy environment validation without module-scope startup failure.
- Added a client-only lazy browser Supabase singleton.
- Added a request-scoped server Supabase client using Next.js cookies.
- Kept service-role and secret keys out of browser code and the committed environment example.
- Added automated source-contract tests for public variables and browser/server boundaries.

## Changed

- `.env.example`
- `package.json`
- `package-lock.json`
- `src/lib/env/supabase.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `tests/supabase-contract.test.mjs`
- task ledger and session handoff

## Verification

Final pull-request CI run `27641712027` completed successfully on Node.js 22.

- locked install with `npm ci`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: pass
- `npm run build`: pass without Supabase environment values, proving lazy build-safe initialization
- `npm audit --omit=dev --audit-level=high`: pass
- environment contract contains placeholders only
- no service-role, secret-key, or real credential value added
- browser client does not import server headers
- server client is marked server-only and uses request cookies

## Risks / blockers

- No Supabase project identifier is recorded in the repository yet. G04 must identify the intended project before applying or verifying migrations.
- Authentication cookie refresh/proxy logic is intentionally deferred to G09.
- Generated database types are intentionally deferred until G04 creates and verifies the first schema.
- Backup destination and retention remain an owner decision for G31 and do not block G04.

## Exact next action

Run G04: identify the intended Supabase project, create version-controlled migrations for workspace, membership, assessment year, client, and encrypted credential records, add constraints/indexes/RLS, generate database types, and verify authorised and unauthorised paths.
