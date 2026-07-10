# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: GLOBAL-FONT-01
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `061dc4110ec916181b26b3d98ff0ead023f2e64d`

## Global Font Scale and Row Text Alignment (2026-07-10)

**Status: IN_PROGRESS — Lower root and body font sizes so dense table rows no longer wrap and stay aligned with the rest of the UI.**

### Scope
1. Reduce `html` root font-size from 112.5% to 100% so all rem-based Tailwind text tokens scale to the design-system 16px baseline.
2. Reduce `body` font-size from 15px to 14px (matches `09-DESIGN-SYSTEM.md` body 13–14px contract).
3. Verify build/typecheck after clearing `.next`.

### Cinematic Gamified Workflow Redesign (2026-07-03)

**Status: DONE — Overhauled the Client Journey into a full-screen, highly animated level-based wizard.**

### Verification steps completed:
1. **Decision Registered**: Created D-021 in `02-DECISION-REGISTER.md` to authorize the deviation from the locked iDWELL guidelines for this workflow.
2. **Dependencies Installed**: Integrated `framer-motion` and `lenis` for cinematic transitions and smooth scrolling physics.
3. **Remodeled Components**: Rewrote `ClientJourneyPage.tsx` into a centered immersive viewport.
4. **Minimal HUD**: Reduced the bulky `JourneyPipeline.tsx` to a simple, gamified vertical glowing orb tracker.
5. **Code Safety & Build**: Checked TypeScript and successfully executed `npm run build` which verified the changes in a production context.
- Remote: `origin https://github.com/PulseInAir/SDDS-V2.git`
- Working tree: clean
- Supabase project: `vorcxrxggfybhucpimfx`
- Production URL: `https://sdds-v2.vercel.app/`

## Guided Workflow Engine & Status Cleanup (2026-07-02)

**Status: DONE — Implemented client journey dashboard, 8-step pipeline rail, simplified operational statuses to New Client, Filing Queue, and Filed, and embedded the Charges Register Table in the Invoices page.**

### Verification steps completed:
1. **Interactive Timeline Rail:** Built a horizontal progress indicator component styled with custom neon glows and active pulse states. Clicking nodes expands the respective step form.
2. **Auto-Extraction Pipeline Trigger:** Programmed the journey page to automatically run Gemini ITR-V PDF data extraction in the background when a new ITR-V file is uploaded but case charges are pending.
3. **Billing Charges & Fees Card:** Created an editable charges configuration interface automatically calculating filing fees and expected refund percentages with manual overrides.
4. **Offline & Online Invoicing/Payment flow:** Integrated pre-populated invoice creation drafts inline and structured cash/UPI payment collection forms.
5. **Charges Register Table:** Configured a custom dark fintech-style charges table displaying details for all `Filed` cases directly below the invoice form.
6. **Code Safety & Production Build:** Verified using `npx tsc --noEmit` and `npm run build` which compiled successfully with 0 errors.

## Remove Dashboard Exceptions Section (2026-07-02)

**Status: DONE — Completely removed the Filing Exceptions section from the dashboard interactive pipeline map.**

### Verification steps completed:
1. **Component Removal:** Deleted the flex container for "Filing Exceptions" (which included On Hold and Cancelled cases) from `src/components/dashboard/OperationalDashboard.tsx`.
2. **Layout Filling:** Verified that the "Filing Core Pipeline" parent container naturally expands to fill the remaining gap due to its `flex-1` structural styling.
3. **Build Check:** Ran TypeScript validations on related changes to prevent regressions.
