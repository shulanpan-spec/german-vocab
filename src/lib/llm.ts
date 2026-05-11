import type { Article, POS } from '../types';

export interface ParsedEntry {
  german: string;
  article?: Article;
  plural?: string;
  pos: POS;
  chinese: string[];
  german_synonyms?: string[];
  irregular?: boolean;
}

// ── DeepSeek (text → JSON path, used after Tesseract OCR) ──────────────
const DS_KEY = 'deepseek_api_key';
// v4-pro replaces deepseek-chat (1M context, currently 75% discounted, smarter
// reconstruction of garbled OCR text). The old name still works as a fallback.
const DS_MODEL = 'deepseek-v4-pro';

export function getKey(): string {
  return localStorage.getItem(DS_KEY) ?? '';
}

export function setKey(key: string): void {
  if (key) localStorage.setItem(DS_KEY, key);
  else localStorage.removeItem(DS_KEY);
}

export function hasKey(): boolean {
  return getKey().length > 0;
}

// ── Zhipu GLM-4V-Flash (image → JSON path, one-step, free tier) ────────
const ZP_KEY = 'zhipu_api_key';
const ZP_MODEL = 'glm-4v-flash';

export function getZhipuKey(): string {
  return localStorage.getItem(ZP_KEY) ?? '';
}

export function setZhipuKey(key: string): void {
  if (key) localStorage.setItem(ZP_KEY, key);
  else localStorage.removeItem(ZP_KEY);
}

export function hasZhipuKey(): boolean {
  return getZhipuKey().length > 0;
}

// One-time legacy cleanup: prior versions stored Gemini key / provider toggle.
export function cleanupLegacyKeys(): void {
  localStorage.removeItem('llm_provider');
  localStorage.removeItem('gemini_api_key');
}

const TEXT_PROMPT = `You produce structured German B2 vocabulary entries for the textbook "Im Berufssprachkurs B2 — Deutsch als Zweitsprache, Kurs- und Arbeitsbuch" (Hueber). The vocabulary register is workplace / professional German for DaZ learners: topics include jobs, workplace communication, advertising, training, scheduling, customer service, complaints, and similar Berufsalltag scenarios. Translate accordingly — prefer the practical/work-context Chinese rendering over abstract academic ones.

Input: raw OCR text from a textbook vocabulary list page. The page may include noise such as page numbers (e.g. "S.54", "S.63"), section headers ("Lektion 7", "Nomen", "Verben", "Adjektive"), Chinese handwritten translations alongside German words, asterisks (*) marking irregular verbs, plural markers ("-en", "-e", "Anlässe", "Jubiläen"), articles ("der", "die", "das"), and decorative typography.

Output: a JSON object {"entries": [...]} where entries is an array of vocabulary entries. For each German lemma found in the input:

- "german": the lemma in textbook form. For nouns, the NOMINATIVE SINGULAR only (NO article, NO plural marker). For verbs, the INFINITIVE. For adjectives/adverbs/phrases, the base form. Do NOT include trailing commas, plural suffixes, or article prefixes in this field.
- "article": "der" / "die" / "das" — ONLY for nouns. Determine from context or your own knowledge of German.
- "plural": e.g. "-n", "-en", "-e", "-", "Anlässe", "Jubiläen", "Gehälter". ONLY for nouns when known or shown in source. Use the textbook conventional suffix style ("-n", "-en", etc.) when the plural is regular; use the full plural form when umlaut-changing.
- "pos": one of "noun" / "verb" / "adj" / "adv" / "phrase".
- "chinese": array of 1–3 concise Chinese translations matching the Berufssprachkurs workplace register (e.g. ["说明","陈述"], ["举办","组织"], ["谨慎的","仔细的"], ["排班","轮班"]). Use simplified Chinese. Avoid sentence-form translations.
- "german_synonyms": array of 0–3 B2-level German synonyms when natural. Include article for noun synonyms (e.g. ["die Sprachfähigkeit"]).
- "irregular": true ONLY for verbs that are irregular (marked * in source, or known: schaffen, beweisen, vermeiden, vorschreiben, bestehen, enthalten, entsprechen, aufschreiben, etc.).

Rules:
- BE EXHAUSTIVE. Extract EVERY potential German vocabulary entry visible in the OCR. Do NOT skip entries because the OCR text is messy, incomplete, or hard to read — use German morphology + textbook context to reconstruct the lemma.
- The OCR may have been run on a 2-column textbook page; reading order may be scrambled, with one column appearing after another (sometimes marked by "=== 右栏 ==="). Treat the whole text as a flat pool of candidate words.
- For B2 vocabulary (Im Berufssprachkurs B2 register), you reliably know the standard Chinese translation. Provide it. Only omit an entry if you cannot identify what the German lemma is at all.
- Skip page numbers ("S.54", "S.63"), section labels ("Lektion 7", "Nomen", "Verben", "Adjektive", "weitere Wörter", section letters like "A", "B", "C", "D"), and decorative separators.
- Skip Chinese-only lines and non-vocabulary annotations.
- If a German entry has multiple senses with different POS or articles, emit separate entries.
- The textbook may show a verb with its preposition/case, e.g. "sich auswirken auf (+ Akk.)", "klären mit (+ Dat.)". Use this as the lemma (include the preposition + case marker in "german").
- Plural notation: "-en" stays "-en"; "Anlässe" (umlaut form) becomes "Anlässe"; "Zentren" stays "Zentren". For singular-only words, omit "plural".
- Output JSON only, no commentary.`;

