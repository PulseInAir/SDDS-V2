create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint workspaces_name_not_blank check (btrim(name) <> '')
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint workspace_members_role_allowed check (role = 'owner')
);

create table public.assessment_years (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_years_label_format check (label ~ '^[0-9]{4}-[0-9]{2}$'),
  constraint assessment_years_date_order check (start_date <= end_date),
  constraint assessment_years_workspace_label_unique unique (workspace_id, label)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  full_name text not null,
  pan_uppercase text not null,
  date_of_birth date,
  mobile text,
  email text,
  address text,
  family_group text,
  active boolean not null default true,
  follow_up_excluded boolean not null default false,
  exclusion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint clients_workspace_id_id_unique unique (workspace_id, id),
  constraint clients_full_name_not_blank check (btrim(full_name) <> ''),
  constraint clients_pan_canonical check (
    pan_uppercase = upper(pan_uppercase)
    and pan_uppercase ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'
  ),
  constraint clients_exclusion_reason_required check (
    not follow_up_excluded
    or nullif(btrim(exclusion_reason), '') is not null
  ),
  constraint clients_archived_inactive check (archived_at is null or not active)
);

create table public.client_credentials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  encrypted_payload jsonb not null,
  encryption_version smallint not null,
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint client_credentials_client_workspace_fk
    foreign key (workspace_id, client_id)
    references public.clients(workspace_id, id),
  constraint client_credentials_payload_object check (
    jsonb_typeof(encrypted_payload) = 'object'
    and encrypted_payload <> '{}'::jsonb
  ),
  constraint client_credentials_version_positive check (encryption_version > 0)
);

create index workspace_members_user_active_idx
  on public.workspace_members (user_id, active, workspace_id);
create index assessment_years_workspace_open_idx
  on public.assessment_years (workspace_id, is_open, start_date desc);
create unique index assessment_years_one_current_per_workspace_idx
  on public.assessment_years (workspace_id)
  where is_current;
create index clients_workspace_active_name_idx
  on public.clients (workspace_id, active, full_name);
create index clients_workspace_family_group_idx
  on public.clients (workspace_id, family_group)
  where family_group is not null and archived_at is null;
create unique index clients_workspace_pan_active_unique_idx
  on public.clients (workspace_id, pan_uppercase)
  where archived_at is null;
create index client_credentials_workspace_client_idx
  on public.client_credentials (workspace_id, client_id);
create index client_credentials_updated_by_idx
  on public.client_credentials (updated_by);
create unique index client_credentials_one_active_per_client_idx
  on public.client_credentials (client_id)
  where archived_at is null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function private.set_updated_at();

create trigger assessment_years_set_updated_at
before update on public.assessment_years
for each row execute function private.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

create trigger client_credentials_set_updated_at
before update on public.client_credentials
for each row execute function private.set_updated_at();

revoke all on function private.set_updated_at() from public, anon, authenticated;

comment on table public.workspaces is 'Tenant boundary for all SDDS operational data.';
comment on table public.workspace_members is 'Authenticated-user membership and role within an SDDS workspace.';
comment on table public.assessment_years is 'Workspace-scoped assessment-year configuration.';
comment on table public.clients is 'Permanent client identity record, independent of annual filing cases.';
comment on table public.client_credentials is 'Versioned encrypted credential envelopes only; plaintext credentials are forbidden.';

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
