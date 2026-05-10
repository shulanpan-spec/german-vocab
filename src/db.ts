import Dexie, { type EntityTable } from 'dexie';
import {
  DEFAULT_SETTINGS,
  type Grade,
  type ReviewLog,
  type ReviewState,
  type Settings,
  type Word,
} from './types';

class GermanDB extends Dexie {
  words!: EntityTable<Word, 'id'>;
  review_state!: EntityTable<ReviewState, 'word_id'>;
  review_log!: EntityTable<ReviewLog, 'id'>;
  settings!: EntityTable<Settings, 'key'>;

  constructor() {
    super('german_b2');
    this.version(1).stores({
      words: '&id, lektion, pos, german',
      review_state: '&word_id, due_at, repetitions',
      review_log: '++id, word_id, timestamp',
      settings: '&key',
    });
  }
}

export const db = new GermanDB();

export async function getOrCreateSettings(): Promise<Settings> {
  const existing = await db.settings.get('singleton');
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}

export async function dueWordIds(now: number): Promise<string[]> {
  const allIds = (await db.words.toCollection().primaryKeys()) as string[];
  const states = await db.review_state.toArray();
  const stateMap = new Map(states.map((s) => [s.word_id, s]));
  const due: string[] = [];
  for (const id of allIds) {
    const s = stateMap.get(id);
    if (!s || s.due_at <= now) due.push(id);
  }
  return due;
}

export async function saveReview(
  next: ReviewState,
  prev_interval: number,
  grade: Grade,
  now: number,
): Promise<void> {
  await db.transaction('rw', db.review_state, db.review_log, async () => {
    await db.review_state.put(next);
    await db.review_log.add({
      word_id: next.word_id,
      grade,
      timestamp: now,
      prev_interval,
      next_interval: next.interval,
    });
  });
}
