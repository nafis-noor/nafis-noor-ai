import React from 'react';

export type TajweedRuleType =
  | 'none'
  | 'madd_long'     // المد اللازم / الواجب / الجائز (4-6 حركات) - Red/Rose
  | 'madd_natural'  // المد الطبيعي (حركتان) - Amber/Orange
  | 'ghunnah'       // الغنة والإخفاء والإدغام بغنة - Emerald Green
  | 'iqlab'         // الإقلاب - Cyan/Teal
  | 'qalqalah';     // القلقلة (قطب جد) - Sky Blue

export interface TajweedLegendItem {
  rule: Exclude<TajweedRuleType, 'none'>;
  labelAr: string;
  labelEn: string;
  descAr: string;
  dotClass: string;
  textDarkClass: string;
  textLightClass: string;
}

export const TAJWEED_LEGEND_ITEMS: TajweedLegendItem[] = [
  {
    rule: 'madd_long',
    labelAr: 'مد ٤-٦ حركات',
    labelEn: 'Prolonged Madd (4–6)',
    descAr: 'مد لازم / واجب / جائز (علامة المد ٓ )',
    dotClass: 'bg-rose-500',
    textDarkClass: 'text-rose-400',
    textLightClass: 'text-rose-600',
  },
  {
    rule: 'madd_natural',
    labelAr: 'مد طبيعي (٢)',
    labelEn: 'Natural Madd (2)',
    descAr: 'الألف الخنجرية ( ٰ ) والواو والياء الصغيرتان',
    dotClass: 'bg-amber-400',
    textDarkClass: 'text-amber-300',
    textLightClass: 'text-amber-600',
  },
  {
    rule: 'ghunnah',
    labelAr: 'غنة وإخفاء',
    labelEn: 'Ghunnah & Ikhfa',
    descAr: 'النون والميم المشددتان (نّ / مّ) والإخفاء والإدغام بغنة',
    dotClass: 'bg-emerald-400',
    textDarkClass: 'text-emerald-400',
    textLightClass: 'text-emerald-600',
  },
  {
    rule: 'iqlab',
    labelAr: 'إقلاب',
    labelEn: 'Iqlab',
    descAr: 'قلب النون الساكنة أو التنوين ميماً (علامة ۢ )',
    dotClass: 'bg-teal-400',
    textDarkClass: 'text-teal-300',
    textLightClass: 'text-teal-600',
  },
  {
    rule: 'qalqalah',
    labelAr: 'قلقلة (قطب جد)',
    labelEn: 'Qalqalah',
    descAr: 'حروف (ق ط ب ج د) الساكنة أو الموقوف عليها',
    dotClass: 'bg-sky-400',
    textDarkClass: 'text-sky-400',
    textLightClass: 'text-sky-600',
  },
];

interface ArabicCluster {
  base: string;
  marks: string;
  raw: string;
}

const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const IKHFA_AND_IDGHAM_GHUNNAH_LETTERS = new Set([
  'ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك',
  'ي', 'ن', 'م', 'و',
]);

function isCombiningOrMark(code: number): boolean {
  return (
    (code >= 0x064b && code <= 0x065f) || // Standard Harakat, Shaddah, Sukoon, Maddah
    code === 0x0670 ||                    // Superscript / Dagger Alif
    (code >= 0x06d6 && code <= 0x06ed) || // Quranic annotation marks (excluding standalone \u06E5 \u06E6 handled below)
    (code >= 0x08f0 && code <= 0x08f3)    // Extended Uthmani Tanween
  );
}

/**
 * Splits an Arabic word into letter+diacritic grapheme clusters without losing a single character.
 */
function splitIntoArabicClusters(word: string): ArabicCluster[] {
  const clusters: ArabicCluster[] = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const code = ch.charCodeAt(0);

    // Small Waw (\u06E5) and Small Yaa (\u06E6) act as standalone Uthmani Madd letters
    if (code === 0x06e5 || code === 0x06e6) {
      let marks = '';
      while (i + 1 < word.length && isCombiningOrMark(word.charCodeAt(i + 1))) {
        i++;
        marks += word[i];
      }
      clusters.push({ base: ch, marks, raw: ch + marks });
      continue;
    }

    if (isCombiningOrMark(code) && clusters.length > 0) {
      const prev = clusters[clusters.length - 1];
      prev.marks += ch;
      prev.raw += ch;
    } else {
      clusters.push({ base: ch, marks: '', raw: ch });
    }
  }
  return clusters;
}

