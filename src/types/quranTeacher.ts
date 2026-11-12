import { Ayah } from '../types';

export type QuranTeacherMode = 'learn' | 'practice' | 'revision';

export type QuranTeacherState =
  | 'idle'
  | 'setup'
  | 'ai_speaking'
  | 'listening'
  | 'evaluating'
  | 'paused'
  | 'completed';

export interface RecitationWordMatch {
  expectedWord: string;
  normalizedExpected: string;
  matchedSpokenWord?: string;
  status: 'correct' | 'missing' | 'incorrect' | 'extra';
}

export interface RecitationEvaluationResult {
  ayahNumber: number;
  ayahText: string;
  spokenTranscript: string;
  isCorrect: boolean;
  accuracyScore: number; // 0 - 100
  missingWords: string[];
  extraWords: string[];
  incorrectWords: { expected: string; spoken: string }[];
  repeatedWords: string[];
  isPrematureStop: boolean;
  isWrongAyah: boolean;
  feedbackMessage: string;
  spokenFeedbackInstruction: string;
  spokenFeedbackInstructionAr?: string;
  wordMatches: RecitationWordMatch[];
  isUncertain?: boolean;
}

export type QuranTeacherVoiceId = 'Fenrir' | 'Kore' | 'Charon';
export type QuranTeacherLanguage = 'ar' | 'en';

export interface QuranTeacherSessionStats {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  startAyah: number;
  endAyah: number;
  totalAyahs: number;
  mode: QuranTeacherMode;
  durationSeconds: number;
  completedAyahsCount: number;
  struggledAyahsCount: number;
  totalRetries: number;
  ayahResults: Map<number, RecitationEvaluationResult[]>;
  finalAyahStatus: {
    ayahNumber: number;
    ayahText: string;
    status: 'perfect' | 'needs_practice';
    retries: number;
    lastFeedback: string;
    missingWords?: string[];
  }[];
}

export interface StruggledAyahRecord {
  surahNumber: number;
  ayahNumber: number;
  ayahText: string;
  surahName: string;
  mistakeType: string;
  timestamp: string;
}
