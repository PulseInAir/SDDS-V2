create or replace function private.allocate_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ay_label text;
  next_serial bigint;
begin
  if new.invoice_number is not null or new.serial_number is not null then
    raise exception 'invoice number and serial are allocated by the database';
  end if;

  select ay.label
  into ay_label
  from public.assessment_years as ay
  where ay.id = new.assessment_year_id
    and ay.workspace_id = new.workspace_id;

  if ay_label is null then
    raise exception 'assessment year does not belong to invoice workspace';
  end if;

  insert into public.invoice_sequences (workspace_id, assessment_year_id, last_serial)
  values (new.workspace_id, new.assessment_year_id, 1)
  on conflict (workspace_id, assessment_year_id)
  do update set
    last_serial = public.invoice_sequences.last_serial + 1,
    updated_at = pg_catalog.now()
  returning last_serial into next_serial;

  new.serial_number := next_serial;
  new.invoice_number := 'SDDS/ITR/' || ay_label || '/' || next_serial::text;
  new.due_date := coalesce(new.due_date, new.issue_date + 30);
  return new;
end;
$$;

create or replace function private.normalize_invoice_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and row(old.workspace_id, old.client_id, old.case_id, old.assessment_year_id, old.invoice_number, old.serial_number)
    is distinct from row(new.workspace_id, new.client_id, new.case_id, new.assessment_year_id, new.invoice_number, new.serial_number) then
    raise exception 'invoice identity is immutable';
  end if;

  if tg_op = 'UPDATE' and old.cancelled_at is not null and new.cancelled_at is distinct from old.cancelled_at then
    raise exception 'cancelled invoice cannot be reopened';
  end if;

  if new.cancelled_at is not null then
    new.status := 'cancelled';
  elsif new.issued_at is null then
    new.status := 'draft';
  elsif new.total_amount > 0 and new.balance_amount = 0 then
    new.status := 'paid';
  elsif new.paid_amount > 0 then
    new.status := 'partially_paid';
  elsif new.due_date < current_date then
    new.status := 'overdue';
  else
    new.status := 'issued';
  end if;

  return new;
end;
$$;

create or replace function private.assert_invoice_is_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  invoice_status text;
begin
  select invoice.status into invoice_status
  from public.invoices as invoice
  where invoice.workspace_id = coalesce(new.workspace_id, old.workspace_id)
    and invoice.id = coalesce(new.invoice_id, old.invoice_id)
  for update;

  if invoice_status is distinct from 'draft' then
    raise exception 'invoice items may only change while invoice is draft';
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function private.recalculate_invoice_items()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_workspace uuid := coalesce(new.workspace_id, old.workspace_id);
  target_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update public.invoices as invoice
  set subtotal = totals.subtotal,
      total_amount = totals.subtotal - invoice.discount_amount,
      balance_amount = totals.subtotal - invoice.discount_amount - invoice.paid_amount,
      updated_at = pg_catalog.now()
  from (
    select coalesce(sum(item.line_amount), 0)::numeric(14,2) as subtotal
    from public.invoice_items as item
    where item.workspace_id = target_workspace
      and item.invoice_id = target_invoice
  ) as totals
  where invoice.workspace_id = target_workspace
    and invoice.id = target_invoice;

  return coalesce(new, old);
end;
$$;

create or replace function private.validate_payment_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  invoice_row public.invoices%rowtype;
  active_paid numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if row(old.workspace_id, old.invoice_id, old.payment_date, old.amount, old.mode, old.reference, old.note, old.recorded_by, old.created_at)
      is distinct from row(new.workspace_id, new.invoice_id, new.payment_date, new.amount, new.mode, new.reference, new.note, new.recorded_by, new.created_at) then
      raise exception 'payment identity is immutable; reverse and record a new payment';
    end if;
    if old.reversed_at is not null and new.reversed_at is distinct from old.reversed_at then
      raise exception 'payment reversal cannot be changed';
    end if;
  end if;

  select * into invoice_row
  from public.invoices as invoice
  where invoice.workspace_id = new.workspace_id
    and invoice.id = new.invoice_id
  for update;

  if invoice_row.id is null or invoice_row.issued_at is null or invoice_row.cancelled_at is not null then
    raise exception 'payments require an issued, non-cancelled invoice';
  end if;

  if tg_op = 'INSERT' then
    select coalesce(sum(payment.amount), 0)::numeric(14,2)
    into active_paid
    from public.payments as payment
    where payment.workspace_id = new.workspace_id
      and payment.invoice_id = new.invoice_id
      and payment.reversed_at is null;

    if active_paid + new.amount > invoice_row.total_amount then
      raise exception 'payment would exceed invoice total';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.recalculate_invoice_payments()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_workspace uuid := coalesce(new.workspace_id, old.workspace_id);
  target_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
  total_paid numeric(14,2);
