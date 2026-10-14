import { useEffect, useState } from 'react';

import type { ServiceId } from '@/constants/services';
import { SEARCH_RADIUS_KM } from '@/constants/theme';
import { useUserLocation } from '@/hooks/use-user-location';
import { fetchNearbyMechanics, type Mechanic, subscribeToMechanicChanges } from '@/lib/mechanics';

type Result = { key: string; data: Mechanic[]; error: unknown | null };

/** Mechanics around the rider, nearest first. Keeps old results visible while refreshing. */
export function useNearbyMechanics(service: ServiceId | null) {
  const location = useUserLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result>({ key: '', data: [], error: null });

  // Round to ~100 m so small GPS jitter doesn't trigger a new request.
  const lat = Math.round(location.coords.latitude * 1000) / 1000;
  const lng = Math.round(location.coords.longitude * 1000) / 1000;
  const isLocating = location.status === 'locating';
  const key = `${lat},${lng},${service},${reloadKey}`;

  useEffect(() => {
    if (isLocating) return;
    let cancelled = false;
    fetchNearbyMechanics({ latitude: lat, longitude: lng, radiusKm: SEARCH_RADIUS_KM, service })
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult((r) => ({ key, data: r.data, error })));
    return () => {
      cancelled = true;
    };
  }, [key, lat, lng, service, isLocating]);

  // Realtime: when a shop is approved, edited or removed in the database, search again.
  useEffect(() => subscribeToMechanicChanges(() => setReloadKey((k) => k + 1)), []);

  // "loading" until a response for the current query arrives.
  const status: 'loading' | 'error' | 'success' =
    isLocating || result.key !== key ? 'loading' : result.error ? 'error' : 'success';

  return {
    status,
    data: result.data,
    isLocating,
    /** Re-reads GPS, then searches again. */
    refresh: () => {
      location.refresh();
      setReloadKey((k) => k + 1);
    },
    /** Searches again at the same position (e.g. after a network error). */
    retry: () => setReloadKey((k) => k + 1),
  };
}
