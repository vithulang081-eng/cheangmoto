# Backend, database and server — CheangMoto

Supabase project: **jzhawmtkljryyufggpel** · URL `https://jzhawmtkljryyufggpel.supabase.co` · region Southeast Asia.
Dashboard: https://supabase.com/dashboard/project/jzhawmtkljryyufggpel

The app has no server of its own. Supabase gives us: Postgres (+PostGIS) as the database, PostgREST RPC as the API, Row Level Security as the authorization layer, Supabase Auth for phone-OTP sign-in, and Edge Functions for anything that needs code outside SQL.

## Schema (`supabase/migrations/20261010000000_init.sql`)

```
public.mechanics
  id            uuid pk
  name          text (2–80 chars)
  phone         text  '^0[0-9]{7,9}$'   -- local format, e.g. 012345678
  location      geography(point, 4326)  -- PostGIS; GiST index mechanics_location_idx
  address       text (≤160) | province text
  services      text[]   -- 'motorbike' | 'tire'
  opens_at / closes_at  time | open_24h boolean
  is_verified   boolean  -- paid/verified badge (admin sets)
  status        mechanic_status enum: pending | approved | rejected
  submitted_by  uuid → auth.users (who added it)
  created_at    timestamptz
```

Why geography + PostGIS: `st_dwithin`/`st_distance` give true meters on the globe and use the GiST index, so "nearest 50 shops within 30 km" is one indexed query even with 100k rows.

## RPC functions (what the app calls)

| Function | Called by | Who may call | Returns |
|---|---|---|---|
| `nearby_mechanics(lat, lng, radius_km=30, service=null, max_results=50)` | `fetchNearbyMechanics` | anon + authenticated | approved shops within radius, nearest first, with `distance_m` |
| `get_mechanic(mechanic_id)` | `fetchMechanic` (deep links) | anon + authenticated | one approved shop |
| `submit_mechanic(p_name, p_phone, p_lat, p_lng, p_services, p_address, p_opens_at, p_closes_at, p_open_24h)` | `submitMechanic` | **authenticated only** | new uuid; row is `pending`, `is_verified=false`, `submitted_by=auth.uid()`; rejects coordinates outside Cambodia |

All three return/accept the flat `mechanic_row` type (lat/lng as doubles) so the app never sees PostGIS types. `search_path = ''` and fully-qualified names (`extensions.st_…`, `public.…`) are deliberate — Supabase's security advisor flags functions without it.

## Security model

