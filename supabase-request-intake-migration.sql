-- Allow visitors without an account to submit repair requests.
-- Anonymous users can insert requests only; RLS does not allow them to read or change requests.
alter table public.repair_requests
  alter column user_id drop not null;

drop policy if exists "requests own access" on public.repair_requests;
drop policy if exists "requests own read" on public.repair_requests;
drop policy if exists "requests own insert" on public.repair_requests;
drop policy if exists "requests admin access" on public.repair_requests;
create policy "requests own read"
  on public.repair_requests
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "requests own insert"
  on public.repair_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());
create policy "requests admin access"
  on public.repair_requests
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "requests public intake" on public.repair_requests;
create policy "requests public intake"
  on public.repair_requests
  for insert
  to anon
  with check (user_id is null);

grant insert on public.repair_requests to anon;
