# SDDS Project Lock

**Status:** AUTHORITATIVE  
**Version:** 2.0-greenfield  
**Effective date:** 16 June 2026

## 1. Product lock

SDDS is a private internal ITR practice-management operating system for Single Digit Data Solutions. It is not a public SaaS, marketplace, generic CRM, public client portal, or multi-tenant product for other firms.

## 2. Core work object

The central operational object is:

`Client + Assessment Year = Filing Case`

Every operational record must attach to the permanent client, the filing case, or both.

## 3. Design lock

SDDS uses one iDWELL-inspired operational CRM system. Borrow only:

- information hierarchy;
- useful information density;
- predictable navigation logic;
- case-centred workflow presentation;
- board and table views of the same records;
- contextual tasks, communication, documents, and history.

Do not copy iDWELL identity or property-management content. Do not mix the previous screenshot-driven blue-gradient dashboard, generic AI-dashboard aesthetics, or any second design system into the main application.

## 4. Architecture lock

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase private Storage
- Vercel
- GitHub
- server-first data access
- Row-Level Security on all business data
- AES-256-GCM-compatible reversible encryption for retrievable portal credentials

Netlify, Firebase, Google Drive as primary storage, payment gateways, and public object URLs are excluded from the MVP.

## 5. Data lock

- One permanent client record.
- One filing case per client per assessment year.
- Multiple linked filing records per case.
- Original, revised, updated, belated, and rectification-related records are never silently overwritten.
- PAN is canonical uppercase.
- Historical business records use archive/soft-delete where recovery matters.
- Financial totals derive from invoices and payments, not manually duplicated dashboard fields.

## 6. Privacy lock

Privacy Mode is ON by default. PAN, mobile, address, portal credentials, revenue, invoice/payment values, and refund amounts are masked unless intentionally revealed in an authorised context.

## 7. Dashboard lock

The dashboard is built after the operational model and core modules. It is a projection of real queries and exceptions. It must prioritise urgent work, blockers, deadlines, workflow distribution, financial exceptions, follow-ups, and recent activity.

Decorative charts, fake trends, fake percentages, duplicated metrics, and oversized low-information cards are prohibited.

## 8. Delivery lock

One task is executed at a time. A task becomes DONE only after scope review, verification, Git commit, push, ledger update, and handoff update.

## 9. Change control

A locked rule changes only when:

1. the owner explicitly approves the change;
2. the decision is recorded with a new ID or revision in `02-DECISION-REGISTER.md`;
3. all affected contracts are updated;
4. dependent pending tasks are reviewed;
5. the change is committed.

Verbal drift in a later agent response is not an approved change.
