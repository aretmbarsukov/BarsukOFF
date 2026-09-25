-- BarsukON MVP schema. Run this file in the Supabase SQL editor before deploying.
-- Assign the admin role manually: UPDATE public.profiles SET role = 'admin' WHERE id = 'AUTH-USER-UUID';
-- Never put a Supabase service-role or other secret key in this repository.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null, model text not null, serial_number text,
  created_at timestamptz not null default now()
);
create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  device_brand text, device_model text, issue text not null,
  notes text, status text not null default 'received',
  estimated_price numeric(10,2), created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null, rating int not null check (rating between 1 and 5),
  body text not null, approved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  name text not null, sku text unique, stock int not null default 0,
  price numeric(10,2), active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, discount text,
  starts_at timestamptz not null default now(), ends_at timestamptz,
  active boolean not null default true, created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.repair_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.parts enable row level security;
alter table public.promotions enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "devices own access" on public.devices for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "requests own access" on public.repair_requests for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "reviews public approved read" on public.reviews for select to anon, authenticated using (approved = true or user_id = auth.uid() or public.is_admin());
create policy "reviews own insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews own update" on public.reviews for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete" on public.reviews for delete to authenticated using (public.is_admin());
create policy "parts admin access" on public.parts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "promotions public active read" on public.promotions for select to anon, authenticated using (active = true and starts_at <= now() and (ends_at is null or ends_at >= now()) or public.is_admin());
create policy "promotions admin access" on public.promotions for all to authenticated using (public.is_admin()) with check (public.is_admin());
