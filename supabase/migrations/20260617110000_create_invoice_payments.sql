create table public.invoice_sequences (
  workspace_id uuid not null references public.workspaces(id),
  assessment_year_id uuid not null,
  last_serial bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, assessment_year_id),
  constraint invoice_sequences_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id),
  constraint invoice_sequences_serial_nonnegative check (last_serial >= 0)
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
  issue_date date not null default current_date,
  due_date date not null,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  balance_amount numeric(14,2) not null default 0,
  notes text,
  issued_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint invoices_workspace_id_id_unique unique (workspace_id, id),
  constraint invoices_client_workspace_fk foreign key (workspace_id, client_id) references public.clients(workspace_id, id),
  constraint invoices_case_workspace_fk foreign key (workspace_id, case_id) references public.filing_cases(workspace_id, id),
  constraint invoices_assessment_year_workspace_fk foreign key (workspace_id, assessment_year_id) references public.assessment_years(workspace_id, id),
  constraint invoices_number_unique unique (workspace_id, invoice_number),
  constraint invoices_serial_unique unique (workspace_id, assessment_year_id, serial_number),
  constraint invoices_number_format check (invoice_number ~ '^SDDS/ITR/[0-9]{4}-[0-9]{2}/[1-9][0-9]*$'),
  constraint invoices_serial_positive check (serial_number > 0),
  constraint invoices_status_allowed check (status in ('draft','issued','partially_paid','paid','overdue','cancelled')),
  constraint invoices_due_date_valid check (due_date >= issue_date),
  constraint invoices_amounts_nonnegative check (subtotal >= 0 and discount_amount >= 0 and total_amount >= 0 and paid_amount >= 0 and balance_amount >= 0),
  constraint invoices_discount_not_over_subtotal check (discount_amount <= subtotal),
  constraint invoices_total_reconciles check (total_amount = subtotal - discount_amount),
  constraint invoices_balance_reconciles check (balance_amount = total_amount - paid_amount),
  constraint invoices_notes_not_blank check (notes is null or btrim(notes) <> ''),
  constraint invoices_issued_state_consistent check ((issued_at is null and status = 'draft') or issued_at is not null or status = 'cancelled'),
  constraint invoices_cancelled_state_consistent check ((status = 'cancelled' and cancelled_at is not null) or (status <> 'cancelled' and cancelled_at is null)),
  constraint invoices_archived_terminal check (archived_at is null or status in ('paid','cancelled'))
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
  payment_date date not null default current_date,
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
  constraint payments_note_not_blank check (note is null or btrim(note) <> '')
);

create index invoice_sequences_assessment_year_idx on public.invoice_sequences (assessment_year_id);
create index invoices_workspace_status_due_idx on public.invoices (workspace_id, status, due_date, issue_date desc) where archived_at is null;
create index invoices_client_ay_idx on public.invoices (workspace_id, client_id, assessment_year_id, issue_date desc) where archived_at is null;
create index invoices_case_idx on public.invoices (workspace_id, case_id) where case_id is not null and archived_at is null;
create index invoice_items_invoice_order_idx on public.invoice_items (workspace_id, invoice_id, display_order, created_at);
create index payments_invoice_date_idx on public.payments (workspace_id, invoice_id, payment_date desc) where reversed_at is null;
create index payments_recorded_by_idx on public.payments (recorded_by, created_at desc);

comment on table public.invoice_sequences is 'Atomic invoice serial allocation per workspace and assessment year.';
comment on table public.invoices is 'Invoice header and reconciled financial totals.';
comment on table public.invoice_items is 'Invoice service line items.';
comment on table public.payments is 'Append-preserving invoice payments; reversal uses reversed_at.';
