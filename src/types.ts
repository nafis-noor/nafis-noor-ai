export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string; // "05:12"
  timestamp: number;
  dateObj: Date;
  passed: boolean;
  isNext: boolean;
}

export interface NextPrayerInfo {
  name: string;
  arabicName: string;
  time: string;
  timestamp: number;
  dateObj: Date;
  isTomorrow: boolean;
  countdownFormatted: string; // "in 20 minutes" or "in 2h 15m"
  hours: number;
  minutes: number;
  seconds: number;
  displaySubtitle: string; // "Tomorrow · 05:12" or "18:20"
}

export interface PrayerDaySchedule {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  dateStr: string;
  hijriDate: string;
}

export type CalculationMethodKey =
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'ISNA'
  | 'Egyptian'
  | 'Karachi'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey';

export type AsrMadhabKey = 'Shafi' | 'Hanafi';

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration?: string;
  audio?: string;
  juz?: number;
  page?: number;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  revelationOrder?: number;
  pageNumber: number;
  juzNumber: number;
  sampleAyahs: Ayah[];
}

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  subfolder: string;
}

export interface QuranRefData {
  surahName: string;
  verseNumber: string;
  textArabic?: string;
  textTranslation?: string;
}

export interface HadithRefData {
  collection: string;
  number?: string;
  status?: string;
  text: string;
}

export interface NoorAIMessage {
  id: string;
  sender: 'user' | 'noor';
  text: string; // Direct Answer
  timestamp: string;
  greeting?: string; // Authentic Islamic greeting and welcoming du'a
  concludingDua?: string; // Heartfelt concluding supplication/Dua
  tadabbur?: string; // Spiritual Qur'anic reflection and heart insight
  quranReference?: QuranRefData | string;
  hadithReference?: HadithRefData | string;
  explanation?: string;
  scholarlyDisagreement?: string;
  isPersonalRulingAdvice?: boolean;
  sources?: string[];
  sourceVerification?: string;
  practicalTakeaway?: string;
  detailedExplanation?: string;
  suggestedFollowUps?: string[];
  feedback?: 'helpful' | 'unhelpful';
  isSaved?: boolean;
  isError?: boolean;
  isLoading?: boolean;
}

export interface NoorAIConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: NoorAIMessage[];
}

export interface QuizOption {
  id: string;
  text: string;
  textAr?: string;
  isCorrect: boolean;
}

export interface LessonStep {
  id: string;
  type: 'concept' | 'multiple-choice' | 'ordering' | 'match';
  title: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
  arabicText?: string;
  transliteration?: string;
  question?: string;
  questionAr?: string;
  options?: QuizOption[];
  orderItems?: { id: string; text: string; textAr?: string; correctIndex: number }[];
  explanation: string;
  explanationAr?: string;
  xpReward: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  icon: string;
  estimatedMinutes: number;
  xp: number;
  completed: boolean;
  steps: LessonStep[];
}

export interface Course {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  descriptionAr?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  categoryAr?: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

export type DhikrDuaCategory =
  | 'All'
  | 'Morning'
  | 'Evening'
  | 'After Prayer'
  | 'Sleep'
  | 'Protection'
  | 'Forgiveness'
  | 'Gratitude'
  | 'Daily Dhikr'
  | 'Daily Duas';

export interface Dua {
  id: string;
  title: string;
  titleAr?: string;
  category: DhikrDuaCategory | 'Morning & Evening' | 'Prayer' | 'Daily Life' | 'Forgiveness' | 'Peace & Healing';
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  benefit?: string;
  repetitions?: number;
  isSaved?: boolean;
  audio?: string;
  chapterId?: number;
  chapterTitle?: string;
  chapterTitleAr?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash?: string; // SHA-256 secure hash for email auth
  authProvider?: string; // 'google.com' | 'password'
  photoURL?: string | null;
  loginCount?: number;
  isNewUser?: boolean;
  role?: 'user' | 'admin' | 'guest';
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

export interface UserStats {
  accountId?: string;
  accountEmail?: string;
  isLoggedIn?: boolean;
  role?: 'user' | 'admin' | 'guest';
  isGuest?: boolean;
  hasCompletedWelcome: boolean;
  userName: string;
  userLocation: string;
  userLatitude?: number;
  userLongitude?: number;
  userCountry?: string;
  prayerCalculationMethod?: CalculationMethodKey;
  asrJuristicMethod?: AsrMadhabKey;
  language: string;
  notificationsEnabled: boolean;
  themePreference: 'dark' | 'light' | 'system';
  personalization?: {
    goals?: string[];
    learningLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Prefer not to say';
    reminderFrequency?: 'Minimal' | 'Normal' | 'Frequent';
  };
  overallStreak: number;
  quranStreak: number;
  learningStreak: number;
  dhikrStreak?: number;
  lastActivityDate?: string; // YYYY-MM-DD
  quranLastActiveDate?: string; // YYYY-MM-DD
  learningLastActiveDate?: string; // YYYY-MM-DD
  dhikrLastActiveDate?: string; // YYYY-MM-DD
  activityHistory?: { date: string; type: 'quran' | 'learning' | 'dhikr' | 'prayer' }[];
  completedLessonIds?: string[];
  quranPagesRead: number;
  quranGoalPages: number;
  dhikrCount: number;
  dhikrGoal: number;
  currentDhikrText: string;
  totalXP: number;
  lessonsCompleted: number;
  lastReadSurah: number;
  lastReadAyah: number;
  bookmarks: { surahNumber: number; ayahNumber: number; timestamp: string }[];
  savedDuas: string[];
  completedDhikrIds?: string[];
  prayerHistory: { prayer: string; date: string; completed: boolean }[];
  unlockedAchievements: string[];
  noorAiConversation?: NoorAIMessage[];
  noorAiSessions?: NoorAIConversationSession[];
  activeNoorSessionId?: string;
  savedNoorMessages?: NoorAIMessage[];
}

export interface Achievement {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}
