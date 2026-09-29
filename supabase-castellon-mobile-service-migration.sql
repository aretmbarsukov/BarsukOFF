-- Run after supabase-mobile-service-migration.sql.
-- Adds a 14-day, Castellon-area mobile booking calendar and admin-managed
-- weekly hours, city coverage, closed days, and unavailable time slots.

create table if not exists public.service_cities (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  province varchar(50) not null default 'Castellon',
  latitude numeric(10,8),
  longitude numeric(10,8),
  distance_km numeric(5,2) not null check (distance_km between 0 and 30),
  is_beach boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.service_cities
  add column if not exists is_beach boolean not null default false;

insert into public.service_cities (name, province, distance_km, is_beach) values
  ('Castellón', 'Castellón', 0, false),
  ('Villarreal', 'Castellón', 8, false),
  ('Benicássim', 'Castellón', 8, true),
  ('Almassora', 'Castellón', 11, false),
  ('Burriana', 'Castellón', 12, true),
  ('Betxí', 'Castellón', 15, false),
  ('Oropesa', 'Castellón', 15, true),
  ('Torreblanca', 'Castellón', 15, true),
  ('Nules', 'Castellón', 18, false),
  ('Benlloc', 'Castellón', 20, false),
  ('Ribesalbes', 'Castellón', 20, false),
  ('Vall d''Uixó', 'Castellón', 20, false),
  ('Cabanes', 'Castellón', 20, false),
  ('Onda', 'Castellón', 22, false),
  ('Traiguera', 'Castellón', 25, false),
  ('Jérica', 'Castellón', 25, false),
  ('La Pobla Tornesa', 'Castellón', 25, false),
  ('Alcalá de Xivert', 'Castellón', 28, false),
  ('Eslida', 'Castellón', 28, false),
  ('Altura', 'Castellón', 28, false),
  ('Peñíscola', 'Castellón', 30, true),
  ('Atzeneta del Maestrat', 'Castellón', 30, false)
on conflict (name) do update
  set province = excluded.province,
      distance_km = excluded.distance_km,
      is_beach = excluded.is_beach,
      is_active = true;

update public.service_cities
set is_active = false
where name not in (
  'Castellón', 'Villarreal', 'Benicássim', 'Almassora', 'Burriana', 'Betxí',
  'Oropesa', 'Torreblanca', 'Nules', 'Benlloc', 'Ribesalbes', 'Vall d''Uixó',
  'Cabanes', 'Onda', 'Traiguera', 'Jérica', 'La Pobla Tornesa',
  'Alcalá de Xivert', 'Eslida', 'Altura', 'Peñíscola', 'Atzeneta del Maestrat'
);

create table if not exists public.mobile_working_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  time_slot varchar(5) not null check (time_slot in ('10:00', '12:00', '14:00', '16:00')),
  max_repairs_per_slot smallint not null default 1 check (max_repairs_per_slot = 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (day_of_week, time_slot)
);

insert into public.mobile_working_hours (day_of_week, time_slot, max_repairs_per_slot) values
  (1,'10:00',1),(1,'14:00',1),(1,'16:00',1),
  (2,'10:00',1),(2,'14:00',1),(2,'16:00',1),
  (3,'10:00',1),(3,'14:00',1),(3,'16:00',1),
  (4,'10:00',1),(4,'14:00',1),(4,'16:00',1),
  (5,'10:00',1),(5,'14:00',1),(5,'16:00',1),
  (6,'10:00',1),(6,'12:00',1)
on conflict (day_of_week, time_slot) do nothing;

alter table public.mobile_working_hours drop constraint if exists mobile_working_hours_day_slot_valid;
alter table public.mobile_working_hours add constraint mobile_working_hours_day_slot_valid
  check (
    (day_of_week between 1 and 5 and time_slot in ('10:00', '14:00', '16:00'))
    or (day_of_week = 6 and time_slot in ('10:00', '12:00'))
  );

create table if not exists public.mobile_closed_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason varchar(200),
  created_at timestamptz not null default now()
);

create table if not exists public.mobile_unavailable_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot varchar(5) not null check (time_slot in ('10:00', '12:00', '14:00', '16:00')),
  reason varchar(200),
  created_at timestamptz not null default now(),
  unique (date, time_slot)
);

alter table public.profiles add column if not exists phone_number varchar(40);
alter table public.profiles add column if not exists primary_address varchar(255);
alter table public.profiles add column if not exists primary_city varchar(100) references public.service_cities(name);
update public.profiles set phone_number = phone where phone_number is null and phone is not null;
revoke update on public.profiles from anon, authenticated, public;
grant update (full_name, phone, phone_number, primary_address, primary_city) on public.profiles to authenticated;

alter table public.mobile_repairs add column if not exists phone_number varchar(40);
alter table public.mobile_repairs add column if not exists full_address varchar(255);
alter table public.mobile_repairs add column if not exists is_for_self boolean not null default true;
alter table public.mobile_repairs add column if not exists recipient_name varchar(200);
alter table public.mobile_repairs add column if not exists call_reminder_sent boolean not null default false;
update public.mobile_repairs
set phone_number = coalesce(phone_number, contact_phone),
    full_address = coalesce(full_address, address)
