# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 1 — Domain and database foundation
- Active task: G07 — Create invoice, item, sequence, and payment migrations
- Next READY task: none while G07 is active
- Repository: `PulseInAir/SDDS-V2`
- Branch: `codex/g07-invoice-payments`
- Base branch: `master`
- Starting Git state: `4869298f2345be3c541cb337dab977b139509fa3`
- Supabase project: `vorcxrxggfybhucpimfx`

## Scope

- Add atomic invoice sequencing by workspace and assessment year.
- Add invoices, invoice items, and payments.
- Enforce invoice-number format, draft/issued/cancelled lifecycle, line-item totals, partial payments, no overpayment, and reversible payment history.
- Add RLS, explicit grants, generated types, live database tests, advisors, CI, ledger update, merge, and stop.

## Exact next action

Complete G07 only and do not start G08.
