import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  Compass,
  ArrowRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { PrayerName, PrayerCheckStatus, PrayerCheckStep, PrayerRecord } from '../../types/prayerCheck';
import { PRAYER_ARABIC_NAMES } from '../../utils/aladhanService';
import { savePrayerRecord, buildPrayerId, markPrayerAsMissed } from '../../utils/prayerCheckDb';
import { OathFaqModal } from './OathFaqModal';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  modalBackdropVariants,
  modalBloomVariants,
  staggerButtonContainer,
  staggerButtonItem,
  SPRING_TRANSITION,
} from '../../utils/animations';
import { t, getLanguageCode, isRTLLanguage, TranslationKey } from '../../utils/i18n';

interface PrayerCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: PrayerName;
  scheduledTimeStr: string;
  prayerDate?: Date;
  onComplete?: (record: PrayerRecord) => void;
  isDark?: boolean;
  language?: string;
}

export const PrayerCheckModal: React.FC<PrayerCheckModalProps> = ({
  isOpen,
  onClose,
  prayerName,
  scheduledTimeStr,
  prayerDate = new Date(),
  onComplete,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'prayer-check-modal');

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  // Step state
  const [currentStep, setCurrentStep] = useState<PrayerCheckStep>(1);
  const [selectedTimingStatus, setSelectedTimingStatus] = useState<'on_time' | 'late'>('on_time');
  const [oathGiven, setOathGiven] = useState<boolean>(false);
  const [finalStatus, setFinalStatus] = useState<PrayerCheckStatus>('on_time');
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);

  // 20-second oath countdown timer (persisted across app close and reload via timestamp delta)
  const [countdownRemaining, setCountdownRemaining] = useState<number>(20);
  const countdownIntervalRef = useRef<any>(null);

  const dateStr = prayerDate.toISOString().split('T')[0];
  const prayerId = buildPrayerId(dateStr, prayerName);

  // Format date readable according to selected language
  const formattedDate = prayerDate.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // STEP 2: 20-Second Locked Countdown with Timestamp Delta Persistence
  useEffect(() => {
    if (currentStep !== 2) return;

    const timerStorageKey = `noor_oath_timer_target_${prayerId}`;
    let targetTimestamp: number;

    const savedTarget = localStorage.getItem(timerStorageKey);
    const now = Date.now();

    if (savedTarget && !isNaN(Number(savedTarget))) {
      targetTimestamp = Number(savedTarget);
      if (targetTimestamp < now - 600000) {
        targetTimestamp = now + 3000;
        localStorage.setItem(timerStorageKey, targetTimestamp.toString());
      }
    } else {
      targetTimestamp = now + 3000;
      localStorage.setItem(timerStorageKey, targetTimestamp.toString());
    }

    const updateTimer = () => {
      const currentNow = Date.now();
      const diffMs = targetTimestamp - currentNow;
      const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
      setCountdownRemaining(remainingSeconds);

      if (remainingSeconds <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };

    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 250);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [currentStep, prayerId]);

  if (!isOpen) return null;

  // STEP 1 Action: User selects On Time or Late
  const handleSelectTiming = (timing: 'on_time' | 'late') => {
    setSelectedTimingStatus(timing);
    setCurrentStep(2);
  };

  // STEP 2 Action: User acknowledges oath education after 20-second countdown
  const handleAcknowledgeOath = () => {
    if (countdownRemaining > 0) return;
    setCurrentStep(3);
  };

  // STEP 3 Actions
  const handleConfirmUnderOath = async () => {
    const record: PrayerRecord = {
      prayerId,
      date: dateStr,
      prayerName,
      status: selectedTimingStatus,
      confirmedAt: new Date().toISOString(),
      oathGiven: true,
      scheduledTime: scheduledTimeStr,
      createdAt: new Date().toISOString(),
    };

    await savePrayerRecord(record);
    setFinalStatus(selectedTimingStatus);
    setOathGiven(true);
    setCurrentStep(4);
    if (onComplete) onComplete(record);
  };

  const handleDidNotPray = async () => {
    const record: PrayerRecord = {
      prayerId,
      date: dateStr,
      prayerName,
      status: 'did_not_pray',
      confirmedAt: new Date().toISOString(),
      oathGiven: false,
      scheduledTime: scheduledTimeStr,
      createdAt: new Date().toISOString(),
    };

    await savePrayerRecord(record);
    setFinalStatus('did_not_pray');
    setOathGiven(false);
    setCurrentStep(4);
    if (onComplete) onComplete(record);
  };

  const arabicPrayerName = PRAYER_ARABIC_NAMES[prayerName] || prayerName;
  const prayerDisplay = isArabic
    ? arabicPrayerName
    : t(langCode, prayerName.toLowerCase() as TranslationKey);

  const stepSubtitle =
    currentStep === 1
      ? t(langCode, 'prayerVerificationStep')
      : currentStep === 2
      ? t(langCode, 'reflectionStep')
      : currentStep === 3
      ? t(langCode, 'confirmationStep')
      : t(langCode, 'recordSavedStep');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="prayer-check-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03060C]/90 select-none overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={isArabic ? 'إقرار ومتابعة الصلاة' : 'Prayer Check Confirmation'}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Full-Screen Container Card */}
            <motion.div
              key="prayer-check-card"
              variants={modalBloomVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full max-w-lg min-h-[540px] max-h-[92dvh] rounded-3xl border shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#080D1A] border-[#C9A063]/30 text-stone-100 shadow-[0_0_50px_rgba(201,160,99,0.12)]'
                  : 'bg-[#0A1122] border-[#C9A063]/40 text-stone-100 shadow-2xl'
              }`}
            >
              {/* Luminous Top Gold Trim */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-90 z-20" />

              {/* Background Ambient Glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#C9A063]/15 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#DFBA7F]/10 blur-3xl" />
              </div>

              {/* Modal Header Bar with Step Indicator */}
              <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#C9A063]/15 bg-[#050914]/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30 flex items-center justify-center text-[#DFBA7F]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-cinzel font-bold text-[#DFBA7F] tracking-wider uppercase">
                      {isArabic ? `التحقق من الصلاة — الخطوة ${currentStep} من 4` : `${t(langCode, 'prayerCheckShort')} — ${t(langCode, 'stepOf')} ${currentStep}/4`}
                    </h3>
                    <p className="text-[11px] text-stone-400 font-sans">
                      {stepSubtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={isArabic ? 'إغلاق' : 'Close'}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Pill Indicator */}
              <div className="relative z-10 px-6 pt-3 flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      currentStep >= step
                        ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] shadow-[0_0_8px_rgba(201,160,99,0.5)]'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* ========================================================================= */}
              {/* STEP 1: ASK IF THEY PRAYED OR NO                                          */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-3 pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Prayer Name & Calligraphy */}
                    <div className="space-y-1">
                      <h2 className="text-3xl sm:text-4xl font-serif-heading font-bold text-white tracking-wide">
                        {isArabic ? `صلاة ${arabicPrayerName}` : `${prayerDisplay} Prayer`}
                      </h2>
                      {!isArabic && (
                        <p className="text-2xl font-arabic text-[#DFBA7F]" dir="rtl">
                          صلاة {arabicPrayerName}
                        </p>
                      )}
                    </div>

                    {/* Scheduled Time Banner */}
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#C9A063]/20 max-w-sm mx-auto shadow-inner">
                      <div className="text-xs text-stone-400 uppercase tracking-widest font-mono">
                        {isArabic ? 'وقت الصلاة المقرر' : t(langCode, 'scheduledAt')}
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#DFBA7F] mt-0.5">
                        {scheduledTimeStr}
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 mt-1 font-sans">
                        <Sparkles className="w-3 h-3" />
                        <span>{isArabic ? 'مهلة 10 دقائق تُعد صلاة في الوقت' : '10-Minute Grace Period counts as On-Time'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Ask "Did you pray?" Staggered with 100ms delay */}
                  <motion.div
                    variants={staggerButtonContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-3 pt-1"
                  >
                    <p className="text-sm font-semibold text-center text-stone-200 font-sans">
                      {isArabic
                        ? `هل صليت صلاة ${arabicPrayerName}؟`
                        : t(langCode, 'didYouPrayQuestion').replace('{prayer}', prayerDisplay)}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Yes: On Time */}
                      <motion.div variants={staggerButtonItem}>
                        <button
                          type="button"
                          onClick={() => handleSelectTiming('on_time')}
                          className={`w-full p-4 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer group shadow-lg btn-press-bounce ${
                            isRTL ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{t(langCode, 'yesOnTime')}</span>
                            </span>
                            <ChevronRight className={`w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-[11px] text-emerald-200/70 mt-1 font-light">
                            {t(langCode, 'yesOnTimeDesc')}
                          </p>
                        </button>
                      </motion.div>

                      {/* Yes: Late / Qada */}
                      <motion.div variants={staggerButtonItem}>
                        <button
                          type="button"
                          onClick={() => handleSelectTiming('late')}
                          className={`w-full p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer group shadow-lg btn-press-bounce ${
                            isRTL ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>{t(langCode, 'yesLate')}</span>
                            </span>
                            <ChevronRight className={`w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-[11px] text-amber-200/70 mt-1 font-light">
                            {t(langCode, 'yesLateDesc')}
                          </p>
                        </button>
                      </motion.div>
                    </div>

                    {/* Direct Honest Option: No, I did not pray */}
                    <motion.div variants={staggerButtonItem}>
                      <button
                        type="button"
                        onClick={handleDidNotPray}
                        className="w-full py-3 px-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.97] btn-press-bounce"
                      >
                        <Heart className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{t(langCode, 'noDidNotPray')} ({t(langCode, 'noDidNotPrayDesc')})</span>
                      </button>
                    </motion.div>
                  </motion.div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: REFLECTION & 20-SECOND LOCKED COUNTDOWN                          */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-5 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-3xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <ShieldAlert className="w-7 h-7 animate-pulse" />
                    </div>

                    <div className="text-center space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-serif-heading font-bold text-[#DFBA7F]">
                        {t(langCode, 'solemnReflectionTitle')}
                      </h2>
                      <p className="text-base font-arabic text-amber-300" dir="rtl">
                        {t(langCode, 'solemnReflectionArabic')}
                      </p>
                    </div>

                    {/* Solemn Education Card */}
                    <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 text-stone-200 space-y-2.5 text-xs sm:text-sm leading-relaxed">
                      <p>{t(langCode, 'solemnReflectionP1')}</p>
                      <p className="text-stone-300">{t(langCode, 'solemnReflectionP2')}</p>
                    </div>

                    {/* Learn More Link to FAQ */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsFaqOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#DFBA7F] hover:text-[#F3D7A4] underline underline-offset-4 font-medium cursor-pointer transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>{t(langCode, 'learnMoreFaq')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Gold Progress Ring */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        onClick={countdownRemaining === 0 ? handleAcknowledgeOath : undefined}
                        className={`relative w-28 h-28 flex items-center justify-center transition-all ${
                          countdownRemaining === 0
                            ? 'cursor-pointer active:scale-95 animate-pulse shadow-[0_0_25px_rgba(223,186,127,0.35)] rounded-full'
                            : ''
                        }`}
                        title={countdownRemaining === 0 ? (isArabic ? 'اضغط للمتابعة' : 'Tap to proceed') : undefined}
                      >
                        <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            className="stroke-stone-800/80"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="url(#goldGradientTimer)"
                            strokeWidth="5"
                            strokeDasharray={263.89}
                            strokeDashoffset={263.89 * (countdownRemaining / 3)}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-300 ease-linear"
                          />
                          <defs>
                            <linearGradient id="goldGradientTimer" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#C9A063" />
                              <stop offset="50%" stopColor="#DFBA7F" />
                              <stop offset="100%" stopColor="#FFE3A8" />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className={`absolute inset-0 flex flex-col items-center justify-center ${countdownRemaining === 0 ? 'cursor-pointer' : 'pointer-events-none'}`}>
                          <motion.span
                            key={countdownRemaining}
                            initial={{ scale: 1.25, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                            className="text-2xl font-bold font-mono text-[#DFBA7F] drop-shadow-sm"
                          >
                            {countdownRemaining === 0 ? '✓' : countdownRemaining}
                          </motion.span>
                          <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${countdownRemaining === 0 ? 'text-[#DFBA7F]' : 'text-stone-400'}`}>
                            {countdownRemaining === 0 ? t(langCode, 'ready') : t(langCode, 'secs')}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-400 mt-2 font-mono text-center">
                        {countdownRemaining > 0
                          ? t(langCode, 'countdownInProgress')
                          : (isArabic ? 'اضغط على الدائرة أو الزر بالأسفل لتأكيد الصلاة' : 'Ready! Tap circle or button below to confirm')}
                      </p>
                    </div>

                    {/* "I Understand / Ready" Button */}
                    <button
                      type="button"
                      onClick={handleAcknowledgeOath}
                      disabled={countdownRemaining > 0}
                      className={`w-full py-3.5 px-6 rounded-2xl font-cinzel text-xs font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 btn-press-bounce ${
                        countdownRemaining > 0
                          ? 'bg-stone-800/80 text-stone-500 border border-white/5 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080B12] shadow-[0_0_20px_rgba(223,186,127,0.4)] cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{countdownRemaining === 0 ? (isArabic ? 'جاهز • اضغط للمتابعة' : 'Ready • Tap to Proceed') : t(langCode, 'iUnderstandConfirm')}</span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: CONFIRMATION (OR DID NOT PRAY)                                    */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-4 pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] mx-auto shadow-[0_0_20px_rgba(201,160,99,0.25)]">
                      <Compass className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="text-xs uppercase font-mono tracking-widest text-stone-400">
                        {isArabic ? `إقرار أداء صلاة ${arabicPrayerName}` : `${t(langCode, 'confirmationStep')}: ${prayerDisplay}`}
                      </div>
                      <h2 className="text-2xl font-serif-heading font-bold text-white mt-1">
                        {t(langCode, 'oathSolemnTitle')}
                      </h2>
                    </div>

                    {/* Atmospheric Arabic Calligraphy Box */}
                    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0F182A]/90 to-[#0A101D]/90 border border-[#C9A063]/30 shadow-2xl space-y-3 relative overflow-hidden">
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#C9A063]/10 blur-xl pointer-events-none" />

                      <p className="text-stone-400 text-xs font-sans uppercase tracking-wider">
                        {isArabic ? 'صيغة الإقرار والشهادة الشرعية:' : 'Declaration in Arabic:'}
                      </p>

                      <div className="text-2xl sm:text-3xl font-arabic font-bold text-[#DFBA7F] leading-loose py-2 selection:bg-[#C9A063]/30" dir="rtl">
                        « أُقْسِمُ بِاللَّهِ الْعَظِيمِ أَنِّي قَدْ أَدَّيْتُ صَلَاةَ {arabicPrayerName} »
                      </div>

                      <p className="text-xs text-stone-300 font-serif italic border-t border-[#C9A063]/15 pt-3">
                        {isArabic
                          ? 'أشهد وأقر بصدق أني أديت هذه الصلاة لوجه الله تعالى'
                          : t(langCode, 'oathEnglishFormula').replace('{prayer}', prayerDisplay)}
                      </p>
                    </div>

                    <p className="text-[11px] text-stone-400 font-sans max-w-sm mx-auto">
                      {t(langCode, 'oathSolemnSub')}
                    </p>
                  </div>

                  {/* Two Buttons: Primary Gold (Confirm) vs Secondary Ghost (Did Not Pray) */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmUnderOath}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#07090F] font-cinzel text-xs font-bold tracking-widest uppercase shadow-[0_0_25px_rgba(201,160,99,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#07090F]" />
                      <span>{t(langCode, 'oathConfirmBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDidNotPray}
                      className="w-full py-3 px-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/10 hover:border-white/20 font-sans text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t(langCode, 'noDidNotPray')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: COMPLETION (ACCEPTANCE OR MERCY)                                  */}
              {/* ========================================================================= */}
              {currentStep === 4 && (
                <div className="relative z-10 p-6 flex-1 flex flex-col justify-between space-y-6 animate-fadeIn">
                  <div className="text-center space-y-5 pt-4">
                    {oathGiven ? (
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        <Heart className="w-9 h-9" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-serif-heading font-bold text-white">
                        {oathGiven
                          ? isArabic
                            ? 'تقبّل الله منا ومنكم'
                            : t(langCode, 'prayerRecordedTitle')
                          : isArabic
                          ? 'إن الله غفور رحيم'
                          : 'Allah is Most Merciful'}
                      </h2>
                      <p className="text-2xl font-arabic text-[#DFBA7F]" dir="rtl">
                        {oathGiven ? 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ صَالِحَ الْأَعْمَالِ' : 'إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-[#C9A063]/20 text-xs sm:text-sm text-stone-300 max-w-sm mx-auto leading-relaxed">
                      {oathGiven ? (
                        <p>
                          {isArabic
                            ? `تم تأكيد صلاة ${arabicPrayerName} وحفظها بأمان في سجلك المحلي على هذا الجهاز. تقبل الله طاعتكم وجعلها نوراً لكم.`
                            : t(langCode, 'prayerRecordedSub')}
                        </p>
                      ) : (
                        <p>
                          {isArabic
                            ? 'صدقك وإقرارك أمام الله أمانة ومحبة؛ لا تقنط من رحمة الله الواسعة. بادر بالوضوء الآن وأدِّ الصلاة قضاءً لوجه الله.'
                            : 'Your honesty before Allah is truly valued. Do not lose hope in Allah\'s boundless mercy. Make wudu now and perform this prayer (Qada).'}
                        </p>
                      )}
                    </div>

                    <div className="inline-flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-stone-400">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {isArabic ? 'الصلاة: ' : 'Prayer: '}<strong className="text-white uppercase">{prayerDisplay}</strong>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {isArabic ? 'الحالة: ' : 'Status: '}<strong className="text-emerald-400 uppercase">
                          {finalStatus === 'on_time'
                            ? t(langCode, 'statusOnTime')
                            : finalStatus === 'late'
                            ? t(langCode, 'statusLate')
                            : finalStatus === 'did_not_pray'
                            ? t(langCode, 'statusDidNotPray')
                            : t(langCode, 'statusMissed')}
                        </strong>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        {isArabic ? 'الحفظ: ' : 'Storage: '}<strong className="text-[#DFBA7F]">{isArabic ? 'محلي في الجهاز' : 'Local IndexedDB'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#050811] font-cinzel text-xs font-bold tracking-wider uppercase shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {t(langCode, 'returnHome')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OathFaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        isDark={isDark}
        language={language}
      />
    </>
  );
};
