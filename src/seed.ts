import lektion01 from '../vocab/lektion-01.json';
import lektion02 from '../vocab/lektion-02.json';
import lektion03 from '../vocab/lektion-03.json';
import lektion04 from '../vocab/lektion-04.json';
import lektion05 from '../vocab/lektion-05.json';
import lektion06 from '../vocab/lektion-06.json';
import lektion07 from '../vocab/lektion-07.json';
import lektion08 from '../vocab/lektion-08.json';
import lektion09 from '../vocab/lektion-09.json';
import lektion10 from '../vocab/lektion-10.json';
import lektion11 from '../vocab/lektion-11.json';
import lektion12 from '../vocab/lektion-12.json';
import lektion13 from '../vocab/lektion-13.json';
import lektion14 from '../vocab/lektion-14.json';
import lektion15 from '../vocab/lektion-15.json';
import anhang from '../vocab/anhang.json';
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
    ...(lektion03 as SeedWord[]),
    ...(lektion04 as SeedWord[]),
    ...(lektion05 as SeedWord[]),
    ...(lektion06 as SeedWord[]),
    ...(lektion07 as SeedWord[]),
    ...(lektion08 as SeedWord[]),
    ...(lektion09 as SeedWord[]),
    ...(lektion10 as SeedWord[]),
    ...(lektion11 as SeedWord[]),
    ...(lektion12 as SeedWord[]),
    ...(lektion13 as SeedWord[]),
    ...(lektion14 as SeedWord[]),
    ...(lektion15 as SeedWord[]),
    ...(anhang as SeedWord[]),
  ];
  return seedFromArray(all, now);
}