const VISION_PROMPT = `You produce structured German B2 vocabulary entries from a PHOTO of a Lernwortschatz page in the textbook "Im Berufssprachkurs B2 — Deutsch als Zweitsprache, Kurs- und Arbeitsbuch" (Hueber). The vocabulary register is workplace / professional German for DaZ learners (Berufsalltag).

Input: ONE image. Typical layout is 2 columns, 30–50 German lemmas grouped by POS (Nomen / Verben / Adjektive / weitere Wörter). Lines may include articles (der/die/das), plural markers ("-en", "-e", "Anlässe"), asterisks (*) for irregular verbs, page numbers (S.54), and handwritten Chinese annotations beside the German.

Output: a JSON object {"entries": [...]} where entries is an array of vocabulary entries. For each German lemma visible in the image:

- "german": the lemma in textbook form. For nouns, NOMINATIVE SINGULAR only (NO article, NO plural marker). For verbs, the INFINITIVE. For adjectives/adverbs/phrases, the base form. Do NOT include trailing commas, plural suffixes, or article prefixes in this field.
- "article": "der" / "die" / "das" — ONLY for nouns. Use the article shown on the page; if absent, use your knowledge of German.
- "plural": e.g. "-n", "-en", "-e", "-", "Anlässe", "Jubiläen", "Gehälter". ONLY for nouns when shown or known. Use the textbook conventional suffix style ("-n", "-en", etc.) for regular plurals; use the full plural form when umlaut-changing.
- "pos": one of "noun" / "verb" / "adj" / "adv" / "phrase".
- "chinese": array of 1–3 concise Chinese translations in the workplace register (e.g. ["说明","陈述"], ["举办","组织"], ["谨慎的","仔细的"], ["排班","轮班"]). Simplified Chinese, no sentences.
- "german_synonyms": array of 0–3 B2-level German synonyms when natural. Include article for noun synonyms (e.g. ["die Sprachfähigkeit"]).
- "irregular": true ONLY for verbs that are irregular (marked * in the page, or known: schaffen, beweisen, vermeiden, vorschreiben, bestehen, enthalten, entsprechen, aufschreiben, etc.).

Rules:
- BE EXHAUSTIVE. Read EVERY line in BOTH columns, top to bottom, left column first then right column. Typical Lernwortschatz pages have 30–50 entries — if your output has fewer than 25, you almost certainly missed something. Re-scan the image.
- IGNORE handwritten Chinese annotations next to words. Provide your own canonical translation derived from the German lemma.
- IGNORE page numbers (S.54), section headers (Lektion 7, Nomen, Verben, Adjektive, weitere Wörter, section letters A/B/C/D), and decorative separators.
- If a German entry has multiple senses with different POS or articles, emit separate entries.
- The textbook may show verbs with their preposition/case, e.g. "sich auswirken auf (+ Akk.)", "klären mit (+ Dat.)". Use this as the lemma (include the preposition + case marker in "german").
- Plural notation: "-en" stays "-en"; "Anlässe" (umlaut form) becomes "Anlässe"; "Zentren" stays "Zentren". For singular-only words, omit "plural".
- Output JSON only, no commentary, no markdown fences.`;

export async function parseVocab(text: string, lektion: number): Promise<ParsedEntry[]> {
  if (!text.trim()) throw new Error('OCR 文本为空');
  const key = getKey();
  if (!key) throw new Error('未配置 DeepSeek API key（去 Settings 填）');

  const body = {
    model: DS_MODEL,
    messages: [
      { role: 'system', content: TEXT_PROMPT },
      { role: 'user', content: `Lektion: ${lektion}\n\nOCR text:\n${text}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  };
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('DeepSeek 返回结构异常');
  return parseEntriesFromJsonString(content, 'DeepSeek');
}

export async function parseVocabFromImage(
  file: File,
  lektion: number,
): Promise<ParsedEntry[]> {
  const key = getZhipuKey();
  if (!key) throw new Error('未配置 智谱 API key（去 Settings 填）');

  const dataUrl = await fileToDownscaledDataUrl(file, 1920);

  const body = {
    model: ZP_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${VISION_PROMPT}\n\nLektion: ${lektion}`,
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 8000,
  };
  const res = await fetch(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Zhipu ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Zhipu 返回结构异常');
  return parseEntriesFromJsonString(content, 'Zhipu');
}

function parseEntriesFromJsonString(content: string, provider: string): ParsedEntry[] {
  // GLM-4V sometimes wraps output in ```json ... ``` despite the instruction.
  // Strip markdown fences defensively.
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = (fenced ? fenced[1] : content).trim();
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `${provider} 返回非 JSON: ${raw.slice(0, 200)}… (${String(err)})`,
    );
  }
  const arr = Array.isArray(obj)
    ? obj
    : ((obj as Record<string, unknown>).entries ??
       (obj as Record<string, unknown>).words ??
       (obj as Record<string, unknown>).vocabulary ?? []);
  if (!Array.isArray(arr)) {
    throw new Error(
      `${provider} 未返回数组（顶层 keys: ${Object.keys(obj as object).join(',')}）`,
    );
  }
  return (arr as ParsedEntry[]).filter((e) => e?.german && e.chinese?.length);
}

// Phone photos can be 3-8 MB; GLM-4V handles up to ~5 MB / longest-edge 6000px
// but 1920px on the long edge is plenty for textbook OCR-equivalent recall and
// keeps the base64 payload well under provider limits.
async function fileToDownscaledDataUrl(file: File, maxDim: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = (e) => rej(e);
      i.src = url;
    });
    const w0 = img.naturalWidth;
    const h0 = img.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.round(w0 * scale);
    const h = Math.round(h0 * scale);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}
