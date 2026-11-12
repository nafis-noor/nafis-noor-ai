import { UserStats } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD in local time
 */
export function getYesterdayDateString(referenceDate: Date = new Date()): string {
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Validates and adjusts streaks upon app loading.
 * If more than 1 day has passed without activity, streak gracefully resets to 0.
 * A new user who has never performed an activity remains at 0.
 */
export function evaluateStreakIntegrity(stats: UserStats): Partial<UserStats> | null {
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  let hasChanged = false;
  const updates: Partial<UserStats> = {};

  // Check overall streak
  if (stats.lastActivityDate) {
    if (stats.lastActivityDate !== today && stats.lastActivityDate !== yesterday) {
      if (stats.overallStreak > 0) {
        updates.overallStreak = 0;
        hasChanged = true;
      }
    } else if (stats.lastActivityDate === today && (!stats.overallStreak || stats.overallStreak < 1)) {
      updates.overallStreak = 1;
      hasChanged = true;
    }
  } else if (stats.overallStreak > 0) {
    updates.overallStreak = 0;
    hasChanged = true;
  }

  // Check quran streak
  if (stats.quranLastActiveDate) {
    if (stats.quranLastActiveDate !== today && stats.quranLastActiveDate !== yesterday) {
      if (stats.quranStreak > 0) {
        updates.quranStreak = 0;
        hasChanged = true;
      }
    }
  } else if (stats.quranStreak > 0) {
    updates.quranStreak = 0;
    hasChanged = true;
  }

  // Check learning streak
  if (stats.learningLastActiveDate) {
    if (stats.learningLastActiveDate !== today && stats.learningLastActiveDate !== yesterday) {
      if (stats.learningStreak > 0) {
        updates.learningStreak = 0;
        hasChanged = true;
      }
    }
  } else if (stats.learningStreak > 0) {
    updates.learningStreak = 0;
    hasChanged = true;
  }

  // Check dhikr streak
  if (stats.dhikrLastActiveDate) {
    if (stats.dhikrLastActiveDate !== today && stats.dhikrLastActiveDate !== yesterday) {
      if ((stats.dhikrStreak || 0) > 0) {
        updates.dhikrStreak = 0;
        hasChanged = true;
      }
    }
  } else if ((stats.dhikrStreak || 0) > 0) {
    updates.dhikrStreak = 0;
    hasChanged = true;
  }

  return hasChanged ? updates : null;
}

/**
 * Records an authentic user action (Quran reading, completing a lesson, Dhikr, or logging prayer)
 * and updates the streak based on real dates.
 */
export function recordUserActivity(
  stats: UserStats,
  activityType: 'quran' | 'learning' | 'dhikr' | 'prayer'
): Partial<UserStats> {
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  let newOverallStreak = stats.overallStreak || 0;
  let newQuranStreak = stats.quranStreak || 0;
  let newLearningStreak = stats.learningStreak || 0;
  let newDhikrStreak = stats.dhikrStreak || 0;

  // 1. Overall streak calculation
  if (!stats.lastActivityDate) {
    // First ever activity for new user
    newOverallStreak = 1;
  } else if (stats.lastActivityDate === today) {
    // Already counted today
    newOverallStreak = stats.overallStreak || 1;
  } else if (stats.lastActivityDate === yesterday) {
    // Consecutive day
    newOverallStreak = (stats.overallStreak || 0) + 1;
  } else {
    // Streak broken, starting new streak of 1
    newOverallStreak = 1;
  }

  // 2. Specific streak calculation
  let quranDate = stats.quranLastActiveDate;
  if (activityType === 'quran') {
    if (!stats.quranLastActiveDate) {
      newQuranStreak = 1;
    } else if (stats.quranLastActiveDate === today) {
      newQuranStreak = stats.quranStreak || 1;
    } else if (stats.quranLastActiveDate === yesterday) {
      newQuranStreak = (stats.quranStreak || 0) + 1;
    } else {
      newQuranStreak = 1;
    }
    quranDate = today;
  }

  let learningDate = stats.learningLastActiveDate;
  if (activityType === 'learning') {
    if (!stats.learningLastActiveDate) {
      newLearningStreak = 1;
    } else if (stats.learningLastActiveDate === today) {
      newLearningStreak = stats.learningStreak || 1;
    } else if (stats.learningLastActiveDate === yesterday) {
      newLearningStreak = (stats.learningStreak || 0) + 1;
    } else {
      newLearningStreak = 1;
    }
    learningDate = today;
  }

  let dhikrDate = stats.dhikrLastActiveDate;
  if (activityType === 'dhikr') {
    if (!stats.dhikrLastActiveDate) {
      newDhikrStreak = 1;
    } else if (stats.dhikrLastActiveDate === today) {
      newDhikrStreak = stats.dhikrStreak || 1;
    } else if (stats.dhikrLastActiveDate === yesterday) {
      newDhikrStreak = (stats.dhikrStreak || 0) + 1;
    } else {
      newDhikrStreak = 1;
    }
    dhikrDate = today;
  }

  // Record into history
  const history = stats.activityHistory ? [...stats.activityHistory] : [];
  if (!history.some(h => h.date === today && h.type === activityType)) {
    history.push({ date: today, type: activityType });
  }

  return {
    overallStreak: newOverallStreak,
    quranStreak: newQuranStreak,
    learningStreak: newLearningStreak,
    dhikrStreak: newDhikrStreak,
    lastActivityDate: today,
    quranLastActiveDate: quranDate,
    learningLastActiveDate: learningDate,
    dhikrLastActiveDate: dhikrDate,
    activityHistory: history.slice(-60), // Keep last 60 days
  };
}

/**
 * Returns milliseconds until next local midnight (00:00:00)
 */
export function getMillisecondsUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1000, midnight.getTime() - now.getTime());
}

/**
 * Calculates hours & minutes remaining until midnight in local time
 */
export function getTimeRemainingInDay(now: Date = new Date()): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  isUrgent: boolean;
  formattedTime: string;
} {
  const ms = getMillisecondsUntilMidnight(now);
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  // Urgent if 6 hours or less remaining before midnight (i.e. past 6:00 PM)
  const isUrgent = totalMinutes <= 360;
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return { hours, minutes, totalMinutes, isUrgent, formattedTime };
}

export interface StreakRiskStatus {
  isAtRisk: boolean;
  hoursLeft: number;
  minutesLeft: number;
  totalMinutesLeft: number;
  formattedTime: string;
  currentStreak: number;
  hasActivityToday: boolean;
  todayDate: string;
}

/**
 * Checks if the user is in danger of losing their active streak.
 * Condition:
 * - User has an active streak (overallStreak > 0)
 * - User has NOT recorded activity today (lastActivityDate !== today)
 * - Time remaining is in the warning window (<= 6 hours before midnight, or after 6:00 PM)
 */
export function checkStreakRisk(stats: UserStats, now: Date = new Date()): StreakRiskStatus {
  const todayDate = getLocalDateString(now);
  const hasActivityToday = stats.lastActivityDate === todayDate;
  const currentStreak = stats.overallStreak || 0;
  const remaining = getTimeRemainingInDay(now);

  const isAtRisk = currentStreak > 0 && !hasActivityToday && remaining.isUrgent;

  return {
    isAtRisk,
    hoursLeft: remaining.hours,
    minutesLeft: remaining.minutes,
    totalMinutesLeft: remaining.totalMinutes,
    formattedTime: remaining.formattedTime,
    currentStreak,
    hasActivityToday,
    todayDate,
  };
}
