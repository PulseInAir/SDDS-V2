-- Drop obsolete completed timestamp and archived constraints
alter table public.filing_cases drop constraint if exists filing_cases_completed_timestamp;
alter table public.filing_cases drop constraint if exists filing_cases_archived_terminal;

-- Re-create completed timestamp constraint for 'Filed' status
alter table public.filing_cases add constraint filing_cases_completed_timestamp check (
  (case_status = 'Filed' and completed_at is not null and cancelled_at is null)
  or (case_status <> 'Filed' and completed_at is null)
);

-- Re-create archived terminal status constraint for 'Filed' and 'Cancelled' statuses
alter table public.filing_cases add constraint filing_cases_archived_terminal check (
  archived_at is null or case_status in ('Filed', 'Cancelled')
);
