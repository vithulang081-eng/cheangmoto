---
name: cheangmoto
description: How to build, change and run the ជាងម៉ូតូ (CheangMoto) app — the Cambodian motorbike-mechanic finder built with Expo SDK 57 + Expo Router, react-native-maps, and Supabase (Postgres + PostGIS, phone-OTP auth). Use this skill for ANY work in this repo — adding or restyling a screen, changing the mechanic data model, writing SQL or RPC functions, Supabase/RLS/auth setup, env keys, running on simulator, EAS builds — even when the request only says "the app", "the map", "the database" or "the backend". Read it before touching code so new work matches the existing conventions.
---

# ជាងម៉ូតូ · CheangMoto

A rider breaks down on a road in Cambodia, opens the app, sees the nearest mechanic and taps **ហៅ** (call) or **នាំផ្លូវ** (directions). Everything else is secondary to that 10-second flow, so keep the map and the call button fast, big and Khmer-first.

## Stack at a glance

| Layer | What | Where |
|---|---|---|
| App | Expo SDK 57, React Native 0.86, TypeScript, Expo Router (native tabs + form sheet), React Compiler on | `src/` |
| Maps / GPS | `react-native-maps` (Google on Android, Apple on iOS in Expo Go) + `expo-location` | `src/components/mechanic-map.tsx`, `src/hooks/use-user-location.tsx` |
| Backend | Supabase project `jzhawmtkljryyufggpel` — Postgres + PostGIS, RLS, three RPC functions, phone-OTP auth | `supabase/` |
| Storage | `expo-sqlite/localStorage/install` polyfill (auth session, demo sign-in) | `src/lib/supabase.ts`, `src/lib/auth.ts` |
| Brand | Mascot logo, navy/red/gold palette | `assets/brand/BRAND-GUIDE.md`, `src/constants/theme.ts` |

There is **no custom server**: the "backend" is Supabase. Business rules live in Postgres functions (`supabase/migrations/*.sql`), security in RLS. If something can't be expressed in SQL (SMS gateway, push, payments), it goes in a Supabase Edge Function — see `references/backend.md`.

## Commands

```bash
npx expo start                 # dev server; press i / a, or scan QR with Expo Go
npx tsc --noEmit               # typecheck   ─┐ run both before saying a task is done
npx expo lint                  # lint        ─┘
npx expo install <pkg>         # never npm install for RN/Expo packages
npx expo-doctor                # dependency/config sanity
```

Simulator tips (macOS): `xcrun simctl location booted set 11.5564,104.9282` puts the iPhone in Phnom Penh (default is San Francisco → "no mechanics within 30 km"). `xcrun simctl privacy booted grant location host.exp.Exponent` skips the permission dialog.

## Project layout (follow it, don't reorganize it)

```
src/
  app/            Expo Router routes ONLY. Each file = a screen; _layout.tsx = navigator.
    _layout.tsx     Root Stack + ThemeProvider + AuthProvider + LocationProvider
    (tabs)/         Map (index) · nearby · add · account  — each tab has its own Stack
    mechanic/[id]   Detail form sheet
    sign-in.tsx     Phone → SMS code modal
  screens/        Screen bodies (route files just render these)
  components/     Reusable UI: mechanic-card, action-button, chip, service-filter, icon, …
  hooks/          use-user-location, use-nearby-mechanics, use-auth
  lib/            supabase client, mechanics API, auth API, demo data
  utils/          geo (distance), opening-hours, phone, actions (call/directions/share)
  constants/      theme (colors/spacing), strings (ALL Khmer copy), services (shop types)
supabase/
  migrations/     Schema + RPC functions (the source of truth for the DB)
  seed.sql        13 demo shops (same rows as src/lib/demo-mechanics.ts)
assets/brand/     Logo sources + BRAND-GUIDE.md   assets/images/  icons, markers, tab icon
```

New screen = `src/screens/<name>.tsx` with the UI + a 4-line route file in `src/app/` that renders it. Never put components, hooks or types inside `src/app/`.

## Frontend conventions

