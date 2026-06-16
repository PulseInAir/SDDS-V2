# SDDS Testing and Acceptance Contract

## 1. Every task

- inspect exact scope and dependencies;
- run targeted tests;
- run TypeScript check;
- run lint for changed code or project as configured;
- run `git diff --check`;
- review changed files;
- verify no secret or unrelated file is included.

Build is required for tasks that affect application compilation, routing, dependencies, environment handling, or release readiness.

## 2. Data and security tasks

- migration applies to a clean/local database;
- constraints reject invalid data;
- RLS positive and negative paths pass;
- server/client boundaries verified;
- no secrets in browser bundle/logs;
- rollback or restore plan documented;
- encryption compatibility test when relevant.

## 3. UI tasks

- exact affected routes load;
- loading, empty, zero, error, and success states checked;
- keyboard and focus tested;
- Privacy Mode checked;
- direct URL, refresh, back, and forward checked;
- no browser console/network errors;
- desktop, laptop, tablet, and mobile widths checked;
- screenshot comparison against locked SDDS design contract, not legacy screenshots.

## 4. Reconciliation tests

- board count equals table count under same filters;
- dashboard metric equals destination filtered result;
- invoice total, payment sum, outstanding, and overdue reconcile;
- filing history retains original and later records;
- document checklist counts match document records;
- follow-up creation/exclusion works as specified.

## 5. Critical end-to-end flows

1. Sign in and sign out.
2. Create and edit client.
3. Create selected-AY filing case.
4. Move case through valid statuses and reject invalid transition.
5. Add Original filing.
6. Add Revised filing without overwriting Original.
7. Upload, view, replace, and archive private document.
8. Create and issue invoice.
9. Record partial and final payments.
10. Verify billed/received/outstanding/overdue totals.
11. Record refund.
12. Record intimation/notice and due action.
13. Complete case and create next-year follow-up.
14. Search name/PAN/mobile/invoice/acknowledgement.
15. Run import dry-run and commit approved rows.
16. Generate export.
17. Restore test in non-production environment.

## 6. Definition of done

A task is DONE only when:

- objective and acceptance criteria are met;
- required checks pass;
- no unexplained regression remains;
- evidence is recorded;
- commit is focused and pushed;
- ledger and handoff are updated.

Compilation alone is never sufficient.
