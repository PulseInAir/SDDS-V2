# SDDS Route and Page Contracts

Final route naming may use route groups, but user-facing paths and purposes must remain simple.

| Route | Purpose | Primary action |
|---|---|---|
| `/login` | Authenticate internal user | Sign in |
| `/` | Operational dashboard for selected AY | Contextual work action |
| `/clients` | Search/filter all clients | Add Client |
| `/clients/new` | Create permanent client record | Save Client |
| `/clients/[clientId]` | Complete client source of truth | Contextual edit/action |
| `/filing-queue` | Board/table of filing cases | Contextual case action |
| `/filing-queue/[caseId]` | Full filing-case context | Valid next workflow action |
| `/documents` | Document checklist and exceptions | Upload/record document |
| `/invoices` | Invoices, balances, and payment exceptions | Create Invoice |
| `/invoices/[invoiceId]` | Invoice detail, print/PDF, payments | Record Payment |
| `/refunds` | Refund tracking and follow-up | Update Refund |
| `/notices` | Intimations, notices, demands, rectification | Add/Update Tax Event |
| `/follow-up` | Annual and case follow-up queue | Record Contact |
| `/settings` | Workspace, AY, privacy, invoice, export settings | Save Settings |
| `/settings/import` | CSV import jobs and mapping | Start Import |
| `/settings/export` | Data export and backup controls | Generate Export |

## Global shell

Available on authenticated routes:

- route-aware sidebar;
- global search;
- selected Assessment Year;
- Privacy Mode;
- contextual primary action;
- account/logout.

## Dashboard

Sections in order:

1. selected AY context;
2. urgent attention strip;
3. workflow distribution;
4. urgent work queue;
5. financial exceptions;
6. follow-ups due;
7. recent activity.

Every metric defines a query and filtered destination.

## Clients list

Visible fields where privacy permits:

- client name;
- masked PAN;
- masked mobile;
- selected AY case status;
- missing-document indicator;
- payment/attention indicator;
- next action/due date.

Search, AY filter, status filter, attention filter, pagination.

## Client profile

Header: identity, privacy-safe contacts, current case summary, primary action.

Context sections/tabs:

- Overview
- Assessment Years
- Documents
- Filings
- Invoices & Payments
- Refunds
- Intimations / Notices
- Communication & Activity
- Credentials

Avoid duplicate editable identity forms across tabs.

## Filing Queue

- Board/Table switcher.
- Same query, filters, privacy rules, and status meanings.
- Filters: AY, status, return type, due/overdue, blocker, missing documents.
- Case card/row exposes name, masked PAN, status, next action, due date, blocker, key progress indicators.

## Documents

- Exceptions-first view;
- filters by AY, client, type, checklist status;
- upload/history/details;
- signed download only.

## Invoices

- search client/invoice number;
- filter AY, status, overdue;
- columns for issued, due, total, paid, balance;
- no confusion between billed and received.

## Refunds and Notices

Prioritise due, overdue, blocked, and unresolved records. Link back to client, case, filing, and documents.

## Follow-up

Prioritise current due action, last contact, selected AY, exclusion state, and next step. WhatsApp launch is an explicit action, not an automated integration unless later approved.
