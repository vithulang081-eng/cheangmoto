import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Chip } from '@/components/chip';
import { ICONS, Icon, type IconPair } from '@/components/icon';
import { OpenBadge } from '@/components/open-badge';
import { PhotoStrip } from '@/components/photo-strip';
import { StateMessage } from '@/components/state-message';
import { serviceLabel } from '@/constants/services';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useFavorites } from '@/hooks/use-favorites';
import { useMechanic } from '@/hooks/use-mechanic';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { callPhone, chatOnTelegram, shareMechanic } from '@/utils/actions';
import { distanceMeters, formatDistance } from '@/utils/geo';
import { formatHours } from '@/utils/opening-hours';
import { formatPhone } from '@/utils/phone';

export function MechanicDetailScreen({ id }: { id: string }) {
  const c = useColors();
  const t = useStrings();
  const { state, retry } = useMechanic(id);
  const { coords, status: locationStatus } = useUserLocation();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (state.status !== 'success' || !state.mechanic) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: c.background }}>
        {state.status === 'loading' ? (
          <StateMessage loading title={t.loadingMechanics} />
        ) : state.status === 'error' ? (
          <StateMessage title={t.loadError} action={{ label: t.retry, onPress: retry }} />
        ) : (
          <StateMessage title={t.notFound} />
        )}
      </View>
    );
  }

  const m = state.mechanic;
  const saved = isFavorite(m.id);
  const meters = m.distance_m ?? (locationStatus === 'ready' ? distanceMeters(coords, m) : null);
  const distance = formatDistance(meters);
  const hours = formatHours(m);
  const address = [m.address, m.province].filter(Boolean).join(', ');

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ flex: 1, gap: Spacing.sm }}>
          <PhotoStrip urls={[m.photo_url, ...m.photos]} height={150} />
          <Text selectable style={{ fontSize: 26, fontWeight: '800', color: c.label }}>
            {m.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.md }}>
            <OpenBadge {...m} />
            {distance && (
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.accent, fontVariant: ['tabular-nums'] }}>
                {distance}
              </Text>
            )}
            {m.is_verified && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: Radius.pill,
                  backgroundColor: c.accentSoft,
                }}>
                <Icon {...ICONS.verified} size={14} color={c.accent} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.accent }}>{t.verified}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Save for later: stored on the device, listed on the Account tab. */}
        <Pressable
          onPress={() => toggleFavorite(m)}
          accessibilityRole="button"
          accessibilityLabel={saved ? t.saved : t.save}
          accessibilityState={{ selected: saved }}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: saved ? 'rgba(227, 30, 50, 0.12)' : c.fill,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}>
          <Icon {...(saved ? ICONS.heartFill : ICONS.heart)} size={22} color={saved ? c.primary : c.secondaryLabel} />
        </Pressable>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <ActionButton
          size="large"
          variant="primary"
          icon={ICONS.phone}
          label={`${t.call}  ${formatPhone(m.phone)}`}
          onPress={() => callPhone(m.phone)}
        />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <ActionButton
            variant="secondary"
            icon={ICONS.directions}
            label={t.directions}
            onPress={() => router.push({ pathname: '/route/[id]', params: { id: m.id } })}
            style={{ flex: 1 }}
          />
          <ActionButton
            variant="secondary"
            icon={ICONS.telegram}
            label={t.telegram}
            onPress={() => chatOnTelegram(m.phone)}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <ActionButton
            variant="plain"
            icon={ICONS.share}
            label={t.share}
            onPress={() => shareMechanic(m)}
            style={{ flex: 1 }}
          />
          <ActionButton
            variant="plain"
            icon={ICONS.qr}
            label={t.qrCode}
            onPress={() => router.push({ pathname: '/qr/[id]', params: { id: m.id } })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {m.is_owner ? (
        <ActionButton
          variant="secondary"
          icon={ICONS.edit}
          label={t.editShop}
          onPress={() => router.push({ pathname: '/edit/[id]', params: { id: m.id } })}
        />
      ) : m.has_owner ? (
        <ActionButton
          size="large"
          variant="secondary"
          icon={ICONS.message}
          label={t.requestHelp}
          onPress={() => router.push({ pathname: '/request/[id]', params: { id: m.id } })}
        />
      ) : null}

      {m.services.length > 0 && (
        <View style={{ gap: Spacing.md }}>
          <SectionTitle>{t.services}</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {m.services.map((s) => (
              <Chip key={s} label={serviceLabel(s, t)} />
            ))}
          </View>
        </View>
      )}

      <View
        style={{
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: Spacing.lg,
        }}>
        <InfoRow icon={ICONS.phone} label={t.phone} value={formatPhone(m.phone)} />
        {address !== '' && <InfoRow icon={ICONS.pin} label={t.address} value={address} />}
        <InfoRow
          icon={ICONS.clock}
          label={t.hours}
          value={m.open_24h ? t.open24h : (hours ?? t.hoursUnknown)}
          last
        />
      </View>
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  const c = useColors();
  return <Text style={{ fontSize: 15, fontWeight: '700', color: c.secondaryLabel }}>{children}</Text>;
}

function InfoRow({ icon, label, value, last }: { icon: IconPair; label: string; value: string; last?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}>
      <Icon {...icon} size={18} color={c.tertiaryLabel} />
      <Text style={{ width: 92, fontSize: 15, color: c.secondaryLabel }}>{label}</Text>
      <Text selectable style={{ flex: 1, fontSize: 15, fontWeight: '600', color: c.label }}>
        {value}
      </Text>
    </View>
  );
}
