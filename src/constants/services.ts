import type { Strings } from '@/constants/strings';

/** Shop types a rider can filter by. A shop can be both. Labels live in strings so they follow the language. */
export const SERVICE_IDS = ['motorbike', 'tire'] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

const LABEL_KEYS: Record<ServiceId, keyof Pick<Strings, 'serviceMotorbike' | 'serviceTire'>> = {
  motorbike: 'serviceMotorbike',
  tire: 'serviceTire',
};

export function serviceLabel(id: string, t: Strings) {
  const key = LABEL_KEYS[id as ServiceId];
  return key ? t[key] : id;
}
