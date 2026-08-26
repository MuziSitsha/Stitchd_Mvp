-- Real image upload for Vision's mood board (and, generalized, Documents'
-- "Upload a document"). Private bucket — photos are personal to a couple's
-- own wedding, not public assets like the seeded stock photography under
-- public/photos/. Path convention is "{auth.uid()}/{...}", so ownership is
-- just a string-prefix check on the object path — one client account maps
-- to exactly one event (events_one_per_owner), so auth.uid() alone is
-- enough to scope a folder without a join back to events.
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', false)
on conflict (id) do nothing;

create policy event_images_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy event_images_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy event_images_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admin/super gets a read-only cross-account view, matching every other
-- RLS'd table in this project (supplier_tickets, budget_payments, events).
create policy event_images_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'event-images' and public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));
