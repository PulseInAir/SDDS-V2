# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 9 — Hardening and release
- Active task: G33 — Full end-to-end regression
- Next READY task: G34 — Vercel Preview and release audit (after G33 completes)
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD before this handoff update: `502dc67`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean (after this commit)
- Supabase project: `vorcxrxggfybhucpimfx`

## Blocker resolved

The `/settings` page crash (`permission denied for table invoice_sequences`) is now fixed. Three migrations have been applied to the remote Supabase project:

1. `20260617050050_fix_import_jobs_unique_constraint.sql` — adds `unique (workspace_id, id)` to `import_jobs`, required by the `import_rows` FK.
2. `20260618110000_add_import_rows_tracking.sql` — creates `import_rows` table with RLS and grants.
3. `20260619100000_allow_reading_invoice_sequences.sql` — creates the `SECURITY DEFINER` function `get_workspace_invoice_sequences()` that allows authenticated users to read invoice sequence data safely without direct table access (Option B fix).

The `invoice_sequences` table remains locked to `service_role` only. No direct `authenticated` access was granted. The existing `rpc("get_workspace_invoice_sequences")` call in `settings.ts` now resolves correctly.

## Remaining G33 blocker

Open decision O-009 is still unresolved: owner must provide test credentials (Supabase auth account) or a `seed.sql` for local regression execution.

## Scope

- Applied Option B fix for G33 blocker: push three pending migrations to remote Supabase, keeping the security lock intact.
- Discarded the previously staged Option A change (direct `authenticated` grant) which would have weakened the hardened schema.

## Changed

- `supabase/migrations/20260617050050_fix_import_jobs_unique_constraint.sql` — NEW: repair migration adding composite unique constraint to `import_jobs`.
- `AI Master Brain/17-TASK-LEDGER.md` — G33 status set to `IN_PROGRESS`.
- `AI Master Brain/18-SESSION-HANDOFF.md` — this update.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx supabase db push --linked --include-all --yes`: all 3 migrations applied successfully.
- `git diff --check`: passed with line-ending warnings only.

## Exact next action

Resolve O-009: owner to confirm a Supabase test account or provide seed credentials, then execute full G33 regression across all critical flows.
