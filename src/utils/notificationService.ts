/**
 * Noor Islamic Prayer Notification Service
 * Supports dynamic notification scheduling, browser notifications, in-app subtle toasts,
 * harmonic audio chimes, and user-configurable reminder timings:
 * - 'Minimal': 1 minute before prayer
 * - 'Normal': 5 minutes before prayer (default)
 * - 'Frequent': 15 minutes before prayer
 */

import { calculatePrayerTimes } from './prayerTimes';
import { UserStats, CalculationMethodKey, AsrMadhabKey } from '../types';

export type ReminderFrequency = 'Minimal' | 'Normal' | 'Frequent';

export interface PrayerNotificationEvent {
  id: string;
  prayerName: string;
  arabicName: string;
  prayerTime: string;
  minutesBefore: number;
  message: string;
  quote: string;
  timestamp: number;
}

export interface ScheduledPrayerAlert {
  alertKey: string;
  prayerName: string;
  arabicName: string;
  prayerTimeFormatted: string;
  prayerTimestamp: number;
  alertTimestamp: number;
  minutesBefore: number;
  timeRemainingMs: number;
  quote: string;
}

// Key for caching already dispatched notification alerts in session/localStorage
const NOTIFICATION_HISTORY_KEY = 'noor_sent_prayer_alerts';

/**
 * Get the exact offset in minutes before prayer time for each frequency preference:
 * - 'Minimal' = 1 min before
 * - 'Normal' = 5 mins before
 * - 'Frequent' = 15 mins before
 */
export function getFrequencyOffsetMinutes(frequency: ReminderFrequency = 'Normal'): number {
  switch (frequency) {
    case 'Minimal':
      return 1; // 1 minute before
    case 'Frequent':
      return 15; // 15 minutes before
    case 'Normal':
    default:
      return 5; // 5 minutes before
  }
}

/**
 * Get offsets array for backward compatibility and multi-stage support
 */
export function getFrequencyOffsets(frequency: ReminderFrequency = 'Normal'): number[] {
  return [getFrequencyOffsetMinutes(frequency)];
}

/**
 * Descriptive label for each frequency
 */
export function getFrequencyDescription(frequency: ReminderFrequency = 'Normal'): string {
  switch (frequency) {
    case 'Minimal':
      return '1 minute before prayer time (subtle notice)';
    case 'Frequent':
      return '15 minutes before prayer time (thorough preparation)';
    case 'Normal':
    default:
      return '5 minutes before prayer time (recommended)';
  }
}

/**
 * Meaningful Islamic quotes on prayer
 */
const PRAYER_QUOTES: Record<string, string> = {
  Fajr: '"Prayer is better than sleep." (Hadith) · "Establish prayer at the two ends of the day" (11:114)',
  Dhuhr: '"Verily, in the remembrance of Allah do hearts find rest." (13:28)',
  Asr: '"Guard strictly your prayers, especially the middle prayer (Asr)." (2:238)',
  Maghrib: '"And glorify the praises of your Lord before the setting of the sun." (50:39)',
  Isha: '"Establish the night prayer, even if only a few rak\'ahs." (Hadith)',
};

/**
 * Synthesizes a peaceful, gentle harmonic chime using Web Audio API.
 * Completely client-side, zero network dependencies, calm and respectful.
 */
export function playGentleChime(volume: number = 0.25): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Harmonic frequencies for a serene Tibetan/Islamic bowl chime tone (F# pentatonic)
    const frequencies = [369.99, 554.37, 739.99, 1108.73];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle attack and long decaying resonance
      const initialGain = (volume / (idx + 1.2)) * (idx === 0 ? 1 : 0.6);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(initialGain, now + 0.08 + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 - idx * 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    });
  } catch {
    // AudioContext may be restricted by browser autoplay policy before user interaction
  }
}

/**
 * Checks browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser permission to show native notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Sends a native browser notification if granted
 */
export function sendBrowserNotification(
  title: string,
  body: string,
  tag: string = 'noor-prayer-notification'
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/app-icon.png',
      badge: '/app-icon.png',
      tag,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves already sent notification keys from memory/storage
 */
function getSentNotificationKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFICATION_HISTORY_KEY) || localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // fallback
  }
  return new Set();
}

/**
 * Records an alert as dispatched so it's never triggered twice in the same window
 */
function markNotificationAsSent(key: string): void {
  try {
    const sent = getSentNotificationKeys();
    sent.add(key);
    // Keep set bounded to last 50 alerts
    const arr = Array.from(sent).slice(-50);
    const serialized = JSON.stringify(arr);
    sessionStorage.setItem(NOTIFICATION_HISTORY_KEY, serialized);
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, serialized);
  } catch {
    // fallback
  }
}

/**
 * Builds the notification message based on prayer name and minutes remaining
 */
