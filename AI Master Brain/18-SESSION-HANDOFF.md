# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G06 — Create document metadata and private Storage policies
- Next READY task: none while G06 is active
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g06-document-storage`
- Base branch: `master`
- Starting Git state: `8eb520a75ee2f8bf9e9d2c28fae1574797a33bd8`
- Supabase project: `vorcxrxggfybhucpimfx`

## Scope

- Add document metadata and version/replacement history.
- Create one private Supabase Storage bucket.
- Enforce workspace/client ownership in both metadata RLS and Storage object policies.
- Keep objects immutable to authenticated users; replacements use new objects and metadata rows.
- Add generated types, live RLS/storage verification, advisors, CI, ledger update, and final merge.

## Exact next action

Complete G06 only, verify database and Storage access, merge, and stop.
