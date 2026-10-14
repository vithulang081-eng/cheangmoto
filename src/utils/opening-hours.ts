export type OpenState = 'open' | 'closed' | 'open24h' | 'unknown';

type Hours = { opens_at: string | null; closes_at: string | null; open_24h: boolean };

/** Accepts "7:00", "07:00" or Postgres "07:00:00" and returns minutes since midnight. */
export function parseTime(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function getOpenState(hours: Hours, now = new Date()): OpenState {
  if (hours.open_24h) return 'open24h';
  const opens = parseTime(hours.opens_at);
  const closes = parseTime(hours.closes_at);
  if (opens == null || closes == null) return 'unknown';
  const current = now.getHours() * 60 + now.getMinutes();
  // Shops that close after midnight (e.g. 18:00–02:00) wrap around.
  const isOpen =
    opens <= closes ? current >= opens && current < closes : current >= opens || current < closes;
  return isOpen ? 'open' : 'closed';
}

/** "07:00–18:00" for display. */
export function formatHours(hours: Hours) {
  if (hours.open_24h) return null;
  const opens = hours.opens_at?.slice(0, 5);
  const closes = hours.closes_at?.slice(0, 5);
  return opens && closes ? `${opens}–${closes}` : null;
}
