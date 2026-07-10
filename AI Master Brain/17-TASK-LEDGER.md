# SDDS Task Ledger

**Ledger rule:** Exactly one task may be `IN_PROGRESS`. Select the first `READY` task whose dependencies are DONE. Do not skip dependencies unless the owner explicitly overrides and the risk is recorded. Record commit and evidence before marking DONE.

Statuses: `PENDING`, `READY`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `REJECTED`.

| ID | Status | Task | Depends on | Required output / acceptance | Commit |
|---|---|---|---|---|---|
| G00 | DONE | Install and validate project-brain control system in repository | — | Files copied, legacy conflicts quarantined, Git baseline recorded | `ac161dc7dfd3cec26b5ff0e7b26abeeb8b1a6a0e` |
| G01 | DONE | Inspect or initialise greenfield Next.js repository | G00 | Next.js App Router + TS + Tailwind, clean build, no starter clutter | `d0610265e32aea9b58c0342c2db260306f3d5b9b` |
| G02 | DONE | Configure quality gates and CI | G01 | typecheck, lint, build, test command, GitHub workflow where appropriate | `12c4c3af71d61b9e580cf0e7123652c4f1953069` |
| G03 | DONE | Configure environment contract and Supabase clients | G01 | `.env.example`, browser/server clients, no secret leakage | `ff1f323e2fd67d14af8e2ff554450a48b02ada75` |
| G04 | DONE | Create workspace, membership, AY, client, and credential migrations | G03 | constraints, indexes, RLS draft, generated types | `76a4595bb0d556d3506c0caf5aa9d4a9dee918f5` |
| G05 | DONE | Create filing case, filing records, and status-history migrations | G04 | separate records/status dimensions, valid constraints | `7c642eb263fb20313a317909c7470c33fb709e25` |
| G06 | DONE | Create document metadata and private Storage policies | G04 | private bucket contract, RLS/storage tests | `4adef88eaddb842900e4e9f5feba3ae4f5e9de6b` |
| G07 | DONE | Create invoice, item, sequence, and payment migrations | G04 | atomic numbering and financial constraints | `d1c827c27ca1abcded62a00fc8539e73a692a34c` |
| G08 | DONE | Create refunds, tax events, follow-ups, communication, activity, and import-job migrations | G05,G07 | Migrations applied, generated types, local checks, live Supabase tests, and advisors complete. | `2b635af6c2b8d4b8efc33ba8911f92fa6124e948`, `089627befc12b45b05a6712932eda940f7df595d`, `094bf4ace7d357553ccdbf62475d0d3ee9c48f05`, `78a5bd2974de22c9def4987ca86cad1e3a025d7f` |
| G09 | DONE | Implement authenticated app boundary and owner workspace membership | G04 | protected routes, correct redirects, RLS verified | `e983b0c` |
| G10 | DONE | Implement credential encryption, update, and reveal flow | G09 | AES-GCM envelope, record-specific reveal, audit metadata | `a4fb8ac` |
| G11 | DONE | Implement document upload/download/version foundation | G06,G09 | validated private upload, signed download, history | `69d6c1e` |
| G12 | DONE | Build design tokens and shared UI primitives | G01 | locked SDDS tokens/components/states, Storybook not required | `9366375` |
| G13 | DONE | Build authenticated application shell | G09,G12 | sidebar, top utility, AY context, Privacy Mode, responsive shell | `9cf4d78` |
| G14 | DONE | Implement client repository, list, search, create, and edit | G04,G13 | real data, validation, privacy, pagination | `13d0e8e` |
| G15 | DONE | Implement client profile source of truth | G14,G05,G06,G07,G08 | all approved contexts without duplicate identity ownership | `2c75b71` |
| G16 | DONE | Implement filing-case detail and transition engine | G05,G13 | valid transitions, requirements, history, errors | `96601dd` |
| G17 | DONE | Implement Filing Queue table view | G14,G16 | canonical query, filters, pagination, privacy | `49a7849` |
| G18 | DONE | Implement Filing Queue board view | G17 | same dataset/filters, transition validation, reconciliation | `e66ea2d` |
| G19 | DONE | Implement Documents module and checklist/history | G11,G15 | exceptions-first page, signed actions, version history | `59bce2a` |
| G20 | DONE | Implement Invoices & Revenue module | G07,G15 | create/issue/print, partial payments, reconciliation | `6165680ebd77ee0a02b1571a44f7b85a92a3f7cc` |
| G21 | DONE | Implement Refunds module | G08,G15 | statuses, amounts, dates, next action, filters | `230d47a` |
| G22 | DONE | Implement Intimations / Notices module | G08,G15 | due dates, documents, responses, closure | `be4c64a` |
| G23 | DONE | Implement Follow-up module | G08,G15 | annual creation, exclusion/reactivation, contact log | `6bb2fb7` |
| G24 | DONE | Implement Settings and AY/invoice/privacy configuration | G13,G20 | controlled settings without speculative features | `e6cf394` |
| G25 | DONE | Implement global search | G14,G20,G16 | supported fields, typed results, privacy-safe | `4f92e69` |
| G26 | DONE | Lock and test dashboard query contracts | G17,G19,G20,G21,G22,G23 | every metric reconciles and has destination | `af5734f` |
| G27 | DONE | Build operational dashboard | G26,G13 | attention, workflow, queues, financial exceptions, activity | `ca00f98` |
| G28 | DONE | Run dashboard visual/interaction correction loop | G27 | desktop-first design compliance, responsive/accessibility evidence | `770b4cc` |
| G29 | DONE | Implement CSV import dry-run and commit | G14,G20,G16 | idempotent mapping, errors, audit, safe commit | `a6a1f19b75b8aa7367e0e071acaab2c8e96a0651` |
| G30 | DONE | Implement business exports | G19,G20,G21,G22,G23 | authorised practical exports, safe handling | `23b0f6eb35adebe0ca61a320a416b7ee46f65f91` |
| G31 | DONE | Implement production backup destination and retention | OWNER DECISION | approved destination/retention/encryption + restore procedure | `e0d5cd9` |
| G32 | DONE | Performance and accessibility hardening | G28,G29,G30 | budgets, query review, keyboard/contrast/responsive | `59cbe78781e7514b428446519520bc4ba524fa9e` |
| G33 | DONE | Full end-to-end regression | G32,G31 | all critical flows pass, restore tested | `d7f737d` (code) / `dbdcd62` (docs) — owner-confirmed PASS (2026-06-20); caveats deferred to G36 |
| G34 | DONE | Vercel Preview and release audit | G33 | preview smoke, logs, policy/security audit, rollback | `7a84429` |
| G35 | DONE | Production release and post-release smoke test | G34 | production healthy, evidence and rollback retained | `ebc6636` |
| G36 | DONE | Post-production live-data iteration triage | G35 | real-usage issues catalogued, prioritised, and resolved; no speculative pre-production work | `5a12053` |
| SHELL-USER-MENU-01 | DONE | User menu relocation and profile-management entry point | G36 | Sidebar no longer contains Sign Out, top-right avatar opens menu with Admin Profile and Log Out, Profile image and password updates work | `e1a8462a1865be4cda7be4ad0eff23ff01b126d0` |
| G37 | DONE | Resolve O-002 invoice layout and branding | SHELL-USER-MENU-01 | Replicate Invoice Format.png layout, configure logo, and payment details | `1f31b6f` |
| G38 | DONE | Enhance invoice design with premium aesthetics | G37 | Apply sophisticated color blocks, grid alignments, spacing, and micro-shadows | `c2181ab` |
| G39 | DONE | Resize and match invoice layout spacing | G38 | Match proportions, column widths, and spacing of Invoice Format.png | `e700f27` |
| G40 | DONE | Fix print layout page height spacing | G39 | Eliminate white space at the bottom of the page in print preview | `c6952b3` |
| G41 | DONE | Implement fixed full-page print overlay | G40 | Position print layout fixed at 100% width and height to remove white space offsets | `1616b3f` |
| G42 | DONE | Fix profile avatar JWT cookie size bloat | SHELL-USER-MENU-01 | Migrate profile avatars out of auth metadata JWT into public storage bucket | `e700492` |
| G43 | DONE | Fix dark mode styling glitches on filing queue and client details | G42 | Configure Tailwind CSS v4 class-based dark mode and remove dark: classes to prevent layout glitches under dark theme preferences | `c1b91a0` |
| CLIENT-ENH-01 | DONE | Implement Client ID system, metric cards header, and filtering/sorting system | G43 | Client ID assigned sequentially (existing and new), stats cards visible, filters and sorting work | `48e7f41` |
| DB-PURGE-01 | DONE | Purge test data for production go-live | CLIENT-ENH-01 | Truncate all client operational tables, reset sequence starting at 1, retain owner account | `2a3b56bbfc3e1a80da8d071f7a606db180204413` |
| CLIENT-AUTO-ARCHIVE-01 | DONE | Mark client inactive and archive starting from AY 2026-27 if case not opened for straight three AYs | DB-PURGE-01 | Database trigger automatically archives inactive clients on current AY rollover; test validation passes | `e1acb64` |
| CLIENT-UX-01 | DONE | Relocate Add Client button, make metric cards clickable for filtering, and add sorting to client list column headers | CLIENT-AUTO-ARCHIVE-01 | Filters removed, global Add Client button added, metrics filter list correctly, sorting working | `77bec92` |
| INVOICE-SETTINGS-01 | DONE | Add workspace default invoice settings, rate cards, refund parsing patterns, and auto-population logic | CLIENT-UX-01 | Settings form implemented, API updated, rate card and refund charges populate dynamically | `06e84bb` |
| PDF-EXTRACT-01 | DONE | Fix Gemini PDF extraction prompt logic | INVOICE-SETTINGS-01 | Refined prompt rules to eliminate header hallucination as clientName and accurately pull income/tax totals | `5e8a4fc` |
| INVOICE-FIX-01 | DONE | Fix ISO date crash in invoice details | PDF-EXTRACT-01 | formatInvoiceDate safely handles full ISO timestamps, preventing client-side render crash | `5186b13` |
| INVOICE-UX-01 | DONE | Change Print Invoice to Download JPEG | INVOICE-FIX-01 | Replace window.print() with html2canvas to download a high-quality JPEG of the invoice | `8e58621` |
| LAYOUT-RESPONSIVE-01 | DONE | Fix UI layout spacing to be auto-adaptive and responsive | INVOICE-UX-01 | Widen AppShell, make tabs scrollable, reduce mobile padding, remove double nested containers | `6009bf8` |
| LAYOUT-RESPONSIVE-02 | DONE | Advanced dashboard grid auto-adaptation and responsive spacing | LAYOUT-RESPONSIVE-01 | Widen dashboard grids, balance columns, and reclaim cell paddings in all tables | `1faa3b1` |
| LAYOUT-POLISH-01 | DONE | Widen sidebar navigation, adjust font sizes/icons, and polish all forms, read-only cards, and layouts to use semantic design system tokens and rounded-panel class | LAYOUT-RESPONSIVE-02 | Widescreen navigation is larger and bold, form containers and fields have perfect alignment and design token classes | `c068dc8` |
| REFUND-REVAMP-01 | DONE | Revamp refund section with client-wise status table and unified create/edit container | LAYOUT-POLISH-01 | Clean status table, no cards or inline update forms, edit triggers upper container | `9d29453` |
| INVOICE-REVAMP-01 | DONE | Revamp invoice register table and implement refund amount auto-population | REFUND-REVAMP-01 | Clean status columns with client-wise editing, received refund amount auto-populates calculator | `87f271e` |
| UI-CINEMATIC-REMODEL-01 | DONE | Remodel project UI with cinematic dark theme, animations, and typography scaling | INVOICE-REVAMP-01 | Custom cursor, click ripples, neon badges, scaled fonts, and dark obsidian variables | `6727b33` |
| UI-CINEMATIC-REMODEL-02 | DONE | Ditch cursor follower and elevate cinematic ambient highlights (mesh bg, hover spotlights, glassmorphism) | UI-CINEMATIC-REMODEL-01 | Cards hover spotlight follow, animated background aura, glassmorphic panels, no cursor ring | `90d363d` |
| UI-CINEMATIC-REMODEL-03 | DONE | Implement proximity border spotlights, spring clicks, digital vacuum money glows, and pulsing nav active states | UI-CINEMATIC-REMODEL-02 | Proximity card borders glow on hover, active spring scaling, glowing text shadows, pulsing active lists | `6d66121` |
| DASHBOARD-RESHUFFLE-01 | DONE | Reshuffle and revamp dashboard cards for a premium, structured, and modern layout | UI-CINEMATIC-REMODEL-03 | Redesigned command center with global HUD, interactive filing pipeline map, 2-column asymmetric layout, fintech-style financials, and watchlist feeds | `01b792b1489ebaca4e393266fa113086df1b63ff` |
| CLIENT-FILTERS-01 | DONE | Add case and refund status filter cards to the clients page | DASHBOARD-RESHUFFLE-01 | Added extra cards identically styled to existing metric cards, appended sequentially into the 4-column metric grid | `77cf2dbde4d1170886cf01375404b08bcc2c04a3` |
| CLIENT-SEARCH-01 | DONE | Remove client search bar from the clients page | CLIENT-FILTERS-01 | Removed the `ClientSearch` component and its import from the client page layout | `dd4bb0fcd0a80c15483f75be67c064cae04d3c14` |
| DASHBOARD-HUD-01 | DONE | Remove Global HUD Mini-Matrix from the dashboard header | CLIENT-SEARCH-01 | Removed the mini-matrix metric cards from `OperationalDashboard` layout | `4f515b4b91dbdd831ca224ffb8f9a7a4a5959d31` |
| DASHBOARD-EXCEPTIONS-01 | DONE | Remove Filing Exceptions section from the dashboard pipeline map | DASHBOARD-HUD-01 | Removed the exceptions column, allowing the core pipeline to fill the gap naturally | `b4bf243303c6f81e57d57a1d36f67ef068b06daf` |
| GUIDED-WORKFLOW-01 | DONE | Implement Guided Workflow Engine and simplify operational statuses | DASHBOARD-EXCEPTIONS-01 | Client journey dashboard, 8-step pipeline rail, status cleanup to 3 states, embedded charges table | `f499ba2` |
| UI-CINEMATIC-WORKFLOW-01 | DONE | Implement cinematic gamified wizard workflow | GUIDED-WORKFLOW-01 | One-screen-at-a-time immersive workflow with smooth scrolling, Framer Motion transitions, and minimal HUD | `76e005c` |
| GLOBAL-FONT-01 | DONE | Reduce global font scale and align row text sizing | UI-CINEMATIC-WORKFLOW-01 | Root font-size set to 100%, body set to 14px, rows fit without wrapping, build passes | `061dc4110ec916181b26b3d98ff0ead023f2e64d` |
| INVOICE-RESTORE-01 | DONE | Restore invoice generation section (Create Form, Charges Register, filters, summary cards) | GLOBAL-FONT-01 | InvoiceCreateForm, ChargesTable, Invoices & Revenue header with filters/summary cards restored, build passes | `5f635ae0d2081069fee08eb67002aa7b006d47eb` |
| INVOICE-REVAMP-02 | DONE | Remove Charges Register, move Invoice register to top, fetch ITR Form from return_category | INVOICE-RESTORE-01 | ChargesTable removed, Invoice register at top, ITR Form column shows filing_cases.return_category, summary tiles show dynamic figures, build passes | `d59757258ac3b8f14c236181c94655897648fa32` |
| DASHBOARD-FIX-01 | DONE | Fix Dashboard/Journey scroll and restore missing dashboard data sections | INVOICE-REVAMP-02 | Scroll works without breaking UI layout, missing dashboard sections restored, build passes | `8654081` |
| DASHBOARD-FIX-02 | DONE | Remove Filing Queue from sidebar and replace dashboard tile | DASHBOARD-FIX-01 | Filing Queue sidebar removed, dashboard destinations replaced with /clients, Action Required tile replaces Filing Queue | `551da83` |
| CLIENT-JOURNEY-01 | DONE | Update ITR Upload Step Re-upload option and dashboard critical missions hero removal | DASHBOARD-FIX-02 | Re-upload button added to ITR Upload step. Critical Missions hero removed and replaced with Executive Summary. Command Center mapped to 8 journey steps. Build passes. | `8728937` |
| CLIENT-JOURNEY-02 | DONE | Redesign client detail page to 5-step unified guided journey | CLIENT-JOURNEY-01 | Strip 10-tab layout, implement new 5-step model with horizontal step header, subsume identity/credentials into Step 1, countdown timer in Step 5. Build passes. | `3c61584` |
| DEPLOYMENT-FIX-01 | DONE | Resolve ESLint errors causing Vercel build failures | CLIENT-JOURNEY-02 | Fixed set-state-in-effect and unescaped entities, disabled no-explicit-any. Build and lint passes. | `22e7c56` |
| DEPLOYMENT-FIX-02 | DONE | Remove missing lenis import causing Vercel build failure | DEPLOYMENT-FIX-01 | Removed unused Lenis import and initialization from ClientJourneyPage.tsx. | `3fc731b` |
| CLIENT-JOURNEY-03 | DONE | Redesign Step 1 and 2 to match prompt spec | DEPLOYMENT-FIX-02 | Replaced Step 1 form with simple Create Case button. Replaced Step 2 form with basic ITR No., Filing Date, Refund Amount input. | `4bd0521` |
| CLIENT-JOURNEY-04 | DONE | Subsume filings details into Step 2 and implement dynamic step shifting | CLIENT-JOURNEY-03 | ClientStatusStep has full filings form. Status selects Filing Queue (stays) or Filed (shifts to Step 3). UI static summary only shows when case is Filed. | `b3b202b` |
## Task update protocol

When starting:

- set chosen task to `IN_PROGRESS`;
- update `18-SESSION-HANDOFF.md` with scope and starting Git state.

When complete:

- set task to `DONE`;
- record commit hash;
- set the next dependency-satisfied task to `READY`;
- update handoff with verification and exact next action.

When blocked:

- set task to `BLOCKED`;
- record the smallest precise blocker in handoff/open decisions;
- do not invent an answer.
