import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICONS, Icon, type IconPair } from '@/components/icon';
import { LocationBanner } from '@/components/location-banner';
import { MapLayerPicker } from '@/components/map-layer-picker';
import { MechanicCard } from '@/components/mechanic-card';
import { MechanicMap } from '@/components/mechanic-map';
import { ServiceFilter } from '@/components/service-filter';
import { StateMessage } from '@/components/state-message';
import type { ServiceId } from '@/constants/services';
import { Radius, SEARCH_RADIUS_KM, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { useNearbyMechanics } from '@/hooks/use-nearby-mechanics';
import { useUserLocation } from '@/hooks/use-user-location';

import { BrandBar } from './brand-bar';

export function MapScreen() {
  const c = useColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { coords } = useUserLocation();
  const [service, setService] = useState<ServiceId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [centerKey, setCenterKey] = useState(0);
  const [layersOpen, setLayersOpen] = useState(false);
  const nearby = useNearbyMechanics(service);

  const selected = nearby.data.find((m) => m.id === selectedId) ?? null;
  const featured = selected ?? nearby.data[0] ?? null;
  // iOS draws the map under the tab bar; Android already insets the screen above it.
  const bottomOffset = process.env.EXPO_OS === 'ios' ? insets.bottom + 60 : Spacing.lg;

  const recenter = () => {
    setSelectedId(null);
    nearby.refresh();
    setCenterKey((k) => k + 1);
  };

  let bottomContent;
  if (featured) {
    bottomContent = (
      <MechanicCard
        floating
        mechanic={featured}
        eyebrow={selected ? t.selected : t.nearest}
        onPress={() => router.push({ pathname: '/mechanic/[id]', params: { id: featured.id } })}
      />
    );
  } else {
    bottomContent = (
      <View
        style={{
          padding: Spacing.lg,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          boxShadow: `0 6px 24px ${c.shadow}`,
        }}>
        {nearby.isLocating ? (
          <StateMessage loading title={t.findingLocation} />
        ) : nearby.status === 'loading' ? (
          <StateMessage loading title={t.loadingMechanics} />
        ) : nearby.status === 'error' ? (
          <StateMessage title={t.loadError} action={{ label: t.retry, onPress: nearby.retry }} />
        ) : (
          <StateMessage
            title={t.noneNearby(SEARCH_RADIUS_KM)}
            body={t.noneNearbyHint}
            action={{ label: t.tabAdd, onPress: () => router.navigate('/add') }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <MechanicMap
        mechanics={nearby.data}
        selectedId={selectedId}
        onSelect={setSelectedId}
        center={coords}
        centerKey={centerKey}
        padding={{ top: insets.top + 110, bottom: bottomOffset + 230 }}
      />

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + Spacing.sm, left: 0, right: 0, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.lg, gap: Spacing.sm }}>
          <BrandBar />
          <View style={{ flex: 1 }} />
          <RoundButton icon={ICONS.search} label={t.advancedSearch} onPress={() => router.push('/search')} />
          <RoundButton icon={ICONS.scan} label={t.scanQr} onPress={() => router.push('/scan')} />
        </View>
        <ServiceFilter
          floating
          value={service}
          onChange={(value) => {
            setService(value);
            setSelectedId(null);
          }}
        />
        <LocationBanner />
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: bottomOffset, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm }}>
          <RoundButton icon={ICONS.layers} label={t.mapLayers} onPress={() => setLayersOpen(true)} size={50} />
          <Pressable
            onPress={() => router.navigate('/add')}
            accessibilityRole="button"
            accessibilityLabel={t.tabAdd}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 50,
              paddingHorizontal: 18,
              borderRadius: 25,
              backgroundColor: c.primary,
              boxShadow: `0 4px 14px ${c.shadow}`,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Icon {...ICONS.add} size={20} color={c.onFill} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.onFill }}>{t.tabAdd}</Text>
          </Pressable>
          <Pressable
            onPress={recenter}
            accessibilityRole="button"
            accessibilityLabel={t.myLocation}
            style={({ pressed }) => ({
              width: 50,
              height: 50,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.card,
              boxShadow: `0 4px 14px ${c.shadow}`,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Icon {...ICONS.location} size={22} color={c.accent} />
          </Pressable>
        </View>
        {bottomContent}
      </View>

      <MapLayerPicker visible={layersOpen} onClose={() => setLayersOpen(false)} />
    </View>
  );
}

/** Floating circular toolbar button over the map (search, QR scan). */
function RoundButton({ icon, label, onPress, size = 46 }: { icon: IconPair; label: string; onPress: () => void; size?: number }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.card,
        boxShadow: `0 2px 10px ${c.shadow}`,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Icon {...icon} size={20} color={c.accent} />
    </Pressable>
  );
}
