import { PrayerRecord, PrayerName, PrayerCheckStatus } from '../types/prayerCheck';

const DB_NAME = 'NoorPrayerCheckDB';
const DB_VERSION = 1;
const STORE_NAME = 'prayer_records';

/**
 * Initializes and opens the IndexedDB database instance
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'prayerId' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('prayerName', 'prayerName', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves or updates a prayer record in IndexedDB (No cloud sync)
 */
export async function savePrayerRecord(record: PrayerRecord): Promise<PrayerRecord> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve(record);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves a single prayer record by its unique prayerId (e.g. "2026-10-24_fajr")
 */
export async function getPrayerRecord(prayerId: string): Promise<PrayerRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(prayerId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves all prayer records for a specific date (YYYY-MM-DD)
 */
export async function getRecordsByDate(dateStr: string): Promise<PrayerRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.getAll(IDBKeyRange.only(dateStr));

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves all historical prayer records stored locally
 */
export async function getAllPrayerRecords(): Promise<PrayerRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort newest to oldest
      const records = (request.result || []) as PrayerRecord[];
      records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      resolve(records);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Auto-logs a prayer as 'missed' if 30 minutes have elapsed without response
 */
export async function markPrayerAsMissed(
  prayerId: string,
  date: string,
  prayerName: PrayerName,
  scheduledTime?: string
): Promise<PrayerRecord> {
  const existing = await getPrayerRecord(prayerId);
  if (existing && existing.status !== 'missed') {
    return existing; // Already confirmed or recorded
  }

  const record: PrayerRecord = {
    prayerId,
    date,
    prayerName,
    status: 'missed',
    confirmedAt: null,
    oathGiven: false,
    scheduledTime,
    createdAt: new Date().toISOString(),
  };

  return await savePrayerRecord(record);
}

/**
 * Generates standard prayerId from date and prayer name (e.g. "2026-10-24_fajr")
 */
export function buildPrayerId(dateStr: string, prayerName: PrayerName): string {
  return `${dateStr}_${prayerName.toLowerCase()}`;
}
