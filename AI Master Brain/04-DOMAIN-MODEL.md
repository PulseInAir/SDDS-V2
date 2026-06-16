# SDDS Domain Model Contract

This is the logical model. SQL migrations must preserve these meanings and use typed constraints.

## 1. Workspace and users

### `workspaces`

One SDDS workspace now. Keeps future staff support possible without multi-tenant product complexity.

Core fields: id, name, created_at, archived_at.

### `workspace_members`

Links Supabase Auth users to the workspace.

Core fields: workspace_id, user_id, role (`owner` initially), active, created_at.

## 2. Clients

### `clients`

Permanent identity record.

Core fields:

- id, workspace_id;
- full_name;
- pan_uppercase, unique within workspace;
- date_of_birth;
- mobile, email, address;
- family_group;
- active;
- follow_up_excluded, exclusion_reason;
- created_at, updated_at, archived_at.

Rules:

- PAN is normalised to uppercase before validation and storage.
- A client is not duplicated per assessment year.
- Archive instead of destructive deletion where history exists.

### `client_credentials`

One active ITR portal credential record per client, versionable when credentials change.

Core fields:

- client_id, workspace_id;
- encrypted_payload;
- encryption_version;
- updated_at, updated_by;
- archived_at.

Never expose encrypted payloads through broad client-list queries.

## 3. Assessment years and cases

### `assessment_years`

Configured assessment-year records used for selection and invoice sequencing.

Core fields: id, label (`2026-27`), start_date, end_date, is_current, is_open.

### `filing_cases`

One operational case per client and assessment year.

Core fields:

- id, workspace_id, client_id, assessment_year_id;
- case_status;
- return_category/ITR type when known;
- next_action;
- due_date;
- expected_completion_date;
- blocker_code and blocker_note;
- hold_reason and next_review_date;
- completed_at, cancelled_at;
- follow_up_excluded for this cycle where needed;
- created_at, updated_at, archived_at.

Constraint: unique active `(workspace_id, client_id, assessment_year_id)`.

### `case_status_history`

Append-only status transition history.

Core fields: case_id, from_status, to_status, reason, changed_by, changed_at.

## 4. Filing records

### `filing_records`

Multiple records per filing case.

Core fields:

- case_id, workspace_id;
- filing_kind: Original, Revised, Updated, Belated, Rectification Request, Rectification Response;
- parent_filing_record_id where linked;
- filing_date;
- acknowledgement/reference number;
- verification_status and verification_date;
- processing_status;
- notes;
- created_at, updated_at, archived_at.

Rules:

- A revision links to the filing it revises.
- Original records are immutable except controlled correction with audit history.
- Acknowledgement/reference numbers are searchable and appropriately constrained.

## 5. Documents

### `documents`

Metadata for private Supabase Storage objects.

Core fields:

- workspace_id, client_id, case_id optional, filing_record_id optional;
- assessment_year_id optional;
- document_type;
- checklist_status: Required, Requested, Received, Verified, Rejected, Replacement Needed, Not Applicable;
- storage_bucket, storage_path;
- original_filename, safe_filename, mime_type, size_bytes, checksum when available;
- version, replaces_document_id optional;
- uploaded_by, uploaded_at, verified_by, verified_at;
- archived_at.

Rule: replacement creates a new version; it does not silently destroy history.

## 6. Invoices and payments

### `invoice_sequences`

Atomic serial allocation by workspace and assessment year.

### `invoices`

Core fields:

- workspace_id, client_id, case_id, assessment_year_id;
- invoice_number, serial_number;
- status: Draft, Issued, Partially Paid, Paid, Overdue, Cancelled;
- issue_date, due_date;
- subtotal, discount_amount, total_amount;
- notes;
- issued_at, cancelled_at;
- created_at, updated_at, archived_at.

### `invoice_items`

Description, quantity, unit amount, line amount, display order.

### `payments`

Core fields:

- workspace_id, invoice_id;
- payment_date, amount;
- mode: Cash or UPI;
- reference, note;
- recorded_by, created_at, reversed_at.

Rules:

- paid and balance values are derived from valid, non-reversed payments.
- overpayment requires a later explicit adjustment/refund contract; do not silently accept it.

## 7. Refunds and tax communications

### `refunds`

Core fields: case_id, filing_record_id, expected_amount, status, last_checked_at, received_amount, received_date, discrepancy_note, next_action, archived_at.

### `tax_events`

Unified record for intimations, notices, demands, and rectification-related communications.

Core fields:

- case_id, filing_record_id optional;
- event_type;
- category;
- issue_date, received_date, response_due_date;
- status;
- next_action;
- submission_reference;
- closure_date, outcome;
- archived_at.

Related documents attach through `documents`.

## 8. Follow-up and communication

### `follow_ups`

Core fields: client_id, case_id optional, assessment_year_id, type, due_date, status, exclusion_reason, completed_at, note.

### `communications`

Core fields: client_id, case_id optional, channel, direction, occurred_at, summary, external_reference optional, created_by.

Do not store unnecessary message content or secrets.

## 9. Activity and audit

### `activity_events`

Business timeline events visible to the operator.

### `audit_events`

Security and sensitive-operation evidence. Store actor, action, target type/id, timestamp, and safe metadata. Never store decrypted credentials.

## 10. Import operations

### `import_jobs` and `import_rows`

Track uploaded file metadata, mapping version, dry-run result, row errors, commit status, and counts. Raw uploaded import files must follow approved retention and access rules.

## 11. Relationship summary

- Workspace has members and all business records.
- Client has credentials and many filing cases.
- Filing case belongs to one assessment year and has many filing records, documents, invoices, refunds, tax events, follow-ups, communications, and activity events.
- Invoice has items and payments.
- Documents may attach to client, case, filing record, or tax event context without losing client and workspace ownership.
