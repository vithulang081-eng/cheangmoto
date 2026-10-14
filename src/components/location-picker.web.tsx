import { Pressable, Text } from 'react-native';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { formatCoords } from '@/utils/geocode';

import type { LocationPickerProps } from './location-picker';

export function LocationPicker({ value, onPressChoose }: LocationPickerProps) {
  const c = useColors();
  const t = useStrings();
  return (
    <Pressable onPress={onPressChoose} accessibilityRole="button" accessibilityLabel={t.chooseOnMap}>
      <Text selectable style={{ color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>
        {formatCoords(value)}
      </Text>
    </Pressable>
  );
}
