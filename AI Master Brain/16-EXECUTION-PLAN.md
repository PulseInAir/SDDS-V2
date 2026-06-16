# SDDS Greenfield Execution Plan

The build order is dependency-driven. The dashboard is intentionally late.

## Phase 0 — Repository and control baseline

- install project brain;
- confirm repository/branch/remotes;
- initialise Next.js if repository is empty;
- configure checks, environment example, and CI;
- create rollback/tag baseline.

## Phase 1 — Domain and database foundation

- create Supabase project linkage;
- implement workspace/member model;
- implement clients and credentials schema;
- implement AY and filing-case schema;
- implement filing records and status history;
- implement documents;
- implement invoices/payments;
- implement refunds/tax events/follow-ups/activity/import jobs;
- add indexes, constraints, RLS, generated types.

## Phase 2 — Security foundation

- protected routes and auth session handling;
- workspace membership enforcement;
- credential encryption/reveal/update;
- private Storage policies and signed URLs;
- safe audit events.

## Phase 3 — Shared application foundation

- tokens and global styles;
- shell/sidebar/top utility bar;
- AY context and Privacy Mode;
- shared fields, buttons, badges, tables, dialogs, states;
- global search contract.

## Phase 4 — Core operational record

- clients list/create/edit;
- client profile source of truth;
- filing-case detail;
- status transition engine and history.

## Phase 5 — Filing Queue

- table view;
- board view using same query;
- details panel;
- filtering/search/pagination;
- transition and reconciliation tests.

## Phase 6 — Supporting modules

- documents and checklist/history;
- invoices/payments/print/PDF;
- refunds;
- intimations/notices;
- follow-up;
- settings.

## Phase 7 — Dashboard

- lock every metric query and destination;
- build compact attention/workflow/exception presentation;
- urgent queue, financial exceptions, follow-ups, activity;
- reconcile every count;
- complete visual correction and responsive verification.

## Phase 8 — Import, export, and recovery

- CSV dry-run and commit;
- business exports;
- backup process;
- restore test.

## Phase 9 — Hardening and release

- performance;
- accessibility;
- full regression;
- Vercel Preview;
- Supabase policy review;
- production deployment and smoke test;
- maintain rollback.
