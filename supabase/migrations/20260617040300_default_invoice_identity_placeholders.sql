alter table public.invoices
  alter column invoice_number set default '',
  alter column serial_number set default 0;

comment on column public.invoices.invoice_number is 'Database trigger allocates SDDS/ITR/{AY}/{Serial}; empty default exists only so typed inserts may omit this field.';
comment on column public.invoices.serial_number is 'Database trigger atomically replaces the zero insert default with the next assessment-year serial.';
