import React from 'react';
import { Flame, X, BookOpen, GraduationCap, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { StreakRiskStatus } from '../utils/streakManager';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface StreakWarningToastProps {
  status: StreakRiskStatus | null;
  onDismiss: () => void;
  onNavigate: (tab: 'quran' | 'dhikr' | 'learn') => void;
  isDark?: boolean;
  language?: string;
}

export const StreakWarningToast: React.FC<StreakWarningToastProps> = ({
  status,
  onDismiss,
  onNavigate,
  isDark = true,
  language = 'en',
}) => {
  if (!status || !status.isAtRisk) return null;

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  return (
    <div
      id="streak-risk-floating-toast"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[92%] max-w-md animate-fadeIn select-none"
      role="alert"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`rounded-3xl p-4 sm:p-5 border shadow-[0_2px_8px_rgba(0,0,0,0.25)] relative overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-gradient-to-br from-[#1A120A]/98 via-[#140E07]/98 to-[#0E0C0A]/98 border-amber-500/50 text-[#F5EFE6]'
            : 'bg-gradient-to-br from-amber-50/98 via-orange-50/98 to-amber-100/98 border-amber-600/40 text-stone-900 shadow-md'
        }`}
      >
        {/* Animated Amber/Orange Warning Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/30">
          <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm animate-flame-radiant">
              <Flame className="w-5 h-5 text-stone-950 fill-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>{t(langCode, 'streakAtRiskBadge')}</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{status.formattedTime} {t(langCode, 'timeLeft')}</span>
                </span>
              </div>
              <h4 className="text-sm font-bold font-cinzel tracking-wide text-amber-200 mt-0.5">
                {isArabic
                  ? `لا تفقد سلسلة الأيام المتواصلة (${status.currentStreak} يوم)!`
                  : `${t(langCode, 'dontLoseStreak')} (${status.currentStreak})`}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isArabic ? 'إغلاق التنبيه' : 'Dismiss warning'}
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanatory Message */}
        <p className="text-xs text-stone-300 dark:text-stone-300 font-light leading-relaxed mb-3.5 pl-1">
          {t(langCode, 'streakActionPrompt')}
        </p>

        {/* Quick Action Navigation Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNavigate('learn')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 shadow-sm ${
              isDark
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
                : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t(langCode, 'study')}</span>
          </button>

          <button
            onClick={() => onNavigate('quran')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 shadow-sm ${
              isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t(langCode, 'quran')}</span>
          </button>

          <button
            onClick={() => onNavigate('dhikr')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 shadow-sm ${
              isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t(langCode, 'dhikr')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
