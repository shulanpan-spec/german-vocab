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

export type Provider = 'gemini' | 'deepseek';
const PROVIDER_STORAGE = 'llm_provider';
const GEMINI_MODEL = 'gemini-2.0-flash';
const DEEPSEEK_MODEL = 'deepseek-chat';

export function getProvider(): Provider {
  const v = localStorage.getItem(PROVIDER_STORAGE);
  if (v === 'gemini' || v === 'deepseek') return v;
  // No explicit choice yet → default to DeepSeek (CN-friendly)
  return 'deepseek';
}
export function setProvider(p: Provider): void {
  localStorage.setItem(PROVIDER_STORAGE, p);
}

export function getKey(p: Provider): string {
  return localStorage.getItem(`${p}_api_key`) ?? '';
}
export function setKey(p: Provider, key: string): void {
  if (key) localStorage.setItem(`${p}_api_key`, key);
  else localStorage.removeItem(`${p}_api_key`);
}

// Legacy aliases (existing call sites)
export const getGeminiKey = (): string => getKey('gemini');
export const setGeminiKey = (k: string): void => setKey('gemini', k);

export function hasActiveKey(): boolean {
  return getKey(getProvider()).length > 0;
}
export function activeProviderLabel(): string {
  return getProvider() === 'deepseek' ? 'DeepSeek' : 'Gemini';
}

const PROMPT = `You produce structured German B2 vocabulary entries in the style of the textbook "Aspekte neu B2".

Input: raw OCR text from a textbook vocabulary list page. The page may include noise such as page numbers (e.g. "S.54"), section headers ("Lektion 7", "Nomen", "Verben", "Adjektive"), Chinese handwritten translations alongside German words, asterisks (*) marking irregular verbs, plural markers ("-en", "-e", "Anlässe", "Jubiläen"), articles ("der", "die", "das"), and decorative typography.

Output: a JSON array of entries. For each German lemma found in the input:

- "german": the lemma in textbook form. For nouns, the NOMINATIVE SINGULAR only (NO article, NO plural marker). For verbs, the INFINITIVE. For adjectives/adverbs/phrases, the base form. Do NOT include trailing commas, plural suffixes, or article prefixes in this field.
- "article": "der" / "die" / "das" — ONLY for nouns. Determine from context or your own knowledge of German.
- "plural": e.g. "-n", "-en", "-e", "-", "Anlässe", "Jubiläen", "Gehälter". ONLY for nouns when known or shown in source. Use the textbook conventional suffix style ("-n", "-en", etc.) when the plural is regular; use the full plural form when umlaut-changing.
- "pos": one of "noun" / "verb" / "adj" / "adv" / "phrase".
- "chinese": array of 1–3 concise Chinese translations matching textbook register (e.g. ["说明","陈述"], ["举办","组织"], ["谨慎的","仔细的"]). Use simplified Chinese. Avoid sentence-form translations.
- "german_synonyms": array of 0–3 B2-level German synonyms when natural. Include article for noun synonyms (e.g. ["die Sprachfähigkeit"]).
- "irregular": true ONLY for verbs that are irregular (marked * in source, or known: schaffen, beweisen, vermeiden, vorschreiben, bestehen, enthalten, entsprechen, aufschreiben, etc.).

Rules:
- BE EXHAUSTIVE. Extract EVERY potential German vocabulary entry visible in the OCR. Do NOT skip entries because the OCR text is messy, incomplete, or hard to read — use German morphology + textbook context to reconstruct the lemma.
- The OCR may have been run on a 2-column textbook page; reading order may be scrambled, with one column appearing after another (sometimes marked by "=== 右栏 ==="). Treat the whole text as a flat pool of candidate words.
- For B2 vocabulary (Aspekte neu B2 register), you reliably know the standard Chinese translation. Provide it. Only omit an entry if you cannot identify what the German lemma is at all.
- Skip page numbers ("S.54", "S.63"), section labels ("Lektion 7", "Nomen", "Verben", "Adjektive", "weitere Wörter", section letters like "A", "B", "C", "D"), and decorative separators.
- Skip Chinese-only lines and non-vocabulary annotations.
- If a German entry has multiple senses with different POS or articles, emit separate entries.
- The textbook may show a verb with its preposition/case, e.g. "sich auswirken auf (+ Akk.)", "klären mit (+ Dat.)". Use this as the lemma (include the preposition + case marker in "german").
- Plural notation: "-en" stays "-en"; "Anlässe" (umlaut form) becomes "Anlässe"; "Zentren" stays "Zentren". For singular-only words, omit "plural".
- Output JSON only, no commentary.`;

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      german: { type: 'string' },
      article: { type: 'string', enum: ['der', 'die', 'das'] },
      plural: { type: 'string' },
      pos: { type: 'string', enum: ['noun', 'verb', 'adj', 'adv', 'phrase'] },
      chinese: { type: 'array', items: { type: 'string' } },
      german_synonyms: { type: 'array', items: { type: 'string' } },
      irregular: { type: 'boolean' },
    },
    required: ['german', 'pos', 'chinese'],
  },
};

export async function parseVocab(text: string, lektion: number): Promise<ParsedEntry[]> {
  if (!text.trim()) throw new Error('OCR 文本为空');
  const provider = getProvider();
  return provider === 'deepseek'
    ? parseWithDeepSeek(text, lektion)
    : parseWithGemini(text, lektion);
}

async function parseWithGemini(text: string, lektion: number): Promise<ParsedEntry[]> {
  const key = getKey('gemini');
  if (!key) throw new Error('未配置 Gemini API key');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ parts: [{ text: PROMPT + `\n\nLektion: ${lektion}\n\nOCR text:\n${text}` }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      temperature: 0.1,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof out !== 'string') throw new Error('Gemini 返回结构异常');
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed)) throw new Error('Gemini 未返回数组');
  return (parsed as ParsedEntry[]).filter((e) => e.german && e.chinese?.length);
}

async function parseWithDeepSeek(text: string, lektion: number): Promise<ParsedEntry[]> {
  const key = getKey('deepseek');
  if (!key) throw new Error('未配置 DeepSeek API key');

  const systemPrompt = PROMPT +
    '\n\nReturn a JSON object exactly in this shape: {"entries": [/* array of entry objects as described */]}. Output JSON only.';

  const body = {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
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
  const obj = JSON.parse(content);
  const arr = Array.isArray(obj) ? obj : obj.entries ?? obj.words ?? obj.vocabulary ?? [];
  if (!Array.isArray(arr)) throw new Error('DeepSeek 未返回数组（实际: ' + Object.keys(obj).join(',') + '）');
  return (arr as ParsedEntry[]).filter((e) => e?.german && e.chinese?.length);
}
