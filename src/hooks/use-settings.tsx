import 'expo-sqlite/localStorage/install';

import { createContext, type ReactNode, use, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { type Language, STRINGS, type Strings } from '@/constants/strings';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

/** Google/Apple map rendering. 'terrain' is Android (Google) only; iOS falls back to standard. */
export type MapLayer = 'standard' | 'satellite' | 'hybrid' | 'terrain';
export const MAP_LAYERS: MapLayer[] = ['standard', 'satellite', 'hybrid', 'terrain'];

type Settings = { language: Language; theme: ThemePreference; mapLayer: MapLayer; showTraffic: boolean };

const DEFAULTS: Settings = { language: 'km', theme: 'system', mapLayer: 'standard', showTraffic: false };
const STORAGE_KEY = 'cheangmoto.settings';

function load(): Settings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULTS;
    const parsed = JSON.parse(saved) as Partial<Settings>;
    return {
      language: parsed.language === 'en' ? 'en' : 'km',
      theme: THEMES.includes(parsed.theme as ThemePreference) ? (parsed.theme as ThemePreference) : 'system',
      mapLayer: MAP_LAYERS.includes(parsed.mapLayer as MapLayer) ? (parsed.mapLayer as MapLayer) : 'standard',
      showTraffic: parsed.showTraffic === true,
    };
  } catch {
    return DEFAULTS;
  }
}

type SettingsValue = Settings & {
  strings: Strings;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  setMapLayer: (layer: MapLayer) => void;
  setShowTraffic: (on: boolean) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

let currentStrings: Strings = STRINGS[DEFAULTS.language];

/** For code that runs outside React (alerts from utils). Components should call `useStrings()`. */
export function getStrings() {
  return currentStrings;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    currentStrings = STRINGS[settings.language];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage is a convenience; the choice still applies for this session.
    }
  }, [settings]);

  useEffect(() => {
    // Overrides the OS scheme app-wide so native alerts, sheets and the keyboard follow too.
    // react-native-web has no setColorScheme; there `useResolvedColorScheme` does the work.
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(settings.theme === 'system' ? 'unspecified' : settings.theme);
    }
  }, [settings.theme]);

  const value: SettingsValue = {
    ...settings,
    strings: STRINGS[settings.language],
    setLanguage: (language) => setSettings((s) => ({ ...s, language })),
    setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
    setMapLayer: (mapLayer) => setSettings((s) => ({ ...s, mapLayer })),
    setShowTraffic: (showTraffic) => setSettings((s) => ({ ...s, showTraffic })),
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings() {
  const value = use(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside <SettingsProvider>');
  return value;
}

export function useStrings(): Strings {
  return useSettings().strings;
}

/** The scheme the UI should draw with: the rider's choice, or the OS setting when set to automatic. */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { theme } = useSettings();
  if (theme !== 'system') return theme;
  return system === 'dark' ? 'dark' : 'light';
}
