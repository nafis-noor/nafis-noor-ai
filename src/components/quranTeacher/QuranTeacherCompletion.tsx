import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Surah } from '../../types';
import { ALL_SURAHS } from '../../data/quranData';
import { QuranTeacherSessionStats } from '../../types/quranTeacher';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherCompletionProps {
  isDark: boolean;
  stats: QuranTeacherSessionStats;
  onPracticeAgain: () => void;
  onClose: () => void;
}

export const QuranTeacherCompletion: React.FC<QuranTeacherCompletionProps> = ({
  isDark,
  stats,
  onPracticeAgain,
  onClose,
}) => {
  const isArabic = getLanguageCode() === 'ar';
  const [selectedAyahIndex, setSelectedAyahIndex] = useState<number | null>(null);
  const [showOnlyStruggled, setShowOnlyStruggled] = useState(false);

  const durationFormatted = `${Math.floor(stats.durationSeconds / 60)}${isArabic ? ' د ' : 'm '}${stats.durationSeconds % 60}${isArabic ? ' ث' : 's'}`;

  const displayedAyahs = showOnlyStruggled
    ? stats.finalAyahStatus.filter((a) => a.status === 'needs_practice')
    : stats.finalAyahStatus;

  const surahArabicName = ALL_SURAHS.find((s) => s.englishName === stats.surahEnglishName)?.name || stats.surahEnglishName;

  return (
    <div
      className={`w-full max-w-3xl mx-auto rounded-[36px] p-6 sm:p-8 border shadow-md transition-all duration-200 ${
        isDark
          ? 'bg-[#080B10]/98 border-[#C9A063]/30 text-stone-100'
          : 'bg-white/98 border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(45,35,20,0.06)]'
      }`}
    >
      {/* Top Trophy Header */}
      <div className="relative text-center pb-6 border-b border-[#C9A063]/20">
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-0 right-0 p-2 rounded-xl transition-colors ${
            isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#8E6527] flex items-center justify-center text-[#080A0E] shadow-sm mx-auto mb-4">
          <Award className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
          {isArabic ? 'اكتمل الدرس بنجاح' : 'Lesson Complete'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading mt-1">
          {isArabic ? `سورة ${surahArabicName}` : `Surah ${stats.surahEnglishName}`}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
          {isArabic
            ? `الآيات من ${stats.startAyah} إلى ${stats.endAyah} • تلوت ${stats.totalAyahs} من ${stats.totalAyahs} آية`
            : `Ayahs ${stats.startAyah} to ${stats.endAyah} • ${stats.totalAyahs} / ${stats.totalAyahs} Recited`}
        </p>
      </div>

      {/* High-level Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#0E1218] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'المكتملة بإتقان' : 'Completed'}</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {stats.completedAyahsCount}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#0E1218] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'تحتاج تثبيتاً' : 'Needs Practice'}</span>
          <span
            className={`text-xl font-bold font-mono ${
              stats.struggledAyahsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {stats.struggledAyahsCount}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#0E1218] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'مرات الإعادة' : 'Retries'}</span>
          <span className="text-xl font-bold font-mono text-[#DFBA7F]">
            {stats.totalRetries}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border text-center ${
            isDark ? 'bg-[#0E1218] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'المدة' : 'Duration'}</span>
          <span className="text-xl font-bold font-mono text-stone-200">
            {durationFormatted}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 my-5">
        <button
          type="button"
          onClick={() => setShowOnlyStruggled(!showOnlyStruggled)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
            showOnlyStruggled
              ? 'bg-[#C9A063] text-[#080A0E] border-[#C9A063]'
              : isDark
              ? 'bg-[#0E1218] border-stone-700 text-stone-200 hover:text-white'
              : 'bg-stone-100 border-stone-300 text-stone-800 hover:text-stone-950'
          }`}
        >
          <span>
            {showOnlyStruggled
              ? (isArabic ? 'عرض مواضع الملاحظات' : 'Showing Mistakes')
              : (isArabic ? 'مراجعة الملاحظات' : 'Review Mistakes')}
          </span>
          {stats.struggledAyahsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {stats.struggledAyahsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#080A0E] hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isArabic ? 'التدريب مرة أخرى' : 'Practice Again'}</span>
        </button>
      </div>

      {/* Detailed Ayah-by-Ayah Review List */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 px-1">
          <span>{isArabic ? 'تفصيل الآيات المباركة' : 'Ayah Breakdown'}</span>
          <span>{isArabic ? 'الحالة' : 'Status'}</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {displayedAyahs.map((item) => {
            const isExpanded = selectedAyahIndex === item.ayahNumber;
            const isPerfect = item.status === 'perfect';

            return (
              <div
                key={item.ayahNumber}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark
                    ? isExpanded
                      ? 'bg-[#0E1218] border-[#DFBA7F]/40 shadow-md'
                      : 'bg-[#0A0D12] border-stone-800/80 hover:border-stone-700'
                    : isExpanded
                    ? 'bg-amber-50/70 border-[#C9A063]/40 shadow-sm'
                    : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedAyahIndex(isExpanded ? null : item.ayahNumber)}
                  className="w-full p-3.5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#C9A063]/15 text-[#DFBA7F] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {item.ayahNumber}
                    </span>
                    <span className="font-arabic text-sm line-clamp-1" dir="rtl">
                      {item.ayahText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {isPerfect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isArabic ? 'متقنة' : 'Recited'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>{isArabic ? 'تحتاج تثبيتاً' : 'Needs practice'}</span>
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </button>

                {/* Expanded Explanation Card */}
                {isExpanded && (
                  <div
                    className={`p-4 border-t text-xs leading-relaxed ${
                      isDark ? 'border-stone-800 bg-[#06080C]' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="font-arabic text-xl leading-loose text-right text-[#DFBA7F] mb-3">
                      {item.ayahText}
                    </div>

                    <div className="p-3 rounded-xl bg-stone-800/40 border border-[#C9A063]/15">
                      <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                        {isArabic ? 'تقييم المعلم:' : 'Teacher Evaluation:'}
                      </span>
                      <p className="text-stone-200">{item.lastFeedback}</p>

                      {item.missingWords && item.missingWords.length > 0 && (
                        <p className="mt-2 text-amber-400">
                          <strong>{isArabic ? 'كلمات ساقطة من التلاوة: ' : 'Missing tokens: '}</strong>
                          <span className="font-arabic text-sm">{item.missingWords.join(' · ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Done Button */}
      <div className="mt-6 pt-4 border-t border-[#C9A063]/20">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-serif-heading font-bold text-xs uppercase tracking-wider bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
        >
          {isArabic ? 'تم · العودة للمصحف الشريف' : 'Done · Return to Sanctuary'}
        </button>
      </div>
    </div>
  );
};
