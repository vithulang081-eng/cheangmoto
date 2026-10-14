import { ScrollView } from 'react-native';

import { Chip } from '@/components/chip';
import { SERVICE_IDS, type ServiceId, serviceLabel } from '@/constants/services';
import { Spacing } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

type Props = {
  value: ServiceId | null;
  onChange: (value: ServiceId | null) => void;
  floating?: boolean;
};

/** One-tap filter: "what's broken?" */
export function ServiceFilter({ value, onChange, floating }: Props) {
  const t = useStrings();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, overflow: 'visible' }}
      contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: 4 }}>
      <Chip
        label={t.allServices}
        selected={value === null}
        floating={floating}
        onPress={() => onChange(null)}
      />
      {SERVICE_IDS.map((id) => (
        <Chip
          key={id}
          label={serviceLabel(id, t)}
          selected={value === id}
          floating={floating}
          onPress={() => onChange(value === id ? null : id)}
        />
      ))}
    </ScrollView>
  );
}
