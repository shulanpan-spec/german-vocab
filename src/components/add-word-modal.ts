import { db } from '../db';
import { recognize } from '../lib/ocr';
import { parseVocab, hasActiveKey, activeProviderLabel, type ParsedEntry } from '../lib/gemini';
import type { Article, POS, Word } from '../types';

export interface AddWordModalOpts {
  defaultLektion: number;
  onSaved: () => void;
}

export function openAddWordModal(opts: AddWordModalOpts): () => void {
  const { defaultLektion, onSaved } = opts;

  const root = document.createElement('div');
  root.className =
    'fixed inset-0 bg-black/40 z-50 flex items-end justify-center';
  root.innerHTML = `
    <div class="bg-white w-full max-w-md max-h-[92vh] rounded-t-3xl overflow-y-auto">
      <header class="sticky top-0 bg-white px-5 py-3 border-b flex items-center gap-3">
        <button id="cancel" class="text-gray-500">取消</button>
        <h2 class="flex-1 text-center font-medium">添加单词</h2>
        <button id="save" class="text-blue-600 font-medium">保存</button>
      </header>

      <div class="px-5 py-4 flex flex-col gap-3">
        <div class="flex gap-2">
          <label class="flex-1 rounded-xl bg-gray-100 py-2 px-3 text-sm flex items-center justify-center cursor-pointer">
            📷 拍照 / 相册
            <input id="img" type="file" accept="image/*" class="hidden">
          </label>
          <button id="parse" class="flex-1 rounded-xl bg-blue-100 text-blue-800 py-2 px-3 text-sm">🤖 ${activeProviderLabel()} 解析</button>
        </div>
        <div id="ocr-status" class="text-xs text-gray-500 hidden"></div>
        <textarea id="ocr" class="rounded-xl bg-gray-50 border p-2 text-sm font-mono" rows="4" placeholder="OCR 原始文本，或直接粘贴德语词列表"></textarea>

        <div id="candidates" class="hidden flex flex-col gap-2"></div>

        <hr class="my-1" id="divider">

        <details id="manual" class="text-sm">
          <summary class="text-gray-500 mb-2 cursor-pointer">手动添加一个</summary>
          <div class="flex flex-col gap-3">
            <label class="text-sm">
              <span class="text-gray-500">德语 *</span>
              <input id="german" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="z.B. Angabe">
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="text-sm">
                <span class="text-gray-500">冠词</span>
                <select id="article" class="w-full mt-1 rounded-lg bg-gray-100 px-2 py-2">
                  <option value="">—</option>
                  <option value="der">der</option>
                  <option value="die">die</option>
                  <option value="das">das</option>
                </select>
              </label>
              <label class="text-sm">
                <span class="text-gray-500">复数</span>
                <input id="plural" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="-n / -e">
              </label>
            </div>

            <label class="text-sm">
              <span class="text-gray-500">词性</span>
              <select id="pos" class="w-full mt-1 rounded-lg bg-gray-100 px-2 py-2">
                <option value="noun">noun</option>
                <option value="verb">verb</option>
                <option value="adj">adj</option>
                <option value="adv">adv</option>
                <option value="phrase">phrase</option>
              </select>
            </label>

            <label class="text-sm">
              <span class="text-gray-500">中文释义 * (/ 或换行分隔)</span>
              <textarea id="chinese" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="2"></textarea>
            </label>

            <label class="text-sm">
              <span class="text-gray-500">德德同义词</span>
              <textarea id="syn" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="1"></textarea>
            </label>
          </div>
        </details>

        <div class="grid grid-cols-3 gap-2 items-end">
          <label class="text-sm">
            <span class="text-gray-500">Lektion</span>
            <input id="lektion" type="number" min="1" max="20" value="${defaultLektion}" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2">
          </label>
          <label class="text-sm">
            <span class="text-gray-500">页码</span>
            <input id="page" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="S.54">
          </label>
          <label class="text-sm flex items-center gap-1 mb-2">
            <input id="irregular" type="checkbox">
            不规则*
          </label>
        </div>

        <p id="err" class="text-sm text-red-600 hidden"></p>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const close = (): void => {
    if (root.parentNode === document.body) document.body.removeChild(root);
  };

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) =>
    root.querySelector<T>(sel)!;

  const showErr = (msg: string): void => {
    const e = $('#err');
    e.textContent = msg;
    e.classList.remove('hidden');
    setTimeout(() => e.classList.add('hidden'), 6000);
  };

  $('#cancel').addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  // ── OCR ─────────────────────────────────────────────────────
  const imgInput = $<HTMLInputElement>('#img');
  imgInput.addEventListener('change', async () => {
    const f = imgInput.files?.[0];
    if (!f) return;
    const status = $('#ocr-status');
    status.classList.remove('hidden');
    status.textContent = '准备 OCR…';
    try {
      const text = await recognize(f, (label, pct) => {
        status.textContent = `${label} ${pct}%`;
      });
      ($('#ocr') as HTMLTextAreaElement).value = text.trim();
      status.textContent = `OCR 完成（${text.trim().length} 字符）。点 🤖 Gemini 解析。`;
    } catch (err) {
      status.textContent = '识别失败：' + String(err);
    }
  });

  // ── Gemini parse ─────────────────────────────────────────────
  $('#parse').addEventListener('click', async () => {
    if (!hasActiveKey()) {
      showErr(`未配置 ${activeProviderLabel()} API key — 去 Settings 填`);
      return;
    }
    const ocrText = ($('#ocr') as HTMLTextAreaElement).value.trim();
    if (!ocrText) {
      showErr('OCR 文本为空');
      return;
    }
    const lektion = Number(($('#lektion') as HTMLInputElement).value) || defaultLektion;
    const status = $('#ocr-status');
    status.classList.remove('hidden');
    status.textContent = `🤖 ${activeProviderLabel()} 解析中…`;
    try {
      const entries = await parseVocab(ocrText, lektion);
      status.textContent = `解析出 ${entries.length} 个词条。`;
      await renderCandidates(entries);
    } catch (err) {
      status.textContent = '解析失败：' + String(err);
    }
  });

  const renderCandidates = async (entries: ParsedEntry[]): Promise<void> => {
    const lektion = Number(($('#lektion') as HTMLInputElement).value) || defaultLektion;
    const existing = await db.words.toArray();
    const existingByLemma = new Map(existing.map((w) => [w.german.toLowerCase(), w]));

    const box = $('#candidates');
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="text-gray-500">${entries.length} 个候选</span>
        <div class="flex gap-2">
          <button id="all" class="text-blue-600 text-xs">全选</button>
          <button id="none" class="text-gray-500 text-xs">取消</button>
        </div>
      </div>
      <ul class="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto">
        ${entries.map((e, i) => {
          const dup = existingByLemma.get(e.german.toLowerCase());
          const head = e.article ? `${e.article} ${e.german}` : e.german;
          const tail = e.plural ? `, ${escapeHtml(e.plural)}` : '';
          return `
            <li class="flex items-start gap-2 py-1.5 px-2 rounded ${dup ? 'bg-yellow-50' : 'bg-gray-50'}">
              <input type="checkbox" data-i="${i}" ${dup ? '' : 'checked'} class="mt-1">
              <div class="flex-1 text-sm">
                <div class="font-serif">${escapeHtml(head)}${tail} <span class="text-xs text-gray-400">${e.pos}${e.irregular ? ' *' : ''}</span></div>
                <div class="text-xs text-gray-600">${e.chinese.map(escapeHtml).join(' · ')}</div>
                ${e.german_synonyms?.length ? `<div class="text-xs text-gray-500 italic">≈ ${e.german_synonyms.map(escapeHtml).join(', ')}</div>` : ''}
                ${dup ? `<div class="text-xs text-yellow-700">⚠️ 已存在</div>` : ''}
              </div>
            </li>`;
        }).join('')}
      </ul>
      <button id="bulk" class="rounded-xl bg-gray-900 text-white py-3 mt-2 font-medium">导入选中</button>
    `;

    const setAll = (v: boolean) =>
      box.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((c) => (c.checked = v));
    box.querySelector('#all')!.addEventListener('click', () => setAll(true));
    box.querySelector('#none')!.addEventListener('click', () => setAll(false));

    box.querySelector('#bulk')!.addEventListener('click', async () => {
      const checked = [...box.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked')];
      const picked = checked.map((c) => entries[Number(c.dataset.i)]);
      const page = ($('#page') as HTMLInputElement).value.trim();
      const now = Date.now();
      const words: Word[] = picked.map((e) => ({
        id: 'u-' + (crypto.randomUUID?.() ?? String(now) + Math.random().toString(36).slice(2)),
        german: e.german,
        ...(e.article ? { article: e.article } : {}),
        ...(e.plural ? { plural: e.plural } : {}),
        pos: e.pos,
        chinese: e.chinese,
        german_synonyms: e.german_synonyms ?? [],
        lektion,
        ...(page ? { page } : {}),
        ...(e.irregular ? { irregular: true } : {}),
        source: 'gemini',
        created_at: now,
      }));
      if (!words.length) {
        showErr('没选中任何条目');
        return;
      }
      try {
        await db.words.bulkPut(words);
        close();
        onSaved();
      } catch (err) {
        showErr('导入失败：' + String(err));
      }
    });
  };

  // ── Manual single-word save ──────────────────────────────────
  $('#save').addEventListener('click', async () => {
    const german = ($('#german') as HTMLInputElement).value.trim();
    const chineseRaw = ($('#chinese') as HTMLTextAreaElement).value.trim();
    if (!german) return showErr('德语不能为空（或用 🤖 Gemini 批量导入）');
    if (!chineseRaw) return showErr('中文释义不能为空');
    const chinese = chineseRaw.split(/[/\n,，;]+/).map((s) => s.trim()).filter(Boolean);
    const synRaw = ($('#syn') as HTMLTextAreaElement).value.trim();
    const synonyms = synRaw ? synRaw.split(/[/\n,，;]+/).map((s) => s.trim()).filter(Boolean) : [];
    const articleVal = ($('#article') as HTMLSelectElement).value as Article | '';
    const plural = ($('#plural') as HTMLInputElement).value.trim();
    const pos = ($('#pos') as HTMLSelectElement).value as POS;
    const lektion = Number(($('#lektion') as HTMLInputElement).value) || defaultLektion;
    const page = ($('#page') as HTMLInputElement).value.trim();
    const irregular = ($('#irregular') as HTMLInputElement).checked;

    const word: Word = {
      id: 'u-' + (crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)),
      german,
      ...(articleVal ? { article: articleVal } : {}),
      ...(plural ? { plural } : {}),
      pos,
      chinese,
      german_synonyms: synonyms,
      lektion,
      ...(page ? { page } : {}),
      ...(irregular ? { irregular: true } : {}),
      source: 'user',
      created_at: Date.now(),
    };

    try {
      await db.words.add(word);
      close();
      onSaved();
    } catch (err) {
      showErr('保存失败：' + String(err));
    }
  });

  return close;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}
