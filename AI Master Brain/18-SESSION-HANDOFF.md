# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: INVOICE-SETTINGS-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: {commit_hash}
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## Invoice Defaults and PDF Extraction settings (2026-06-21)

**Status: DONE — implemented defaults of invoice creation and extraction settings.**

### Verification steps completed:
1. **DB Migration**: Applied `20260621180000_create_invoice_settings_schema.sql` to introduce `workspace_invoice_settings` table.
2. **Form Layout**: Added "Invoice Defaults & PDF Extraction Settings" form to Settings page.
3. **Auto-population**: Configured dynamic query on client/AY selection to pre-populate ITR flat rates.
4. **Extraction logic**: Expanded PDF parser to calculate rate-card fees and refund processing commissions.
5. **Code gates**: Build and lint check succeeded with zero errors.



