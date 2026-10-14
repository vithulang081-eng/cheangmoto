import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { OpenBadge } from '@/components/open-badge';
import { ShopAvatar } from '@/components/shop-avatar';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { StateMessage } from '@/components/state-message';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useStrings } from '@/hooks/use-settings';
import { fetchMyMechanics, type Mechanic } from '@/lib/mechanics';
import { formatPhone } from '@/utils/phone';

/** The mechanic's own shops: status, quick edit, and the way into the requests inbox. */
export function MyShopsScreen() {
  const { user } = useAuth();
  const t = useStrings();
  if (user === undefined) return null;
  if (!user) return <SignInPrompt title={t.myShops} body={t.noMyShops} />;
  return <MyShopsList />;
}

function MyShopsList() {
  const c = useColors();
  const t = useStrings();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; data: Mechanic[]; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyMechanics()
      .then((data) => !cancelled && setResult({ attempt, data, error: false }))
      .catch(() => !cancelled && setResult((r) => ({ attempt, data: r?.data ?? [], error: true })));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loading = result?.attempt !== attempt;
  const data = result?.data ?? [];
  const reload = () => setAttempt((a) => a + 1);

  let empty;
  if (loading && data.length === 0) empty = <StateMessage loading title={t.loadingMechanics} />;
  else if (result?.error) empty = <StateMessage title={t.loadError} action={{ label: t.retry, onPress: reload }} />;
  else empty = <StateMessage title={t.noMyShops} action={{ label: t.addMyShop, onPress: () => router.navigate('/add') }} />;

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl }}
      data={data}
      keyExtractor={(m) => m.id}
      refreshControl={<RefreshControl tintColor={c.accent} colors={[c.accent]} refreshing={loading && data.length > 0} onRefresh={reload} />}
      ListHeaderComponent={
        data.length > 0 ? (
          <ActionButton
            variant="secondary"
            icon={ICONS.message}
            label={t.requestsInbox}
            onPress={() => router.push('/requests')}
            style={{ marginBottom: Spacing.sm }}
          />
        ) : null
      }
      ListEmptyComponent={<View style={{ paddingTop: Spacing.xl }}>{empty}</View>}
      ListFooterComponent={
        data.length > 0 ? (
          <ActionButton variant="plain" icon={ICONS.add} label={t.addMyShop} onPress={() => router.navigate('/add')} style={{ marginTop: Spacing.sm }} />
        ) : null
      }
      renderItem={({ item: m }) => {
        const pending = m.status === 'pending';
        return (
          <View
            style={{
              gap: Spacing.md,
              padding: Spacing.lg,
              borderRadius: Radius.lg,
              borderCurve: 'continuous',
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: c.border,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <ShopAvatar uri={m.photo_url} name={m.name} size={52} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '700', color: c.label }}>
                  {m.name}
                </Text>
                <Text style={{ fontSize: 14, color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>{formatPhone(m.phone)}</Text>
                <OpenBadge {...m} showHours />
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: Radius.pill,
                  backgroundColor: pending ? c.goldSoft : c.accentSoft,
                }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: pending ? c.label : c.accent }}>
                  {pending ? t.statusPending : t.statusApproved}
                </Text>
              </View>
            </View>
            <ActionButton
              variant="primary"
              icon={ICONS.edit}
              label={t.editShop}
              onPress={() => router.push({ pathname: '/edit/[id]', params: { id: m.id } })}
            />
          </View>
        );
      }}
    />
  );
}
