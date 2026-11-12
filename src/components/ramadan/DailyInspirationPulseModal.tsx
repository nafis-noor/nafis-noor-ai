import React, { useState, useEffect } from 'react';
import {
  Flame,
  X,
  Share2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Heart,
  Check,
  AlertTriangle,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import { DailyInspirationItem } from '../../types/ramadan';
import { trackInspirationPulse } from '../../utils/ramadanDb';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  modalBackdropVariants,
  inspirationCardVariants,
  lineRevealContainer,
  lineRevealItem,
  gentlePulseVariant,
} from '../../utils/animations';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface DailyInspirationPulseModalProps {
  isOpen: boolean;
  onDismissTemporarily: () => void;
  onEngagedComplete: () => void;
  item: DailyInspirationItem;
  dayNumber?: number;
  isDark?: boolean;
  language?: string;
}

export const DailyInspirationPulseModal: React.FC<DailyInspirationPulseModalProps> = ({
  isOpen,
  onDismissTemporarily,
  onEngagedComplete,
  item,
  dayNumber = 1,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'daily-inspiration-pulse-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasCopiedShare, setHasCopiedShare] = useState<boolean>(false);

  const handleReadMore = () => {
    setIsExpanded(true);
    trackInspirationPulse(item.id, item.contentType, true);
  };

  const handleFinishEngagement = () => {
    trackInspirationPulse(item.id, item.contentType, true);
    onEngagedComplete();
  };

  const handleShare = async () => {
    const textToShare = isArabic
      ? `🌙 *نبض نور الإيماني لشهر رمضان (اليوم ${dayNumber})*\n\n"${item.hook}"\n\n${item.shareMessage}\n\nاقرأ المزيد في تطبيق «نور»: رفيقك الإيماني المبارك`
      : `🌙 *NOOR Ramadan Daily Awakening (Day ${dayNumber})*\n\n"${item.hook}"\n\n${item.shareMessage}\n\nRead more in NOOR: Peaceful Islamic Companion`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: textToShare,
          url: window.location.origin + '/noor-ramadan',
        });
        setHasCopiedShare(true);
        setTimeout(() => setHasCopiedShare(false), 3000);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToShare);
      setHasCopiedShare(true);
      setTimeout(() => setHasCopiedShare(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="daily-inspiration-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#03050B]/92 select-none overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={isArabic ? 'نبض الإلهام الرمضاني اليومي' : 'Daily Ramadan Inspiration Pulse'}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Outer Card */}
          <motion.div
            key="daily-inspiration-card"
            variants={inspirationCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-lg rounded-[32px] border relative overflow-hidden flex flex-col justify-between transition-colors shadow-[0_0_60px_rgba(245,158,11,0.22)] bg-gradient-to-b from-[#111420] via-[#0A0D18] to-[#060810] border-amber-500/40 text-stone-100"
          >
            {/* Top Radiant Amber Glow Trim */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-95 z-20" />

            {/* Ambient Warm Amber Light Orbs */}
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

            {/* Header Bar */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3 border-b border-amber-500/20 bg-[#080B14]/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Flame className="w-5 h-5 animate-pulse text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      {isArabic ? `نبض إيماني • اليوم ${dayNumber}` : `Daily Inspiration Pulse • Day ${dayNumber}`}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 font-serif-heading">
                    {isArabic ? 'يقظة قلبية مباركة لشهر رمضان' : 'Heart Awakening for Ramadan'}
                  </p>
                </div>
              </div>

              <button
                onClick={onDismissTemporarily}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer btn-press-bounce"
                title={isArabic ? 'تأجيل مؤقت' : 'Swipe away temporarily'}
                aria-label="Dismiss temporarily"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body: Line-by-line staggered reveal */}
            <motion.div
              variants={lineRevealContainer}
              initial="initial"
              animate="animate"
              className="relative z-10 p-6 space-y-4 max-h-[72dvh] overflow-y-auto"
            >
              {/* Arabic Heading if available */}
              {item.arabicHeading && (
                <motion.div variants={lineRevealItem} className="text-center">
                  <p className="text-xl sm:text-2xl font-arabic font-bold text-amber-300/90 leading-relaxed" dir="rtl">
                    « {item.arabicHeading} »
                  </p>
                </motion.div>
              )}

              {/* Title */}
              <motion.div variants={lineRevealItem}>
                <h2 className="text-xl sm:text-2xl font-serif-heading font-bold text-white text-center tracking-wide">
                  {item.title}
                </h2>
              </motion.div>

              {/* Shocking / Stirring Hook Callout */}
              <motion.div
                variants={lineRevealItem}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black/50 border border-amber-500/35 text-amber-100 shadow-inner space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base font-semibold leading-relaxed text-amber-200">
                    "{item.hook}"
                  </p>
                </div>
              </motion.div>

              {/* Expandable / Full Content */}
              {!isExpanded ? (
                <motion.div variants={lineRevealItem} className="space-y-3">
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                    {item.previewText}
                  </p>

                  <motion.button
                    type="button"
                    variants={gentlePulseVariant}
                    animate="animate"
                    onClick={handleReadMore}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-cinzel text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 btn-press-bounce"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{isArabic ? 'قراءة المزيد وتدبر المعنى (مطلوب للإتمام)' : 'Read More & Stir Your Heart (Required to Clear)'}</span>
                  </motion.button>

                  <p className="text-[10px] text-center text-amber-400/80 font-mono">
                    {isArabic
                      ? '* سيعاود هذا النبض الظهور إذا أجلته حتى تتدبره وتتمه.'
                      : '* This pulse reappears if dismissed until you engage and reflect.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div variants={lineRevealItem} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs sm:text-sm text-stone-200 leading-relaxed font-light whitespace-pre-line">
                    {item.fullContent}
                  </div>

                  {/* Source or Citation */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/90 px-1">
                    <span>{isArabic ? 'المصدر / التخريج: ' : 'Source: '}{item.sourceOrCitation}</span>
                  </div>

                  {/* Call to Action Box */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <strong className="block text-emerald-300 font-semibold">{isArabic ? 'العمل والتطبيق الفوري:' : 'Immediate Action:'}</strong>
                      <span>{item.actionCall}</span>
                    </div>
                  </div>

                  {/* Final Complete Button & Share */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleFinishEngagement}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-stone-950 font-cinzel text-xs font-bold tracking-wider uppercase shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 btn-press-bounce"
                    >
                      <Check className="w-4 h-4 text-stone-950" />
                      <span>{isArabic ? 'تدبرت بقلبي — إتمام النبض' : 'I Have Reflected — Complete Pulse'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-press-bounce"
                      title={isArabic ? 'مشاركة النبض مع الأهل والأصدقاء' : 'Forward this reflection to family & friends'}
                    >
                      <Share2 className="w-4 h-4 text-amber-400" />
                      <span>{hasCopiedShare ? (isArabic ? 'تم النسخ!' : 'Copied to Share!') : (isArabic ? 'مشاركة النبض' : 'Share Pulse')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Footer Note */}
            <div className="relative z-10 px-6 py-3 border-t border-amber-500/15 bg-[#060810]/70 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>{isArabic ? 'نبض نور الإيماني الرمضاني' : 'NOOR Ramadan Spiritual Pulse'}</span>
              <button
                onClick={onDismissTemporarily}
                className="hover:text-amber-300 transition-colors underline cursor-pointer"
              >
                {isArabic ? 'ذكرني بعد ساعتين' : 'Remind me in 2 hours'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
