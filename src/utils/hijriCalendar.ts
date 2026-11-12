/**
 * Hijri Calendar & Ramadan Detection Utility using Aladhan API
 * Ramadan is Islamic month 9 (Ramaḍān)
 */

export interface HijriDateInfo {
  isRamadan: boolean;
  day: number;
  monthNumber: number;
  monthNameEn: string;
  monthNameAr: string;
  year: number;
  source: 'aladhan' | 'intl' | 'override';
  liveTimeString?: string;
  liveDateString?: string;
}

export const RAMADAN_MONTH_NUMBER = 9;

export const HIJRI_MONTHS = [
  { number: 1, en: 'Muharram', ar: 'المحرم' },
  { number: 2, en: 'Safar', ar: 'صفر' },
  { number: 3, en: 'Rabiʻ al-Awwal', ar: 'ربيع الأول' },
  { number: 4, en: 'Rabiʻ al-Thani', ar: 'ربيع الثاني' },
  { number: 5, en: 'Jumada al-Ula', ar: 'جمادى الأولى' },
  { number: 6, en: 'Jumada al-Akhirah', ar: 'جمادى الآخرة' },
  { number: 7, en: 'Rajab', ar: 'رجب' },
  { number: 8, en: "Sha'ban", ar: 'شعبان' },
  { number: 9, en: 'Ramadan', ar: 'رمضان' },
  { number: 10, en: 'Shawwal', ar: 'شوال' },
  { number: 11, en: 'Dhu al-Qiʻdah', ar: 'ذو القعدة' },
  { number: 12, en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
];

/**
 * Checks if current date is within the Islamic month of Ramadan.
 * Strictly verifies real date & time via Aladhan API with high-accuracy Umm al-Qura Intl fallback.
 */
export async function detectRamadanStatus(lat: number = 21.4225, lng: number = 39.8262): Promise<HijriDateInfo> {
  const now = new Date();
  const liveTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveDateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (typeof window === 'undefined') {
    return {
      isRamadan: false,
      day: 1,
      monthNumber: 8,
      monthNameEn: "Sha'ban",
      monthNameAr: "شعبان",
      year: 1447,
      source: 'intl',
      liveTimeString,
      liveDateString,
    };
  }

  // Check manual testing simulation override ONLY if explicitly set to 'true'
  const simulationOverride = localStorage.getItem('noor_simulate_ramadan');
  if (simulationOverride === 'true') {
    return {
      isRamadan: true,
      day: 1,
      monthNumber: 9,
      monthNameEn: 'Ramadan',
      monthNameAr: 'رمضان',
      year: 1447,
      source: 'override',
      liveTimeString,
      liveDateString,
    };
  }

  const cacheKey = `noor_hijri_date_${now.toISOString().slice(0, 10)}`;

  // Check local daily cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...parsed,
        liveTimeString,
        liveDateString,
      };
    }
  } catch {
    // continue to live query
  }

  // Query Aladhan API for live Hijri Calendar calculation
  try {
    const timestamp = Math.floor(now.getTime() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=4`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const hijri = json?.data?.date?.hijri;
      if (hijri && hijri.month) {
        const monthNum = Number(hijri.month.number);
        const dayNum = Number(hijri.day);
        const yearNum = Number(hijri.year);
        const isRamadan = monthNum === RAMADAN_MONTH_NUMBER;

        const info: HijriDateInfo = {
          isRamadan,
          day: dayNum,
          monthNumber: monthNum,
          monthNameEn: hijri.month.en || (isRamadan ? 'Ramadan' : `Month ${monthNum}`),
          monthNameAr: hijri.month.ar || (isRamadan ? 'رمضان' : ''),
          year: yearNum,
          source: 'aladhan',
          liveTimeString,
          liveDateString,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(info));
        } catch {
          // ignore cache errors
        }

        return info;
      }
    }
  } catch (err) {
    console.warn('Aladhan Hijri API query note, using Intl UmalQura calculation:', err);
  }

  // Offline Fallback: Intl Islamic Calendar (Umm al-Qura)
  return getIntlHijriDate(now);
}

/**
 * Native JavaScript Islamic Umm al-Qura calendar calculation
 */
export function getIntlHijriDate(date: Date = new Date()): HijriDateInfo {
  const liveTimeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveDateString = date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Check manual testing simulation override
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('noor_simulate_ramadan');
    if (override === 'true') {
      return {
        isRamadan: true,
        day: 1,
        monthNumber: 9,
        monthNameEn: 'Ramadan',
        monthNameAr: 'رمضان',
        year: 1447,
        source: 'override',
        liveTimeString,
        liveDateString,
      };
    }
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const monthPart = parts.find((p) => p.type === 'month')?.value;
    const dayPart = parts.find((p) => p.type === 'day')?.value;
    const yearPart = parts.find((p) => p.type === 'year')?.value;

    const monthNumber = Number(monthPart) || 5;
    const day = Number(dayPart) || 1;
    const year = Number(yearPart) || 1448;
    const isRamadan = monthNumber === RAMADAN_MONTH_NUMBER;

    const monthData = HIJRI_MONTHS.find((m) => m.number === monthNumber) || {
      number: monthNumber,
      en: isRamadan ? 'Ramadan' : `Islamic Month ${monthNumber}`,
      ar: isRamadan ? 'رمضان' : '',
    };

    return {
      isRamadan,
      day,
      monthNumber,
      monthNameEn: monthData.en,
      monthNameAr: monthData.ar,
      year,
      source: 'intl',
      liveTimeString,
      liveDateString,
    };
  } catch {
    return {
      isRamadan: false,
      day: 1,
      monthNumber: 5,
      monthNameEn: 'Jumada al-Ula',
      monthNameAr: 'جمادى الأولى',
      year: 1448,
      source: 'intl',
      liveTimeString,
      liveDateString,
    };
  }
}
