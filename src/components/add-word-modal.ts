import { db } from '../db';
import { recognize } from '../lib/ocr';
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
            📷 拍照 / 选图识别
            <input id="img" type="file" accept="image/*" capture="environment" class="hidden">
          </label>
        </div>
        <div id="ocr-status" class="text-xs text-gray-500 hidden"></div>
        <textarea id="ocr" class="rounded-xl bg-gray-50 border p-2 text-sm" rows="4" placeholder="OCR 原始文本（可粘贴 / 编辑后参考）"></textarea>

        <hr class="my-1">

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
            <input id="plural" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="-n / -e / Anlässe">
          </label>
        </div>

        <label class="text-sm">
          <span class="text-gray-500">词性</span>
          <select id="pos" class="w-full mt-1 rounded-lg bg-gray-100 px-2 py-2">
            <option value="noun">noun (名词)</option>
            <option value="verb">verb (动词)</option>
            <option value="adj">adj (形容词)</option>
            <option value="adv">adv (副词)</option>
            <option value="phrase">phrase (短语)</option>
          </select>
        </label>

        <label class="text-sm">
          <span class="text-gray-500">中文释义 *（多个用 / 或换行分隔）</span>
          <textarea id="chinese" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="2" placeholder="说明 / 陈述"></textarea>
        </label>

        <label class="text-sm">
          <span class="text-gray-500">德德同义词（可选，用 , 或换行）</span>
          <textarea id="syn" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="2" placeholder="die Sprachfähigkeit"></textarea>
        </label>

        <label class="text-sm">
          <span class="text-gray-500">例句（可选）</span>
          <input id="example" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2">
        </label>

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
  };

  $('#cancel').addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  // OCR
  const imgInput = $<HTMLInputElement>('#img');
  imgInput.addEventListener('change', async () => {
    const f = imgInput.files?.[0];
    if (!f) return;
    const status = $('#ocr-status');
    status.classList.remove('hidden');
    status.textContent = '准备中…';
    try {
      const text = await recognize(f, (label, pct) => {
        status.textContent = `${label} ${pct}%`;
      });
      ($('#ocr') as HTMLTextAreaElement).value = text.trim();
      status.textContent = '识别完成。把你要的德语和中文复制到下面的字段。';
      autoFillFromOcr(text);
    } catch (err) {
      status.textContent = '识别失败：' + String(err);
    }
  });

  // Auto-fill heuristic: take first non-empty line, split German vs CJK
  const autoFillFromOcr = (raw: string): void => {
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const first = lines[0];
    const m = first.match(/^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\-\s,.]*?)([一-鿿].*)$/);
    if (m) {
      const germanPart = m[1].trim().replace(/[,.]+$/, '');
      const cn = m[2].trim();
      const articleMatch = germanPart.match(/^(der|die|das)\s+(.+)$/i);
      if (articleMatch) {
        ($('#article') as HTMLSelectElement).value = articleMatch[1].toLowerCase();
        ($('#german') as HTMLInputElement).value = articleMatch[2];
      } else {
        ($('#german') as HTMLInputElement).value = germanPart;
      }
      ($('#chinese') as HTMLTextAreaElement).value = cn;
    }
  };

  $('#save').addEventListener('click', async () => {
    const german = ($('#german') as HTMLInputElement).value.trim();
    const chineseRaw = ($('#chinese') as HTMLTextAreaElement).value.trim();
    if (!german) return showErr('德语不能为空');
    if (!chineseRaw) return showErr('中文释义不能为空');
    const chinese = chineseRaw.split(/[/\n,，;]+/).map((s) => s.trim()).filter(Boolean);
    const synRaw = ($('#syn') as HTMLTextAreaElement).value.trim();
    const synonyms = synRaw ? synRaw.split(/[/\n,，;]+/).map((s) => s.trim()).filter(Boolean) : [];
    const articleVal = ($('#article') as HTMLSelectElement).value as Article | '';
    const plural = ($('#plural') as HTMLInputElement).value.trim();
    const example = ($('#example') as HTMLInputElement).value.trim();
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
      ...(example ? { example } : {}),
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
