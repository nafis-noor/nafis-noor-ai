import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Volume2, Sparkles, ChevronRight, Clock } from 'lucide-react';
import { PrayerNotificationEvent, playGentleChime } from '../utils/notificationService';
import { t, getLanguageCode, isRTLLanguage } from '../utils/i18n';

interface PrayerNotificationToastProps {
  notification: PrayerNotificationEvent | null;
  onDismiss: () => void;
  onNavigateToTab?: (tab: string) => void;
  isDark?: boolean;
  language?: string;
}

export const PrayerNotificationToast: React.FC<PrayerNotificationToastProps> = ({
  notification,
  onDismiss,
  onNavigateToTab,
  isDark = true,
  language = 'en',
}) => {
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 12000;
    const startTime = Date.now();

    const dismissTimer = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);
    }, 100);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [notification]);

  if (!notification) return null;

  return (
    <div
      id="prayer-notification-floating-toast"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-fadeIn"
      role="alert"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`rounded-3xl p-4 sm:p-5 border shadow-[0_2px_8px_rgba(0,0,0,0.25)] relative overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#0E1218]/98 border-[#DFBA7F]/40 text-[#F5EFE6]'
            : 'bg-white/98 border-[#A67C38]/40 text-stone-900 shadow-md'
        }`}
      >
        {/* Animated Gold Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-800/40">
          <div
            className="h-full bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063]/30 to-[#DFBA7F]/20 border border-[#DFBA7F]/40 flex items-center justify-center text-[#DFBA7F] shrink-0 shadow-sm">
              <span className="text-xl">🕌</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase flex items-center gap-1">
                  <Bell className="w-3 h-3 text-[#DFBA7F] animate-bounce" />
                  <span>{t(langCode, 'prayerReminderTitle')}</span>
                </span>
                {!isArabic && (
                  <span className="font-arabic text-sm text-[#DFBA7F] font-bold">
                    {notification.arabicName}
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-serif-heading font-bold mt-0.5">
                {isArabic
                  ? `صلاة ${notification.arabicName} ${
                      notification.minutesBefore > 0
                        ? `(خلال ${notification.minutesBefore} دقيقة)`
                        : '(حان وقتها الآن)'
                    }`
                  : `${notification.prayerName} Prayer ${
                      notification.minutesBefore > 0
                        ? `in ${notification.minutesBefore}m`
                        : 'Time (Now)'
                    }`}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => playGentleChime(0.3)}
              className="p-1.5 rounded-full hover:bg-stone-700/30 text-stone-400 hover:text-[#DFBA7F] transition-colors"
              title={isArabic ? 'تشغيل التنبيه' : 'Play Chime'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-stone-700/30 text-stone-400 hover:text-stone-200 transition-colors"
              title={isArabic ? 'إغلاق' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Message & Quran Quote */}
        <div className="mt-2.5 pl-1">
          <p className="text-xs font-medium text-[#DFBA7F] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isArabic
                ? `الموعد المقرر: ${notification.prayerTime}`
                : `${t(langCode, 'prayerScheduledFor')} ${notification.prayerTime}`}
            </span>
          </p>
          <p className={`text-[11px] mt-1 font-light italic leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {notification.quote}
          </p>
        </div>

        {/* Bottom Quick Action */}
        <div className="mt-3 pt-2.5 border-t border-[#DFBA7F]/20 flex items-center justify-between">
          <span className="text-[10px] text-stone-400">
            {isArabic
              ? notification.minutesBefore > 0
                ? 'استعد للوضوء والتأهب للصلاة'
                : 'الله أكبر — حان وقت الوقوف بين يدي الله'
              : notification.minutesBefore > 0
              ? 'Time for Wudhu & preparation'
              : 'Allāhu Akbar'}
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onNavigateToTab('prayer-check');
                  onDismiss();
                }}
                className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#C9A063]/30 hover:bg-[#C9A063]/45 border border-[#DFBA7F]/50 text-[#DFBA7F] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>{isArabic ? 'التحقق من الصلاة' : 'Check Prayer (Oath)'}</span>
                <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-2.5 py-1 rounded-xl text-[11px] font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              {isArabic ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
