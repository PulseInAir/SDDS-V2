-- Create workspace_invoice_settings table
create table public.workspace_invoice_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  rate_card jsonb not null default '{
    "ITR-1": 500,
    "ITR-2": 1500,
    "ITR-3": 3000,
    "ITR-4": 2000,
    "ITR-5": 5000,
    "ITR-6": 10000,
    "ITR-7": 5000,
    "ITR-V": 500
  }'::jsonb,
  refund_charge_percentage numeric(5,2) not null default 10.00,
  pdf_extraction_settings jsonb not null default '{
    "page_scope": "first_page",
    "itr_form_pattern": "ITR-\\d[A-Z]?|ITR-V",
    "refund_amount_pattern": "refund\\s*due|refund|refundable"
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Populating defaults for existing workspaces
insert into public.workspace_invoice_settings (workspace_id)
select id from public.workspaces
on conflict (workspace_id) do nothing;

-- Enable Row-Level Security
alter table public.workspace_invoice_settings enable row level security;

create policy workspace_invoice_settings_select_member
on public.workspace_invoice_settings
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy workspace_invoice_settings_update_member
on public.workspace_invoice_settings
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy workspace_invoice_settings_insert_member
on public.workspace_invoice_settings
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

-- Trigger for updated_at
create trigger workspace_invoice_settings_set_updated_at
before update on public.workspace_invoice_settings
for each row execute function private.set_updated_at();

-- Trigger for auto-creation on workspace creation
create or replace function public.handle_new_workspace_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_invoice_settings (workspace_id)
  values (new.id)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace_settings();

-- Revoke and Grant Permissions
revoke all on table public.workspace_invoice_settings from public, anon;
grant select, insert, update on table public.workspace_invoice_settings to authenticated;
grant select, insert, update, delete on table public.workspace_invoice_settings to service_role;

comment on table public.workspace_invoice_settings is 'Workspace-scoped invoice defaults and PDF extraction parameters.';
