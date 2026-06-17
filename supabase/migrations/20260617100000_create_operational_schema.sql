create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  case_id uuid not null,
  filing_record_id uuid,
  expected_amount numeric(14,2),
  status text not null default 'pending',
  last_checked_at timestamptz,
  received_amount numeric(14,2),
  received_date date,
  discrepancy_note text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint refunds_workspace_id_id_unique unique (workspace_id, id),
  constraint refunds_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint refunds_filing_record_workspace_fk
    foreign key (workspace_id, case_id, filing_record_id)
    references public.filing_records(workspace_id, case_id, id),
  constraint refunds_status_allowed check (
    status in ('pending','received','not_expected','attention_required')
  ),
  constraint refunds_amounts_nonnegative check (
    expected_amount is null or expected_amount >= 0
  ),
  constraint refunds_received_amount_nonnegative check (
    received_amount is null or received_amount >= 0
  ),
  constraint refunds_received_state_consistent check (
    (status = 'received' and received_amount is not null and received_date is not null)
    or (status <> 'received' and received_amount is null and received_date is null)
  ),
  constraint refunds_discrepancy_note_not_blank check (
    discrepancy_note is null or btrim(discrepancy_note) <> ''
  ),
  constraint refunds_next_action_not_blank check (
    next_action is null or btrim(next_action) <> ''
  )
);

create unique index refunds_active_filing_record_unique_idx
  on public.refunds (workspace_id, case_id, filing_record_id)
  where filing_record_id is not null and archived_at is null;
create unique index refunds_active_case_unique_idx
  on public.refunds (workspace_id, case_id)
  where filing_record_id is null and archived_at is null;
create index refunds_status_check_idx
  on public.refunds (workspace_id, status, last_checked_at, updated_at desc)
  where archived_at is null;
create index refunds_case_idx
  on public.refunds (workspace_id, case_id, updated_at desc)
  where archived_at is null;

create table public.tax_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  case_id uuid not null,
  filing_record_id uuid,
  event_type text not null,
  category text not null,
  issue_date date,
  received_date date,
  response_due_date date,
  status text not null default 'open',
  next_action text,
  submission_reference text,
  closure_date date,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint tax_events_workspace_case_id_unique unique (workspace_id, case_id, id),
  constraint tax_events_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint tax_events_filing_record_workspace_fk
    foreign key (workspace_id, case_id, filing_record_id)
    references public.filing_records(workspace_id, case_id, id),
  constraint tax_events_type_allowed check (
    event_type in ('intimation','notice','demand','rectification')
  ),
  constraint tax_events_category_not_blank check (btrim(category) <> ''),
  constraint tax_events_date_present check (
    issue_date is not null or received_date is not null
  ),
  constraint tax_events_received_not_before_issue check (
    issue_date is null or received_date is null or received_date >= issue_date
  ),
  constraint tax_events_due_date_order check (
    response_due_date is null
    or response_due_date >= coalesce(received_date, issue_date)
  ),
  constraint tax_events_status_allowed check (
    status in ('open','response_due','responded','closed','cancelled')
  ),
  constraint tax_events_closure_consistent check (
    (status = 'closed' and closure_date is not null and nullif(btrim(outcome), '') is not null)
    or (status = 'cancelled' and closure_date is not null)
    or (status not in ('closed','cancelled') and closure_date is null and outcome is null)
  ),
  constraint tax_events_next_action_not_blank check (
    next_action is null or btrim(next_action) <> ''
  ),
  constraint tax_events_submission_reference_not_blank check (
    submission_reference is null or btrim(submission_reference) <> ''
  ),
  constraint tax_events_outcome_not_blank check (
    outcome is null or btrim(outcome) <> ''
  )
);

create index tax_events_open_due_idx
  on public.tax_events (workspace_id, status, response_due_date, updated_at desc)
  where archived_at is null and status not in ('closed','cancelled');
create index tax_events_case_idx
  on public.tax_events (workspace_id, case_id, updated_at desc)
  where archived_at is null;
create index tax_events_filing_record_idx
  on public.tax_events (workspace_id, case_id, filing_record_id)
  where filing_record_id is not null and archived_at is null;

alter table public.documents
  add column tax_event_id uuid;

alter table public.documents
  add constraint documents_tax_event_workspace_fk
  foreign key (workspace_id, case_id, tax_event_id)
  references public.tax_events(workspace_id, case_id, id);

