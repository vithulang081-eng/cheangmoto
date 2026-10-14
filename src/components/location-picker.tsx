import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { ICONS, Icon } from '@/components/icon';
import { PinGlyph, pinHeight } from '@/components/shop-pin';
import { Brand, Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import type { Coords } from '@/utils/geo';

export type LocationPickerProps = {
  value: Coords;
  /** True once the rider has confirmed a point on the big map. */
  chosen: boolean;
  onPressChoose: () => void;
};

const provider = process.env.EXPO_OS === 'android' ? PROVIDER_GOOGLE : undefined;

/** Map preview of the chosen point. Tapping it opens the full-screen picker. */
export function LocationPicker({ value, chosen, onPressChoose }: LocationPickerProps) {
  const c = useColors();
  const t = useStrings();
  return (
    <Pressable
      onPress={onPressChoose}
      accessibilityRole="button"
      accessibilityLabel={t.chooseOnMap}
      style={({ pressed }) => ({ borderRadius: Radius.md, overflow: 'hidden', opacity: pressed ? 0.9 : 1 })}>
      <View pointerEvents="none">
        <MapView
          provider={provider}
          style={{ height: 180 }}
          region={{ ...value, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
          liteMode
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}>
          <Marker coordinate={value} anchor={{ x: 0.5, y: 1 }} centerOffset={{ x: 0, y: -pinHeight(36) / 2 }} tracksViewChanges={false}>
            <PinGlyph color={Brand.navy} size={36}>
              <Icon {...ICONS.pin} size={18} color={Brand.navy} />
            </PinGlyph>
          </Marker>
        </MapView>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: Spacing.md,
          right: Spacing.md,
          bottom: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 44,
          paddingHorizontal: Spacing.lg,
          borderRadius: Radius.pill,
          backgroundColor: chosen ? c.accent : c.primary,
          boxShadow: `0 4px 14px ${c.shadow}`,
        }}>
        <Icon {...(chosen ? ICONS.checkmark : ICONS.pin)} size={18} color={c.onFill} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: c.onFill }}>{chosen ? t.locationChosen : t.chooseOnMap}</Text>
      </View>
    </Pressable>
  );
}
