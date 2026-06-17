create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid not null,
  filing_record_id uuid,
  assessment_year_id uuid not null,
  expected_amount numeric(14,2),
  received_amount numeric(14,2),
  status text not null default 'not_expected',
  expected_date date,
  last_checked_at timestamptz,
  received_date date,
  next_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint refunds_workspace_id_id_unique unique (workspace_id, id),
  constraint refunds_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint refunds_case_context_fk
    foreign key (workspace_id, case_id, client_id, assessment_year_id)
    references public.filing_cases(workspace_id, id, client_id, assessment_year_id),
  constraint refunds_filing_record_workspace_fk
    foreign key (workspace_id, case_id, filing_record_id)
    references public.filing_records(workspace_id, case_id, id),
  constraint refunds_amounts_nonnegative check (
    (expected_amount is null or expected_amount >= 0)
    and (received_amount is null or received_amount >= 0)
  ),
  constraint refunds_status_allowed check (
    status in ('not_expected','expected','processing','received','adjusted','rejected','follow_up_required')
  ),
  constraint refunds_received_requires_date check (
    status <> 'received' or (received_amount is not null and received_date is not null)
  ),
  constraint refunds_text_not_blank check (
    (next_action is null or btrim(next_action) <> '')
    and (notes is null or btrim(notes) <> '')
  )
);

create index refunds_case_idx on public.refunds (workspace_id, case_id, status) where archived_at is null;
create index refunds_status_next_action_idx on public.refunds (workspace_id, status, expected_date) where archived_at is null;

create table public.tax_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid not null,
  filing_record_id uuid,
  assessment_year_id uuid not null,
  event_type text not null,
  category text not null,
  status text not null default 'open',
  issue_date date,
  received_date date,
  response_due_date date,
  submission_date date,
  closure_date date,
  reference_number text,
  amount numeric(14,2),
  next_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint tax_events_workspace_id_id_unique unique (workspace_id, id),
  constraint tax_events_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint tax_events_case_context_fk
    foreign key (workspace_id, case_id, client_id, assessment_year_id)
    references public.filing_cases(workspace_id, id, client_id, assessment_year_id),
  constraint tax_events_filing_record_workspace_fk
    foreign key (workspace_id, case_id, filing_record_id)
    references public.filing_records(workspace_id, case_id, id),
  constraint tax_events_type_allowed check (event_type in ('intimation','notice','rectification','defective_return')),
  constraint tax_events_status_allowed check (status in ('open','response_due','submitted','closed','cancelled')),
  constraint tax_events_category_not_blank check (btrim(category) <> ''),
  constraint tax_events_due_order check (response_due_date is null or received_date is null or response_due_date >= received_date),
  constraint tax_events_closed_requires_date check (status <> 'closed' or closure_date is not null),
  constraint tax_events_amount_nonnegative check (amount is null or amount >= 0),
  constraint tax_events_text_not_blank check (
    (reference_number is null or btrim(reference_number) <> '')
    and (next_action is null or btrim(next_action) <> '')
    and (notes is null or btrim(notes) <> '')
  )
);

create index tax_events_case_idx on public.tax_events (workspace_id, case_id, event_type, status) where archived_at is null;
create index tax_events_due_idx on public.tax_events (workspace_id, status, response_due_date) where archived_at is null;

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  assessment_year_id uuid,
  follow_up_type text not null,
  status text not null default 'open',
  due_date date not null,
  completed_at timestamptz,
  excluded_at timestamptz,
  exclusion_reason text,
  next_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint follow_ups_workspace_id_id_unique unique (workspace_id, id),
  constraint follow_ups_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint follow_ups_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint follow_ups_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id),
  constraint follow_ups_type_allowed check (follow_up_type in ('next_year','document_collection','payment','notice','refund','general')),
  constraint follow_ups_status_allowed check (status in ('open','completed','excluded','cancelled')),
  constraint follow_ups_completed_rule check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null)),
  constraint follow_ups_excluded_rule check ((status = 'excluded' and excluded_at is not null and nullif(btrim(exclusion_reason), '') is not null) or (status <> 'excluded' and excluded_at is null)),
  constraint follow_ups_text_not_blank check (
    (next_action is null or btrim(next_action) <> '')
    and (notes is null or btrim(notes) <> '')
  )
);

