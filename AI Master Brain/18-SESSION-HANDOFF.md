# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Project phase: Phase 3 — Core Operational Modules
- Active task: none
- Next READY task: G21 — Implement Refunds module
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `6165680`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean after G20 code commit, pending ledger/handoff update
- Supabase project: `vorcxrxggfybhucpimfx`

## Changed

- Added the dedicated `/invoices` workspace route with create-draft, search, AY/status/overdue filters, billed/received/outstanding/overdue summaries, and a reconciled invoice register.
- Replaced the client-profile Invoices & Payments placeholder with the real client-scoped module and shared creation flow.
- Added server-side invoice queries, validation, and actions for draft creation, issue, payment recording, reconciliation-safe totals, and activity logging.
- Added invoice detail and print flows with line items, payment history, partial-payment support, and placeholder-safe legal copy governed by open decision `O-002`.
- Added a shared `MoneyValue` component plus focused G20 structural tests.

## Deferred work

- Invoice legal identity, address, logo, signature, and GST/tax treatment remain governed by open decision `O-002`; the current print layout intentionally avoids unsupported tax/legal claims.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed with one pre-existing warning in `src/components/clients/ClientForm.tsx` about React Hook Form `watch()`.
- `npm test`: passed, including new `tests/invoice-module-contract.test.mjs`.
- `npm run build`: passed and generated `/invoices`, `/invoices/[invoiceId]`, and `/clients/[clientId]/invoices`.
- `git diff --check`: passed with line-ending warnings only.
- Local dev smoke: `http://127.0.0.1:3001/invoices` started returning HTTP `500`, so route-level runtime verification remains blocked by local auth/environment state in this shell.
- Browser automation smoke: blocked because Playwright browser binaries are not installed in this environment.

## Exact next action

Run G21 — Implement Refunds module.
