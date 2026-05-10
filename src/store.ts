import { db, getOrCreateSettings } from './db';
import { DEFAULT_SETTINGS, type Settings } from './types';

let cache: Settings = { ...DEFAULT_SETTINGS };
const listeners = new Set<(s: Settings) => void>();

export async function loadSettings(): Promise<Settings> {
  cache = await getOrCreateSettings();
  notify();
  return cache;
}

export function getSettings(): Settings {
  return cache;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  cache = { ...cache, ...patch, key: 'singleton' };
  await db.settings.put(cache);
  notify();
}

export function onSettings(fn: (s: Settings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) fn(cache);
}
