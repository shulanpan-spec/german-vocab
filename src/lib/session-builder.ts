import type { Word } from '../types';
import type { CardChoice } from '../components/card';

type Rand = () => number;

export function buildChoices(target: Word, pool: Word[], rand: Rand = Math.random): CardChoice[] {
  const distractorsPool = pool.filter((w) => w.id !== target.id);
  shuffle(distractorsPool, rand);
  const taken: CardChoice[] = [];
  for (const w of distractorsPool) {
    if (taken.length >= 2) break;
    const text = w.chinese[0];
    if (!text) continue;
    if (target.chinese.includes(text)) continue;
    taken.push({ text, correct: false, kind: 'option' });
  }
  const correctChoice: CardChoice = {
    text: target.chinese[0],
    correct: true,
    kind: 'option',
  };
  const opts = [...taken, correctChoice];
  shuffle(opts, rand);
  return [
    ...opts,
    { text: '以上都不对', correct: false, kind: 'none' },
    { text: '不认识', correct: false, kind: 'unknown' },
  ];
}

function shuffle<T>(arr: T[], rand: Rand): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function pickSessionWords(
  due: Word[],
  newWords: Word[],
  sessionSize: number,
  dailyNewTarget: number,
  rand: Rand = Math.random,
): Word[] {
  const n = Math.min(newWords.length, dailyNewTarget);
  const dueOnly = [...due];
  shuffle(dueOnly, rand);
  const newOnly = [...newWords].slice(0, n);
  shuffle(newOnly, rand);
  return [...dueOnly, ...newOnly].slice(0, sessionSize);
}
