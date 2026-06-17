create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  case_id uuid,
  filing_record_id uuid,
  assessment_year_id uuid,
  document_type text not null,
  checklist_status text not null default 'received',
  storage_bucket text not null default 'sdds-documents',
  storage_path text not null,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  checksum_sha256 text,
  version integer not null default 1,
  replaces_document_id uuid,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  archived_at timestamptz,
  constraint documents_workspace_id_id_unique unique (workspace_id, id),
  constraint documents_workspace_client_id_id_unique unique (workspace_id, client_id, id),
  constraint documents_client_workspace_fk foreign key (workspace_id, client_id) references public.clients(workspace_id, id),
  constraint documents_case_workspace_fk foreign key (workspace_id, case_id) references public.filing_cases(workspace_id, id),
  constraint documents_filing_record_workspace_fk foreign key (workspace_id, case_id, filing_record_id) references public.filing_records(workspace_id, case_id, id),
  constraint documents_assessment_year_workspace_fk foreign key (workspace_id, assessment_year_id) references public.assessment_years(workspace_id, id),
  constraint documents_replacement_same_client_fk foreign key (workspace_id, client_id, replaces_document_id) references public.documents(workspace_id, client_id, id),
  constraint documents_type_not_blank check (btrim(document_type) <> ''),
  constraint documents_checklist_status_allowed check (checklist_status in ('required','requested','received','verified','rejected','replacement_needed','not_applicable')),
  constraint documents_bucket_fixed check (storage_bucket = 'sdds-documents'),
  constraint documents_storage_path_not_blank check (btrim(storage_path) <> ''),
  constraint documents_filename_not_blank check (btrim(original_filename) <> '' and btrim(safe_filename) <> ''),
  constraint documents_safe_filename_shape check (safe_filename !~ '[\\/]' and safe_filename not in ('.','..')),
  constraint documents_mime_type_not_blank check (btrim(mime_type) <> ''),
  constraint documents_size_positive check (size_bytes > 0),
  constraint documents_checksum_shape check (checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'),
  constraint documents_version_positive check (version > 0),
  constraint documents_replacement_version_rule check ((replaces_document_id is null and version = 1) or (replaces_document_id is not null and version > 1)),
  constraint documents_verified_state_consistent check ((checklist_status = 'verified' and verified_by is not null and verified_at is not null) or (checklist_status <> 'verified' and verified_by is null and verified_at is null)),
  constraint documents_case_required_for_filing_record check (filing_record_id is null or case_id is not null),
  constraint documents_path_contract check (
    storage_path ~ ('^' || workspace_id::text || '/' || client_id::text || '/' || id::text || '/[^/]+$')
    and storage_path = workspace_id::text || '/' || client_id::text || '/' || id::text || '/' || safe_filename
  )
);

create unique index documents_storage_object_unique_idx on public.documents (storage_bucket, storage_path);
create index documents_client_status_idx on public.documents (workspace_id, client_id, checklist_status, uploaded_at desc) where archived_at is null;
create index documents_case_idx on public.documents (workspace_id, case_id, uploaded_at desc) where case_id is not null and archived_at is null;
create index documents_filing_record_idx on public.documents (workspace_id, case_id, filing_record_id) where filing_record_id is not null and archived_at is null;
create index documents_assessment_year_idx on public.documents (workspace_id, assessment_year_id, uploaded_at desc) where assessment_year_id is not null and archived_at is null;
create index documents_replacement_idx on public.documents (workspace_id, client_id, replaces_document_id) where replaces_document_id is not null;
create index documents_uploaded_by_idx on public.documents (uploaded_by, uploaded_at desc);
create index documents_verified_by_idx on public.documents (verified_by, verified_at desc) where verified_by is not null;

insert into storage.buckets (id, name, public)
values ('sdds-documents', 'sdds-documents', false)
on conflict (id) do update set public = false;

comment on table public.documents is 'Private document metadata with immutable object paths and replacement history.';
