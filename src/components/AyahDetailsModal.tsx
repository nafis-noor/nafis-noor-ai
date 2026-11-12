import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Sparkles,
  BookOpen,
  Bookmark,
  Copy,
  Check,
  ChevronLeft,
  Volume2,
  Share2,
  Loader2,
  Send,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Compass,
  FileText,
  Languages
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import { MadaniAyahOrnament, toEasternArabicNumerals } from './MadaniAyahOrnament';
import { Ayah, Surah } from '../types';

interface AyahDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
  surah: Surah;
  ayah: Ayah;
  onToggleBookmark?: (ayahNum: number) => void;
  isBookmarked?: boolean;
}

export const AyahDetailsModal: React.FC<AyahDetailsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
  surah,
  ayah,
  onToggleBookmark,
  isBookmarked = false,
}) => {
  // Modal view modes: 'details' (standard Ayah view) or 'noor-ai' (Ask Noor AI inside same popup)
  const [viewMode, setViewMode] = useState<'details' | 'noor-ai'>('details');

  // Audio recitation state for Sheikh Yasser Al-Dossari
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tafsir state
  const [tafsirText, setTafsirText] = useState<string>('');
  const [transliterationText, setTransliterationText] = useState<string>('');
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ask Noor AI state
  const [userQuery, setUserQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiKeyTakeaway, setAiKeyTakeaway] = useState<string | null>(null);

  // EveryAyah URL for Sheikh Yasser Al-Dossari
  const formattedSurah = String(surah.number).padStart(3, '0');
  const formattedAyah = String(ayah.numberInSurah).padStart(3, '0');
  const dossariAudioUrl = `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${formattedSurah}${formattedAyah}.mp3`;

  // Fetch verified Tafsir Al-Muyassar and Transliteration when Ayah changes
  useEffect(() => {
    if (!isOpen) return;

    setViewMode('details');
    setAiResponse(null);
    setAiKeyTakeaway(null);
    setUserQuery('');
    setIsPlayingAudio(false);
    setAudioProgress(0);

    let isMounted = true;
    setIsLoadingTafsir(true);

    fetch(`/api/quran/ayah/${surah.number}/${ayah.numberInSurah}/details`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.data) {
          setTafsirText(data.data.tafsir || '');
          setTransliterationText(data.data.transliteration || '');
        } else {
          // Fallback direct fetch to Tafsir Al-Muyassar
          fetch(`https://api.alquran.cloud/v1/ayah/${surah.number}:${ayah.numberInSurah}/ar.muyassar`)
            .then((r) => r.json())
            .then((j) => {
              if (isMounted && j?.data?.text) {
                setTafsirText(j.data.text);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingTafsir(false);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTafsir(false);
      });

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen, surah.number, ayah.numberInSurah]);

  // Audio controller
  const togglePlayAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(dossariAudioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime);
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setIsAudioLoading(false);
      };

      audio.onwaiting = () => setIsAudioLoading(true);
      audio.onplaying = () => {
        setIsAudioLoading(false);
        setIsPlayingAudio(true);
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      setIsAudioLoading(true);
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
      }).catch(() => {
        setIsAudioLoading(false);
        setIsPlayingAudio(false);
      });
    }
  };

  const handleCopy = () => {
    const text = `${ayah.text}\n\n${ayah.translation}\n[سورة ${surah.name} ${surah.number}:${ayah.numberInSurah}]`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `${ayah.text}\n\n${ayah.translation}\n— سورة ${surah.name} (${surah.englishName}) [${surah.number}:${ayah.numberInSurah}]`;
    if (navigator.share) {
      navigator.share({ title: `Surah ${surah.englishName} : ${ayah.numberInSurah}`, text });
    } else {
      handleCopy();
    }
  };

  // Ask Noor AI inside the popup
  const handleAskNoorAI = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAiLoading) return;

    setIsAiLoading(true);
    setUserQuery(q);

    try {
      const res = await fetch('/api/quran/ask-noor-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahNumber: surah.number,
          ayahNumber: ayah.numberInSurah,
          surahName: surah.name,
          ayahText: ayah.text,
          ayahTranslation: ayah.translation,
          question: q,
          language: isArabic ? 'ar' : 'en',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAiResponse(json.data.directAnswer);
          setAiKeyTakeaway(json.data.keyTakeaway || null);
        }
      } else {
        setAiResponse(
          isArabic
            ? 'تدل هذه الآية الكريمة على عظمة الله وحكمته البالغة، وتدعو المسلم إلى التدبر والعمل بما فيها من هدى ونور.'
            : "This noble verse highlights Allah's boundless wisdom and mercy, inspiring reflection, gratitude, and righteous conduct."
        );
      }
    } catch {
      setAiResponse(
        isArabic
          ? 'تدل هذه الآية الكريمة على عظمة الله وحكمته البالغة، وتدعو المسلم إلى التدبر والعمل بما فيها من هدى ونور.'
          : "This noble verse highlights Allah's boundless wisdom and mercy, inspiring reflection, gratitude, and righteous conduct."
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden ${
            isDark
              ? 'bg-[#0A0D13]/98 border-[#DFBA7F]/35 text-stone-100'
              : 'bg-white/98 border-[#C9A063]/40 text-stone-900 shadow-2xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Golden Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-60" />

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#C9A063]/20 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              {viewMode === 'noor-ai' && (
                <button
                  type="button"
                  onClick={() => setViewMode('details')}
                  className="p-1.5 rounded-xl border border-[#C9A063]/30 text-[#DFBA7F] hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{isArabic ? 'الآية' : 'Ayah'}</span>
                </button>
              )}

              <MadaniAyahOrnament
                ayahNumber={ayah.numberInSurah}
                surahNumber={surah.number}
                isPlaying={isPlayingAudio}
                isDark={isDark}
                size="md"
                onClick={() => togglePlayAudio()}
                title={isArabic ? 'اضغط للاستماع للآية' : 'Tap to play verse'}
              />

              <div>
                <h3 className="text-xs sm:text-sm font-serif-heading font-bold text-[#DFBA7F]">
                  {isArabic
                    ? `سورة ${surah.name} — آية ${ayah.numberInSurah}`
                    : `Surah ${surah.englishName} — Ayah ${ayah.numberInSurah}`}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-stone-400">
                  <span>{isArabic ? `الجزء ${ayah.juz || surah.juzNumber}` : `Juz ${ayah.juz || surah.juzNumber}`}</span>
                  <span>•</span>
                  <span>{isArabic ? `الصفحة ${ayah.page || surah.pageNumber}` : `Page ${ayah.page || surah.pageNumber}`}</span>
                  <span>•</span>
                  <span>{isArabic ? (surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية') : surah.revelationType}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons & Close */}
            <div className="flex items-center gap-1 shrink-0">
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(ayah.numberInSurah)}
                  className={`p-2 rounded-xl border transition-all active:scale-90 ${
                    isBookmarked
                      ? 'bg-[#C9A063]/25 text-[#DFBA7F] border-[#C9A063]/40'
                      : 'border-transparent text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Bookmark'}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#DFBA7F]' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                title="Copy Ayah"
              >
                {copied ? <Check className="w-4 h-4 text-[#DFBA7F]" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer ml-1"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto pr-1 space-y-4 no-scrollbar flex-1 pb-2">
            {/* Authentic Arabic Ayah Calligraphy Box */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden ${
                isDark ? 'bg-black/40 border-[#DFBA7F]/25' : 'bg-[#FAF9F5] border-[#C9A063]/30'
              }`}
            >
              <div
                dir="rtl"
                className={`font-arabic text-right leading-[2.4] sm:leading-[2.6] text-xl sm:text-2xl select-text ${
                  isDark ? 'text-white' : 'text-stone-950 font-bold'
                }`}
              >
                {ayah.text}{' '}
                <MadaniAyahOrnament
                  ayahNumber={ayah.numberInSurah}
                  surahNumber={surah.number}
                  isPlaying={isPlayingAudio}
                  isDark={isDark}
                  onClick={() => togglePlayAudio()}
                  title={isArabic ? 'اضغط على رقم الآية للاستماع' : 'Tap verse number to play'}
                />
              </div>
            </div>

            {/* VIEW MODE 1: DETAILS & AUDIO RECITATION */}
            {viewMode === 'details' && (
              <>
                {/* Audio Recitation Player with Sheikh Yasser Al-Dossari */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold shadow-sm shrink-0">
                        {isPlayingAudio ? (
                          <Volume2 className="w-4.5 h-4.5 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#DFBA7F] truncate">
                            {isArabic ? 'الشيخ ياسر الدوسري' : 'Sheikh Yasser Al-Dossari'}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 font-semibold shrink-0">
                            {isArabic ? 'تلاوة مرئية' : 'Murattal'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {isArabic ? 'تسجيل رسمي موثق للآية الكريمة' : 'Official high-fidelity recitation'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      disabled={isAudioLoading}
                      className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] flex items-center justify-center shadow-md active:scale-90 hover:brightness-110 transition-all cursor-pointer shrink-0"
                      title={isPlayingAudio ? 'Pause' : 'Play'}
                    >
                      {isAudioLoading ? (
                        <div className="w-5 h-1.5 rounded-full bg-[#090B0E]/60 animate-pulse" />
                      ) : isPlayingAudio ? (
                        <Pause className="w-4.5 h-4.5 fill-[#090B0E]" />
                      ) : (
                        <Play className="w-4.5 h-4.5 fill-[#090B0E] ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-stone-700/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] transition-all duration-200"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>{formatSeconds(currentTime)}</span>
                      <span>{audioDuration ? formatSeconds(audioDuration) : '--:--'}</span>
                    </div>
                  </div>
                </div>

                {/* Verified Translation */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#DFBA7F]">
                    <Languages className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'ترجمة معاني الآية' : 'Verified Translation'}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-stone-200">
                    {ayah.translation}
                  </p>
                </div>

                {/* Phonetic Transliteration (if available) */}
                {transliterationText && (
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[#DFBA7F]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'اللفظ الصوتي (Transliteration)' : 'Phonetic Transliteration'}</span>
                    </div>
                    <p className="text-xs font-serif italic text-stone-300 tracking-wide">
                      {transliterationText}
                    </p>
                  </div>
                )}

                {/* Concise Tafsir Al-Muyassar (مختصر التفسير الميسر) */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#DFBA7F]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'التفسير الميسر المعتمد' : 'Concise Classical Tafsir'}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C9A063]/15 text-[#DFBA7F] font-mono">
                      {isArabic ? 'مجمع الملك فهد' : 'King Fahd Complex'}
                    </span>
                  </div>

                  {isLoadingTafsir ? (
                    <div className="space-y-2 py-1 animate-pulse">
                      <div className="h-3.5 w-full rounded-md bg-[#C9A063]/20" />
                      <div className="h-3.5 w-5/6 rounded-md bg-[#C9A063]/15" />
                      <div className="h-3.5 w-2/3 rounded-md bg-[#C9A063]/10" />
                    </div>
                  ) : tafsirText ? (
                    <p
                      dir={isArabic ? 'rtl' : 'ltr'}
                      className="text-xs sm:text-sm leading-relaxed text-stone-300"
                    >
                      {tafsirText}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400">
                      {isArabic
                        ? 'تفسير معاني هذه الآية الكريمة يوضح سياق الهدى والرحمة الربانية للمؤمنين.'
                        : 'Classical commentary underscores divine guidance, solace, and spiritual wisdom.'}
                    </p>
                  )}
                </div>

                {/* Prominent "Ask Noor AI" Button */}
                <button
                  type="button"
                  id="btn-ask-noor-ai-ayah"
                  onClick={() => setViewMode('noor-ai')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#090B0E] text-[#DFBA7F] flex items-center justify-center shrink-0">
                      <NoorAIIcon className="w-4 h-4 text-[#DFBA7F]" />
                    </div>
                    <div className="text-left rtl:text-right">
                      <div className="font-serif-heading font-bold text-xs sm:text-sm">
                        {isArabic ? 'اسأل نور الإسلامي عن هذه الآية' : 'Ask Noor AI About This Verse'}
                      </div>
                      <div className="text-[10px] text-[#090B0E]/80 font-medium">
                        {isArabic
                          ? 'تدبر قرآني، أسباب النزول، ولطائف بلاغية موثوقة'
                          : 'Tafsir context, spiritual reflections & linguistic insights'}
                      </div>
                    </div>
                  </div>

                  <Sparkles className="w-4 h-4 text-[#090B0E] group-hover:rotate-12 transition-transform" />
                </button>
              </>
            )}

            {/* VIEW MODE 2: ASK NOOR AI (DIRECTLY INSIDE POPUP) */}
            {viewMode === 'noor-ai' && (
              <div className="space-y-4">
                {/* Noor AI Mode Banner */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30">
                  <div className="flex items-center gap-2">
                    <NoorAIIcon className="w-4 h-4 text-[#DFBA7F]" />
                    <span className="text-xs font-bold text-[#DFBA7F]">
                      {isArabic ? 'مساعد نور لتدبر الآيات' : 'Noor AI Quranic Reflection'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {isArabic ? 'استناد حصري للتفاسير المعتمدة' : 'Grounded in classical sources'}
                  </span>
                </div>

                {/* Quick Question Chips */}
                <div>
                  <div className="text-[11px] text-stone-400 mb-2 px-1">
                    {isArabic ? 'اختر سؤالاً سريعاً أو اكتب استفسارك:' : 'Select a reflection topic or type your question:'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: isArabic ? 'تفسير الآية وسياقها' : 'Tafsir & Meaning',
                        prompt: isArabic
                          ? `ما هو المعنى الإجمالي والتفسير المعتمد لهذه الآية؟`
                          : `What is the comprehensive meaning and classical interpretation of this verse?`,
                        icon: BookOpen,
                      },
                      {
                        label: isArabic ? 'الدروس والفوائد العملية' : 'Key Lessons',
                        prompt: isArabic
                          ? `ما هي أهم الدروس الإيمانية والعملية التي يستفيدها المسلم من هذه الآية؟`
                          : `What are the key spiritual lessons and practical reflections from this verse?`,
                        icon: Lightbulb,
                      },
                      {
                        label: isArabic ? 'سبب النزول إن وجد' : 'Reason of Revelation',
                        prompt: isArabic
                          ? `هل ورد سبب نزول صحيح في شأن هذه الآية الكريمة؟`
                          : `Is there an authentic Asbab al-Nuzul (reason of revelation) recorded for this verse?`,
                        icon: Compass,
                      },
                      {
                        label: isArabic ? 'اللطائف والوجوه البلاغية' : 'Linguistic Nuances',
                        prompt: isArabic
                          ? `ما هي اللطائف البلاغية والبيانية في ألفاظ هذه الآية الكريمة؟`
                          : `What are the linguistic and rhetorical nuances in the Arabic phrasing of this verse?`,
                        icon: HelpCircle,
                      },
                    ].map((chip, idx) => {
                      const Icon = chip.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskNoorAI(chip.prompt)}
                          disabled={isAiLoading}
                          className="p-2.5 rounded-xl border border-white/10 hover:border-[#DFBA7F]/40 hover:bg-[#C9A063]/10 text-left rtl:text-right transition-all active:scale-95 text-xs flex items-center gap-2 cursor-pointer group"
                        >
                          <Icon className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-medium text-stone-300 group-hover:text-[#DFBA7F] truncate">
                            {chip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskNoorAI(userQuery);
                    }}
                    placeholder={
                      isArabic
                        ? 'اكتب سؤالك عن هذه الآية...'
                        : 'Ask any question about this verse...'
                    }
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border transition-all focus:outline-none focus:ring-1 focus:ring-[#C9A063] ${
                      isDark
                        ? 'bg-stone-900 border-[#C9A063]/30 text-stone-100 placeholder-stone-500'
                        : 'bg-stone-100 border-stone-200 text-stone-900 placeholder-stone-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAskNoorAI(userQuery)}
                    disabled={!userQuery.trim() || isAiLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] disabled:opacity-40 active:scale-90 transition-all cursor-pointer shrink-0"
                  >
                    {isAiLoading ? (
                      <div className="w-4 h-4 rounded-md bg-[#090B0E]/40 animate-pulse" />
                    ) : (
                      <Send className="w-4 h-4 rtl:rotate-180" />
                    )}
                  </button>
                </div>

                {/* AI Response Skeleton Loader */}
                {isAiLoading && (
                  <div className="p-4 rounded-2xl border border-[#C9A063]/30 bg-[#C9A063]/10 space-y-2.5 animate-pulse">
                    <div className="h-3.5 w-1/3 rounded-md bg-[#DFBA7F]/30" />
                    <div className="h-3 w-full rounded-md bg-[#DFBA7F]/20" />
                    <div className="h-3 w-5/6 rounded-md bg-[#DFBA7F]/15" />
                    <div className="h-3 w-3/4 rounded-md bg-[#DFBA7F]/15" />
                  </div>
                )}

                {aiResponse && (
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-black/40 border-[#DFBA7F]/30' : 'bg-amber-50/70 border-[#C9A063]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#C9A063]/20">
                      <NoorAIIcon className="w-4 h-4 text-[#DFBA7F]" />
                      <span className="text-xs font-bold text-[#DFBA7F]">
                        {isArabic ? 'بيان نور الإسلامي' : 'Noor AI Explanation'}
                      </span>
                    </div>

                    <p
                      dir={isArabic ? 'rtl' : 'ltr'}
                      className="text-xs sm:text-sm leading-relaxed text-stone-200"
                    >
                      {aiResponse}
                    </p>

                    {aiKeyTakeaway && (
                      <div className="mt-3 pt-2.5 border-t border-[#C9A063]/20 flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#DFBA7F] font-medium leading-relaxed">
                          {aiKeyTakeaway}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
