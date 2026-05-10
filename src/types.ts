export type POS = 'noun' | 'verb' | 'adj' | 'adv' | 'phrase';
export type Article = 'der' | 'die' | 'das';
export type Grade = 0 | 1 | 2 | 3;

export interface Word {
  id: string;
  german: string;
  article?: Article;
  plural?: string;
  pos: POS;
  chinese: string[];
  german_synonyms: string[];
  example?: string;
  lektion: number;
  page?: string;
  irregular?: boolean;
  source?: string;
  created_at: number;
}

export interface ReviewState {
  word_id: string;
  easiness: number;
  interval: number;
  repetitions: number;
  due_at: number;
  last_grade?: Grade;
  last_reviewed_at?: number;
}

export interface ReviewLog {
  id?: number;
  word_id: string;
  grade: Grade;
  timestamp: number;
  prev_interval: number;
  next_interval: number;
}

export interface Settings {
  key: 'singleton';
  daily_new_target: number;
  session_size: number;
  voice_enabled: boolean;
  voice_rate: number;
}

export const DEFAULT_SETTINGS: Settings = {
  key: 'singleton',
  daily_new_target: 10,
  session_size: 20,
  voice_enabled: true,
  voice_rate: 0.9,
};