alter table public.documents
  add constraint documents_case_required_for_tax_event
  check (tax_event_id is null or case_id is not null);

create index documents_tax_event_idx
  on public.documents (workspace_id, case_id, tax_event_id)
  where tax_event_id is not null and archived_at is null;

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  assessment_year_id uuid not null,
  follow_up_type text not null,
  due_date date not null,
  status text not null default 'scheduled',
  exclusion_reason text,
  completed_at timestamptz,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint follow_ups_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint follow_ups_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id),
  constraint follow_ups_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint follow_ups_type_not_blank check (btrim(follow_up_type) <> ''),
  constraint follow_ups_status_allowed check (
    status in ('scheduled','due','contacted','waiting','completed','excluded','cancelled')
  ),
  constraint follow_ups_exclusion_consistent check (
    (status = 'excluded' and nullif(btrim(exclusion_reason), '') is not null)
    or (status <> 'excluded' and exclusion_reason is null)
  ),
  constraint follow_ups_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint follow_ups_note_not_blank check (note is null or btrim(note) <> '')
);

create unique index follow_ups_active_cycle_unique_idx
  on public.follow_ups (workspace_id, client_id, assessment_year_id, follow_up_type)
  where archived_at is null and status <> 'cancelled';
create index follow_ups_due_status_idx
  on public.follow_ups (workspace_id, status, due_date, updated_at desc)
  where archived_at is null;
create index follow_ups_client_ay_idx
  on public.follow_ups (workspace_id, client_id, assessment_year_id, updated_at desc)
  where archived_at is null;
create index follow_ups_case_idx
  on public.follow_ups (workspace_id, case_id, updated_at desc)
  where case_id is not null and archived_at is null;

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  channel text not null,
  direction text not null,
  occurred_at timestamptz not null default now(),
  summary text not null,
  external_reference text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint communications_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint communications_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint communications_channel_allowed check (
    channel in ('phone','whatsapp','email','in_person','other')
  ),
  constraint communications_direction_allowed check (
    direction in ('inbound','outbound')
  ),
  constraint communications_summary_not_blank check (btrim(summary) <> ''),
  constraint communications_external_reference_not_blank check (
    external_reference is null or btrim(external_reference) <> ''
  )
);

create index communications_client_time_idx
  on public.communications (workspace_id, client_id, occurred_at desc);
create index communications_case_time_idx
  on public.communications (workspace_id, case_id, occurred_at desc)
  where case_id is not null;
create index communications_created_by_idx
  on public.communications (created_by, occurred_at desc);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid,
  case_id uuid,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  summary text not null,
  occurred_at timestamptz not null default now(),
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint activity_events_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint activity_events_case_requires_client check (
    case_id is null or client_id is not null
  ),
  constraint activity_events_type_not_blank check (btrim(event_type) <> ''),
  constraint activity_events_summary_not_blank check (btrim(summary) <> ''),
  constraint activity_events_target_pair check (
    (target_type is null and target_id is null)
    or (nullif(btrim(target_type), '') is not null and target_id is not null)
  ),
  constraint activity_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index activity_events_workspace_time_idx
  on public.activity_events (workspace_id, occurred_at desc);
create index activity_events_client_time_idx
  on public.activity_events (workspace_id, client_id, occurred_at desc)
  where client_id is not null;
create index activity_events_case_time_idx
  on public.activity_events (workspace_id, case_id, occurred_at desc)
  where case_id is not null;
create index activity_events_type_idx
  on public.activity_events (workspace_id, event_type, occurred_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now(),
  constraint audit_events_action_not_blank check (btrim(action) <> ''),
  constraint audit_events_target_type_not_blank check (btrim(target_type) <> ''),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_events_request_id_not_blank check (
    request_id is null or btrim(request_id) <> ''
  )
);

create index audit_events_workspace_time_idx
  on public.audit_events (workspace_id, occurred_at desc);
create index audit_events_action_idx
  on public.audit_events (workspace_id, action, occurred_at desc);