begin
  select coalesce(sum(payment.amount), 0)::numeric(14,2)
  into total_paid
  from public.payments as payment
  where payment.workspace_id = target_workspace
    and payment.invoice_id = target_invoice
    and payment.reversed_at is null;

  update public.invoices as invoice
  set paid_amount = total_paid,
      balance_amount = invoice.total_amount - total_paid,
      updated_at = pg_catalog.now()
  where invoice.workspace_id = target_workspace
    and invoice.id = target_invoice;

  return coalesce(new, old);
end;
$$;

create trigger invoices_allocate_number
before insert on public.invoices
for each row execute function private.allocate_invoice_number();

create trigger invoices_normalize_state
before insert or update on public.invoices
for each row execute function private.normalize_invoice_state();

create trigger invoice_items_require_draft
before insert or update or delete on public.invoice_items
for each row execute function private.assert_invoice_is_draft();

create trigger invoice_items_recalculate
After insert or update or delete on public.invoice_items
for each row execute function private.recalculate_invoice_items();

create trigger payments_validate_change
before insert or update on public.payments
for each row execute function private.validate_payment_change();

create trigger payments_recalculate
After insert or update on public.payments
for each row execute function private.recalculate_invoice_payments();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function private.set_updated_at();

create trigger invoice_items_set_updated_at
before update on public.invoice_items
for each row execute function private.set_updated_at();

revoke all on function private.allocate_invoice_number() from public, anon, authenticated;
revoke all on function private.normalize_invoice_state() from public, anon, authenticated;
revoke all on function private.assert_invoice_is_draft() from public, anon, authenticated;
revoke all on function private.recalculate_invoice_items() from public, anon, authenticated;
revoke all on function private.validate_payment_change() from public, anon, authenticated;
revoke all on function private.recalculate_invoice_payments() from public, anon, authenticated;

alter table public.invoice_sequences enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy invoice_sequences_select_member on public.invoice_sequences
for select to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy invoices_select_member on public.invoices
for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
create policy invoices_insert_member on public.invoices
for insert to authenticated
with check ((select private.is_workspace_member(workspace_id)));
create policy invoices_update_member on public.invoices
for update to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy invoice_items_select_member on public.invoice_items
for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
create policy invoice_items_insert_member on public.invoice_items
for insert to authenticated
with check ((select private.is_workspace_member(workspace_id)));
create policy invoice_items_update_member on public.invoice_items
for update to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy payments_select_member on public.payments
for select to authenticated
using ((select private.is_workspace_member(workspace_id)));
create policy payments_insert_member on public.payments
for insert to authenticated
with check ((select private.is_workspace_member(workspace_id)) and recorded_by = (select auth.uid()));
create policy payments_update_member on public.payments
for update to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)) and recorded_by = (select auth.uid()));

revoke all on table public.invoice_sequences from public, anon, authenticated, service_role;
revoke all on table public.invoices from public, anon, authenticated, service_role;
revoke all on table public.invoice_items from public, anon, authenticated, service_role;
revoke all on table public.payments from public, anon, authenticated, service_role;

grant select on table public.invoice_sequences to authenticated;
grant select, insert, update on table public.invoices to authenticated;
grant select, insert, update on table public.invoice_items to authenticated;
grant select, insert, update on table public.payments to authenticated;

grant select, insert, update on table public.invoice_sequences to service_role;
grant select, insert, update on table public.invoices to service_role;
grant select, insert, update on table public.invoice_items to service_role;
grant select, insert, update on table public.payments to service_role;
