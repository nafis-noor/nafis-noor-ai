import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bookmark,
  Share2,
  Check,
  CheckCircle2,
  RotateCcw,
  Volume2,
  VolumeX,
  Search,
  BookOpen,
  Filter,
  Flame,
  ArrowRight,
  Heart,
  ChevronDown,
  Play,
  Pause,
  Repeat,
  Info,
  Layers,
  Copy,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Dua, DhikrDuaCategory, UserStats } from '../types';
import { DUAS_LIST, DHIKR_CATEGORIES } from '../data/duasData';
import { recordUserActivity } from '../utils/streakManager';
import { getLanguageCode, t } from '../utils/i18n';
import { DhikrCardSkeletonList } from './SkeletonLoaders';

interface DhikrDuaSectionProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
  isStandalonePage?: boolean;
}

export const DhikrDuaSection: React.FC<DhikrDuaSectionProps> = ({
  isDark,
  userStats,
  onUpdateStats,
  onOpenNoorAIWithPrompt,
  isStandalonePage = false,
}) => {
  const lang = getLanguageCode(userStats.language);
  const isArabic = lang === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<DhikrDuaCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(24);
    setIsSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setIsSearching(false);
    }, 250);
  };

  const [filterMode, setFilterMode] = useState<'all' | 'saved' | 'completed' | 'pending'>('all');
  const [showTransliteration, setShowTransliteration] = useState(!isArabic);
  const [arabicFontSize, setArabicFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [visibleCount, setVisibleCount] = useState(24);

  // Audio Player State
  const [activeAudioDuaId, setActiveAudioDuaId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioRepeatCount, setAudioRepeatCount] = useState<1 | 3 | 999>(1);
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playCountRef = useRef(0);

  // Per-dua progress counters (e.g. 0/3, 1/3, etc.)
  const [dhikrProgress, setDhikrProgress] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('noor_dhikr_progress');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Completed IDs set
  const completedIds = useMemo(() => {
    return new Set(userStats.completedDhikrIds || []);
  }, [userStats.completedDhikrIds]);

  // Persist dhikrProgress to localStorage
  const updateProgress = useCallback((duaId: string, newCount: number) => {
    setDhikrProgress((prev) => {
      const updated = { ...prev, [duaId]: newCount };
      try {
        localStorage.setItem('noor_dhikr_progress', JSON.stringify(updated));
      } catch {
        // localStorage optional
      }
      return updated;
    });
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Subtle tactile chime on tap
  const playTactileChime = useCallback((isCompletion = false) => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';

        if (isCompletion) {
          // Major chord celebratory chime (G5 -> C6)
          osc.frequency.setValueAtTime(783.99, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.18);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } else {
          // Subtle click chime
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // A5
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.13);
        }
      }
    } catch {
      // Audio optional
    }
  }, []);

  // Play / Pause authentic audio recitation
  const handleToggleAudio = useCallback((dua: Dua) => {
    // If currently playing this dua, pause it
    if (activeAudioDuaId === dua.id && isAudioPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
      return;
    }

    // If resuming current audio
    if (activeAudioDuaId === dua.id && audioRef.current && !isAudioPlaying) {
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch(() => {
        // Fallback to speech synthesis
        playSpeechFallback(dua.arabic);
      });
      return;
    }

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!dua.audio) {
      // Fallback to Web Speech API
      playSpeechFallback(dua.arabic);
      return;
    }

    setAudioLoading(true);
    setActiveAudioDuaId(dua.id);
    playCountRef.current = 0;

    const audio = new Audio(dua.audio);
    audioRef.current = audio;

    audio.oncanplay = () => {
      setAudioLoading(false);
    };

    audio.onplay = () => {
      setIsAudioPlaying(true);
      setAudioLoading(false);
    };

    audio.onended = () => {
      playCountRef.current += 1;
      const targetRepeats = audioRepeatCount === 999 ? Infinity : audioRepeatCount;
      if (playCountRef.current < targetRepeats) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          setIsAudioPlaying(false);
          setActiveAudioDuaId(null);
        });
      } else {
        setIsAudioPlaying(false);
        setActiveAudioDuaId(null);
      }
    };

    audio.onerror = () => {
      setAudioLoading(false);
      setIsAudioPlaying(false);
      // Try fallback to SpeechSynthesis
      playSpeechFallback(dua.arabic);
    };

    audio.play().catch(() => {
      setAudioLoading(false);
      setIsAudioPlaying(false);
      playSpeechFallback(dua.arabic);
    });
  }, [activeAudioDuaId, isAudioPlaying, audioRepeatCount]);

  const playSpeechFallback = (arabicText: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(arabicText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle or increment completion
  const handleTapDhikr = (dua: Dua) => {
    const target = dua.repetitions || 1;
    const current = dhikrProgress[dua.id] || 0;
    const isCompleted = completedIds.has(dua.id);

    if (isCompleted) {
      // If already completed, reset it
      playTactileChime(false);
      updateProgress(dua.id, 0);
      const updatedCompleted = (userStats.completedDhikrIds || []).filter((id) => id !== dua.id);
      onUpdateStats({ completedDhikrIds: updatedCompleted });
      return;
    }

    const next = current + 1;
    if (next >= target) {
      // Completed!
      playTactileChime(true);
      updateProgress(dua.id, target);
      const updatedCompleted = [...(userStats.completedDhikrIds || []), dua.id];
      const streakUpdates = recordUserActivity(userStats, 'dhikr');
      onUpdateStats({
        completedDhikrIds: updatedCompleted,
        dhikrCount: (userStats.dhikrCount || 0) + 1,
        ...streakUpdates,
      });
    } else {
      playTactileChime(false);
      updateProgress(dua.id, next);
      const streakUpdates = recordUserActivity(userStats, 'dhikr');
      onUpdateStats({
        dhikrCount: (userStats.dhikrCount || 0) + 1,
        ...streakUpdates,
      });
    }
  };

  const handleResetDhikr = (e: React.MouseEvent, duaId: string) => {
    e.stopPropagation();
    updateProgress(duaId, 0);
    const updatedCompleted = (userStats.completedDhikrIds || []).filter((id) => id !== duaId);
    onUpdateStats({ completedDhikrIds: updatedCompleted });
  };

  const handleToggleSave = (e: React.MouseEvent, duaId: string) => {
    e.stopPropagation();
    const saved = userStats.savedDuas || [];
    const isSaved = saved.includes(duaId);
    const updated = isSaved ? saved.filter((id) => id !== duaId) : [...saved, duaId];
    onUpdateStats({ savedDuas: updated });
  };

  const handleCopy = (e: React.MouseEvent, dua: Dua) => {
    e.stopPropagation();
    const content = `${dua.title} (${dua.titleAr || ''})\n\n${dua.arabic}\n\n${dua.transliteration || ''}\n\n"${dua.translation}"\n\n— Source: ${dua.source}\n(Hisn al-Muslim • Preserved in Nafis Noor)`;
    navigator.clipboard.writeText(content);
    setCopiedDuaId(dua.id);
    setTimeout(() => setCopiedDuaId(null), 2000);
  };

  // Filtered duas
  const filteredDuas = useMemo(() => {
    return DUAS_LIST.filter((dua) => {
      // Category match
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Daily Dhikr') {
          if (dua.category !== 'Daily Dhikr' && dua.category !== 'Daily Duas') {
            return false;
          }
        } else if (dua.category !== selectedCategory) {
          return false;
        }
      }

      // Filter Mode
      const isSaved = (userStats.savedDuas || []).includes(dua.id);
      const isCompleted = completedIds.has(dua.id);

      if (filterMode === 'saved' && !isSaved) return false;
      if (filterMode === 'completed' && !isCompleted) return false;
      if (filterMode === 'pending' && isCompleted) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = dua.title.toLowerCase().includes(q);
        const matchesTitleAr = dua.titleAr?.toLowerCase().includes(q);
        const matchesArabic = dua.arabic.includes(q);
        const matchesTrans = dua.translation.toLowerCase().includes(q);
        const matchesTranslit = dua.transliteration?.toLowerCase().includes(q);
        const matchesSource = dua.source.toLowerCase().includes(q);
        const matchesChapter = dua.chapterTitle?.toLowerCase().includes(q);

        return (
          matchesTitle ||
          matchesTitleAr ||
          matchesArabic ||
          matchesTrans ||
          matchesTranslit ||
          matchesSource ||
          matchesChapter
        );
      }

      return true;
    });
  }, [selectedCategory, filterMode, searchQuery, userStats.savedDuas, completedIds]);

  // Current category stats
  const categoryDuas = useMemo(() => {
    if (selectedCategory === 'All') return DUAS_LIST;
    if (selectedCategory === 'Daily Dhikr') {
      return DUAS_LIST.filter((d) => d.category === 'Daily Dhikr' || d.category === 'Daily Duas');
    }
    return DUAS_LIST.filter((d) => d.category === selectedCategory);
  }, [selectedCategory]);

  const categoryCompletedCount = useMemo(() => {
    return categoryDuas.filter((d) => completedIds.has(d.id)).length;
  }, [categoryDuas, completedIds]);

  const categoryCompletionPercent = useMemo(() => {
    if (categoryDuas.length === 0) return 0;
    return Math.round((categoryCompletedCount / categoryDuas.length) * 100);
  }, [categoryCompletedCount, categoryDuas]);

  // Reset category progress
  const handleResetCategory = () => {
    const categoryIds = new Set(categoryDuas.map((d) => d.id));
    const updatedCompleted = (userStats.completedDhikrIds || []).filter((id) => !categoryIds.has(id));
    onUpdateStats({ completedDhikrIds: updatedCompleted });

    setDhikrProgress((prev) => {
      const updated = { ...prev };
      categoryIds.forEach((id) => {
        delete updated[id];
      });
      try {
        localStorage.setItem('noor_dhikr_progress', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Mark category as all completed
  const handleMarkCategoryAllComplete = () => {
    playTactileChime(true);
    const categoryIds = categoryDuas.map((d) => d.id);
    const setCompleted = new Set([...(userStats.completedDhikrIds || []), ...categoryIds]);
    const streakUpdates = recordUserActivity(userStats, 'dhikr');

    onUpdateStats({
      completedDhikrIds: Array.from(setCompleted),
      dhikrCount: (userStats.dhikrCount || 0) + categoryDuas.length,
      ...streakUpdates,
    });

    setDhikrProgress((prev) => {
      const updated = { ...prev };
      categoryDuas.forEach((d) => {
        updated[d.id] = d.repetitions || 1;
      });
      try {
        localStorage.setItem('noor_dhikr_progress', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const paginatedDuas = useMemo(() => {
    return filteredDuas.slice(0, visibleCount);
  }, [filteredDuas, visibleCount]);

  return (
    <section
      id="dhikr-dua-section"
      className={`w-full transition-all duration-200 ${
        isStandalonePage ? 'pt-2 pb-32 sm:pb-36 lg:pb-16 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto' : 'mt-12 mb-16'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER & VERIFIED SOURCE BANNER                                        */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A063]" />
                <span>{isArabic ? 'حصن المسلم من أذكار الكتاب والسنة' : 'Hisn al-Muslim (حصن المسلم)'}</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isArabic ? '288 ذكراً ودعاءً صحيحاً' : '288 Authentic Adhkar'}
              </span>
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-serif-heading font-bold tracking-tight ${
                isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
              }`}
            >
              {isArabic ? 'واحة الأذكار والأدعية النبوية' : "Dhikr & Du'a Sanctuary"}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {isArabic ? (
                <>
                  أذكار وأدعية مأثورة وصحيحة من المرجع المعتمد في العالم الإسلامي:{' '}
                  <span className="font-medium text-[#DFBA7F]">حصن المسلم</span> لفضيلة الشيخ سعيد بن علي بن وهف القحطاني، بتخريج الأحاديث والتلاوات الصوتية المباركة.
                </>
              ) : (
                <>
                  Authentic prophetic invocations and remembrances from the standard Muslim World reference:{' '}
                  <span className="font-medium text-[#DFBA7F]">Fortress of the Muslim</span> by Sheikh Sa'id bin Ali bin Wahf Al-Qahtani, with verified Hadith citations and authentic audio recitations.
                </>
              )}
            </p>
          </div>

          {/* Quick Repeat & Audio Settings */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {!isArabic && (
              <button
                onClick={() => setShowTransliteration((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                  showTransliteration
                    ? isDark
                      ? 'bg-[#C9A063]/20 border-[#C9A063]/40 text-[#DFBA7F]'
                      : 'bg-amber-100 border-[#A67C38]/40 text-[#8E6527]'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
                title="Toggle English transliteration"
              >
                <span>Phonetics</span>
                <span className="text-[10px] font-mono opacity-80">{showTransliteration ? 'ON' : 'OFF'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setArabicFontSize((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'huge' : 'normal'));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-stone-300 hover:border-[#C9A063]/30'
                  : 'bg-white border-stone-200 text-stone-700 shadow-sm hover:border-[#A67C38]/30'
              }`}
              title={isArabic ? 'تغيير حجم الخط العربي' : 'Change Arabic font size'}
            >
              <span>{isArabic ? `حجم الخط: ${arabicFontSize === 'normal' ? 'عادي' : arabicFontSize === 'large' ? 'كبير' : 'ضخم'}` : `Font: ${arabicFontSize.toUpperCase()}`}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CATEGORY PROGRESS WIDGET                                               */}
        {/* ========================================================================= */}
        <div
          className={`mt-4 rounded-2xl p-4 border transition-all duration-200 ${
            isDark
              ? 'liquid-glass-secondary-dark border-[#C9A063]/25 shadow-md'
              : 'liquid-glass-secondary-light border-[#A67C38]/25 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  categoryCompletionPercent === 100
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#C9A063]/20 text-[#DFBA7F] border-[#C9A063]/30'
                }`}
              >
                {categoryCompletionPercent === 100 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <span className="text-xl font-bold">{DHIKR_CATEGORIES.find((c) => c.id === selectedCategory)?.icon || '📿'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                    {isArabic
                      ? (selectedCategory === 'All' ? 'ختمة أذكار حصن المسلم' : (DHIKR_CATEGORIES.find((c) => c.id === selectedCategory)?.labelAr || selectedCategory))
                      : (selectedCategory === 'All' ? 'Overall Fortress Recitation' : `${selectedCategory} Adhkar`)}
                  </h4>
                  {!isArabic && (
                    <span className="text-xs font-serif-arabic text-[#DFBA7F]">
                      {DHIKR_CATEGORIES.find((c) => c.id === selectedCategory)?.labelAr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 font-light">
                  {isArabic
                    ? `${categoryCompletedCount} من أصل ${categoryDuas.length} تم إنجازها (${categoryCompletionPercent}%)${categoryCompletionPercent === 100 ? ' • ما شاء الله، أتممت جميع أذكار هذا القسم!' : ''}`
                    : `${categoryCompletedCount} of ${categoryDuas.length} completed (${categoryCompletionPercent}%)${categoryCompletionPercent === 100 && ' • Masha’Allah, you completed this category!'}`}
                </p>
              </div>
            </div>

            {/* Actions for this category */}
            <div className="flex items-center gap-2">
              {categoryCompletedCount > 0 && (
                <button
                  onClick={handleResetCategory}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1"
                  title={isArabic ? 'إعادة ضبط عداد هذا القسم' : 'Reset counter for this category'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إعادة الضبط' : 'Reset Category'}</span>
                </button>
              )}
              {categoryCompletionPercent < 100 && (
                <button
                  onClick={handleMarkCategoryAllComplete}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  title={isArabic ? 'تحديد جميع أذكار هذا القسم كمكتملة' : 'Mark all adhkar in this category completed'}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تحديد الكل كمكتمل' : 'Mark All Done'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-black/20 dark:bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-200 rounded-full ${
                categoryCompletionPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs'
                  : 'bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#FFE2AA]'
              }`}
              style={{ width: `${categoryCompletionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY PILLS BAR                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {DHIKR_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setVisibleCount(24);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 border ${
                isSelected
                  ? isDark
                    ? 'liquid-glass-secondary-dark border-[#DFBA7F]/60 text-[#DFBA7F] shadow-xs ring-1 ring-[#DFBA7F]/40 scale-[1.02]'
                    : 'liquid-glass-secondary-light border-[#8E6527]/50 text-[#8E6527] shadow-sm ring-1 ring-[#8E6527]/30 scale-[1.02]'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:border-white/20'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 shadow-sm'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="font-semibold">{isArabic ? cat.labelAr : cat.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? isDark
                      ? 'bg-[#C9A063]/30 text-[#FFE2AA]'
                      : 'bg-[#8E6527]/15 text-[#8E6527]'
                    : isDark
                    ? 'bg-white/10 text-stone-400'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH & FILTER CONTROLS                                               */}
      {/* ========================================================================= */}
      <div className="mt-4 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث عن ذكر أو دعاء...'
                : 'Search dhikr or supplication...'
            }
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm border transition-all outline-none ${
              isDark
                ? 'bg-black/30 border-white/10 text-stone-100 placeholder-stone-400 focus:border-[#C9A063]/60 focus:bg-black/40'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#A67C38]/60 focus:bg-white shadow-sm'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'saved', 'completed', 'pending'] as const).map((mode) => {
            const isActive = filterMode === mode;
            const modeLabel = isArabic
              ? mode === 'all'
                ? 'الكل'
                : mode === 'saved'
                ? `المحفوظة (${userStats.savedDuas?.length || 0})`
                : mode === 'completed'
                ? 'المكتملة'
                : 'المتبقية'
              : mode === 'saved'
              ? `Saved (${userStats.savedDuas?.length || 0})`
              : mode;

            return (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all border ${
                  isActive
                    ? isDark
                      ? 'bg-[#C9A063]/25 border-[#C9A063]/50 text-[#DFBA7F]'
                      : 'bg-amber-100 border-[#A67C38]/40 text-[#8E6527]'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
                    : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 shadow-sm'
                }`}
              >
                {modeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Short Dhikr Quick-Search Suggestion Pills */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-stone-400 shrink-0 font-medium mr-1 rtl:mr-0 rtl:ml-1">
          {isArabic ? 'اقتراحات سريعة:' : 'Quick tags:'}
        </span>
        {(isArabic
          ? ['الصباح', 'المساء', 'الاستغفار', 'الكرسي', 'النوم', 'السفر']
          : ['Morning', 'Evening', 'Forgiveness', 'Kursi', 'Sleep', 'Travel']
        ).map((tag) => (
          <button
            key={tag}
            onClick={() => handleSearchChange(tag)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border whitespace-nowrap active:scale-95 ${
              searchQuery === tag
                ? 'bg-[#C9A063]/30 border-[#C9A063] text-[#FFE2AA]'
                : isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
                : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 5. ACTIVE PLAYING AUDIO FLOATING PILL (IF AUDIO IS RUNNING)               */}
      {/* ========================================================================= */}
      {activeAudioDuaId && (
        <div
          className={`mb-5 p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn ${
            isDark
              ? 'liquid-glass-secondary-dark border-[#DFBA7F]/40 shadow-lg text-stone-100'
              : 'liquid-glass-secondary-light border-[#A67C38]/40 shadow-md text-stone-900'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#C9A063]/20 flex items-center justify-center text-[#DFBA7F] shrink-0 border border-[#C9A063]/30">
              <Volume2 className="w-5 h-5 animate-pulse text-[#DFBA7F]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#DFBA7F] block">
                {isArabic ? 'تلاوة صوتية مباركة من حصن المسلم' : 'Authentic Hisn al-Muslim Recitation'}
              </span>
              <h5 className="text-xs font-bold truncate">
                {isArabic
                  ? (DUAS_LIST.find((d) => d.id === activeAudioDuaId)?.titleAr || DUAS_LIST.find((d) => d.id === activeAudioDuaId)?.title)
                  : DUAS_LIST.find((d) => d.id === activeAudioDuaId)?.title}
              </h5>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Repeat count button */}
            <button
              onClick={() => {
                setAudioRepeatCount((prev) => (prev === 1 ? 3 : prev === 3 ? 999 : 1));
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/10 border border-white/15 text-stone-200 flex items-center gap-1"
              title={isArabic ? 'تكرار التلاوة للحفظ والتثبيت' : 'Repeat count for memorization'}
            >
              <Repeat className="w-3 h-3" />
              <span>{audioRepeatCount === 999 ? '∞' : `${audioRepeatCount}x`}</span>
            </button>

            <button
              onClick={() => {
                const dua = DUAS_LIST.find((d) => d.id === activeAudioDuaId);
                if (dua) handleToggleAudio(dua);
              }}
              className="w-8 h-8 rounded-xl bg-[#DFBA7F] text-black flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              {isAudioPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONTINUOUS SCROLLABLE DHIKR CARDS GRID                                 */}
      {/* ========================================================================= */}
      {isSearching ? (
        <div className="py-2 animate-fadeIn">
          <DhikrCardSkeletonList count={4} isDark={isDark} isArabic={isArabic} />
        </div>
      ) : filteredDuas.length === 0 ? (
        <div
          className={`text-center py-16 px-4 rounded-3xl border ${
            isDark ? 'bg-black/20 border-white/10' : 'bg-white/60 border-stone-200'
          }`}
        >
          <BookOpen className="w-10 h-10 mx-auto text-stone-400 mb-3 opacity-60" />
          <h4 className={`text-base font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            {isArabic ? 'لم يتم العثور على أذكار مطابقة' : 'No supplications found'}
          </h4>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {isArabic
              ? 'جرّب تعديل كلمات البحث أو اختر قسماً آخر لاستعراض جميع الأذكار الصحيحة.'
              : 'Try adjusting your search query or reset the category filter to explore all 288 authentic Adhkar.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setFilterMode('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C9A063]/20 text-[#DFBA7F] border border-[#C9A063]/30 hover:bg-[#C9A063]/30 transition-colors"
          >
            {isArabic ? 'عرض جميع الأذكار' : 'Show All Adhkar'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {paginatedDuas.map((dua) => {
            const currentCount = dhikrProgress[dua.id] || 0;
            const targetCount = dua.repetitions || 1;
            const isCompleted = completedIds.has(dua.id) || currentCount >= targetCount;
            const isSaved = (userStats.savedDuas || []).includes(dua.id);
            const isAudioActive = activeAudioDuaId === dua.id && isAudioPlaying;

            const arabicSizeClass =
              arabicFontSize === 'normal'
                ? 'text-lg sm:text-xl leading-[2.2rem]'
                : arabicFontSize === 'large'
                ? 'text-xl sm:text-2xl leading-[2.5rem]'
                : 'text-2xl sm:text-3xl leading-[2.9rem]';

            const categoryLabel = isArabic
              ? (DHIKR_CATEGORIES.find((c) => c.id === dua.category)?.labelAr || dua.category)
              : dua.category;

            const chapterLabel = isArabic
              ? (dua.chapterTitleAr || dua.chapterTitle)
              : dua.chapterTitle;

            const duaDisplayTitle = isArabic
              ? (dua.titleAr || dua.title)
              : dua.title;

            return (
              <div
                key={dua.id}
                id={`dhikr-card-${dua.id}`}
                onClick={() => handleTapDhikr(dua)}
                className={`group relative rounded-[28px] p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
                  isCompleted
                    ? isDark
                      ? 'liquid-glass-secondary-dark border-emerald-500/40 shadow-sm'
                      : 'liquid-glass-secondary-light border-emerald-500/35 bg-emerald-50/30 shadow-sm'
                    : isDark
                    ? 'liquid-glass-secondary-dark border-[#C9A063]/20 hover:border-[#DFBA7F]/45 hover:shadow-md active:scale-[0.99]'
                    : 'liquid-glass-secondary-light border-[#A67C38]/20 hover:border-[#A67C38]/45 hover:shadow-md active:scale-[0.99]'
                }`}
              >
                {/* Top Row: Category Badge + Counter Pill */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                        isDark
                          ? 'bg-[#C9A063]/15 text-[#DFBA7F] border-[#C9A063]/30'
                          : 'bg-amber-100 text-[#8E6527] border-[#A67C38]/30'
                      }`}
                    >
                      {categoryLabel}
                    </span>

                    {chapterLabel && (
                      <span className="text-[10px] font-mono text-stone-300 truncate max-w-[170px]" title={chapterLabel}>
                        {isArabic ? `الباب ${dua.chapterId}: ${chapterLabel}` : `Ch. ${dua.chapterId}: ${chapterLabel}`}
                      </span>
                    )}
                  </div>

                  {/* Tactile Repetition Counter */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTapDhikr(dua)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-200 border ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isDark
                          ? 'bg-white/10 text-stone-200 border-white/15 hover:border-[#DFBA7F]/50 hover:bg-[#DFBA7F]/15'
                          : 'bg-stone-100 text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                      title={isArabic ? 'انقر لتسجيل تكرار الذكر' : 'Tap to count recitation'}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isArabic ? 'تم' : 'Done'}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#DFBA7F]">{currentCount}</span>
                          <span className="opacity-40">/</span>
                          <span>{targetCount}</span>
                        </>
                      )}
                    </button>

                    {currentCount > 0 && (
                      <button
                        onClick={(e) => handleResetDhikr(e, dua.id)}
                        className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
                        title={isArabic ? 'إعادة ضبط عداد هذا الذكر' : "Reset counter for this du'a"}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dua Title Header */}
                <h4 className={`text-sm sm:text-base font-bold font-serif-heading mb-2 ${isArabic ? 'font-arabic text-right' : ''} ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                  {duaDisplayTitle}
                </h4>

                {/* Arabic Text (Centered, High-Legibility Amiri/Naskh) */}
                <div className="my-2 text-right dir-rtl" dir="rtl">
                  <p
                    className={`font-serif-arabic font-normal select-text tracking-wide transition-colors duration-200 ${arabicSizeClass} ${
                      isDark ? 'text-[#FBF8F2]' : 'text-stone-900'
                    }`}
                  >
                    {dua.arabic}
                  </p>
                </div>

                {/* Transliteration (Only when not Arabic and user enabled) */}
                {!isArabic && showTransliteration && dua.transliteration && (
                  <p
                    className={`text-xs italic mt-2.5 font-sans leading-relaxed select-text ${
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    "{dua.transliteration}"
                  </p>
                )}

                {/* English Translation (Only shown in English/non-Arabic mode) */}
                {!isArabic && (
                  <p
                    className={`text-xs sm:text-sm mt-2 select-text leading-relaxed font-light ${
                      isDark ? 'text-stone-200' : 'text-stone-800'
                    }`}
                  >
                    {dua.translation}
                  </p>
                )}

                {/* Benefit / Virtue from Sunnah (If recorded) */}
                {dua.benefit && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                      isDark
                        ? 'bg-[#C9A063]/5 border-[#C9A063]/15 text-stone-300'
                        : 'bg-amber-50/60 border-[#A67C38]/15 text-stone-700'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0 mt-0.5" />
                    <span className="leading-snug">{dua.benefit}</span>
                  </div>
                )}

                {/* Bottom Source & Action Bar */}
                <div className="mt-4 pt-3 border-t border-[#C9A063]/15 flex items-center justify-between gap-2 flex-wrap">
                  {/* Hadith Citation */}
                  <span
                    className="text-[11px] font-medium text-stone-300 truncate max-w-[210px] sm:max-w-[260px]"
                    title={dua.source}
                  >
                    — {dua.source}
                  </span>

                  {/* Actions: Audio, Favorite, Copy, Noor AI Tadabbur */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Audio Play Button */}
                    <button
                      onClick={() => handleToggleAudio(dua)}
                      className={`p-2 rounded-xl border transition-all duration-200 flex items-center gap-1 ${
                        isAudioActive
                          ? 'bg-[#DFBA7F] text-black border-[#DFBA7F]'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-stone-300 hover:text-[#DFBA7F] hover:border-[#DFBA7F]/40'
                          : 'bg-white border-stone-200 text-stone-600 hover:text-[#8E6527] hover:border-[#A67C38]/40 shadow-sm'
                      }`}
                      title={
                        isAudioActive
                          ? isArabic ? 'إيقاف التلاوة' : 'Pause authentic audio'
                          : isArabic ? 'استماع للتلاوة المباركة' : 'Listen to authentic audio recitation'
                      }
                    >
                      {audioLoading && activeAudioDuaId === dua.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                      ) : isAudioActive ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Bookmark / Favorite */}
                    <button
                      onClick={(e) => handleToggleSave(e, dua.id)}
                      className={`p-2 rounded-xl border transition-all duration-200 ${
                        isSaved
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-stone-400 hover:text-rose-300'
                          : 'bg-white border-stone-200 text-stone-500 hover:text-rose-500 shadow-sm'
                      }`}
                      title={isSaved ? (isArabic ? 'إزالة من المحفوظات' : 'Remove from saved') : (isArabic ? 'حفظ في المفضلة' : 'Save to favorites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-400' : ''}`} />
                    </button>

                    {/* Copy */}
                    <button
                      onClick={(e) => handleCopy(e, dua)}
                      className={`p-2 rounded-xl border transition-all duration-200 ${
                        copiedDuaId === dua.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
                          : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800 shadow-sm'
                      }`}
                      title={isArabic ? 'نسخ نص الذكر والتخريج' : 'Copy Arabic & translation'}
                    >
                      {copiedDuaId === dua.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Tadabbur with Noor AI */}
                    {onOpenNoorAIWithPrompt && (
                      <button
                        onClick={() => {
                          const prompt = isArabic
                            ? `يرجى مشاركة تدبر إيماني عميق في هذا الذكر الصحيح من حصن المسلم:\n"${dua.titleAr || dua.title}"\nالنص: ${dua.arabic}\nالمصدر والتخريج: ${dua.source}\n\nما هي أسراره الإيمانية، وفضائله في السنة النبوية، وكيف أستشعر معانيه في يومي وليلي؟`
                            : `Please share a profound spiritual reflection (Tadabbur) on this authentic du'a from Hisn al-Muslim:\n"${dua.title}" (${dua.titleAr || ''})\nArabic: ${dua.arabic}\nTranslation: "${dua.translation}"\nReference: ${dua.source}\n\nWhat are its spiritual dimensions, virtues in the Sunnah, and how can I internalize it in daily life?`;
                          onOpenNoorAIWithPrompt(prompt);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border flex items-center gap-1 transition-all duration-200 ${
                          isDark
                            ? 'bg-[#C9A063]/10 border-[#C9A063]/25 text-[#DFBA7F] hover:bg-[#C9A063]/20'
                            : 'bg-amber-50 border-[#A67C38]/25 text-[#8E6527] hover:bg-amber-100 shadow-sm'
                        }`}
                        title={isArabic ? 'تدبر هذا الذكر مع نور' : "Reflect on this du'a with Noor AI"}
                      >
                        <Sparkles className="w-3 h-3 text-[#DFBA7F]" />
                        <span className="hidden sm:inline">{isArabic ? 'تدبر' : 'Reflect'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button for large category viewing */}
      {visibleCount < filteredDuas.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all duration-200 active:scale-95 ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-[#DFBA7F]/40 text-stone-200 hover:text-[#DFBA7F]'
                : 'bg-white border-stone-200 hover:border-[#A67C38]/40 text-stone-800 shadow-sm'
            }`}
          >
            {isArabic
              ? `تحميل المزيد من الأذكار (${filteredDuas.length - visibleCount} متبقٍ)`
              : `Load More Supplications (${filteredDuas.length - visibleCount} remaining)`}
          </button>
        </div>
      )}
    </section>
  );
};
