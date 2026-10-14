<p align="center"><img src="assets/brand/logo-full.png" width="520" alt="ជាងម៉ូតូ CheangMoto"></p>

# ជាងម៉ូតូ · CheangMoto

Find the nearest motorbike mechanic anywhere in Cambodia, then **call** them or get **directions**, in one tap.
Built for riders who break down on a long trip and don't know where the nearest repair shop is.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **Expo SDK 57**, React Native 0.86, TypeScript | One codebase for Android + iOS. Runs in Expo Go. |
| Navigation | **Expo Router** (native tabs + form sheet) | File-based routes, native tab bar |
| Camera / QR | **expo-camera** (scan), **react-native-qrcode-svg** (generate) | Both run in Expo Go |
| Updates | **expo-updates** | "Check for updates" on the Account tab; needs an EAS project (`eas update:configure`) in store builds |
| Maps | **react-native-maps** with Google Maps (Android) / Apple Maps (iOS, Expo Go) | Works in Expo Go, Google provider in builds |
| Location | **expo-location** | GPS with a Phnom Penh fallback |
| Backend | **Supabase** (Postgres + **PostGIS** + RLS + RPC) | "Nearest shops" query runs in the database |
| Icons | SF Symbols (iOS) / Material Icons (Android) | Native look on each platform |

## Screens (UI design)

```
┌───────── Map (ផែនទី) ─────────┐  ┌──── Near me (ជិតខ្ញុំ) ────┐  ┌── Add (បន្ថែមជាង) ──┐
│ [logo ជាងម៉ូតូ]                │  │ ជាងនៅជិតខ្ញុំ               │  │ ឈ្មោះហាង [______]  │
│ (ទាំងអស់)(ប៉ះកង់)(ម៉ាស៊ីន)…   │  │ (ទាំងអស់)(ប៉ះកង់)…          │  │ លេខទូរស័ព្ទ [____] │
│        📍   📍                 │  │ ┌──────────────────────┐ │  │ សេវាកម្ម (chips)    │
│    📍     (you)    📍          │  │ │ ជាងម៉ូតូ សុខា ✓      │ │  │ ម៉ោងបើក / បិទ       │
│                         [◎]   │  │ │ 850 ម៉ែត្រ • កំពុងបើក  │ │  │ [ mini map + pin ]  │
│ ┌───────────────────────────┐ │  │ │ [📞 ហៅ]  [🧭 នាំផ្លូវ] │ │  │ [ ផ្ញើព័ត៌មាន ]      │
│ │ ជាងជិតបំផុត                 │ │  │ └──────────────────────┘ │  └─────────────────────┘
│ │ ជាងម៉ូតូ សុខា ✓  850 ម៉ែត្រ  │ │  │ ┌──────────────────────┐ │
│ │ [📞 ហៅ]      [🧭 នាំផ្លូវ]  │ │  │ │ …                    │ │   Tap any card →
│ └───────────────────────────┘ │  │                          │   detail sheet:
└────────────────────────────────┘  └──────────────────────────┘   call · directions · share · info
```

- **Colors:** from [the brand guide](assets/brand/BRAND-GUIDE.md): warm white / deep navy backgrounds, navy for navigation and selection, red for the main action (call, submit), gold only for small highlights. Light and dark palettes are in [`src/constants/theme.ts`](src/constants/theme.ts) (`useColors()`).
- **Markers:** red pin = open, gray = closed, large navy = selected.
- **Tabs:** Map · Near me · Add mechanic · Account. Sign-in opens as a modal: phone number, then a 6-digit SMS code (autofills from the SMS).
- **Home toolbar:** two round buttons next to the logo open **Advanced search** (text, service, open now, verified, radius, sort) and the **QR scanner**.
- **Mechanic sheet:** call · directions · **Telegram** chat · share · **QR code** (a card other riders scan to open the shop) · ♥ save.
- **Account tab:** profile hero, **Appearance** (tap a phone preview: automatic / light / dark), **Language** (flag stickers: ខ្មែរ / English), **Saved mechanics**, Tools (scan QR, advanced search), version + **Check for updates** (EAS Update), **Switch account** and **Sign out**. Settings and favourites are stored on the device and work without an account.
- **Loading:** a scooter rides along a progress line (Reanimated, UI thread; still under Reduce Motion) — see [`src/components/moto-loader.tsx`](src/components/moto-loader.tsx).
- **Text:** Khmer first, English optional. All copy is in [`src/constants/strings.ts`](src/constants/strings.ts); components read it with `useStrings()`.

