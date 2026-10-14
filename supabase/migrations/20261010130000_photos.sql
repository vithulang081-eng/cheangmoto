-- Shop photos: one profile photo + up to 3 gallery photos, stored in the public "mechanic-photos" bucket.

alter table public.mechanics
  add column photo_url text,
  add column photos text[] not null default '{}';

alter type public.mechanic_row add attribute photo_url text;
alter type public.mechanic_row add attribute photos text[];

create or replace function public.nearby_mechanics(
  lat double precision, lng double precision, radius_km double precision default 30,
  service text default null, max_results integer default 50
)
returns setof public.mechanic_row language sql stable security invoker set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography as g
  )
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry), extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    extensions.st_distance(m.location, origin.g), m.photo_url, m.photos
  from public.mechanics m, origin
  where m.status = 'approved'
    and extensions.st_dwithin(m.location, origin.g, least(radius_km, 200) * 1000)
    and (service is null or service = any (m.services))
  order by extensions.st_distance(m.location, origin.g)
  limit least(greatest(max_results, 1), 100);
$$;

create or replace function public.get_mechanic(mechanic_id uuid)
returns setof public.mechanic_row language sql stable security invoker set search_path = '' as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry), extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision, m.photo_url, m.photos
  from public.mechanics m
  where m.id = mechanic_id and m.status = 'approved';
$$;

create or replace function public.pending_mechanics()
returns setof public.mechanic_row language sql stable security definer set search_path = '' as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry), extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision, m.photo_url, m.photos
  from public.mechanics m
  where m.status = 'pending' and public.is_admin()
  order by m.created_at;
$$;

drop function public.submit_mechanic(text, text, double precision, double precision, text[], text, time, time, boolean);

create function public.submit_mechanic(
  p_name text, p_phone text, p_lat double precision, p_lng double precision,
  p_services text[] default '{}', p_address text default null,
  p_opens_at time default null, p_closes_at time default null, p_open_24h boolean default false,
  p_photo_url text default null, p_photos text[] default '{}'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if p_lat not between 9.9 and 14.8 or p_lng not between 102.2 and 107.8 then
    raise exception 'Location must be inside Cambodia';
  end if;
  if coalesce(array_length(p_photos, 1), 0) > 3 then
    raise exception 'At most 3 photos';
  end if;

  insert into public.mechanics (
    name, phone, location, address, services, opens_at, closes_at, open_24h,
    status, is_verified, submitted_by, photo_url, photos
  ) values (
    trim(p_name), p_phone,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    nullif(trim(p_address), ''), coalesce(p_services, '{}'), p_opens_at, p_closes_at, coalesce(p_open_24h, false),
    'pending', false, auth.uid(), p_photo_url, coalesce(p_photos, '{}')
  )
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.submit_mechanic from public;
grant execute on function public.submit_mechanic to authenticated;

-- Storage: public bucket, 5 MB per image, uploads only by signed-in users into their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mechanic-photos', 'mechanic-photos', true, 5242880, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

create policy "Anyone can view mechanic photos"
  on storage.objects for select to public
  using (bucket_id = 'mechanic-photos');

create policy "Signed-in users upload into their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mechanic-photos' and (storage.foldername(name))[1] = auth.uid()::text);
