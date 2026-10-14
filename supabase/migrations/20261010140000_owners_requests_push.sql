-- Mechanics as users: a shop can be owned by the mechanic's account (edit it, get requests),
-- riders can send a help request to a shop, and the owner is pushed via Expo push notifications.

create extension if not exists pg_net with schema extensions;

alter table public.mechanics add column owner_id uuid references auth.users (id) on delete set null;
create index mechanics_owner_idx on public.mechanics (owner_id);

-- Rows now also carry status + owner flag so owners can see their pending shops.
alter type public.mechanic_row add attribute status text;
alter type public.mechanic_row add attribute is_owner boolean;
alter type public.mechanic_row add attribute has_owner boolean;

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
    extensions.st_distance(m.location, origin.g), m.photo_url, m.photos,
    m.status::text, (m.owner_id is not null and m.owner_id = auth.uid()), (m.owner_id is not null)
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
    null::double precision, m.photo_url, m.photos,
    m.status::text, (m.owner_id is not null and m.owner_id = auth.uid()), (m.owner_id is not null)
  from public.mechanics m
  where m.id = mechanic_id and m.status = 'approved';
$$;

create or replace function public.pending_mechanics()
returns setof public.mechanic_row language sql stable security definer set search_path = '' as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry), extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision, m.photo_url, m.photos,
    m.status::text, (m.owner_id is not null and m.owner_id = auth.uid()), (m.owner_id is not null)
  from public.mechanics m
  where m.status = 'pending' and public.is_admin()
  order by m.created_at;
$$;

-- Shops the signed-in mechanic owns, any status (so they can see "pending").
create or replace function public.my_mechanics()
returns setof public.mechanic_row language sql stable security definer set search_path = '' as $$
  select
    m.id, m.name, m.phone,
    extensions.st_y(m.location::extensions.geometry), extensions.st_x(m.location::extensions.geometry),
    m.address, m.province, m.services, m.opens_at, m.closes_at, m.open_24h, m.is_verified,
    null::double precision, m.photo_url, m.photos,
    m.status::text, true, true
  from public.mechanics m
  where m.owner_id = auth.uid() and m.status <> 'rejected'
  order by m.created_at desc;
$$;

drop function public.submit_mechanic(text, text, double precision, double precision, text[], text, time, time, boolean, text, text[]);

create function public.submit_mechanic(
  p_name text, p_phone text, p_lat double precision, p_lng double precision,
  p_services text[] default '{}', p_address text default null,
  p_opens_at time default null, p_closes_at time default null, p_open_24h boolean default false,
  p_photo_url text default null, p_photos text[] default '{}',
  p_is_owner boolean default false
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
    status, is_verified, submitted_by, photo_url, photos, owner_id
  ) values (
    trim(p_name), p_phone,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    nullif(trim(p_address), ''), coalesce(p_services, '{}'), p_opens_at, p_closes_at, coalesce(p_open_24h, false),
    'pending', false, auth.uid(), p_photo_url, coalesce(p_photos, '{}'),
    case when coalesce(p_is_owner, false) then auth.uid() end
  )
  returning id into new_id;
  return new_id;
end;
$$;

-- Owners (or admins) edit a shop. Status is kept, so an approved shop stays visible.
create or replace function public.update_my_mechanic(
  p_id uuid, p_name text, p_phone text, p_lat double precision, p_lng double precision,
  p_services text[] default '{}', p_address text default null,
  p_opens_at time default null, p_closes_at time default null, p_open_24h boolean default false,
  p_photo_url text default null, p_photos text[] default '{}'
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.mechanics where id = p_id and (owner_id = auth.uid() or public.is_admin())) then
    raise exception 'Not your shop' using errcode = '42501';
  end if;
  if p_lat not between 9.9 and 14.8 or p_lng not between 102.2 and 107.8 then
    raise exception 'Location must be inside Cambodia';
  end if;
  if coalesce(array_length(p_photos, 1), 0) > 3 then
    raise exception 'At most 3 photos';
  end if;
  update public.mechanics set
    name = trim(p_name), phone = p_phone,
    location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    address = nullif(trim(p_address), ''), services = coalesce(p_services, '{}'),
    opens_at = p_opens_at, closes_at = p_closes_at, open_24h = coalesce(p_open_24h, false),
    photo_url = p_photo_url, photos = coalesce(p_photos, '{}')
  where id = p_id;
end;
$$;

