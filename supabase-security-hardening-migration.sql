-- Run after supabase-schema.sql and all feature migrations.
begin;

-- Client-submitted repair requests must not control IDs, status, or timestamps.
revoke insert on public.repair_requests from public, anon, authenticated;
revoke insert (id, user_id, device_id, device_brand, device_model, issue, notes, status, estimated_price, created_at)
  on public.repair_requests from public, anon, authenticated;
grant insert (user_id, device_brand, device_model, issue, notes, estimated_price)
  on public.repair_requests to anon, authenticated;

drop policy if exists "requests own insert" on public.repair_requests;
create policy "requests own insert"
  on public.repair_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'received'
    and device_id is null
  );

drop policy if exists "requests public intake" on public.repair_requests;
create policy "requests public intake"
  on public.repair_requests
  for insert
  to anon
  with check (user_id is null and device_id is null and status = 'received');

-- Reviewers may edit pending text, but only admins may approve or hide reviews.
revoke insert, update on public.reviews from public, anon, authenticated;
revoke insert (id, user_id, author_name, rating, body, approved, created_at)
  on public.reviews from public, anon, authenticated;
revoke update (id, user_id, author_name, rating, body, approved, created_at)
  on public.reviews from public, anon, authenticated;
grant insert (user_id, author_name, rating, body)
  on public.reviews to authenticated;
grant update (author_name, rating, body, approved)
  on public.reviews to authenticated;

drop policy if exists "reviews own insert" on public.reviews;
create policy "reviews own insert"
  on public.reviews
  for insert
  to authenticated
  with check (user_id = auth.uid() and approved = false);

drop policy if exists "reviews own update" on public.reviews;
drop policy if exists "reviews own update pending" on public.reviews;
create policy "reviews own update pending"
  on public.reviews
  for update
  to authenticated
  using (user_id = auth.uid() and approved = false)
  with check (user_id = auth.uid() and approved = false);

drop policy if exists "reviews admin update" on public.reviews;
create policy "reviews admin update"
  on public.reviews
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Prevent object-shadowing in privileged functions regardless of migration age.
do $$
declare
  function_signature text;
  function_signatures text[] := array[
    'public.handle_new_user()',
    'public.is_admin()',
    'public.get_mobile_available_slots(date, date)',
    'public.book_mobile_repair(uuid, text, text, text, text, text, text, text, text, text)',
    'public.book_mobile_repair(text, text, text, date, text, text, text, text, text, text, text, boolean, text)',
    'public.admin_reschedule_mobile_repair(uuid, uuid)',
    'public.admin_set_mobile_repair_status(uuid, text)',
    'public.save_phone_rescue_score(integer, integer)'
  ];
begin
  foreach function_signature in array function_signatures loop
    if to_regprocedure(function_signature) is not null then
      execute format(
        'alter function %s set search_path = %L',
        to_regprocedure(function_signature),
        ''
      );
    end if;
  end loop;
end;
$$;

commit;
notify pgrst, 'reload schema';