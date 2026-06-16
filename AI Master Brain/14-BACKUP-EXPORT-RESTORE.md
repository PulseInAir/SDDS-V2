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

## 4. Unresolved owner decision

Destination, retention, and encryption for off-platform backups must be approved before production release. This does not block local schema/application development.

## 5. Restore test

Before production launch and periodically thereafter:

- restore to a non-production environment;
- verify row counts and critical relationships;
- verify documents are accessible through authorised paths;
- verify encrypted credentials remain decryptable with the protected key;
- run critical workflow smoke tests;
- record date, operator, result, and issues.

A backup without a tested restore is not considered complete.
