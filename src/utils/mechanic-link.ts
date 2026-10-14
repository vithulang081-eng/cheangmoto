import * as Linking from 'expo-linking';

/**
 * The URL encoded in a mechanic's QR code. `createURL` yields `cheangmoto://mechanic/<id>` in a
 * real build and an `exp://…` link in Expo Go, so codes always open in the app that made them.
 */
export function mechanicLink(id: string) {
  return Linking.createURL(`/mechanic/${id}`);
}

/** Reads a mechanic id out of scanned QR content; null when the code isn't ours. */
export function parseMechanicLink(data: string): string | null {
  const match = /mechanic\/([A-Za-z0-9_-]+)/.exec(data.trim());
  return match ? match[1] : null;
}
