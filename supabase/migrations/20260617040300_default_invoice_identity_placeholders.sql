alter table public.invoices
  alter column invoice_number set default '',
  alter column serial_number set default 0;
