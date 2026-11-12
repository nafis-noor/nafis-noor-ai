import { Ayah, Surah } from '../types';
import { ALL_SURAHS } from '../data/quranData';

/**
 * Normalizes Arabic text for Qur'anic recitation matching:
 * - Strips all Tashkeel (harakat: fatha, damma, kasra, sukun, shaddah, tanwin)
 * - Strips Qur'anic pause/stop marks (sajdah, rub el hizb, high meem, high jeem, etc.)
 * - Strips Tatweel (kashida)
 * - Normalizes Alif variants (أ, إ, آ, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa (ى -> ي)
 * - Strips all numbers, punctuation, symbols, and extra whitespace
 */
export function normalizeQuranArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove Quranic annotation symbols (e.g., stops, ayah markers, sajdah, rub el hizb)
    .replace(/[\u06D6-\u06ED\u06DD\u06DE\u06E9\u0600-\u0605\uFD3E\uFD3F]/g, '')
    // Remove Tashkeel / Harakat (fatha, damma, kasra, sukun, shaddah, tanwin, dagger alif, maddah)
    .replace(/[\u064B-\u065F\u0670\u0653\u0654\u0655]/g, '')
    // Remove Tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize Alif forms (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Alif Maqsurah to Yaa (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Waslah and special Arabic forms
    .replace(/[\u0671]/g, 'ا')
    // Keep only Arabic letter characters and spaces
    .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a consonantal skeleton for Uthmani vs standard ASR word comparison
 */
function wordSkeleton(w: string): string {
  if (!w || w.length <= 2) return w;
  const prefix = w.startsWith('ال') ? 'ال' : w[0];
  const rest = w.slice(prefix.length).replace(/[اويء]/g, '');
  return prefix + rest;
}

/**
 * Checks if two normalized Arabic words match (handling Uthmani spelling differences)
 */
export function isArabicWordFuzzyMatch(w1: string, w2: string): boolean {
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;
  const stripConj = (s: string) =>
    s.length > 3 && (s.startsWith('و') || s.startsWith('ف')) ? s.slice(1) : s;
  if (stripConj(w1) === stripConj(w2)) return true;

  const s1 = wordSkeleton(w1);
  const s2 = wordSkeleton(w2);
  if (s1.length >= 2 && s1 === s2) return true;
  if (s1.length >= 3 && stripConj(s1) === stripConj(s2)) return true;

  return false;
}

/**
 * Breaks normalized Arabic text into word tokens
 */
export function tokenizeArabic(text: string): string[] {
  const norm = normalizeQuranArabic(text);
  if (!norm) return [];
  return norm.split(' ').filter(w => w.length > 0);
}

export interface Tasmee3MatchResult {
  matchedVerseNumber: number | null;
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  confidenceScore: number;
  isUncertain: boolean;
  message?: string;
  matchedWordsCount: number;
  matchedVerseText?: string;
}

/**
 * Scores how well spoken tokens match a single candidate verse
 */
function scoreVerseAgainstSpoken(
  verse: Ayah,
  spokenNormalized: string,
  spokenTokens: string[],
  currentVerseNumber: number,
  applyDistancePenalty: boolean
): { score: number; matchedWords: number } {
  const verseNorm = normalizeQuranArabic(verse.text);
  const verseTokens = tokenizeArabic(verseNorm);
  if (verseTokens.length === 0) return { score: 0, matchedWords: 0 };

  if (verseNorm.includes(spokenNormalized) && spokenTokens.length >= 2) {
    return { score: 0.95, matchedWords: spokenTokens.length };
  }

  if (spokenNormalized.includes(verseNorm) && verseTokens.length >= 2) {
    return { score: 0.9, matchedWords: verseTokens.length };
  }

  let tokenMatchCount = 0;
  for (const sWord of spokenTokens) {
    if (verseTokens.some(vWord => isArabicWordFuzzyMatch(vWord, sWord))) {
      tokenMatchCount++;
    }
  }

  let consecutiveMatches = 0;
  for (let i = 0; i < spokenTokens.length - 1; i++) {
    const s1 = spokenTokens[i];
    const s2 = spokenTokens[i + 1];
    for (let j = 0; j < verseTokens.length - 1; j++) {
      if (isArabicWordFuzzyMatch(verseTokens[j], s1) && isArabicWordFuzzyMatch(verseTokens[j + 1], s2)) {
        consecutiveMatches += 2;
        break;
      }
    }
  }

  const spokenCoverage = tokenMatchCount / spokenTokens.length;
  const verseCoverage = tokenMatchCount / verseTokens.length;
  const distancePenalty = applyDistancePenalty
    ? Math.abs(verse.numberInSurah - currentVerseNumber) * 0.03
    : 0;

  const score = Math.max(
    0,
    spokenCoverage * 0.4 + verseCoverage * 0.3 + (consecutiveMatches > 0 ? 0.35 : 0) - distancePenalty
  );

  return { score, matchedWords: tokenMatchCount };
}

/**
 * Genuine Quran recitation verse matcher:
 * 1. First checks around currentVerseNumber.
 * 2. If not found in local window, checks ALL verses in candidateVerses so the user can start from any Ayah.
 */
