create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  import_job_id uuid not null,
  row_number integer not null,
  source_key text not null,
  action text not null default 'error',
  row_status text not null default 'error',
  source_row jsonb not null default '{}'::jsonb,
  normalized_row jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  outcome jsonb not null default '{}'::jsonb,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint import_rows_job_workspace_fk
    foreign key (workspace_id, import_job_id)
    references public.import_jobs(workspace_id, id),
  constraint import_rows_row_number_positive check (row_number > 0),
  constraint import_rows_source_key_not_blank check (btrim(source_key) <> ''),
  constraint import_rows_action_allowed check (action in ('create','update','skip','error')),
  constraint import_rows_status_allowed check (row_status in ('valid','error','skipped','committed')),
  constraint import_rows_source_row_object check (jsonb_typeof(source_row) = 'object'),
  constraint import_rows_normalized_row_object check (jsonb_typeof(normalized_row) = 'object'),
  constraint import_rows_errors_array check (jsonb_typeof(errors) = 'array'),
  constraint import_rows_outcome_object check (jsonb_typeof(outcome) = 'object'),
  constraint import_rows_committed_rule check (
    (row_status = 'committed' and committed_at is not null)
    or (row_status <> 'committed' and committed_at is null)
  ),
  constraint import_rows_job_row_unique unique (workspace_id, import_job_id, row_number)
);

create index import_rows_job_idx
  on public.import_rows (workspace_id, import_job_id, row_number);
create index import_rows_source_key_idx
  on public.import_rows (workspace_id, source_key, committed_at desc)
  where archived_at is null;

alter table public.import_rows enable row level security;

create policy import_rows_select_member
  on public.import_rows
  for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy import_rows_insert_member
  on public.import_rows
  for insert
  to authenticated
  with check ((select private.is_workspace_member(workspace_id)));

create policy import_rows_update_member
  on public.import_rows
  for update
  to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

revoke all on table public.import_rows from public, anon, authenticated, service_role;

grant select, insert, update on table public.import_rows to authenticated;
grant select, insert, update on table public.import_rows to service_role;

comment on table public.import_rows is 'Row-level dry-run and commit outcomes for CSV import jobs.';
