# SDDS CSV Import Contract

Import is implemented only after the schema and core validation are accepted.

## 1. Goals

- bootstrap historical clients and assessment-year records;
- upsert clients by canonical uppercase PAN;
- create/link cases, filings, invoices, and payments without duplicate history;
- provide dry-run preview and row-level errors;
- preserve an auditable import job.

## 2. Required flow

1. Upload authorised CSV.
2. Validate file type, size, encoding, and headers.
3. Parse into a staging job; do not write business tables yet.
4. Normalise PAN, dates, AY, amounts, and controlled statuses.
5. Show field mapping and validation summary.
6. Run duplicate/conflict checks.
7. Produce dry-run counts: create, update, skip, error.
8. Require explicit commit action.
9. Execute in safe batches/transactions with idempotency key.
10. Store row outcomes and exportable error report.

## 3. Duplicate rules

- Client identity: workspace + canonical PAN.
- Filing case: client + AY.
- Filing record: use acknowledgement/reference where available plus filing kind/date; ambiguous rows are errors, not silent merges.
- Invoice: invoice number if provided; otherwise explicit deterministic import key.
- Payment: invoice + date + amount + reference/import key; ambiguous duplicates require review.

## 4. Safety

- Never overwrite encrypted credentials from an empty or invalid cell.
- Never downgrade or erase richer existing data silently.
- Never map unknown free-text status automatically to a controlled status without an approved mapping.
- Preserve original source row and error context according to retention rules.
- Import commit must be reversible by job where technically practical, or have a documented restore path.
