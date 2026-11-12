import { RamadanUserData, RamadanDailyLogEntry, RamadanActivity, InspirationPulseRecord, RamadanGoalCategory } from '../types/ramadan';

const DB_NAME = 'NoorRamadanDB';
const DB_VERSION = 1;
const STORE_PROFILE = 'ramadan_profile';
const STORE_INSPIRATION = 'inspiration_history';

const DEFAULT_PROFILE_ID = 'current_ramadan_user';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'dreamId' });
      }
      if (!db.objectStoreNames.contains(STORE_INSPIRATION)) {
        db.createObjectStore(STORE_INSPIRATION, { keyPath: 'contentId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves the current Ramadan user data from local IndexedDB
 */
export async function getRamadanUserData(): Promise<RamadanUserData | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROFILE, 'readonly');
      const store = tx.objectStore(STORE_PROFILE);
      const request = store.get(DEFAULT_PROFILE_ID);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB read error, checking localStorage fallback:', err);
    try {
      const fallback = localStorage.getItem('noor_ramadan_user_data');
      if (fallback) return JSON.parse(fallback);
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Saves Ramadan user data to local IndexedDB (No cloud sync)
 */
export async function saveRamadanUserData(data: RamadanUserData): Promise<RamadanUserData> {
  const normalized: RamadanUserData = {
    ...data,
    dreamId: DEFAULT_PROFILE_ID,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Local storage mirror for instant synchronous startup reads
    localStorage.setItem('noor_ramadan_user_data', JSON.stringify(normalized));
  } catch {
    // ignore
  }

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROFILE, 'readwrite');
      const store = tx.objectStore(STORE_PROFILE);
      const request = store.put(normalized);

      request.onsuccess = () => resolve(normalized);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error, relying on local state:', err);
    return normalized;
  }
}

/**
 * Records daily check-in (Yes I did / Not today)
 */
export async function recordDailyCheckIn(
  arg1: 'yes' | 'no' | string,
  arg2?: 'yes' | 'no' | string,
  note?: string
): Promise<RamadanUserData> {
  const status: 'yes' | 'no' = (arg1 === 'yes' || arg1 === 'no') ? arg1 : (arg2 === 'yes' || arg2 === 'no') ? arg2 : 'yes';
  const dateStr: string = (arg1 !== 'yes' && arg1 !== 'no') ? arg1 : (typeof arg2 === 'string' && arg2 !== 'yes' && arg2 !== 'no') ? arg2 : new Date().toISOString().split('T')[0];

  let existing = await getRamadanUserData();
  const now = new Date().toISOString();

  if (!existing) {
    existing = {
      dreamId: DEFAULT_PROFILE_ID,
      goalText: 'Fast all 30 days and draw nearer to Allah',
      goalCategory: 'fasting',
      startDate: dateStr,
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      dailyLog: [],
      planActivities: [],
      inspirationPulse: [],
      isCustomPlan: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  const logIndex = existing.dailyLog.findIndex((l) => l.date === dateStr);
  const newEntry: RamadanDailyLogEntry = {
    date: dateStr,
    status,
    timestamp: now,
    notes: note,
  };

  if (logIndex >= 0) {
    existing.dailyLog[logIndex] = newEntry;
  } else {
    existing.dailyLog.push(newEntry);
  }

  // Sort logs by date
  existing.dailyLog.sort((a, b) => a.date.localeCompare(b.date));

  return await saveRamadanUserData(existing);
}

/**
 * Saves plan activities
 */
export async function savePlanActivities(activities: RamadanActivity[]): Promise<RamadanUserData> {
  const existing = await getRamadanUserData();
  if (!existing) {
    throw new Error('User profile must be initialized first');
  }
  existing.planActivities = activities;
  existing.isCustomPlan = true;
  return await saveRamadanUserData(existing);
}

/**
 * Tracks daily inspiration pulse shown and engagement
 */
export async function trackInspirationPulse(
  contentId: string,
  contentType: 'verse' | 'story' | 'statistic' | 'hadith' | 'news',
  engaged: boolean
): Promise<void> {
  const record: InspirationPulseRecord = {
    contentId,
    shownAt: new Date().toISOString(),
    engaged,
    contentType,
  };

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_INSPIRATION, 'readwrite');
    const store = tx.objectStore(STORE_INSPIRATION);
    store.put(record);
  } catch (err) {
    console.warn('Error recording inspiration pulse:', err);
  }

  // Also record in profile data
  const profile = await getRamadanUserData();
  if (profile) {
    const existingIdx = profile.inspirationPulse.findIndex((p) => p.contentId === contentId);
    if (existingIdx >= 0) {
      profile.inspirationPulse[existingIdx] = record;
    } else {
      profile.inspirationPulse.push(record);
    }
    await saveRamadanUserData(profile);
  }
}

/**
 * Retrieves all inspiration pulse history
 */
export async function getInspirationHistory(): Promise<InspirationPulseRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_INSPIRATION, 'readonly');
      const store = tx.objectStore(STORE_INSPIRATION);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
