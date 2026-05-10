import { db } from '../db';
import { getRouteParams, navigate } from '../router';
import { speak } from '../tts';

export async function renderWordDetail(root: HTMLElement): Promise<void | (() => void)> {
  const { id } = getRouteParams();
  const word = await db.words.get(id);
  if (!word) {
    root.innerHTML = `<p class="p-5">单词不存在</p>`;
    return;
  }
  const state = await db.review_state.get(id);
  const logs = (await db.review_log.where('word_id').equals(id).toArray())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  root.innerHTML = `
    <div class="min-h-full flex flex-col">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/library" class="text-gray-500">←</a>
        <h1 class="text-xl">单词详情</h1>
      </header>
      <main class="px-5 flex-1 flex flex-col gap-4">
        <div class="flex items-baseline gap-2">
          ${word.article ? `<span class="text-gray-500">${word.article}</span>` : ''}
          <h2 class="text-3xl font-serif">${escapeHtml(word.german)}</h2>
          ${word.plural ? `<span class="text-gray-500">${escapeHtml(word.plural)}</span>` : ''}
          <button id="speak" class="ml-2 text-2xl">🔊</button>
        </div>
        <p>${word.chinese.map(escapeHtml).join(' · ')}</p>
        ${word.german_synonyms.length ? `<p class="text-sm italic text-gray-600">≈ ${word.german_synonyms.map(escapeHtml).join(', ')}</p>` : ''}
        ${word.example ? `<p class="text-sm">${escapeHtml(word.example)}</p>` : ''}
        <p class="text-xs text-gray-400">Lektion ${word.lektion}${word.page ? ' · ' + word.page : ''} · ${word.pos}</p>

        <h3 class="mt-4 text-sm font-semibold">复习状态</h3>
        ${state
          ? `<dl class="text-sm grid grid-cols-2 gap-y-1">
              <dt class="text-gray-500">Easiness</dt><dd>${state.easiness.toFixed(2)}</dd>
              <dt class="text-gray-500">Interval</dt><dd>${state.interval} d</dd>
              <dt class="text-gray-500">Repetitions</dt><dd>${state.repetitions}</dd>
              <dt class="text-gray-500">Due</dt><dd>${new Date(state.due_at).toLocaleString()}</dd>
            </dl>
            <button id="forceDue" class="self-start text-xs text-blue-600">立即设为到期</button>`
          : `<p class="text-sm text-gray-500">还未学过</p>`
        }

        <h3 class="mt-4 text-sm font-semibold">最近 ${logs.length} 次复习</h3>
        <ul class="text-sm">
          ${logs.map((l) => `
            <li class="flex justify-between border-b border-gray-100 py-1">
              <span>${new Date(l.timestamp).toLocaleString()}</span>
              <span>grade ${l.grade} · ${l.prev_interval}d → ${l.next_interval}d</span>
            </li>`).join('')}
        </ul>
      </main>
    </div>
  `;

  root.querySelector('#speak')!.addEventListener('click', () => speak(word.german));
  root.querySelector('#forceDue')?.addEventListener('click', async () => {
    await db.review_state.update(id, { due_at: Date.now() });
    navigate('#/library');
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
