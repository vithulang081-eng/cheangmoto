import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { fetchMyMechanic, type Mechanic } from '@/lib/mechanics';
import { AddMechanicScreen } from '@/screens/add-mechanic';

/** Edit one of the signed-in mechanic's own shops (pending or approved). */
export default function EditShopRoute() {
  const c = useColors();
  const t = useStrings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; mechanic: Mechanic | null; error: boolean } | null>(null);
  const key = `${id}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    fetchMyMechanic(id)
      .then((mechanic) => !cancelled && setResult({ key, mechanic, error: false }))
      .catch(() => !cancelled && setResult({ key, mechanic: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const current = result?.key === key ? result : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: t.editShop,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
          headerTitleStyle: { color: c.label, fontSize: 18, fontWeight: '700' },
          contentStyle: { backgroundColor: c.background },
        }}
      />
      {current?.mechanic ? (
        <AddMechanicScreen editing={current.mechanic} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: c.background }}>
          {!current ? (
            <StateMessage loading title={t.loadingMechanics} />
          ) : current.error ? (
            <StateMessage title={t.loadError} action={{ label: t.retry, onPress: () => setAttempt((a) => a + 1) }} />
          ) : (
            <StateMessage title={t.notFound} />
          )}
        </View>
      )}
    </>
  );
}
