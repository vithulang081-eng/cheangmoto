import { Linking, Pressable, Text, View } from 'react-native';

import { ICONS, Icon } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';

/** Explains why results are centered on Phnom Penh, with a way to fix it. */
export function LocationBanner() {
  const c = useColors();
  const t = useStrings();
  const { status, refresh } = useUserLocation();
  if (status !== 'denied' && status !== 'unavailable') return null;

  const action =
    status === 'denied'
      ? { label: t.openSettings, onPress: () => Linking.openSettings() }
      : { label: t.retry, onPress: refresh };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        backgroundColor: c.goldSoft,
      }}>
      <Icon {...ICONS.warning} size={20} color={c.gold} />
      <Text style={{ flex: 1, fontSize: 14, color: c.label }}>
        {status === 'denied' ? t.locationDenied : t.locationUnavailable}
      </Text>
      <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.accent }}>{action.label}</Text>
      </Pressable>
    </View>
  );
}
