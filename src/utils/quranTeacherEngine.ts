import { Ayah } from '../types';
import { RecitationEvaluationResult, RecitationWordMatch } from '../types/quranTeacher';
import { filterNoiseAndAccidentalWords } from './quranTeacherCaringPhrases';

/**
 * Normalizes Arabic text by removing vowels (tashkeel), tanween, tatweel,
 * normalizing different forms of Alif, Taa Marbutah, and Alif Maqsurah.
 */
export function normalizeQuranArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove Quranic recitation symbols & pause marks
    .replace(/[\u06D6-\u06ED\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    // Remove tashkeel (diacritics: fatha, damma, kasra, sukun, shadda, tanween)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize alif with hamza / madd / wasla
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize taa marbuta to haa or preserve
    .replace(/ة/g, 'ه')
    // Normalize alif maqsurah to yaa
    .replace(/ى/g, 'ي')
    // Remove punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips non-alphabetic Arabic characters from a single word for token comparison
 */
function cleanWordForComparison(word: string): string {
  return normalizeQuranArabic(word).replace(/[^\u0600-\u06FF]/g, '');
}

/**
 * Tokenizes an authentic Ayah text into words with both raw representation
 * (with original tashkeel) and clean normalized form.
 */
export function tokenizeAyah(ayahText: string): { raw: string; normalized: string }[] {
  if (!ayahText) return [];
  const rawWords = ayahText.trim().split(/\s+/);
  return rawWords
    .map((raw) => ({
      raw,
      normalized: cleanWordForComparison(raw),
    }))
    .filter((w) => w.normalized.length > 0);
}

/**
 * Calculates Levenshtein distance between two normalized words
 */
function wordLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Determines whether two normalized Arabic words match closely enough,
 * accounting for common speech recognition minor variations (e.g. prefix 'wa', 'fa', 'al').
 */
function areWordsMatching(expected: string, spoken: string): { match: boolean; similarity: number } {
  if (expected === spoken) return { match: true, similarity: 1 };
  if (!expected || !spoken) return { match: false, similarity: 0 };

  // Common prefix checks in spoken Quran (e.g., 'و', 'ف', 'ال')
  if (spoken.startsWith('و') && spoken.slice(1) === expected) {
    return { match: true, similarity: 0.9 };
  }
  if (expected.startsWith('و') && expected.slice(1) === spoken) {
    return { match: true, similarity: 0.9 };
  }
  if (spoken.startsWith('ال') && spoken.slice(2) === expected) {
    return { match: true, similarity: 0.9 };
  }
  if (expected.startsWith('ال') && expected.slice(2) === spoken) {
    return { match: true, similarity: 0.9 };
  }

  const maxLen = Math.max(expected.length, spoken.length);
  const dist = wordLevenshteinDistance(expected, spoken);
  const similarity = Math.max(0, 1 - dist / maxLen);

  // Short words (<= 3 chars) require exact or 1-dist match
  if (maxLen <= 3) {
    return { match: dist === 0 || (dist === 1 && similarity >= 0.65), similarity };
  }

  // Medium to long words: allow up to 1-2 character variation
  return { match: similarity >= 0.72, similarity };
}

/**
 * Evaluates the student's spoken recitation against the verified Ayah.
 * Strictly adheres to truthfulness: does NOT invent fake Tajweed claims,
 * and detects missing words, extra words, mispronounced words, and premature stops.
 */
export function evaluateRecitationAgainstAyah(
  spokenTranscript: string,
  targetAyah: Ayah,
  surahNumber: number,
  options?: {
    isFirstAyah?: boolean;
    hasBismillahPrefix?: boolean;
  }
): RecitationEvaluationResult {
  // Filter acoustic noise, coughs, and accidental non-word tokens
  const { cleaned: noiseFilteredTranscript, isNoiseOnly } = filterNoiseAndAccidentalWords(spokenTranscript || '');
  const cleanTranscript = normalizeQuranArabic(noiseFilteredTranscript || '');
  const spokenWords = isNoiseOnly
    ? []
    : cleanTranscript
        .split(/\s+/)
        .map(cleanWordForComparison)
        .filter((w) => w.length > 0);

  const canonicalTokens = tokenizeAyah(targetAyah.text);
  const totalCanonicalWords = canonicalTokens.length;

  // Empty or negligible input
  if (spokenWords.length === 0) {
    return {
      ayahNumber: targetAyah.numberInSurah,
      ayahText: targetAyah.text,
      spokenTranscript: spokenTranscript || '',
      isCorrect: false,
      accuracyScore: 0,
      missingWords: canonicalTokens.map((t) => t.raw),
      extraWords: [],
      incorrectWords: [],
      repeatedWords: [],
      isPrematureStop: false,
      isWrongAyah: false,
      feedbackMessage: 'No recitation detected yet. Take your time and begin when ready.',
      spokenFeedbackInstruction: 'Take your time. Begin reciting when you are ready.',
      wordMatches: canonicalTokens.map((t) => ({
        expectedWord: t.raw,
        normalizedExpected: t.normalized,
        status: 'missing',
      })),
    };
  }

  // Handle Bismillah prefix if user recited Bismillah before Ayah 1
  let adjustedSpokenWords = [...spokenWords];
  const bismillahTokens = ['بسم', 'الله', 'الرحمن', 'الرحيم'];
  if (
    targetAyah.numberInSurah !== 1 &&
    adjustedSpokenWords.length >= 4 &&
    bismillahTokens.every((b, idx) => areWordsMatching(b, adjustedSpokenWords[idx]).match)
  ) {
    // User recited Bismillah before the non-Fatihah ayah - politely skip the Bismillah prefix
    adjustedSpokenWords = adjustedSpokenWords.slice(4);
  }

  // Dynamic alignment of spoken words to canonical ayah words
  const wordMatches: RecitationWordMatch[] = [];
  const missingWords: string[] = [];
  const incorrectWords: { expected: string; spoken: string }[] = [];
  const extraWords: string[] = [];

  let spokenIndex = 0;
  let correctCount = 0;

  for (let expIndex = 0; expIndex < canonicalTokens.length; expIndex++) {
    const expected = canonicalTokens[expIndex];
    if (spokenIndex >= adjustedSpokenWords.length) {
      // Remaining words are missing
      missingWords.push(expected.raw);
      wordMatches.push({
        expectedWord: expected.raw,
        normalizedExpected: expected.normalized,
        status: 'missing',
      });
      continue;
    }

    const currentSpoken = adjustedSpokenWords[spokenIndex];
    const matchResult = areWordsMatching(expected.normalized, currentSpoken);

    if (matchResult.match) {
      // Direct match
      correctCount++;
      wordMatches.push({
        expectedWord: expected.raw,
        normalizedExpected: expected.normalized,
        matchedSpokenWord: currentSpoken,
        status: 'correct',
      });
      spokenIndex++;
    } else {
      // Lookahead: Did the student accidentally skip one word, or say an extra word?
      const nextSpoken = spokenIndex + 1 < adjustedSpokenWords.length ? adjustedSpokenWords[spokenIndex + 1] : null;
      const nextMatch = nextSpoken ? areWordsMatching(expected.normalized, nextSpoken) : null;

      const nextExpected = expIndex + 1 < canonicalTokens.length ? canonicalTokens[expIndex + 1] : null;
      const skipMatch = nextExpected ? areWordsMatching(nextExpected.normalized, currentSpoken) : null;

      if (nextMatch && nextMatch.match) {
        // Current spoken was an extra word, next spoken matches this expected word
        extraWords.push(currentSpoken);
        spokenIndex++;
        correctCount++;
        wordMatches.push({
          expectedWord: expected.raw,
          normalizedExpected: expected.normalized,
          matchedSpokenWord: nextSpoken,
          status: 'correct',
        });
        spokenIndex++;
      } else if (skipMatch && skipMatch.match) {
        // Student skipped the current expected word and moved straight to next expected
        missingWords.push(expected.raw);
        wordMatches.push({
          expectedWord: expected.raw,
          normalizedExpected: expected.normalized,
          status: 'missing',
        });
      } else {
        // Mispronounced or substituted word
        incorrectWords.push({ expected: expected.raw, spoken: currentSpoken });
        wordMatches.push({
          expectedWord: expected.raw,
          normalizedExpected: expected.normalized,
          matchedSpokenWord: currentSpoken,
          status: 'incorrect',
        });
        spokenIndex++;
      }
    }
  }

  // Any remaining spoken words after canonical ends are extra words
  while (spokenIndex < adjustedSpokenWords.length) {
    extraWords.push(adjustedSpokenWords[spokenIndex]);
    spokenIndex++;
  }

  const accuracyScore = Math.round((correctCount / Math.max(totalCanonicalWords, 1)) * 100);

  // Determine specific issue category
  const isPrematureStop =
    missingWords.length > 0 &&
    correctCount > 0 &&
    spokenWords.length < totalCanonicalWords * 0.7 &&
    incorrectWords.length <= 1;

  const isWrongAyah = correctCount === 0 && spokenWords.length >= 3;

  // Decide correctness:
  // Requires >= 85% accuracy and no critical missing words (at most 0 missing words for short ayahs, 1 for long ayahs)
  const maxAllowedMissing = totalCanonicalWords > 10 ? 1 : 0;
  const isCorrect =
    accuracyScore >= 85 &&
    missingWords.length <= maxAllowedMissing &&
    incorrectWords.length === 0 &&
    !isPrematureStop &&
    !isWrongAyah;

  // Formulate honest, calm, short teacher instructions
  let feedbackMessage = '';
  let spokenFeedbackInstruction = '';
  let spokenFeedbackInstructionAr = '';

  if (isCorrect) {
    feedbackMessage = "Masha'Allah, accurate recitation.";
    spokenFeedbackInstruction = 'Good. Continue.';
    spokenFeedbackInstructionAr = 'أَحْسَنْتَ، بَارَكَ اللهُ فِيكَ. تَابِعْ إِلَى الآيَةِ التَّالِيَةِ.';
  } else if (isWrongAyah) {
    feedbackMessage = `Recitation did not match Ayah ${targetAyah.numberInSurah}. Please recite: "${targetAyah.text}".`;
    spokenFeedbackInstruction = `Please recite ayah ${targetAyah.numberInSurah}. Say: ${canonicalTokens.slice(0, 3).map((t) => t.raw).join(' ')}.`;
    spokenFeedbackInstructionAr = `لَمْ نَسْمَعِ الآيَةَ ${targetAyah.numberInSurah}. تَفَضَّلْ بِقِرَاءَتِهَا: ${canonicalTokens.slice(0, 3).map((t) => t.raw).join(' ')}.`;
  } else if (isPrematureStop) {
    const recitedPortion = `${correctCount} of ${totalCanonicalWords} words`;
    feedbackMessage = `Ayah completed partially (${recitedPortion}). Missing: ${missingWords.slice(0, 3).join(' ')}.`;
    spokenFeedbackInstruction = 'You stopped before finishing. Try that part again.';
    spokenFeedbackInstructionAr = 'تَوَقَّفْتَ قَبْلَ إِتْمَامِ الآيَةِ. عَلَى رِسْلِكَ، أَعِدْ هَذَا المَقْطَعَ.';
  } else if (missingWords.length > 0 && incorrectWords.length === 0) {
    feedbackMessage = `Missing word${missingWords.length > 1 ? 's' : ''}: ${missingWords.join(' · ')}.`;
    spokenFeedbackInstruction = `You missed a part. Let's try it again: ${missingWords.slice(0, 2).join(' ')}.`;
    spokenFeedbackInstructionAr = `فَاتَكَ بَعْضُ الكَلِمَاتِ: ${missingWords.slice(0, 2).join(' ')}. أَعِدْهَا بِهُدُوءٍ.`;
  } else if (incorrectWords.length > 0) {
    const firstMistake = incorrectWords[0];
    feedbackMessage = `Check word: expected "${firstMistake.expected}", heard "${firstMistake.spoken}".`;
    spokenFeedbackInstruction = `Try that part again: ${firstMistake.expected}.`;
    spokenFeedbackInstructionAr = `انْتَبِهْ لِهَذِهِ الكَلِمَةِ: "${firstMistake.expected}". أَعِدْ تِلَاوَتَهَا بِإِتْقَانٍ.`;
  } else if (extraWords.length > 0) {
    feedbackMessage = `Extra words detected: ${extraWords.join(' ')}.`;
    spokenFeedbackInstruction = 'Careful with extra words. Repeat this ayah once more.';
    spokenFeedbackInstructionAr = 'انْتَبِهْ لِلزِّيَادَةِ فِي الكَلِمَاتِ. أَعِدْ تِلَاوَةَ الآيَةِ مَرَّةً أُخْرَى.';
  } else {
    feedbackMessage = 'Recitation needs another attempt. Take your time.';
    spokenFeedbackInstruction = 'Take your time. Repeat this ayah once more.';
    spokenFeedbackInstructionAr = 'عَلَى رِسْلِكَ. أَعِدْ هَذِهِ الآيَةَ بِمَهَلٍ وَتُؤَدَةٍ.';
  }

  return {
    ayahNumber: targetAyah.numberInSurah,
    ayahText: targetAyah.text,
    spokenTranscript,
    isCorrect,
    accuracyScore,
    missingWords,
    extraWords,
    incorrectWords,
    repeatedWords: [],
    isPrematureStop,
    isWrongAyah,
    feedbackMessage,
    spokenFeedbackInstruction,
    spokenFeedbackInstructionAr,
    wordMatches,
  };
}
