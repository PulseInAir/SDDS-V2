alter table public.assessment_years
  add constraint assessment_years_workspace_id_id_unique unique (workspace_id, id);

create table public.filing_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  assessment_year_id uuid not null,
  case_status text not null default 'not_started',
  return_category text,
  next_action text,
  due_date date,
  expected_completion_date date,
  blocker_code text,
  blocker_note text,
  hold_reason text,
  next_review_date date,
  completed_at timestamptz,
  cancelled_at timestamptz,
  follow_up_excluded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint filing_cases_workspace_id_id_unique unique (workspace_id, id),
  constraint filing_cases_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint filing_cases_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id),
  constraint filing_cases_status_allowed check (
    case_status in (
      'not_started',
      'documents_pending',
      'ready_to_prepare',
      'preparation_in_progress',
      'review_pending',
      'ready_to_file',
      'filed',
      'verification_pending',
      'completed',
      'on_hold',
      'cancelled'
    )
  ),
  constraint filing_cases_return_category_allowed check (
    return_category is null
    or return_category in ('ITR-1','ITR-2','ITR-3','ITR-4','ITR-5','ITR-6','ITR-7')
  ),
  constraint filing_cases_next_action_not_blank check (
    next_action is null or btrim(next_action) <> ''
  ),
  constraint filing_cases_blocker_code_not_blank check (
    blocker_code is null or btrim(blocker_code) <> ''
  ),
  constraint filing_cases_blocker_note_not_blank check (
    blocker_note is null or btrim(blocker_note) <> ''
  ),
  constraint filing_cases_hold_reason_required check (
    case_status <> 'on_hold' or nullif(btrim(hold_reason), '') is not null
  ),
  constraint filing_cases_completed_timestamp check (
    (case_status = 'completed' and completed_at is not null and cancelled_at is null)
    or (case_status <> 'completed' and completed_at is null)
  ),
  constraint filing_cases_cancelled_timestamp check (
    (case_status = 'cancelled' and cancelled_at is not null and completed_at is null)
    or (case_status <> 'cancelled' and cancelled_at is null)
  ),
  constraint filing_cases_archived_terminal check (
    archived_at is null or case_status in ('completed','cancelled')
  )
);

create unique index filing_cases_one_active_per_client_ay_idx
  on public.filing_cases (workspace_id, client_id, assessment_year_id)
  where archived_at is null;
create index filing_cases_workspace_status_idx
  on public.filing_cases (workspace_id, case_status, due_date, updated_at desc)
  where archived_at is null;
create index filing_cases_client_idx
  on public.filing_cases (workspace_id, client_id, assessment_year_id);
create index filing_cases_ay_idx
  on public.filing_cases (workspace_id, assessment_year_id, case_status);

create table public.filing_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  case_id uuid not null,
  filing_kind text not null,
  parent_filing_record_id uuid,
  filing_date date not null,
  acknowledgement_number text,
  verification_status text not null default 'pending',
  verification_date date,
  processing_status text not null default 'submitted',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint filing_records_workspace_case_id_id_unique unique (workspace_id, case_id, id),
  constraint filing_records_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint filing_records_parent_same_case_fk
    foreign key (workspace_id, case_id, parent_filing_record_id)
    references public.filing_records(workspace_id, case_id, id),
  constraint filing_records_kind_allowed check (
    filing_kind in (
      'original',
      'revised',
      'updated',
      'belated',
      'rectification_request',
      'rectification_response'
    )
  ),
  constraint filing_records_parent_rule check (
    (filing_kind in ('revised','rectification_response') and parent_filing_record_id is not null)
    or (filing_kind not in ('revised','rectification_response'))
  ),
  constraint filing_records_not_self_parent check (
    parent_filing_record_id is null or parent_filing_record_id <> id
  ),
  constraint filing_records_ack_not_blank check (
    acknowledgement_number is null or btrim(acknowledgement_number) <> ''
  ),
  constraint filing_records_verification_status_allowed check (
    verification_status in ('pending','e_verified','physical_verified','failed','not_required')
  ),
  constraint filing_records_verification_date_rule check (
    (verification_status in ('e_verified','physical_verified') and verification_date is not null)
    or (verification_status not in ('e_verified','physical_verified') and verification_date is null)
  ),
  constraint filing_records_processing_status_allowed check (
    processing_status in ('submitted','processing','processed','defective','invalid','withdrawn')
  ),
  constraint filing_records_notes_not_blank check (
    notes is null or btrim(notes) <> ''
  )
);

create unique index filing_records_active_ack_unique_idx
  on public.filing_records (workspace_id, acknowledgement_number)
  where acknowledgement_number is not null and archived_at is null;
create index filing_records_case_date_idx
  on public.filing_records (workspace_id, case_id, filing_date desc)
  where archived_at is null;
create index filing_records_parent_idx
  on public.filing_records (workspace_id, case_id, parent_filing_record_id)
  where parent_filing_record_id is not null;
create index filing_records_processing_idx
  on public.filing_records (workspace_id, processing_status, filing_date desc)
  where archived_at is null;

create table public.case_status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  case_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now(),
  constraint case_status_history_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint case_status_history_from_status_allowed check (
    from_status is null or from_status in (
      'not_started','documents_pending','ready_to_prepare','preparation_in_progress',
      'review_pending','ready_to_file','filed','verification_pending',
      'completed','on_hold','cancelled'
    )
  ),
  constraint case_status_history_to_status_allowed check (
    to_status in (
      'not_started','documents_pending','ready_to_prepare','preparation_in_progress',
      'review_pending','ready_to_file','filed','verification_pending',
      'completed','on_hold','cancelled'
    )
  ),
  constraint case_status_history_transition_changes check (
    from_status is null or from_status <> to_status
  ),
  constraint case_status_history_reason_not_blank check (
    reason is null or btrim(reason) <> ''
  )
);

create index case_status_history_case_time_idx
  on public.case_status_history (workspace_id, case_id, changed_at desc);
create index case_status_history_changed_by_idx
  on public.case_status_history (changed_by, changed_at desc);

create trigger filing_cases_set_updated_at
before update on public.filing_cases
for each row execute function private.set_updated_at();

create trigger filing_records_set_updated_at
before update on public.filing_records
for each row execute function private.set_updated_at();

create or replace function private.prevent_case_status_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'case_status_history is append-only';
end;
$$;

create trigger case_status_history_append_only
before update or delete on public.case_status_history
for each row execute function private.prevent_case_status_history_mutation();

revoke all on function private.prevent_case_status_history_mutation() from public, anon, authenticated;

comment on table public.filing_cases is 'One operational filing case per client and assessment year.';
comment on table public.filing_records is 'Submission records separate from filing-case workflow state.';
comment on table public.case_status_history is 'Append-only evidence of filing-case status transitions.';
