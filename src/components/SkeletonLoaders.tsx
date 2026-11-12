import React from 'react';

interface SkeletonProps {
  className?: string;
  isDark?: boolean;
}

/**
 * Base atomic Skeleton shimmer primitive with glowing gold accents
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'h-4 w-full rounded-xl',
  isDark = true,
}) => {
  return (
    <div
      className={`select-none pointer-events-none transition-colors duration-200 ${
        isDark ? 'skeleton-pulse bg-white/5' : 'skeleton-pulse-light bg-stone-200/60'
      } ${className}`}
      aria-hidden="true"
    />
  );
};

interface SkeletonListProps {
  count?: number;
  isDark?: boolean;
  isArabic?: boolean;
}

/**
 * Quran Verse (Ayah) Skeleton List
 * Realistic placeholder imitating full Quran ayah cards with verse numbers, Arabic text lines, translation, and action pills.
 */
export const QuranAyahSkeletonList: React.FC<SkeletonListProps> = ({
  count = 4,
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="space-y-4 w-full animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`ayah-skeleton-${idx}`}
          className={`p-5 sm:p-6 rounded-3xl border transition-all ${
            isDark
              ? 'bg-[#0E121A]/80 border-[#C9A063]/20 shadow-md'
              : 'bg-white/90 border-[#C9A063]/30 shadow-xs'
          }`}
        >
          {/* Top Bar: Verse Number Badge & Audio Action Skeletons */}
          <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-[#C9A063]/15">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-2xl" isDark={isDark} />
              <Skeleton className="h-4 w-24 rounded-lg" isDark={isDark} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
              <Skeleton className="w-8 h-8 rounded-xl" isDark={isDark} />
            </div>
          </div>

          {/* Arabic Calligraphy Placeholder Lines (Simulates Right-to-Left Uthmani script flow) */}
          <div className="space-y-3.5 my-4" dir="rtl">
            <Skeleton className="h-6 sm:h-7 w-[92%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 sm:h-7 w-[80%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 sm:h-7 w-[65%] rounded-xl" isDark={isDark} />
          </div>

          {/* Translation Placeholder (Left-to-Right or Localized) */}
          <div className="pt-3 mt-4 border-t border-white/5 space-y-2">
            <Skeleton className="h-3.5 w-[75%] rounded-lg" isDark={isDark} />
            <Skeleton className="h-3.5 w-[50%] rounded-lg" isDark={isDark} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Surah Selector Grid Skeleton
 */
export const SurahGridSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 6,
  isDark = true,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full animate-fadeIn">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`surah-skeleton-${idx}`}
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-[#0E121A]/70 border-white/10' : 'bg-white/80 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" isDark={isDark} />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-lg" isDark={isDark} />
              <Skeleton className="h-3 w-16 rounded-md" isDark={isDark} />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-xl" isDark={isDark} />
        </div>
      ))}
    </div>
  );
};

/**
 * Prayer Times Cards Skeleton
 */
