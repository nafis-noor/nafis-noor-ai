export type RamadanGoalCategory = 
  | 'fasting'
  | 'quran'
  | 'prayer'
  | 'charity'
  | 'memorization'
  | 'habits'
  | 'character'
  | 'general';

export interface RamadanActivity {
  id: string;
  activityName: string;
  arabicName?: string;
  scheduledTime: string; // HH:mm (e.g. "04:30")
  duration?: number; // in minutes (e.g. 30)
  isActive: boolean;
  category?: 'suhoor' | 'fajr' | 'quran' | 'dhikr' | 'dhuhr' | 'asr' | 'iftar' | 'maghrib' | 'isha' | 'taraweeh' | 'tahajjud' | 'charity' | 'custom';
}

export interface RamadanDailyLogEntry {
  date: string; // YYYY-MM-DD
  status: 'yes' | 'no';
  timestamp: string; // ISO string
  notes?: string;
}

export interface InspirationPulseRecord {
  contentId: string;
  shownAt: string; // ISO string
  engaged: boolean;
  contentType: 'verse' | 'story' | 'statistic' | 'hadith' | 'news';
}

export interface RamadanUserData {
  dreamId: string;
  goalText: string;
  goalCategory: RamadanGoalCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dailyLog: RamadanDailyLogEntry[];
  planActivities: RamadanActivity[];
  inspirationPulse: InspirationPulseRecord[];
  isCustomPlan: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyInspirationItem {
  id: string;
  title: string;
  arabicHeading?: string;
  contentType: 'verse' | 'story' | 'statistic' | 'hadith' | 'news';
  tag: string;
  hook: string; // Bold, shocking or deeply stirring hook
  previewText: string;
  fullContent: string;
  sourceOrCitation: string;
  actionCall: string;
  shareMessage: string;
}

export interface GoalMotivationItem {
  id: string;
  category: RamadanGoalCategory;
  arabicVerseOrHadith: string;
  translation: string;
  reference: string;
  reflection: string;
}
