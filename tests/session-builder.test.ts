import { describe, it, expect } from 'vitest';
import { buildChoices } from '../src/lib/session-builder';
import type { Word } from '../src/types';

const w = (id: string, chinese: string[], lektion = 7): Word => ({
  id, german: 'X', pos: 'noun', chinese, german_synonyms: [], lektion, created_at: 0,
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
