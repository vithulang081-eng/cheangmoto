-- Admin approval + realtime.
-- Admins (rows in public.admins) can list pending shops and approve/reject them from the app.
-- Realtime on public.mechanics lets riders' lists refresh the moment a shop is approved.

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "Users can see whether they are an admin"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Shops waiting for review, oldest first. Empty for non-admins.
create or replace function public.pending_mechanics()
returns setof public.mechanic_row
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry),
    extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision
  from public.mechanics m
  where m.status = 'pending' and public.is_admin()
  order by m.created_at;
$$;

create or replace function public.set_mechanic_status(mechanic_id uuid, new_status public.mechanic_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.mechanics set status = new_status where id = mechanic_id;
end;
$$;

revoke execute on function public.is_admin from public;
revoke execute on function public.pending_mechanics from public;
revoke execute on function public.set_mechanic_status from public;
grant execute on function public.is_admin to authenticated;
grant execute on function public.pending_mechanics to authenticated;
grant execute on function public.set_mechanic_status to authenticated;

-- Realtime: broadcast row changes (RLS still applies, so riders only receive approved rows).
alter publication supabase_realtime add table public.mechanics;
