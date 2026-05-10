import { db } from '../db';
import { navigate } from '../router';
import type { Word, ReviewState } from '../types';

export async function renderLibrary(root: HTMLElement): Promise<void | (() => void)> {
  const words = await db.words.toArray();
  const states = await db.review_state.toArray();
  const stateMap = new Map(states.map((s) => [s.word_id, s]));

  root.innerHTML = `
    <div class="min-h-full flex flex-col">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/home" class="text-gray-500">←</a>
        <h1 class="text-2xl font-serif">词库</h1>
        <span class="text-sm text-gray-400 ml-auto">${words.length} 词</span>
      </header>
      <div class="px-5 pb-3 flex gap-2">
        <input id="q" class="flex-1 rounded-xl bg-gray-100 px-4 py-2" placeholder="搜索德语 / 中文" />
        <select id="filter" class="rounded-xl bg-gray-100 px-2">
          <option value="all">全部</option>
          <option value="due">到期</option>
          <option value="new">未学</option>
          <option value="leech">困难 (≥3 失败)</option>
        </select>
      </div>
      <ul id="list" class="px-3 flex-1 overflow-auto"></ul>
    </div>
  `;
  const listEl = root.querySelector('#list') as HTMLUListElement;
  const qInput = root.querySelector('#q') as HTMLInputElement;
  const filterSel = root.querySelector('#filter') as HTMLSelectElement;

  const failureCount = await failureCounts();

  const render = (): void => {
    const q = qInput.value.trim().toLowerCase();
    const f = filterSel.value;
    const now = Date.now();
    const filtered = words.filter((w) => {
      if (q) {
        const hit =
          w.german.toLowerCase().includes(q) ||
          w.chinese.some((c) => c.includes(q));
        if (!hit) return false;
      }
      const s = stateMap.get(w.id);
      if (f === 'due') return s ? s.due_at <= now : true;
      if (f === 'new') return !s;
      if (f === 'leech') return (failureCount.get(w.id) ?? 0) >= 3;
      return true;
    });
    listEl.innerHTML = filtered
      .map((w) => renderRow(w, stateMap.get(w.id)))
      .join('');
  };

  const onClick = (e: Event): void => {
    const li = (e.target as HTMLElement).closest('li[data-id]');
    if (li) navigate(`#/word/${(li as HTMLElement).dataset.id}`);
  };
  listEl.addEventListener('click', onClick);
  qInput.addEventListener('input', render);
  filterSel.addEventListener('change', render);
  render();

  return () => listEl.removeEventListener('click', onClick);
}

function renderRow(w: Word, s?: ReviewState): string {
  const meta = s
    ? `<span class="text-xs text-gray-400">EF ${s.easiness.toFixed(1)} · ${s.repetitions}×</span>`
    : `<span class="text-xs text-blue-500">未学</span>`;
  const head = w.article ? `${w.article} ${w.german}` : w.german;
  return `
    <li data-id="${w.id}" class="px-2 py-3 border-b border-gray-100 flex items-center gap-3">
      <div class="flex-1">
        <div class="font-serif">${escapeHtml(head)}</div>
        <div class="text-xs text-gray-500">${w.chinese.map(escapeHtml).join(' · ')}</div>
      </div>
      ${meta}
    </li>`;
}

async function failureCounts(): Promise<Map<string, number>> {
  const logs = await db.review_log.toArray();
  const m = new Map<string, number>();
  for (const l of logs) if (l.grade < 2) m.set(l.word_id, (m.get(l.word_id) ?? 0) + 1);
  return m;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
