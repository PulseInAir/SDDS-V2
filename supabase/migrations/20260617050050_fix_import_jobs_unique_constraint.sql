-- Add the composite unique constraint on import_jobs(workspace_id, id)
-- required by the import_rows foreign key reference added in
-- 20260618110000_add_import_rows_tracking.sql.
-- The primary key on id already guarantees uniqueness; this constraint
-- allows multi-column FK references from child tables.

alter table public.import_jobs
  add constraint import_jobs_workspace_id_id_unique unique (workspace_id, id);
