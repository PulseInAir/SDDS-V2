create or replace function private.active_invoice_paid_amount(target_invoice_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(payment.amount), 0)::numeric
  from public.payments as payment
  where payment.invoice_id = target_invoice_id
    and payment.reversed_at is null;
$$;

create or replace function private.prepare_invoice()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assessment_year_label text;
  allocated_serial bigint;
  paid_amount numeric;
begin
  if tg_op = 'INSERT' then
    if new.invoice_number is not null or new.serial_number is not null then
      raise exception 'invoice identity is allocated by the database';
    end if;

    select assessment_year.label
    into assessment_year_label
    from public.assessment_years as assessment_year
    where assessment_year.workspace_id = new.workspace_id
      and assessment_year.id = new.assessment_year_id;

    if assessment_year_label is null then
      raise exception 'assessment year does not belong to invoice workspace';
    end if;

    insert into public.invoice_sequences (workspace_id, assessment_year_id, next_serial)
    values (new.workspace_id, new.assessment_year_id, 2)
    on conflict (workspace_id, assessment_year_id)
    do update set next_serial = public.invoice_sequences.next_serial + 1
    returning next_serial - 1 into allocated_serial;

    new.serial_number := allocated_serial;
    new.invoice_number := 'SDDS/ITR/' || assessment_year_label || '/' || allocated_serial::text;
  elsif
    new.invoice_number is distinct from old.invoice_number
    or new.serial_number is distinct from old.serial_number
    or new.workspace_id is distinct from old.workspace_id
    or new.client_id is distinct from old.client_id
    or new.case_id is distinct from old.case_id
    or new.assessment_year_id is distinct from old.assessment_year_id
  then
    raise exception 'invoice identity and ownership are immutable';
  end if;

  if tg_op = 'UPDATE'
    and new.discount_amount is distinct from old.discount_amount
    and old.status <> 'draft'
  then
    raise exception 'issued invoice financials are immutable';
  end if;

  if new.status in ('issued','partially_paid','paid','overdue') then
    if new.issue_date is null then
      new.issue_date := current_date;
    end if;
    if new.due_date is null then
      new.due_date := new.issue_date + 30;
    end if;
    if new.issued_at is null then
      new.issued_at := pg_catalog.now();
    end if;
    new.cancelled_at := null;
  elsif new.status = 'cancelled' then
    if new.cancelled_at is null then
      new.cancelled_at := pg_catalog.now();
    end if;
  elsif new.status = 'draft' then
    new.issue_date := null;
    new.due_date := null;
    new.issued_at := null;
    new.cancelled_at := null;
  end if;

  paid_amount := private.active_invoice_paid_amount(new.id);

  if new.status = 'draft' and paid_amount <> 0 then
    raise exception 'draft invoice cannot have payments';
  elsif new.status = 'issued' and paid_amount <> 0 then
    raise exception 'issued invoice payment total must be zero';
  elsif new.status = 'overdue' and (paid_amount <> 0 or new.due_date >= current_date) then
    raise exception 'overdue invoice requires zero payments and a past due date';
  elsif new.status = 'partially_paid' and not (paid_amount > 0 and paid_amount < new.total_amount) then
    raise exception 'partially paid status does not match payments';
  elsif new.status = 'paid' and not (new.total_amount > 0 and paid_amount = new.total_amount) then
    raise exception 'paid status does not match payments';
  elsif new.status = 'cancelled' and paid_amount <> 0 then
    raise exception 'invoice with payments cannot be cancelled';
  end if;

  if new.status not in ('draft','cancelled') and new.total_amount <= 0 then
    raise exception 'invoice must have a positive total before issue';
  end if;

  return new;
end;
$$;

create or replace function private.recalculate_invoice_after_discount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  paid_amount numeric(14,2);
begin
  if new.discount_amount > new.subtotal then
    raise exception 'discount cannot exceed invoice subtotal';
  end if;

  new.total_amount := new.subtotal - new.discount_amount;
  paid_amount := private.active_invoice_paid_amount(new.id);

  if paid_amount > new.total_amount then
    raise exception 'invoice total cannot be reduced below active payments';
  end if;

  return new;
end;
$$;

create or replace function private.guard_invoice_item_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_invoice_id uuid;
  target_workspace_id uuid;
  target_status text;
begin
  target_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  target_workspace_id := case when tg_op = 'DELETE' then old.workspace_id else new.workspace_id end;

  if tg_op = 'UPDATE'
    and (
      new.invoice_id is distinct from old.invoice_id
      or new.workspace_id is distinct from old.workspace_id
    )
  then
    raise exception 'invoice item ownership is immutable';
  end if;

  select invoice.status
  into target_status
  from public.invoices as invoice
  where invoice.id = target_invoice_id
    and invoice.workspace_id = target_workspace_id
  for update;

  if target_status is distinct from 'draft' then
    raise exception 'invoice items may change only while invoice is draft';
  end if;

  if tg_op <> 'DELETE' then
    new.line_amount := round(new.quantity * new.unit_amount, 2);
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.recalculate_invoice_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_invoice_id uuid;
  target_workspace_id uuid;
  calculated_subtotal numeric(14,2);
  current_discount numeric(14,2);
  calculated_total numeric(14,2);
  paid_amount numeric(14,2);
