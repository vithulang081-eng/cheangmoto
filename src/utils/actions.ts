import * as Haptics from 'expo-haptics';
import { Alert, Linking, Share } from 'react-native';

import { getStrings } from '@/hooks/use-settings';
import type { Coords } from '@/utils/geo';
import { normalizePhone, toE164 } from '@/utils/phone';

function tap() {
  if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function callPhone(phone: string) {
  tap();
  const url = `tel:${normalizePhone(phone)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(getStrings().cannotCall, phone);
  }
}

export function directionsUrl({ latitude, longitude }: Coords) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

/** Opens turn-by-turn directions in Google Maps (app if installed, otherwise browser). */
export function openDirections(coords: Coords) {
  tap();
  return Linking.openURL(directionsUrl(coords));
}

/**
 * Opens a Telegram chat with the shop's phone number — the app most Cambodian mechanics already use,
 * so riders can send a photo of the breakdown without the shop needing an account here.
 * Falls back to the t.me web link when the Telegram app isn't installed.
 */
export async function chatOnTelegram(phone: string) {
  tap();
  const intl = toE164(phone).replace('+', '');
  try {
    await Linking.openURL(`tg://resolve?phone=${intl}`);
  } catch {
    await Linking.openURL(`https://t.me/+${intl}`);
  }
}

export function shareMechanic(m: Coords & { name: string; phone: string }) {
  const link = `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`;
  return Share.share({ message: `${m.name}\n📞 ${m.phone}\n📍 ${link}` });
}
