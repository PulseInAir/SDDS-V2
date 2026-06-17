# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 3 — Core Operational Modules
- Active task: none
- Next READY task: G24 — Implement Settings and AY/invoice/privacy configuration
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `6bb2fb7`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean after task commit, pending ledger/handoff update
- Supabase project: `vorcxrxggfybhucpimfx`

## Changed

- Added the dedicated `/follow-up` workspace route with contact logging, AY/client/status filters, due-first follow-up ordering, exclusion/reactivation controls, WhatsApp launch links, and privacy-safe queue summaries.
- Replaced the client-profile Communication & Activity placeholder with a real client-scoped follow-up register plus recent communication and activity timelines.
- Added follow-up server actions, validations, and utilities for queue reads, communication logging, status updates, reactivation, route revalidation, and due/exclusion attention derivation.
- Updated filing-case completion so moving a case to `Completed` creates or re-enables the next configured assessment-year follow-up before the transition succeeds.
- Added focused G23 structural tests covering route wiring, client-tab replacement, completion-hook enforcement, and visible follow-up/contact controls.

## Deferred work

- Assessment-year rollover automation remains constrained by open decision `O-003`; this task will use configured assessment-year records only.

## Verification

- Session-start repository checks passed: Git repo confirmed, clean `git status --short`, branch `master`, HEAD `d3d02f5`, remote `origin`.
- Required project-brain files reviewed for G23 scope: 00, 01, 02, 03, 04, 05, 06, 07, 09, 10, 11, 12, 15, 16, 17, 18, and 19.
- `npm run typecheck`: passed.
- `node --test tests/follow-up-module-contract.test.mjs`: passed.
- `npm test`: passed.
- `npm run lint`: passed with one pre-existing warning in `src/components/clients/ClientForm.tsx` about React Hook Form `watch()`.
- `npm run build`: passed and generated `/follow-up` and `/clients/[clientId]/communications`.
- Browser-level dev check: `http://127.0.0.1:3000/follow-up` responded, but local runtime rendering stopped in the expected config error path because `NEXT_PUBLIC_SUPABASE_URL` is not configured in the current dev environment.
- `git diff --check`: passed with line-ending warnings only.

## Exact next action

Run G24 — Implement Settings and AY/invoice/privacy configuration.
