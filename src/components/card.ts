import { speak } from '../tts';
import { getSettings } from '../store';
import type { Word } from '../types';

export interface CardChoice {
  text: string;
  correct: boolean;
  kind: 'option' | 'none' | 'unknown';
}

export interface CardResult {
  picked: CardChoice;
  ms: number;
}

export interface CardOpts {
  word: Word;
  choices: CardChoice[];
  onPick: (result: CardResult) => void;
}

export function renderCard(parent: HTMLElement, opts: CardOpts): () => void {
  const { word, choices, onPick } = opts;
  const start = performance.now();

  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col gap-4 px-5 py-6';
  wrap.innerHTML = `
    <div class="flex items-baseline justify-center gap-2">
      <h2 class="text-4xl font-serif">${escapeHtml(word.german)}</h2>
      <button id="speak" class="text-2xl" aria-label="发音">🔊</button>
    </div>
    ${word.article ? `<div class="text-center text-sm text-gray-500">${word.article}${word.plural ? ` · ${escapeHtml(word.plural)}` : ''}</div>` : ''}
    <div id="choices" class="flex flex-col gap-3 mt-4"></div>
  `;
  const choicesEl = wrap.querySelector('#choices') as HTMLDivElement;
  for (const [i, c] of choices.entries()) {
    const btn = document.createElement('button');
    btn.dataset.idx = String(i);
    const baseClasses =
      'w-full rounded-2xl py-4 px-5 text-left text-base active:bg-gray-200 transition';
    const kindClasses =
      c.kind === 'unknown'
        ? 'bg-gray-200 text-gray-600'
        : c.kind === 'none'
        ? 'bg-gray-100 italic'
        : 'bg-gray-100';
    btn.className = `${baseClasses} ${kindClasses}`;
    btn.textContent = c.text;
    btn.addEventListener('click', () => {
      btn.classList.remove('bg-gray-100', 'bg-gray-200');
      btn.classList.add(c.correct ? 'bg-green-200' : 'bg-red-200');
      const ms = performance.now() - start;
      setTimeout(() => onPick({ picked: c, ms }), 250);
    });
    choicesEl.appendChild(btn);
  }
  const speakBtn = wrap.querySelector('#speak') as HTMLButtonElement;
  speakBtn.addEventListener('click', () => speak(word.german, getSettings().voice_rate));

  parent.appendChild(wrap);
  if (getSettings().voice_enabled) speak(word.german, getSettings().voice_rate);

  return () => {
    if (wrap.parentNode === parent) parent.removeChild(wrap);
  };
}

export function renderDetail(
  parent: HTMLElement,
  word: Word,
  defaultGrade: 0 | 2,
  onGrade: (grade: 0 | 1 | 2 | 3) => void,
): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-5 border-t';
  const synonyms = word.german_synonyms.length
    ? `<p class="text-sm text-gray-600 italic">≈ ${word.german_synonyms.map(escapeHtml).join(', ')}</p>`
    : '';
  const example = word.example
    ? `<p class="text-sm mt-2">${escapeHtml(word.example)}</p>`
    : '';
  wrap.innerHTML = `
    <div class="flex items-baseline gap-2">
      ${word.article ? `<span class="text-gray-500">${word.article}</span>` : ''}
      <h3 class="text-2xl font-serif">${escapeHtml(word.german)}</h3>
      ${word.plural ? `<span class="text-gray-500">${escapeHtml(word.plural)}</span>` : ''}
    </div>
    <p class="text-base mt-1">${word.chinese.map(escapeHtml).join(' · ')}</p>
    ${synonyms}
    ${example}
    <p class="text-xs text-gray-400 mt-3">Lektion ${word.lektion}${word.page ? ' · ' + word.page : ''}</p>

    <div class="grid grid-cols-4 gap-2 mt-5">
      <button data-g="0" class="rounded-xl py-3 bg-red-100">不认识</button>
      <button data-g="1" class="rounded-xl py-3 bg-yellow-100">模糊</button>
      <button data-g="2" class="rounded-xl py-3 bg-green-100">认识</button>
      <button data-g="3" class="rounded-xl py-3 bg-blue-100">简单</button>
    </div>
    <p class="text-center text-xs text-gray-400 mt-2">默认: ${defaultGrade === 2 ? '认识 (2)' : '不认识 (0)'}</p>
  `;
  wrap.querySelectorAll<HTMLButtonElement>('button[data-g]').forEach((b) => {
    b.addEventListener('click', () => {
      const g = Number(b.dataset.g) as 0 | 1 | 2 | 3;
      onGrade(g);
    });
  });
  parent.appendChild(wrap);
  return () => {
    if (wrap.parentNode === parent) parent.removeChild(wrap);
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
