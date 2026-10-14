import { useLocalSearchParams } from 'expo-router';

import { MechanicDetailScreen } from '@/screens/mechanic-detail';

export default function MechanicRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MechanicDetailScreen id={id} />;
}
