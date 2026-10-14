import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ICONS, Icon } from '@/components/icon';
import { LocationBanner } from '@/components/location-banner';
import { MechanicCard } from '@/components/mechanic-card';
import { ServiceFilter } from '@/components/service-filter';
import { StateMessage } from '@/components/state-message';
import type { ServiceId } from '@/constants/services';
import { SEARCH_RADIUS_KM, Spacing, useColors } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { useNearbyMechanics } from '@/hooks/use-nearby-mechanics';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { distanceMeters } from '@/utils/geo';

export function NearbyScreen() {
  const c = useColors();
  const t = useStrings();
  const [service, setService] = useState<ServiceId | null>(null);
  // "nearby" = live search around the rider; "saved" = the ♥ list kept on the device.
  const [mode, setMode] = useState<'nearby' | 'saved'>('nearby');
  const nearby = useNearbyMechanics(service);
  const { favorites } = useFavorites();
  const { coords, status: locationStatus } = useUserLocation();
  const isFirstLoad = nearby.data.length === 0 && (nearby.isLocating || nearby.status === 'loading');

  const saved = favorites
    .filter((m) => !service || m.services.includes(service))
    .map((m) => ({ ...m, distance_m: locationStatus === 'ready' ? distanceMeters(coords, m) : null }))
    .sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));
  const data = mode === 'saved' ? saved : nearby.data;

  let empty;
  if (mode === 'saved') {
    empty = <StateMessage title={t.noFavorites} body={t.noFavoritesHint} />;
  } else if (isFirstLoad) {
    empty = <StateMessage loading title={nearby.isLocating ? t.findingLocation : t.loadingMechanics} />;
  } else if (nearby.status === 'error') {
    empty = <StateMessage title={t.loadError} action={{ label: t.retry, onPress: nearby.retry }} />;
  } else {
    empty = (
      <StateMessage
        title={t.noneNearby(SEARCH_RADIUS_KM)}
        body={t.noneNearbyHint}
        action={{ label: t.tabAdd, onPress: () => router.navigate('/add') }}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xxl }}
      stickyHeaderIndices={[0]}
      data={data}
      keyExtractor={(m) => m.id}
      refreshControl={
        mode === 'saved' ? undefined : (
        <RefreshControl
          tintColor={c.accent}
          colors={[c.accent]}
          refreshing={nearby.status === 'loading' && nearby.data.length > 0}
          onRefresh={nearby.refresh}
        />
        )
      }
      ListHeaderComponent={
        <View style={{ gap: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, backgroundColor: c.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
            <Chip label={t.tabNearby} selected={mode === 'nearby'} onPress={() => setMode('nearby')} />
            <Chip label={favorites.length > 0 ? `♥ ${t.saved} · ${favorites.length}` : `♥ ${t.saved}`} selected={mode === 'saved'} onPress={() => setMode('saved')} />
          </View>
          <ServiceFilter value={service} onChange={setService} />
          {mode === 'nearby' ? (
            <LocationBanner />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
              <Icon {...ICONS.heartFill} size={14} color={c.primary} />
              <Text style={{ flex: 1, fontSize: 13, color: c.secondaryLabel }}>{t.savedListHint}</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={<View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl }}>{empty}</View>}
      renderItem={({ item, index }) => (
        <MechanicCard
          mechanic={item}
          eyebrow={mode === 'nearby' && index === 0 ? t.nearest : undefined}
          onPress={() => router.push({ pathname: '/mechanic/[id]', params: { id: item.id } })}
          style={{ marginHorizontal: Spacing.lg }}
        />
      )}
    />
  );
}
