import type { Grade, ReviewState } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASINESS = 1.3;

export function initialReview(word_id: string, now: number): ReviewState {
  return {
    word_id,
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    due_at: now,
  };
}

export function applyGrade(
  state: ReviewState,
  grade: Grade,
  now: number,
): ReviewState {
  let { easiness, repetitions, interval } = state;

  if (grade < 2) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * easiness);
  }

  const q = grade;
  easiness = easiness + 0.1 - (3 - q) * (0.08 + (3 - q) * 0.02);
  if (easiness < MIN_EASINESS) easiness = MIN_EASINESS;

  return {
    word_id: state.word_id,
    easiness,
    repetitions,
    interval,
    due_at: now + interval * DAY_MS,
    last_grade: grade,
    last_reviewed_at: now,
  };
}
