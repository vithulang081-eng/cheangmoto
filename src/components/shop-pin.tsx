import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Brand } from '@/constants/theme';
import type { Mechanic } from '@/lib/mechanics';
import { getOpenState } from '@/utils/opening-hours';

type PinMechanic = Pick<Mechanic, 'id' | 'name' | 'latitude' | 'longitude' | 'photo_url' | 'opens_at' | 'closes_at' | 'open_24h'>;

type Props = { mechanic: PinMechanic; selected?: boolean; onPress?: () => void };

const CLOSED = '#8C94A3';
const TIP = 10;

/**
 * Map pin drawn with plain views (the `image` prop never renders in Expo Go on iOS):
 * the shop's photo (or its initial) in a ring — red = open, grey = closed, navy = selected.
 * Remount it (change its key) when `selected` flips so the native snapshot is refreshed.
 */
export function ShopPin({ mechanic: m, selected = false, onPress }: Props) {
  const [photoLoaded, setPhotoLoaded] = useState(!m.photo_url);
  const isOpen = getOpenState(m) !== 'closed';
  const color = selected ? Brand.navy : isOpen ? Brand.red : CLOSED;
  const size = selected ? 52 : 42;
  const height = size + TIP - 1;

  return (
    <Marker
      identifier={m.id}
      coordinate={{ latitude: m.latitude, longitude: m.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -height / 2 }}
      // Keep re-rendering only until the photo is in; afterwards a static snapshot is cheaper.
      tracksViewChanges={!photoLoaded}
      zIndex={selected ? 3 : isOpen ? 2 : 1}
      onPress={onPress}>
      <PinGlyph color={color} size={size}>
        {m.photo_url ? (
          <Image
            source={{ uri: m.photo_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            onLoadEnd={() => setPhotoLoaded(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={{ fontSize: size * 0.42, fontWeight: '800', color }}>{m.name.trim().charAt(0)}</Text>
        )}
      </PinGlyph>
    </Marker>
  );
}

/** Ring + pointer, no map dependency, so forms can reuse it. */
export function PinGlyph({ color, size = 42, children }: { color: string; size?: number; children?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color,
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
        }}>
        {children}
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          marginTop: -1,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: TIP,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
}

/** Height of a PinGlyph of `size`, for centerOffset maths. */
export function pinHeight(size = 42) {
  return size + TIP - 1;
}
