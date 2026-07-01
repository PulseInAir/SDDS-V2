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
| UI-CINEMATIC-REMODEL-01 | IN_PROGRESS | Remodel project UI with cinematic dark theme, animations, and typography scaling | INVOICE-REVAMP-01 | Custom cursor, click ripples, neon badges, scaled fonts, and dark obsidian variables | — |





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
