-- Supplier cover photo — public bucket (unlike event-images' private one:
-- a business's own listing photo is meant to be visible to anyone browsing
-- suppliers, same trust model as a publishable key, not personal wedding
-- photos). One photo per account, path "{auth.uid()}/cover.{ext}" — the
-- onboarding wizard upserts to the same path on re-upload, so ownership is
-- just a string-prefix check, same idiom as event-images.
insert into storage.buckets (id, name, public)
values ('supplier-photos', 'supplier-photos', true)
on conflict (id) do nothing;

create policy supplier_photos_public_select on storage.objects for select
  using (bucket_id = 'supplier-photos');

create policy supplier_photos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'supplier-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy supplier_photos_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'supplier-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy supplier_photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'supplier-photos' and (storage.foldername(name))[1] = auth.uid()::text);
