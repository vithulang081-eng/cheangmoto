import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { OpenBadge } from '@/components/open-badge';
import { PhotoStrip } from '@/components/photo-strip';
import { StateMessage } from '@/components/state-message';
import { serviceLabel } from '@/constants/services';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { fetchPendingMechanics, type Mechanic, setMechanicStatus } from '@/lib/mechanics';
import { formatPhone } from '@/utils/phone';

type State =
  | { status: 'loading'; data: Mechanic[] }
  | { status: 'success'; data: Mechanic[] }
  | { status: 'error'; data: Mechanic[] };

/** Admin review queue: shops riders added, waiting to be approved before they appear on the map. */
export function AdminPendingScreen() {
  const c = useColors();
  const t = useStrings();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; state: State } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPendingMechanics()
      .then((data) => !cancelled && setResult({ attempt, state: { status: 'success', data } }))
      .catch(() => !cancelled && setResult((r) => ({ attempt, state: { status: 'error', data: r?.state.data ?? [] } })));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const state: State = result?.attempt === attempt ? result.state : { status: 'loading', data: result?.state.data ?? [] };
  const reload = () => setAttempt((a) => a + 1);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setActionError(null);
    try {
      await setMechanicStatus(id, status);
      // Drop the row locally; realtime also refreshes riders' lists.
      setResult((r) => (r ? { ...r, state: { ...r.state, data: r.state.data.filter((m) => m.id !== id) } } : r));
    } catch {
      setActionError(t.errSubmitFailed);
    } finally {
      setBusyId(null);
    }
  };

  let empty;
  if (state.status === 'loading' && state.data.length === 0) {
    empty = <StateMessage loading title={t.loadingMechanics} />;
  } else if (state.status === 'error') {
    empty = <StateMessage title={t.loadError} action={{ label: t.retry, onPress: reload }} />;
  } else {
    empty = <StateMessage title={t.noPending} />;
  }

  return (
    <FlatList
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl }}
      data={state.data}
      keyExtractor={(m) => m.id}
      refreshControl={
        <RefreshControl
          tintColor={c.accent}
          colors={[c.accent]}
          refreshing={state.status === 'loading' && state.data.length > 0}
          onRefresh={reload}
        />
      }
      ListHeaderComponent={
        actionError ? (
          <Text selectable style={{ color: c.danger, fontSize: 14, textAlign: 'center', paddingBottom: Spacing.sm }}>
            {actionError}
          </Text>
        ) : null
      }
      ListEmptyComponent={<View style={{ paddingTop: Spacing.xl }}>{empty}</View>}
      renderItem={({ item: m }) => {
        const address = [m.address, m.province].filter(Boolean).join(', ');
        const busy = busyId === m.id;
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
            <View style={{ gap: 4 }}>
              <PhotoStrip urls={[m.photo_url, ...m.photos]} height={100} />
              <Text selectable style={{ fontSize: 18, fontWeight: '700', color: c.label }}>
                {m.name}
              </Text>
              <Text selectable style={{ fontSize: 15, fontWeight: '600', color: c.accent, fontVariant: ['tabular-nums'] }}>
                {formatPhone(m.phone)}
              </Text>
              <OpenBadge {...m} showHours />
              <Text style={{ fontSize: 14, color: c.secondaryLabel }}>{m.services.map((s) => serviceLabel(s, t)).join('  ·  ')}</Text>
              {address !== '' && (
                <Text selectable style={{ fontSize: 14, color: c.secondaryLabel }}>
                  {address}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <ActionButton
                variant="primary"
                icon={ICONS.check}
                label={t.approve}
                loading={busy}
                disabled={busyId !== null && !busy}
                onPress={() => decide(m.id, 'approved')}
                style={{ flex: 1 }}
              />
              <ActionButton
                variant="plain"
                label={t.reject}
                disabled={busyId !== null}
                onPress={() => decide(m.id, 'rejected')}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        );
      }}
    />
  );
}
