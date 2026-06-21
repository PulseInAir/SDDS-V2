# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: INVOICE-FIX-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `5186b13`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## Invoice Date Client Crash Fix (2026-06-21)

**Status: DONE — ISO string parsing fixed in formatInvoiceDate.**

### Verification steps completed:
1. **Extraction logic**: Identified that `formatInvoiceDate` was appending `T00:00:00` to full ISO timestamp strings when `issue_date` was null (falling back to `created_at`), causing an Invalid Date crash in React. Updated to conditionally append the time component.
2. **Code gates**: Next.js production build passes locally and tests pass.
