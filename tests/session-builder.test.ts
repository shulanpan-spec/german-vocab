import { describe, it, expect } from 'vitest';
import { buildChoices, pickExtraPractice } from '../src/lib/session-builder';
import type { ReviewState, Word } from '../src/types';

const w = (id: string, chinese: string[], lektion = 7): Word => ({
  id, german: 'X', pos: 'noun', chinese, german_synonyms: [], lektion, created_at: 0,
});

const s = (word_id: string, due_at: number): ReviewState => ({
  word_id, easiness: 2.5, interval: 1, repetitions: 1, due_at,
});

describe('buildChoices', () => {
  const pool = [
    w('a', ['苹果']),
    w('b', ['香蕉']),
    w('c', ['橙子']),
    w('d', ['西瓜']),
    w('e', ['葡萄']),
  ];
  it('always includes the correct meaning', () => {
    const target = pool[0];
    const choices = buildChoices(target, pool, () => 0);
    const correct = choices.filter((c) => c.correct);
    expect(correct).toHaveLength(1);
    expect(correct[0].text).toBe('苹果');
  });
  it('includes 3 distractors + "以上都不对" + "不认识" (5 total)', () => {
    const choices = buildChoices(pool[0], pool, () => 0);
    expect(choices).toHaveLength(5);
    expect(choices.some((c) => c.kind === 'none')).toBe(true);
    expect(choices.some((c) => c.kind === 'unknown')).toBe(true);
  });
  it('does not pick the target as a distractor', () => {
    const choices = buildChoices(pool[0], pool, () => 0);
    const distractors = choices.filter((c) => c.kind === 'option' && !c.correct);
    expect(distractors.find((d) => d.text === '苹果')).toBeUndefined();
  });
  it('falls back gracefully if pool < 3 distractors', () => {
    const small = [pool[0], pool[1]];
    const choices = buildChoices(pool[0], small, () => 0);
    const opts = choices.filter((c) => c.kind === 'option');
    expect(opts.length).toBeLessThanOrEqual(small.length);
  });
});

describe('pickExtraPractice', () => {
  const words = [
    w('a', ['苹果']),
    w('b', ['香蕉']),
    w('c', ['橙子']),
    w('d', ['西瓜']),
  ];
  it('returns words sorted by soonest due_at first', () => {
    const states = [s('a', 5000), s('b', 1000), s('c', 3000), s('d', 2000)];
    const got = pickExtraPractice(words, states, 4).map((x) => x.id);
    expect(got).toEqual(['b', 'd', 'c', 'a']);
  });
  it('caps at sessionSize', () => {
    const states = [s('a', 5000), s('b', 1000), s('c', 3000), s('d', 2000)];
    expect(pickExtraPractice(words, states, 2)).toHaveLength(2);
  });
  it('treats unreviewed words as due_at 0 (come first)', () => {
    const states = [s('a', 5000), s('b', 1000)];
    const got = pickExtraPractice(words, states, 4).map((x) => x.id);
    expect(got.slice(0, 2).sort()).toEqual(['c', 'd']);
  });
  it('returns empty when no words exist', () => {
    expect(pickExtraPractice([], [], 10)).toEqual([]);
  });
});
