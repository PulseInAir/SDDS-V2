# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: none
- Next READY task: G08 — Create refunds, tax events, follow-ups, communication, activity, and import-job migrations
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- G07 pull request: `#8` merged
- G07 merge commit: `d1c827c27ca1abcded62a00fc8539e73a692a34c`
- Supabase project: `vorcxrxggfybhucpimfx`

## Completed work

- G00 through G07 are complete.
- Restored version-controlled invoice sequence, invoice, line-item, and payment migrations.
- Added atomic invoice numbering by workspace and assessment year.
- Added draft-only line-item edits, derived totals, 30-day due-date defaulting, partial/full payment reconciliation, payment reversal history, and overpayment prevention.
- Fixed the live invoice creation defect caused by placeholder defaults on database-generated invoice identity fields.
- Added least-privilege RLS/grants, refreshed database types, and added G07 contract tests.

## Verification

- Live migration history includes G07 versions `20260617040000` through `20260617040400` and fix `20260617041628`.
- Rollback-only live tests passed for invoice allocation, AY serial numbering, derived line totals, issue/due dates, partial payment, full payment, overpayment denial, anonymous denial, and cross-workspace isolation.
- Test rows rolled back; invoice, item, payment, and sequence tables remain empty.
- Supabase security advisor: one informational notice for internal `invoice_sequences` having RLS with no authenticated policy; no exposed access grant exists.
- Supabase performance advisor: informational unused-index notices only on the empty schema.
- GitHub Actions run `27666596406` passed install, lint, typecheck, tests, build, and production dependency audit.
- PR `#8` was marked ready and squash-merged into `master`.

## Exact next action

Run G08 only: create refunds, tax events, follow-ups, communication, activity, and import-job migrations with constraints, indexes, RLS, generated types, live tests, advisors, CI, merge, ledger update, and stop.