export function matchRecitationToVerses(params: {
  spokenText: string;
  candidateVerses: Ayah[];
  currentVerseNumber: number;
  windowBack?: number;
  windowForward?: number;
}): Tasmee3MatchResult {
  const {
    spokenText,
    candidateVerses,
    currentVerseNumber,
    windowBack = 1,
    windowForward = 4,
  } = params;

  const spokenNormalized = normalizeQuranArabic(spokenText);
  const istiAdhah = new Set(['اعوذ', 'بالله', 'من', 'الشيطان', 'الرجيم']);
  const spokenTokens = tokenizeArabic(spokenNormalized).filter(w => !istiAdhah.has(w));

  if (!spokenNormalized || spokenTokens.length < 2) {
    return {
      matchedVerseNumber: null,
      confidence: 'uncertain',
      confidenceScore: 0,
      isUncertain: true,
      message: "We’re not sure where you are. Please continue or repeat the verse.",
      matchedWordsCount: 0,
    };
  }

  // Tier 1: Local window around currentVerseNumber
  const minVerse = Math.max(1, currentVerseNumber - windowBack);
  const maxVerse = currentVerseNumber + windowForward;
  const windowVerses = candidateVerses.filter(
    v => v.numberInSurah >= minVerse && v.numberInSurah <= maxVerse
  );

  let bestMatchVerse: Ayah | null = null;
  let bestScore = 0;
  let bestMatchedWords = 0;

  for (const verse of windowVerses) {
    const { score, matchedWords } = scoreVerseAgainstSpoken(
      verse,
      spokenTokens.join(' '),
      spokenTokens,
      currentVerseNumber,
      true
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatchVerse = verse;
      bestMatchedWords = matchedWords;
    }
  }

  // Tier 2: Full-Surah search if the user started reciting a different Ayah in the same Surah
  if (!bestMatchVerse || bestScore < 0.48 || bestMatchedWords < 2) {
    for (const verse of candidateVerses) {
      const { score, matchedWords } = scoreVerseAgainstSpoken(
        verse,
        spokenTokens.join(' '),
        spokenTokens,
        currentVerseNumber,
        false
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatchVerse = verse;
        bestMatchedWords = matchedWords;
      }
    }
  }

  if (bestMatchVerse && bestScore >= 0.48 && bestMatchedWords >= 2) {
    const isHigh = bestScore >= 0.7 || bestMatchedWords >= 3;
    return {
      matchedVerseNumber: bestMatchVerse.numberInSurah,
      confidence: isHigh ? 'high' : 'medium',
      confidenceScore: Math.min(1, Math.round(bestScore * 100) / 100),
      isUncertain: false,
      matchedWordsCount: bestMatchedWords,
      matchedVerseText: bestMatchVerse.text,
    };
  }

  return {
    matchedVerseNumber: null,
    confidence: 'uncertain',
    confidenceScore: Math.round(bestScore * 100) / 100,
    isUncertain: true,
    message: "We’re not sure where you are. Please continue or repeat the verse.",
    matchedWordsCount: bestMatchedWords,
  };
}

/**
 * Detects if the user is reciting a DIFFERENT Surah across all 114 Surahs
 * (e.g., opened Surah Al-Kafirun but started reciting Surah Al-Masad "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ"
 * or spoke the Surah name "سورة المسد").
 */
export function detectSpokenSurahAcrossQuran(
  spokenText: string,
  excludeSurahNumber?: number
): { surah: Surah; ayahNumber: number } | null {
  const norm = normalizeQuranArabic(spokenText);
  const tokens = tokenizeArabic(norm).filter(
    w => !['اعوذ', 'بالله', 'الشيطان', 'الرجيم', 'بسم', 'الله', 'الرحمن', 'الرحيم'].includes(w)
  );
  if (tokens.length === 0) return null;

  // 1. Check if the user said the Surah name (e.g., "سورة المسد" or "المسد")
  for (const s of ALL_SURAHS) {
    const normName = normalizeQuranArabic(s.name);
    if (!normName) continue;
    if (
      norm.includes(`سوره ${normName}`) ||
      (tokens.length <= 2 &&
        tokens.some(
          t => t === normName || (normName.startsWith('ال') && t === normName.slice(2))
        ))
    ) {
      return { surah: s, ayahNumber: 1 };
    }
  }

  if (tokens.length < 2) return null;

  // 2. Check all 114 Surahs' known verses for a 2+ consecutive word match
  const recentTokens = tokens.slice(-6);
  let best: { surah: Surah; ayahNumber: number; score: number } | null = null;

  for (const s of ALL_SURAHS) {
    if (excludeSurahNumber && s.number === excludeSurahNumber) continue;
    if (!s.sampleAyahs) continue;

    for (const ayah of s.sampleAyahs) {
      const { score, matchedWords } = scoreVerseAgainstSpoken(
        ayah,
        recentTokens.join(' '),
        recentTokens,
        1,
        false
      );
      if (matchedWords >= 2 && score >= 0.55) {
        const bonus = ayah.numberInSurah === 1 ? 0.08 : 0;
        const totalScore = score + bonus;
        if (!best || totalScore > best.score) {
          best = { surah: s, ayahNumber: ayah.numberInSurah, score: totalScore };
        }
      }
    }
  }

  return best ? { surah: best.surah, ayahNumber: best.ayahNumber } : null;
}

