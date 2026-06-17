# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G07 — Create invoice, item, sequence, and payment migrations
- Next READY task: none while G07 is active
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g07-financial-schema`
- Base branch: `master`
- Starting Git state: `4869298f2345be3c541cb337dab977b139509fa3`
- Supabase project: `vorcxrxggfybhucpimfx`

## Scope

- Add atomic invoice sequences by workspace and assessment year.
- Add invoices, line items, and partial/full payments.
- Enforce invoice number format, 30-day default due date, immutable issued numbering, derived financial totals, payment reversal, and overpayment prevention.
- Do not add GST/tax assumptions.
- Add RLS, generated types, live tests, advisors, CI, merge, ledger update, and handoff update.

## Exact next action

Complete G07 only, verify live financial invariants and access isolation, merge, and stop.
