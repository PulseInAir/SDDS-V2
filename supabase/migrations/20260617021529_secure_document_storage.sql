create or replace function private.validate_document_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  replaced_version integer;
begin
  if new.replaces_document_id is null then
    if new.version <> 1 then
      raise exception 'initial document version must be 1';
    end if;
    return new;
  end if;

  select d.version
  into replaced_version
  from public.documents as d
  where d.workspace_id = new.workspace_id
    and d.client_id = new.client_id
    and d.id = new.replaces_document_id;

  if replaced_version is null or new.version <> replaced_version + 1 then
    raise exception 'replacement document version must increment its predecessor by 1';
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
    old.assessment_year_id, old.storage_bucket, old.storage_path,
    old.original_filename, old.safe_filename, old.mime_type, old.size_bytes,
    old.checksum_sha256, old.version, old.replaces_document_id,
    old.uploaded_by, old.uploaded_at
  ) is distinct from row(
    new.workspace_id, new.client_id, new.case_id, new.filing_record_id,
    new.assessment_year_id, new.storage_bucket, new.storage_path,
    new.original_filename, new.safe_filename, new.mime_type, new.size_bytes,
    new.checksum_sha256, new.version, new.replaces_document_id,
    new.uploaded_by, new.uploaded_at
  ) then
    raise exception 'document object identity is immutable; create a replacement version instead';
  end if;

  return new;
end;
$$;

create trigger documents_validate_version
before insert on public.documents
for each row execute function private.validate_document_version();

create trigger documents_protect_object_identity
before update on public.documents
for each row execute function private.protect_document_object_identity();

create or replace function private.can_upload_document_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    array_length(pg_catalog.string_to_array(object_name, '/'), 1) = 4
    and exists (
      select 1
      from public.workspace_members as membership
      join public.clients as client
        on client.workspace_id = membership.workspace_id
      where membership.user_id = (select auth.uid())
        and membership.active
        and membership.workspace_id::text = (pg_catalog.string_to_array(object_name, '/'))[1]
        and client.id::text = (pg_catalog.string_to_array(object_name, '/'))[2]
        and client.archived_at is null
    );
$$;

create or replace function private.can_read_document_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents as document
    join public.workspace_members as membership
      on membership.workspace_id = document.workspace_id
    where document.storage_bucket = 'sdds-documents'
      and document.storage_path = object_name
      and document.archived_at is null
      and membership.user_id = (select auth.uid())
      and membership.active
  );
$$;

revoke all on function private.validate_document_version() from public, anon, authenticated;
revoke all on function private.protect_document_object_identity() from public, anon, authenticated;
revoke all on function private.can_upload_document_object(text) from public, anon;
revoke all on function private.can_read_document_object(text) from public, anon;
grant execute on function private.can_upload_document_object(text) to authenticated;
grant execute on function private.can_read_document_object(text) to authenticated;

alter table public.documents enable row level security;

create policy documents_select_member
on public.documents
for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy documents_insert_member
on public.documents
for insert
to authenticated
with check (
  (select private.is_workspace_member(workspace_id))
  and uploaded_by = (select auth.uid())
);

create policy documents_update_member
on public.documents
for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check (
  (select private.is_workspace_member(workspace_id))
  and (verified_by is null or verified_by = (select auth.uid()))
);

revoke all on table public.documents from public, anon, authenticated, service_role;
grant select, insert, update on table public.documents to authenticated;
grant select, insert, update on table public.documents to service_role;

drop policy if exists sdds_documents_select on storage.objects;
drop policy if exists sdds_documents_insert on storage.objects;
drop policy if exists sdds_documents_update on storage.objects;
drop policy if exists sdds_documents_delete on storage.objects;

create policy sdds_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sdds-documents'
  and (select private.can_read_document_object(name))
);

create policy sdds_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sdds-documents'
  and (select private.can_upload_document_object(name))
);
