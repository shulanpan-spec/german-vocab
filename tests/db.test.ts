import { beforeEach, describe, it, expect } from 'vitest';
import { db, dueWordIds, getOrCreateSettings, saveReview } from '../src/db';
import { DEFAULT_SETTINGS } from '../src/types';
import type { Word } from '../src/types';

const sampleWord = (id: string, lektion = 7): Word => ({
  id,
  german: 'Angabe',
  article: 'die',
  plural: '-n',
  pos: 'noun',
  chinese: ['说明'],
  german_synonyms: [],
  lektion,
  created_at: 0,
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('settings singleton', () => {
  it('returns defaults when none stored', async () => {
    const s = await getOrCreateSettings();
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it('persists overrides', async () => {
    const s = await getOrCreateSettings();
    s.daily_new_target = 25;
    await db.settings.put(s);
    const reloaded = await getOrCreateSettings();
    expect(reloaded.daily_new_target).toBe(25);
  });
});

describe('dueWordIds', () => {
  it('returns ids of words with review_state.due_at <= now', async () => {
    await db.words.bulkPut([sampleWord('a'), sampleWord('b'), sampleWord('c')]);
    await db.review_state.bulkPut([
      { word_id: 'a', easiness: 2.5, interval: 1, repetitions: 1, due_at: 100 },
      { word_id: 'b', easiness: 2.5, interval: 1, repetitions: 1, due_at: 500 },
    ]);
    const ids = await dueWordIds(300);
    // a is due (100 <= 300), b is not (500 > 300), c has no state so it's also due (new)
    expect(ids.sort()).toEqual(['a', 'c']);
  });

  it('words without review_state count as new (always due)', async () => {
    await db.words.bulkPut([sampleWord('a'), sampleWord('b')]);
    await db.review_state.put({
      word_id: 'a', easiness: 2.5, interval: 1, repetitions: 1, due_at: 999_999,
    });
    const ids = await dueWordIds(0);
    expect(ids).toEqual(['b']);
  });
});

describe('saveReview', () => {
  it('writes review_state and review_log atomically', async () => {
    await db.words.put(sampleWord('a'));
    await saveReview({
      word_id: 'a',
      easiness: 2.6,
      interval: 3,
      repetitions: 2,
      due_at: 1234,
      last_grade: 2,
      last_reviewed_at: 100,
    }, /*prev_interval*/ 1, /*grade*/ 2, /*now*/ 100);

    const state = await db.review_state.get('a');
    expect(state?.due_at).toBe(1234);
    const logs = await db.review_log.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      word_id: 'a', grade: 2, prev_interval: 1, next_interval: 3,
    });
  });
});
