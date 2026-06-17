import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("../supabase/migrations/", import.meta.url);
const sql = (
  await Promise.all(
    (await readdir(directory))
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => readFile(new URL(name, directory), "utf8")),
  )
).join("\n");

test("G06 creates document metadata with required ownership and object fields", () => {
  assert.match(sql, /create table public\.documents\s*\(/i);
  for (const field of [
    "workspace_id",
    "client_id",
    "storage_bucket",
    "storage_path",
    "original_filename",
    "safe_filename",
    "mime_type",
    "size_bytes",
    "version",
    "replaces_document_id",
    "uploaded_by",
  ]) {
    assert.match(sql, new RegExp(`\\b${field}\\b`, "i"));
  }
});

test("bucket is private and fixed to the SDDS document contract", () => {
  assert.match(sql, /values \('sdds-documents', 'sdds-documents', false\)/i);
  assert.match(sql, /documents_bucket_fixed/i);
  assert.match(sql, /storage_bucket = 'sdds-documents'/i);
});

test("object path binds workspace, client, document, and safe filename", () => {
  assert.match(sql, /documents_path_contract/i);
  assert.match(
    sql,
    /workspace_id::text \|\| '\/' \|\| client_id::text \|\| '\/' \|\| id::text \|\| '\/' \|\| safe_filename/i,
  );
});

test("replacement history is additive and object identity is immutable", () => {
  assert.match(sql, /documents_replacement_same_client_fk/i);
  assert.match(sql, /documents_replacement_version_rule/i);
  assert.match(sql, /documents_validate_version/i);
  assert.match(sql, /documents_protect_object_identity/i);
  assert.match(sql, /create a replacement version instead/i);
});

test("document metadata and storage objects enforce RLS", () => {
  assert.match(sql, /alter table public\.documents enable row level security/i);
  assert.match(sql, /create policy documents_select_member/i);
  assert.match(sql, /create policy documents_insert_member/i);
  assert.match(sql, /create policy documents_update_member/i);
  assert.match(sql, /create policy sdds_documents_select/i);
  assert.match(sql, /create policy sdds_documents_insert/i);
  assert.doesNotMatch(sql, /create policy sdds_documents_delete/i);
  assert.doesNotMatch(sql, /create policy sdds_documents_update/i);
});

test("authenticated users cannot destructively delete or overwrite document history", () => {
  assert.doesNotMatch(sql, /grant\s+[^;]*delete[^;]*on table public\.documents/i);
  assert.doesNotMatch(sql, /grant\s+[^;]*update[^;]*on table storage\.objects/i);
  assert.doesNotMatch(sql, /grant\s+[^;]*delete[^;]*on table storage\.objects/i);
});

test("storage access requires workspace membership and matching metadata", () => {
  assert.match(sql, /private\.can_upload_document_object/i);
  assert.match(sql, /private\.can_read_document_object/i);
  assert.match(sql, /membership\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /document\.storage_path = object_name/i);
});
