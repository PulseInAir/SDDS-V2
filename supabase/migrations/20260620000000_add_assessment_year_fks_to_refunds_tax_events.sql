-- G33 fix: add direct assessment_year_id FKs to refunds and tax_events
--
-- Both tables store assessment_year_id but only reference it via a composite FK
-- through filing_cases. PostgREST cannot resolve assessment_years!inner joins
-- without a direct FK relationship. This migration adds the missing direct FKs
-- so the existing queries in refunds.ts and notices.ts work correctly.
--
-- The composite filing_cases FK remains untouched — it enforces data integrity.
-- These new FKs add the PostgREST relationship hint only.

alter table public.refunds
  add constraint refunds_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id);

alter table public.tax_events
  add constraint tax_events_assessment_year_workspace_fk
    foreign key (workspace_id, assessment_year_id)
    references public.assessment_years(workspace_id, id);
