import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { ICONS, Icon } from '@/components/icon';
import { Radius, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

type Props = {
  uri?: string | null;
  size?: number;
  round?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
};

/** A picked photo with a remove badge, or a dashed "add photo" tile. */
export function PhotoSlot({ uri, size = 96, round = false, onAdd, onRemove }: Props) {
  const c = useColors();
  const t = useStrings();
  const radius = round ? size / 2 : Radius.md;

  if (uri) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: c.fill }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
        {onRemove && (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={t.removePhoto}
            hitSlop={8}
            style={({ pressed }) => ({
              position: 'absolute',
              top: -6,
              right: -6,
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.card,
              boxShadow: `0 2px 6px ${c.shadow}`,
              opacity: pressed ? 0.7 : 1,
            })}>
            <Icon {...ICONS.remove} size={20} color={c.danger} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel={t.addPhoto}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: c.accent,
        backgroundColor: c.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon {...ICONS.add} size={26} color={c.accent} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: c.accent }}>{t.addPhoto}</Text>
    </Pressable>
  );
}
