import { db, dueWordIds, saveReview } from '../db';
import { applyGrade, initialReview } from '../srs';
import { renderCard, renderDetail, type CardChoice } from '../components/card';
import { buildChoices, pickExtraPractice, pickSessionWords, requeueForRelearn } from '../lib/session-builder';
import { getSettings } from '../store';
import { navigate } from '../router';
import type { Grade, Word } from '../types';

export async function renderSession(root: HTMLElement): Promise<void | (() => void)> {
  root.innerHTML = '<p class="p-5 text-gray-500">加载中…</p>';

  const now = Date.now();
  const settings = getSettings();
  const allWords = await db.words.toArray();
  const wordsById = new Map(allWords.map((w) => [w.id, w]));
  const states = await db.review_state.toArray();
  const seen = new Set(states.map((s) => s.word_id));
  const dueIds = await dueWordIds(now);
  const due: Word[] = [];
  const newWords: Word[] = [];
  for (const id of dueIds) {
    const w = wordsById.get(id);
    if (!w) continue;
    if (seen.has(id)) due.push(w); else newWords.push(w);
  }
  let queue = pickSessionWords(due, newWords, settings.session_size, settings.daily_new_target);
  let extraPractice = false;
  if (queue.length === 0) {
    queue = pickExtraPractice(allWords, states, settings.session_size);
    extraPractice = queue.length > 0;
  }

  if (queue.length === 0) {
    root.innerHTML = `
      <div class="p-8 text-center">
        <p class="text-2xl mb-4">📭</p>
        <p>词库还是空的，去添加一些单词吧。</p>
        <button id="back" class="mt-6 rounded-2xl bg-gray-900 text-white px-6 py-3">回首页</button>
      </div>`;
    root.querySelector('#back')!.addEventListener('click', () => navigate('#/home'));
    return;
  }

  let i = 0;
  const relearnCounts = new Map<string, number>();
  let cleanupCard: (() => void) | null = null;
  let cleanupDetail: (() => void) | null = null;

  const container = document.createElement('div');
  container.className = 'min-h-full flex flex-col';
  container.innerHTML = `
    <div class="px-5 pt-4">
      <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div id="bar" class="h-full bg-gray-900 transition-all" style="width:0%"></div>
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span id="mode">${extraPractice ? '加练模式' : ''}</span>
        <span id="counter"></span>
      </div>
    </div>
    <div id="card-host" class="flex-1"></div>
  `;
  root.innerHTML = '';
  root.appendChild(container);
  const host = container.querySelector('#card-host') as HTMLDivElement;
  const bar = container.querySelector('#bar') as HTMLDivElement;
  const counter = container.querySelector('#counter') as HTMLDivElement;

  const finish = (): void => {
    bar.style.width = '100%';
    const doneLabel = extraPractice ? '加练完成' : '今日学习完成';
    host.innerHTML = `
      <div class="p-8 text-center">
        <p class="text-3xl mb-4">✅</p>
        <p>${doneLabel} (${queue.length} 张)</p>
        <div class="mt-6 flex flex-col gap-3 items-center">
          <button id="again" class="rounded-2xl bg-gray-900 text-white px-6 py-3">再来一组</button>
          <button id="back" class="rounded-2xl bg-gray-100 text-gray-900 px-6 py-3">回首页</button>
        </div>
      </div>`;
    host.querySelector('#back')!.addEventListener('click', () => navigate('#/home'));
    host.querySelector('#again')!.addEventListener('click', () => {
      void renderSession(root);
    });
  };

  const commit = async (word: Word, grade: Grade): Promise<void> => {
    const t = Date.now();
    const prev = await db.review_state.get(word.id);
    const base = prev ?? initialReview(word.id, t);
    const nextState = applyGrade(base, grade, t);
    await saveReview(nextState, base.interval, grade, t);
  };

  const next = (): void => {
    cleanupCard?.(); cleanupCard = null;
    cleanupDetail?.(); cleanupDetail = null;
    if (i >= queue.length) {
      finish();
      return;
    }
    const word = queue[i];
    const total = queue.length;
    bar.style.width = `${(i / total) * 100}%`;
    const isRelearn = (relearnCounts.get(word.id) ?? 0) > 0;
    counter.textContent = `${i + 1} / ${total}${isRelearn ? ' · 重学' : ''}`;
    const sameLektionPos = allWords.filter((w) => w.lektion === word.lektion && w.pos === word.pos);
    const pool = sameLektionPos.length >= 3 ? sameLektionPos : allWords;
    const choices: CardChoice[] = buildChoices(word, pool);
    cleanupCard = renderCard(host, {
      word,
      choices,
      onPick: ({ picked }) => {
        const defaultGrade: 0 | 2 =
          picked.kind === 'option' && picked.correct ? 2 : 0;
        cleanupDetail = renderDetail(host, word, defaultGrade, async (grade) => {
          await commit(word, grade);
          if (grade === 0 || grade === 1) {
            const cnt = relearnCounts.get(word.id) ?? 0;
            const before = queue.length;
            queue = requeueForRelearn(queue, i, grade, cnt);
            if (queue.length > before) {
              relearnCounts.set(word.id, cnt + 1);
            }
          }
          i += 1;
          next();
        });
      },
    });
  };

  next();

  return () => {
    cleanupCard?.();
    cleanupDetail?.();
  };
}
