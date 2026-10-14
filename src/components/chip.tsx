import { Pressable, Text } from 'react-native';

import { Radius, useColors } from '@/constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Adds a shadow so the chip stays readable over the map. */
  floating?: boolean;
};

export function Chip({ label, selected = false, onPress, floating = false }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 38,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: Radius.pill,
        backgroundColor: selected ? c.accent : floating ? c.card : c.fill,
        boxShadow: floating ? `0 2px 8px ${c.shadow}` : undefined,
        opacity: pressed ? 0.75 : 1,
      })}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? c.onFill : c.label }}>{label}</Text>
    </Pressable>
  );
}
