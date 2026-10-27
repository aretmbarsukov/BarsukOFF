-- Run in the Supabase SQL Editor to enable admin mobile-repair status changes.
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
  if p_status is null or p_status not in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') then
    raise exception 'El estado no es válido.';
  end if;

  update public.mobile_repairs
    set status = p_status
    where id = p_repair_id;
  if not found then
    raise exception 'No se encontró la solicitud.';
  end if;

  if p_status = 'cancelled' then
    update public.mobile_schedule
      set status = 'available', repair_id = null
      where repair_id = p_repair_id and status = 'booked';
  end if;
end;
$$;

revoke all on function public.admin_set_mobile_repair_status(uuid, text) from public, anon;
grant execute on function public.admin_set_mobile_repair_status(uuid, text) to authenticated;

notify pgrst, 'reload schema';
