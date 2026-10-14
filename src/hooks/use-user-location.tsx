import * as Location from 'expo-location';
import { createContext, type ReactNode, use, useCallback, useEffect, useState } from 'react';

import { DEFAULT_COORDS } from '@/constants/theme';
import type { Coords } from '@/utils/geo';

/**
 * locating    – waiting for the first GPS fix (or a refresh)
 * ready       – coords are the rider's real position
 * denied      – no permission; coords fall back to Phnom Penh
 * unavailable – GPS off or failed; coords fall back to Phnom Penh
 */
export type LocationStatus = 'locating' | 'ready' | 'denied' | 'unavailable';

type LocationValue = { coords: Coords; status: LocationStatus; refresh: () => void };

const LocationContext = createContext<LocationValue | null>(null);

function toCoords(location: Location.LocationObject): Coords {
  return { latitude: location.coords.latitude, longitude: location.coords.longitude };
}

/** Asks for permission, reports a quick cached fix first, then a fresh one. */
async function findPosition(onUpdate: (coords: Coords | null, status: LocationStatus) => void) {
  let hasFix = false;
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return onUpdate(null, 'denied');
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    if (last) {
      hasFix = true;
      onUpdate(toCoords(last), 'ready');
    }
    const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    onUpdate(toCoords(fresh), 'ready');
  } catch {
    if (!hasFix) onUpdate(null, 'unavailable');
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [status, setStatus] = useState<LocationStatus>('locating');

  const onUpdate = useCallback((next: Coords | null, nextStatus: LocationStatus) => {
    if (next) setCoords(next);
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    findPosition(onUpdate);
  }, [onUpdate]);

  const refresh = () => {
    setStatus('locating');
    findPosition(onUpdate);
  };

  return <LocationContext value={{ coords, status, refresh }}>{children}</LocationContext>;
}

export function useUserLocation() {
  const value = use(LocationContext);
  if (!value) throw new Error('useUserLocation must be used inside <LocationProvider>');
  return value;
}
