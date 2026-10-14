import { useResolvedColorScheme } from '@/hooks/use-settings';

/** Mascot brand colors (see assets/brand/BRAND-GUIDE.md). Fixed in both themes. */
export const Brand = {
  deepNavy: '#08152F',
  navy: '#123478',
  blue: '#174EA6',
  red: '#E31E32',
  gold: '#F6B91A',
  warmWhite: '#FFF9F0',
  charcoal: '#172033',
} as const;

export type Palette = {
  /** Screen background: warm white / deep navy. */
  background: string;
  /** Cards and sheets that sit on the background. */
  card: string;
  /** Inputs, unselected chips, neutral buttons. */
  fill: string;
  /** Hairline around cards so they read on warm white. */
  border: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  /** Navigation, selection and trust (navy). */
  accent: string;
  accentSoft: string;
  /** Primary actions and urgency (Cambodian red). */
  primary: string;
  /** Highlights and cultural detail, used sparingly (gold). */
  gold: string;
  goldSoft: string;
  success: string;
  danger: string;
  /** Text/icons on accent, primary and success fills. */
  onFill: string;
  shadow: string;
};

const light: Palette = {
  background: Brand.warmWhite,
  card: '#FFFFFF',
  fill: '#F4EEE4',
  border: '#EFE7DB',
  label: Brand.charcoal,
  secondaryLabel: '#5D6679',
  tertiaryLabel: '#98A0AE',
  accent: Brand.navy,
  accentSoft: '#E8EDF8',
  primary: Brand.red,
  gold: Brand.gold,
  goldSoft: '#FEF3D4',
  success: '#15803D',
  danger: Brand.red,
  onFill: '#FFFFFF',
  shadow: 'rgba(23, 32, 51, 0.12)',
};

const dark: Palette = {
  background: Brand.deepNavy,
  card: '#111F3D',
  fill: '#1A2A4C',
  border: '#1F3056',
  label: '#F4F6FA',
  secondaryLabel: '#A8B2C6',
  tertiaryLabel: '#6F7C96',
  accent: '#7EA2F2',
  accentSoft: '#1B2E5A',
  primary: '#F2394B',
  gold: Brand.gold,
  goldSoft: '#3A2F12',
  success: '#34C759',
  danger: '#FF5A69',
  onFill: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

/** Both palettes, for UI that previews a theme other than the active one. */
export const Palettes = { light, dark } as const;

export function useColors(): Palette {
  return useResolvedColorScheme() === 'dark' ? dark : light;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Type scale. Khmer glyphs stack tall, so keep sizes generous and never clip line height. */
export const Type = {
  title: { fontSize: 26, fontWeight: '800' },
  headline: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  callout: { fontSize: 15, fontWeight: '600' },
  footnote: { fontSize: 13, fontWeight: '500' },
} as const;

/** Phnom Penh (Independence Monument) — used until we know where the rider is. */
export const DEFAULT_COORDS = { latitude: 11.5564, longitude: 104.9282 };

/** How far to look for mechanics. Long highway stretches need a wide radius. */
export const SEARCH_RADIUS_KM = 30;
