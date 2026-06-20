-- Drop old check constraints
alter table public.filing_cases drop constraint if exists filing_cases_status_allowed;
alter table public.case_status_history drop constraint if exists case_status_history_from_status_allowed;
alter table public.case_status_history drop constraint if exists case_status_history_to_status_allowed;

-- Add updated check constraints with correct statuses
alter table public.filing_cases add constraint filing_cases_status_allowed check (
  case_status in (
    'New Client',
    'Documents Pending',
    'Verification Pending',
    'Computation In Progress',
    'Client Approval Pending',
    'Ready To File',
    'Filed',
    'Completed',
    'Rectification Required',
    'Notice Received',
    'On Hold',
    'Cancelled'
  )
);

alter table public.case_status_history add constraint case_status_history_from_status_allowed check (
  from_status is null or from_status in (
    'New Client',
    'Documents Pending',
    'Verification Pending',
    'Computation In Progress',
    'Client Approval Pending',
    'Ready To File',
    'Filed',
    'Completed',
    'Rectification Required',
    'Notice Received',
    'On Hold',
    'Cancelled'
  )
);

alter table public.case_status_history add constraint case_status_history_to_status_allowed check (
  to_status in (
    'New Client',
    'Documents Pending',
    'Verification Pending',
    'Computation In Progress',
    'Client Approval Pending',
    'Ready To File',
    'Filed',
    'Completed',
    'Rectification Required',
    'Notice Received',
    'On Hold',
    'Cancelled'
  )
);
