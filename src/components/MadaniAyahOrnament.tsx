import React from 'react';

export interface WordSegmentTiming {
  wordPos: number;     // 1-indexed word position
  startRatio: number;  // 0..1 relative start inside Ayah audio
  endRatio: number;    // 0..1 relative end inside Ayah audio
}

/**
 * Converts a Western integer (1, 2, 3...) to Eastern Arabic-Indic numerals (١، ٢، ٣...)
 * used in the authentic King Fahd Complex Madani Mushaf (1405 AH).
 */
export function toEasternArabicNumerals(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/\d/g, (d) => arabicDigits[Number(d)] || d);
}

/**
 * Determines the exact 0-indexed word currently being recited by the Sheikh.
 * 1. If official Quran.com QDC millisecond word segments are available for this verse,
 *    matches `progress` (0..1) directly against `[startRatio, endRatio]`.
 * 2. Otherwise falls back to phonetic Tajweed character weighting.
 */
export function getActiveSpokenWordIndex(
  words: string[],
  progress: number, // 0..1
  segments?: WordSegmentTiming[]
): number {
  if (!words || words.length === 0) return 0;
  if (words.length === 1) return 0;

  // 1. Exact QDC Millisecond Timestamp Segment Matching (Quran.com precision)
  if (segments && segments.length > 0) {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (progress >= seg.startRatio && progress <= seg.endRatio) {
        return Math.max(0, Math.min(words.length - 1, seg.wordPos - 1));
      }
    }
    // If between segments (brief pause), pick the most recently started word
    let bestWordIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      if (progress >= segments[i].startRatio) {
        bestWordIdx = Math.max(0, Math.min(words.length - 1, segments[i].wordPos - 1));
      }
    }
    return bestWordIdx;
  }

  // 2. Fallback: Character-weighted acoustic Tajweed model
  const effectiveProgress = Math.max(0, Math.min(1, (progress - 0.03) / 0.92));

  const weights = words.map((word) => {
    let w = Math.max(2, word.length);
    const maddMatches = word.match(/[اويىآٰٓ]/g);
    if (maddMatches) w += maddMatches.length * 1.8;
    const shaddahMatches = word.match(/[ّ]/g);
    if (shaddahMatches) w += shaddahMatches.length * 1.4;
    return w;
  });

  weights[weights.length - 1] *= 1.45;

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  const targetWeight = effectiveProgress * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (targetWeight <= cumulative) {
      return i;
    }
  }

  return words.length - 1;
}

interface MadaniAyahOrnamentProps {
  ayahNumber: number;
  surahNumber?: number;
  showSurahPrefix?: boolean;
  isPlaying?: boolean;
  isDark?: boolean;
  compact?: boolean;
  size?: 'inline' | 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}

/**
 * Authentic Madani Mushaf (1405 AH) ornamental Ayah symbol (End-of-Ayah Medallion)
 * with Eastern Arabic-Indic numerals (١، ٢، ٣) centered directly inside the Ayah symbol.
 * Styled to sit inline within 15-line Mushaf rows or as a standalone verse badge.
 */
