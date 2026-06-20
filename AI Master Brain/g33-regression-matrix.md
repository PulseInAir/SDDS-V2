# G33 — Full End-to-End Regression Matrix

**Task:** G33 — Full end-to-end regression  
**Phase:** Phase 9 — Hardening and release  
**Derived from:** `15-TESTING-ACCEPTANCE.md` § 5 Critical end-to-end flows  
**Prerequisite:** Owner must be signed in at http://localhost:3000

---

## Instructions

For each flow below:

1. Execute every step exactly as written.
2. Record **PASS** or **FAIL** in the Result column.
3. On FAIL, record the exact error message or symptom in Notes.
4. Do not mark G33 DONE until all 17 rows show PASS.

---

## Regression flows

| # | Flow | Steps | Expected result | Result | Notes |
|---|------|-------|-----------------|--------|-------|
| F-01 | Sign in and sign out | 1. Open http://localhost:3000 unauthenticated. 2. Confirm redirect to /login. 3. Enter valid owner credentials and submit. 4. Confirm redirect to dashboard. 5. Click Sign out. 6. Confirm redirect to /login. | Redirect to /login when unauthenticated. Dashboard loads after sign-in. /login after sign-out. | | |
| F-02 | Create and edit client | 1. Navigate to /clients. 2. Click new client. 3. Enter full name, PAN (uppercase), mobile, email. 4. Submit. 5. Confirm client appears in list. 6. Open client. 7. Click edit. 8. Change mobile. 9. Save. 10. Confirm change persists. | Client created, listed, editable, change saved. PAN stored uppercase. | | |
| F-03 | Create filing case for selected AY | 1. Open a client. 2. Navigate to Assessment Years tab. 3. Select or create an AY. 4. Create a filing case. 5. Confirm case appears with status `enquiry` or first valid status. | Case created and visible under the correct client and AY. | | |
| F-04 | Move case through valid statuses; reject invalid transition | 1. Open the filing case created in F-03. 2. Advance through each valid status in sequence (e.g. enquiry → docs_pending → docs_received → in_progress → filed). 3. Confirm each valid transition saves. 4. Attempt to skip a step or move backward to a forbidden state. 5. Confirm the invalid transition is rejected with an error. | All valid transitions save. Invalid transition shows an error and does not change the status. | | |
| F-05 | Add Original filing record | 1. Open a filed case. 2. Navigate to Filings tab. 3. Add a new filing record of type `original`. 4. Enter acknowledgement number, filing date, and notes. 5. Save. 6. Confirm filing record appears. | Original filing record created and visible. | | |
| F-06 | Add Revised filing without overwriting Original | 1. With an existing Original filing from F-05, add a new filing of type `revised`. 2. Enter a different acknowledgement number. 3. Save. 4. Confirm both Original and Revised records are listed independently. | Original record unchanged. Revised record appears as a separate row. | | |
| F-07 | Upload, view, replace, and archive private document | 1. Open a client. 2. Navigate to Documents tab. 3. Upload a PDF (< 5 MB). 4. Confirm it appears in the list. 5. Click download/view and confirm it opens via signed URL. 6. Upload a replacement version of the same document. 7. Confirm the new version is current and old version is in history. 8. Archive the document. 9. Confirm it moves to archived state. | Upload succeeds. Signed URL works. Version history recorded. Archive changes status. | | |
| F-08 | Create and issue invoice | 1. Open a client's Invoices tab. 2. Create a new invoice (add at least one line item with description, qty, unit amount). 3. Confirm invoice number follows `SDDS/ITR/{AY}/{Serial}` format. 4. Confirm status is `draft`. 5. Issue the invoice. 6. Confirm status changes to `issued`. | Invoice created with correct number format. Draft → issued transition works. | | |
| F-09 | Record partial and final payments | 1. On an issued invoice from F-08, record a partial payment (Cash or UPI). 2. Confirm status changes to `partially_paid`. 3. Confirm received amount and outstanding amount update correctly. 4. Record a second payment to bring balance to zero. 5. Confirm status changes to `paid`. | Partial payment updates amounts and status. Final payment closes the invoice. | | |
| F-10 | Verify billed / received / outstanding / overdue totals | 1. Navigate to /invoices global list. 2. Confirm total billed, total received, total outstanding, and overdue counts/amounts match the sum of individual invoice records. 3. Navigate to the dashboard. 4. Confirm the financial exception metrics match. | All four financial aggregates reconcile across list view and dashboard. | | |
| F-11 | Record refund | 1. Open a client. 2. Navigate to Refunds tab. 3. Create a refund record (amount, status, AY). 4. Save. 5. Confirm refund appears in the client refunds tab and in /refunds global list. 6. Update the refund status. 7. Confirm update saves. | Refund created, listed globally, status update persists. | | |
| F-12 | Record intimation / notice and due action | 1. Open a client. 2. Navigate to Notices tab. 3. Create a notice record (type, due date, description). 4. Save. 5. Confirm it appears in the list. 6. Update with a response note and mark resolved/closed. 7. Confirm status update saves. | Notice created with due date. Response recorded. Status closure saves. | | |
| F-13 | Complete case and create next-year follow-up | 1. Advance a filing case to `completed` status. 2. Navigate to /follow-up. 3. Confirm the client appears in the follow-up queue for the next AY. 4. Exclude the client with a reason. 5. Confirm the client shows as excluded but remains in the list (recoverable). 6. Reactivate the excluded client. 7. Confirm they return to the active queue. | Case completion auto-creates follow-up. Exclusion and reactivation work. | | |
| F-14 | Search by name, PAN, mobile, invoice number, acknowledgement number | 1. Use the global search (top utility bar). 2. Search by a client's name. Confirm correct result. 3. Search by PAN. Confirm correct result. 4. Search by mobile. Confirm correct result. 5. Search by an invoice number (`SDDS/ITR/...`). Confirm correct result. 6. Search by an acknowledgement number. Confirm correct result. | All five search types return the correct record. Privacy Mode masks values in results but records are still findable. | | |
| F-15 | Run CSV import dry-run and commit approved rows | 1. Navigate to /settings/import. 2. Upload a well-formed CSV with at least 2 client rows. 3. Run the dry-run. 4. Confirm row-level validation results (pass/fail per row). 5. Commit the import. 6. Confirm imported clients appear in /clients. 7. Run a second import with the same CSV (upsert). 8. Confirm no duplicate clients are created. | Dry-run shows per-row results. Commit imports valid rows. Upsert does not duplicate by PAN. | | |
| F-16 | Generate export | 1. Navigate to /settings/export. 2. Generate each available export type (clients, invoices, etc.). 3. Confirm each download returns a non-empty file. 4. Confirm no unmasked sensitive values are included unless export is explicitly authorised. | All export types download. Files are non-empty. Sensitive values handled correctly. | | |
| F-17 | Restore test in non-production environment | 1. From /settings, trigger a backup export. 2. Confirm the backup file is generated and downloadable. 3. Document the restore procedure reference from `14-BACKUP-EXPORT-RESTORE.md`. 4. Confirm the restore procedure steps are complete and tested in a non-production environment. | Backup export succeeds. Restore procedure exists and is complete. | | |

---

## Sign-off

| Item | Result |
|------|--------|
| All 17 flows PASS | |
| No unexplained console errors during regression | |
| Privacy Mode verified ON by default | |
| No browser network errors on core routes | |
| Executed by | |
| Date | |

Once all rows above show PASS, report to agent to mark G33 DONE and proceed to G34.