where phone_number is null or full_address is null;

create index if not exists mobile_repairs_booking_slot_idx
  on public.mobile_repairs (((visit_date at time zone 'Europe/Madrid')::date), time_slot)
  where service_type = 'mobile' and status <> 'cancelled';

alter table public.service_cities enable row level security;
alter table public.mobile_working_hours enable row level security;
alter table public.mobile_closed_days enable row level security;
alter table public.mobile_unavailable_slots enable row level security;

drop policy if exists "service cities active read" on public.service_cities;
create policy "service cities active read" on public.service_cities
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "service cities admin manage" on public.service_cities;
create policy "service cities admin manage" on public.service_cities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mobile working hours admin read" on public.mobile_working_hours;
create policy "mobile working hours admin read" on public.mobile_working_hours
  for select to authenticated using (public.is_admin());
drop policy if exists "mobile working hours admin manage" on public.mobile_working_hours;
create policy "mobile working hours admin manage" on public.mobile_working_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mobile closed days admin manage" on public.mobile_closed_days;
create policy "mobile closed days admin manage" on public.mobile_closed_days
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mobile unavailable slots admin manage" on public.mobile_unavailable_slots;
create policy "mobile unavailable slots admin manage" on public.mobile_unavailable_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.service_cities to anon, authenticated;
grant insert, update, delete on public.service_cities to authenticated;
grant select, insert, update, delete on public.mobile_working_hours to authenticated;
grant select, insert, update, delete on public.mobile_closed_days to authenticated;
grant select, insert, update, delete on public.mobile_unavailable_slots to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    nullif(new.raw_user_meta_data ->> 'phone_number', ''),
    nullif(new.raw_user_meta_data ->> 'phone_number', '')
  )
  on conflict (id) do update
    set phone_number = coalesce(public.profiles.phone_number, excluded.phone_number),
        phone = coalesce(public.profiles.phone, excluded.phone);
  return new;
end;
$$;

