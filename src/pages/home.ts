import { db, dueWordIds } from '../db';
import { navigate } from '../router';
import { computeStreak } from '../lib/streak';

export function renderHome(root: HTMLElement): void | (() => void) {
  root.innerHTML = `
    <div class="min-h-full flex flex-col">
      <header class="px-5 pt-8 pb-4">
        <h1 class="text-3xl font-serif font-semibold">Deutsch B2</h1>
        <p class="text-sm text-gray-500" id="subtitle">…</p>
      </header>
      <main class="px-5 flex-1 flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="due">–</div>
            <div class="text-xs text-gray-500 mt-1">待复习</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="newcount">–</div>
            <div class="text-xs text-gray-500 mt-1">新词</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="streak">–</div>
            <div class="text-xs text-gray-500 mt-1">连续</div>
          </div>
        </div>
        <button id="start" class="mt-4 rounded-2xl bg-gray-900 text-white py-5 text-lg font-medium">
          开始今日学习
        </button>
        <nav class="mt-auto py-4 flex justify-around text-sm text-gray-600">
          <a href="#/library">📚 词库</a>
          <a href="#/settings">⚙️ 设置</a>
        </nav>
      </main>
    </div>
  `;

  void (async () => {
    const now = Date.now();
    const dueAll = await dueWordIds(now);
    const states = await db.review_state.toArray();
    const seenIds = new Set(states.map((s) => s.word_id));
    const allIds = (await db.words.toCollection().primaryKeys()) as string[];
    const newCount = allIds.filter((id) => !seenIds.has(id)).length;
    const reviewDue = dueAll.filter((id) => seenIds.has(id)).length;
    const logs = await db.review_log.toArray();
    const streak = computeStreak(logs.map((l) => l.timestamp), now);

    root.querySelector('#due')!.textContent = String(reviewDue);
    root.querySelector('#newcount')!.textContent = String(newCount);
    root.querySelector('#streak')!.textContent = String(streak);
    root.querySelector('#subtitle')!.textContent = `${dueAll.length} 张卡待学`;
  })();

  const onClick = () => navigate('#/session');
  root.querySelector('#start')!.addEventListener('click', onClick);
  return () => root.querySelector('#start')?.removeEventListener('click', onClick);
}
