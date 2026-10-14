import { type Coords, distanceMeters } from '@/utils/geo';

export type Route = {
  points: Coords[];
  /** Meters along the road. */
  distance_m: number;
  /** Seconds by motorbike/car, or null for the straight-line fallback. */
  duration_s: number | null;
  /** True when no road route was found and `points` is just the straight line. */
  isStraightLine: boolean;
};

// OSRM's public demo server: free, no key, OpenStreetMap roads (good on Cambodia's national roads).
// For production traffic host OSRM yourself or switch to Google Directions / Mapbox here.
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

/** Road route from the rider to the shop. Never throws: falls back to a straight line. */
export async function fetchRoute(from: Coords, to: Coords): Promise<Route> {
  const fallback: Route = {
    points: [from, to],
    distance_m: distanceMeters(from, to),
    duration_s: null,
    isStraightLine: true,
  };
  try {
    const url = `${OSRM}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return fallback;
    const json = (await response.json()) as {
      code: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = json.routes?.[0];
    if (json.code !== 'Ok' || !route) return fallback;
    return {
      points: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      distance_m: route.distance,
      duration_s: route.duration,
      isStraightLine: false,
    };
  } catch {
    return fallback;
  }
}

/** "៥ នាទី" / "១ ម៉ោង ១០ នាទី" style text comes from the caller; this returns {hours, minutes}. */
export function splitDuration(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
