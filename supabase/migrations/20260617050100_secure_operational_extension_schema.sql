alter table public.refunds enable row level security;
alter table public.tax_events enable row level security;
alter table public.follow_ups enable row level security;
alter table public.communications enable row level security;
alter table public.activity_events enable row level security;
alter table public.import_jobs enable row level security;

create policy refunds_select_member on public.refunds for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy refunds_insert_member on public.refunds for insert to authenticated with check ((select private.is_workspace_member(workspace_id)));
create policy refunds_update_member on public.refunds for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

create policy tax_events_select_member on public.tax_events for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy tax_events_insert_member on public.tax_events for insert to authenticated with check ((select private.is_workspace_member(workspace_id)));
create policy tax_events_update_member on public.tax_events for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

create policy follow_ups_select_member on public.follow_ups for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy follow_ups_insert_member on public.follow_ups for insert to authenticated with check ((select private.is_workspace_member(workspace_id)));
create policy follow_ups_update_member on public.follow_ups for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

create policy communications_select_member on public.communications for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy communications_insert_member on public.communications for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and recorded_by = (select auth.uid()));

create policy activity_events_select_member on public.activity_events for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy activity_events_insert_member on public.activity_events for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and (actor_id is null or actor_id = (select auth.uid())));

create policy import_jobs_select_member on public.import_jobs for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy import_jobs_insert_member on public.import_jobs for insert to authenticated with check ((select private.is_workspace_member(workspace_id)) and started_by = (select auth.uid()));
create policy import_jobs_update_member on public.import_jobs for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)) and started_by = (select auth.uid()));

revoke all on table public.refunds from public, anon, authenticated, service_role;
revoke all on table public.tax_events from public, anon, authenticated, service_role;
revoke all on table public.follow_ups from public, anon, authenticated, service_role;
revoke all on table public.communications from public, anon, authenticated, service_role;
revoke all on table public.activity_events from public, anon, authenticated, service_role;
revoke all on table public.import_jobs from public, anon, authenticated, service_role;

grant select, insert, update on table public.refunds to authenticated;
grant select, insert, update on table public.tax_events to authenticated;
grant select, insert, update on table public.follow_ups to authenticated;
grant select, insert on table public.communications to authenticated;
grant select, insert on table public.activity_events to authenticated;
grant select, insert, update on table public.import_jobs to authenticated;

grant select, insert, update on table public.refunds to service_role;
grant select, insert, update on table public.tax_events to service_role;
grant select, insert, update on table public.follow_ups to service_role;
grant select, insert on table public.communications to service_role;
grant select, insert on table public.activity_events to service_role;
grant select, insert, update on table public.import_jobs to service_role;