export const MadaniAyahOrnament: React.FC<MadaniAyahOrnamentProps> = ({
  ayahNumber,
  surahNumber,
  showSurahPrefix = false,
  isPlaying = false,
  isDark = true,
  compact = false,
  size = 'inline',
  onClick,
  title,
}) => {
  const arabicNum = toEasternArabicNumerals(ayahNumber);

  // Dimensions for standalone vs inline usage
  const dimensionStyle: React.CSSProperties =
    size === 'sm'
      ? { width: '32px', height: '35px', verticalAlign: 'middle' }
      : size === 'md'
      ? { width: '36px', height: '40px', verticalAlign: 'middle' }
      : size === 'lg'
      ? { width: '42px', height: '46px', verticalAlign: 'middle' }
      : {
          width: compact ? '1.42em' : '1.55em',
          height: compact ? '1.42em' : '1.55em',
          minWidth: '28px',
          minHeight: '30px',
          verticalAlign: 'middle',
        };

  const fontSizeClass =
    size === 'sm'
      ? arabicNum.length >= 3
        ? 'text-[10px]'
        : arabicNum.length === 2
        ? 'text-[11.5px]'
        : 'text-[13px]'
      : size === 'md'
      ? arabicNum.length >= 3
        ? 'text-[11px]'
        : arabicNum.length === 2
        ? 'text-[13px]'
        : 'text-[14.5px]'
      : size === 'lg'
      ? arabicNum.length >= 3
        ? 'text-[12.5px]'
        : arabicNum.length === 2
        ? 'text-[14.5px]'
        : 'text-[16px]'
      : arabicNum.length >= 3
      ? 'text-[0.44em]'
      : arabicNum.length === 2
      ? 'text-[0.52em]'
      : 'text-[0.58em]';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={`Ayah ${ayahNumber}`}
      className={`group relative inline-flex items-center justify-center align-middle select-none shrink-0 cursor-pointer transition-transform duration-150 active:scale-90 ${
        size !== 'inline' ? 'mx-0' : compact ? 'mx-0.5' : 'mx-1'
      } ${isPlaying ? 'scale-110 z-10' : 'hover:scale-105'}`}
      style={dimensionStyle}
    >
      {/* Subtle pulse halo when Sheikh is reciting this Ayah */}
      {isPlaying && (
        <span className="absolute inset-0 rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
      )}

      {/* Authentic 1405 AH Madani Mushaf Ayah Symbol (Medallion with Top & Bottom Finials) */}
      <svg
        viewBox="0 0 40 44"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        aria-hidden="true"
      >
        {/* Top & Bottom Traditional Mushaf Finial Crowns */}
        <path
          d="M20 1 L23 5 L17 5 Z M20 43 L23 39 L17 39 Z"
          fill={isPlaying ? '#34D399' : '#C9A063'}
        />
        {/* Outer 8-lobed Islamic Ayah Medallion Ring */}
        <path
          d="M20 4 C23.5 4 25.5 6.5 28.5 6.5 C31.5 6.5 33.5 8.5 33.5 11.5 C33.5 14.5 36 16.5 36 20 C36 23.5 33.5 25.5 33.5 28.5 C33.5 31.5 31.5 33.5 28.5 33.5 C25.5 33.5 23.5 36 20 36 C16.5 36 14.5 33.5 11.5 33.5 C8.5 33.5 6.5 31.5 6.5 28.5 C6.5 25.5 4 23.5 4 20 C4 16.5 6.5 14.5 6.5 11.5 C6.5 8.5 8.5 6.5 11.5 6.5 C14.5 6.5 16.5 4 20 4 Z"
          transform="translate(0, 2)"
          fill={
            isPlaying
              ? isDark
                ? 'rgba(16, 185, 129, 0.30)'
                : 'rgba(16, 185, 129, 0.22)'
              : isDark
              ? 'rgba(201, 160, 99, 0.16)'
              : 'rgba(201, 160, 99, 0.20)'
          }
          stroke={isPlaying ? '#34D399' : '#C9A063'}
          strokeWidth="1.8"
        />
        {/* Inner Authentic Double-Ring Circle where the Ayah number sits */}
        <circle
          cx="20"
          cy="22"
          r="12.5"
          fill={
            isPlaying
              ? isDark
                ? '#064E3B'
                : '#D1FAE5'
              : isDark
              ? '#0B0F17'
              : '#FFFDF8'
          }
          stroke={isPlaying ? '#34D399' : '#DFBA7F'}
          strokeWidth="1.25"
        />
      </svg>

      {/* Eastern Arabic Numeral Centered Directly Inside the Ayah Symbol */}
      <span
        dir="rtl"
        className={`relative z-10 w-full h-full font-arabic font-bold leading-none flex items-center justify-center text-center pointer-events-none pt-[1px] ${fontSizeClass} ${
          isPlaying
            ? isDark
              ? 'text-emerald-300'
              : 'text-emerald-950'
            : isDark
            ? 'text-[#DFBA7F] group-hover:text-white'
            : 'text-stone-950 group-hover:text-[#8E6527]'
        }`}
      >
        {arabicNum}
      </span>

      {showSurahPrefix && surahNumber && (
        <span className="sr-only">
          ({surahNumber}:{ayahNumber})
        </span>
      )}
    </button>
  );
};

