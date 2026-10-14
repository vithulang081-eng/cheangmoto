import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { useColors } from '@/constants/theme';

type Props = { uri: string | null | undefined; name: string; size?: number };

/** Round shop photo; falls back to the first letter of the name on the soft navy tile. */
export function ShopAvatar({ uri, name, size = 44 }: Props) {
  const c = useColors();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.fill }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.accentSoft,
      }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: c.accent }}>{name.trim().charAt(0)}</Text>
    </View>
  );
}
