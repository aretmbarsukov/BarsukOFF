-- BarsukON mobile-service booking and scheduling.
-- Run once in Supabase SQL Editor after supabase-schema.sql.
-- Customers can read only their own mobile repairs. Only admins can manage
-- repairs, schedules, and service hours.

-- The account settings UI may edit contact details, never the admin role.
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'customer');
revoke update on public.profiles from anon, authenticated, public;
grant update (full_name, phone) on public.profiles to authenticated;

create table if not exists public.mobile_repairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null default 'mobile'
    check (service_type in ('studio', 'mobile')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  address text,
  city varchar(100),
  zip_code varchar(20),
  contact_phone varchar(40),
  visit_date timestamptz,
  time_slot varchar(50),
  preferred_time_from time,
  preferred_time_to time,
  device_brand varchar(100),
  device_model varchar(100),
  problem_description text,
  repair_type varchar(100),
  parts_quality varchar(50)
    check (parts_quality is null or parts_quality in ('original_oem', 'compatible_aaa')),
  estimated_price numeric(8,2) check (estimated_price is null or estimated_price >= 0),
  final_price numeric(8,2) check (final_price is null or final_price >= 0),
  assigned_technician uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.mobile_repairs add column if not exists contact_phone varchar(40);

create table if not exists public.mobile_schedule (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid references auth.users(id) on delete cascade,
  visit_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'available'
    check (status in ('available', 'booked', 'on_route')),
  repair_id uuid references public.mobile_repairs(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint mobile_schedule_valid_time check (end_time > start_time)
);

create table if not exists public.mobile_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  constraint mobile_hours_valid_time check (end_time > start_time)
);

create index if not exists mobile_repairs_user_created_idx
  on public.mobile_repairs (user_id, created_at desc);
create index if not exists mobile_repairs_visit_date_idx
  on public.mobile_repairs (visit_date);
create index if not exists mobile_schedule_available_idx
  on public.mobile_schedule (visit_date, start_time)
  where status = 'available';

create or replace function public.set_mobile_repair_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mobile_repairs_set_updated_at on public.mobile_repairs;
create trigger mobile_repairs_set_updated_at
  before update on public.mobile_repairs
  for each row execute function public.set_mobile_repair_updated_at();

alter table public.mobile_repairs enable row level security;
alter table public.mobile_schedule enable row level security;
alter table public.mobile_hours enable row level security;

drop policy if exists "mobile repairs own read" on public.mobile_repairs;
create policy "mobile repairs own read"
  on public.mobile_repairs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "mobile repairs own insert" on public.mobile_repairs;

drop policy if exists "mobile repairs admin manage" on public.mobile_repairs;
create policy "mobile repairs admin manage"
  on public.mobile_repairs for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mobile schedule available read" on public.mobile_schedule;
create policy "mobile schedule available read"
  on public.mobile_schedule for select to anon, authenticated
  using (status = 'available' or public.is_admin());

drop policy if exists "mobile schedule admin manage" on public.mobile_schedule;
create policy "mobile schedule admin manage"
  on public.mobile_schedule for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mobile hours available read" on public.mobile_hours;
create policy "mobile hours available read"
  on public.mobile_hours for select to anon, authenticated
  using (is_available or public.is_admin());

drop policy if exists "mobile hours admin manage" on public.mobile_hours;
create policy "mobile hours admin manage"
  on public.mobile_hours for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update, delete on public.mobile_repairs to authenticated;
revoke insert on public.mobile_repairs from anon, authenticated;
grant select on public.mobile_schedule to anon, authenticated;
grant insert, update, delete on public.mobile_schedule to authenticated;
grant select on public.mobile_hours to anon, authenticated;
grant insert, update, delete on public.mobile_hours to authenticated;

create or replace function public.book_mobile_repair(
  p_schedule_id uuid,
  p_city text,
  p_address text,
  p_zip_code text,
  p_device_brand text,
  p_device_model text,
  p_problem_description text,
  p_repair_type text,
  p_parts_quality text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_slot public.mobile_schedule%rowtype;
  v_repair_id uuid;
  v_base_price numeric(8,2);
  v_estimated_price numeric(8,2);
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para solicitar una visita.';
  end if;
  if p_city not in ('Madrid', 'Barcelona') then
    raise exception 'La ciudad no está disponible para el servicio móvil.';
  end if;
  if nullif(trim(p_address), '') is null
     or nullif(trim(p_device_brand), '') is null
     or nullif(trim(p_device_model), '') is null
     or nullif(trim(p_problem_description), '') is null
     or nullif(trim(p_contact_phone), '') is null then
    raise exception 'Completa todos los datos obligatorios.';
  end if;
  if p_parts_quality not in ('original_oem', 'compatible_aaa') then
    raise exception 'La calidad de las piezas no es válida.';
  end if;

  select * into v_slot
    from public.mobile_schedule
    where id = p_schedule_id and status = 'available'
    for update;
  if not found then
    raise exception 'Ese horario ya no está disponible. Elige otro.';
  end if;
  if v_slot.visit_date < current_date + 3 or v_slot.visit_date > current_date + 7 then
    raise exception 'La fecha debe estar entre 3 y 7 días a partir de hoy.';
  end if;

  v_base_price := case lower(p_device_brand)
    when 'apple' then case p_repair_type when 'screen' then 120 when 'battery' then 75 when 'charging' then 65 when 'water' then 90 when 'software' then 55 when 'soldering' then 180 end
    when 'samsung' then case p_repair_type when 'screen' then 105 when 'battery' then 68 when 'charging' then 60 when 'water' then 82 when 'software' then 48 when 'soldering' then 165 end
    when 'xiaomi' then case p_repair_type when 'screen' then 88 when 'battery' then 55 when 'charging' then 52 when 'water' then 70 when 'software' then 40 when 'soldering' then 150 end
    when 'google' then case p_repair_type when 'screen' then 98 when 'battery' then 62 when 'charging' then 58 when 'water' then 76 when 'software' then 44 when 'soldering' then 160 end
    else case p_repair_type when 'screen' then 110 when 'battery' then 70 when 'charging' then 60 when 'water' then 80 when 'software' then 45 when 'soldering' then 170 end
  end;
  if v_base_price is null then
    raise exception 'El tipo de reparación no es válido.';
  end if;
  v_estimated_price := round(
    (v_base_price * case when p_parts_quality = 'compatible_aaa' then 0.75 else 1 end
      * case when lower(p_device_brand) = 'apple' then 1.10 else 1 end) + 30,
    2
  );

  insert into public.mobile_repairs (
    user_id, service_type, status, address, city, zip_code, contact_phone,
    visit_date, time_slot, device_brand, device_model, problem_description,
    repair_type, parts_quality, estimated_price, assigned_technician
  ) values (
    v_user_id, 'mobile', 'pending', trim(p_address), p_city,
    nullif(trim(p_zip_code), ''), trim(p_contact_phone),
    v_slot.visit_date + v_slot.start_time,
    to_char(v_slot.start_time, 'HH24:MI') || ' - ' || to_char(v_slot.end_time, 'HH24:MI'),
    trim(p_device_brand), trim(p_device_model), trim(p_problem_description),
    p_repair_type, p_parts_quality, v_estimated_price, v_slot.technician_id
  )
  returning id into v_repair_id;

  update public.mobile_schedule
    set status = 'booked', repair_id = v_repair_id
    where id = v_slot.id;

  return v_repair_id;
end;
$$;

revoke all on function public.book_mobile_repair(uuid, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.book_mobile_repair(uuid, text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_reschedule_mobile_repair(
  p_repair_id uuid,
  p_schedule_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_repair public.mobile_repairs%rowtype;
  v_slot public.mobile_schedule%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar la agenda.';
  end if;
  select * into v_repair from public.mobile_repairs where id = p_repair_id for update;
  if not found then raise exception 'No se encontró la solicitud.'; end if;
  select * into v_slot from public.mobile_schedule where id = p_schedule_id and status = 'available' for update;
  if not found then raise exception 'Ese horario ya no está disponible.'; end if;
  if v_slot.visit_date < current_date then raise exception 'No puedes asignar una fecha pasada.'; end if;

  update public.mobile_schedule
    set status = 'available', repair_id = null
    where repair_id = v_repair.id;
  update public.mobile_schedule
    set status = 'booked', repair_id = v_repair.id
    where id = v_slot.id;
  update public.mobile_repairs
    set visit_date = v_slot.visit_date + v_slot.start_time,
        time_slot = to_char(v_slot.start_time, 'HH24:MI') || ' - ' || to_char(v_slot.end_time, 'HH24:MI'),
        assigned_technician = v_slot.technician_id
    where id = v_repair.id;
end;
$$;

create or replace function public.admin_set_mobile_repair_status(
  p_repair_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar el estado.';
  end if;
  if p_status not in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') then
    raise exception 'El estado no es válido.';
  end if;
  update public.mobile_repairs set status = p_status where id = p_repair_id;
  if not found then raise exception 'No se encontró la solicitud.'; end if;
  if p_status = 'cancelled' then
    update public.mobile_schedule
      set status = 'available', repair_id = null
      where repair_id = p_repair_id and status = 'booked';
  end if;
end;
$$;

revoke all on function public.admin_reschedule_mobile_repair(uuid, uuid) from public, anon;
grant execute on function public.admin_reschedule_mobile_repair(uuid, uuid) to authenticated;
revoke all on function public.admin_set_mobile_repair_status(uuid, text) from public, anon;
grant execute on function public.admin_set_mobile_repair_status(uuid, text) to authenticated;
