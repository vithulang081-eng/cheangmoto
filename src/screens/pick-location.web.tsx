import { Text, View } from 'react-native';

import { useColors } from '@/constants/theme';

/** react-native-maps has no web support; the picker is a native-only screen. */
export function PickLocationScreen() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <Text style={{ color: c.secondaryLabel }}>ផែនទីមានតែនៅលើទូរស័ព្ទ (Android / iOS)</Text>
    </View>
  );
}
