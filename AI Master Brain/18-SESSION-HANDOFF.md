# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: PDF-EXTRACT-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `5e8a4fc`
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## PDF Gemini Prompt Refinement (2026-06-21)

**Status: DONE — Gemini prompt rules tightened.**

### Verification steps completed:
1. **Extraction logic**: Excluded document headers (e.g. "Where the data...") and explicit form labels from `clientName`. Added specific lookups for "Total Income" and "Refund" as pure integers to correctly distinguish between `refundAmount` and `taxPayable`.
2. **Code gates**: `tsc --noEmit` build check passed.
