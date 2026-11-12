export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerCheckStatus = 'on_time' | 'late' | 'missed' | 'did_not_pray';

export interface PrayerRecord {
  prayerId: string; // e.g. "2026-10-24_fajr"
  date: string; // YYYY-MM-DD
  prayerName: PrayerName;
  status: PrayerCheckStatus;
  confirmedAt: string | null; // ISO string
  oathGiven: boolean;
  scheduledTime?: string; // e.g. "05:12"
  respondedWithinMinutes?: number;
  createdAt: string;
}

export type PrayerCheckStep = 
  | 1 // Step 1: Trigger (On-time vs Late selection with 30 min auto-miss countdown)
  | 2 // Step 2: Oath Education (gravity of swearing falsely by Allah, 20s locked timer, FAQ)
  | 3 // Step 3: Confirmation (Arabic calligraphy oath, primary gold oath button vs ghost did not pray button)
  | 4; // Step 4: Completion (Acceptance vs Mercy message)

export interface AladhanPrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      month: { en: string; ar: string };
      year: string;
      day: string;
      weekday: { en: string; ar: string };
    };
    gregorian: {
      date: string;
      day: string;
      weekday: { en: string };
      month: { en: string; number: number };
      year: string;
    };
  };
}

export interface PrayerTimingItem {
  name: PrayerName;
  arabicName: string;
  timeStr: string; // "05:12"
  dateTime: Date;
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  record?: PrayerRecord;
}
