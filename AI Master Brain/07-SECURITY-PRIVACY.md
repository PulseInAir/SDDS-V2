# SDDS Security and Privacy Contract

## 1. Data classification

Highly sensitive:

- ITR portal credentials;
- PAN, Aadhaar when present, DOB;
- tax filings and documents;
- financial and refund data;
- private contact details.

## 2. Mandatory controls

- Authenticated internal access only.
- Least-privilege RLS on every business table and storage object.
- Service-role key only in trusted server environments.
- Private Storage only.
- Sensitive values absent from URLs, logs, analytics payloads, and broad list responses.
- Privacy Mode ON by default.
- Intentional record-specific reveal.
- Audit metadata for credential reveal/update without plaintext.

## 3. Credential encryption envelope

Store a versioned envelope containing:

- version;
- algorithm identifier;
- nonce/IV;
- ciphertext;
- authentication tag when not included by the library.

Requirements:

- AES-256-GCM or reviewed equivalent;
- unique nonce per encryption;
- server-only key;
- authenticated additional data may bind workspace/client/version;
- key validation at startup without printing the key;
- no silent re-encryption after decryption failure;
- key rotation requires an explicit migration plan and backup.

## 4. Privacy Mode

Mask by default:

- PAN except safe fragment;
- mobile except safe fragment;
- full address;
- portal password;
- revenue, invoice, payment, and refund values.

Rules:

- Global Privacy Mode affects supported screens consistently.
- Password reveal remains a separate deliberate action even when Privacy Mode is off.
- Masking is not authorisation; sensitive data should not be fetched unnecessarily.

## 5. Storage security

- No public bucket.
- No permanent public URL.
- Signed URL lifetime is short and appropriate to the action.
- Upload/download/delete operations verify membership and record ownership.
- Replacement preserves document history.
- Deletion is auditable and normally archives metadata.

## 6. Audit events

Record where applicable:

- login/security events;
- client create and sensitive-field updates;
- credential update and reveal metadata;
- filing-status changes;
- document upload/download/archive;
- invoice/payment changes;
- refund/tax-event changes;
- import/export/backup actions.

Do not put secrets or full sensitive values in metadata.

## 7. RLS verification

Every migration task affecting data must test:

- authorised owner can read/write intended records;
- unauthenticated access fails;
- a user without membership fails;
- cross-workspace access fails, even though only one workspace exists now;
- storage object access follows the same ownership model.

## 8. Destructive operations

- Use archive/soft-delete for clients, cases, filings, invoices, tax events, and document metadata where recovery matters.
- Destructive cleanup requires confirmation, dependency checks, audit evidence, and backup.
- Never use broad delete/update statements on production data without explicit owner approval.

## 9. Export and backup

Exports are authorised, audited, generated server-side, and protected during temporary storage/download. Backup files are encrypted or stored in a protected destination according to the approved backup decision.
