import { describe, it, expect } from 'vitest';
import { applyGrade, initialReview, DAY_MS } from '../src/srs';
import type { ReviewState } from '../src/types';

const baseState = (over: Partial<ReviewState> = {}): ReviewState => ({
  word_id: 'w1',
  easiness: 2.5,
  interval: 0,
  repetitions: 0,
  due_at: 0,
  ...over,
});

describe('initialReview', () => {
  it('creates a review state due now with defaults', () => {
    const now = 1_000_000;
    const r = initialReview('w1', now);
    expect(r).toEqual({
      word_id: 'w1',
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      due_at: now,
    });
  });
});

describe('applyGrade — pass cases (grade >= 2)', () => {
  it('first pass sets repetitions=1, interval=1d', () => {
    const now = 1_700_000_000_000;
    const next = applyGrade(baseState(), 2, now);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.due_at).toBe(now + 1 * DAY_MS);
    expect(next.last_grade).toBe(2);
    expect(next.last_reviewed_at).toBe(now);
  });

  it('second pass sets interval=3d', () => {
    const now = 0;
    const next = applyGrade(baseState({ repetitions: 1, interval: 1 }), 2, now);
    expect(next.repetitions).toBe(2);
    expect(next.interval).toBe(3);
    expect(next.due_at).toBe(3 * DAY_MS);
  });

  it('third pass uses easiness multiplier', () => {
    const now = 0;
    const next = applyGrade(
      baseState({ repetitions: 2, interval: 3, easiness: 2.5 }),
      2,
      now,
    );
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(8);
  });

  it('grade 3 nudges easiness up', () => {
    const next = applyGrade(baseState(), 3, 0);
    expect(next.easiness).toBeGreaterThan(2.5);
  });

  it('grade 2 keeps easiness flat', () => {
    const next = applyGrade(baseState(), 2, 0);
    expect(next.easiness).toBeCloseTo(2.5, 5);
  });
});

describe('applyGrade — fail cases (grade < 2)', () => {
  it('grade 0 resets repetitions and interval to 1d', () => {
    const now = 0;
    const next = applyGrade(
      baseState({ repetitions: 5, interval: 30, easiness: 2.7 }),
      0,
      now,
    );
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(1);
    expect(next.due_at).toBe(1 * DAY_MS);
  });

  it('grade 1 also resets', () => {
    const next = applyGrade(baseState({ repetitions: 3, interval: 7 }), 1, 0);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(1);
  });

  it('grade 0 lowers easiness', () => {
    const next = applyGrade(baseState({ easiness: 2.5 }), 0, 0);
    expect(next.easiness).toBeLessThan(2.5);
  });

  it('easiness floored at 1.3', () => {
    const next = applyGrade(baseState({ easiness: 1.3 }), 0, 0);
    expect(next.easiness).toBe(1.3);
  });
});
