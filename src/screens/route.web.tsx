import { Text, View } from 'react-native';

import { useColors } from '@/constants/theme';

/** react-native-maps has no web support; the route view is a native-only screen. */
export function RouteScreen(_props: { id: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <Text style={{ color: c.secondaryLabel }}>ផែនទីមានតែនៅលើទូរស័ព្ទ (Android / iOS)</Text>
    </View>
  );
}
