import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon } from '@/components/icon';
import { PinGlyph, pinHeight, ShopPin } from '@/components/shop-pin';
import { StateMessage } from '@/components/state-message';
import { Brand, Radius, Spacing, useColors } from '@/constants/theme';
import { useMechanic } from '@/hooks/use-mechanic';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import type { Mechanic } from '@/lib/mechanics';
import { fetchRoute, type Route, splitDuration } from '@/lib/routing';
import { callPhone, openDirections } from '@/utils/actions';
import { formatDistance } from '@/utils/geo';

const provider = process.env.EXPO_OS === 'android' ? PROVIDER_GOOGLE : undefined;

/** A destination that isn't a shop row, e.g. a rider who asked for help. */
export type RoutePoint = { latitude: number; longitude: number; name: string; phone?: string };

type Destination = Pick<Mechanic, 'id' | 'name' | 'latitude' | 'longitude'> & { phone?: string; shop?: Mechanic };

/** In-app route: the road from the rider to the shop drawn on our own map, with distance and time. */
export function RouteScreen({ id, point }: { id: string; point?: RoutePoint }) {
  const c = useColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { state, retry } = useMechanic(point ? '' : id);
  const { coords: rider, status: locationStatus } = useUserLocation();
  const mapRef = useRef<MapView>(null);
  const [result, setResult] = useState<{ key: string; route: Route } | null>(null);

  const shop = state.status === 'success' ? state.mechanic : null;
  const mechanic: Destination | null = point
    ? { id: 'point', name: point.name, latitude: point.latitude, longitude: point.longitude, phone: point.phone }
    : shop
      ? { id: shop.id, name: shop.name, latitude: shop.latitude, longitude: shop.longitude, phone: shop.phone, shop }
      : null;
  // Re-route only when the rider moves ~100 m, not on every GPS tick.
  const riderKey = `${rider.latitude.toFixed(3)},${rider.longitude.toFixed(3)}`;
  const routeKey = mechanic ? `${mechanic.id}:${riderKey}` : null;

  useEffect(() => {
    if (!mechanic || !routeKey || locationStatus === 'locating') return;
    let cancelled = false;
    fetchRoute(rider, mechanic).then((route) => !cancelled && setResult({ key: routeKey, route }));
    return () => {
      cancelled = true;
    };
    // `rider` is covered by routeKey (rounded), so small GPS jitter doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mechanic, routeKey, locationStatus]);

  const route = result?.key === routeKey ? result.route : null;

  const fitRoute = () => {
    if (!route) return;
    mapRef.current?.fitToCoordinates(route.points, {
      edgePadding: { top: insets.top + 80, bottom: 260, left: 60, right: 60 },
      animated: true,
    });
  };

  // Frame the whole route once it arrives.
  const routePointCount = route?.points.length ?? 0;
  useEffect(() => {
    if (routePointCount > 0) fitRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePointCount]);

  if (!mechanic) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: c.background }}>
        {state.status === 'error' ? (
          <StateMessage title={t.loadError} action={{ label: t.retry, onPress: retry }} />
        ) : state.status === 'success' ? (
          <StateMessage title={t.notFound} />
        ) : (
          <StateMessage loading title={t.loadingMechanics} />
        )}
      </View>
    );
  }

  const duration = route?.duration_s != null ? splitDuration(route.duration_s) : null;
  const durationText = duration
    ? duration.hours > 0
      ? t.routeHoursMinutes(duration.hours, duration.minutes)
      : t.routeMinutes(duration.minutes)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <MapView
        ref={mapRef}
        provider={provider}
        style={{ flex: 1 }}
        initialRegion={{ ...rider, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        mapPadding={{ top: insets.top + 60, bottom: 240, left: 0, right: 0 }}>
        {route && (
          <>
            <Polyline coordinates={route.points} strokeColor="#FFFFFF" strokeWidth={9} />
            <Polyline
              coordinates={route.points}
              strokeColor={Brand.blue}
              strokeWidth={5}
              lineDashPattern={route.isStraightLine ? [12, 10] : undefined}
            />
          </>
        )}
        {mechanic.shop ? (
          <ShopPin mechanic={mechanic.shop} selected />
        ) : (
          <Marker
            coordinate={{ latitude: mechanic.latitude, longitude: mechanic.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            centerOffset={{ x: 0, y: -pinHeight(42) / 2 }}
            tracksViewChanges={false}>
            <PinGlyph color={Brand.red} size={42}>
              <Icon {...ICONS.person} size={22} color={Brand.red} />
            </PinGlyph>
          </Marker>
        )}
      </MapView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: insets.bottom + Spacing.lg, gap: Spacing.md }}>
        <Pressable
          onPress={fitRoute}
          accessibilityRole="button"
          accessibilityLabel={t.routeFit}
          style={({ pressed }) => ({
            alignSelf: 'flex-end',
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

        <View
          style={{
            gap: Spacing.md,
            padding: Spacing.lg,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            boxShadow: `0 6px 24px ${c.shadow}`,
          }}>
          <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: c.label }}>
            {mechanic.name}
          </Text>
          {route ? (
            <View style={{ flexDirection: 'row', gap: Spacing.xl }}>
              <Stat label={t.routeDistance} value={formatDistance(route.distance_m) ?? '—'} />
              <Stat label={t.routeTime} value={durationText ?? '—'} />
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: c.secondaryLabel }}>
              {locationStatus === 'locating' ? t.findingLocation : t.routeLoading}
            </Text>
          )}
          {route?.isStraightLine && (
            <Text style={{ fontSize: 13, color: c.tertiaryLabel }}>{t.routeStraightLine}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {mechanic.phone ? (
              <ActionButton
                variant="primary"
                icon={ICONS.phone}
                label={t.call}
                onPress={() => callPhone(mechanic.phone!)}
                style={{ flex: 1 }}
              />
            ) : null}
            <ActionButton
              variant="plain"
              icon={ICONS.directions}
              label={t.openInGoogleMaps}
              onPress={() => openDirections(mechanic)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.secondaryLabel }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: c.accent, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}
