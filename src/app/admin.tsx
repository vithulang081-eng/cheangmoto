import { Stack } from 'expo-router';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { AdminPendingScreen } from '@/screens/admin-pending';

export default function AdminRoute() {
  const c = useColors();
  const t = useStrings();
  return (
    <>
      <Stack.Screen
        options={{
          title: t.adminTitle,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
          contentStyle: { backgroundColor: c.background },
        }}
      />
      <AdminPendingScreen />
    </>
  );
}
