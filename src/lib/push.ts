import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Show notifications even while the app is open (a mechanic may be in the app when a rider asks for help).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission, gets this device's Expo push token and stores it for the signed-in user,
 * so the database trigger can push them when a rider sends a request.
 * Returns null wherever push isn't possible: demo mode, simulators, Expo Go on Android,
 * no EAS project id yet (`eas init`), or permission denied.
 */
export async function registerForPush(): Promise<string | null> {
  if (!supabase || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('requests', {
        name: 'សំណើពីអតិថិជន',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) return null;
    return token;
  } catch {
    return null;
  }
}

/** Fires with the notification's `data` when the user taps it. Returns an unsubscribe. */
export function onNotificationTap(callback: (data: Record<string, unknown>) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    callback((response.notification.request.content.data ?? {}) as Record<string, unknown>);
  });
  return () => subscription.remove();
}