- RLS is **on**. The only policy: `select` where `status = 'approved'` for anon/authenticated. No insert/update/delete policies — writes happen only through `submit_mechanic` (security definer) so the app can never set `status`, `is_verified` or `submitted_by` itself.
- The app ships only the **publishable** key (`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). The secret/service-role key stays out of the repo and the app.
- Rate-limiting submissions (per user per day) is a TODO — do it inside `submit_mechanic` with a count on `submitted_by` + `created_at`.

## Admin approval (`supabase/migrations/20261010120000_admins_realtime.sql`)

- `public.admins (user_id)` — who may approve. `is_admin()` checks `auth.uid()` against it.
- `pending_mechanics()` — pending rows, oldest first; returns nothing for non-admins. `set_mechanic_status(id, 'approved' | 'rejected')` — admins only (raises `42501` otherwise).
- App side: `AuthProvider` calls `is_admin` once per sign-in and exposes `isAdmin`; the Account tab shows "ជាងរង់ចាំអនុម័ត" → `/admin` (`screens/admin-pending.tsx`) with Approve / Reject buttons. Demo mode treats the demo user as admin and lists shops added on the device.
- **Make someone an admin:** SQL Editor → `insert into public.admins (user_id) values ('<auth user id>');` (find the id under Authentication → Users). Admins so far: the test number's user `494c142b-…` and the owner's phone `081 578 115` (`360d91fd-…`).

## Everyday operations (dashboard)

- **Approve a submitted shop:** in the app (Account → ជាងរង់ចាំអនុម័ត) or Table Editor → `mechanics` → filter `status = pending` → set `status = approved`.
- **Run SQL:** SQL Editor → paste → Run. The SQL editor's Monaco model can be set from Playwright with `window.monaco.editor.getModels()[0].setValue(sql)` — that's how the schema was first applied.
- **Schema change:** write a new `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`, run it in the SQL Editor (or `supabase db push` once the CLI is linked), then update `src/lib/mechanics.ts` types/mappers and `seed.sql` + `demo-mechanics.ts` if columns changed.
- **Reset demo data:** `delete from public.mechanics where phone like '0120001%';` then re-run `supabase/seed.sql`.

## Auth (phone OTP)

- **Current state (2026-10-10):** Phone provider is ENABLED with Twilio selected but **placeholder credentials** (`AC000…` / `MG000…`), so real numbers cannot receive SMS yet. **Test numbers** registered under "Test Phone Numbers and OTPs": `85512000000=123456,85581578115=123456` (the second is the owner's own phone; both sign in with code `123456`), valid until 28 Dec 2026 — the dashboard requires a "valid until" date for test OTPs. Add more test pairs comma-separated.
- **To go live:** Authentication → Providers → Phone → replace the Twilio Account SID / Auth Token / Message Service SID with real ones (or switch provider to Vonage/MessageBird/Textlocal, or a Cambodian gateway via the **Send SMS auth hook** Edge Function). Nothing in the app changes.
- Phone numbers are stored in E.164 without "+" (`85512345678`). The app converts with `toE164()` in `utils/phone.ts` and shows `+855…` back.
- Session persistence uses the `localStorage` polyfill from `expo-sqlite`; `AuthProvider` reads it on launch and listens to `onAuthStateChange`.
- Email sign-in later: `signInWithOtp({ email })` or password; keep phone as the first option on the sign-in screen.

## When you need real server code (Edge Functions)

Use `supabase functions new <name>` for: SMS hook, push notifications when a submitted shop is approved, an SOS broadcast to nearby mechanics, or payment webhooks (KHQR/Bakong) for the Verified plan. Functions run Deno/TypeScript, get `SUPABASE_URL`/`SERVICE_ROLE_KEY` as env, and are called from the app with `supabase.functions.invoke('name', { body })`. Keep the heavy lifting in SQL (RPC) and use functions only for external APIs.

## Photos (`supabase/migrations/20261010130000_photos.sql`)

- Columns `photo_url text` (profile) and `photos text[]` (≤ 3 gallery) on `mechanics`; `mechanic_row` gained the same two attributes and all RPCs return them. `submit_mechanic` takes `p_photo_url` / `p_photos` and rejects more than 3.
- Storage bucket **`mechanic-photos`**: public read, 5 MB max, jpeg/png/webp. Signed-in users may upload only into `<their auth uid>/…` (policy checks `storage.foldername(name)[1]`).
- App: `lib/photos.ts` — `pickPhotos(limit)` / `takePhoto()` (expo-image-picker, quality 0.7) and `uploadPhoto(uri, userId)` → public URL (demo mode keeps the local URI). The Add form uploads first, then calls `submit_mechanic` with the URLs. Shown by `ShopAvatar` (card) and `PhotoStrip` (detail, admin queue).
- Cleanup of orphaned uploads (user picked photos but never submitted) is a TODO: a nightly Edge Function listing objects not referenced by any row.

## Mechanic accounts, requests and push (`…_owners_requests_push.sql`, `…_duplicates.sql`)

- `mechanics.owner_id` — the mechanic's auth user. Set when the Add form's "ខ្ញុំជាជាងម្ចាស់ហាងនេះ" switch is on (`submit_mechanic(p_is_owner)`). `mechanic_row` now also returns `status`, `is_owner`, `has_owner`.
- `my_mechanics()` (owner's shops, any status) and `update_my_mechanic(...)` (owner or admin; status unchanged) back the **Account → ហាងរបស់ខ្ញុំ** screen and `/edit/[id]` (same form in edit mode).
- `find_duplicate_mechanic(phone, lat, lng, exclude)` — same phone or within 60 m, pending rows included; the Add form calls it before sending and shows the "already exists / owned by another user" alert. Callable by guests.
- **Requests:** `service_requests` (rider → shop, message + rider location, status new/accepted/done/cancelled). `create_service_request` (signed-in riders, approved shops only), `my_requests()` (owner inbox), `set_request_status` (owner or rider). Realtime is on for the table; RLS: riders see their own, owners see their shops'.
- **Push:** `push_tokens` (per device, via `register_push_token` called by `AuthProvider` after sign-in — `lib/push.ts`, needs the EAS `projectId` in `app.json`, a real device, and a dev/store build on Android). Trigger `service_request_notify` calls the Expo Push API through `pg_net` for each of the owner's tokens; tapping the notification opens `/requests`. Inspect deliveries with `select * from net._http_response order by id desc limit 5;`.
- **Firebase (Android delivery):** Firebase project `cheangmoto-fb45d`, Android app `com.cheangmoto.app`; `google-services.json` lives at the repo root and is referenced by `android.googleServicesFile` in `app.json`. The FCM V1 service-account key is uploaded to EAS (`eas credentials -p android` → Google Service Account → FCM V1) for `@oonepower/cheangmoto`; never commit that key. Expo's push service then delivers Android pushes through FCM. Push only works in dev/store builds (`eas build -p android --profile development`), not Expo Go.
- **iOS delivery (APNs):** needs the App ID `com.cheangmoto.app` with the Push Notifications capability in the Apple developer account (team 226KZXFN8Y). Local `expo run:ios` auto-signing could not add it, so the local dev build strips `aps-environment`; use `eas build -p ios --profile development` (EAS registers the capability and APNs key) for iOS push. `eas.json` has development/preview/production profiles.
- The detail sheet shows **ស្នើជំនួយ** only when `has_owner` is true (someone will actually be notified), and **កែព័ត៌មានហាង** when `is_owner`.

## In-app route (no Google key, no cost)

`lib/routing.ts` calls the public OSRM demo server (`router.project-osrm.org`, OpenStreetMap roads) for a driving route and falls back to a straight dashed line if it fails or times out (8 s). `screens/route.tsx` draws it with `Polyline` on our own map, shows distance + time, and keeps a small "Google Maps" button for riders who want voice navigation. OSRM's demo server has no SLA — before real traffic, self-host OSRM (Cambodia extract) or point `fetchRoute` at Google Directions / Mapbox.

## Realtime (live)

`public.mechanics` is in the `supabase_realtime` publication (done in the admins migration). `subscribeToMechanicChanges()` in `lib/mechanics.ts` opens one channel on `postgres_changes` for the table, clears the detail cache and asks `useNearbyMechanics` to refetch — so when an admin approves a shop, every open map/list updates within a second or two without pull-to-refresh. RLS applies to realtime payloads: riders only receive events for approved rows. If you add more tables later, add them to the publication with `alter publication supabase_realtime add table public.<name>;`.
