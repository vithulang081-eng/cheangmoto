import 'expo-sqlite/localStorage/install';

import { createContext, type ReactNode, use, useEffect, useState } from 'react';

import type { Mechanic } from '@/lib/mechanics';

const STORAGE_KEY = 'cheangmoto.favorites';

type FavoritesValue = {
  /** Most recently saved first. Stored on the device, so they open offline too. */
  favorites: Mechanic[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (mechanic: Mechanic) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

function load(): Mechanic[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Mechanic[]) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Mechanic[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Best effort: the list still works for this session.
    }
  }, [favorites]);

  const value: FavoritesValue = {
    favorites,
    isFavorite: (id) => favorites.some((m) => m.id === id),
    toggleFavorite: (mechanic) =>
      setFavorites((list) => {
        if (list.some((m) => m.id === mechanic.id)) return list.filter((m) => m.id !== mechanic.id);
        // Distance changes with the rider; don't freeze it in storage.
        const { distance_m: _distance, ...rest } = mechanic;
        return [rest, ...list];
      }),
  };

  return <FavoritesContext value={value}>{children}</FavoritesContext>;
}

export function useFavorites() {
  const value = use(FavoritesContext);
  if (!value) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return value;
}
