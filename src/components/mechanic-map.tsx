import { useEffect, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

import { ShopPin } from '@/components/shop-pin';
import { useSettings } from '@/hooks/use-settings';
import type { Mechanic } from '@/lib/mechanics';
import type { Coords } from '@/utils/geo';

export type MechanicMapProps = {
  mechanics: Mechanic[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The map flies here whenever it (or `centerKey`) changes. */
  center: Coords;
  centerKey: number;
  /** Space covered by overlays, so the Google logo and centered pins stay visible. */
  padding: { top: number; bottom: number };
};

// Google Maps on Android. iOS uses Apple Maps so it runs in Expo Go;
// switch to PROVIDER_GOOGLE there once you make a development build with an iOS key.
const provider = process.env.EXPO_OS === 'android' ? PROVIDER_GOOGLE : undefined;

export function MechanicMap({ mechanics, selectedId, onSelect, center, centerKey, padding }: MechanicMapProps) {
  const mapRef = useRef<MapView>(null);
  const { latitude, longitude } = center;
  const { mapLayer, showTraffic } = useSettings();
  // Apple Maps has no terrain layer.
  const mapType = mapLayer === 'terrain' && process.env.EXPO_OS !== 'android' ? 'standard' : mapLayer;

  useEffect(() => {
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 600);
  }, [latitude, longitude, centerKey]);

  return (
    <MapView
      ref={mapRef}
      provider={provider}
      style={{ flex: 1 }}
      initialRegion={{ ...center, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
      mapType={mapType}
      showsTraffic={showTraffic}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
      mapPadding={{ top: padding.top, bottom: padding.bottom, left: 0, right: 0 }}
      onPress={(e) => {
        // On iOS a marker tap also reaches the map; ignore it so the selection sticks.
        if (e.nativeEvent.action !== 'marker-press') onSelect(null);
      }}>
      {mechanics.map((m) => {
        const isSelected = m.id === selectedId;
        // The key includes the selection so the pin remounts and re-snapshots in its new colour/size.
        return <ShopPin key={`${m.id}:${isSelected ? 'sel' : 'idle'}`} mechanic={m} selected={isSelected} onPress={() => onSelect(m.id)} />;
      })}
    </MapView>
  );
}
