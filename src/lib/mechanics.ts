import type { RealtimeChannel } from '@supabase/supabase-js';

import type { ServiceId } from '@/constants/services';
import { DEMO_MECHANICS } from '@/lib/demo-mechanics';
import { supabase } from '@/lib/supabase';
import { type Coords, distanceMeters } from '@/utils/geo';
import { normalizePhone } from '@/utils/phone';

export type Mechanic = {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  address: string | null;
  province: string | null;
  services: string[];
  /** "HH:MM" or "HH:MM:SS" (Postgres `time`), null when unknown. */
  opens_at: string | null;
  closes_at: string | null;
  open_24h: boolean;
  is_verified: boolean;
  /** Present on search results only. */
  distance_m?: number | null;
  /** Public URL of the shop's profile photo. */
  photo_url: string | null;
  /** Up to 3 public URLs: shop front, entrance, nearby landmarks. */
  photos: string[];
  /** 'pending' | 'approved' | 'rejected' — only `my_mechanics` returns non-approved rows. */
  status?: string;
  /** True when the signed-in user owns this shop (can edit it, receives requests). */
  is_owner?: boolean;
  /** True when some mechanic account owns it, so "request help" can reach a person. */
  has_owner?: boolean;
};

export type NearbyQuery = Coords & { radiusKm: number; service: ServiceId | null };

export type NewMechanic = Coords & {
  name: string;
  phone: string;
  address: string;
  services: ServiceId[];
  opens_at: string | null;
  closes_at: string | null;
  open_24h: boolean;
  photo_url: string | null;
  photos: string[];
  /** The person adding the shop is the mechanic: they own it (edit + requests). */
  is_owner: boolean;
};

// Results are remembered so the detail sheet opens instantly without another request.
const cache = new Map<string, Mechanic>();
const demoSubmissions: Mechanic[] = [];

export function getCachedMechanic(id: string) {
  return cache.get(id);
}

export async function fetchNearbyMechanics(q: NearbyQuery): Promise<Mechanic[]> {
  let rows: Mechanic[];
  if (supabase) {
    const { data, error } = await supabase.rpc('nearby_mechanics', {
      lat: q.latitude,
      lng: q.longitude,
      radius_km: q.radiusKm,
      service: q.service,
    });
    if (error) throw error;
    rows = (data ?? []) as Mechanic[];
  } else {
    rows = [...DEMO_MECHANICS, ...demoSubmissions]
      .map((m) => ({ ...m, distance_m: distanceMeters(q, m) }))
      .filter((m) => m.distance_m <= q.radiusKm * 1000)
      .filter((m) => !q.service || m.services.includes(q.service))
      .sort((a, b) => a.distance_m - b.distance_m);
  }
  rows.forEach((m) => cache.set(m.id, m));
  return rows;
}

export async function fetchMechanic(id: string): Promise<Mechanic | null> {
  const cached = cache.get(id);
  if (cached) return cached;
  if (!supabase) return DEMO_MECHANICS.find((m) => m.id === id) ?? null;

  const { data, error } = await supabase.rpc('get_mechanic', { mechanic_id: id });
  if (error) throw error;
  const mechanic = ((data ?? []) as Mechanic[])[0] ?? null;
  if (mechanic) cache.set(id, mechanic);
  return mechanic;
}

/** New shops are saved as "pending" and only appear after an admin approves them. */
export async function submitMechanic(input: NewMechanic): Promise<void> {
  const phone = normalizePhone(input.phone);
  if (!supabase) {
    // Demo mode: show it immediately on this device so the flow can be tried end to end.
    demoSubmissions.push({
      id: `local-${Date.now()}`,
      name: input.name,
      phone,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      province: null,
      services: input.services,
      opens_at: input.opens_at,
      closes_at: input.closes_at,
      open_24h: input.open_24h,
      is_verified: false,
      photo_url: input.photo_url,
      photos: input.photos,
      status: 'pending',
      is_owner: input.is_owner,
      has_owner: input.is_owner,
    });
    return;
  }
  const { error } = await supabase.rpc('submit_mechanic', {
    p_name: input.name,
    p_phone: phone,
    p_lat: input.latitude,
    p_lng: input.longitude,
    p_services: input.services,
    p_address: input.address || null,
    p_opens_at: input.open_24h ? null : input.opens_at,
    p_closes_at: input.open_24h ? null : input.closes_at,
    p_open_24h: input.open_24h,
    p_photo_url: input.photo_url,
    p_photos: input.photos,
    p_is_owner: input.is_owner,
  });
  if (error) throw error;
}

/* ---------- mechanic's own shops ---------- */

/** Shops owned by the signed-in mechanic, including ones still pending approval. */
export async function fetchMyMechanics(): Promise<Mechanic[]> {
  if (!supabase) return [...DEMO_MECHANICS, ...demoSubmissions].filter((m) => m.is_owner);
  const { data, error } = await supabase.rpc('my_mechanics');
  if (error) throw error;
  const rows = (data ?? []) as Mechanic[];
  rows.forEach((m) => cache.set(m.id, m));
  return rows;
}

