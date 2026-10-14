import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { isDemoMode } from '@/lib/supabase';

/** Mascot + two-tone wordmark, matching the logo: "ជាង" navy, "ម៉ូតូ" red. */
export function BrandBar() {
  const c = useColors();
  const t = useStrings();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 5,
          paddingLeft: 5,
          paddingRight: 16,
          borderRadius: Radius.pill,
          backgroundColor: c.card,
          boxShadow: `0 2px 10px ${c.shadow}`,
        }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          accessibilityIgnoresInvertColors
        />
        <Text style={{ fontSize: 19, fontWeight: '800' }}>
          <Text style={{ color: c.accent }}>ជាង</Text>
          <Text style={{ color: c.primary }}>ម៉ូតូ</Text>
        </Text>
      </View>
      {isDemoMode && (
        <View
          style={{
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: Radius.pill,
            backgroundColor: c.gold,
          }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#172033' }}>{t.demoData}</Text>
        </View>
      )}
    </View>
  );
}