create index audit_events_actor_idx
  on public.audit_events (actor_user_id, occurred_at desc)
  where actor_user_id is not null;

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references auth.users(id),
  source_filename text not null,
  file_size_bytes bigint not null,
  checksum_sha256 text,
  mapping_version integer not null default 1,
  status text not null default 'uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  committed_rows integer not null default 0,
  error_summary text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint import_jobs_workspace_id_id_unique unique (workspace_id, id),
  constraint import_jobs_filename_not_blank check (btrim(source_filename) <> ''),
  constraint import_jobs_file_size_positive check (file_size_bytes > 0),
  constraint import_jobs_checksum_shape check (
    checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint import_jobs_mapping_version_positive check (mapping_version > 0),
  constraint import_jobs_status_allowed check (
    status in (
      'uploaded','validating','dry_run_complete','ready_to_commit',
      'committing','completed','failed','cancelled'
    )
  ),
  constraint import_jobs_counts_nonnegative check (
    total_rows >= 0 and valid_rows >= 0 and error_rows >= 0 and committed_rows >= 0
  ),
  constraint import_jobs_counts_reconcile check (
    valid_rows + error_rows <= total_rows and committed_rows <= valid_rows
  ),
  constraint import_jobs_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint import_jobs_error_summary_not_blank check (
    error_summary is null or btrim(error_summary) <> ''
  )
);

create index import_jobs_status_time_idx
  on public.import_jobs (workspace_id, status, updated_at desc)
  where archived_at is null;
create index import_jobs_created_by_idx
  on public.import_jobs (created_by, created_at desc);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  import_job_id uuid not null,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  status text not null default 'pending',
  errors jsonb not null default '[]'::jsonb,
  target_type text,
  target_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_rows_job_workspace_fk
    foreign key (workspace_id, import_job_id)
    references public.import_jobs(workspace_id, id),
  constraint import_rows_job_row_unique unique (workspace_id, import_job_id, row_number),
  constraint import_rows_row_number_positive check (row_number > 0),
  constraint import_rows_raw_data_object check (jsonb_typeof(raw_data) = 'object'),
  constraint import_rows_normalized_data_object check (
    normalized_data is null or jsonb_typeof(normalized_data) = 'object'
  ),
  constraint import_rows_status_allowed check (
    status in ('pending','valid','invalid','committed','skipped')
  ),
  constraint import_rows_errors_array check (jsonb_typeof(errors) = 'array'),
  constraint import_rows_invalid_has_errors check (
    status <> 'invalid' or jsonb_array_length(errors) > 0
  ),
  constraint import_rows_target_pair check (
    (target_type is null and target_id is null)
    or (nullif(btrim(target_type), '') is not null and target_id is not null)
  ),
  constraint import_rows_committed_has_target check (
    status <> 'committed' or target_id is not null
  )
);

create index import_rows_job_status_idx
  on public.import_rows (workspace_id, import_job_id, status, row_number);
create index import_rows_target_idx
  on public.import_rows (workspace_id, target_type, target_id)
  where target_id is not null;

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function private.set_updated_at();

create trigger tax_events_set_updated_at
before update on public.tax_events
for each row execute function private.set_updated_at();

create trigger follow_ups_set_updated_at
before update on public.follow_ups
for each row execute function private.set_updated_at();

create trigger import_jobs_set_updated_at
before update on public.import_jobs
for each row execute function private.set_updated_at();

create trigger import_rows_set_updated_at
before update on public.import_rows
for each row execute function private.set_updated_at();

create or replace function private.prevent_append_only_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

create trigger communications_append_only
before update or delete on public.communications
for each row execute function private.prevent_append_only_mutation();

create trigger activity_events_append_only
before update or delete on public.activity_events
for each row execute function private.prevent_append_only_mutation();

create trigger audit_events_append_only
before update or delete on public.audit_events
for each row execute function private.prevent_append_only_mutation();

revoke all on function private.prevent_append_only_mutation() from public, anon, authenticated;

comment on table public.refunds is 'Refund lifecycle and amount tracking scoped to filing cases and optional filing records.';
comment on table public.tax_events is 'Unified intimations, notices, demands, and rectification-related tax events.';
comment on table public.follow_ups is 'Assessment-year follow-up work with exclusion and completion history.';
comment on table public.communications is 'Append-only client communication summaries without unnecessary message content.';
comment on table public.activity_events is 'Append-only business timeline events safe for operator-facing activity feeds.';
comment on table public.audit_events is 'Append-only sensitive-operation evidence; metadata must never contain secrets.';
comment on table public.import_jobs is 'CSV import lifecycle, mapping version, validation counts, and commit result.';
comment on table public.import_rows is 'Per-row import source, normalized data, validation errors, and commit target.';
