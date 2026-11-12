import { Ayah } from '../types';
import { normalizeQuranArabic, tokenizeArabic } from './tasmee3Matcher';

export type WordMistakeType = 'correct' | 'skipped' | 'wrong' | 'repeated';
export type AyahReviewStatus = 'correct' | 'warning' | 'missing'; // 🟢, 🟡, 🔴

export interface WordDetail {
  index: number;
  canonicalWord: string;       // with original diacritics / Uthmani script
  normalizedCanonical: string; // normalized for matching
  status: WordMistakeType;
  spokenWord?: string;
  explanation?: string;
}

export interface AyahRecitationReview {
  ayahNumber: number;
  canonicalText: string;
  translation?: string;
  status: AyahReviewStatus; // 🟢, 🟡, 🔴
  words: WordDetail[];
  spokenTextSnippet: string;
  summaryNotes: string[];
  skippedCount: number;
  wrongCount: number;
  repeatedCount: number;
  isCompleted: boolean;
  accuracyPercent: number;
}

export interface Tasmee3RangeResult {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  fromAyah: number;
  toAyah: number;
  totalRangeAyahs: number;
  completedAyahsCount: number;
  overallScorePercent: number;
  durationSeconds: number;
  ayahReviews: AyahRecitationReview[];
  spokenFullTranscript: string;
}

/**
 * Splits canonical verse text into words while keeping original diacritics.
 * Normalizes punctuation and Quranic symbols.
 */
