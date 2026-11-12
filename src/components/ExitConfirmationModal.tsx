import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  BookOpen,
  Heart,
  Compass,
} from 'lucide-react';
import { exitToBrowserHome } from '../utils/historyManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount?: number;
  lastActivityDate?: string;
  isDark?: boolean;
  language?: string;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  streakCount = 0,
  lastActivityDate,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'exit-confirmation-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  const [selectedReason, setSelectedReason] = useState<string>('accidental');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reasons = isArabic
    ? [
        {
          id: 'accidental',
          label: 'نقرتُ زر الرجوع في المتصفح عن طريق الخطأ',
          sublabel: 'ابقَ في واحة نور، فجميع إنجازاتك وسجلاتك محفوظة.',
          icon: RotateCcw,
          recommended: true,
        },
        {
          id: 'break',
          label: 'أرغب في أخذ استراحة قصيرة وسأعود لاحقاً',
          sublabel: 'سلسلتك وإشاراتك المرجعية في أمان تام.',
          icon: Sparkles,
          recommended: false,
        },
        {
          id: 'completed',
          label: 'أتممت وردي القرآني وأذكاري لهذا اليوم',
          sublabel: 'الحمد لله الذي بنعمته تتم الصالحات.',
          icon: Heart,
          recommended: false,
        },
        {
          id: 'browser_home',
          label: 'الانتقال إلى صفحة المتصفح الرئيسية',
          sublabel: 'مغادرة التطبيق والعودة لصفحة البداية.',
          icon: ExternalLink,
          recommended: false,
        },
      ]
    : [
        {
          id: 'accidental',
          label: 'I accidentally clicked the browser Back button',
          sublabel: 'Stay right here in Noor with all your progress saved.',
          icon: RotateCcw,
          recommended: true,
        },
        {
          id: 'break',
          label: 'Taking a short break (I will return later)',
          sublabel: 'Your streaks and bookmarks will be waiting safely.',
          icon: Sparkles,
          recommended: false,
        },
        {
          id: 'completed',
          label: 'Done with my daily recitation & remembrance',
          sublabel: 'Alhamdulillah for completing your daily worship.',
          icon: Heart,
          recommended: false,
        },
        {
          id: 'browser_home',
          label: 'Take me to my browser home page',
          sublabel: 'Leave Noor and return to your browser navigation.',
          icon: ExternalLink,
          recommended: false,
        },
      ];

  const handleConfirmExit = () => {
    exitToBrowserHome();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label={t(langCode, 'exitTitle')}
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-[0_2px_8px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col transition-all duration-200 ${
          isDark
            ? 'bg-gradient-to-b from-[#0E1219] via-[#0A0D13] to-[#07090E] border-[#C9A063]/30 text-[#F5EFE6]'
            : 'bg-gradient-to-b from-[#FFFDF9] via-stone-50 to-stone-100 border-[#C9A063]/40 text-stone-900 shadow-md'
        }`}
      >
        {/* Luminous Top Gold Trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-85" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#C9A063]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                {t(langCode, 'exitTitle')}
              </h3>
              <p className="text-xs text-stone-400 font-sans">
                {t(langCode, 'exitSub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isArabic ? 'إغلاق والبقاء في نور' : 'Close and stay in Noor'}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Active Streak Safeguard Reminder */}
          {streakCount > 0 ? (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5 text-[#DFBA7F]">
                  <span>{streakCount} {t(langCode, 'days')} {t(langCode, 'activeStreak')}!</span>
                </div>
                <p className="text-stone-300 font-light mt-0.5">
                  {isArabic
                    ? 'احرص على قراءة وردك القرآني أو إتمام أذكارك اليوم قبل المغادرة حتى لا تفقد سلسلتك المباركة.'
                    : 'Make sure you have recited your Qur\'an or tapped today\'s Dhikr before leaving so your streak is preserved.'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isDark
                  ? 'bg-[#121620]/70 border-[#C9A063]/20 text-stone-300'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#C9A063]/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#DFBA7F]" />
              </div>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                {isArabic
                  ? 'هل تريد مغادرة واحة نور؟ اختر السبب أدناه أو ابقَ معنا لمواصلة رحلتك الإيمانية الهادئة:'
                  : 'You pressed the browser Back button at the home screen. Tell us why you\'re leaving or stay to keep your peaceful journey going:'}
              </p>
            </div>
          )}

          {/* Interactive Reasons Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block font-mono">
              {isArabic ? 'ما هو سبب المغادرة؟' : 'Why are you leaving?'}
            </label>

            {reasons.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;

              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isRTL ? 'text-right' : 'text-left'
                  } ${
                    isSelected
                      ? isDark
                        ? 'bg-[#171D27] border-[#C9A063] shadow-[0_0_12px_rgba(201,160,99,0.2)]'
                        : 'bg-amber-50/80 border-[#C9A063] shadow-xs'
                      : isDark
                      ? 'bg-[#0E1218]/60 border-white/5 hover:border-white/15'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#DFBA7F] text-[#090B0E]'
                        : 'bg-white/5 text-stone-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-[#DFBA7F]' : 'text-stone-200'
                        }`}
                      >
                        {reason.label}
                      </span>
                      {reason.recommended && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                          {isArabic ? 'موصى به' : 'Accidental?'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 font-light">
                      {reason.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-5 pt-2 border-t border-[#C9A063]/15 flex flex-col sm:flex-row items-center gap-2.5 bg-[#080B10]/70">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-xs font-bold font-cinzel tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
          >
            {t(langCode, 'stayInApp')}
          </button>

          <button
            onClick={handleConfirmExit}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/5 hover:bg-red-500/15 text-stone-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-semibold transition-all active:scale-95 text-center cursor-pointer"
          >
            {t(langCode, 'confirmExit')}
          </button>
        </div>
      </div>
    </div>
  );
};
