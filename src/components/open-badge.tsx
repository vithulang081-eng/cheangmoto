import { Text, View } from 'react-native';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { formatHours, getOpenState } from '@/utils/opening-hours';

type Props = {
  opens_at: string | null;
  closes_at: string | null;
  open_24h: boolean;
  /** Also show "07:00–19:00" after the status. */
  showHours?: boolean;
};

export function OpenBadge({ showHours = false, ...hours }: Props) {
  const c = useColors();
  const t = useStrings();
  const state = getOpenState(hours);
  const { label, color } = {
    open: { label: t.open, color: c.success },
    open24h: { label: t.open24h, color: c.success },
    closed: { label: t.closed, color: c.danger },
    unknown: { label: t.hoursUnknown, color: c.tertiaryLabel },
  }[state];
  const range = showHours ? formatHours(hours) : null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 14, fontWeight: '600', color }}>{label}</Text>
      {range && (
        <Text style={{ fontSize: 14, color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>· {range}</Text>
      )}
    </View>
  );
}
