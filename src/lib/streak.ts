export const DAY = 24 * 60 * 60 * 1000;

function dayIndex(ts: number): number {
  return Math.floor(ts / DAY);
}

export function computeStreak(timestamps: number[], now: number): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map(dayIndex));
  const today = dayIndex(now);
  let streak = 0;
  let cursor = today;
  if (!days.has(cursor)) cursor = today - 1;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}
