import { ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { StateMessage } from '@/components/state-message';
import { Brand, Radius, Spacing, useColors } from '@/constants/theme';
import { useMechanic } from '@/hooks/use-mechanic';
import { useStrings } from '@/hooks/use-settings';
import { shareMechanic } from '@/utils/actions';
import { mechanicLink } from '@/utils/mechanic-link';
import { formatPhone } from '@/utils/phone';

/** A mechanic's QR card: scan it with the app (or the phone camera) to open the shop. */
export function MechanicQrScreen({ id }: { id: string }) {
  const c = useColors();
  const t = useStrings();
  const { state, retry } = useMechanic(id);

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
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, alignItems: 'center' }}>
      <View
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          gap: Spacing.lg,
          padding: Spacing.xl,
          borderRadius: Radius.lg + 4,
          borderCurve: 'continuous',
          backgroundColor: '#FFFFFF',
          boxShadow: `0 10px 30px ${c.shadow}`,
        }}>
        <View style={{ padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: '#FFFFFF' }}>
          <QRCode
            value={mechanicLink(m.id)}
            size={224}
            color={Brand.deepNavy}
            backgroundColor="#FFFFFF"
            ecl="H"
            logo={require('@/assets/images/icon.png')}
            logoSize={52}
            logoBackgroundColor="#FFFFFF"
            logoBorderRadius={26}
            logoMargin={4}
          />
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text selectable style={{ fontSize: 20, fontWeight: '800', color: Brand.charcoal, textAlign: 'center' }}>
            {m.name}
          </Text>
          <Text selectable style={{ fontSize: 16, fontWeight: '600', color: Brand.navy, fontVariant: ['tabular-nums'] }}>
            {formatPhone(m.phone)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Brand.navy }}>ជាង</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Brand.red }}>ម៉ូតូ</Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, lineHeight: 21, color: c.secondaryLabel, textAlign: 'center', paddingHorizontal: Spacing.md }}>
        {t.qrHint}
      </Text>

      <ActionButton
        variant="secondary"
        icon={ICONS.share}
        label={t.share}
        onPress={() => shareMechanic(m)}
        style={{ alignSelf: 'stretch' }}
      />
    </ScrollView>
  );
}
