alter table public.filing_cases enable row level security;
alter table public.filing_records enable row level security;
alter table public.case_status_history enable row level security;

create policy filing_cases_select_member
on public.filing_cases
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy filing_cases_insert_member
on public.filing_cases
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy filing_cases_update_member
on public.filing_cases
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy filing_records_select_member
on public.filing_records
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy filing_records_insert_member
on public.filing_records
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy filing_records_update_member
on public.filing_records
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy case_status_history_select_member
on public.case_status_history
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy case_status_history_insert_member
on public.case_status_history
for insert
to authenticated
with check (
  (select private.is_workspace_member(workspace_id))
  and changed_by = (select auth.uid())
);

revoke all on table public.filing_cases from public, anon, authenticated, service_role;
revoke all on table public.filing_records from public, anon, authenticated, service_role;
revoke all on table public.case_status_history from public, anon, authenticated, service_role;

grant select, insert, update on table public.filing_cases to authenticated;
grant select, insert, update on table public.filing_records to authenticated;
grant select, insert on table public.case_status_history to authenticated;

grant select, insert, update on table public.filing_cases to service_role;
grant select, insert, update on table public.filing_records to service_role;
grant select, insert on table public.case_status_history to service_role;
