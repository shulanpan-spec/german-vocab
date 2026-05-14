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
            <div class="text-xs text-gray-500 mt-1">今日待复习</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="newcount">–</div>
            <div class="text-xs text-gray-500 mt-1">未学新词</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="streak">–</div>
            <div class="text-xs text-gray-500 mt-1">连续天数</div>
          </div>
        </div>
        <button id="start" class="mt-4 rounded-2xl bg-gray-900 text-white py-5 text-lg font-medium">
          开始今日学习
        </button>
        <p class="text-xs text-gray-400 text-center -mt-2" id="hint"></p>
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

    const subtitle = root.querySelector('#subtitle')!;
    const hint = root.querySelector('#hint')!;
    const startBtn = root.querySelector('#start') as HTMLButtonElement;
    if (dueAll.length > 0) {
      subtitle.textContent = `${dueAll.length} 张卡待学`;
      hint.textContent = '';
    } else if (allIds.length > 0) {
      subtitle.textContent = `今日已完成 · 词库 ${allIds.length} 词`;
      startBtn.textContent = '开始加练';
      hint.textContent = '今日待复习已清空，加练即将到期的单词';
    } else {
      subtitle.textContent = '词库还是空的';
      startBtn.disabled = true;
      startBtn.classList.add('opacity-50');
      hint.textContent = '去词库添加单词';
    }
  })();

  const onClick = () => navigate('#/session');
  root.querySelector('#start')!.addEventListener('click', onClick);
  return () => root.querySelector('#start')?.removeEventListener('click', onClick);
}
