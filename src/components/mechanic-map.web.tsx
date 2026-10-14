import { Text, View } from 'react-native';

import { useColors } from '@/constants/theme';

import type { MechanicMapProps } from './mechanic-map';

/** react-native-maps has no web support; the list tab still works on web. */
export function MechanicMap(_props: MechanicMapProps) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <Text style={{ color: c.secondaryLabel }}>ផែនទីមានតែនៅលើទូរស័ព្ទ (Android / iOS)</Text>
    </View>
  );
}
