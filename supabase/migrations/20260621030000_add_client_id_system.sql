-- Create client ID sequence
create sequence if not exists public.client_id_seq start with 1;
grant usage on sequence public.client_id_seq to authenticated, service_role;

-- Add client_id_code column
alter table public.clients add column if not exists client_id_code text;

-- Backfill existing clients
update public.clients
set client_id_code = 'SDDS-' || lpad(nextval('public.client_id_seq')::text, 5, '0')
where client_id_code is null;

-- Make client_id_code NOT NULL and UNIQUE
alter table public.clients alter column client_id_code set not null;
alter table public.clients add constraint clients_client_id_code_unique unique (client_id_code);

-- Set default value for future inserts
alter table public.clients alter column client_id_code set default 'SDDS-' || lpad(nextval('public.client_id_seq')::text, 5, '0');
