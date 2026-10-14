import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { finishLocationPick, getPendingPick } from '@/lib/location-pick';
import type { Coords } from '@/utils/geo';
import { formatCoords } from '@/utils/geocode';

const provider = process.env.EXPO_OS === 'android' ? PROVIDER_GOOGLE : undefined;
const PIN = { width: 46, height: 60 };

/**
 * Full-screen picker: the pin stays fixed in the middle and the map moves under it,
 * so the rider can line the pin up exactly on the shop front, then confirm.
 */
export function PickLocationScreen() {
  const c = useColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { coords: gps, status } = useUserLocation();
  const [initial] = useState<Coords>(() => getPendingPick()?.initial ?? gps);
  const [center, setCenter] = useState<Coords>(initial);
  const mapRef = useRef<MapView>(null);

  // Leaving without confirming resolves the request with null.
  useEffect(() => () => finishLocationPick(null), []);

  const confirm = () => {
    finishLocationPick(center);
    router.back();
  };

  const goToMe = () =>
    mapRef.current?.animateToRegion({ ...gps, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <MapView
        ref={mapRef}
        provider={provider}
        style={{ flex: 1 }}
        initialRegion={{ ...initial, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={(r) => setCenter({ latitude: r.latitude, longitude: r.longitude })}
      />

      {/* Fixed pin: its tip sits exactly on the map centre. */}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('@/assets/images/marker-selected.png')}
          style={{ ...PIN, transform: [{ translateY: -PIN.height / 2 }] }}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + Spacing.sm, left: Spacing.lg, right: Spacing.lg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            padding: Spacing.md,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            boxShadow: `0 4px 14px ${c.shadow}`,
          }}>
          <Icon {...ICONS.pin} size={20} color={c.primary} />
          <Text style={{ flex: 1, fontSize: 14, color: c.label }}>{t.pickLocationHint}</Text>
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: insets.bottom + Spacing.lg, gap: Spacing.md }}>
        <Pressable
          onPress={goToMe}
          disabled={status !== 'ready'}
          accessibilityRole="button"
          accessibilityLabel={t.useMyLocation}
          style={({ pressed }) => ({
            alignSelf: 'flex-end',
            width: 50,
            height: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.card,
            boxShadow: `0 4px 14px ${c.shadow}`,
            opacity: status !== 'ready' ? 0.5 : pressed ? 0.8 : 1,
          })}>
          <Icon {...ICONS.location} size={22} color={c.accent} />
        </Pressable>
        <View
          style={{
            gap: Spacing.md,
            padding: Spacing.lg,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            boxShadow: `0 6px 24px ${c.shadow}`,
          }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.secondaryLabel }}>{t.coordinates}</Text>
            <Text selectable style={{ fontSize: 17, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>
              {formatCoords(center)}
            </Text>
          </View>
          <ActionButton size="large" variant="primary" icon={ICONS.checkmark} label={t.confirmLocation} onPress={confirm} />
        </View>
      </View>
    </View>
  );
}
