-- Create the sdds-avatars storage bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('sdds-avatars', 'sdds-avatars', true)
on conflict (id) do update set public = true;

-- Drop existing policies if any
drop policy if exists sdds_avatars_select on storage.objects;
drop policy if exists sdds_avatars_insert on storage.objects;
drop policy if exists sdds_avatars_update on storage.objects;
drop policy if exists sdds_avatars_delete on storage.objects;

-- SELECT policy: Allow read access to all avatars
create policy sdds_avatars_select
on storage.objects
for select
to public
using (bucket_id = 'sdds-avatars');

-- INSERT policy: Allow authenticated users to upload their own avatar
create policy sdds_avatars_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sdds-avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

-- UPDATE policy: Allow authenticated users to update their own avatar
create policy sdds_avatars_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sdds-avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id = 'sdds-avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

-- DELETE policy: Allow authenticated users to delete their own avatar
create policy sdds_avatars_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sdds-avatars'
  and split_part(name, '/', 1) = (select auth.uid())::text
);
