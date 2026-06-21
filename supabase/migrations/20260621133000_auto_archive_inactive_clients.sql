-- Trigger function to automatically mark clients inactive and archive them
-- starting from AY 2026-27 and if they have not had a case opened for a straight 3 AYs.
CREATE OR REPLACE FUNCTION public.auto_archive_inactive_clients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_ay_start_year integer;
  ay_1_label text;
  ay_2_label text;
BEGIN
  -- Parse starting year of the new current assessment year
  current_ay_start_year := CAST(substring(NEW.label from '^[0-9]{4}') AS integer);

  -- Only run if the assessment year is 2026-27 or later (starting year >= 2026)
  IF current_ay_start_year >= 2026 THEN
    -- Calculate labels for previous two assessment years (e.g. 2025-26, 2024-25)
    ay_1_label := (current_ay_start_year - 1) || '-' || substring(CAST(current_ay_start_year AS text) from 3 for 2);
    ay_2_label := (current_ay_start_year - 2) || '-' || substring(CAST(current_ay_start_year - 1 AS text) from 3 for 2);

    -- Update clients: mark active = false and archived_at = now()
    -- Only for clients created before the start date of the second previous year (i.e. older than A-1 start date).
    -- Clients whose created_at is before NEW.start_date - interval '1 year' have existed during 2024-25.
    UPDATE public.clients c
    SET active = false,
        archived_at = COALESCE(c.archived_at, pg_catalog.now()),
        updated_at = pg_catalog.now()
    WHERE c.workspace_id = NEW.workspace_id
      AND c.active = true
      AND c.archived_at IS NULL
      AND c.created_at < (NEW.start_date - interval '1 year')
      AND NOT EXISTS (
        SELECT 1 
        FROM public.filing_cases fc
        WHERE fc.client_id = c.id
          AND fc.workspace_id = NEW.workspace_id
          AND fc.archived_at IS NULL
          AND fc.assessment_year_id IN (
            SELECT ay.id 
            FROM public.assessment_years ay
            WHERE ay.workspace_id = NEW.workspace_id
              AND ay.label IN (NEW.label, ay_1_label, ay_2_label)
          )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on assessment_years
DROP TRIGGER IF EXISTS assessment_years_auto_archive ON public.assessment_years;
CREATE TRIGGER assessment_years_auto_archive
  AFTER INSERT OR UPDATE ON public.assessment_years
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.auto_archive_inactive_clients();
