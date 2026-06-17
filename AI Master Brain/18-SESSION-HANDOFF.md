# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: none
- Next READY task: G07 — Create invoice, item, sequence, and payment migrations
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g06-document-storage`
- Base branch: `master`
- Pull request: `#7`
- Supabase project: `vorcxrxggfybhucpimfx`

## Completed work

- G00 through G06 are complete.
- Added private document metadata with workspace/client/case/filing-record/assessment-year ownership.
- Added fixed private bucket and canonical object-path contract.
- Added additive document replacement/version history and immutable object identity.
- Added metadata RLS and Storage read/upload policies.
- Authenticated users cannot overwrite or delete stored document objects.
- Refreshed generated Supabase types and added contract tests.

## Verification

- Live migrations: `20260617021439` and `20260617021529`.
- Bucket `sdds-documents` exists with `public=false`.
- Rollback-only live tests passed for authorised metadata/object access, malformed-path denial, replacement-version enforcement, immutability, anonymous denial, and cross-workspace isolation.
- Test data rolled back; zero document/object rows remain.
- Document metadata policies: 3. Storage object policies: 2. No update/delete storage policy exists.
- Supabase security advisor: no findings.
- Performance advisor: expected unused-index information only on the empty schema.
- Initial CI exposed a brittle G04 test that counted all security-definer functions; the assertion was corrected to validate the two named G04 helpers.
- Final CI passed install, lint, typecheck, tests, build, and production dependency audit.

## Exact next action

Run G07 only: create invoice sequence, invoice, item, and payment migrations with atomic numbering, financial constraints, RLS, generated types, live tests, advisors, CI, ledger update, merge, and stop.