/**
 * Finds the first meaningful Arabic consonant of the next word (skipping Alif Wasl \u0671 if needed)
 */
function getFirstConsonantOfNextWord(nextWord?: string): string {
  if (!nextWord) return '';
  for (let i = 0; i < nextWord.length; i++) {
    const ch = nextWord[i];
    const code = ch.charCodeAt(0);
    if (isCombiningOrMark(code) || ch === '\u0640') continue;
    // Skip silent Alif Wasl (ٱ) when checking cross-word Tajweed (unless followed by Lam)
    if (ch === 'ٱ' || ch === 'ا') {
      continue;
    }
    return ch;
  }
  return '';
}

/**
 * Deterministically classifies each Arabic cluster in an Uthmani word into its exact Tajweed rule.
 */
function classifyClusterTajweed(
  clusters: ArabicCluster[],
  idx: number,
  nextWord?: string,
  isEndOfAyah: boolean = false
): TajweedRuleType {
  const cluster = clusters[idx];
  const { base, marks } = cluster;

  const hasMaddah = marks.includes('\u0653') || marks.includes('\u06e4') || base === 'آ';
  const hasDaggerAlif = marks.includes('\u0670');
  const hasIqlabMeem = marks.includes('\u06e2') || marks.includes('\u06ed');
  const hasShaddah = marks.includes('\u0651');
  const hasSukoon = marks.includes('\u0652') || marks.includes('\u06e1');
  const hasShortVowel =
    marks.includes('\u064e') || // Fatha
    marks.includes('\u064f') || // Damma
    marks.includes('\u0650');   // Kasra
  const hasTanween =
    marks.includes('\u064b') ||
    marks.includes('\u064c') ||
    marks.includes('\u064d') ||
    marks.includes('\u08f0') ||
    marks.includes('\u08f1') ||
    marks.includes('\u08f2');

  // Next base letter (either inside this word or at the start of nextWord)
  let nextBase = '';
  for (let j = idx + 1; j < clusters.length; j++) {
    const b = clusters[j].base;
    if (b !== '\u0640' && b !== 'ا' && b !== 'ٱ' && b !== 'ى') {
      nextBase = b;
      break;
    } else if (b === 'ا' || b === 'ى') {
      // e.g. tanween on fatha followed by silent alif at end of word
      continue;
    }
  }
  if (!nextBase && !isEndOfAyah) {
    nextBase = getFirstConsonantOfNextWord(nextWord);
  }

  // 1. Prolonged Madd (4-6 counts): Explicit Uthmani Maddah (\u0653 / \u06E4) or آ
  if (hasMaddah) {
    return 'madd_long';
  }

  // 2. Iqlab: Explicit Uthmani Small High/Low Meem (\u06E2 / \u06ED) or Noon/Tanween before Baa
  if (hasIqlabMeem) {
    return 'iqlab';
  }
  if ((base === 'ن' && !hasShortVowel && !hasShaddah && nextBase === 'ب') || (hasTanween && nextBase === 'ب')) {
    return 'iqlab';
  }

  // 3. Ghunnah, Ikhfa & Idgham bi-Ghunnah:
  // 3a. Noon or Meem with Shaddah (نّ / مّ) is ALWAYS 2-count Ghunnah
  if ((base === 'ن' || base === 'م') && hasShaddah) {
    return 'ghunnah';
  }

  // 3b. Bare Noon in Uthmani script (no vowel, no sukoon) or Noon with sukoon before Ikhfa/Idgham-Ghunnah letters
  const isLastLetterCluster = idx === clusters.length - 1;
  if (
    base === 'ن' &&
    !hasShortVowel &&
    !hasTanween &&
    !hasShaddah &&
    !(isEndOfAyah && isLastLetterCluster)
  ) {
    if (!hasSukoon) {
      // In Uthmani 1405 script, bare Noon without sukoon is Ikhfa or Idgham
      if (nextBase !== 'ل' && nextBase !== 'ر') {
        return 'ghunnah';
      }
    } else if (nextBase && IKHFA_AND_IDGHAM_GHUNNAH_LETTERS.has(nextBase)) {
      return 'ghunnah';
    }
  }

  // 3c. Bare Meem before Baa (Ikhfa Shafawi) or Meem (Idgham Shafawi)
  if (
    base === 'م' &&
    !hasShortVowel &&
    !hasTanween &&
    !hasShaddah &&
    (nextBase === 'ب' || nextBase === 'م')
  ) {
    return 'ghunnah';
  }

  // 3d. Tanween followed by Ikhfa or Idgham bi-Ghunnah letter (when not stopping at end of Ayah)
  if (hasTanween && !isEndOfAyah && nextBase && IKHFA_AND_IDGHAM_GHUNNAH_LETTERS.has(nextBase)) {
    return 'ghunnah';
  }

  // 4. Qalqalah (قطب جد):
  // Any Qalqalah letter with explicit Sukoon, OR at the very end of an Ayah (Waqf)
  if (QALQALAH_LETTERS.has(base)) {
    if (hasSukoon && !hasShaddah) {
      return 'qalqalah';
    }
    if (isEndOfAyah && isLastLetterCluster) {
      return 'qalqalah';
    }
  }

  // 5. Natural Madd (2 counts): Uthmani Dagger Alif (\u0670), Small Waw (\u06E5), Small Yaa (\u06E6)
  if (hasDaggerAlif || base === '\u06e5' || base === '\u06e6') {
    return 'madd_natural';
  }

  return 'none';
}