begin
  target_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  target_workspace_id := case when tg_op = 'DELETE' then old.workspace_id else new.workspace_id end;

  select coalesce(sum(item.line_amount), 0)::numeric(14,2)
  into calculated_subtotal
  from public.invoice_items as item
  where item.invoice_id = target_invoice_id
    and item.workspace_id = target_workspace_id;

  select invoice.discount_amount
  into current_discount
  from public.invoices as invoice
  where invoice.id = target_invoice_id
    and invoice.workspace_id = target_workspace_id
  for update;

  if current_discount > calculated_subtotal then
    raise exception 'discount cannot exceed invoice subtotal';
  end if;

  calculated_total := calculated_subtotal - current_discount;
  paid_amount := private.active_invoice_paid_amount(target_invoice_id);

  if paid_amount > calculated_total then
    raise exception 'invoice total cannot be reduced below active payments';
  end if;

  update public.invoices
  set subtotal = calculated_subtotal,
      total_amount = calculated_total
  where id = target_invoice_id
    and workspace_id = target_workspace_id;

  return null;
end;
$$;

create or replace function private.validate_payment_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_row public.invoices%rowtype;
  paid_amount numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
      or new.invoice_id is distinct from old.invoice_id
      or new.payment_date is distinct from old.payment_date
      or new.amount is distinct from old.amount
      or new.mode is distinct from old.mode
      or new.reference is distinct from old.reference
      or new.note is distinct from old.note
      or new.recorded_by is distinct from old.recorded_by
      or new.created_at is distinct from old.created_at
    then
      raise exception 'payment identity and financial fields are immutable';
    end if;

    if old.reversed_at is not null and new.reversed_at is distinct from old.reversed_at then
      raise exception 'payment reversal is immutable';
    end if;

    return new;
  end if;

  select *
  into invoice_row
  from public.invoices
  where id = new.invoice_id
    and workspace_id = new.workspace_id
  for update;

  if invoice_row.id is null then
    raise exception 'invoice not found in payment workspace';
  end if;
  if invoice_row.status not in ('issued','partially_paid','overdue') then
    raise exception 'payments require an issued unpaid invoice';
  end if;
  if new.recorded_by <> (select auth.uid()) then
    raise exception 'recorded_by must match authenticated user';
  end if;

  paid_amount := private.active_invoice_paid_amount(new.invoice_id);
  if paid_amount + new.amount > invoice_row.total_amount then
    raise exception 'payment would exceed invoice total';
  end if;

  return new;
end;
$$;

create or replace function private.reconcile_invoice_payment_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_invoice_id uuid;
  target_workspace_id uuid;
  invoice_total numeric(14,2);
  invoice_due_date date;
  paid_amount numeric(14,2);
  next_status text;
begin
  target_invoice_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  target_workspace_id := case when tg_op = 'DELETE' then old.workspace_id else new.workspace_id end;

  select total_amount, due_date
  into invoice_total, invoice_due_date
  from public.invoices
  where id = target_invoice_id
    and workspace_id = target_workspace_id
  for update;

  paid_amount := private.active_invoice_paid_amount(target_invoice_id);

  if paid_amount = invoice_total and invoice_total > 0 then
    next_status := 'paid';
  elsif paid_amount > 0 then
    next_status := 'partially_paid';
  elsif invoice_due_date < current_date then
    next_status := 'overdue';
  else
    next_status := 'issued';
  end if;

  update public.invoices
  set status = next_status
  where id = target_invoice_id
    and workspace_id = target_workspace_id;

  return null;
end;
$$;

revoke all on function private.active_invoice_paid_amount(uuid) from public, anon;
revoke all on function private.prepare_invoice() from public, anon, authenticated;
revoke all on function private.recalculate_invoice_after_discount() from public, anon, authenticated;
revoke all on function private.guard_invoice_item_mutation() from public, anon, authenticated;
revoke all on function private.recalculate_invoice_totals() from public, anon, authenticated;
revoke all on function private.validate_payment_mutation() from public, anon, authenticated;
revoke all on function private.reconcile_invoice_payment_status() from public, anon, authenticated;
grant execute on function private.active_invoice_paid_amount(uuid) to authenticated;

create trigger invoice_sequences_set_updated_at
before update on public.invoice_sequences
for each row execute function private.set_updated_at();

create trigger invoices_prepare
before insert or update on public.invoices
for each row execute function private.prepare_invoice();

create trigger invoices_recalculate_discount
before update of discount_amount on public.invoices
for each row execute function private.recalculate_invoice_after_discount();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function private.set_updated_at();

create trigger invoice_items_guard
before insert or update or delete on public.invoice_items
for each row execute function private.guard_invoice_item_mutation();

create trigger invoice_items_recalculate
after insert or update or delete on public.invoice_items
for each row execute function private.recalculate_invoice_totals();

create trigger invoice_items_set_updated_at
before update on public.invoice_items
for each row execute function private.set_updated_at();

create trigger payments_validate
before insert or update on public.payments
for each row execute function private.validate_payment_mutation();

create trigger payments_reconcile
after insert or update of reversed_at on public.payments
for each row execute function private.reconcile_invoice_payment_status();
