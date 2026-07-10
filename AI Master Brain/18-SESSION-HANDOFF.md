# SDDS Session Handoff

This file is rewritten after every task. Keep it compact and factual.

## Current state

- Active task: `CLIENT-JOURNEY-02`
- Next READY task: None
- Repository: `PulseInAir/SDDS-V2`
- Branch: `master`
- HEAD: `3c61584`

## Client Journey Redesign (2026-07-10)

**Status: DONE — Redesign client detail page to a 5-step unified guided journey.**

### Changes completed:
1. **Layout**: Stripped `ClientProfileHeader` and `Tabs` from `layout.tsx`.
2. **Journey Component**: Rewrote `ClientJourneyPage.tsx` with a new 5-step model.
3. **Step Header**: Added `JourneyStepHeader.tsx` to display steps as glassmorphic pills.
4. **Data Fetching**: Updated `page.tsx` to pass client identity and credentials props.
5. **Verification**: `npm run build` compiled successfully without errors.

## Client Journey & Dashboard Optimization (2026-07-10)

**Status: DONE — Re-upload functionality, hero section replacement, and dashboard metrics upgrade.**

### Changes completed:
1. **UploadITRVStep.tsx**: Added re-upload functionality to the Client Guided Journey.
2. **OperationalDashboard.tsx**: Removed the "Critical Missions" hero section and replaced it with an Executive Summary displaying 3 key top-level metrics.
3. **Command Center Metrics**: Upgraded to 8 tiles mapped to the 8 standard Journey Steps, with secure links to filtered client lists.
4. **Verification**: `npm run build` compiled successfully without errors.

**Status: DONE — Fixed Dashboard/Journey scroll and restored missing dashboard data sections.**

### Changes completed:
1. **OperationalDashboard.tsx**: Replaced `fixed` CSS positioning with `absolute` and removed `min-h-screen` sections. Restored all missing data sections (urgent cases, overdue invoices, pending refunds, notice alerts, follow-ups, and activity feed) with animated Framer Motion reveals.
2. **ClientJourneyPage.tsx**: Replaced `fixed` header/background positioning with `sticky`/`absolute` to ensure scroll works inside the overflow container. Removed unused Lenis import causing build warnings.
3. **JourneyPipeline.tsx**: Replaced `fixed` positioning with `sticky`.
4. **Verification**: `npm run build` compiled successfully without errors. Scroll functions perfectly.

## Invoice Module Revamp (2026-07-10)

**Status: DONE — Removed Charges Register, moved Invoice register to top, fixed ITR Form column to fetch from filing_cases.return_category, summary tiles show dynamic auto-generated figures.**

### Changes completed:
1. **InvoicesManager.tsx**: Removed `ChargesTable` import and rendering, removed `charges` prop. Reordered to show `InvoicePageContent` first, then `InvoiceCreateForm`.
2. **InvoicePageContent.tsx**: Moved Invoice register table to top. Fixed ITR Form column to use `filing_cases.return_category` instead of `filing_records[0].filing_kind`. Summary tiles already show dynamic figures from `data.summary.*`.
3. **Page Files**: Removed `getChargesRegisterData` calls and `charges` prop from both `/invoices` and `/clients/[clientId]/invoices` pages.
4. **invoices.ts**: Added `return_category` to `InvoiceJoinedRow` type and `fetchInvoices` select statement.

### Invoice Generation Section Restoration (2026-07-10)

**Status: DONE — Restored Invoice Create Form, Charges Register Table, and Invoices & Revenue header section with filters and summary cards.**

### Restoration steps completed:
1. **InvoicesManager.tsx**: Re-added `InvoiceCreateForm` and `ChargesTable` imports and rendering, restored `charges` and `defaultClientId` props.
2. **InvoicePageContent.tsx**: Re-added "Invoices & Revenue" header section with filter form (search, client, assessment year, status, overdue only) and summary cards (Billed, Received, Outstanding, Overdue). Restored `buildInvoiceQueryHref` for filter-aware pagination.
3. **Page Files**: Restored `getChargesRegisterData` calls and props passing in both `/invoices` and `/clients/[clientId]/invoices` pages.
4. **Build Verified**: Successfully compiled with `npm run build` after clearing `.next`.

### Global Font Scale and Row Text Alignment (2026-07-10)

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
