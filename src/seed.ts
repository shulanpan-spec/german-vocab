import lektion01 from '../vocab/lektion-01.json';
import lektion02 from '../vocab/lektion-02.json';
import lektion07 from '../vocab/lektion-07.json';
import { db } from './db';
import type { Word } from './types';

type SeedWord = Omit<Word, 'created_at'>;

export async function seedFromArray(
  words: SeedWord[],
  now: number,
): Promise<number> {
  const ids = words.map((w) => w.id);
  const existing = new Set(
    (await db.words.where('id').anyOf(ids).primaryKeys()) as string[],
  );
  const fresh = words
    .filter((w) => !existing.has(w.id))
    .map<Word>((w) => ({ ...w, created_at: now }));
  if (fresh.length === 0) return 0;
  await db.words.bulkAdd(fresh);
  return fresh.length;
}

export async function seedAll(now = Date.now()): Promise<number> {
  // Add new Lektion files here; seedFromArray is idempotent on id, so existing
  // users get only the new entries on next load.
  const all: SeedWord[] = [
    ...(lektion01 as SeedWord[]),
    ...(lektion02 as SeedWord[]),
    ...(lektion07 as SeedWord[]),
  ];
  return seedFromArray(all, now);
}
