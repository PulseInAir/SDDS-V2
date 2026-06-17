alter table public.invoices
  alter column invoice_number drop default,
  alter column serial_number drop default;
