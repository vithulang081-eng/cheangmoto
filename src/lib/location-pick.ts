import { router } from 'expo-router';

import type { Coords } from '@/utils/geo';

type Pending = { initial: Coords; resolve: (coords: Coords | null) => void } | null;

let pending: Pending = null;

/**
 * Opens the full-screen map picker and resolves with the chosen point,
 * or null if the rider went back without confirming.
 */
export function requestLocationPick(initial: Coords) {
  return new Promise<Coords | null>((resolve) => {
    pending?.resolve(null);
    pending = { initial, resolve };
    router.push('/pick-location');
  });
}

export function getPendingPick() {
  return pending;
}

/** Called by the picker screen on confirm (coords) or when it closes (null). */
export function finishLocationPick(result: Coords | null) {
  const current = pending;
  pending = null;
  current?.resolve(result);
}
