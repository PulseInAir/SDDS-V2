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
| G18 | IN_PROGRESS | Implement Filing Queue board view | G17 | same dataset/filters, transition validation, reconciliation | — |
| G19 | PENDING | Implement Documents module and checklist/history | G11,G15 | exceptions-first page, signed actions, version history | — |
| G20 | PENDING | Implement Invoices & Revenue module | G07,G15 | create/issue/print, partial payments, reconciliation | — |
| G21 | PENDING | Implement Refunds module | G08,G15 | statuses, amounts, dates, next action, filters | — |
| G22 | PENDING | Implement Intimations / Notices module | G08,G15 | due dates, documents, responses, closure | — |
| G23 | PENDING | Implement Follow-up module | G08,G15 | annual creation, exclusion/reactivation, contact log | — |
| G24 | PENDING | Implement Settings and AY/invoice/privacy configuration | G13,G20 | controlled settings without speculative features | — |
| G25 | PENDING | Implement global search | G14,G20,G16 | supported fields, typed results, privacy-safe | — |
| G26 | PENDING | Lock and test dashboard query contracts | G17,G19,G20,G21,G22,G23 | every metric reconciles and has destination | — |
| G27 | PENDING | Build operational dashboard | G26,G13 | attention, workflow, queues, financial exceptions, activity | — |
| G28 | PENDING | Run dashboard visual/interaction correction loop | G27 | desktop-first design compliance, responsive/accessibility evidence | — |
| G29 | PENDING | Implement CSV import dry-run and commit | G14,G20,G16 | idempotent mapping, errors, audit, safe commit | — |
| G30 | PENDING | Implement business exports | G19,G20,G21,G22,G23 | authorised practical exports, safe handling | — |
| G31 | BLOCKED | Implement production backup destination and retention | OWNER DECISION | approved destination/retention/encryption + restore procedure | — |
| G32 | PENDING | Performance and accessibility hardening | G28,G29,G30 | budgets, query review, keyboard/contrast/responsive | — |
| G33 | PENDING | Full end-to-end regression | G32,G31 | all critical flows pass, restore tested | — |
| G34 | PENDING | Vercel Preview and release audit | G33 | preview smoke, logs, policy/security audit, rollback | — |
| G35 | PENDING | Production release and post-release smoke test | G34 | production healthy, evidence and rollback retained | — |

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
