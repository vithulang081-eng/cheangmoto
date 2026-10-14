-- CheangMoto v1 schema: motorbike mechanics with PostGIS locations.
-- Riders read approved shops without an account. Signed-in users (phone OTP) can submit a shop,
-- which waits as "pending" for review.

create extension if not exists postgis with schema extensions;

create type public.mechanic_status as enum ('pending', 'approved', 'rejected');

create table public.mechanics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  phone       text not null check (phone ~ '^0[0-9]{7,9}$'),
  location    extensions.geography(point, 4326) not null,
  address     text check (char_length(address) <= 160),
  province    text,
  services    text[] not null default '{}',
  opens_at    time,
  closes_at   time,
  open_24h    boolean not null default false,
  is_verified boolean not null default false,
  status      public.mechanic_status not null default 'pending',
  submitted_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index mechanics_location_idx on public.mechanics using gist (location);
create index mechanics_status_idx on public.mechanics (status);

-- RLS: the app only goes through the functions below; direct table reads see approved rows only.
alter table public.mechanics enable row level security;

create policy "Approved mechanics are public"
  on public.mechanics for select
  to anon, authenticated
  using (status = 'approved');

-- Shared row shape returned to the app.
create type public.mechanic_row as (
  id uuid, name text, phone text, latitude double precision, longitude double precision,
  address text, province text, services text[], opens_at time, closes_at time,
  open_24h boolean, is_verified boolean, distance_m double precision
);

-- Approved mechanics within radius_km of (lat, lng), nearest first.
create or replace function public.nearby_mechanics(
  lat double precision,
  lng double precision,
  radius_km double precision default 30,
  service text default null,
  max_results integer default 50
)
returns setof public.mechanic_row
language sql
stable
security invoker
set search_path = ''
as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography as g
  )
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry),
    extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    extensions.st_distance(m.location, origin.g)
  from public.mechanics m, origin
  where m.status = 'approved'
    and extensions.st_dwithin(m.location, origin.g, least(radius_km, 200) * 1000)
    and (service is null or service = any (m.services))
  order by extensions.st_distance(m.location, origin.g)
  limit least(greatest(max_results, 1), 100);
$$;

-- One approved mechanic by id (for deep links to the detail screen).
create or replace function public.get_mechanic(mechanic_id uuid)
returns setof public.mechanic_row
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry),
    extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision
  from public.mechanics m
  where m.id = mechanic_id and m.status = 'approved';
$$;

-- Signed-in riders submit new shops. Always stored as pending + unverified, whatever the caller sends.
create or replace function public.submit_mechanic(
  p_name text,
  p_phone text,
  p_lat double precision,
  p_lng double precision,
  p_services text[] default '{}',
  p_address text default null,
  p_opens_at time default null,
  p_closes_at time default null,
  p_open_24h boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;

  if p_lat not between 9.9 and 14.8 or p_lng not between 102.2 and 107.8 then
    raise exception 'Location must be inside Cambodia';
  end if;

  insert into public.mechanics (
    name, phone, location, address, services, opens_at, closes_at, open_24h, status, is_verified, submitted_by
  ) values (
    trim(p_name), p_phone,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    nullif(trim(p_address), ''),
    coalesce(p_services, '{}'), p_opens_at, p_closes_at, coalesce(p_open_24h, false),
    'pending', false, auth.uid()
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.submit_mechanic from public;
grant execute on function public.nearby_mechanics to anon, authenticated;
grant execute on function public.get_mechanic to anon, authenticated;
grant execute on function public.submit_mechanic to authenticated;
