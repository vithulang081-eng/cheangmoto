import { Image } from 'expo-image';
import { ScrollView } from 'react-native';

import { Radius, Spacing, useColors } from '@/constants/theme';

type Props = { urls: (string | null | undefined)[]; height?: number };

/** Horizontal row of shop photos (profile first). Renders nothing when there are none. */
export function PhotoStrip({ urls, height = 110 }: Props) {
  const c = useColors();
  const photos = [...new Set(urls.filter((u): u is string => !!u))];
  if (photos.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginHorizontal: -Spacing.xl }}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.xl }}>
      {photos.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: height * 1.4, height, borderRadius: Radius.md, backgroundColor: c.fill }}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ))}
    </ScrollView>
  );
}
