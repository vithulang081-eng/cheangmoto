-- Duplicate detection for the Add form: same phone number, or within 60 m of an existing shop.
create type public.duplicate_row as (
  id uuid, name text, status text, has_owner boolean, is_mine boolean, same_phone boolean, distance_m double precision
);

create or replace function public.find_duplicate_mechanic(
  p_phone text, p_lat double precision, p_lng double precision, p_exclude uuid default null
)
returns setof public.duplicate_row language sql stable security definer set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select
    m.id, m.name, m.status::text, (m.owner_id is not null),
    (m.owner_id is not null and m.owner_id = auth.uid()), (m.phone = p_phone),
    extensions.st_distance(m.location, origin.g)
  from public.mechanics m, origin
  where m.status <> 'rejected'
    and (p_exclude is null or m.id <> p_exclude)
    and (m.phone = p_phone or extensions.st_dwithin(m.location, origin.g, 60))
  order by (m.phone = p_phone) desc, extensions.st_distance(m.location, origin.g)
  limit 3;
$$;

grant execute on function public.find_duplicate_mechanic to anon, authenticated;
