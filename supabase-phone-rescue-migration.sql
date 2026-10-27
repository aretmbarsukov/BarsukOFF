-- Save each signed-in user's personal best for Phone Rescue.
create table if not exists public.phone_rescue_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  best_score integer not null check (best_score between 0 and 1000),
  best_elapsed_seconds integer not null check (best_elapsed_seconds between 1 and 90),
  updated_at timestamptz not null default now()
);

alter table public.phone_rescue_scores enable row level security;

revoke all on public.phone_rescue_scores from anon, authenticated, public;
grant select on public.phone_rescue_scores to authenticated;

drop policy if exists "phone rescue scores own read" on public.phone_rescue_scores;
create policy "phone rescue scores own read"
on public.phone_rescue_scores for select to authenticated
using (user_id = auth.uid());

create or replace function public.save_phone_rescue_score(p_score integer, p_elapsed_seconds integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_best_score integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_score is null or p_score not between 0 and 1000
    or p_elapsed_seconds is null or p_elapsed_seconds not between 1 and 90 then
    raise exception 'Invalid Phone Rescue score' using errcode = '22023';
  end if;

  insert into public.phone_rescue_scores (user_id, best_score, best_elapsed_seconds)
  values (v_user_id, p_score, p_elapsed_seconds)
  on conflict (user_id) do update
  set best_score = excluded.best_score,
      best_elapsed_seconds = excluded.best_elapsed_seconds,
      updated_at = now()
  where excluded.best_score > public.phone_rescue_scores.best_score;

  select best_score into v_best_score
  from public.phone_rescue_scores
  where user_id = v_user_id;

  return v_best_score;
end;
$$;

revoke all on function public.save_phone_rescue_score(integer, integer) from public, anon;
grant execute on function public.save_phone_rescue_score(integer, integer) to authenticated;