function getRuleColorClass(rule: TajweedRuleType, isDark: boolean): string {
  switch (rule) {
    case 'madd_long':
      return isDark ? 'text-rose-400' : 'text-rose-600';
    case 'madd_natural':
      return isDark ? 'text-amber-300' : 'text-amber-600';
    case 'ghunnah':
      return isDark ? 'text-emerald-400' : 'text-emerald-600';
    case 'iqlab':
      return isDark ? 'text-teal-300' : 'text-teal-600';
    case 'qalqalah':
      return isDark ? 'text-sky-400' : 'text-sky-600';
    default:
      return '';
  }
}

/**
 * Renders a single Quranic Uthmani word with accurate Tajweed color coding.
 * Merges consecutive clusters with the same rule and preserves Lam-Alif ligatures.
 */
export function renderWordWithTajweed(
  wordText: string,
  isDark: boolean,
  nextWord?: string,
  isEndOfAyah: boolean = false
): React.ReactNode {
  if (!wordText) return wordText;

  const clusters = splitIntoArabicClusters(wordText);
  if (clusters.length === 0) return wordText;

  const rules: TajweedRuleType[] = clusters.map((_, idx) =>
    classifyClusterTajweed(clusters, idx, nextWord, isEndOfAyah)
  );

  // Preserve Lam + Alif (لا / لأ / لإ / لآ / لٱ) mandatory Arabic ligature so browser shaping never splits it
  for (let i = 0; i < clusters.length - 1; i++) {
    if (
      clusters[i].base === 'ل' &&
      ['ا', 'أ', 'إ', 'آ', 'ٱ'].includes(clusters[i + 1].base)
    ) {
      if (rules[i + 1] !== 'none') {
        rules[i] = rules[i + 1];
      } else if (rules[i] !== 'none') {
        rules[i + 1] = rules[i];
      }
    }
  }

  // If no Tajweed rule applies in this word, return plain string (fastest DOM)
  if (rules.every((r) => r === 'none')) {
    return wordText;
  }

  // Merge adjacent clusters with identical rule into contiguous segments
  const segments: { text: string; rule: TajweedRuleType }[] = [];
  for (let i = 0; i < clusters.length; i++) {
    const r = rules[i];
    if (segments.length > 0 && segments[segments.length - 1].rule === r) {
      segments[segments.length - 1].text += clusters[i].raw;
    } else {
      segments.push({ text: clusters[i].raw, rule: r });
    }
  }

  return segments.map((seg, idx) => {
    if (seg.rule === 'none') {
      return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
    }
    return (
      <span key={idx} className={getRuleColorClass(seg.rule, isDark)}>
        {seg.text}
      </span>
    );
  });
}

/**
 * Renders a full Ayah string with accurate Tajweed colors (for Verse Cards view).
 */
export function renderAyahWithTajweed(ayahText: string, isDark: boolean): React.ReactNode {
  if (!ayahText) return ayahText;
  const words = ayahText.split(/\s+/).filter(Boolean);
  return words.map((word, wIdx) => {
    const isLast = wIdx === words.length - 1;
    const nextW = !isLast ? words[wIdx + 1] : undefined;
    return (
      <React.Fragment key={wIdx}>
        {renderWordWithTajweed(word, isDark, nextW, isLast)}
        {!isLast ? ' ' : ''}
      </React.Fragment>
    );
  });
}
