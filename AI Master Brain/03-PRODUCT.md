# SDDS Product Contract

## Product

**Name:** Single Digit Data Solutions (SDDS)  
**Type:** Private Internal Operations CRM  
**Primary user:** Owner/operator of SDDS  
**Secondary users:** Future internal staff after explicit approval  
**Expected annual active client volume:** approximately 110–150 initially

## Outcome

Create one reliable source of truth for every ITR client and every assessment year. Reduce missed filings, missing documents, forgotten payments, unresolved refunds/intimations/notices, and dependence on Excel, WhatsApp history, notebooks, physical files, or memory.

## Core modules

1. Dashboard
2. Clients
3. Filing Queue
4. Documents
5. Invoices & Revenue
6. Refunds
7. Intimations / Notices
8. Follow-up
9. Settings
10. Data import/export administration

## Core capabilities

### Client management

- name, mobile, PAN, DOB, address, email, family group;
- encrypted ITR portal credential;
- search by name, PAN, mobile, invoice number, or acknowledgement number;
- complete history on one client profile.

### Assessment-year cases

- one case per client per assessment year;
- controlled workflow;
- next action, due/expected completion date, blocker, notes;
- multiple linked filing records;
- post-filing closure tracking.

### Filing records

Support applicable Original, Revised, Updated, Belated, and Rectification-related records with independent dates, references, documents, status, and notes.

### Documents

- private upload and authorised download;
- client and assessment-year classification;
- checklist state and history;
- ITR-V, intimation orders, notices, replies, and supporting proofs;
- no permanent public URLs.

### Invoices and payments

- invoice number `SDDS/ITR/{AY}/{Serial}`;
- serial resets each assessment year;
- one primary invoice per filing case unless a later approved adjustment model requires otherwise;
- line items, issue date, due date, total, discount, paid, balance, status, notes;
- manual Cash/UPI payments;
- printable/PDF invoice;
- distinct billed, received, outstanding, and overdue values.

### Refunds, intimations, and notices

Track relevant amount, status, dates, due dates, linked filings/documents, next action, result, and closure.

### Follow-up

- automatically enrol prior-year clients into the next assessment-year follow-up cycle after completion;
- manual exclusion with reason;
- excluded clients remain recoverable;
- one-click WhatsApp launch may be supported without automated sending in MVP;
- communication activity is recorded where implemented.

### Privacy and credentials

- Privacy Mode ON by default;
- intentional per-record reveal;
- PAN uppercase;
- intimation PDF password helper uses approved PAN + DOB derivation;
- credential reveal metadata may be audited without plaintext.

### Import and export

- CSV import for historical clients and assessment-year data after schema lock;
- upsert clients by canonical PAN;
- dry-run and row-level error report;
- one-click practical exports;
- complete backup/restore procedure.

## Non-goals for MVP

- public SaaS subscriptions;
- public client portal;
- payment gateway;
- advanced multi-role RBAC;
- maker-checker workflow;
- automated WhatsApp delivery;
- generic accounting or expense management;
- Google Drive as the authoritative document store;
- decorative analytics;
- unrelated government-service modules.
