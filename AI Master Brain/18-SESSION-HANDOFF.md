# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: INVOICE-REVAMP-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `87f271e`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## Invoice Revamp & Refund Auto-Population (2026-07-01)

**Status: DONE — Revamped the Invoice register to support client-wise status columns, added editing support for draft invoices, and auto-populated refund received amounts.**

### Verification steps completed:
1. **Invoice Register Revamp**: Replaced the invoice table layout to render exact columns: `Sl. No.`, `Client name`, `ITR Number` (Filing record acknowledgement), `Refund Received` (case refunds received amount), `ITR Filing Charges` (subtotal from line items), `ITR Refund Claim Charges` (subtotal from line items), `Total Invoice value`, `Status`, and `Actions`.
2. **Draft Editing**: Created the `InvoicesManager` client-side wrapper, revamped `InvoiceCreateForm` to pre-populate inputs from `editingInvoice`, disable selectors, bind action to `updateInvoiceAction`, and support Cancel/Reset.
3. **Refund Auto-Population**: Added `getReceivedRefundAmount` action and integrated an effect inside `InvoiceCreateForm` to automatically pre-populate the "Refundable Amount" calculator input when client or AY changes.
4. **TypeScript and Lint checks**: Verified typecheck compiles successfully and linter runs with zero errors on all source files.
