# SDDS Data and Query Contracts

Every displayed operational value must map to an authoritative query. Names below describe behaviour; implementation may use SQL views/RPC/server queries after review.

## 1. Global search

Search supported indexed fields:

- client name;
- canonical PAN;
- mobile;
- invoice number;
- acknowledgement/reference number.

Return result type, masked identifier, context, and destination. Never return portal credentials.

## 2. Dashboard metrics for selected AY

| Metric | Source rule | Destination |
|---|---|---|
| Active clients | active filing cases in selected AY | filing queue, all active |
| New / Yet to start | case status New Client | filtered filing queue |
| Documents pending | case status Documents Pending or required checklist exception | filtered queue/documents |
| Verification pending | case status Verification Pending | filtered queue |
| Computation in progress | matching case status | filtered queue |
| Approval pending | matching case status | filtered queue |
| Ready to file | matching case status | filtered queue |
| Filed, not complete | case status Filed and closure incomplete | filtered queue |
| Completed | case status Completed | filtered queue |
| Attention cases | Rectification Required, Notice Received, overdue, or blocker | filtered attention view |
| Refunds pending | unresolved refund records | filtered refunds |
| Notices due | open tax events with due date | filtered notices |
| Billed | valid issued invoice totals | invoices |
| Received | valid non-reversed payment sum | invoices/payments |
| Outstanding | invoice total minus valid payments | unpaid/partial invoices |
| Overdue | outstanding invoices past due | overdue invoices |
| Follow-ups due | due/overdue follow-up records | follow-up |

Zero is displayed as zero. Query failure is an error state, never zero.

## 3. Filing Queue base dataset

One row/card per active filing case, joining only required fields:

- case id;
- client id and name;
- masked PAN/mobile projection;
- assessment year;
- ITR type when known;
- case status;
- next action;
- due/expected date;
- blocker;
- required/missing document counts;
- latest filing kind/date/reference summary;
- unresolved notice/refund/payment attention flags;
- updated_at.

Board and table consume this same contract.

## 4. Client profile

Load identity separately from sensitive credential data. Load tab/section data intentionally to avoid one unbounded payload.

- current/selected case summary;
- AY history;
- filing records;
- documents and checklist;
- invoices/payments;
- refunds;
- tax events;
- communications/activity;
- credential status, not plaintext.

Plaintext password is returned only by an authorised reveal action.

## 5. Financial reconciliation

For each invoice:

- `paid_amount = SUM(valid, non-reversed payments)`;
- `balance = total_amount - paid_amount`;
- status derives from lifecycle plus amount/due date;
- dashboard aggregates the same definitions.

Never maintain independent editable copies of these totals.

## 6. Activity feed

Use business-relevant append-only events, newest first, paginated. Activity display must avoid sensitive values.

## 7. Query performance

- Index workspace, client, AY, status, due dates, invoice number, acknowledgement/reference, PAN, and normalised search fields where justified.
- Paginate list views.
- Do not select document blobs or encrypted credential payloads in general queries.
- Verify query counts and explain plans for critical screens before release.
