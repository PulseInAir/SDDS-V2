create index invoices_case_context_fk_idx
  on public.invoices (workspace_id, case_id, client_id, assessment_year_id)
  where case_id is not null;
