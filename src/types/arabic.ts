export type ArabicTab =
  | 'curriculum'
  | 'letter_lab'
  | 'speaking'
  | 'live_arabic'
  | 'listening'
  | 'reading'
  | 'vocabulary'
  | 'flashcards'
  | 'arabic_iq'
  | 'memory'
  | 'test'
  | 'teacher'
  | 'progress';

export type MakhrajCategory =
  | 'throat' // الحلق (Halq)
  | 'tongue' // اللسان (Lisan)
  | 'lips' // الشفتان (Shafatan)
  | 'nasal' // الخيشوم (Khayshum)
  | 'empty_space'; // الجوف (Jawf)

export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface HarakatExamples {
  fatha: { text: string; transliteration: string; meaning: string; audioText: string };
  damma: { text: string; transliteration: string; meaning: string; audioText: string };
  kasra: { text: string; transliteration: string; meaning: string; audioText: string };
  sukoon: { text: string; transliteration: string; meaning: string; audioText: string };
  shadda?: { text: string; transliteration: string; meaning: string; audioText: string };
  tanween?: { text: string; transliteration: string; meaning: string; audioText: string };
}

export interface ArabicLetter {
  id: string;
  letter: string;
  name: string;
  arabicName: string;
  transliteration: string;
  phoneticSound: string;
  makhraj: MakhrajCategory;
  makhrajDescription: string;
  isConnector: boolean; // false for non-connectors: ا, د, ذ, ر, ز, و
  order: number;
  forms: LetterForms;
  harakat: HarakatExamples;
  sampleWords: {
    isolated?: { arabic: string; transliteration: string; english: string };
    initial: { arabic: string; transliteration: string; english: string };
    medial: { arabic: string; transliteration: string; english: string };
    final: { arabic: string; transliteration: string; english: string };
  };
  commonMistakes?: string;
}

export type WordCategory =
  | 'greetings'
  | 'family'
  | 'daily_life'
  | 'food_drink'
  | 'nature'
  | 'numbers'
  | 'question_words'
  | 'verbs'
  | 'adjectives'
  | 'quranic_roots';

export interface ArabicWord {
  id: string;
  arabic: string; // vocalized with diacritics
  transliteration: string;
  meaning: string;
  english?: string; // alias for meaning
  category: WordCategory | string;
  root?: string; // 3-letter root e.g. ك-ت-ب
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'particle';
  grammarCategory?: string; // e.g. 'noun', 'verb', 'particle'
  plural?: string;
  exampleSentence: {
    arabic: string;
    transliteration: string;
    english: string;
  } | string;
  exampleTranslation?: string;
}

export type ArabicVocabularyWord = ArabicWord;
export type ArabicReadingPassage = ReadingPassage;
export type ArabicMemoryChallenge = MemoryChallenge;

export interface FlashcardDeckCard {
  id: string;
  frontArabic: string;
  backEnglish: string;
  transliteration?: string;
  root?: string;
  exampleSentence?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  category: string;
  cards: FlashcardDeckCard[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  arabicTitle: string;
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  type: 'syllables' | 'words' | 'sentence' | 'dialogue' | 'short_story';
  arabicText: string;
  arabicTashkeel?: string;
  arabicPlain?: string;
  transliteration: string;
  englishTranslation: string;
  vocabularyHighlights?: Array<{
    arabic: string;
    english: string;
  }>;
  vocabularyBreakdown?: Record<string, { root: string; form: string; meaning: string }>;
  comprehensionQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface ArabicFlashcard {
  id: string;
  cardType:
    | 'arabic_to_meaning'
    | 'meaning_to_arabic'
    | 'sound_to_word'
    | 'letter_to_sound'
    | 'sentence_to_meaning';
  frontText: string;
  frontSubtext?: string;
  backText: string;
  backSubtext?: string;
  audioText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  intervalDays: number;
  nextReviewDate: string;
  consecutiveCorrect: number;
  lastReviewed?: string;
}

export type IQChallengeType =
  | 'pattern_recognition'
  | 'word_relationship'
  | 'odd_one_out'
  | 'word_ordering'
  | 'context_logic'
  | 'sequence';

export interface ArabicIQChallenge {
  id: string;
  type: IQChallengeType;
  title: string;
  instructions: string;
  prompt: string;
  promptArabic?: string;
  arabicPrompt?: string;
  question?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  linguisticPrinciple: string;
}

export interface MemoryItem {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface MemoryChallenge {
  id: string;
  type?: string;
  title: string;
  displayDurationSeconds: number;
  items: MemoryItem[];
  itemsToMemorize?: Array<{ arabic: string; transliteration?: string; english?: string }>;
  presentationPrompt?: string;
  questionType: 'which_appeared' | 'which_disappeared' | 'what_was_order' | 'what_did_it_mean';
  question: string;
  questionText?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ArabicTestQuestion {
  id: string;
  section?:
    | 'letters'
    | 'pronunciation'
    | 'reading'
    | 'vocabulary'
    | 'listening'
    | 'grammar'
    | 'comprehension'
    | 'reasoning';
  category: string; // for section categorization e.g. alphabet, vocabulary, grammar
  questionText: string;
  question?: string;
  arabicPrompt?: string;
  audioPromptText?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  weaknessTag?: string;
}

export interface ArabicTestResult {
  id: string;
  date: string;
  totalScore: number;
  maxScore: number;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  estimatedLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  sectionBreakdown: Record<string, { correct: number; total: number }>;
  identifiedStrengths?: string[];
  strengths?: string[];
  identifiedWeaknesses: string[];
  studyPlan?: string[];
  recommendedPlan?: string[];
  recommendation?: string;
}

export interface ArabicProgressState {
  lettersLearned: string[]; // letter IDs
  wordsPracticedCount: number;
  wordsMastered: string[]; // word IDs
  readingLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  listeningLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  speakingLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  grammarLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  arabicIQScore: number;
  iqChallengesCompleted: number;
  memoryAccuracy: number;
  memorySessionsCount: number;
  weakLetters: string[];
  weakVocabulary: string[];
  weakGrammarRules: string[];
  totalLearningMinutes: number;
  lastActiveSessionDate: string;
  testsHistory: ArabicTestResult[];
}

export interface LiveArabicMessage {
  id: string;
  sender: 'user' | 'noor';
  arabicText?: string;
  transliteration?: string;
  englishText?: string;
  corrections?: string;
  grammarTip?: string;
  audioPlayed?: boolean;
  timestamp: number;
}
