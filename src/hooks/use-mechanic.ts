import { useEffect, useState } from 'react';

import { fetchMechanic, getCachedMechanic, type Mechanic } from '@/lib/mechanics';

export type MechanicState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; mechanic: Mechanic | null };

/** Uses the copy cached by the list/map when possible; otherwise fetches it (deep links, QR codes). */
export function useMechanic(id: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: MechanicState } | null>(null);
  const key = `${id}:${attempt}`;
  const cached = getCachedMechanic(id);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetchMechanic(id)
      .then((mechanic) => !cancelled && setResult({ key, state: { status: 'success', mechanic } }))
      .catch(() => !cancelled && setResult({ key, state: { status: 'error' } }));
    return () => {
      cancelled = true;
    };
  }, [id, key, cached]);

  const state: MechanicState = cached
    ? { status: 'success', mechanic: cached }
    : result?.key === key
      ? result.state
      : { status: 'loading' };

  return { state, retry: () => setAttempt((a) => a + 1) };
}
