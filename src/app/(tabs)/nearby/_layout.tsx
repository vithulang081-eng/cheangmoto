import { Stack } from 'expo-router';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

export default function Layout() {
  const c = useColors();
  const t = useStrings();
  return (
    <Stack
      screenOptions={{
        // Khmer text does not draw in iOS large titles on iOS 26, so use the compact header.
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.background },
        headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
        contentStyle: { backgroundColor: c.background },
      }}>
      <Stack.Screen name="index" options={{ title: t.nearbyTitle }} />
    </Stack>
  );
}