**Khmer first, English second.** Every user-visible string lives in `src/constants/strings.ts` in both the `km` and `en` tables (same keys; `Strings` type). Components read them with `const t = useStrings()` from `@/hooks/use-settings`; code outside React (alerts in `utils/`) uses `getStrings()`. Never inline Khmer or English in a component, and add new keys to **both** languages or the typecheck fails. Khmer glyphs are tall — keep font sizes ≥ 14, never clip text, test long shop names with `numberOfLines`. iOS large-title headers don't draw Khmer, so tab stacks use the compact header.

**Settings.** `SettingsProvider` (root layout) stores the rider's language (`km`/`en`) and theme (`system`/`light`/`dark`) in localStorage; the Account tab exposes them. Theme is applied app-wide with `Appearance.setColorScheme`, and `useResolvedColorScheme()` is what `useColors()` reads.

**Colors.** Call `const c = useColors()` and use `c.accent` (navy: navigation, selection, trust), `c.primary` (red: the one main action on a screen — call, submit), `c.gold` / `c.goldSoft` (tiny highlights only, e.g. the "nearest" tag), `c.background` / `c.card` / `c.fill` / `c.border`, `c.label` / `c.secondaryLabel`. Light = warm white, dark = deep navy; both are defined in `theme.ts`. Don't add hex colors in components; add a token instead.

**Map pins.** Never use react-native-maps' `image` prop for markers — it renders nothing in Expo Go on iOS, which once shipped a map with zero shops on it. Use `ShopPin` (`components/shop-pin.tsx`): a view-drawn ring with the shop photo/initial (red open, grey closed, navy selected), `anchor` for Android + `centerOffset` for iOS, `tracksViewChanges` only while the photo loads, and a key that includes the selected state so it re-snapshots. `PinGlyph` is the map-free version for previews.

**Tab bar.** `NativeTabs`; the Map tab icon is the full-color round app logo (`assets/images/tab-logo.png`, `renderingMode="original"`), the other tabs use SF Symbols + Material (`md`) pairs. Regenerate `tab-logo*.png` from `icon.png` if the app icon changes.

**Components to reuse before writing new ones:** `ActionButton` (variants `primary` red / `secondary` soft navy / `plain`; has `loading`/`disabled`), `Chip`, `ServiceFilter`, `MechanicCard`, `OpenBadge`, `StateMessage` (loading/empty/error), `SignInPrompt`, `Icon` (SF Symbol on iOS + Material on Android — always give both `sf` and `md`; the shared set is `ICONS` in `components/icon.tsx`).

**Styling rules:** inline styles, `gap` over margins, `borderCurve: 'continuous'` on rounded corners, `boxShadow` (never `elevation`/`shadow*`), `contentInsetAdjustmentBehavior="automatic"` on every ScrollView/FlatList, `process.env.EXPO_OS` not `Platform.OS` for branching. Native tab bar = `NativeTabs`; headers = Stack with `headerLargeTitleEnabled`.

**Data states.** Every screen that loads data renders loading, error (with retry), empty and content. `useNearbyMechanics(service)` already returns `{ status, data, isLocating, refresh, retry }` — keep old data visible while refreshing (it does).

**Lint gotcha.** `react-hooks/set-state-in-effect` is on: don't call `setState` synchronously inside `useEffect`. Derive state from a `key` (see `use-nearby-mechanics.ts`) or set state inside the async callback.

## Data flow

```
useUserLocation()  → coords (GPS, Phnom Penh fallback) + status
useNearbyMechanics(service) → fetchNearbyMechanics() → supabase.rpc('nearby_mechanics') ─┐
                                                        or DEMO_MECHANICS when no env keys ┘
MechanicCard / Map markers → router.push('/mechanic/[id]') → getCachedMechanic(id) (no refetch)
Add form → submitMechanic() → supabase.rpc('submit_mechanic')  (status = pending until approved)
```

