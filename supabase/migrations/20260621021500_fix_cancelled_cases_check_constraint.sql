-- Drop obsolete cancelled timestamp constraint
alter table public.filing_cases drop constraint if exists filing_cases_cancelled_timestamp;

-- Re-create cancelled timestamp constraint for 'Cancelled' status
alter table public.filing_cases add constraint filing_cases_cancelled_timestamp check (
  (case_status = 'Cancelled' and cancelled_at is not null and completed_at is null)
  or (case_status <> 'Cancelled' and cancelled_at is null)
);
