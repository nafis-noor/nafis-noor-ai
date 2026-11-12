import { AladhanPrayerTimings, PrayerName, PrayerTimingItem } from '../types/prayerCheck';
import { calculatePrayerTimes } from './prayerTimes';
import { resolveCoordinates } from './qiblaService';

export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const PRAYER_ARABIC_NAMES: Record<PrayerName, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

// 10 minutes grace period for on-time
export const ON_TIME_GRACE_PERIOD_MINUTES = 10;

// 30 minutes threshold for auto-miss
export const AUTO_MISS_THRESHOLD_MINUTES = 30;

/**
 * Fetches accurate prayer times from Aladhan API with offline fallback
 */
export async function fetchAladhanPrayerTimes(
  location: string = 'Makkah',
  lat?: number,
  lng?: number,
  calculationMethod: number = 4 // Umm al-Qura default
): Promise<{ timings: Record<PrayerName, string>; rawData?: any; source: 'aladhan' | 'local' }> {
  const coords = lat && lng ? { lat, lng } : resolveCoordinates(location);
  const today = new Date();
  const dateFormatted = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const cacheKey = `noor_aladhan_timings_${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}_${today.toDateString()}`;

  // Try cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { timings: parsed.timings, rawData: parsed.rawData, source: 'aladhan' };
    }
  } catch {
    // continue
  }

  // Fetch from Aladhan API
  try {
    const url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${coords.lat}&longitude=${coords.lng}&method=${calculationMethod}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.data && json.data.timings) {
        const t = json.data.timings;
        const cleanedTimings: Record<PrayerName, string> = {
          Fajr: cleanTimeStr(t.Fajr),
          Dhuhr: cleanTimeStr(t.Dhuhr),
          Asr: cleanTimeStr(t.Asr),
          Maghrib: cleanTimeStr(t.Maghrib),
          Isha: cleanTimeStr(t.Isha),
        };

        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ timings: cleanedTimings, rawData: json.data })
          );
        } catch {
          // ignore storage error
        }

        return { timings: cleanedTimings, rawData: json.data, source: 'aladhan' };
      }
    }
  } catch (err) {
    console.warn('Aladhan API fetch note, using local high-accuracy calculation:', err);
  }

  // Local fallback calculation using adhan library
  const localTimes = calculatePrayerTimes({
    locationName: location,
    latitude: lat,
    longitude: lng,
    date: today,
  });
  const fallbackTimings: Record<PrayerName, string> = {
    Fajr: localTimes.schedule.fajr,
    Dhuhr: localTimes.schedule.dhuhr,
    Asr: localTimes.schedule.asr,
    Maghrib: localTimes.schedule.maghrib,
    Isha: localTimes.schedule.isha,
  };

  return { timings: fallbackTimings, source: 'local' };
}

function cleanTimeStr(time: string): string {
  if (!time) return '05:00';
  // Remove any (EEST) or extra timezone string
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return time.trim();
}

/**
 * Parses time string (e.g. "05:12") on a specific date to a JS Date object
 */
export function parsePrayerDate(timeStr: string, date: Date = new Date()): Date {
  const [hours, minutes] = cleanTimeStr(timeStr).split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Checks whether a scheduled prayer time has arrived for the current date/time
 */
export function isPrayerTimeArrived(timeStr: string, now: Date = new Date()): boolean {
  if (!timeStr) return false;
  const prayerDate = parsePrayerDate(timeStr, now);
  return now.getTime() >= prayerDate.getTime();
}

/**
 * Determines current prayer schedule status, active prayer, and elapsed minutes
 */
export function getPrayerScheduleMetrics(timings: Record<PrayerName, string>, now: Date = new Date()) {
  const items: PrayerTimingItem[] = PRAYER_NAMES.map((name) => {
    const timeStr = timings[name];
    const dateTime = parsePrayerDate(timeStr, now);
    return {
      name,
      arabicName: PRAYER_ARABIC_NAMES[name],
      timeStr,
      dateTime,
      isPassed: now.getTime() >= dateTime.getTime(),
      isCurrent: false,
      isNext: false,
    };
  });

  // Sort chronologically
  items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  // Find passed prayers
  let activeIndex = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].isPassed) {
      activeIndex = i;
    }
  }

  if (activeIndex >= 0) {
    items[activeIndex].isCurrent = true;
  }

  // Next prayer
  const nextIndex = items.findIndex((it) => !it.isPassed);
  if (nextIndex >= 0) {
    items[nextIndex].isNext = true;
  }

  const currentItem = activeIndex >= 0 ? items[activeIndex] : items[0];
  const nextItem = nextIndex >= 0 ? items[nextIndex] : null;

  // Calculate elapsed time from active prayer
  const elapsedMs = Math.max(0, now.getTime() - currentItem.dateTime.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  const isWithinGracePeriod = elapsedMinutes <= ON_TIME_GRACE_PERIOD_MINUTES;
  const isPastAutoMiss = elapsedMinutes >= AUTO_MISS_THRESHOLD_MINUTES;
  const minutesUntilAutoMiss = Math.max(0, AUTO_MISS_THRESHOLD_MINUTES - elapsedMinutes);

  return {
    items,
    currentItem,
    nextItem,
    elapsedMinutes,
    isWithinGracePeriod,
    isPastAutoMiss,
    minutesUntilAutoMiss,
  };
}