-- Push tokens (Expo). One row per device token.
create table public.push_tokens (
  user_id    uuid not null references auth.users (id) on delete cascade,
  token      text not null,
  platform   text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.push_tokens enable row level security;

create or replace function public.register_push_token(p_token text, p_platform text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (user_id, token) do update set updated_at = now(), platform = excluded.platform;
end;
$$;

-- Help requests from riders to a shop.
create type public.request_status as enum ('new', 'accepted', 'done', 'cancelled');

create table public.service_requests (
  id          uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.mechanics (id) on delete cascade,
  rider_id    uuid not null references auth.users (id) on delete cascade,
  rider_phone text,
  message     text check (char_length(message) <= 300),
  location    extensions.geography(point, 4326),
  status      public.request_status not null default 'new',
  created_at  timestamptz not null default now()
);
create index service_requests_mechanic_idx on public.service_requests (mechanic_id, created_at desc);
alter table public.service_requests enable row level security;

-- Realtime so the mechanic's inbox updates live (RLS below limits what each side receives).
alter publication supabase_realtime add table public.service_requests;

create policy "Riders see their own requests"
  on public.service_requests for select to authenticated
  using (rider_id = auth.uid());

create policy "Owners see requests for their shops"
  on public.service_requests for select to authenticated
  using (exists (select 1 from public.mechanics m where m.id = mechanic_id and m.owner_id = auth.uid()));

create type public.request_row as (
  id uuid, mechanic_id uuid, mechanic_name text, rider_phone text, message text,
  latitude double precision, longitude double precision, status text, created_at timestamptz
);

create or replace function public.create_service_request(
  p_mechanic_id uuid, p_message text default null,
  p_lat double precision default null, p_lng double precision default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.mechanics where id = p_mechanic_id and status = 'approved') then
    raise exception 'Unknown shop';
  end if;
  insert into public.service_requests (mechanic_id, rider_id, rider_phone, message, location)
  values (
    p_mechanic_id, auth.uid(), auth.jwt() ->> 'phone', nullif(trim(p_message), ''),
    case when p_lat is not null and p_lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography end
  )
  returning id into new_id;
  return new_id;
end;
$$;

-- Inbox for the mechanic: requests for every shop they own, newest first.
create or replace function public.my_requests()
returns setof public.request_row language sql stable security definer set search_path = '' as $$
  select
    r.id, r.mechanic_id, m.name, r.rider_phone, r.message,
    extensions.st_y(r.location::extensions.geometry), extensions.st_x(r.location::extensions.geometry),
    r.status::text, r.created_at
  from public.service_requests r
  join public.mechanics m on m.id = r.mechanic_id
  where m.owner_id = auth.uid()
  order by r.created_at desc
  limit 100;
$$;

create or replace function public.set_request_status(p_id uuid, p_status public.request_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.service_requests r join public.mechanics m on m.id = r.mechanic_id
    where r.id = p_id and (m.owner_id = auth.uid() or r.rider_id = auth.uid())
  ) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.service_requests set status = p_status where id = p_id;
end;
$$;

-- Push the owner when a request arrives (Expo push API via pg_net, fire-and-forget).
create or replace function public.notify_owner_of_request()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner uuid;
  shop text;
  tok record;
begin
  select owner_id, name into owner, shop from public.mechanics where id = new.mechanic_id;
  if owner is null then
    return new;
  end if;
  for tok in select token from public.push_tokens where user_id = owner loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := jsonb_build_object(
        'to', tok.token,
        'title', 'សំណើថ្មីពីអតិថិជន · ' || shop,
        'body', coalesce(new.message, 'អតិថិជនត្រូវការជំនួយ — ចុចដើម្បីមើល'),
        'sound', 'default',
        'data', jsonb_build_object('type', 'request', 'requestId', new.id, 'mechanicId', new.mechanic_id)
      ),
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end loop;
  return new;
end;
$$;

create trigger service_request_notify
  after insert on public.service_requests
  for each row execute function public.notify_owner_of_request();

revoke execute on function public.submit_mechanic from public;
revoke execute on function public.update_my_mechanic from public;
revoke execute on function public.my_mechanics from public;
revoke execute on function public.register_push_token from public;
revoke execute on function public.create_service_request from public;
revoke execute on function public.my_requests from public;
revoke execute on function public.set_request_status from public;
grant execute on function public.submit_mechanic to authenticated;
grant execute on function public.update_my_mechanic to authenticated;
grant execute on function public.my_mechanics to authenticated;
grant execute on function public.register_push_token to authenticated;
grant execute on function public.create_service_request to authenticated;
grant execute on function public.my_requests to authenticated;
grant execute on function public.set_request_status to authenticated;
