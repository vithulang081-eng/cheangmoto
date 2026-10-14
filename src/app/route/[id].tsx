import { Stack, useLocalSearchParams } from 'expo-router';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { RouteScreen } from '@/screens/route';

/**
 * /route/<mechanic id>            → route to a shop
 * /route/point?lat=&lng=&name=&phone= → route to any point (e.g. a rider asking for help)
 */
export default function RouteRoute() {
  const c = useColors();
  const t = useStrings();
  const { id, lat, lng, name, phone } = useLocalSearchParams<{ id: string; lat?: string; lng?: string; name?: string; phone?: string }>();
  const latitude = Number(lat);
  const longitude = Number(lng);
  const point =
    id === 'point' && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude, name: name || t.riderLocation, phone: phone || undefined }
      : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          title: t.routeTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <RouteScreen id={id} point={point} />
    </>
  );
}