export function splitCanonicalWords(verseText: string): string[] {
  if (!verseText) return [];
  // Remove verse numbering symbols like ۝ and extra marks, keep word tokens
  const cleaned = verseText
    .replace(/[\u06D6-\u06ED\u06DD\u06DE\u06E9\u0600-\u0605\uFD3E\uFD3F]/g, '')
    .trim();
  return cleaned.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Performs authentic Qur'anic Arabic mistake detection between canonical Ayah text
 * and the user's spoken Arabic recitation.
 *
 * Evaluates:
 * - Skipped words
 * - Wrong / substituted words
 * - Repeated words / self-corrections
 * - Missing trailing parts / stopped too early
 * - Unrecited / skipped ayahs
 */
export function analyzeAyahRecitation(params: {
  ayah: Ayah;
  spokenText: string;
  wasAttempted: boolean;
}): AyahRecitationReview {
  const { ayah, spokenText, wasAttempted } = params;
  const canonicalWords = splitCanonicalWords(ayah.text);

  // If the verse was not reached/attempted at all in the session
  if (!wasAttempted || !spokenText || spokenText.trim().length === 0) {
    const unrecitedWords: WordDetail[] = canonicalWords.map((cw, idx) => ({
      index: idx,
      canonicalWord: cw,
      normalizedCanonical: normalizeQuranArabic(cw),
      status: 'skipped',
      explanation: 'Not reached or recited in this session',
    }));

    return {
      ayahNumber: ayah.numberInSurah,
      canonicalText: ayah.text,
      translation: ayah.translation,
      status: 'missing', // 🔴
      words: unrecitedWords,
      spokenTextSnippet: '',
      summaryNotes: ['Ayah was not recited or skipped'],
      skippedCount: canonicalWords.length,
      wrongCount: 0,
      repeatedCount: 0,
      isCompleted: false,
      accuracyPercent: 0,
    };
  }

  const spokenTokens = tokenizeArabic(spokenText);
  const normalizedCanonicalWords = canonicalWords.map(w => normalizeQuranArabic(w));

  // Word-level alignment analysis
  const words: WordDetail[] = [];
  let skippedCount = 0;
  let wrongCount = 0;
  let repeatedCount = 0;
  let correctCount = 0;
  const summaryNotes: string[] = [];

  // Track spoken word usage
  const spokenMatchedIndices = new Set<number>();

  // Check for repeated words in spoken text
  const repeatedSpokenWords = new Set<string>();
  for (let i = 0; i < spokenTokens.length - 1; i++) {
    if (spokenTokens[i] === spokenTokens[i + 1]) {
      repeatedSpokenWords.add(spokenTokens[i]);
    }
  }

  let spokenCursor = 0;

  for (let i = 0; i < canonicalWords.length; i++) {
    const cNorm = normalizedCanonicalWords[i];
    const cOriginal = canonicalWords[i];

    if (!cNorm) {
      words.push({
        index: i,
        canonicalWord: cOriginal,
        normalizedCanonical: '',
        status: 'correct',
      });
      continue;
    }

    // Look for match near spokenCursor
    let foundIndex = -1;
    // Look ahead up to 4 words
    for (let offset = 0; offset <= 4; offset++) {
      const testIdx = spokenCursor + offset;
      if (testIdx < spokenTokens.length) {
        const sNorm = spokenTokens[testIdx];
        if (sNorm === cNorm || isCloseArabicMatch(sNorm, cNorm)) {
          foundIndex = testIdx;
          break;
        }
      }
    }

    // If not found ahead, search anywhere in spoken tokens
    if (foundIndex === -1) {
      for (let sIdx = 0; sIdx < spokenTokens.length; sIdx++) {
        if (!spokenMatchedIndices.has(sIdx)) {
          const sNorm = spokenTokens[sIdx];
          if (sNorm === cNorm || isCloseArabicMatch(sNorm, cNorm)) {
            foundIndex = sIdx;
            break;
          }
        }
      }
    }

    if (foundIndex !== -1) {
      spokenMatchedIndices.add(foundIndex);
      const isRepeated = repeatedSpokenWords.has(spokenTokens[foundIndex]);

      if (isRepeated) {
        repeatedCount++;
        words.push({
          index: i,
          canonicalWord: cOriginal,
          normalizedCanonical: cNorm,
          status: 'repeated',
          spokenWord: spokenTokens[foundIndex],
          explanation: `Word repeated in recitation: "${cOriginal}"`,
        });
      } else {
        correctCount++;
        words.push({
          index: i,
          canonicalWord: cOriginal,
          normalizedCanonical: cNorm,
          status: 'correct',
          spokenWord: spokenTokens[foundIndex],
        });
      }

      spokenCursor = foundIndex + 1;
    } else {
      // Word was not found in spoken tokens: check if user substituted with another word or skipped
      if (spokenCursor < spokenTokens.length && !spokenMatchedIndices.has(spokenCursor)) {
        wrongCount++;
        const substituted = spokenTokens[spokenCursor];
        spokenMatchedIndices.add(spokenCursor);
        spokenCursor++;
        words.push({
          index: i,
          canonicalWord: cOriginal,
          normalizedCanonical: cNorm,
          status: 'wrong',
          spokenWord: substituted,
          explanation: `Expected "${cOriginal}", detected "${substituted}"`,
        });
      } else {
        skippedCount++;
        words.push({
          index: i,
          canonicalWord: cOriginal,
          normalizedCanonical: cNorm,
          status: 'skipped',
          explanation: `Word omitted from recitation: "${cOriginal}"`,
        });
      }
    }
  }

  // Calculate completion and overall status
  const totalWords = canonicalWords.filter(w => normalizeQuranArabic(w).length > 0).length;
  const matchRatio = totalWords > 0 ? correctCount / totalWords : 1;
  const accuracyPercent = Math.min(100, Math.round(matchRatio * 100));

  // Determine status (🟢, 🟡, 🔴)
  let status: AyahReviewStatus = 'correct';
  if (matchRatio >= 0.85 && skippedCount === 0 && wrongCount === 0) {
    status = 'correct'; // 🟢
  } else if (matchRatio >= 0.50 || (skippedCount <= 2 && wrongCount <= 1)) {
    status = 'warning'; // 🟡
  } else {
    status = 'missing'; // 🔴
  }

  // Build helpful summary notes
  if (status === 'correct' && repeatedCount === 0) {
    summaryNotes.push('All words recited accurately');
  } else {
    if (skippedCount > 0) {
      summaryNotes.push(`${skippedCount} word${skippedCount > 1 ? 's' : ''} skipped`);
    }
    if (wrongCount > 0) {
      summaryNotes.push(`${wrongCount} word substitution${wrongCount > 1 ? 's' : ''}`);
    }
    if (repeatedCount > 0) {
      summaryNotes.push(`${repeatedCount} word repetition${repeatedCount > 1 ? 's' : ''}`);
    }
    if (skippedCount > totalWords * 0.4) {
      summaryNotes.push('Verse stopped early');
    }
  }

  return {
    ayahNumber: ayah.numberInSurah,
    canonicalText: ayah.text,
    translation: ayah.translation,
    status,
    words,
    spokenTextSnippet: spokenText.trim(),
    summaryNotes: summaryNotes.length > 0 ? summaryNotes : ['Recitation completed'],
    skippedCount,
    wrongCount,
    repeatedCount,
    isCompleted: status !== 'missing',
    accuracyPercent,
  };
}

/**
 * Checks close match allowing for slight phonetic/STT variations in Arabic
 * (e.g. slight hamza variance or trailing waw/alif)
 */
function isCloseArabicMatch(s1: string, s2: string): boolean {
  if (s1 === s2) return true;
  if (!s1 || !s2) return false;
  if (Math.abs(s1.length - s2.length) > 2) return false;

  // Levenshtein distance <= 1 for words of length >= 4
  if (s1.length >= 4 && s2.length >= 4) {
    return levenshteinDistance(s1, s2) <= 1;
  }
  return false;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Generates the complete range analysis review across all chosen ayahs (e.g. Ayah 1 to 10)
 */
export function generateRangeReview(params: {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  fromAyah: number;
  toAyah: number;
  allAyahs: Ayah[];
  spokenByAyah: Map<number, string[]>;
  finalReachedVerse: number;
  durationSeconds: number;
}): Tasmee3RangeResult {
  const {
    surahNumber,
    surahName,
    surahEnglishName,
    fromAyah,
    toAyah,
    allAyahs,
    spokenByAyah,
    finalReachedVerse,
    durationSeconds,
  } = params;

  const rangeAyahs = allAyahs.filter(
    a => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah
  );

  const ayahReviews: AyahRecitationReview[] = [];
  let fullTranscriptArr: string[] = [];

  for (const ayah of rangeAyahs) {
    const num = ayah.numberInSurah;
    const spokenChunks = spokenByAyah.get(num) || [];
    const joinedSpoken = spokenChunks.join(' ').trim();
    if (joinedSpoken) {
      fullTranscriptArr.push(joinedSpoken);
    }

    const wasAttempted = num <= finalReachedVerse;

    const review = analyzeAyahRecitation({
      ayah,
      spokenText: joinedSpoken,
      wasAttempted,
    });

    ayahReviews.push(review);
  }

  const completedAyahsCount = ayahReviews.filter(
    r => r.status === 'correct' || r.status === 'warning'
  ).length;

  const totalScore = ayahReviews.reduce((acc, curr) => acc + curr.accuracyPercent, 0);
  const overallScorePercent = rangeAyahs.length > 0 ? Math.round(totalScore / rangeAyahs.length) : 0;

  return {
    surahNumber,
    surahName,
    surahEnglishName,
    fromAyah,
    toAyah,
    totalRangeAyahs: rangeAyahs.length,
    completedAyahsCount,
    overallScorePercent,
    durationSeconds,
    ayahReviews,
    spokenFullTranscript: fullTranscriptArr.join(' '),
  };
}
