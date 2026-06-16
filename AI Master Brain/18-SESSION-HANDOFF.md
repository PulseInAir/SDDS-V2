# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: none
- Next READY task: G06 — Create document metadata and private Storage policies
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g05-filing-schema`
- Base branch: `master`
- Pull request: `#6`
- Vercel project: not linked yet
- Supabase project: `vorcxrxggfybhucpimfx`
- Supabase URL: `https://vorcxrxggfybhucpimfx.supabase.co`

## Completed work

- G00 through G05 are complete.
- Added `filing_cases`, `filing_records`, and append-only `case_status_history`.
- Enforced one active case per workspace/client/assessment year.
- Kept operational case state separate from filing submissions.
- Added typed case statuses, ITR categories, filing kinds, verification states, processing states, terminal timestamp rules, same-case parent linkage, acknowledgement uniqueness, and archive constraints.
- Added supporting indexes, updated-at triggers, RLS, explicit least-privilege grants, and append-only history protection.
- Refreshed generated Supabase TypeScript database types.
- Added G05 migration contract tests.

## Changed

- `supabase/migrations/20260617090000_create_filing_schema.sql`
- `supabase/migrations/20260617090100_secure_filing_schema.sql`
- `src/types/database.types.ts`
- `tests/filing-schema-contract.test.mjs`
- task ledger and session handoff

## Verification

- Live migration history matches repository versions `20260617090000` and `20260617090100`.
- RLS enabled on all three G05 tables.
- Eight intended authenticated policies exist.
- Anonymous privileges are absent; destructive delete grants are absent.
- Status history rejects mutation and is insert/select only.
- Rollback-only live tests passed for authorised reads/inserts, one-active-case uniqueness, typed status rejection, revision-parent enforcement, append-only history, anonymous denial, and cross-workspace isolation.
- Test rows rolled back.
- Supabase security advisor: no findings.
- Supabase performance advisor: informational unused-index notices only, expected on an empty schema.
- GitHub Actions run `27650683891`: install, lint, typecheck, tests, build, and production dependency audit passed.

## Exact next action

Run G06 only: create document metadata and private Supabase Storage policies with validated ownership, private object paths, version/replacement history, RLS/storage tests, generated types, advisors, CI, ledger update, and handoff update.
