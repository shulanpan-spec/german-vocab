import { beforeEach, describe, it, expect } from 'vitest';
import { db } from '../src/db';
import { seedFromArray } from '../src/seed';
import type { Word } from '../src/types';

const fixture: Omit<Word, 'created_at'>[] = [
  { id: 'a', german: 'Apfel', article: 'der', pos: 'noun', chinese: ['苹果'], german_synonyms: [], lektion: 1 },
  { id: 'b', german: 'gehen', pos: 'verb', chinese: ['去'], german_synonyms: [], lektion: 1 },
];

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('seedFromArray', () => {
  it('inserts new words', async () => {
    const inserted = await seedFromArray(fixture, 100);
    expect(inserted).toBe(2);
    const all = await db.words.toArray();
    expect(all).toHaveLength(2);
    expect(all[0].created_at).toBe(100);
  });

  it('skips ids that already exist', async () => {
    await seedFromArray(fixture, 100);
    const inserted = await seedFromArray(fixture, 200);
    expect(inserted).toBe(0);
    const all = await db.words.toArray();
    expect(all).toHaveLength(2);
    expect(all.every((w) => w.created_at === 100)).toBe(true);
  });

  it('inserts only the new ones in a mixed batch', async () => {
    await seedFromArray([fixture[0]], 100);
    const inserted = await seedFromArray(fixture, 200);
    expect(inserted).toBe(1);
    const a = await db.words.get('a');
    const b = await db.words.get('b');
    expect(a?.created_at).toBe(100);
    expect(b?.created_at).toBe(200);
  });
});
