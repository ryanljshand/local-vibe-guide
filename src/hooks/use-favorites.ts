import { useCallback, useSyncExternalStore } from 'react';

// A tiny localStorage-backed store for saved activity ids, shared across every
// component instance via useSyncExternalStore so hearts stay in sync everywhere.

const STORAGE_KEY = 'lvg.favorites';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

let ids: string[] = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write failures (private mode, quota, etc.) — state still lives in memory.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      ids = read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function toggle(id: string) {
  ids = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  persist();
  emit();
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, () => ids, () => ids);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  return { favorites, isFavorite, toggle };
}
