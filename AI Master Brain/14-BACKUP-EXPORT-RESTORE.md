# SDDS Backup, Export, and Restore Contract

## 1. Objectives

- Device loss must not cause business-data loss.
- The operator can export practical business data.
- Database and document recovery are tested, not merely configured.

## 2. Business exports

Authorised export sets:

- clients;
- filing cases and filing records;
- document metadata;
- invoices and items;
- payments;
- refunds;
- tax events;
- follow-ups;
- activity/audit summaries where appropriate.

Formats: CSV for tabular modules and a documented full export package where practical. Sensitive columns are included only in explicitly authorised exports; decrypted portal passwords are excluded by default.

## 3. Backup layers

1. Supabase database backup capability available to the selected plan.
2. Scheduled logical export strategy compatible with zero-cost constraints.
3. Private Storage inventory/object backup strategy.
4. Repository and migrations in GitHub.
5. Environment-secret recovery procedure stored outside the repository.

## 4. Approved backup decision

- Off-platform destination: private Google Drive folder controlled by the owner.
- Primary live store: Supabase private Storage remains authoritative for runtime document access.
- Backup format: encrypted backup package before upload to Google Drive; no raw decrypted credential export.
- Retention: daily backup packages retained for 30 days.
- Access rule: backup packages remain private to the owner and are never linked from SDDS with public URLs.

This decision unblocks production backup implementation without changing the locked storage architecture.

## 5. Restore test

Before production launch and periodically thereafter:

- download the encrypted backup package from the approved private Google Drive folder;
- decrypt the package in a trusted non-production recovery environment using the protected operator-held key;
- restore to a non-production environment;
- verify row counts and critical relationships;
- verify documents are accessible through authorised paths;
- verify encrypted credentials remain decryptable with the protected key;
- run critical workflow smoke tests;
- record date, operator, result, and issues.

A backup without a tested restore is not considered complete.

## 6. Minimum operator procedure

1. Generate the authorised SDDS business exports from `/settings/export`.
2. Export the private document inventory and copy the referenced Supabase private Storage objects into the same backup working set.
3. Package the database exports, document copies, and restore notes together.
4. Encrypt the package before leaving the trusted local environment.
5. Upload the encrypted package to the approved private Google Drive folder.
6. Keep one backup package per day for 30 days, deleting older packages only after a newer encrypted package is confirmed present.
7. Record the backup date and the next planned restore verification in the operator log.
