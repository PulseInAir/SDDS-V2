# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: none
- Next READY task: G05 — Create filing case, filing records, and status-history migrations
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g04-foundational-schema`
- Base branch: `master`
- Pull request: `#5`
- Vercel project: not linked yet
- Supabase project: `vorcxrxggfybhucpimfx`
- Supabase URL: `https://vorcxrxggfybhucpimfx.supabase.co`

## Completed work

- G00 through G04 are complete.
- Applied live migrations `20260616211000_create_foundational_schema` and `20260616211525_secure_foundational_schema`.
- Created workspaces, owner membership, assessment years, permanent clients, and encrypted credential-envelope tables.
- Added canonical PAN, AY, active-record, archive, credential, foreign-key, and uniqueness constraints.
- Added supporting indexes and updated-at triggers.
- Added private membership/owner authorization helpers with fixed empty search paths.
- Enabled RLS on all five public tables and applied explicit least-privilege grants.
- Added generated Supabase TypeScript database types.
- Added repository schema-contract tests.

## Changed

- `supabase/migrations/20260616211000_create_foundational_schema.sql`
- `supabase/migrations/20260616211525_secure_foundational_schema.sql`
- `src/types/database.types.ts`
- `tests/database-schema-contract.test.mjs`
- task ledger and session handoff

## Verification

- Supabase project status: active and healthy.
- Migration history exactly matches both repository migration filenames.
- RLS enabled on all five business tables.
- All 15 intended authenticated policies exist.
- Anonymous table privileges are absent; authenticated and service-role privileges match the explicit contract.
- Security-definer helpers are in `private` and pin `search_path` to empty.
- Transactional live database tests passed for authorised owner reads/writes, credential access, unauthenticated denial, nonmember denial, cross-workspace isolation, owner self-deactivation prevention, canonical PAN, one current AY, unique active PAN, and one active credential per client. Test rows rolled back.
- Supabase security advisor: no findings.
- Supabase performance advisor: informational unused-index notices only, expected on an empty new schema; no corrective migration required.
- GitHub Actions run `27649128945`: install, lint, typecheck, tests, build, and production dependency audit passed.

## Exact next action

Run G05 only: create filing-case, filing-record, and append-only status-history migrations with typed constraints, indexes, RLS, generated types, live positive/negative tests, advisors, CI, ledger update, and handoff update.
