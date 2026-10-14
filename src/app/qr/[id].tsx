import { useLocalSearchParams } from 'expo-router';

import { MechanicQrScreen } from '@/screens/mechanic-qr';

export default function MechanicQrRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MechanicQrScreen id={id} />;
}
