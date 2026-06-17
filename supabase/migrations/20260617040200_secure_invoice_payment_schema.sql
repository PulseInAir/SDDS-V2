alter table public.invoice_sequences enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy invoices_select_member
on public.invoices
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy invoices_insert_member
on public.invoices
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy invoices_update_member
on public.invoices
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy invoice_items_select_member
on public.invoice_items
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy invoice_items_insert_member
on public.invoice_items
for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy invoice_items_update_member
on public.invoice_items
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy invoice_items_delete_member
on public.invoice_items
for delete
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy payments_select_member
on public.payments
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy payments_insert_member
on public.payments
for insert
to authenticated
with check (
  (select private.is_workspace_member(workspace_id))
  and recorded_by = (select auth.uid())
);

create policy payments_update_member
on public.payments
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

revoke all on table public.invoice_sequences from public, anon, authenticated, service_role;
revoke all on table public.invoices from public, anon, authenticated, service_role;
revoke all on table public.invoice_items from public, anon, authenticated, service_role;
revoke all on table public.payments from public, anon, authenticated, service_role;

grant select, insert on table public.invoices to authenticated;
grant select, insert, delete on table public.invoice_items to authenticated;
grant select, insert on table public.payments to authenticated;

grant select, insert, update, delete on table public.invoice_sequences to service_role;
grant select, insert, update on table public.invoices to service_role;
grant select, insert, update, delete on table public.invoice_items to service_role;
grant select, insert, update on table public.payments to service_role;
