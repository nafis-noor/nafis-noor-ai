export interface QuranSearchMatch {
  number: number;
  numberInSurah: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType?: string;
    numberOfAyahs?: number;
  };
  juz?: number;
  page?: number;
}

export interface QuranSearchResult {
  count: number;
  matches: QuranSearchMatch[];
  query: string;
  isArabic: boolean;
}

// Client-side in-memory cache for fast search responses
const clientSearchCache = new Map<string, QuranSearchResult>();

/**
 * Searches across the Quran verses by keyword in English or Arabic
 */
export async function searchQuranVerses(
  query: string,
  surahNumber: number | 'all' = 'all'
): Promise<QuranSearchResult> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { count: 0, matches: [], query: trimmed, isArabic: false };
  }

  const cacheKey = `${trimmed.toLowerCase()}_${surahNumber}`;
  if (clientSearchCache.has(cacheKey)) {
    return clientSearchCache.get(cacheKey)!;
  }

  const isArabic = /[\u0600-\u06FF]/.test(trimmed);

  // 1. Try Internal Backend Route
  try {
    const res = await fetch(`/api/quran/search?q=${encodeURIComponent(trimmed)}&surah=${surahNumber}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const result: QuranSearchResult = json.data;
        clientSearchCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('[QuranSearch] Internal route unavailable, falling back to direct API...', err);
  }

  // 2. Direct Fallback to AlQuran Cloud API (404 means 0 matches)
  const editions = isArabic ? ['quran-simple-clean', 'quran-simple'] : ['en.sahih'];
  const targetSurah = surahNumber === 'all' ? 'all' : String(surahNumber);

  for (const edition of editions) {
    try {
      const res = await fetch(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(trimmed)}/${targetSurah}/${edition}`
      );

      if (res.ok) {
        const json = await res.json();
        if (json.code === 200 && json.data) {
          const rawMatches = Array.isArray(json.data.matches) ? json.data.matches : [];
          if (rawMatches.length > 0) {
            const matches: QuranSearchMatch[] = rawMatches.map((m: any) => ({
              number: m.number,
              numberInSurah: m.numberInSurah,
              text: m.text,
              surah: {
                number: m.surah.number,
                name: m.surah.name,
                englishName: m.surah.englishName,
                englishNameTranslation: m.surah.englishNameTranslation,
                revelationType: m.surah.revelationType,
                numberOfAyahs: m.surah.numberOfAyahs,
              },
              juz: m.juz || 1,
              page: m.page || 1,
            }));

            const result: QuranSearchResult = {
              count: json.data.count || matches.length,
              matches,
              query: trimmed,
              isArabic,
            };

            clientSearchCache.set(cacheKey, result);
            return result;
          }
        }
      }
    } catch {
      // Ignore network/404 and continue
    }
  }

  return { count: 0, matches: [], query: trimmed, isArabic };
}

/**
 * Popular inspirational keywords for quick search exploration
 */
export const POPULAR_QURAN_KEYWORDS = [
  { label: 'Light (Noor)', query: 'light', arabic: 'نور' },
  { label: 'Mercy (Rahmah)', query: 'mercy', arabic: 'رحمة' },
  { label: 'Patience (Sabr)', query: 'patience', arabic: 'صبر' },
  { label: 'Paradise (Jannah)', query: 'gardens', arabic: 'جنة' },
  { label: 'Forgiveness', query: 'forgive', arabic: 'مغفرة' },
  { label: 'Parents', query: 'parents', arabic: 'الوالدين' },
  { label: 'Peace (Salam)', query: 'peace', arabic: 'سلام' },
  { label: 'Prayer (Salah)', query: 'prayer', arabic: 'الصلاة' },
  { label: 'Heart (Qalb)', query: 'heart', arabic: 'قلب' },
  { label: 'Gratitude (Shukr)', query: 'grateful', arabic: 'شكر' },
];
