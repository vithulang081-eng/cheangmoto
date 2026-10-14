import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Null when the env vars are missing — the app then runs on built-in demo data. */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          // Keeps riders signed in between launches (phone OTP session).
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isDemoMode = supabase === null;
