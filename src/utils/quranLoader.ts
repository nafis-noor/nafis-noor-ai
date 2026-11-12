import { Ayah } from '../types';
import { ALL_SURAHS } from '../data/quranData';
import { getLanguageCode, getGlobalLanguage, getLanguageHeaders } from './i18n';
import { QURAN_EDITIONS } from './quranTranslations';

// In-memory runtime cache for verified complete Surahs keyed by `surahNumber_langCode`
const runtimeSurahCache: Record<string, Ayah[]> = {};

// Track background preloading status
const preloadedSurahs = new Set<string>();

// Canonical Ayah counts for all 114 Surahs
export const CANONICAL_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

/**
 * Validates that an array of Ayahs is strictly complete, sequential, and contains authentic text
 */
export function validateSurahAyahs(surahNumber: number, ayahs: Ayah[]): boolean {
  if (!Array.isArray(ayahs) || ayahs.length === 0) return false;
  const expected = CANONICAL_COUNTS[surahNumber];
  if (expected && ayahs.length !== expected) return false;
  
  // Verify ordering and content
  for (let i = 0; i < ayahs.length; i++) {
    const a = ayahs[i];
    if (!a.text || !a.text.trim()) return false;
    if (a.numberInSurah !== i + 1) return false;
  }
  return true;
}

/**
 * Loads the COMPLETE verified Ayahs for any Surah (1 - 114) in the user's chosen language
 * Uses multi-tier caching (Memory -> LocalStorage -> Backend API -> Direct Cloud API)
 */
export async function loadCompleteSurah(surahNumber: number, langCode?: string): Promise<Ayah[]> {
  if (surahNumber < 1 || surahNumber > 114) {
    throw new Error(`Invalid Surah number: ${surahNumber}`);
  }

  const activeLang = getLanguageCode(langCode || getGlobalLanguage());
  const cacheKey = `${surahNumber}_${activeLang}`;
  const editionInfo = QURAN_EDITIONS[activeLang] || QURAN_EDITIONS.en;
  const editionId = editionInfo.id;

  // Tier 1: In-memory cache
  if (runtimeSurahCache[cacheKey] && runtimeSurahCache[cacheKey].length > 0) {
    return runtimeSurahCache[cacheKey];
  }

  // Tier 2: LocalStorage cache
  const storageKey = `noor_full_surah_v3_${surahNumber}_${activeLang}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: Ayah[] = JSON.parse(raw);
      if (validateSurahAyahs(surahNumber, parsed)) {
        runtimeSurahCache[cacheKey] = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore storage reading error
  }

  // Tier 3: Internal server API route
  try {
    const res = await fetch(`/api/quran/surah/${surahNumber}?lang=${activeLang}`, {
      headers: getLanguageHeaders({ Accept: 'application/json' }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.ayahs)) {
        const ayahs: Ayah[] = json.data.ayahs;
        if (validateSurahAyahs(surahNumber, ayahs)) {
          runtimeSurahCache[cacheKey] = ayahs;
          try {
            localStorage.setItem(storageKey, JSON.stringify(ayahs));
          } catch {
            // storage full safe
          }
          return ayahs;
        }
      }
    }
  } catch (err) {
    console.warn(`[QuranLoader] Backend route unavailable for Surah ${surahNumber} (${activeLang}), trying direct fallback...`, err);
  }

  // Tier 4: Direct fallback to AlQuran Cloud API (Uthmani + Selected Language Edition)
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,${editionId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arabic = json.data[0]?.ayahs || [];
        const translation = json.data[1]?.ayahs || [];

        const combined: Ayah[] = arabic.map((item: any, idx: number) => ({
          number: item.number,
          numberInSurah: item.numberInSurah,
          text: item.text?.trim() || '',
          translation: translation[idx]?.text?.trim() || '',
          juz: item.juz || 1,
          page: item.page || 1,
        }));

        if (validateSurahAyahs(surahNumber, combined)) {
          runtimeSurahCache[cacheKey] = combined;
          try {
            localStorage.setItem(storageKey, JSON.stringify(combined));
          } catch {
            // storage full safe
          }
          return combined;
        }
      }
    }
  } catch (err) {
    console.error(`[QuranLoader] Direct cloud fetch failed for Surah ${surahNumber} (${activeLang}):`, err);
  }

  // Final fallback to bundled data if network is completely down
  const surahMeta = ALL_SURAHS.find(s => s.number === surahNumber);
  if (surahMeta && surahMeta.sampleAyahs && surahMeta.sampleAyahs.length > 0) {
    return surahMeta.sampleAyahs;
  }

  throw new Error(`Unable to load complete Qur'an text for Surah ${surahNumber}`);
}

/**
 * Preloads adjacent Surahs in the background for zero-wait reading transitions
 */
export function preloadAdjacentSurahs(currentSurahNumber: number, langCode?: string): void {
  const activeLang = getLanguageCode(langCode || getGlobalLanguage());
  const toPreload = [currentSurahNumber + 1, currentSurahNumber - 1].filter(n => n >= 1 && n <= 114);
  for (const surahNum of toPreload) {
    const key = `${surahNum}_${activeLang}`;
    if (!preloadedSurahs.has(key) && !runtimeSurahCache[key]) {
      preloadedSurahs.add(key);
      setTimeout(() => {
        loadCompleteSurah(surahNum, activeLang).catch(() => {});
      }, 500);
    }
  }
}
