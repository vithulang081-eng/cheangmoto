import { Stack } from 'expo-router';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { PickLocationScreen } from '@/screens/pick-location';

export default function PickLocationRoute() {
  const c = useColors();
  const t = useStrings();
  return (
    <>
      <Stack.Screen
        options={{
          title: t.pickLocationTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <PickLocationScreen />
    </>
  );
}
