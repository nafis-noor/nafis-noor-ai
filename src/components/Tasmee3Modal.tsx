import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Check,
  ChevronRight,
  Volume2,
  BookOpen,
  Info,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  VolumeX,
  Compass
} from 'lucide-react';
import { Surah, Ayah } from '../types';
import { ALL_SURAHS } from '../data/quranData';
import { loadCompleteSurah } from '../utils/quranLoader';
import { getGlobalLanguage } from '../utils/i18n';
import { Tasmee3Controller, Tasmee3Status, Tasmee3SessionSummary } from '../utils/tasmee3Speech';
import { Tasmee3RangeResult, AyahRecitationReview, WordDetail } from '../utils/tasmee3Analysis';
import { Tasmee3Waveform } from './Tasmee3Waveform';

interface Tasmee3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  initialSurah?: Surah;
  initialVerseNumber?: number;
  onJumpToVerseInReader?: (surah: Surah, verseNumber: number) => void;
}

export const Tasmee3Modal: React.FC<Tasmee3ModalProps> = ({
  isOpen,
  onClose,
  isDark,
  initialSurah,
  initialVerseNumber = 1,
  onJumpToVerseInReader,
}) => {
  // Surah & Range selection
  const [selectedSurah, setSelectedSurah] = useState<Surah>(() => initialSurah || ALL_SURAHS[66] || ALL_SURAHS[0]); // Default to Al-Mulk or initial
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(10);
  const [loadedAyahs, setLoadedAyahs] = useState<Ayah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const isArabic = getGlobalLanguage() === 'ar';

  // Controller state
  const [status, setStatus] = useState<Tasmee3Status>('idle');
  const [currentVerse, setCurrentVerse] = useState<number>(1);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [uncertainMessage, setUncertainMessage] = useState<string | null>(null);
  const [isSilenceWaiting, setIsSilenceWaiting] = useState(false);
  const [spokenTextPreview, setSpokenTextPreview] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result & Review state
  const [rangeResult, setRangeResult] = useState<Tasmee3RangeResult | null>(null);
  const [selectedReviewAyahNumber, setSelectedReviewAyahNumber] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'warning' | 'missing'>('all');

  // View modes
  const [viewMode, setViewMode] = useState<'setup' | 'permission_info' | 'active' | 'review'>('setup');

  const controllerRef = useRef<Tasmee3Controller | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync initialSurah and verse when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = initialSurah || ALL_SURAHS.find(s => s.number === 67) || ALL_SURAHS[0];
      setSelectedSurah(initial);

      const start = Math.max(1, Math.min(initial.numberOfAyahs, initialVerseNumber));
      const end = Math.min(initial.numberOfAyahs, start + 9); // e.g. 1 -> 10 default
      setFromAyah(start);
      setToAyah(end);
      setCurrentVerse(start);
      setRangeResult(null);
      setUncertainMessage(null);
      setErrorMessage(null);
      setSpokenTextPreview('');
      setIsSilenceWaiting(false);
      setViewMode('setup');
    }
  }, [isOpen, initialSurah, initialVerseNumber]);

  // Load complete Ayahs when selectedSurah changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchAyahs() {
      setIsLoadingAyahs(true);
      try {
        const ayahs = await loadCompleteSurah(selectedSurah.number, getGlobalLanguage());
        if (!isCancelled) {
          setLoadedAyahs(ayahs);
          setIsLoadingAyahs(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[Tasmee3] Failed to load surah ayahs:', err);
          setIsLoadingAyahs(false);
        }
      }
    }
    fetchAyahs();
    return () => {
      isCancelled = true;
    };
  }, [selectedSurah.number]);

  // Clean up controller on unmount or close
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
    };
  }, []);

  // Set range presets helper
  const handleSetPreset = (preset: '1-5' | '1-10' | '1-20' | 'full') => {
    if (preset === '1-5') {
      setFromAyah(1);
      setToAyah(Math.min(5, selectedSurah.numberOfAyahs));
    } else if (preset === '1-10') {
      setFromAyah(1);
      setToAyah(Math.min(10, selectedSurah.numberOfAyahs));
    } else if (preset === '1-20') {
      setFromAyah(1);
      setToAyah(Math.min(20, selectedSurah.numberOfAyahs));
    } else if (preset === 'full') {
      setFromAyah(1);
      setToAyah(selectedSurah.numberOfAyahs);
    }
  };

  // Start continuous listening session
  const handleStartSession = useCallback(async () => {
    setErrorMessage(null);
    setUncertainMessage(null);
    setSpokenTextPreview('');
    setIsSilenceWaiting(false);

    let ayahs = loadedAyahs;
    if (ayahs.length === 0) {
      try {
        setIsLoadingAyahs(true);
        ayahs = await loadCompleteSurah(selectedSurah.number, getGlobalLanguage());
        setLoadedAyahs(ayahs);
        setIsLoadingAyahs(false);
      } catch (err) {
        setErrorMessage('Failed to load authoritative Quran text. Please try again.');
        setIsLoadingAyahs(false);
        return;
      }
    }

    const controller = new Tasmee3Controller({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'permission_denied') {
          setViewMode('permission_info');
        }
      },
      onPositionUpdate: (verseNum) => {
        setCurrentVerse(verseNum);
        setUncertainMessage(null);
        setIsSilenceWaiting(false);
      },
      onUncertain: (msg) => {
        setUncertainMessage(msg);
      },
      onAudioLevel: (lvl) => {
        setAudioLevel(lvl);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onSpokenText: (txt) => {
        setSpokenTextPreview(txt);
      },
      onSilenceWaiting: (isWaiting) => {
        setIsSilenceWaiting(isWaiting);
      },
      onRangeFinished: (result) => {
        setRangeResult(result);
        setSelectedReviewAyahNumber(fromAyah);
        setViewMode('review');
      },
    });

    controllerRef.current = controller;

    const started = await controller.start({
      surahNumber: selectedSurah.number,
      surahName: selectedSurah.name,
      surahEnglishName: selectedSurah.englishName,
      startingVerse: fromAyah,
      toVerse: toAyah,
      verses: ayahs,
    });

    if (started) {
      setCurrentVerse(fromAyah);
      setViewMode('active');
    }
  }, [loadedAyahs, selectedSurah, fromAyah, toAyah]);

  const handlePause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const handleStop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  const handleFinish = useCallback(() => {
    if (controllerRef.current) {
      const summary = controllerRef.current.finish();
      if (summary.rangeResult) {
        setRangeResult(summary.rangeResult);
        setSelectedReviewAyahNumber(summary.startingVerse);
      }
      setViewMode('review');
    }
  }, []);

  const handleClose = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
      controllerRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Jump to ayah in review screen
  const handleJumpToReviewAyah = (ayahNum: number) => {
    setSelectedReviewAyahNumber(ayahNum);
    const elem = document.getElementById(`review-ayah-${ayahNum}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isOpen) return null;

  const currentAyahObj = loadedAyahs.find((a) => a.numberInSurah === currentVerse) || null;
  const nextAyahObj = loadedAyahs.find((a) => a.numberInSurah === currentVerse + 1) || null;
  const totalRangeCount = Math.max(1, toAyah - fromAyah + 1);
  const currentProgressCount = Math.min(totalRangeCount, Math.max(1, currentVerse - fromAyah + 1));
  const progressPercent = Math.min(100, Math.round((currentProgressCount / totalRangeCount) * 100));

  return (
    <div
      id="tasmee3-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="tasmee3-modal-container"
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-4 sm:p-7 flex flex-col justify-between transition-all transform-gpu my-auto ${
          isDark
            ? 'bg-[#0E1217]/95 border-[#C9A063]/35 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
            : 'bg-white/95 border-[#C9A063]/30 text-stone-900 shadow-xl'
        }`}
      >
        {/* ========================================================================= */}
        {/* TOP BRANDING BAR                                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#C9A063]/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A063]/30 to-[#DFBA7F]/10 border border-[#C9A063]/40 flex items-center justify-center shadow-sm">
              <Mic className="w-5 h-5 text-[#DFBA7F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif-heading font-bold text-[#DFBA7F]">
                  {isArabic ? 'تسميع القرآن الصوتي' : 'Tasme3 2.0'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A063]/20 text-[#DFBA7F] font-semibold">
                  {isArabic ? 'استماع وتتبع التلاوة' : 'Qur’an Recitation Listening'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isArabic
                  ? 'تتبع مستمر للتلاوة مع كشف الكلمات والآيات في القرآن الكريم'
                  : 'Continuous recitation tracking with Qur’anic Arabic mistake analysis'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-tasmee3"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 active:scale-90 transition-all"
            title={isArabic ? 'إغلاق التسميع' : 'Close Tasmee3'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: CHOOSE EXACTLY WHAT YOU WANT TO RECITE                            */}
        {/* ========================================================================= */}
        {viewMode === 'setup' && (
          <div className="space-y-5">
            {/* Step Explanation Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                isDark ? 'bg-[#141A22]/80 border-[#C9A063]/25 text-stone-300' : 'bg-amber-50/70 border-amber-200 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[#DFBA7F]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isArabic ? 'اختر نطاق التسميع المبارك:' : 'Choose your recitation range:'}</span>
              </div>
              <p className="text-stone-400 text-[11px]">
                {isArabic
                  ? 'اختر السورة والآيات التي تريد تسميعها. عند البدء، يستمع نور لتلاوتك بشكل متواصل دون مقاطعة.'
                  : 'Select a Surah and choose your exact starting and ending Ayah. When you start, Noor listens continuously with no interruptions.'}
              </p>
            </div>

            {/* Surah Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#DFBA7F] flex items-center justify-between">
                <span>{isArabic ? 'اختيار السورة الكريمة:' : 'Select Surah:'}</span>
                <span className="font-arabic text-sm text-[#DFBA7F]">{selectedSurah.name}</span>
              </label>
              <select
                id="tasmee3-surah-select"
                value={selectedSurah.number}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  const found = ALL_SURAHS.find((s) => s.number === num);
                  if (found) {
                    setSelectedSurah(found);
                    setFromAyah(1);
                    setToAyah(Math.min(10, found.numberOfAyahs));
                    setCurrentVerse(1);
                  }
                }}
                className={`w-full p-3 rounded-2xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A063]/50 ${
                  isDark
                    ? 'bg-[#12161D] border-[#C9A063]/30 text-stone-100'
                    : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              >
                {ALL_SURAHS.map((s) => (
                  <option
                    key={s.number}
                    value={s.number}
                    className={isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'}
                  >
                    {s.number}. {isArabic ? `سورة ${s.name}` : `${s.englishName} (${s.name})`} — {s.numberOfAyahs} {isArabic ? 'آيات' : 'Ayahs'}
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinated From Ayah & To Ayah Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* From Ayah */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#12161D]/70 border-[#C9A063]/25' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#DFBA7F]">{isArabic ? 'من الآية:' : 'From Ayah:'}</label>
                  <span className="font-mono text-xs font-bold text-[#DFBA7F]">{isArabic ? `الآية ${fromAyah}` : `Ayah ${fromAyah}`}</span>
                </div>
                <input
                  id="tasmee3-from-ayah-slider"
                  type="range"
                  min="1"
                  max={toAyah}
                  value={fromAyah}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFromAyah(val);
                    if (val > toAyah) setToAyah(val);
                  }}
                  className="w-full accent-[#C9A063] cursor-pointer h-2 bg-stone-700/60 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>{isArabic ? 'الآية ١' : 'Ayah 1'}</span>
                  <span>{isArabic ? `الأقصى: الآية ${toAyah}` : `Max: Ayah ${toAyah}`}</span>
                </div>
              </div>

              {/* To Ayah */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[#12161D]/70 border-[#C9A063]/25' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#DFBA7F]">{isArabic ? 'إلى الآية:' : 'To Ayah:'}</label>
                  <span className="font-mono text-xs font-bold text-emerald-400">{isArabic ? `الآية ${toAyah}` : `Ayah ${toAyah}`}</span>
                </div>
                <input
                  id="tasmee3-to-ayah-slider"
                  type="range"
                  min={fromAyah}
                  max={selectedSurah.numberOfAyahs}
                  value={toAyah}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setToAyah(val);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-stone-700/60 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>{isArabic ? `الأدنى: الآية ${fromAyah}` : `Min: Ayah ${fromAyah}`}</span>
                  <span>{isArabic ? `نهاية السورة: ${selectedSurah.numberOfAyahs}` : `End of Surah: ${selectedSurah.numberOfAyahs}`}</span>
                </div>
              </div>
            </div>

            {/* Quick Range Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400">{isArabic ? 'نطاق سريع:' : 'Quick Range:'}</span>
              <button
                onClick={() => handleSetPreset('1-5')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === 5
                    ? 'bg-[#C9A063]/30 text-[#DFBA7F] border-[#C9A063]'
                    : isDark
                    ? 'bg-stone-900/60 text-stone-400 border-white/10'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {isArabic ? 'الآيات ١ ← ٥' : 'Ayah 1 → 5'}
              </button>
              <button
                onClick={() => handleSetPreset('1-10')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === 10
                    ? 'bg-[#C9A063]/30 text-[#DFBA7F] border-[#C9A063]'
                    : isDark
                    ? 'bg-stone-900/60 text-stone-400 border-white/10'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {isArabic ? 'الآيات ١ ← ١٠' : 'Ayah 1 → 10'}
              </button>
              {selectedSurah.numberOfAyahs >= 20 && (
                <button
                  onClick={() => handleSetPreset('1-20')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                    fromAyah === 1 && toAyah === 20
                      ? 'bg-[#C9A063]/30 text-[#DFBA7F] border-[#C9A063]'
                      : isDark
                      ? 'bg-stone-900/60 text-stone-400 border-white/10'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {isArabic ? 'الآيات ١ ← ٢٠' : 'Ayah 1 → 20'}
                </button>
              )}
              <button
                onClick={() => handleSetPreset('full')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  fromAyah === 1 && toAyah === selectedSurah.numberOfAyahs
                    ? 'bg-[#C9A063]/30 text-[#DFBA7F] border-[#C9A063]'
                    : isDark
                    ? 'bg-stone-900/60 text-stone-400 border-white/10'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {isArabic ? `كامل السورة (١ ← ${selectedSurah.numberOfAyahs})` : `Entire Surah (1 → ${selectedSurah.numberOfAyahs})`}
              </button>
            </div>

            {/* Clear Selected Range Preview Card (Requirement 1) */}
            <div
              className={`p-4 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-[#141A22] to-[#0A0D11] border-[#C9A063]/35 shadow-inner'
                  : 'bg-gradient-to-r from-amber-50/70 to-white border-[#C9A063]/30'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#C9A063]/15">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider">
                  {isArabic ? 'النطاق المحدد' : 'Selected Range'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold font-mono">
                  {isArabic ? `${totalRangeCount} آيات في الجلسة` : `${totalRangeCount} Ayahs in session`}
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-serif-heading font-bold text-[#DFBA7F]">
                    {isArabic ? `سورة ${selectedSurah.name} · الآيات ${fromAyah} ← ${toAyah}` : `Surah ${selectedSurah.englishName} · Ayah ${fromAyah} → Ayah ${toAyah}`}
                  </h3>
                  {!isArabic && (
                    <p className="text-xs text-stone-400">
                      {selectedSurah.englishNameTranslation} • {selectedSurah.revelationType}
                    </p>
                  )}
                </div>
                <div dir="rtl" className="font-arabic text-xl sm:text-2xl text-[#DFBA7F]">
                  سُورَةُ {selectedSurah.name} (الآيات {fromAyah}–{toAyah})
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Start Tasmee3 Button */}
            <div className="pt-1">
              <button
                id="btn-start-tasmee3-session"
                onClick={handleStartSession}
                disabled={isLoadingAyahs}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold text-sm shadow-lg hover:shadow-[0_0_25px_rgba(201,160,99,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>{isArabic ? `بدء التسميع (الآيات ${fromAyah} ← ${toAyah})` : `Start Tasme3 (Ayah ${fromAyah} → ${toAyah})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PERMISSION REQUEST INFO                                           */}
        {/* ========================================================================= */}
        {viewMode === 'permission_info' && (
          <div className="space-y-4 py-4 text-center">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <MicOff className="w-7 h-7" />
            </div>
            <h3 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
              {isArabic ? 'إذن استخدام الميكروفون مطلوب' : 'Microphone Access Required'}
            </h3>
            <div className="max-w-md mx-auto text-xs text-stone-300 leading-relaxed space-y-2">
              <p>
                {isArabic
                  ? 'يستمع نظام التسميع لتلاوتك الكريمة بشكل متواصل لتتبع الآيات ورصد أي كلمة ساقطة أو مكررة بدقة.'
                  : 'Tasme3 continuously listens as you recite to detect each verse progression and identify skipped or repeated words in authentic Qur\'anic Arabic.'}
              </p>
              <p className="text-[11px] text-stone-400">
                {isArabic
                  ? '• تتم معالجة الصوت أثناء الجلسة فقط ولا يتم تخزينه أو مشاركته إطلاقاً.'
                  : '• Audio is processed strictly in your session and is never permanently stored or shared.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setViewMode('setup')}
                className="px-4 py-2 rounded-xl border border-stone-700 text-xs font-semibold text-stone-300 hover:bg-stone-800 active:scale-95 transition-all"
              >
                {isArabic ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handleStartSession}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السماح بالميكروفون والبدء' : 'Allow Microphone & Recite'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ONE CONTINUOUS LISTENING SESSION & LIVE QUR'AN TRACKING           */}
        {/* ========================================================================= */}
        {viewMode === 'active' && (
          <div className="space-y-4">
            {/* Live Status Header & Progress: "Ayah 7 / 10" */}
            <div
              className={`p-4 rounded-3xl border flex flex-col gap-2.5 ${
                isDark ? 'bg-[#141A22]/90 border-[#C9A063]/30' : 'bg-amber-50/80 border-[#C9A063]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-mono font-bold text-[#DFBA7F]">
                      {isArabic ? `الآية ${currentVerse} من ${toAyah}` : `Ayah ${currentVerse} / ${toAyah}`}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      ({isArabic ? `النطاق: ${fromAyah}–${toAyah}` : `Range: ${fromAyah}–${toAyah}`})
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {isArabic ? `سورة ${selectedSurah.name}` : `Surah ${selectedSurah.englishName} (${selectedSurah.name})`}
                  </div>
                </div>

                {/* Status indicator: 🟢 Listening... / Waiting / Paused */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      status === 'listening'
                        ? isSilenceWaiting
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : status === 'paused'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'listening'
                          ? isSilenceWaiting
                            ? 'bg-amber-400'
                            : 'bg-emerald-400 animate-ping'
                          : status === 'paused'
                          ? 'bg-amber-400'
                          : 'bg-stone-500'
                      }`}
                    />
                    <span>
                      {status === 'listening'
                        ? isSilenceWaiting
                          ? (isArabic ? 'يستمع... خذ وقتك بالسكينة' : 'Listening… Take your time')
                          : (isArabic ? '🟢 يستمع لتلاوتك...' : '🟢 Listening...')
                        : status === 'paused'
                        ? (isArabic ? 'متوقف مؤقتاً' : 'Paused')
                        : (isArabic ? 'متوقف' : 'Stopped')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar across selected range */}
              <div className="w-full bg-stone-700/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A063] to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Audio-Reactive Voice Waveform Canvas */}
            <Tasmee3Waveform
              audioLevel={audioLevel}
              isListening={status === 'listening'}
              isPaused={status === 'paused'}
              isDark={isDark}
              height={52}
            />

            {/* Detected Recitation Preview in Arabic */}
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-[#0B0E14]/70 border-[#C9A063]/20' : 'bg-stone-100/80 border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Volume2 className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                <span className="text-stone-400 text-[10px] shrink-0">{isArabic ? 'ما تم رصده:' : 'Detected:'}</span>
                <span dir="rtl" className="font-arabic text-sm text-[#DFBA7F] truncate">
                  {spokenTextPreview || (isArabic ? 'في انتظار تلاوتك الكريمة... اتلُ بوضوح' : 'Waiting for recitation... recite clearly')}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                {isArabic ? 'انتقال تلقائي مع التلاوة' : 'No next button required'}
              </span>
            </div>

            {/* Highlighted Ayah Currently Being Recited (Majestic Arabic Typography) */}
            <div
              className={`p-5 sm:p-6 rounded-3xl border text-center transition-all ${
                isDark
                  ? 'bg-gradient-to-b from-[#141A22] to-[#0A0D11] border-[#C9A063]/40 shadow-inner'
                  : 'bg-gradient-to-b from-amber-50/50 to-white border-[#C9A063]/30 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3 pb-2 border-b border-[#C9A063]/15">
                <span className="text-[#DFBA7F]">
                  {isArabic ? `الآية الحالية المطلوبة [الآية ${currentVerse}]` : `Currently Reciting [Ayah ${currentVerse}]`}
                </span>
                <span className="font-arabic text-[#DFBA7F] text-sm">
                  {selectedSurah.name} : {currentVerse}
                </span>
              </div>

              {currentAyahObj ? (
                <div className="space-y-4">
                  {/* Majestic Arabic Text with Verse End Symbol */}
                  <div
                    dir="rtl"
                    className="font-arabic text-2xl sm:text-3xl leading-[2.5] text-[#DFBA7F] font-normal tracking-wide px-2 select-text"
                  >
                    {currentAyahObj.text}
                    <span className="font-sans text-xs px-2.5 py-0.5 rounded-full border border-[#C9A063]/40 text-[#DFBA7F] mr-2 inline-block">
                      ۝{currentVerse}
                    </span>
                  </div>

                  {/* Translation */}
                  {!isArabic && currentAyahObj.translation && (
                    <div
                      className={`text-xs sm:text-sm leading-relaxed max-w-xl mx-auto pt-3 border-t ${
                        isDark ? 'border-[#C9A063]/15 text-stone-300' : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {currentAyahObj.translation}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-stone-400 text-xs">
                  {isArabic ? 'جاري تحميل نص الآية الكريمة...' : 'Loading verse text...'}
                </div>
              )}

              {/* Upcoming Verse Queue Preview */}
              {nextAyahObj && currentVerse < toAyah && (
                <div className="mt-4 pt-3 border-t border-[#C9A063]/15 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{isArabic ? `الآية التالية (${currentVerse + 1}):` : `Upcoming Ayah ${currentVerse + 1}:`}</span>
                  <span dir="rtl" className="font-arabic text-[#DFBA7F]/80 truncate max-w-[280px]">
                    {nextAyahObj.text}
                  </span>
                </div>
              )}
            </div>

            {/* Session Controls: Pause / Resume / Stop / Finish Review */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1">
              {status === 'listening' ? (
                <button
                  id="btn-tasmee3-pause"
                  onClick={handlePause}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-4 h-4" />
                  <span>{isArabic ? 'إيقاف مؤقت' : 'Pause'}</span>
                </button>
              ) : (
                <button
                  id="btn-tasmee3-resume"
                  onClick={handleResume}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  <span>{isArabic ? 'متابعة' : 'Resume'}</span>
                </button>
              )}

              <button
                id="btn-tasmee3-stop"
                onClick={handleStop}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-600 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إيقاف' : 'Stop'}</span>
              </button>

              <button
                id="btn-tasmee3-finish"
                onClick={handleFinish}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold text-xs shadow-md hover:shadow-[0_0_20px_rgba(201,160,99,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isArabic ? 'إنهاء ومراجعة' : 'Finish & Review'}</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              {isArabic
                ? 'اتلُ بتمهل وطمأنينة، وسينتقل تطبيق نور تلقائياً عند إتمام كل آية.'
                : 'Recite naturally at your own pace. Noor moves forward automatically when you finish each ayah.'}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: THE WOW SCREEN 🤯 (AUTHENTIC REVIEW & MISTAKE BREAKDOWN)          */}
        {/* ========================================================================= */}
        {viewMode === 'review' && rangeResult && (
          <div className="space-y-5">
            {/* Header: تَسْمِيع مُكْتَمِل */}
            <div className="text-center space-y-1">
              <div dir="rtl" className="font-arabic text-3xl sm:text-4xl font-bold text-[#DFBA7F]">
                تَسْمِيع مُكْتَمِل
              </div>
              <div className="text-sm sm:text-base font-serif-heading font-bold text-stone-200">
                {isArabic
                  ? `سورة ${rangeResult.surahName} · الآيات ${rangeResult.fromAyah}–${rangeResult.toAyah}`
                  : `Surah ${rangeResult.surahEnglishName} (${rangeResult.surahName}) · Ayah ${rangeResult.fromAyah}–${rangeResult.toAyah}`}
              </div>
              <div className="text-xs text-stone-400">
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {rangeResult.completedAyahsCount} / {rangeResult.totalRangeAyahs}
                </span>{' '}
                {isArabic
                  ? `آيات مكتملة • المدة: ${Math.floor(rangeResult.durationSeconds / 60)} د ${rangeResult.durationSeconds % 60} ث`
                  : `Ayahs completed • Duration: ${Math.floor(rangeResult.durationSeconds / 60)}m ${rangeResult.durationSeconds % 60}s`}
              </div>
            </div>

            {/* Legend & Filter Bar: 🟢 Correct, 🟡 Possible issue, 🔴 Missing/incorrect */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  filterStatus === 'all'
                    ? 'bg-[#C9A063]/25 text-[#DFBA7F] border-[#C9A063]'
                    : 'bg-stone-900/50 text-stone-400 border-white/10'
                }`}
              >
                {isArabic ? 'الكل' : 'All'} ({rangeResult.ayahReviews.length})
              </button>

              <button
                onClick={() => setFilterStatus('correct')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'correct'
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500'
                    : 'bg-stone-900/50 text-stone-400 border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{isArabic ? 'متقنة' : 'Correct'} ({rangeResult.ayahReviews.filter((r) => r.status === 'correct').length})</span>
              </button>

              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'warning'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500'
                    : 'bg-stone-900/50 text-stone-400 border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{isArabic ? 'تنبيه' : 'Possible issue'} ({rangeResult.ayahReviews.filter((r) => r.status === 'warning').length})</span>
              </button>

              <button
                onClick={() => setFilterStatus('missing')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  filterStatus === 'missing'
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500'
                    : 'bg-stone-900/50 text-stone-400 border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{isArabic ? 'مفقودة / غير مطابقة' : 'Missing/incorrect'} ({rangeResult.ayahReviews.filter((r) => r.status === 'missing').length})</span>
              </button>
            </div>

            {/* Underneath: "Your recitation" Ayah Badges List */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#12161D]/80 border-[#C9A063]/25' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold text-stone-300">{isArabic ? 'تفصيل نتيجة التسميع:' : 'Your Recitation Breakdown:'}</span>
                <span className="text-[10px]">{isArabic ? 'انقر على الآية للمعاينة' : 'Tap an ayah to inspect'}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {rangeResult.ayahReviews.map((rev) => {
                  const isSelected = selectedReviewAyahNumber === rev.ayahNumber;
                  const isCorrect = rev.status === 'correct';
                  const isWarning = rev.status === 'warning';

                  return (
                    <button
                      key={rev.ayahNumber}
                      onClick={() => handleJumpToReviewAyah(rev.ayahNumber)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? 'ring-2 ring-[#DFBA7F] scale-105'
                          : ''
                      } ${
                        isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                          : isWarning
                          ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                      }`}
                    >
                      <span>{isArabic ? `الآية ${rev.ayahNumber}` : `Ayah ${rev.ayahNumber}`}</span>
                      {isCorrect ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qur’an passage with subtle markings */}
            <div
              ref={passageContainerRef}
              className="space-y-3 max-h-[340px] overflow-y-auto pr-1"
            >
              {rangeResult.ayahReviews
                .filter((rev) => filterStatus === 'all' || rev.status === filterStatus)
                .map((rev) => {
                  const isSelected = selectedReviewAyahNumber === rev.ayahNumber;
                  const isCorrect = rev.status === 'correct';
                  const isWarning = rev.status === 'warning';

                  return (
                    <div
                      key={rev.ayahNumber}
                      id={`review-ayah-${rev.ayahNumber}`}
                      onClick={() => setSelectedReviewAyahNumber(rev.ayahNumber)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-[#141A22] border-[#DFBA7F] shadow-[0_0_20px_rgba(201,160,99,0.25)]'
                            : 'bg-amber-50/90 border-[#DFBA7F] shadow-sm'
                          : isDark
                          ? 'bg-[#10141B]/70 border-white/10 hover:border-[#C9A063]/30'
                          : 'bg-white border-stone-200 hover:border-[#C9A063]/30'
                      } ${
                        isCorrect
                          ? 'border-l-4 border-l-emerald-500'
                          : isWarning
                          ? 'border-l-4 border-l-amber-500'
                          : 'border-l-4 border-l-rose-500'
                      }`}
                    >
                      {/* Card Header: Ayah number + Status pill */}
                      <div className="flex items-center justify-between pb-2 border-b border-[#C9A063]/15 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#DFBA7F]">
                            {isArabic ? `الآية ${rev.ayahNumber}` : `Ayah ${rev.ayahNumber}`}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {isCorrect
                              ? (isArabic ? '🟢 متقنة' : '🟢 Correct')
                              : isWarning
                              ? (isArabic ? '🟡 تنبيه' : '🟡 Possible issue')
                              : (isArabic ? '🔴 مفقودة / غير مطابقة' : '🔴 Missing/incorrect')}
                          </span>
                        </div>

                        <span className="text-[11px] text-stone-400 font-arabic">
                          {selectedSurah.name} : {rev.ayahNumber}
                        </span>
                      </div>

                      {/* Arabic Verse Text with subtle word status highlighting */}
                      <div
                        dir="rtl"
                        className="font-arabic text-xl sm:text-2xl leading-[2.3] text-[#DFBA7F] font-normal"
                      >
                        {rev.words.map((w, wIdx) => {
                          const isWordCorrect = w.status === 'correct';
                          const isWordSkipped = w.status === 'skipped';
                          const isWordRepeated = w.status === 'repeated';
                          const isWordWrong = w.status === 'wrong';

                          return (
                            <span
                              key={wIdx}
                              className={`inline-block mx-1 px-1 rounded-lg transition-colors ${
                                isWordCorrect
                                  ? 'hover:bg-emerald-500/10'
                                  : isWordSkipped
                                  ? 'text-rose-400 bg-rose-500/10 underline decoration-rose-500/60'
                                  : isWordRepeated
                                  ? 'text-amber-400 bg-amber-500/15'
                                  : isWordWrong
                                  ? 'text-amber-300 bg-amber-500/20'
                                  : ''
                              }`}
                              title={w.explanation || w.canonicalWord}
                            >
                              {w.canonicalWord}
                            </span>
                          );
                        })}
                        <span className="font-sans text-xs px-2 py-0.5 rounded-full border border-[#C9A063]/30 text-[#DFBA7F] mr-1.5 inline-block">
                          ۝{rev.ayahNumber}
                        </span>
                      </div>

                      {/* Detected Spoken Transcript & Issues list */}
                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1 text-xs">
                        {rev.spokenTextSnippet ? (
                          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                            <span className="text-[#DFBA7F] shrink-0 font-semibold">{isArabic ? 'المقروء:' : 'Recited:'}</span>
                            <span dir="rtl" className="font-arabic text-stone-300 truncate">
                              "{rev.spokenTextSnippet}"
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-400 italic">
                            {isArabic ? 'لم يُرصد صوت تلاوة لهذه الآية الكريمة.' : 'No recitation detected for this verse.'}
                          </div>
                        )}

                        {rev.summaryNotes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {rev.summaryNotes.map((note, nIdx) => (
                              <span
                                key={nIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-300'
                                    : isWarning
                                    ? 'bg-amber-500/10 text-amber-300'
                                    : 'bg-rose-500/10 text-rose-300'
                                }`}
                              >
                                • {note}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Tajweed Honest Transparency Note (Requirement 4) */}
            <div className="p-3 rounded-2xl bg-[#C9A063]/10 border border-[#C9A063]/25 text-[11px] text-stone-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#DFBA7F] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#DFBA7F]">{isArabic ? 'تنويه إتقان التجويد:' : 'Tajweed Transparency Note:'}</span>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {isArabic
                    ? 'يقوم نظام التسميع بالتحقق الدقيق من توالي الكلمات والآيات المباركة وفق النص القرآني المعتمد. أما مخارج الحروف وأحكام المدود والغُنن فمستحب عرضها على شيخٍ متقن.'
                    : 'Tasme3 2.0 performs genuine word and ayah sequence alignment against authoritative Qur’anic Arabic text. Vocalized Tajweed articulation (madd lengths, ghunnah, qalqalah) requires human Shaykh verification.'}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
              {onJumpToVerseInReader && (
                <button
                  onClick={() => {
                    onJumpToVerseInReader(selectedSurah, rangeResult.fromAyah);
                    handleClose();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'قراءة في المصحف' : 'Read in Quran Reader'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setViewMode('active');
                  handleStartSession();
                }}
                className="px-4 py-2.5 rounded-2xl border border-[#C9A063]/40 text-[#DFBA7F] hover:bg-[#C9A063]/15 font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إعادة التسميع' : 'Recite Again'}</span>
              </button>

              <button
                onClick={() => {
                  setViewMode('setup');
                }}
                className="px-4 py-2.5 rounded-2xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs active:scale-95 transition-all"
              >
                {isArabic ? 'تغيير النطاق' : 'Change Range'}
              </button>

              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-2xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs active:scale-95 transition-all"
              >
                {isArabic ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
