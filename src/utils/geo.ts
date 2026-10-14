export type Coords = { latitude: number; longitude: number };

const EARTH_RADIUS_M = 6_371_000;

/** Straight-line distance in meters between two points (haversine). */
export function distanceMeters(a: Coords, b: Coords) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** "850 ម៉ែត្រ" under 1 km, "2.3 គ.ម" up to 10 km, "24 គ.ម" beyond. */
export function formatDistance(meters: number | null | undefined) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} ម៉ែត្រ`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} គ.ម`;
}

/** Rough bounding box of Cambodia, used to reject obviously wrong submissions. */
export function isInCambodia({ latitude, longitude }: Coords) {
  return latitude >= 9.9 && latitude <= 14.8 && longitude >= 102.2 && longitude <= 107.8;
}
