import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  HighLatitudeRule,
  CalculationParameters,
} from 'adhan';
import {
  PrayerTime,
  PrayerDaySchedule,
  NextPrayerInfo,
  CalculationMethodKey,
  AsrMadhabKey,
} from '../types';
import { findCityByName, POPULAR_CITIES } from '../data/citiesData';

export interface PrayerTimesResult {
  schedule: PrayerDaySchedule;
  prayers: PrayerTime[];
  nextPrayer: NextPrayerInfo;
  sunriseTime: string;
  locationName: string;
  methodName: string;
  isCustomLocation: boolean;
  timeUntilNext: string;
  currentDateObj: Date;
}

export interface PrayerCalcOptions {
  date?: Date;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  calculationMethod?: CalculationMethodKey;
  asrMadhab?: AsrMadhabKey;
}

/**
 * Maps method key to adhan CalculationParameters
 */
export function getCalculationParameters(
  methodKey: CalculationMethodKey = 'UmmAlQura',
  asrMadhab: AsrMadhabKey = 'Shafi'
): CalculationParameters {
  let params: CalculationParameters;

  switch (methodKey) {
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'ISNA':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'MoonsightingCommittee':
      params = CalculationMethod.MoonsightingCommittee();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'Tehran':
      params = CalculationMethod.Tehran();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    case 'UmmAlQura':
    default:
      params = CalculationMethod.UmmAlQura();
      break;
  }

  // Set Asr Jurisprudence (Standard Shafi/Maliki/Hanbali vs Hanafi)
  params.madhab = asrMadhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // High latitude fallback for northern/southern regions
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;

  return params;
}

/**
 * Format a Date object into "HH:MM" 24h format
 */
