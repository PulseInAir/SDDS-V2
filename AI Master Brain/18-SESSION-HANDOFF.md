# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G05 — Create filing case, filing records, and status-history migrations
- Next READY task: none while G05 is active
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g05-filing-schema`
- Base branch: `master`
- Starting Git state: `97248f42f96ea0e7705b10f927eee7c0c9227c0b`
- Pull request: not opened yet
- Vercel project: not linked yet
- Supabase project: `vorcxrxggfybhucpimfx`
- Supabase URL: `https://vorcxrxggfybhucpimfx.supabase.co`

## Scope

- Add filing cases, filing records, and append-only case status history only.
- Enforce one active case per client and assessment year.
- Keep filing submissions separate from operational case state.
- Add typed constraints, supporting indexes, RLS, explicit grants, generated types, and contract tests.
- Apply and verify the migration against the linked empty-development Supabase project.

## Completed work

- G00 through G04 are complete.

## Exact next action

Complete G05 only, verify live database and CI, then update the ledger and this handoff.
