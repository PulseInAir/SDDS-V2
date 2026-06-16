# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G04 — Create workspace, membership, AY, client, and credential migrations
- Next READY task: none until G04 is verified and completed
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g04-foundational-schema`
- Base branch: `master`
- Base HEAD: `ac9df9bd4513167130251c93d0341db6b3bda450`
- Vercel project: not linked yet
- Supabase project: `vorcxrxggfybhucpimfx`
- Supabase URL: `https://vorcxrxggfybhucpimfx.supabase.co`

## Completed work

- G00 through G03 are complete and merged.
- G04 has started.
- Added the version-controlled foundational migration for workspaces, workspace membership, assessment years, clients, and encrypted credential envelopes.
- Added constraints for canonical PAN values, assessment-year labels/dates, one current assessment year per workspace, one active PAN per workspace, and one active credential envelope per client.
- Added supporting indexes, updated-at triggers, private membership/owner authorization helpers, RLS policies, and authenticated/anonymous grants.
- Added automated repository tests that lock the G04 table, RLS, authorization-helper, identity, credential, and soft-delete contracts.

## Changed

- `supabase/migrations/20260617000100_create_foundational_schema.sql`
- `tests/database-schema-contract.test.mjs`
- task ledger and session handoff

## Verification completed

- Migration source reviewed against the locked domain and security contracts.
- Credential schema contains a versioned JSON encrypted envelope only; no plaintext credential column exists.
- All five exposed public tables explicitly enable RLS.
- Membership authorization helpers are contained in the non-exposed `private` schema.
- Anonymous table privileges are revoked.
- Destructive deletes are not granted for workspaces, assessment years, clients, or credentials.

## Remaining verification / blocker

- The Supabase connector action interface is discoverable but is not executing project, SQL, migration, type-generation, or advisor calls in this session.
- Therefore the migration has not been applied to `vorcxrxggfybhucpimfx`.
- Live schema inspection, generated TypeScript types, security/performance advisors, and positive/negative RLS tests remain incomplete.
- G04 must remain `IN_PROGRESS`; no completion or database-change claim is permitted.

## Exact next action

Restore executable Supabase connector access, then inspect the project schema and migration history, apply the committed G04 migration, generate and commit database types, run authorised/unauthorised/cross-workspace RLS tests and advisors, run repository CI, mark G04 DONE, promote G05, merge, and stop.