export function formatTime24(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date object into "12-hour AM/PM" format
 */
export function formatTime12(date: Date, lang?: string): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const isAr = lang === 'ar' || (!lang && typeof window !== 'undefined' && localStorage.getItem('noor_app_language') === 'ar');
  const ampm = hours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 is 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Dynamically and accurately calculates prayer times for any location and date.
 * Strictly adheres to next-prayer rules:
 * - After Isha -> Next is Tomorrow's Fajr
 * - After Maghrib & before Isha -> Isha
 * - After Asr & before Maghrib -> Maghrib
 * - After Dhuhr & before Asr -> Asr
 * - After Fajr & before Dhuhr -> Dhuhr
 * - Before Fajr -> Fajr (today)
 */
export function calculatePrayerTimes(options: PrayerCalcOptions = {}): PrayerTimesResult {
  const now = options.date || new Date();
  const currentTimestamp = now.getTime();

  // 1. Resolve Coordinates
  let lat = options.latitude;
  let lng = options.longitude;
  let locName = options.locationName || 'Makkah';
  let methodKey: CalculationMethodKey = options.calculationMethod || 'UmmAlQura';
  const madhab: AsrMadhabKey = options.asrMadhab || 'Shafi';
  let isCustom = false;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    isCustom = true;
  } else {
    const matchedCity = findCityByName(locName);
    if (matchedCity) {
      lat = matchedCity.latitude;
      lng = matchedCity.longitude;
      locName = matchedCity.name;
      if (!options.calculationMethod) {
        methodKey = matchedCity.defaultMethod;
      }
    } else {
      // Default to Makkah Al-Mukarramah
      lat = 21.4225;
      lng = 39.8262;
      locName = 'Makkah';
      if (!options.calculationMethod) {
        methodKey = 'UmmAlQura';
      }
    }
  }

  const coordinates = new Coordinates(lat, lng);
  const params = getCalculationParameters(methodKey, madhab);

  // 2. Calculate Today's Prayer Times
  const todayTimes = new PrayerTimes(coordinates, now, params);

  // 3. Calculate Tomorrow's Prayer Times (specifically for next-day Fajr)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);

  const fajrDate = todayTimes.fajr || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0);
  const sunriseDate = todayTimes.sunrise || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 30);
  const dhuhrDate = todayTimes.dhuhr || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 15);
  const asrDate = todayTimes.asr || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30);
  const maghribDate = todayTimes.maghrib || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
  const ishaDate = todayTimes.isha || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30);

  const tomorrowFajrDate = tomorrowTimes.fajr || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 5, 0);

  // 4. Strict Dynamic Rule Implementation for Next Prayer
  let nextPrayerName = 'Fajr';
  let nextPrayerArabic = 'الفجر';
  let nextPrayerDate = fajrDate;
  let isTomorrow = false;

  if (currentTimestamp > ishaDate.getTime()) {
    // Current time is after Isha -> Next Prayer is Fajr tomorrow
    nextPrayerName = 'Fajr';
    nextPrayerArabic = 'الفجر';
    nextPrayerDate = tomorrowFajrDate;
    isTomorrow = true;
  } else if (currentTimestamp >= maghribDate.getTime()) {
    // After Maghrib but before Isha -> Next Prayer is Isha
    nextPrayerName = 'Isha';
    nextPrayerArabic = 'العشاء';
    nextPrayerDate = ishaDate;
    isTomorrow = false;
  } else if (currentTimestamp >= asrDate.getTime()) {
    // After Asr but before Maghrib -> Next Prayer is Maghrib
    nextPrayerName = 'Maghrib';
    nextPrayerArabic = 'المغرب';
    nextPrayerDate = maghribDate;
    isTomorrow = false;
  } else if (currentTimestamp >= dhuhrDate.getTime()) {
    // After Dhuhr but before Asr -> Next Prayer is Asr
    nextPrayerName = 'Asr';
    nextPrayerArabic = 'العصر';
    nextPrayerDate = asrDate;
    isTomorrow = false;
  } else if (currentTimestamp >= fajrDate.getTime()) {
    // After Fajr but before Dhuhr -> Next Prayer is Dhuhr (per user mandate)
    nextPrayerName = 'Dhuhr';
    nextPrayerArabic = 'الظهر';
    nextPrayerDate = dhuhrDate;
    isTomorrow = false;
  } else {
    // Before Fajr today (e.g. 03:30 AM before 05:12 AM Fajr) -> Next Prayer is Fajr today
    nextPrayerName = 'Fajr';
    nextPrayerArabic = 'الفجر';
    nextPrayerDate = fajrDate;
    isTomorrow = false;
  }

  // 5. Construct Live Countdown & Formatting
  const diffMs = Math.max(0, nextPrayerDate.getTime() - currentTimestamp);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let countdownFormatted = '';
  if (hours > 0) {
    countdownFormatted = minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
  } else if (minutes > 0) {
    countdownFormatted = `in ${minutes} minutes`;
  } else {
    countdownFormatted = `in ${seconds} seconds`;
  }

  const timeUntilNext = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

  const timeStr = formatTime24(nextPrayerDate);
  const displaySubtitle = isTomorrow ? `Tomorrow · ${timeStr}` : timeStr;

  const nextPrayer: NextPrayerInfo = {
    name: nextPrayerName,
    arabicName: nextPrayerArabic,
    time: timeStr,
    timestamp: nextPrayerDate.getTime(),
    dateObj: nextPrayerDate,
    isTomorrow,
    countdownFormatted,
    hours,
    minutes,
    seconds,
    displaySubtitle,
  };

  // 6. Build the 5 Daily Obligatory Prayers list for UI
  const fivePrayersList: { name: string; arabicName: string; dateObj: Date }[] = [
    { name: 'Fajr', arabicName: 'الفجر', dateObj: fajrDate },
    { name: 'Dhuhr', arabicName: 'الظهر', dateObj: dhuhrDate },
    { name: 'Asr', arabicName: 'العصر', dateObj: asrDate },
    { name: 'Maghrib', arabicName: 'المغرب', dateObj: maghribDate },
    { name: 'Isha', arabicName: 'العشاء', dateObj: ishaDate },
  ];

  const prayers: PrayerTime[] = fivePrayersList.map((p) => {
    const passed = currentTimestamp > p.dateObj.getTime();
    // Highlight as next only if it's today's next prayer
    const isNext = !isTomorrow && p.name === nextPrayerName;
    return {
      name: p.name,
      arabicName: p.arabicName,
      time: formatTime24(p.dateObj),
      timestamp: p.dateObj.getTime(),
      dateObj: p.dateObj,
      passed,
      isNext,
    };
  });

  // Calculate approximate Hijri Date
  const hijriMonths = [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Ula',
    'Jumada al-Akhirah',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ];

  let hijriDateStr = "14 Sha'ban 1447 AH";
  try {
    const intlFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    hijriDateStr = intlFormatter.format(now) + ' AH';
  } catch {
    hijriDateStr = "14 Sha'ban 1447 AH";
  }

  const schedule: PrayerDaySchedule = {
    fajr: formatTime24(fajrDate),
    sunrise: formatTime24(sunriseDate),
    dhuhr: formatTime24(dhuhrDate),
    asr: formatTime24(asrDate),
    maghrib: formatTime24(maghribDate),
    isha: formatTime24(ishaDate),
    dateStr: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
    hijriDate: hijriDateStr,
  };

  const methodDisplayNames: Record<CalculationMethodKey, string> = {
    UmmAlQura: 'Umm al-Qura (Makkah)',
    MuslimWorldLeague: 'Muslim World League (MWL)',
    ISNA: 'ISNA (North America)',
    Egyptian: 'Egyptian General Authority',
    Karachi: 'Karachi (Univ. Islamic Sciences)',
    Dubai: 'Dubai / UAE Authority',
    Qatar: 'Qatar Awqaf',
    Kuwait: 'Kuwait Awqaf',
    MoonsightingCommittee: 'Moonsighting Committee',
    Singapore: 'MUIS Singapore',
    Tehran: 'Univ. of Tehran',
    Turkey: 'Diyanet Turkey',
  };

  return {
    schedule,
    prayers,
    nextPrayer,
    sunriseTime: formatTime24(sunriseDate),
    locationName: locName,
    methodName: methodDisplayNames[methodKey] || 'Umm al-Qura',
    isCustomLocation: isCustom,
    timeUntilNext,
    currentDateObj: now,
  };
}
