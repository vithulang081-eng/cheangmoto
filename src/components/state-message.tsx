import { Pressable, Text, View } from 'react-native';

import { MotoLoader } from '@/components/moto-loader';
import { Spacing, useColors } from '@/constants/theme';

type Props = {
  title: string;
  body?: string;
  loading?: boolean;
  action?: { label: string; onPress: () => void };
};

/** Loading / empty / error content, used inside cards and as list placeholders. */
export function StateMessage({ title, body, loading, action }: Props) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md }}>
      {loading && <MotoLoader style={{ maxWidth: 260, alignSelf: 'center', width: '100%', marginBottom: Spacing.xs }} />}
      <Text selectable style={{ fontSize: 16, fontWeight: '600', color: c.label, textAlign: 'center' }}>
        {title}
      </Text>
      {body && (
        <Text selectable style={{ fontSize: 14, color: c.secondaryLabel, textAlign: 'center' }}>
          {body}
        </Text>
      )}
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => ({ paddingVertical: 6, paddingHorizontal: 16, opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.accent }}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