**Rider → mechanic actions** live in `src/utils/actions.ts`: `callPhone` (tel:), `chatOnTelegram`, `shareMechanic`, plus `openDirections` (Google Maps URL — only a secondary button now). **"នាំផ្លូវ" opens the in-app route screen `/route/[id]`** (`screens/route.tsx`, OSRM road route drawn on our map) — the user explicitly wants everything inside the app, so never make an external app the primary path. Adding a shop: **`/pick-location`** full-screen picker (fixed centre pin, confirm → lat/lng; `lib/location-pick.ts` hands the result back) and `lib/photos.ts` for the profile + up to 3 gallery photos. `chatOnTelegram` (tg:// deep link with t.me fallback, because mechanics already use Telegram and don't need an account in this app), `shareMechanic`. In-app chat is a later feature: it only makes sense once mechanics sign in and claim their shop; until then keep Telegram as the chat path.

`src/lib/mechanics.ts` is the only place that talks to the database. `isDemoMode` (from `lib/supabase.ts`) is true when `EXPO_PUBLIC_SUPABASE_URL`/`_PUBLISHABLE_KEY` are missing — the app then runs on `demo-mechanics.ts` and shows the orange "ទិន្នន័យសាកល្បង" badge. Keep demo mode working: it's how screens get built and screenshotted without a backend.

**Shop types** are only two: `motorbike` (ជាងម៉ូតូ) and `tire` (ជាងកង់) — `src/constants/services.ts`. The `services text[]` column holds them. Don't add types without updating `SERVICES`, demo data, and `seed.sql` together.

## Two kinds of users

Riders (search, call, route, request help) and **mechanics** (own a shop via the "I am the owner" switch when adding it, edit it from Account → ហាងរបស់ខ្ញុំ, receive push notifications + an inbox at `/requests` when a rider taps ស្នើជំនួយ). The Add form is open to everyone — it only asks for sign-in at the moment of sending, keeps the draft, and refuses duplicates (same phone or same spot) with an alert that says who owns the existing shop. Details in `references/backend.md`.

## Auth

Phone number + 6-digit SMS code (Supabase `signInWithOtp({ phone })` / `verifyOtp`). Riders never need to sign in to search or call; sign-in is only required to add a mechanic (`SignInPrompt` gates the Add tab; the DB function also checks `auth.uid()`). Demo mode accepts code `123456`. Email sign-in is planned later — add it alongside, don't replace phone. Full flow: `src/lib/auth.ts`, `src/hooks/use-auth.tsx`, `src/screens/sign-in/`.

Real SMS needs **Authentication → Providers → Phone** enabled in Supabase plus an SMS provider (Twilio/Vonage/MessageBird, or a Cambodian gateway through the "Send SMS" auth hook). Until then the app works in demo mode.

## Database and backend

Schema, the three RPC functions, RLS policies, how to approve a submitted shop, and the Supabase dashboard workflow are in **`references/backend.md`** — read it before writing SQL or changing `lib/mechanics.ts`. Short version: `public.mechanics` with a PostGIS `geography(point)` column; `nearby_mechanics(lat, lng, radius_km, service)` returns approved shops nearest-first; `get_mechanic(id)`; `submit_mechanic(...)` inserts as `pending` for signed-in users. Any schema change = a new file in `supabase/migrations/` (timestamped) + matching TypeScript in `lib/mechanics.ts` + seed update.

## Environment and secrets

`.env` (git-ignored, copy from `.env.example`):
```
EXPO_PUBLIC_SUPABASE_URL=https://jzhawmtkljryyufggpel.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
GOOGLE_MAPS_ANDROID_API_KEY= / GOOGLE_MAPS_IOS_API_KEY=   (only for dev/store builds, not Expo Go)
```
Only `EXPO_PUBLIC_*` values are bundled into the app. Never put the Supabase secret/service-role key in the app. Restart `npx expo start` after editing `.env`.

## Shipping

Expo Go works today (Apple Maps on iOS). For Google Maps on iOS, push notifications or store builds use EAS: `eas build --profile development` (dev client) → `eas build --profile production` → `eas submit`. Android first (most riders in Cambodia are on Android). Load the `expo:eas-app-stores` skill for the release steps.

## Done means

Typecheck + lint pass, the screen works in demo mode AND with Supabase keys, loading/empty/error states exist, all copy is in `strings.ts` in both languages, it looks right in light and dark, and you ran it in the simulator (or asked the user to check on a phone) — Khmer layout issues only show up on screen.

Heads-up: more than one Claude session sometimes edits this repo at the same time. If files change under you or `t` imports break, pause, re-read, and build on the newer version rather than reverting it.
