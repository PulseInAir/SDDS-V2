-- Drop and recreate case_status_history trigger to only prevent updates (allowing cascade deletes)
drop trigger if exists case_status_history_append_only on public.case_status_history;
create trigger case_status_history_append_only
  before update on public.case_status_history
  for each row execute function private.prevent_case_status_history_mutation();

-- Drop and recreate foreign keys referencing auth.users with ON DELETE CASCADE or ON DELETE SET NULL

-- client_credentials
alter table public.client_credentials
  drop constraint if exists client_credentials_updated_by_fkey,
  add constraint client_credentials_updated_by_fkey
    foreign key (updated_by) references auth.users(id) on delete cascade;

-- case_status_history
alter table public.case_status_history
  drop constraint if exists case_status_history_changed_by_fkey,
  add constraint case_status_history_changed_by_fkey
    foreign key (changed_by) references auth.users(id) on delete cascade;

-- documents (uploaded_by / verified_by)
alter table public.documents
  drop constraint if exists documents_uploaded_by_fkey,
  drop constraint if exists documents_verified_by_fkey,
  add constraint documents_uploaded_by_fkey
    foreign key (uploaded_by) references auth.users(id) on delete cascade,
  add constraint documents_verified_by_fkey
    foreign key (verified_by) references auth.users(id) on delete set null;

-- payments
alter table public.payments
  drop constraint if exists payments_recorded_by_fkey,
  add constraint payments_recorded_by_fkey
    foreign key (recorded_by) references auth.users(id) on delete cascade;

-- communications
alter table public.communications
  drop constraint if exists communications_recorded_by_fkey,
  add constraint communications_recorded_by_fkey
    foreign key (recorded_by) references auth.users(id) on delete cascade;

-- activity_events (nullable actor_id)
alter table public.activity_events
  drop constraint if exists activity_events_actor_id_fkey,
  add constraint activity_events_actor_id_fkey
    foreign key (actor_id) references auth.users(id) on delete set null;

-- import_jobs
alter table public.import_jobs
  drop constraint if exists import_jobs_started_by_fkey,
  add constraint import_jobs_started_by_fkey
    foreign key (started_by) references auth.users(id) on delete cascade;

-- Create trigger function for automatic workspace membership on new user signup
create or replace function public.handle_new_user_workspace_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_workspace_id uuid;
begin
  -- Get the first workspace
  select id into default_workspace_id from public.workspaces where archived_at is null order by created_at asc limit 1;
  
  -- If no workspace exists, create one
  if default_workspace_id is null then
    insert into public.workspaces (name) values ('Default Workspace') returning id into default_workspace_id;
  end if;
  
  -- Add the new user to the workspace as owner
  insert into public.workspace_members (workspace_id, user_id, role, active)
  values (default_workspace_id, new.id, 'owner', true)
  on conflict (workspace_id, user_id) do nothing;
  
  return new;
end;
$$;

-- Create the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_workspace_membership();
