create or replace function private.validate_client_case_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  case_client_id uuid;
begin
  if new.case_id is null then
    return new;
  end if;

  select filing_case.client_id
  into case_client_id
  from public.filing_cases as filing_case
  where filing_case.workspace_id = new.workspace_id
    and filing_case.id = new.case_id;

  if case_client_id is null or case_client_id <> new.client_id then
    raise exception 'case does not belong to the supplied workspace and client';
  end if;

  return new;
end;
$$;

create or replace function private.validate_follow_up_case_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  case_client_id uuid;
  case_assessment_year_id uuid;
begin
  if new.case_id is null then
    return new;
  end if;

  select filing_case.client_id, filing_case.assessment_year_id
  into case_client_id, case_assessment_year_id
  from public.filing_cases as filing_case
  where filing_case.workspace_id = new.workspace_id
    and filing_case.id = new.case_id;

  if case_client_id is null
    or case_client_id <> new.client_id
    or case_assessment_year_id <> new.assessment_year_id
  then
    raise exception 'follow-up case does not match supplied client and assessment year';
  end if;

  return new;
end;
$$;

create or replace function private.validate_document_operational_context()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  case_client_id uuid;
  case_assessment_year_id uuid;
begin
  if new.case_id is null then
    if new.filing_record_id is not null or new.tax_event_id is not null then
      raise exception 'filing record and tax event documents require a filing case';
    end if;
    return new;
  end if;

  select filing_case.client_id, filing_case.assessment_year_id
  into case_client_id, case_assessment_year_id
  from public.filing_cases as filing_case
  where filing_case.workspace_id = new.workspace_id
    and filing_case.id = new.case_id;

  if case_client_id is null or case_client_id <> new.client_id then
    raise exception 'document case does not belong to supplied client';
  end if;

  if new.assessment_year_id is not null
    and case_assessment_year_id <> new.assessment_year_id
  then
    raise exception 'document assessment year does not match filing case';
  end if;

  return new;
end;
$$;

create or replace function private.protect_document_object_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(
    old.workspace_id, old.client_id, old.case_id, old.filing_record_id,
    old.tax_event_id, old.assessment_year_id, old.storage_bucket, old.storage_path,
    old.original_filename, old.safe_filename, old.mime_type, old.size_bytes,
    old.checksum_sha256, old.version, old.replaces_document_id,
    old.uploaded_by, old.uploaded_at
  ) is distinct from row(
    new.workspace_id, new.client_id, new.case_id, new.filing_record_id,
    new.tax_event_id, new.assessment_year_id, new.storage_bucket, new.storage_path,
    new.original_filename, new.safe_filename, new.mime_type, new.size_bytes,
    new.checksum_sha256, new.version, new.replaces_document_id,
    new.uploaded_by, new.uploaded_at
  ) then
    raise exception 'document object identity is immutable; create a replacement version instead';
  end if;

  return new;
end;
$$;

create trigger follow_ups_validate_case_context
before insert or update on public.follow_ups
for each row execute function private.validate_follow_up_case_context();

create trigger communications_validate_case_context
before insert on public.communications
for each row execute function private.validate_client_case_context();

create trigger activity_events_validate_case_context
before insert on public.activity_events
for each row execute function private.validate_client_case_context();

create trigger documents_validate_operational_context
before insert or update on public.documents
for each row execute function private.validate_document_operational_context();

revoke all on function private.validate_client_case_context() from public, anon, authenticated;
revoke all on function private.validate_follow_up_case_context() from public, anon, authenticated;
revoke all on function private.validate_document_operational_context() from public, anon, authenticated;
revoke all on function private.protect_document_object_identity() from public, anon, authenticated;