## Project structure

```
src/
  app/                   routes only (Expo Router)
    _layout.tsx          root stack + location provider
    (tabs)/              Map · Near me · Add
    mechanic/[id].tsx    detail form sheet
    qr/[id].tsx          mechanic QR card (modal)
    scan.tsx             QR scanner (modal)
    search.tsx           advanced search (modal)
  screens/               screen bodies
  components/            card, map, chips, buttons, icons…
  hooks/                 use-user-location, use-nearby-mechanics, use-settings (language + theme), use-favorites
  lib/                   supabase client, mechanics API, demo data
  utils/                 distance, opening hours, phone, call/directions
supabase/
  migrations/            database schema
  seed.sql               13 demo shops
assets/brand/            logo source SVGs (icon, markers, wordmark)
```

## Database (Supabase)

`public.mechanics` table, with location stored as PostGIS `geography(point)` and a GiST index.

| Function (RPC) | Who | What it does |
|---|---|---|
| `nearby_mechanics(lat, lng, radius_km, service)` | anyone | Returns approved shops, nearest first |
| `get_mechanic(mechanic_id)` | anyone | Returns one approved shop |
| `submit_mechanic(...)` | anyone | Adds a new shop, always as **pending** (it doesn't appear until approved) |

Row-level security: anonymous users can only read `approved` rows. To approve a submitted shop, set `status = 'approved'` in Supabase's Table Editor.

## Run it

```bash
npm install
cp .env.example .env      # optional: leave empty to use built-in demo data
npx expo start            # scan the QR code with Expo Go
```

Without Supabase keys, the app runs on **demo data** (an orange "ទិន្នន័យសាកល្បង" badge shows this).
The live project is `jzhawmtkljryyufggpel` — schema and 13 demo shops are already applied there (2026-10-10).

A project skill for Claude Code lives in [`.claude/skills/cheangmoto/`](.claude/skills/cheangmoto/SKILL.md) (frontend, backend, database and server conventions). It loads automatically when you work in this repo.

### Connect Supabase
1. Create a project (region: **Southeast Asia (Singapore)**, the closest to Cambodia).
2. SQL Editor → run `supabase/migrations/20261010000000_init.sql`, then `supabase/seed.sql`.
3. Project Settings → API → copy the **Project URL** and the **publishable key** into `.env`.
4. Restart `npx expo start`.

### Phone sign-in (SMS code)
Riders can find and call mechanics **without an account**. Sign-in is only needed to add a mechanic.
- **Demo mode:** any Cambodian number works, and the code is **123456**.
- **With Supabase:** Authentication → Providers → enable **Phone**, then connect an SMS provider (Twilio, Vonage or MessageBird, or a local Cambodian SMS gateway through Supabase's *Send SMS hook*).
- Email sign-in comes later.

### Google Maps for real builds
Expo Go works without a key. For development and store builds, create keys in Google Cloud (Maps SDK for Android / iOS) and set `GOOGLE_MAPS_ANDROID_API_KEY` / `GOOGLE_MAPS_IOS_API_KEY` in `.env` or in EAS secrets.

## Next steps (v2)
- 🆘 SOS: broadcast the rider's location to nearby mechanics
- ⭐ Reviews and ratings
- 📶 Offline mode: save shops along a route before the trip
- 🔐 Mechanic accounts (Supabase Auth) and a "Verified" paid plan
- 🛡️ Admin approval screen and rate-limiting for submissions
