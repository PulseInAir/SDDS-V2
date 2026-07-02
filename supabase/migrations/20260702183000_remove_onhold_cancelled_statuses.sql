-- Update any existing rows to prevent constraint failures
UPDATE public.filing_cases
  SET case_status = 'New Client'
  WHERE case_status IN ('On Hold', 'Cancelled');

UPDATE public.case_status_history
  SET from_status = 'New Client'
  WHERE from_status IN ('On Hold', 'Cancelled');

UPDATE public.case_status_history
  SET to_status = 'New Client'
  WHERE to_status IN ('On Hold', 'Cancelled');

-- Drop old check constraints
ALTER TABLE public.filing_cases DROP CONSTRAINT IF EXISTS filing_cases_status_allowed;
ALTER TABLE public.case_status_history DROP CONSTRAINT IF EXISTS case_status_history_from_status_allowed;
ALTER TABLE public.case_status_history DROP CONSTRAINT IF EXISTS case_status_history_to_status_allowed;

-- Add updated check constraints with only 'New Client', 'Filing Queue', and 'Filed'
ALTER TABLE public.filing_cases add constraint filing_cases_status_allowed check (
  case_status in (
    'New Client',
    'Filing Queue',
    'Filed'
  )
);

ALTER TABLE public.case_status_history add constraint case_status_history_from_status_allowed check (
  from_status is null or from_status in (
    'New Client',
    'Filing Queue',
    'Filed'
  )
);

ALTER TABLE public.case_status_history add constraint case_status_history_to_status_allowed check (
  to_status in (
    'New Client',
    'Filing Queue',
    'Filed'
  )
);

-- Drop columns that are no longer needed
ALTER TABLE public.filing_cases
  DROP COLUMN IF EXISTS hold_reason,
  DROP COLUMN IF EXISTS next_review_date,
  DROP COLUMN IF EXISTS cancelled_at;
