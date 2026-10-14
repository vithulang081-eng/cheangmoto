import * as Location from 'expo-location';

import type { Coords } from '@/utils/geo';

/**
 * Best-effort address for a point using the phone's own geocoder (no API key, free).
 * Returns e.g. "ផ្លូវ ២៧១, ទួលគោក, ភ្នំពេញ" or null when nothing useful comes back.
 */
export async function reverseGeocode(coords: Coords): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    const parts = [place.street ?? place.name, place.district ?? place.subregion, place.city ?? place.region];
    const unique = [...new Set(parts.filter((p): p is string => !!p && p.trim() !== ''))];
    return unique.length ? unique.join(', ') : null;
  } catch {
    return null;
  }
}

/** "11.55640, 104.92820" — 5 decimals ≈ 1 m, enough to find a shop front. */
export function formatCoords({ latitude, longitude }: Coords) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
