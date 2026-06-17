alter table public.filing_cases
  add constraint filing_cases_workspace_id_client_ay_unique
  unique (workspace_id, id, client_id, assessment_year_id);

create table public.invoice_sequences (
  workspace_id uuid not null references public.workspaces(id),
  assessment_year_id uuid not null,
  next_serial bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, assessment_year_id),
  constraint invoice_sequences_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id),
  constraint invoice_sequences_next_serial_positive check (next_serial > 0)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  assessment_year_id uuid not null,
  invoice_number text not null,
  serial_number bigint not null,
  status text not null default 'draft',
  issue_date date,
  due_date date,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  notes text,
  issued_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint invoices_workspace_id_id_unique unique (workspace_id, id),
  constraint invoices_client_workspace_fk foreign key (workspace_id, client_id) references public.clients(workspace_id, id),
  constraint invoices_assessment_year_workspace_fk foreign key (workspace_id, assessment_year_id) references public.assessment_years(workspace_id, id),
  constraint invoices_case_context_fk foreign key (workspace_id, case_id, client_id, assessment_year_id) references public.filing_cases(workspace_id, id, client_id, assessment_year_id),
  constraint invoices_number_unique unique (workspace_id, invoice_number),
  constraint invoices_serial_unique unique (workspace_id, assessment_year_id, serial_number),
  constraint invoices_serial_positive check (serial_number > 0),
  constraint invoices_status_allowed check (status in ('draft','issued','partially_paid','paid','overdue','cancelled')),
  constraint invoices_due_date_order check (issue_date is null or (due_date is not null and due_date >= issue_date)),
  constraint invoices_amounts_nonnegative check (subtotal >= 0 and discount_amount >= 0 and total_amount >= 0),
  constraint invoices_discount_not_above_subtotal check (discount_amount <= subtotal),
  constraint invoices_total_reconciles check (total_amount = subtotal - discount_amount),
  constraint invoices_notes_not_blank check (notes is null or btrim(notes) <> ''),
  constraint invoices_lifecycle_dates check (
    (status = 'draft' and issue_date is null and due_date is null and issued_at is null and cancelled_at is null)
    or (status in ('issued','partially_paid','paid','overdue') and issue_date is not null and due_date is not null and issued_at is not null and cancelled_at is null)
    or (status = 'cancelled' and cancelled_at is not null and ((issue_date is null and due_date is null and issued_at is null) or (issue_date is not null and due_date is not null and issued_at is not null)))
  ),
  constraint invoices_archived_cancelled check (archived_at is null or status = 'cancelled')
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  invoice_id uuid not null,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit_amount numeric(14,2) not null,
  line_amount numeric(14,2) generated always as (round(quantity * unit_amount, 2)) stored,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_items_invoice_workspace_fk foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id),
  constraint invoice_items_description_not_blank check (btrim(description) <> ''),
  constraint invoice_items_quantity_positive check (quantity > 0),
  constraint invoice_items_unit_amount_nonnegative check (unit_amount >= 0),
  constraint invoice_items_display_order_nonnegative check (display_order >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  invoice_id uuid not null,
  payment_date date not null,
  amount numeric(14,2) not null,
  mode text not null,
  reference text,
  note text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  constraint payments_invoice_workspace_fk foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id),
  constraint payments_amount_positive check (amount > 0),
  constraint payments_mode_allowed check (mode in ('cash','upi')),
  constraint payments_reference_not_blank check (reference is null or btrim(reference) <> ''),
  constraint payments_note_not_blank check (note is null or btrim(note) <> ''),
  constraint payments_reversal_after_creation check (reversed_at is null or reversed_at >= created_at)
);

create index invoices_client_ay_idx on public.invoices (workspace_id, client_id, assessment_year_id, created_at desc) where archived_at is null;
create index invoices_case_idx on public.invoices (workspace_id, case_id) where case_id is not null and archived_at is null;
create index invoices_status_due_idx on public.invoices (workspace_id, status, due_date) where archived_at is null;
create index invoice_items_invoice_order_idx on public.invoice_items (workspace_id, invoice_id, display_order, created_at);
create index payments_invoice_date_idx on public.payments (workspace_id, invoice_id, payment_date, created_at) where reversed_at is null;
create index payments_recorded_by_idx on public.payments (recorded_by, created_at desc);

create trigger invoice_sequences_set_updated_at before update on public.invoice_sequences for each row execute function private.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function private.set_updated_at();
create trigger invoice_items_set_updated_at before update on public.invoice_items for each row execute function private.set_updated_at();

comment on table public.invoice_sequences is 'Atomic invoice serial allocator per workspace and assessment year.';
comment on table public.invoices is 'Invoice header with permanent number and reconciled financial totals.';
comment on table public.invoice_items is 'Invoice service lines; financial edits are restricted to draft invoices.';
comment on table public.payments is 'Append-oriented payments with explicit reversal instead of deletion.';
