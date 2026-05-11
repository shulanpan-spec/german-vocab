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

const KEY_STORAGE = 'gemini_api_key';
const MODEL = 'gemini-2.0-flash';

export function getGeminiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}

export function setGeminiKey(key: string): void {
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
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
- Skip page numbers, section labels, blank lines.
- Skip Chinese-only lines and any non-vocabulary annotations.
- If a German entry has multiple senses with different POS or articles, emit separate entries.
- Do NOT invent translations — if you cannot match a reliable Chinese meaning, omit the entry.
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
  const key = getGeminiKey();
  if (!key) throw new Error('未配置 Gemini API key（去 Settings 填）');
  if (!text.trim()) throw new Error('OCR 文本为空');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT + `\n\nLektion: ${lektion}\n\nOCR text:\n${text}` },
        ],
      },
    ],
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
  const parsed = JSON.parse(out) as ParsedEntry[];
  if (!Array.isArray(parsed)) throw new Error('Gemini 未返回数组');
  return parsed.filter((e) => e.german && e.chinese?.length);
}