export async function fetchMyMechanic(id: string): Promise<Mechanic | null> {
  return (await fetchMyMechanics()).find((m) => m.id === id) ?? null;
}

/** Owner (or admin) edits a shop; approval status is unchanged. */
export async function updateMyMechanic(id: string, input: Omit<NewMechanic, 'is_owner'>): Promise<void> {
  const phone = normalizePhone(input.phone);
  if (!supabase) {
    const target = [...DEMO_MECHANICS, ...demoSubmissions].find((m) => m.id === id);
    if (target) {
      Object.assign(target, {
        name: input.name,
        phone,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address || null,
        services: input.services,
        opens_at: input.opens_at,
        closes_at: input.closes_at,
        open_24h: input.open_24h,
        photo_url: input.photo_url,
        photos: input.photos,
      });
    }
    cache.delete(id);
    return;
  }
  const { error } = await supabase.rpc('update_my_mechanic', {
    p_id: id,
    p_name: input.name,
    p_phone: phone,
    p_lat: input.latitude,
    p_lng: input.longitude,
    p_services: input.services,
    p_address: input.address || null,
    p_opens_at: input.open_24h ? null : input.opens_at,
    p_closes_at: input.open_24h ? null : input.closes_at,
    p_open_24h: input.open_24h,
    p_photo_url: input.photo_url,
    p_photos: input.photos,
  });
  if (error) throw error;
  cache.delete(id);
}

/* ---------- admin approval ---------- */

/** Shops waiting for review. Returns [] for non-admins (the database checks). Demo mode: shops added on this device. */
export async function fetchPendingMechanics(): Promise<Mechanic[]> {
  if (!supabase) return [...demoSubmissions];
  const { data, error } = await supabase.rpc('pending_mechanics');
  if (error) throw error;
  return (data ?? []) as Mechanic[];
}

export async function setMechanicStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  if (!supabase) {
    const index = demoSubmissions.findIndex((m) => m.id === id);
    if (index >= 0) {
      const [m] = demoSubmissions.splice(index, 1);
      if (status === 'approved') DEMO_MECHANICS.push(m);
    }
    return;
  }
  const { error } = await supabase.rpc('set_mechanic_status', { mechanic_id: id, new_status: status });
  if (error) throw error;
}

/* ---------- realtime ---------- */

/**
 * Calls `onChange` whenever a shop row changes (e.g. an admin approves one), so lists can refetch.
 * RLS applies to realtime too: riders only receive events for approved rows. Returns an unsubscribe.
 */
const changeListeners = new Set<() => void>();
let changeChannel: RealtimeChannel | null = null;

export function subscribeToMechanicChanges(onChange: () => void) {
  const client = supabase;
  if (!client) return () => {};
  changeListeners.add(onChange);
  // One websocket channel shared by every screen: supabase-js reuses a channel by name,
  // and adding callbacks after subscribe() throws.
  if (!changeChannel) {
    changeChannel = client
      .channel('mechanics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mechanics' }, () => {
        cache.clear();
        changeListeners.forEach((listener) => listener());
      })
      .subscribe();
  }
  return () => {
    changeListeners.delete(onChange);
    if (changeListeners.size === 0 && changeChannel) {
      client.removeChannel(changeChannel);
      changeChannel = null;
    }
  };
}

/* ---------- duplicate check (Add form) ---------- */

export type DuplicateMatch = {
  id: string;
  name: string;
  status: string;
  has_owner: boolean;
  is_mine: boolean;
  same_phone: boolean;
  distance_m: number;
};

/** The closest existing shop with the same phone number or within ~60 m, or null. */
export async function findDuplicateMechanic(
  phone: string,
  coords: Coords,
  excludeId?: string
): Promise<DuplicateMatch | null> {
  const normalized = normalizePhone(phone);
  if (!supabase) {
    const match = [...DEMO_MECHANICS, ...demoSubmissions]
      .filter((m) => m.id !== excludeId)
      .map((m) => ({ m, distance_m: distanceMeters(coords, m) }))
      .find(({ m, distance_m }) => m.phone === normalized || distance_m <= 60);
    if (!match) return null;
    return {
      id: match.m.id,
      name: match.m.name,
      status: match.m.status ?? 'approved',
      has_owner: !!match.m.has_owner,
      is_mine: !!match.m.is_owner,
      same_phone: match.m.phone === normalized,
      distance_m: match.distance_m,
    };
  }
  const { data, error } = await supabase.rpc('find_duplicate_mechanic', {
    p_phone: normalized,
    p_lat: coords.latitude,
    p_lng: coords.longitude,
    p_exclude: excludeId ?? null,
  });
  if (error) throw error;
  return ((data ?? []) as DuplicateMatch[])[0] ?? null;
}
