import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon } from '@/components/icon';
import { ShopAvatar } from '@/components/shop-avatar';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { StateMessage } from '@/components/state-message';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMechanic } from '@/hooks/use-mechanic';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { createServiceRequest } from '@/lib/requests';
import { callPhone } from '@/utils/actions';
import { formatCoords } from '@/utils/geocode';

/** Rider → mechanic: a short message plus the rider's location; the owner gets a push notification. */
export function RequestHelpScreen({ id }: { id: string }) {
  const c = useColors();
  const t = useStrings();
  const { user } = useAuth();
  const { state, retry } = useMechanic(id);
  const { coords, status: locationStatus } = useUserLocation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user === undefined) return null;
  if (!user) return <SignInPrompt title={t.signInToRequest} body={t.signInToRequestBody} />;

  if (state.status !== 'success' || !state.mechanic) {
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

  const m = state.mechanic;
  const hasLocation = locationStatus === 'ready';

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await createServiceRequest({ mechanicId: m.id, mechanicName: m.name, message: message.trim(), location: hasLocation ? coords : null });
      Alert.alert(t.requestSentTitle, t.requestSentBody, [{ text: t.close, onPress: () => router.back() }]);
    } catch {
      setError(t.errRequestFailed);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <ShopAvatar uri={m.photo_url} name={m.name} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: c.label }}>{m.name}</Text>
          <Text style={{ fontSize: 14, color: c.secondaryLabel }}>{t.requestHelpBody(m.name)}</Text>
        </View>
      </View>

      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={t.requestMessagePlaceholder}
        placeholderTextColor={c.tertiaryLabel}
        selectionColor={c.accent}
        multiline
        maxLength={300}
        autoFocus
        style={{
          minHeight: 120,
          padding: Spacing.md,
          borderRadius: Radius.md,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          fontSize: 16,
          color: c.label,
          textAlignVertical: 'top',
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          padding: Spacing.md,
          borderRadius: Radius.md,
          borderCurve: 'continuous',
          backgroundColor: hasLocation ? c.accentSoft : c.goldSoft,
        }}>
        <Icon {...ICONS.location} size={20} color={hasLocation ? c.accent : c.gold} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: c.label }}>{t.myLocation}</Text>
          <Text style={{ fontSize: 14, color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>
            {hasLocation ? formatCoords(coords) : t.findingLocation}
          </Text>
        </View>
      </View>

      {error && (
        <Text selectable style={{ color: c.danger, fontSize: 14, textAlign: 'center' }}>
          {error}
        </Text>
      )}
      <ActionButton size="large" variant="primary" icon={ICONS.message} label={sending ? t.sending : t.sendRequest} loading={sending} onPress={send} />
      <ActionButton variant="plain" icon={ICONS.phone} label={t.call} onPress={() => callPhone(m.phone)} />
    </ScrollView>
  );
}