create index follow_ups_due_idx on public.follow_ups (workspace_id, status, due_date) where archived_at is null;
create index follow_ups_client_idx on public.follow_ups (workspace_id, client_id, due_date desc) where archived_at is null;

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  channel text not null,
  direction text not null,
  subject text,
  summary text not null,
  communication_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint communications_workspace_id_id_unique unique (workspace_id, id),
  constraint communications_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint communications_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint communications_channel_allowed check (channel in ('phone','whatsapp','email','in_person','portal','other')),
  constraint communications_direction_allowed check (direction in ('inbound','outbound','internal')),
  constraint communications_summary_not_blank check (btrim(summary) <> ''),
  constraint communications_subject_not_blank check (subject is null or btrim(subject) <> '')
);

create index communications_client_time_idx on public.communications (workspace_id, client_id, communication_at desc) where archived_at is null;
create index communications_case_time_idx on public.communications (workspace_id, case_id, communication_at desc) where case_id is not null and archived_at is null;

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  actor_id uuid references auth.users(id),
  client_id uuid,
  case_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_workspace_id_id_unique unique (workspace_id, id),
  constraint activity_events_workspace_fk foreign key (workspace_id) references public.workspaces(id),
  constraint activity_events_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint activity_events_case_workspace_fk
    foreign key (workspace_id, case_id)
    references public.filing_cases(workspace_id, id),
  constraint activity_events_entity_type_allowed check (entity_type in ('client','filing_case','filing_record','document','invoice','payment','refund','tax_event','follow_up','communication','import_job','system')),
  constraint activity_events_action_not_blank check (btrim(action) <> ''),
  constraint activity_events_message_not_blank check (btrim(message) <> ''),
  constraint activity_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index activity_events_workspace_time_idx on public.activity_events (workspace_id, created_at desc);
create index activity_events_client_time_idx on public.activity_events (workspace_id, client_id, created_at desc) where client_id is not null;
create index activity_events_case_time_idx on public.activity_events (workspace_id, case_id, created_at desc) where case_id is not null;

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  import_type text not null,
  status text not null default 'draft',
  source_filename text not null,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  committed_rows integer not null default 0,
  error_summary jsonb not null default '{}'::jsonb,
  started_by uuid not null references auth.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint import_jobs_type_allowed check (import_type in ('clients','invoices','filing_cases','documents')),
  constraint import_jobs_status_allowed check (status in ('draft','validated','failed','committed','cancelled')),
  constraint import_jobs_counts_nonnegative check (total_rows >= 0 and valid_rows >= 0 and invalid_rows >= 0 and committed_rows >= 0),
  constraint import_jobs_counts_reconcile check (valid_rows + invalid_rows <= total_rows and committed_rows <= valid_rows),
  constraint import_jobs_filename_not_blank check (btrim(source_filename) <> ''),
  constraint import_jobs_error_summary_object check (jsonb_typeof(error_summary) = 'object'),
  constraint import_jobs_completed_rule check (status not in ('failed','committed','cancelled') or completed_at is not null)
);

create index import_jobs_workspace_time_idx on public.import_jobs (workspace_id, started_at desc);
create index import_jobs_status_idx on public.import_jobs (workspace_id, status, started_at desc);

create trigger refunds_set_updated_at before update on public.refunds for each row execute function private.set_updated_at();
create trigger tax_events_set_updated_at before update on public.tax_events for each row execute function private.set_updated_at();
create trigger follow_ups_set_updated_at before update on public.follow_ups for each row execute function private.set_updated_at();

comment on table public.refunds is 'Refund tracking linked to client, filing case, and optional filing record.';
comment on table public.tax_events is 'Intimations, notices, rectifications, defective-return events, and response due dates.';
comment on table public.follow_ups is 'Recoverable client and case follow-up work with exclusion reasons.';
comment on table public.communications is 'Client communication timeline entries linked to client and optional case.';
comment on table public.activity_events is 'Append-only operational activity stream for dashboard and audit context.';
comment on table public.import_jobs is 'Import dry-run and commit tracking for later CSV import workflows.';
