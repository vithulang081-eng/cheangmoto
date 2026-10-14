import { router } from 'expo-router';
import { Pressable, type StyleProp, Text, View, type ViewStyle } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon } from '@/components/icon';
import { OpenBadge } from '@/components/open-badge';
import { ShopAvatar } from '@/components/shop-avatar';
import { serviceLabel } from '@/constants/services';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { useStrings } from '@/hooks/use-settings';
import type { Mechanic } from '@/lib/mechanics';
import { callPhone } from '@/utils/actions';
import { formatDistance } from '@/utils/geo';

type Props = {
  mechanic: Mechanic;
  onPress: () => void;
  /** Gold label above the name, e.g. "ជាងជិតបំផុត". */
  eyebrow?: string;
  /** Floating over the map: drop shadow instead of a border. */
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function MechanicCard({ mechanic: m, onPress, eyebrow, floating = false, style }: Props) {
  const c = useColors();
  const t = useStrings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(m.id);
  const distance = formatDistance(m.distance_m);

  return (
    <Pressable
      onPress={onPress}
      // A <button> can't nest the call/directions buttons on web; native keeps the role.
      accessibilityRole={process.env.EXPO_OS === 'web' ? undefined : 'button'}
      accessibilityLabel={[m.name, distance].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        {
          gap: Spacing.lg,
          padding: Spacing.lg,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: floating ? 0 : 1,
          borderColor: c.border,
          boxShadow: floating ? `0 6px 24px ${c.shadow}` : undefined,
          opacity: pressed ? 0.94 : 1,
        },
        style,
      ]}>
      <View style={{ gap: 6 }}>
        {eyebrow && (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: Radius.pill,
              backgroundColor: c.goldSoft,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.label }}>{eyebrow}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <ShopAvatar uri={m.photo_url} name={m.name} size={44} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 18, fontWeight: '700', color: c.label }}>
              {m.name}
            </Text>
            {m.is_verified && <Icon {...ICONS.verified} size={17} color={c.accent} />}
          </View>
          {distance && (
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.accent, fontVariant: ['tabular-nums'] }}>
              {distance}
            </Text>
          )}
          <Pressable
            onPress={() => toggleFavorite(m)}
            accessibilityRole="button"
            accessibilityLabel={saved ? t.saved : t.save}
            accessibilityState={{ selected: saved }}
            hitSlop={10}
            style={({ pressed }) => ({ padding: 2, opacity: pressed ? 0.6 : 1 })}>
            <Icon {...(saved ? ICONS.heartFill : ICONS.heart)} size={20} color={saved ? c.primary : c.tertiaryLabel} />
          </Pressable>
        </View>
        <OpenBadge {...m} showHours />
        {m.services.length > 0 && (
          <Text numberOfLines={1} style={{ fontSize: 14, color: c.secondaryLabel }}>
            {m.services.map((s) => serviceLabel(s, t)).join('  ·  ')}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <ActionButton
          label={t.call}
          icon={ICONS.phone}
          variant="primary"
          onPress={() => callPhone(m.phone)}
          style={{ flex: 1 }}
        />
        <ActionButton
          label={t.directions}
          icon={ICONS.directions}
          variant="secondary"
          onPress={() => router.push({ pathname: '/route/[id]', params: { id: m.id } })}
          style={{ flex: 1 }}
        />
      </View>
    </Pressable>
  );
}