export const PrayerTimesSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Banner Skeleton */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#0E1320] border-[#C9A063]/25' : 'bg-white border-stone-200'
        }`}
      >
        <div className="space-y-2 w-full sm:w-1/2">
          <Skeleton className="h-6 w-48 rounded-xl" isDark={isDark} />
          <Skeleton className="h-4 w-36 rounded-lg" isDark={isDark} />
        </div>
        <Skeleton className="h-12 w-full sm:w-40 rounded-2xl" isDark={isDark} />
      </div>

      {/* 5 Prayer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`prayer-card-skeleton-${idx}`}
            className={`p-4 rounded-3xl border space-y-3 ${
              isDark ? 'bg-[#0A101F]/80 border-[#C9A063]/20' : 'bg-white/80 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16 rounded-md" isDark={isDark} />
              <Skeleton className="h-4 w-12 rounded-full" isDark={isDark} />
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" isDark={isDark} />
            <Skeleton className="h-8 w-20 rounded-xl" isDark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Noor AI Chat Response Skeleton
 * Renders an AI message box with avatar halo and flowing synthesized text lines
 */
export const NoorAIResponseSkeleton: React.FC<{ isDark?: boolean; isArabic?: boolean }> = ({
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="flex items-start gap-3 w-full max-w-2xl animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Glowing Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] p-0.5 shrink-0 shadow-md">
        <Skeleton className="w-full h-full rounded-full" isDark={isDark} />
      </div>

      {/* Message Bubble Skeleton */}
      <div
        className={`flex-1 p-5 rounded-3xl rounded-tl-sm border shadow-lg space-y-3 ${
          isDark
            ? 'bg-[#0E121A] border-[#C9A063]/30 text-stone-100 shadow-[0_2px_12px_rgba(201,160,99,0.1)]'
            : 'bg-white border-[#C9A063]/40 text-stone-900 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-lg" isDark={isDark} />
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
          <Skeleton className="h-4 w-16 rounded-full" isDark={isDark} />
        </div>

        {/* Text lines simulating AI answer */}
        <div className="space-y-2.5 pt-1">
          <Skeleton className="h-4 w-[95%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[88%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[76%] rounded-lg" isDark={isDark} />
          <Skeleton className="h-4 w-[60%] rounded-lg" isDark={isDark} />
        </div>

        {/* Reference pill skeleton */}
        <div className="pt-2 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" isDark={isDark} />
          <Skeleton className="h-6 w-32 rounded-full" isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

/**
 * Dhikr & Du'a Cards Skeleton List
 */
export const DhikrCardSkeletonList: React.FC<{ count?: number; isDark?: boolean; isArabic?: boolean }> = ({
  count = 3,
  isDark = true,
  isArabic = false,
}) => {
  return (
    <div className="space-y-4 w-full animate-fadeIn" dir={isArabic ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`dhikr-skeleton-${idx}`}
          className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E121A]/80 border-[#C9A063]/20' : 'bg-white border-[#C9A063]/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-32 rounded-lg" isDark={isDark} />
            <Skeleton className="h-6 w-20 rounded-full" isDark={isDark} />
          </div>

          <div className="space-y-3 my-4" dir="rtl">
            <Skeleton className="h-6 w-[90%] rounded-xl" isDark={isDark} />
            <Skeleton className="h-6 w-[70%] rounded-xl" isDark={isDark} />
          </div>

          <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between">
            <Skeleton className="h-4 w-40 rounded-md" isDark={isDark} />
            <Skeleton className="h-10 w-28 rounded-2xl" isDark={isDark} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Study / Document Analysis Output Skeleton
 */
export const DocumentAnalysisSkeleton: React.FC<{ isDark?: boolean; label?: string }> = ({
  isDark = true,
  label = 'AI is reading & processing content...',
}) => {
  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-lg space-y-4 animate-fadeIn ${
        isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-md" isDark={isDark} />
          <span className="text-xs font-semibold text-[#DFBA7F]">{label}</span>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" isDark={isDark} />
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-[94%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[86%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[90%] rounded-lg" isDark={isDark} />
        <Skeleton className="h-4 w-[60%] rounded-lg" isDark={isDark} />
      </div>

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
        <Skeleton className="h-3.5 w-32 rounded-md" isDark={isDark} />
        <Skeleton className="h-3 w-[78%] rounded-md" isDark={isDark} />
        <Skeleton className="h-3 w-[55%] rounded-md" isDark={isDark} />
      </div>
    </div>
  );
};

/**
 * Full Page Transition / View Fallback Skeleton
 */
export const FullScreenSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#0E1320] border-[#C9A063]/25' : 'bg-white border-stone-200'
        }`}
      >
        <div className="space-y-2 w-full sm:w-1/2">
          <Skeleton className="h-8 w-60 rounded-2xl" isDark={isDark} />
          <Skeleton className="h-4 w-40 rounded-lg" isDark={isDark} />
        </div>
        <Skeleton className="h-12 w-full sm:w-48 rounded-2xl" isDark={isDark} />
      </div>

      {/* Content Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`page-skel-card-${idx}`}
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0E121A]/70 border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            <Skeleton className="h-5 w-32 rounded-lg" isDark={isDark} />
            <Skeleton className="h-4 w-full rounded-md" isDark={isDark} />
            <Skeleton className="h-4 w-[70%] rounded-md" isDark={isDark} />
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`page-skel-row-${idx}`}
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#0E121A]/60 border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" isDark={isDark} />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-lg" isDark={isDark} />
                <Skeleton className="h-3 w-28 rounded-md" isDark={isDark} />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-xl" isDark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
};