export function buildPrayerNotificationContent(
  prayerName: string,
  minutesBefore: number,
  prayerTimeFormatted: string,
  locationName: string = 'Makkah'
): { title: string; body: string; message: string; quote: string } {
  const quote = PRAYER_QUOTES[prayerName] || '"Verily, in the remembrance of Allah do hearts find rest." (13:28)';

  if (minutesBefore === 0) {
    const title = `🕌 Time for ${prayerName} Prayer (${prayerTimeFormatted})`;
    const body = `The time for ${prayerName} Salah has arrived in ${locationName}. Allāhu Akbar.`;
    const message = `Time for ${prayerName} Salah in ${locationName}`;
    return { title, body, message, quote };
  } else {
    const minText = minutesBefore === 1 ? '1 minute' : `${minutesBefore} minutes`;
    const title = `🕌 ${prayerName} Prayer in ${minText}`;
    const body = `${prayerName} is at ${prayerTimeFormatted} (${locationName}). Prepare for Salah & Wudhu.`;
    const message = `${prayerName} Prayer in ${minText} (${prayerTimeFormatted})`;
    return { title, body, message, quote };
  }
}

/**
 * Calculates the exact upcoming prayer and computes the time remaining
 * until its scheduled notification trigger point based on the user's preference.
 */
