import { Stack, useLocalSearchParams } from 'expo-router';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { RequestHelpScreen } from '@/screens/request-help';

export default function RequestHelpRoute() {
  const c = useColors();
  const t = useStrings();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          title: t.requestHelpTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
          contentStyle: { backgroundColor: c.background },
        }}
      />
      <RequestHelpScreen id={id} />
    </>
  );
}
