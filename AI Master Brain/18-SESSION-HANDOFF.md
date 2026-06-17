# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G08 — BLOCKED during database verification
- Next READY task: none; G08 must be completed first
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g08-operational-schema`
- Base branch: `master`
- Starting Git state: `9dacfc9b4894460bbc6f726fed0fed0d17f1ed66`
- Draft pull request: `#9`
- Supabase project: `vorcxrxggfybhucpimfx`

## Implemented

- Added refunds and unified tax-event schema with case and optional filing-record ownership.
- Added follow-ups, append-only communications, activity events, audit events, import jobs, and import rows.
- Added tax-event document linkage, context-validation triggers, indexes, controlled minimum states, soft-archive fields, append-only protections, and least-privilege RLS/grants.
- Added G08 operational schema contract tests.

## Verification

- GitHub Actions run `27668629280` passed install, lint, typecheck, tests, production build, and production dependency audit.
- Live Supabase migration execution, rollback-only constraint/RLS tests, advisors, and generated TypeScript types were not completed.
- The draft PR was not marked ready or merged because applying unverified database DDL would create a material data-safety risk.

## Blocker

- The connected Supabase execution functions could not be invoked successfully in this session. G08 cannot be declared complete until the migrations compile and pass live rollback-only isolation tests, advisors are reviewed, and `src/types/database.types.ts` is regenerated.

## Exact next action

Resume G08 on branch `codex/g08-operational-schema`: run the four pending migrations against Supabase project `vorcxrxggfybhucpimfx`, correct any database error, run rollback-only lifecycle and cross-workspace RLS tests, review security/performance advisors, regenerate database types, rerun CI, then merge PR `#9`, mark G08 DONE, promote G09, and stop.