create or replace function public.get_mobile_available_slots(
  p_start_date date,
  p_end_date date
)
returns table (
  visit_date date,
  day_of_week smallint,
  time_slot varchar(5),
  remaining_capacity integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
begin
  if p_start_date is distinct from v_today or p_end_date is null or p_end_date < p_start_date or p_end_date > v_today + 14 then
    raise exception 'El calendario solo permite consultar los próximos 14 días.';
  end if;

  return query
  with dates as (
    select g::date as visit_day
    from generate_series(p_start_date::timestamp, p_end_date::timestamp, interval '1 day') g
  ), occupied as (
    select (r.visit_date at time zone 'Europe/Madrid')::date as visit_day,
           left(r.time_slot, 5) as slot,
           count(*)::integer as booked
    from public.mobile_repairs r
    where r.service_type = 'mobile'
      and r.status <> 'cancelled'
      and (r.visit_date at time zone 'Europe/Madrid')::date between p_start_date and p_end_date
    group by 1, 2
  )
  select d.visit_day, extract(dow from d.visit_day)::smallint, h.time_slot,
         greatest(h.max_repairs_per_slot - coalesce(o.booked, 0), 0)
  from dates d
  join public.mobile_working_hours h
    on h.day_of_week = extract(dow from d.visit_day)::smallint and h.is_active
  left join public.mobile_closed_days c on c.date = d.visit_day
  left join public.mobile_unavailable_slots u
    on u.date = d.visit_day and u.time_slot = h.time_slot
  left join occupied o on o.visit_day = d.visit_day and o.slot = h.time_slot
  where c.id is null
    and u.id is null
    and (d.visit_day > v_today or h.time_slot::time > (now() at time zone 'Europe/Madrid')::time)
    and h.max_repairs_per_slot > coalesce(o.booked, 0)
  order by d.visit_day, h.time_slot;
end;
$$;

revoke all on function public.get_mobile_available_slots(date, date) from public;
grant execute on function public.get_mobile_available_slots(date, date) to anon, authenticated;

drop function if exists public.book_mobile_repair(uuid, text, text, text, text, text, text, text, text, text);
create or replace function public.book_mobile_repair(
  p_city text,
  p_address text,
  p_zip_code text,
  p_visit_date date,
  p_time_slot text,
  p_device_brand text,
  p_device_model text,
  p_problem_description text,
  p_repair_type text,
  p_parts_quality text,
  p_contact_phone text,
  p_is_for_self boolean,
  p_recipient_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_day smallint;
  v_capacity integer;
  v_booked integer;
  v_base_price numeric(8,2);
  v_estimated_price numeric(8,2);
  v_repair_id uuid;
begin
  if v_user_id is null then raise exception 'Debes iniciar sesión para reservar.'; end if;
  if not exists (select 1 from public.service_cities c where c.name = p_city and c.is_active) then
    raise exception 'La ciudad no está disponible para el servicio móvil.';
  end if;
  if nullif(trim(p_address), '') is null or char_length(trim(p_address)) > 255 then
    raise exception 'Indica una dirección válida (sin número de piso o apartamento).';
  end if;
  if nullif(trim(p_device_brand), '') is null or nullif(trim(p_device_model), '') is null
     or nullif(trim(p_problem_description), '') is null or nullif(trim(p_contact_phone), '') is null then
    raise exception 'Completa todos los datos obligatorios.';
  end if;
  if not p_is_for_self and nullif(trim(p_recipient_name), '') is null then
    raise exception 'Indica el nombre de la persona que recibirá al técnico.';
  end if;
  if p_is_for_self is null then raise exception 'Indica quién recibirá al técnico.'; end if;
  if p_parts_quality is null or p_parts_quality not in ('original_oem', 'compatible_aaa') then
    raise exception 'La calidad de las piezas no es válida.';
  end if;
  if p_visit_date is null or p_visit_date < v_today or p_visit_date > v_today + 14 then
    raise exception 'Elige una fecha dentro de los próximos 14 días.';
  end if;
  if p_time_slot not in ('10:00', '12:00', '14:00', '16:00') then
    raise exception 'El horario seleccionado no es válido.';
  end if;

  v_day := extract(dow from p_visit_date)::smallint;
  select h.max_repairs_per_slot into v_capacity
  from public.mobile_working_hours h
  where h.day_of_week = v_day and h.time_slot = p_time_slot and h.is_active
  for update;
  if not found then raise exception 'Ese horario no está activo. Elige otro.'; end if;
  if exists (select 1 from public.mobile_closed_days c where c.date = p_visit_date)
     or exists (select 1 from public.mobile_unavailable_slots u where u.date = p_visit_date and u.time_slot = p_time_slot) then
    raise exception 'Ese día u horario acaba de cerrarse. Elige otro.';
  end if;
  if p_visit_date = v_today and p_time_slot::time <= (now() at time zone 'Europe/Madrid')::time then
    raise exception 'Ese horario ya pasó. Elige otro.';
  end if;
  select count(*)::integer into v_booked
  from public.mobile_repairs r
  where r.service_type = 'mobile'
    and r.status <> 'cancelled'
    and (r.visit_date at time zone 'Europe/Madrid')::date = p_visit_date
    and left(r.time_slot, 5) = p_time_slot;
  if v_booked >= v_capacity then raise exception 'Ese horario ya se ha reservado. Elige otro.'; end if;

  v_base_price := case lower(p_device_brand)
    when 'apple' then case p_repair_type when 'screen' then 120 when 'battery' then 75 when 'charging' then 65 when 'water' then 90 when 'software' then 55 when 'soldering' then 180 end
    when 'samsung' then case p_repair_type when 'screen' then 105 when 'battery' then 68 when 'charging' then 60 when 'water' then 82 when 'software' then 48 when 'soldering' then 165 end
    when 'xiaomi' then case p_repair_type when 'screen' then 88 when 'battery' then 55 when 'charging' then 52 when 'water' then 70 when 'software' then 40 when 'soldering' then 150 end
    when 'google' then case p_repair_type when 'screen' then 98 when 'battery' then 62 when 'charging' then 58 when 'water' then 76 when 'software' then 44 when 'soldering' then 160 end
    else case p_repair_type when 'screen' then 110 when 'battery' then 70 when 'charging' then 60 when 'water' then 80 when 'software' then 45 when 'soldering' then 170 end
  end;
  if v_base_price is null then raise exception 'El tipo de reparación no es válido.'; end if;
  v_estimated_price := round(
    (v_base_price * case when p_parts_quality = 'compatible_aaa' then 0.75 else 1 end
      + case when p_parts_quality = 'original_oem' then 15 else 0 end) + 30,
    2
  );

  insert into public.mobile_repairs (
    user_id, service_type, status, address, full_address, city, zip_code,
    contact_phone, phone_number, visit_date, time_slot, device_brand,
    device_model, problem_description, repair_type, parts_quality,
    estimated_price, is_for_self, recipient_name
  ) values (
    v_user_id, 'mobile', 'pending', trim(p_address), trim(p_address), p_city,
    nullif(trim(p_zip_code), ''), trim(p_contact_phone), trim(p_contact_phone),
    (p_visit_date + p_time_slot::time) at time zone 'Europe/Madrid',
    p_time_slot, trim(p_device_brand), trim(p_device_model),
    trim(p_problem_description), p_repair_type, p_parts_quality,
    v_estimated_price, p_is_for_self, case when p_is_for_self then null else trim(p_recipient_name) end
  )
  returning id into v_repair_id;

  update public.profiles
  set phone = trim(p_contact_phone), phone_number = trim(p_contact_phone),
      primary_address = trim(p_address), primary_city = p_city
  where id = v_user_id;

  return v_repair_id;
end;
$$;

revoke all on function public.book_mobile_repair(text, text, text, date, text, text, text, text, text, text, text, boolean, text) from public, anon;
grant execute on function public.book_mobile_repair(text, text, text, date, text, text, text, text, text, text, text, boolean, text) to authenticated;
