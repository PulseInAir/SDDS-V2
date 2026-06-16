# SDDS Workflow Contract

## 1. Separate state dimensions

Do not compress all tax operations into one status field.

1. `case_status` — preparation and overall operational state.
2. `verification_status` — e-verification / ITR-V state on a filing record.
3. `processing_status` — department processing state on a filing record.
4. `refund_status` — refund lifecycle.
5. `tax_event_status` — intimation/notice lifecycle.
6. `invoice_status` — billing lifecycle.
7. `follow_up_status` — annual follow-up lifecycle.

## 2. Filing case statuses

1. New Client
2. Documents Pending
3. Verification Pending
4. Computation In Progress
5. Client Approval Pending
6. Ready To File
7. Filed
8. Completed
9. Rectification Required
10. Notice Received
11. On Hold
12. Cancelled

## 3. Normal transition path

`New Client → Documents Pending → Verification Pending → Computation In Progress → Client Approval Pending → Ready To File → Filed → Completed`

## 4. Controlled alternate transitions

- Documents Pending ↔ Verification Pending when submissions are incomplete or rejected.
- Verification Pending ↔ Computation In Progress when data problems are found.
- Computation In Progress ↔ Client Approval Pending when recalculation is required.
- Client Approval Pending ↔ Ready To File when approval changes.
- Filed → Rectification Required or Notice Received when post-filing attention arises.
- Rectification Required → Computation In Progress, Filed, or Completed according to the real action.
- Notice Received → Rectification Required or Completed according to resolution.
- Any active state may move to On Hold with reason and review date.
- On Hold returns to the recorded prior active state or moves to Cancelled.
- Cancelled preserves history. Reopening requires authorised action, reason, and a defined target state.

Backend validation must enforce allowed transitions. UI must show only valid next states.

## 5. Transition requirements

### Move to Documents Pending

A document request/checklist exists or a clear missing-document note is recorded.

### Move to Verification Pending

Required documents marked received are ready for validation.

### Move to Computation In Progress

Minimum verified inputs required for computation are present.

### Move to Client Approval Pending

Computation/review output exists and is ready for client confirmation.

### Move to Ready To File

Required approval is recorded and mandatory filing data is valid.

### Move to Filed

A filing record with filing date and acknowledgement/reference information is created, or a clearly defined temporary exception state is recorded when the portal has not yet produced the reference.

### Move to Completed

All applicable conditions are satisfied:

- filing record exists;
- acknowledgement/ITR-V is stored when applicable;
- e-verification/ITR-V requirement is complete;
- critical post-filing closure checks are complete;
- unresolved notice/rectification work is absent;
- next-year follow-up has been created or intentionally excluded.

## 6. Filing record workflow

- Original is created first when applicable.
- Revised/Updated/Belated records are new rows and link to the relevant prior record.
- Filing records retain independent acknowledgement, dates, verification state, processing state, documents, and notes.
- A later record does not erase the earlier record from history or reporting.

## 7. Verification statuses

Recommended controlled values:

- Not Required
- Pending
- e-Verified
- ITR-V Sent
- ITR-V Received
- Failed / Attention Required

Exact labels may be refined before the migration, but the dimension remains separate.

## 8. Processing statuses

- Not Submitted
- Submitted
- Under Processing
- Processed
- Defective / Attention Required

## 9. Invoice workflow

`Draft → Issued → Partially Paid → Paid`

- Issued becomes Overdue when due date passes with balance remaining.
- Cancelled is preserved and cannot receive normal payments.
- Payment reversals recalculate status.

## 10. Follow-up workflow

`Scheduled → Due → Contacted → Waiting → Completed`

Alternative states: Excluded, Cancelled.

Completion of a filing case creates or enables the next assessment-year follow-up unless excluded with a reason.

## 11. Board and table contract

Board and table use the same filtered filing-case dataset.

- Board groups by `case_status`.
- Table exposes searchable, sortable operational fields.
- Moving a card invokes the same validated transition action as the detail view.
- Counts, filters, privacy masking, and pagination semantics must reconcile.
