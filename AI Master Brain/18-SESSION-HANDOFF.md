# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G08 — Create refunds, tax events, follow-ups, communication, activity, and import-job migrations
- Next READY task: none while G08 is active
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g08-operational-schema`
- Base branch: `master`
- Starting Git state: `9dacfc9b4894460bbc6f726fed0fed0d17f1ed66`
- Supabase project: `vorcxrxggfybhucpimfx`

## Scope

- Add refunds and unified tax-event records with case and filing-record ownership.
- Add follow-ups, communications, activity events, audit events, import jobs, and import rows.
- Add tax-event document linkage, typed constraints, query indexes, append-only history controls, least-privilege RLS, generated types, and contract tests.
- Use only the minimum controlled taxonomies already permitted by the project contracts.
- Do not implement authentication UI, application routes, operational screens, import execution, or speculative automation.

## Exact next action

Complete G08 only, verify constraints and access isolation against the live Supabase project, update generated types and tests, pass CI, merge, update ledger and handoff, and stop.
