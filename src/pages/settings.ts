import { db } from '../db';
import { getSettings, updateSettings } from '../store';
import { getGeminiKey, setGeminiKey } from '../lib/gemini';

export async function renderSettings(root: HTMLElement): Promise<void | (() => void)> {
  const s = getSettings();
  root.innerHTML = `
    <div class="min-h-full">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/home" class="text-gray-500">←</a>
        <h1 class="text-2xl font-serif">设置</h1>
      </header>
      <main class="px-5 flex flex-col gap-4">
        <label class="flex justify-between items-center">
          <span>每日新词数</span>
          <input id="daily" type="number" min="0" max="100" value="${s.daily_new_target}" class="w-20 rounded bg-gray-100 px-2 py-1 text-right">
        </label>
        <label class="flex justify-between items-center">
          <span>单次卡片数</span>
          <input id="size" type="number" min="1" max="100" value="${s.session_size}" class="w-20 rounded bg-gray-100 px-2 py-1 text-right">
        </label>
        <label class="flex justify-between items-center">
          <span>语音</span>
          <input id="voice" type="checkbox" ${s.voice_enabled ? 'checked' : ''}>
        </label>
        <label class="flex justify-between items-center">
          <span>语速 ${s.voice_rate.toFixed(1)}</span>
          <input id="rate" type="range" min="0.5" max="1.3" step="0.1" value="${s.voice_rate}">
        </label>

        <hr class="my-3">

        <h3 class="text-sm font-semibold">Gemini API（用于"添加单词"的 🤖 自动解析）</h3>
        <label class="text-sm">
          <span class="text-gray-500">API key（仅存本机 localStorage，导出 JSON 不含）</span>
          <input id="gkey" type="password" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs" placeholder="AIzaSy..." value="${getGeminiKey()}">
        </label>
        <div class="flex gap-2 items-center">
          <button id="gkey-save" class="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium">保存 key</button>
          <button id="gkey-clear" class="rounded-xl bg-gray-100 text-gray-600 px-3 py-2 text-sm">清除</button>
          <span id="gkey-status" class="text-sm text-gray-500"></span>
        </div>
        <p class="text-xs text-gray-400">免费 key: <a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 underline">aistudio.google.com/apikey</a> · 当前: ${getGeminiKey() ? '<span class="text-green-700">已配置</span>' : '<span class="text-gray-400">未配置</span>'}</p>

        <hr class="my-3">

        <h3 class="text-sm font-semibold">数据</h3>
        <button id="export" class="rounded-xl bg-gray-100 py-2">导出 JSON</button>
        <input id="importFile" type="file" accept="application/json" class="hidden">
        <button id="import" class="rounded-xl bg-gray-100 py-2">导入 JSON</button>
        <button id="reset" class="rounded-xl bg-red-100 py-2 text-red-700">清空数据库（危险）</button>
        <p id="msg" class="text-sm text-gray-500"></p>
      </main>
    </div>
  `;

  const msg = root.querySelector('#msg') as HTMLParagraphElement;

  const persist = async (): Promise<void> => {
    await updateSettings({
      daily_new_target: Number((root.querySelector('#daily') as HTMLInputElement).value),
      session_size: Number((root.querySelector('#size') as HTMLInputElement).value),
      voice_enabled: (root.querySelector('#voice') as HTMLInputElement).checked,
      voice_rate: Number((root.querySelector('#rate') as HTMLInputElement).value),
    });
    msg.textContent = '已保存';
    setTimeout(() => (msg.textContent = ''), 1500);
  };
  root.querySelectorAll('input').forEach((el) => {
    if (el.id === 'gkey') return;
    el.addEventListener('change', persist);
  });

  const gkeyInput = root.querySelector('#gkey') as HTMLInputElement;
  const gkeyStatus = root.querySelector('#gkey-status') as HTMLSpanElement;
  const flashStatus = (msg: string, ok = true): void => {
    gkeyStatus.textContent = msg;
    gkeyStatus.className = `text-sm ${ok ? 'text-green-700' : 'text-red-600'}`;
    setTimeout(() => (gkeyStatus.textContent = ''), 3000);
  };
  root.querySelector('#gkey-save')!.addEventListener('click', () => {
    const v = gkeyInput.value.trim();
    if (!v) {
      flashStatus('未输入 key', false);
      return;
    }
    setGeminiKey(v);
    flashStatus('✓ 已保存（' + v.slice(0, 8) + '…）');
  });
  root.querySelector('#gkey-clear')!.addEventListener('click', () => {
    setGeminiKey('');
    gkeyInput.value = '';
    flashStatus('已清除');
  });

  root.querySelector('#export')!.addEventListener('click', async () => {
    const dump = {
      words: await db.words.toArray(),
      review_state: await db.review_state.toArray(),
      review_log: await db.review_log.toArray(),
      settings: await db.settings.toArray(),
      exported_at: Date.now(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `german-b2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const fileInput = root.querySelector('#importFile') as HTMLInputElement;
  root.querySelector('#import')!.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await db.transaction('rw', db.words, db.review_state, db.review_log, db.settings, async () => {
      await db.words.clear();
      await db.review_state.clear();
      await db.review_log.clear();
      await db.settings.clear();
      await db.words.bulkAdd(data.words ?? []);
      await db.review_state.bulkAdd(data.review_state ?? []);
      await db.review_log.bulkAdd(data.review_log ?? []);
      await db.settings.bulkAdd(data.settings ?? []);
    });
    msg.textContent = '导入完成，刷新页面';
  });

  root.querySelector('#reset')!.addEventListener('click', async () => {
    if (!confirm('确认清空所有数据？')) return;
    await db.delete();
    location.reload();
  });
}
