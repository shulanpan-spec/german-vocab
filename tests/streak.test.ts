import { describe, it, expect } from 'vitest';
import { computeStreak, DAY } from '../src/lib/streak';

describe('computeStreak', () => {
  const day = DAY;
  it('returns 0 on no reviews', () => {
    expect(computeStreak([], 5 * day)).toBe(0);
  });
  it('counts today only', () => {
    expect(computeStreak([5 * day + 1000], 5 * day + 2000)).toBe(1);
  });
  it('counts consecutive days backwards from today', () => {
    const now = 10 * day + 1000;
    const ts = [10 * day + 100, 9 * day + 100, 8 * day + 100];
    expect(computeStreak(ts, now)).toBe(3);
  });
  it('breaks streak on missing day', () => {
    const now = 10 * day + 1000;
    const ts = [10 * day + 100, 8 * day + 100];
    expect(computeStreak(ts, now)).toBe(1);
  });
  it('counts yesterday-only as 1 (today not yet reviewed)', () => {
    const now = 10 * day + 1000;
    const ts = [9 * day + 100];
    expect(computeStreak(ts, now)).toBe(1);
  });
});
