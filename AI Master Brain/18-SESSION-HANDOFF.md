# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: INVOICE-UX-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `8e58621`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## Invoice JPEG Download (2026-06-21)

**Status: DONE — Replaced print dialog with JPEG download.**

### Verification steps completed:
1. **Extraction logic**: Replaced `window.print()` with an `html2canvas` implementation that safely reveals the hidden `#invoice-print-only` block, captures a high-quality (scale: 2) JPEG image, restores the layout, and triggers a file download using the invoice number as the filename.
2. **Code gates**: Next.js production build passes locally and tests pass.
