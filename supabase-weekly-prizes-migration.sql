-- Run in Supabase SQL Editor to enable public weekly prize display and admin editing.
create table if not exists public.leaderboard_weekly_prizes (
  place smallint primary key check (place between 1 and 3),
  prize varchar(160) not null check (char_length(btrim(prize)) between 1 and 160),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_weekly_prizes enable row level security;
revoke all on public.leaderboard_weekly_prizes from public, anon, authenticated;
grant select on public.leaderboard_weekly_prizes to anon, authenticated;
grant insert, update on public.leaderboard_weekly_prizes to authenticated;

drop policy if exists "weekly prizes public read" on public.leaderboard_weekly_prizes;
create policy "weekly prizes public read"
  on public.leaderboard_weekly_prizes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "weekly prizes admin manage" on public.leaderboard_weekly_prizes;
create policy "weekly prizes admin manage"
  on public.leaderboard_weekly_prizes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.leaderboard_weekly_prizes (place, prize)
values (1, 'Premio por configurar'), (2, 'Premio por configurar'), (3, 'Premio por configurar')
on conflict (place) do nothing;

notify pgrst, 'reload schema';