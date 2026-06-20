# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: G36 — Post-production live-data iteration triage (DONE)
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `5a12053`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## G36 result (2026-06-20)

**Status: DONE — resolved post-production database constraints and workspace membership signup trigger.**

### Verification steps completed:
1. **Supabase User Deletion Fix**:
   - Modified `case_status_history_append_only` trigger to only fire `before update` so that cascade delete triggers do not hit the mutation exception.
   - Dropped and recreated foreign key constraints referencing `auth.users(id)` in all public tables with `ON DELETE CASCADE` (or `ON DELETE SET NULL` for nullable columns like `activity_events.actor_id` and `documents.verified_by`).
   - Verified that user deletion succeeds cleanly by cascading deletes to associated session logs and metadata.
2. **Workspace Membership Auto-assignment Fix**:
   - Implemented a trigger function `public.handle_new_user_workspace_membership` that automatically queries the default active workspace (or creates one) and inserts a `workspace_members` row with role `'owner'` for any new user created in `auth.users`.
   - Linked this to `auth.users` via `after insert` trigger `on_auth_user_created`.
   - Verified that newly created users can log in without encountering the workspace membership requirement block.
3. **Build & Quality Gates**:
   - Verified clean typechecking, linting, and a successful production Next.js build.

## Exact next action

None. All scheduled release tasks and post-production triage in the ledger are complete.
