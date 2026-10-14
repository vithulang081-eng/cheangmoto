import { ActivityIndicator, Pressable, type StyleProp, Text, type ViewStyle } from 'react-native';

import { Icon, type IconPair } from '@/components/icon';
import { Radius, useColors } from '@/constants/theme';

/**
 * primary   – red, the one action that matters most on a screen (call, submit)
 * secondary – soft navy (directions)
 * plain     – neutral (share, cancel)
 */
type Variant = 'primary' | 'secondary' | 'plain';

type Props = {
  label: string;
  icon?: IconPair;
  variant?: Variant;
  onPress: () => void;
  size?: 'regular' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({
  label,
  icon,
  variant = 'primary',
  onPress,
  size = 'regular',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const c = useColors();
  const bg = { primary: c.primary, secondary: c.accentSoft, plain: c.fill }[variant];
  const fg = { primary: c.onFill, secondary: c.accent, plain: c.label }[variant];
  const isLarge = size === 'large';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: isLarge ? 56 : 48,
          paddingHorizontal: 18,
          borderRadius: Radius.md,
          borderCurve: 'continuous',
          backgroundColor: bg,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        icon && <Icon {...icon} size={isLarge ? 21 : 18} color={fg} />
      )}
      <Text numberOfLines={1} style={{ color: fg, fontSize: isLarge ? 18 : 16, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}
