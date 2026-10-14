import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type Props = {
  /** SF Symbol on iOS. */
  sf: SFSymbol;
  /** Material icon on Android and web. */
  md: ComponentProps<typeof MaterialIcons>['name'];
  size?: number;
  color: ColorValue;
};

export function Icon({ sf, md, size = 20, color }: Props) {
  if (process.env.EXPO_OS === 'ios') {
    return <SymbolView name={sf} tintColor={color} size={size} resizeMode="scaleAspectFit" />;
  }
  return <MaterialIcons name={md} size={size} color={color} />;
}

export type IconPair = Pick<Props, 'sf' | 'md'>;

export const ICONS = {
  phone: { sf: 'phone.fill', md: 'phone' },
  directions: { sf: 'arrow.triangle.turn.up.right.diamond.fill', md: 'directions' },
  share: { sf: 'square.and.arrow.up', md: 'share' },
  location: { sf: 'location.fill', md: 'my-location' },
  verified: { sf: 'checkmark.seal.fill', md: 'verified' },
  chevron: { sf: 'chevron.right', md: 'chevron-right' },
  warning: { sf: 'exclamationmark.triangle.fill', md: 'warning' },
  clock: { sf: 'clock', md: 'schedule' },
  pin: { sf: 'mappin.and.ellipse', md: 'place' },
  add: { sf: 'plus.circle.fill', md: 'add-circle' },
  remove: { sf: 'xmark.circle.fill', md: 'cancel' },
  person: { sf: 'person.crop.circle.fill', md: 'account-circle' },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', md: 'logout' },
  info: { sf: 'info.circle', md: 'info-outline' },
  message: { sf: 'message.fill', md: 'sms' },
  language: { sf: 'globe', md: 'language' },
  appearance: { sf: 'circle.lefthalf.filled', md: 'brightness-6' },
  update: { sf: 'arrow.down.circle', md: 'system-update' },
  switchAccount: { sf: 'person.2', md: 'swap-horiz' },
  check: { sf: 'checkmark.circle.fill', md: 'check-circle' },
  checkmark: { sf: 'checkmark', md: 'check' },
  heart: { sf: 'heart', md: 'favorite-border' },
  heartFill: { sf: 'heart.fill', md: 'favorite' },
  qr: { sf: 'qrcode', md: 'qr-code' },
  scan: { sf: 'qrcode.viewfinder', md: 'qr-code-scanner' },
  search: { sf: 'magnifyingglass', md: 'search' },
  telegram: { sf: 'paperplane.fill', md: 'send' },
  filter: { sf: 'slider.horizontal.3', md: 'tune' },
  camera: { sf: 'camera.fill', md: 'photo-camera' },
  edit: { sf: 'pencil', md: 'edit' },
  photo: { sf: 'photo.on.rectangle', md: 'photo-library' },
  trash: { sf: 'trash', md: 'delete-outline' },
  layers: { sf: 'square.3.layers.3d', md: 'layers' },
  traffic: { sf: 'car.fill', md: 'traffic' },
} as const satisfies Record<string, IconPair>;
