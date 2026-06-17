# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 3 — Core Operational Modules
- Active task: none
- Next READY task: G20 — Implement Invoices & Revenue module
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `59bce2a`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean after documentation commit
- Supabase project: `vorcxrxggfybhucpimfx`

## Changed

- Added the dedicated `/documents` route with an exceptions-first workspace view, AY/type/status filters, checklist summaries, and preserved version-history tables.
- Replaced the client-profile Documents placeholder with the real client-scoped module, including upload and replacement flows.
- Extended document actions to fetch scoped module data, upload files into private Supabase Storage, preserve version chains, update checklist status, and revalidate related routes.
- Added an authorised signed-download route handler plus structural tests for the new module.

## Deferred work

- Business rule validations that require document existence remain structural until the Documents module (G19) supplies the required data checks.

## Verification

- `npm run lint`: passed with one pre-existing warning in `src/components/clients/ClientForm.tsx` about React Hook Form `watch()`.
- `npm run typecheck`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- `git diff --check`: passed with line-ending warnings only.
- Local `next dev` smoke attempt reached middleware, but route rendering in this shell was blocked because `NEXT_PUBLIC_SUPABASE_URL` is not configured.

## Exact next action

Run G20 only after the explicit user command `Continue SDDS`.
