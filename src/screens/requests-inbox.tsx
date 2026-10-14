import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { StateMessage } from '@/components/state-message';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSettings, useStrings } from '@/hooks/use-settings';
import { fetchMyRequests, type RequestStatus, type ServiceRequest, setRequestStatus, subscribeToRequestChanges } from '@/lib/requests';
import { callPhone } from '@/utils/actions';
import { formatPhone } from '@/utils/phone';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Mechanic inbox: riders who asked this mechanic's shops for help, live-updated. */
export function RequestsInboxScreen() {
  const { user } = useAuth();
  const t = useStrings();
  if (user === undefined) return null;
  if (!user) return <SignInPrompt title={t.requestsInbox} body={t.requestsInboxBody} />;
  return <RequestsList />;
}

function RequestsList() {
  const c = useColors();
  const t = useStrings();
  const { language } = useSettings();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; data: ServiceRequest[]; error: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyRequests()
      .then((data) => !cancelled && setResult({ attempt, data, error: false }))
      .catch(() => !cancelled && setResult((r) => ({ attempt, data: r?.data ?? [], error: true })));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // A new request (or a status change) refreshes the list without pull-to-refresh.
  useEffect(() => subscribeToRequestChanges(() => setAttempt((a) => a + 1)), []);

  const loading = result?.attempt !== attempt;
  const data = result?.data ?? [];
  const reload = () => setAttempt((a) => a + 1);

  const changeStatus = async (id: string, status: RequestStatus) => {
    setBusyId(id);
    try {
      await setRequestStatus(id, status);
      setResult((r) => (r ? { ...r, data: r.data.map((x) => (x.id === id ? { ...x, status } : x)) } : r));
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel: Record<RequestStatus, string> = { new: t.reqNew, accepted: t.reqAccepted, done: t.reqDone, cancelled: t.reqCancelled };

  let empty;
  if (loading && data.length === 0) empty = <StateMessage loading title={t.loadingMechanics} />;
  else if (result?.error) empty = <StateMessage title={t.loadError} action={{ label: t.retry, onPress: reload }} />;
  else empty = <StateMessage title={t.noRequests} />;

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl }}
      data={data}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl tintColor={c.accent} colors={[c.accent]} refreshing={loading && data.length > 0} onRefresh={reload} />}
      ListHeaderComponent={
        isExpoGo ? (
          <View style={{ padding: Spacing.md, borderRadius: Radius.md, borderCurve: 'continuous', backgroundColor: c.goldSoft, marginBottom: Spacing.sm }}>
            <Text style={{ fontSize: 13, color: c.label }}>{t.pushUnavailable}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={<View style={{ paddingTop: Spacing.xl }}>{empty}</View>}
      renderItem={({ item: r }) => {
        const isNew = r.status === 'new';
        const when = new Date(r.created_at).toLocaleString(language === 'km' ? 'km-KH' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
        const hasLocation = r.latitude != null && r.longitude != null;
        return (
          <View
            style={{
              gap: Spacing.md,
              padding: Spacing.lg,
              borderRadius: Radius.lg,
              borderCurve: 'continuous',
              backgroundColor: c.card,
              borderWidth: 1,
              borderColor: isNew ? c.primary : c.border,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 13, color: c.secondaryLabel }}>
                  {r.mechanic_name} · {when}
                </Text>
                <Text selectable style={{ fontSize: 18, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>
                  {r.rider_phone ? formatPhone(r.rider_phone) : '—'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: isNew ? c.primary : c.fill }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: isNew ? c.onFill : c.secondaryLabel }}>{statusLabel[r.status]}</Text>
              </View>
            </View>
            {r.message && (
              <Text selectable style={{ fontSize: 15, color: c.label }}>
                {r.message}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {r.rider_phone && (
                <ActionButton variant="primary" icon={ICONS.phone} label={t.callRider} onPress={() => callPhone(r.rider_phone!)} style={{ flex: 1 }} />
              )}
              {hasLocation ? (
                <ActionButton
                  variant="secondary"
                  icon={ICONS.directions}
                  label={t.riderLocation}
                  onPress={() =>
                    router.push({
                      pathname: '/route/[id]',
                      params: { id: 'point', lat: String(r.latitude), lng: String(r.longitude), name: formatPhone(r.rider_phone ?? ''), phone: r.rider_phone ?? '' },
                    })
                  }
                  style={{ flex: 1 }}
                />
              ) : (
                <Text style={{ flex: 1, alignSelf: 'center', fontSize: 13, color: c.tertiaryLabel }}>{t.noRiderLocation}</Text>
              )}
            </View>
            {(isNew || r.status === 'accepted') && (
              <ActionButton
                variant="plain"
                icon={ICONS.checkmark}
                label={isNew ? t.accept : t.markDone}
                loading={busyId === r.id}
                disabled={busyId !== null && busyId !== r.id}
                onPress={() => changeStatus(r.id, isNew ? 'accepted' : 'done')}
              />
            )}
          </View>
        );
      }}
    />
  );
}
