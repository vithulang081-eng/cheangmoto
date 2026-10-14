import { Modal, Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICONS, Icon } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { MAP_LAYERS, type MapLayer, useSettings, useStrings } from '@/hooks/use-settings';

type Props = { visible: boolean; onClose: () => void };

/** Bottom card to pick the map layer (standard / satellite / hybrid / terrain) and toggle traffic. */
export function MapLayerPicker({ visible, onClose }: Props) {
  const c = useColors();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { mapLayer, setMapLayer, showTraffic, setShowTraffic } = useSettings();
  const labels: Record<MapLayer, string> = {
    standard: t.layerStandard,
    satellite: t.layerSatellite,
    hybrid: t.layerHybrid,
    terrain: t.layerTerrain,
  };
  // Terrain exists on Google Maps (Android) only.
  const layers = MAP_LAYERS.filter((l) => l !== 'terrain' || process.env.EXPO_OS === 'android');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} accessibilityLabel={t.close} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8, 21, 47, 0.45)' }}>
        <Pressable
          onPress={() => {}}
          style={{
            margin: Spacing.md,
            marginBottom: Math.max(insets.bottom, Spacing.md),
            padding: Spacing.lg,
            gap: Spacing.lg,
            borderRadius: Radius.lg + 4,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            boxShadow: `0 -8px 30px ${c.shadow}`,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Icon {...ICONS.layers} size={18} color={c.accent} />
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: c.label }}>{t.mapLayers}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: c.accent }}>{t.done}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            {layers.map((layer) => {
              const selected = layer === mapLayer;
              return (
                <Pressable
                  key={layer}
                  onPress={() => setMapLayer(layer)}
                  accessibilityRole="radio"
                  accessibilityLabel={labels[layer]}
                  accessibilityState={{ selected, checked: selected }}
                  style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: Spacing.sm, opacity: pressed ? 0.85 : 1 })}>
                  <View
                    style={{
                      alignSelf: 'stretch',
                      aspectRatio: 1,
                      padding: 3,
                      borderRadius: 16,
                      borderCurve: 'continuous',
                      backgroundColor: selected ? c.accent : c.fill,
                    }}>
                    <View style={{ flex: 1, borderRadius: 13, borderCurve: 'continuous', overflow: 'hidden' }}>
                      <LayerThumb layer={layer} />
                    </View>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{ fontSize: 12, fontWeight: selected ? '800' : '600', color: selected ? c.accent : c.secondaryLabel, textAlign: 'center' }}>
                    {labels[layer]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              paddingHorizontal: Spacing.md,
              minHeight: 52,
              borderRadius: Radius.md,
              borderCurve: 'continuous',
              backgroundColor: c.fill,
            }}>
            <Icon {...ICONS.traffic} size={18} color={c.accent} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: c.label }}>{t.showTraffic}</Text>
            <Switch value={showTraffic} onValueChange={setShowTraffic} trackColor={{ true: c.accent }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Tiny illustration of each layer so riders can recognise it before switching. */
function LayerThumb({ layer }: { layer: MapLayer }) {
  if (layer === 'standard') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4EEE4' }}>
        <View style={{ position: 'absolute', top: '45%', left: -4, right: -4, height: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D2C5', transform: [{ rotate: '-12deg' }] }} />
        <View style={{ position: 'absolute', left: '55%', top: -4, bottom: -4, width: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D2C5' }} />
        <View style={{ position: 'absolute', top: 8, left: 8, width: 16, height: 12, borderRadius: 3, backgroundColor: '#CFE3C4' }} />
        <View style={{ position: 'absolute', right: 9, bottom: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E31E32' }} />
      </View>
    );
  }
  if (layer === 'terrain') {
    return (
      <View style={{ flex: 1, backgroundColor: '#DCE7CC' }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: -10 + i * 6,
              top: 8 + i * 9,
              width: 70,
              height: 46,
              borderRadius: 30,
              borderWidth: 1.5,
              borderColor: '#9FB98A',
            }}
          />
        ))}
        <View style={{ position: 'absolute', top: '52%', left: -4, right: -4, height: 4, backgroundColor: '#FFFFFF', opacity: 0.9, transform: [{ rotate: '8deg' }] }} />
      </View>
    );
  }
  // satellite / hybrid share the aerial look; hybrid adds roads + a label strip
  return (
    <View style={{ flex: 1, backgroundColor: '#3E4A30' }}>
      <View style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 16, borderRadius: 3, backgroundColor: '#5B6B3E' }} />
      <View style={{ position: 'absolute', bottom: 8, right: 6, width: 18, height: 14, borderRadius: 3, backgroundColor: '#6E5A3C' }} />
      <View style={{ position: 'absolute', top: -6, bottom: -6, left: '58%', width: 9, backgroundColor: '#2F5F7E', transform: [{ rotate: '14deg' }] }} />
      {layer === 'hybrid' && (
        <>
          <View style={{ position: 'absolute', top: '48%', left: -4, right: -4, height: 3, backgroundColor: '#FFFFFF', opacity: 0.9, transform: [{ rotate: '-10deg' }] }} />
          <View style={{ position: 'absolute', bottom: 6, left: 6, width: 20, height: 5, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
        </>
      )}
    </View>
  );
}
