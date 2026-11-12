import { ArabicProgressState, ArabicTestResult } from '../types/arabic';

const ARABIC_STORAGE_KEY = 'nafis_arabic_learning_v1';

export const INITIAL_ARABIC_PROGRESS: ArabicProgressState = {
  lettersLearned: ['alif', 'baa', 'taa'], // Starts with initial foundational trio
  wordsPracticedCount: 12,
  wordsMastered: ['v-salam', 'v-ahlan', 'v-shukran'],
  readingLevel: 'beginner',
  listeningLevel: 'beginner',
  speakingLevel: 'beginner',
  grammarLevel: 'beginner',
  arabicIQScore: 100, // Standard baseline intelligence index
  iqChallengesCompleted: 0,
  memoryAccuracy: 0,
  memorySessionsCount: 0,
  weakLetters: [],
  weakVocabulary: [],
  weakGrammarRules: [],
  totalLearningMinutes: 15,
  lastActiveSessionDate: new Date().toISOString(),
  testsHistory: [],
};

export function loadArabicProgress(): ArabicProgressState {
  if (typeof window === 'undefined') return INITIAL_ARABIC_PROGRESS;
  try {
    const raw = localStorage.getItem(ARABIC_STORAGE_KEY);
    if (!raw) return INITIAL_ARABIC_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_ARABIC_PROGRESS,
      ...parsed,
    };
  } catch (err) {
    console.error('Failed to load Arabic progress from storage:', err);
    return INITIAL_ARABIC_PROGRESS;
  }
}

export function saveArabicProgress(state: ArabicProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ARABIC_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Arabic progress to storage:', err);
  }
}

export function markLetterLearned(letterId: string): ArabicProgressState {
  const current = loadArabicProgress();
  if (!current.lettersLearned.includes(letterId)) {
    current.lettersLearned.push(letterId);
  }
  // If letter was in weak list, resolve it
  current.weakLetters = current.weakLetters.filter(id => id !== letterId);
  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}

export function markWordPracticed(wordId: string, isMastered = false): ArabicProgressState {
  const current = loadArabicProgress();
  current.wordsPracticedCount += 1;
  if (isMastered && !current.wordsMastered.includes(wordId)) {
    current.wordsMastered.push(wordId);
    current.weakVocabulary = current.weakVocabulary.filter(id => id !== wordId);
  }
  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}

export function flagWeakLetter(letterId: string): ArabicProgressState {
  const current = loadArabicProgress();
  if (!current.weakLetters.includes(letterId)) {
    current.weakLetters.push(letterId);
    saveArabicProgress(current);
  }
  return current;
}

export function flagWeakVocabulary(wordId: string): ArabicProgressState {
  const current = loadArabicProgress();
  if (!current.weakVocabulary.includes(wordId)) {
    current.weakVocabulary.push(wordId);
    saveArabicProgress(current);
  }
  return current;
}

export function recordIQChallengeResult(isCorrect: boolean): ArabicProgressState {
  const current = loadArabicProgress();
  current.iqChallengesCompleted += 1;
  // Dynamic linguistic IQ calculation based on real accuracy
  const delta = isCorrect ? +4 : -2;
  current.arabicIQScore = Math.max(70, Math.min(160, current.arabicIQScore + delta));
  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}

export function recordMemoryChallengeResult(isCorrect: boolean): ArabicProgressState {
  const current = loadArabicProgress();
  const prevSessions = current.memorySessionsCount;
  const prevAccuracy = current.memoryAccuracy;
  const newSessionCount = prevSessions + 1;
  const thisScore = isCorrect ? 100 : 0;
  current.memoryAccuracy = Math.round((prevAccuracy * prevSessions + thisScore) / newSessionCount);
  current.memorySessionsCount = newSessionCount;
  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}

export function recordArabicTestResult(result: ArabicTestResult): ArabicProgressState {
  const current = loadArabicProgress();
  current.testsHistory.unshift(result);

  // Update levels dynamically based on actual test section performance
  const vocabScore = result.sectionBreakdown['vocabulary']?.correct ?? 0;
  const readingScore = result.sectionBreakdown['reading']?.correct ?? 0;
  const grammarScore = result.sectionBreakdown['grammar']?.correct ?? 0;

  if (vocabScore >= 2) current.readingLevel = 'elementary';
  if (readingScore >= 2 && current.readingLevel === 'elementary') current.readingLevel = 'intermediate';
  if (grammarScore >= 2) current.grammarLevel = 'elementary';

  // Add identified weaknesses
  for (const weakness of result.identifiedWeaknesses) {
    if (!current.weakGrammarRules.includes(weakness)) {
      current.weakGrammarRules.push(weakness);
    }
  }

  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}

export function recordLearningTime(minutes: number): ArabicProgressState {
  const current = loadArabicProgress();
  current.totalLearningMinutes += minutes;
  current.lastActiveSessionDate = new Date().toISOString();
  saveArabicProgress(current);
  return current;
}