export function calculateNextScheduledAlert(
  userStats: UserStats,
  fromDate: Date = new Date()
): ScheduledPrayerAlert | null {
  if (userStats.notificationsEnabled === false) {
    return null;
  }

  const currentTimestamp = fromDate.getTime();
  const frequency: ReminderFrequency = userStats.personalization?.reminderFrequency || 'Normal';
  const offsetMinutes = getFrequencyOffsetMinutes(frequency);
  const offsetMs = offsetMinutes * 60 * 1000;

  const sentKeys = getSentNotificationKeys();
  const candidates: ScheduledPrayerAlert[] = [];

  // 1. Calculate today's prayer times
  const todayCalc = calculatePrayerTimes({
    date: fromDate,
    locationName: userStats.userLocation,
    latitude: userStats.userLatitude,
    longitude: userStats.userLongitude,
    calculationMethod: userStats.prayerCalculationMethod as CalculationMethodKey,
    asrMadhab: userStats.asrJuristicMethod as AsrMadhabKey,
  });

  const todayDateKey = fromDate.toISOString().split('T')[0];

  for (const prayer of todayCalc.prayers) {
    const prayerTimestamp = prayer.timestamp;
    const alertTimestamp = prayerTimestamp - offsetMs;
    const alertKey = `alert_${todayDateKey}_${prayer.name}_${offsetMinutes}m`;
    const timeRemainingMs = alertTimestamp - currentTimestamp;

    // Consider valid if in the future or just arrived within the last 45 seconds and not yet sent
    if (!sentKeys.has(alertKey) && timeRemainingMs >= -45000) {
      candidates.push({
        alertKey,
        prayerName: prayer.name,
        arabicName: prayer.arabicName,
        prayerTimeFormatted: prayer.time,
        prayerTimestamp,
        alertTimestamp,
        minutesBefore: offsetMinutes,
        timeRemainingMs: Math.max(0, timeRemainingMs),
        quote: PRAYER_QUOTES[prayer.name] || '"Verily, in the remembrance of Allah do hearts find rest." (13:28)',
      });
    }
  }

  // 2. Calculate tomorrow's prayer times (for late evening or early next morning Fajr)
  const tomorrowDate = new Date(fromDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowDateKey = tomorrowDate.toISOString().split('T')[0];

  const tomorrowCalc = calculatePrayerTimes({
    date: tomorrowDate,
    locationName: userStats.userLocation,
    latitude: userStats.userLatitude,
    longitude: userStats.userLongitude,
    calculationMethod: userStats.prayerCalculationMethod as CalculationMethodKey,
    asrMadhab: userStats.asrJuristicMethod as AsrMadhabKey,
  });

  for (const prayer of tomorrowCalc.prayers) {
    const prayerTimestamp = prayer.timestamp;
    const alertTimestamp = prayerTimestamp - offsetMs;
    const alertKey = `alert_${tomorrowDateKey}_${prayer.name}_${offsetMinutes}m`;
    const timeRemainingMs = alertTimestamp - currentTimestamp;

    if (!sentKeys.has(alertKey) && timeRemainingMs >= -45000) {
      candidates.push({
        alertKey,
        prayerName: prayer.name,
        arabicName: prayer.arabicName,
        prayerTimeFormatted: prayer.time,
        prayerTimestamp,
        alertTimestamp,
        minutesBefore: offsetMinutes,
        timeRemainingMs: Math.max(0, timeRemainingMs),
        quote: PRAYER_QUOTES[prayer.name] || '"Verily, in the remembrance of Allah do hearts find rest." (13:28)',
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort candidates by earliest alertTimestamp
  candidates.sort((a, b) => a.alertTimestamp - b.alertTimestamp);
  return candidates[0];
}

/**
 * Dispatches the prayer alert (audio chime, browser notification, and in-app callback)
 */
export function dispatchPrayerAlert(
  alert: ScheduledPrayerAlert,
  userLocation: string = 'Makkah',
  onInAppNotification?: (event: PrayerNotificationEvent) => void
): PrayerNotificationEvent {
  markNotificationAsSent(alert.alertKey);

  const { title, body, message, quote } = buildPrayerNotificationContent(
    alert.prayerName,
    alert.minutesBefore,
    alert.prayerTimeFormatted,
    userLocation
  );

  // 1. Play serene harmonic audio chime
  playGentleChime(0.25);

  // 2. Send Browser push / desktop notification
  sendBrowserNotification(title, `${body} · ${quote}`, alert.alertKey);

  // 3. Construct event object for In-App UI Toast
  const event: PrayerNotificationEvent = {
    id: alert.alertKey,
    prayerName: alert.prayerName,
    arabicName: alert.arabicName,
    prayerTime: alert.prayerTimeFormatted,
    minutesBefore: alert.minutesBefore,
    message,
    quote,
    timestamp: Date.now(),
  };

  if (onInAppNotification) {
    onInAppNotification(event);
  }

  return event;
}

/**
 * Dynamic Scheduler: Calculates time remaining until the next prayer reminder
 * and dynamically schedules the notification using setTimeout. Automatically reschedules
 * upon timer completion or tab visibility changes.
 *
 * Returns a cleanup function to cancel active timers and listeners.
 */
export function scheduleDynamicPrayerNotifications(
  userStats: UserStats,
  onInAppNotification?: (event: PrayerNotificationEvent) => void
): () => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let isCancelled = false;

  const runDynamicSchedule = () => {
    if (isCancelled || !userStats.isLoggedIn || userStats.notificationsEnabled === false) {
      return;
    }

    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    const nextAlert = calculateNextScheduledAlert(userStats, new Date());
    if (!nextAlert) {
      // Re-evaluate in 30 minutes if no candidates found
      timerId = setTimeout(runDynamicSchedule, 30 * 60 * 1000);
      return;
    }

    const delayMs = nextAlert.timeRemainingMs;

    // If due now (delay <= 1000ms), dispatch immediately and schedule the next prayer alert
    if (delayMs <= 1000) {
      dispatchPrayerAlert(nextAlert, userStats.userLocation || 'Makkah', onInAppNotification);
      // Immediately calculate and schedule the following alert
      timerId = setTimeout(runDynamicSchedule, 2000);
      return;
    }

    // Cap single setTimeout to 24 hours to avoid 32-bit integer overflow in JS runtime
    const cappedDelay = Math.min(delayMs, 24 * 60 * 60 * 1000);

    timerId = setTimeout(() => {
      if (isCancelled) return;
      // When timer fires, check if we reached the actual alert time or need another hop
      const currentRemaining = nextAlert.alertTimestamp - Date.now();
      if (currentRemaining <= 1500) {
        dispatchPrayerAlert(nextAlert, userStats.userLocation || 'Makkah', onInAppNotification);
        timerId = setTimeout(runDynamicSchedule, 2000);
      } else {
        runDynamicSchedule();
      }
    }, cappedDelay);
  };

  // Run dynamic scheduling immediately
  runDynamicSchedule();

  // Tab visibility change listener: When tab regains focus or browser wakes up,
  // re-synchronize dynamic timers to avoid stale background delays
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isCancelled) {
      runDynamicSchedule();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
  };
}

/**
 * Backward compatibility: Single instant check
 */
export function checkAndTriggerPrayerNotifications(
  userStats: UserStats,
  onInAppNotification?: (event: PrayerNotificationEvent) => void
): PrayerNotificationEvent | null {
  if (userStats.notificationsEnabled === false) {
    return null;
  }

  const nextAlert = calculateNextScheduledAlert(userStats, new Date());
  if (nextAlert && nextAlert.timeRemainingMs <= 1000) {
    return dispatchPrayerAlert(nextAlert, userStats.userLocation || 'Makkah', onInAppNotification);
  }
  return null;
}

/**
 * Triggers an immediate test prayer notification so the user can verify
 * how their chosen frequency and audio chime look and sound.
 */
export function triggerTestPrayerNotification(
  frequency: ReminderFrequency = 'Normal',
  prayerName: string = 'Asr',
  locationName: string = 'Makkah',
  onInAppNotification?: (event: PrayerNotificationEvent) => void
): PrayerNotificationEvent {
  const sampleOffset = getFrequencyOffsetMinutes(frequency);
  const sampleTime = '16:45';

  const { title, body, message, quote } = buildPrayerNotificationContent(
    prayerName,
    sampleOffset,
    sampleTime,
    locationName
  );

  playGentleChime(0.3);
  sendBrowserNotification(`[Test] ${title}`, `${body} · ${quote}`, `test-${Date.now()}`);

  const testEvent: PrayerNotificationEvent = {
    id: `test-${Date.now()}`,
    prayerName,
    arabicName: prayerName === 'Asr' ? 'العصر' : prayerName === 'Fajr' ? 'الفجر' : 'الظهر',
    prayerTime: sampleTime,
    minutesBefore: sampleOffset,
    message,
    quote,
    timestamp: Date.now(),
  };

  if (onInAppNotification) {
    onInAppNotification(testEvent);
  }

  return testEvent;
}
