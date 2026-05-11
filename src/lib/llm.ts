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

const KEY_STORAGE = 'deepseek_api_key';
const MODEL = 'deepseek-chat';

export function getKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}

export function setKey(key: string): void {
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
}

export function hasKey(): boolean {
  return getKey().length > 0;
}

// One-time legacy cleanup: prior versions stored Gemini key / provider toggle.
export function cleanupLegacyKeys(): void {
  localStorage.removeItem('llm_provider');
  localStorage.removeItem('gemini_api_key');
}

const PROMPT = `You produce structured German B2 vocabulary entries for the textbook "Im Berufssprachkurs B2 — Deutsch als Zweitsprache, Kurs- und Arbeitsbuch" (Hueber). The vocabulary register is workplace / professional German for DaZ learners: topics include jobs, workplace communication, advertising, training, scheduling, customer service, complaints, and similar Berufsalltag scenarios. Translate accordingly — prefer the practical/work-context Chinese rendering over abstract academic ones.

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

export async function parseVocab(text: string, lektion: number): Promise<ParsedEntry[]> {
  if (!text.trim()) throw new Error('OCR 文本为空');
  const key = getKey();
  if (!key) throw new Error('未配置 DeepSeek API key（去 Settings 填）');

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: PROMPT },
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
  const arr = Array.isArray(obj)
    ? obj
    : obj.entries ?? obj.words ?? obj.vocabulary ?? [];
  if (!Array.isArray(arr)) {
    throw new Error('DeepSeek 未返回数组（顶层 keys: ' + Object.keys(obj).join(',') + '）');
  }
  return (arr as ParsedEntry[]).filter((e) => e?.german && e.chinese?.length);
}
