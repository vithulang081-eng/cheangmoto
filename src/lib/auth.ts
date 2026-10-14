import 'expo-sqlite/localStorage/install';

import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { toE164 } from '@/utils/phone';

export type AuthUser = {
  id: string;
  phone: string;
  /** Display name the rider chose; null until they set one. */
  name: string | null;
  /** Public URL (or local URI in demo mode) of the profile photo. */
  avatarUrl: string | null;
};

export type ProfilePatch = { name: string | null; avatarUrl: string | null };

/** Demo mode accepts this code for any number, so the flow can be tried without SMS. */
export const DEMO_OTP = '123456';
const DEMO_SESSION_KEY = 'cheangmoto.demo-user';

function toAuthUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as { display_name?: unknown; avatar_url?: unknown };
  return {
    id: user.id,
    // Supabase stores phones without the leading "+".
    phone: `+${(user.phone ?? '').replace(/^\+/, '')}`,
    name: typeof meta.display_name === 'string' && meta.display_name.trim() ? meta.display_name : null,
    avatarUrl: typeof meta.avatar_url === 'string' && meta.avatar_url ? meta.avatar_url : null,
  };
}

export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 60;

/** Sends a one-time code by SMS. */
export async function sendOtp(phone: string) {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
  if (error) throw error;
}

/** Checks the code. Resolves with the signed-in user, rejects if the code is wrong or expired. */
export async function verifyOtp(phone: string, code: string): Promise<AuthUser> {
  const e164 = toE164(phone);
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (code !== DEMO_OTP) throw new Error('invalid_code');
    const user: AuthUser = { id: `demo-${e164}`, phone: e164, name: null, avatarUrl: null };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return user;
  }
  const { data, error } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
  if (error || !data.user) throw error ?? new Error('invalid_code');
  return toAuthUser(data.user);
}

/** Saves the display name and photo URL on the account; resolves with the updated user. */
export async function updateProfile(current: AuthUser, patch: ProfilePatch): Promise<AuthUser> {
  const name = patch.name?.trim() || null;
  if (!supabase) {
    const user: AuthUser = { ...current, name, avatarUrl: patch.avatarUrl };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    return user;
  }
  const { data, error } = await supabase.auth.updateUser({ data: { display_name: name, avatar_url: patch.avatarUrl } });
  if (error || !data.user) throw error ?? new Error('profile_update_failed');
  return toAuthUser(data.user);
}

export async function signOut() {
  if (!supabase) {
    localStorage.removeItem(DEMO_SESSION_KEY);
    return;
  }
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) {
    const saved = localStorage.getItem(DEMO_SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<AuthUser>;
    return { id: parsed.id ?? '', phone: parsed.phone ?? '', name: parsed.name ?? null, avatarUrl: parsed.avatarUrl ?? null };
  }
  const { data } = await supabase.auth.getSession();
  return data.session ? toAuthUser(data.session.user) : null;
}

/** Calls back whenever Supabase signs the user in or out (token refresh, sign-out elsewhere). */
export function onAuthChange(callback: (user: AuthUser | null) => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

/** Whether the signed-in user may approve shops. Demo mode: yes, so the flow can be tried. */
export async function fetchIsAdmin(): Promise<boolean> {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}
