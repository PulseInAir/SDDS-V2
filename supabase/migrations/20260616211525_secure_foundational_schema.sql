create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.active
  );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.active
      and membership.role = 'owner'
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.is_workspace_owner(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.assessment_years enable row level security;
alter table public.clients enable row level security;
alter table public.client_credentials enable row level security;

create policy workspaces_select_member
on public.workspaces
for select
to authenticated
using ((select private.is_workspace_member(id)));

create policy workspaces_update_owner
on public.workspaces
for update
to authenticated
using ((select private.is_workspace_owner(id)))
with check ((select private.is_workspace_owner(id)));

create policy workspace_members_select_member
on public.workspace_members
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy workspace_members_insert_owner
on public.workspace_members
for insert
to authenticated
with check ((select private.is_workspace_owner(workspace_id)));

create policy workspace_members_update_owner
on public.workspace_members
for update
to authenticated
using ((select private.is_workspace_owner(workspace_id)))
with check (
  (select private.is_workspace_owner(workspace_id))
  and (user_id <> (select auth.uid()) or active)
);

create policy workspace_members_delete_owner
on public.workspace_members
for delete
to authenticated
using (
  (select private.is_workspace_owner(workspace_id))
  and user_id <> (select auth.uid())
);

create policy assessment_years_select_member
on public.assessment_years
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy assessment_years_insert_owner
on public.assessment_years
for insert
to authenticated
with check ((select private.is_workspace_owner(workspace_id)));

create policy assessment_years_update_owner
on public.assessment_years
for update
to authenticated
using ((select private.is_workspace_owner(workspace_id)))
with check ((select private.is_workspace_owner(workspace_id)));

create policy clients_select_member
on public.clients
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy clients_insert_member
on public.clients
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy clients_update_member
on public.clients
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy client_credentials_select_owner
on public.client_credentials
for select
to authenticated
using ((select private.is_workspace_owner(workspace_id)));

create policy client_credentials_insert_owner
on public.client_credentials
for insert
to authenticated
with check (
  (select private.is_workspace_owner(workspace_id))
  and updated_by = (select auth.uid())
);

create policy client_credentials_update_owner
on public.client_credentials
for update
to authenticated
using ((select private.is_workspace_owner(workspace_id)))
with check (
  (select private.is_workspace_owner(workspace_id))
  and updated_by = (select auth.uid())
);

revoke all on table public.workspaces from public, anon, authenticated, service_role;
revoke all on table public.workspace_members from public, anon, authenticated, service_role;
revoke all on table public.assessment_years from public, anon, authenticated, service_role;
revoke all on table public.clients from public, anon, authenticated, service_role;
revoke all on table public.client_credentials from public, anon, authenticated, service_role;

grant select, update on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update on table public.assessment_years to authenticated;
grant select, insert, update on table public.clients to authenticated;
grant select, insert, update on table public.client_credentials to authenticated;

grant select, insert, update on table public.workspaces to service_role;
grant select, insert, update, delete on table public.workspace_members to service_role;
grant select, insert, update on table public.assessment_years to service_role;
grant select, insert, update on table public.clients to service_role;
grant select, insert, update on table public.client_credentials to service_role;
