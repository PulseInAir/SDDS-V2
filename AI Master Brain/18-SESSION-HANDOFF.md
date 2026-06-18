# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 3 — Core Operational Modules
- Active task: none
- Next READY task: G27 — Build operational dashboard
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD before this handoff update: `af5734f`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: documentation update pending commit
- Supabase project: `vorcxrxggfybhucpimfx`

## Changed

- Added `src/lib/dashboard/contracts.ts` to lock the dashboard metric catalog, workflow distribution contract, reconciliation helpers, and concrete filtered destinations for filing queue, documents, invoices, refunds, notices, and follow-up.
- Extended filing queue, documents, and invoices route/query handling with dashboard destination scopes: filing-queue `scope=attention`, documents `scope=exceptions`, and invoices `scope=billed|received|outstanding|overdue`.
- Added `tests/dashboard-query-contract.test.mjs` to verify every locked dashboard metric, its destination wiring, and the reconciliation helper coverage.

## Deferred work

- Assessment-year rollover automation remains constrained by open decision `O-003`; the app uses configured assessment-year records only.
- Invoice legal identity, GST treatment, logo, and signature assets remain constrained by open decision `O-002`; settings intentionally expose sequencing visibility without speculative invoice identity fields.

## Verification

- Session-start repository checks passed: Git repo confirmed, clean `git status --short`, branch `master`, HEAD `f14b663`, remote `origin`.
- Required project-brain files reviewed for G26 scope: 00, 01, 02, 03, 05, 08, 09, 10, 11, 12, 15, 16, 17, 18, and 19.
- `node --test tests/dashboard-query-contract.test.mjs`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed.
- `npm run lint`: passed with the pre-existing `ClientForm.tsx` React Hook Form `watch()` warning.
- `npm run build`: passed.
- `git diff --check`: passed with line-ending warnings only.

## Exact next action

Run G27 — build the operational dashboard UI on top of the locked dashboard query contracts.
