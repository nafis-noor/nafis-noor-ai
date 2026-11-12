import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  CheckCircle2,
  Heart,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Flame,
  BookOpen,
  Share2,
  RotateCcw,
  Compass,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Sliders,
  Check,
  Edit3,
  Bot,
  Layers,
  Award,
  Lock,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  RamadanUserData,
  RamadanActivity,
  RamadanGoalCategory,
} from '../../types/ramadan';
import {
  SUGGESTED_RAMADAN_GOALS,
  generateAlNoorPlan,
  getInspirationPulseForDay,
  getMotivationForCategory,
} from '../../utils/ramadanContent';
import {
  getRamadanUserData,
  saveRamadanUserData,
  recordDailyCheckIn,
  savePlanActivities,
} from '../../utils/ramadanDb';
import { detectRamadanStatus, HijriDateInfo } from '../../utils/hijriCalendar';
import { DailyInspirationPulseModal } from './DailyInspirationPulseModal';
import { NoorRamadanUpdatesModal } from './NoorRamadanUpdatesModal';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface NoorRamadanScreenProps {
  isDark?: boolean;
  language?: string;
  userLocation?: string;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
  onNavigate?: (tab: string) => void;
}

export const NoorRamadanScreen: React.FC<NoorRamadanScreenProps> = ({
  isDark = true,
  language = 'English',
  userLocation = 'Makkah',
  onOpenNoorAIWithPrompt,
  onNavigate,
}) => {
  const lang = getLanguageCode(language);
  const isArabic = lang === 'ar';
  const isRTL = isRTLLanguage(lang);

  // Main user data state from IndexedDB
  const [userData, setUserData] = useState<RamadanUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Real-time Date and Hijri Status
  const [hijriStatus, setHijriStatus] = useState<HijriDateInfo | null>(null);
  const [isDateChecking, setIsDateChecking] = useState<boolean>(true);
  const [isRamadanSimulated, setIsRamadanSimulated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('noor_simulate_ramadan') === 'true';
  });

  // Updates Modal state
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState<boolean>(false);

  // Active view: 'dashboard' | 'onboarding' | 'plan_builder'
  const [viewMode, setViewMode] = useState<'dashboard' | 'onboarding' | 'plan_builder'>('dashboard');

  // Onboarding draft state
  const [selectedGoalChipId, setSelectedGoalChipId] = useState<string>('fast_30');
  const [customGoalText, setCustomGoalText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RamadanGoalCategory>('fasting');

  // Plan builder draft activities
  const [draftActivities, setDraftActivities] = useState<RamadanActivity[]>([]);
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [newActivityTime, setNewActivityTime] = useState<string>('05:30');
  const [newActivityDuration, setNewActivityDuration] = useState<number>(30);
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false);

  // Daily Check-in state
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayFeedback, setTodayFeedback] = useState<string | null>(null);

  // Daily Inspiration Pulse Modal state
  const [isPulseModalOpen, setIsPulseModalOpen] = useState<boolean>(false);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(1);

  // Interactive Day Lock Notice Toast
  const [dayNotice, setDayNotice] = useState<{
    day: number;
    message: string;
    type: 'tomorrow' | 'later' | 'today' | 'past';
  } | null>(null);

  // Auto-clear day lock notice after 4 seconds
  useEffect(() => {
    if (!dayNotice) return;
    const timer = setTimeout(() => {
      setDayNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [dayNotice]);

  // NOOR AI Motivation Advice State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isGeneratingAiAdvice, setIsGeneratingAiAdvice] = useState<boolean>(false);

  // 1. Check live date & time and verify if currently in Ramadan
  useEffect(() => {
    let isMounted = true;
    setIsDateChecking(true);
    detectRamadanStatus().then((status) => {
      if (isMounted) {
        setHijriStatus(status);
        if (status.isRamadan) {
          const boundedDay = Math.max(1, Math.min(30, status.day || 1));
          setCurrentDayIndex(boundedDay);
        }
        setIsDateChecking(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isRamadanSimulated]);

  // 2. Load user data on mount from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getRamadanUserData();
        if (!isMounted) return;
        if (data) {
          setUserData(data);
          setDraftActivities(data.planActivities);
          setViewMode('dashboard');

          // Check if today already answered
          const todayLog = data.dailyLog.find((l) => l.date === todayStr);
          if (todayLog) {
            setTodayFeedback(
              todayLog.status === 'yes'
                ? 'Alhamdulillah! May Allah accept every step of your effort today.'
                : 'Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.'
            );
          }
        } else {
          // If first visit, open onboarding
          setViewMode('onboarding');
        }
      } catch (err) {
        console.warn('Error loading Ramadan data:', err);
        setViewMode('onboarding');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  // Compute current day of Ramadan (1 to 30) based on Hijri status or startDate
  useEffect(() => {
    if (hijriStatus?.isRamadan && hijriStatus.day) {
      setCurrentDayIndex(Math.max(1, Math.min(30, hijriStatus.day)));
    } else if (userData?.startDate) {
      const start = new Date(userData.startDate).getTime();
      const current = new Date(todayStr).getTime();
      const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1;
      const boundedDay = Math.max(1, Math.min(30, diffDays));
      setCurrentDayIndex(boundedDay);
    } else {
      setCurrentDayIndex(1);
    }
  }, [hijriStatus, userData?.startDate, todayStr]);

  // =========================================================================
  // ONBOARDING: Set My Dream
  // =========================================================================
  const handleConfirmDream = async () => {
    const chip = SUGGESTED_RAMADAN_GOALS.find((g) => g.id === selectedGoalChipId);
    const finalGoalText = customGoalText.trim() || chip?.label || 'Fast all 30 days and draw nearer to Allah';
    const finalCategory = chip?.category || selectedCategory;

    const startDate = todayStr;
    const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Seed default recommended Al-Noor Plan
    const defaultActivities = generateAlNoorPlan('05:00', '18:00', '19:30');

    const newProfile: RamadanUserData = {
      dreamId: 'current_ramadan_user',
      goalText: finalGoalText,
      goalCategory: finalCategory,
      startDate,
      endDate,
      dailyLog: [],
      planActivities: defaultActivities,
      inspirationPulse: [],
      isCustomPlan: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveRamadanUserData(newProfile);
    setUserData(saved);
    setDraftActivities(defaultActivities);
    setViewMode('dashboard');
  };

  // =========================================================================
  // PLAN BUILDER: Custom & Al-Noor
  // =========================================================================
  const handleApplyAlNoorPlan = () => {
    const alnoor = generateAlNoorPlan('05:00', '18:00', '19:30');
    setDraftActivities(alnoor);
  };

  const handleToggleActivity = (id: string) => {
    setDraftActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, isActive: !act.isActive } : act))
    );
  };

  const handleDeleteActivity = (id: string) => {
    setDraftActivities((prev) => prev.filter((act) => act.id !== id));
  };

  const handleAddNewActivity = () => {
    if (!newActivityName.trim()) return;
    const newAct: RamadanActivity = {
      id: `custom_${Date.now()}`,
      activityName: newActivityName.trim(),
      scheduledTime: newActivityTime,
      duration: newActivityDuration > 0 ? newActivityDuration : undefined,
      isActive: true,
      category: 'custom',
    };
    setDraftActivities((prev) => [...prev, newAct]);
    setNewActivityName('');
    setIsAddingActivity(false);
  };

  const handleSavePlan = async () => {
    if (!userData) return;
    const updated = await savePlanActivities(draftActivities);
    setUserData(updated);
    setViewMode('dashboard');
  };

  // =========================================================================
  // DAILY CHECK-IN: Yes I did / Not today (Strictly for Today)
  // =========================================================================
  const handleDailyCheckIn = async (status: 'yes' | 'no') => {
    const note = status === 'yes' ? 'Dedicated effort toward Ramadan dream' : 'Intention renewed with patience';
    const updated = await recordDailyCheckIn(todayStr, status, note);
    setUserData(updated);

    if (status === 'yes') {
      setTodayFeedback('Alhamdulillah! May Allah accept every step of your effort today.');
    } else {
      setTodayFeedback('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
    }
  };

  // Ask NOOR AI for tailored motivation
  const handleAskNoorAIForMotivation = () => {
    const goal = userData?.goalText || 'spiritual growth in Ramadan';
    const category = userData?.goalCategory || 'fasting';
    const prompt = `I am pursuing my Ramadan dream: "${goal}" (${category}). Could you share an uplifting, heart-nourishing Islamic reminder with a relevant Quranic verse and practical advice for me today?`;
    if (onOpenNoorAIWithPrompt) {
      onOpenNoorAIWithPrompt(prompt);
    }
  };

  // Compute 30-day stats
  const dailyLogs = userData?.dailyLog || [];
  const daysAchieved = dailyLogs.filter((l) => l.status === 'yes').length;
  const percentageComplete = Math.min(100, Math.round((daysAchieved / 30) * 100));

  const motivationItem = getMotivationForCategory(userData?.goalCategory || 'fasting');
  const inspirationPulseItem = getInspirationPulseForDay(currentDayIndex);

  const isRamadanActive = Boolean(hijriStatus?.isRamadan || isRamadanSimulated);

  return (
    <div className="min-h-screen pt-4 sm:pt-6 pb-32 sm:pb-36 lg:pb-16 px-3.5 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate('profile');
            else window.history.back();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C9A063]/30 bg-[#C9A063]/10 hover:bg-[#C9A063]/20 text-[#DFBA7F] text-xs font-semibold transition-all group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Settings</span>
          <span className="text-stone-500">•</span>
          <span>Ramadan Events</span>
        </button>

        <div className="flex items-center gap-2">
          {/* See Updates Button in Header */}
          <button
            type="button"
            id="ramadan-screen-see-updates-btn"
            onClick={() => setIsUpdatesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DFBA7F]/15 hover:bg-[#DFBA7F]/25 border border-[#DFBA7F]/30 text-[#DFBA7F] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>See Updates</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#DFBA7F]/15 border border-[#DFBA7F]/30 text-[#DFBA7F]">
            <Moon className="w-3.5 h-3.5 fill-current" />
            <span>Ramaḍān 1447 AH</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATE VERIFICATION LOCK SCREEN (Shown when outside Ramadan)                 */}
      {/* ========================================================================= */}
      {!isRamadanActive ? (
        <div className="rounded-[36px] border border-amber-500/30 bg-gradient-to-b from-[#0F1626] via-[#090D18] to-[#050710] p-6 sm:p-12 shadow-[0_4px_40px_rgba(0,0,0,0.6)] relative overflow-hidden animate-fadeIn text-stone-100 text-center space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-90" />
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 mx-auto shadow-[0_0_30px_rgba(201,160,99,0.3)]">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#DFBA7F] font-bold">
              {isArabic ? 'التزام دقيق بالتقويم الهجري الشرعي' : 'Strict Islamic Calendar Enforcement'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif-heading font-bold text-white tracking-wide">
              {isArabic ? 'فعاليات رمضان تعمل فقط في أيام شهر رمضان' : 'Ramadan Events Work Only in Ramadan Date'}
            </h1>
            <p className="text-lg font-arabic text-[#DFBA7F]" dir="rtl">
              شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ
            </p>
            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
              {isArabic
                ? 'فعاليات نور الرمضانية مخصصة حصرياً لأيام الشهر الفضيل المبارك (الشهر التاسع). والفحص الزمني المباشر يؤكد أن هلال رمضان لم يحل بعد.'
                : 'Noor Ramadan Events are strictly scheduled for the sacred month of Ramadan (Month 9). The live date and time check verifies that Ramadan has not yet arrived.'}
            </p>
          </div>

          {/* Real-time date & time verification card */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 max-w-md mx-auto space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="text-stone-400">{isArabic ? 'فحص التاريخ والوقت المباشر:' : 'Live Date & Time Check:'}</span>
              <span className="text-[#DFBA7F] font-mono font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#DFBA7F]" />
                {hijriStatus?.liveTimeString || new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">{isArabic ? 'الميلادي:' : 'Gregorian:'}</span>
              <span className="text-white font-semibold">{hijriStatus?.liveDateString || new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">{isArabic ? 'التقويم الهجري:' : 'Hijri Calendar:'}</span>
              <span className="text-amber-300 font-semibold font-mono">
                {hijriStatus ? `${hijriStatus.day} ${hijriStatus.monthNameEn} ${hijriStatus.year} AH` : 'Calculating...'}
                {hijriStatus && ` (${isArabic ? `الشهر ${hijriStatus.monthNumber} من 12` : `Month ${hijriStatus.monthNumber} of 12`})`}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
              {isArabic
                ? '🔒 مؤمن: ستفتح هذه الفعاليات المباركة تلقائياً مع أول أيام شهر رمضان 1447هـ بإذن الله تعالى.'
                : '🔒 Locked: This module will automatically unlock on the 1st of Ramadan 1447, Insha\'Allah.'}
            </div>
          </div>

          {/* Action buttons: See Updates & Back to Settings */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
            <button
              type="button"
              onClick={() => setIsUpdatesModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#080B10] font-bold text-xs tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current text-[#080B10]" />
              <span>{isArabic ? 'عرض التحديثات' : 'See Updates'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('profile');
                else window.history.back();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{isArabic ? 'العودة إلى الإعدادات' : 'Back to Settings'}</span>
            </button>
          </div>

          {/* Discrete testing toggle */}
          <div className="pt-4 text-[10px] text-stone-500 flex items-center justify-center gap-2">
            <span>Testing/Review Mode:</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isRamadanSimulated;
                setIsRamadanSimulated(nextVal);
                localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
                detectRamadanStatus().then((s) => setHijriStatus(s));
              }}
              className="text-[#DFBA7F] hover:underline cursor-pointer"
            >
              {isRamadanSimulated ? 'Disable Preview Simulation' : 'Enable Preview Simulation for Testing'}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* RAMADAN ACTIVE VIEW (Unlocked strictly during Ramadan)                     */
        /* ========================================================================= */
        <>
          {/* ========================================================================= */}
          {/* 1. ONBOARDING SCREEN (Set Your Ramadan Dream)                             */}
          {/* ========================================================================= */}
          {viewMode === 'onboarding' ? (
            <div className="rounded-[36px] border border-[#C9A063]/30 bg-gradient-to-b from-[#0F1626] via-[#090D18] to-[#050710] p-6 sm:p-10 shadow-[0_4px_40px_rgba(0,0,0,0.6)] relative overflow-hidden animate-fadeIn text-stone-100">
              {/* Top Luminous Gold Trim */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-90" />

              {/* Crescent Moon Atmospheric Background Glow */}
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C9A063]/15 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="max-w-2xl mx-auto space-y-6 text-center">
                {/* Crescent & Lantern Icon */}
                <div className="w-16 h-16 rounded-3xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] mx-auto shadow-[0_0_30px_rgba(201,160,99,0.3)]">
                  <Moon className="w-8 h-8 text-[#DFBA7F]" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#DFBA7F] font-bold">
                    Noor Ramadan 1447 AH Sanctuary
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-serif-heading font-bold text-white tracking-wide">
                    What is your dream for this Ramadan?
                  </h1>
                  <p className="text-xl font-arabic text-[#DFBA7F]" dir="rtl">
                    ما هو حلمك وغايتك الإيمانية في هذا الشهر الفضيل؟
                  </p>
                  <p className="text-xs sm:text-sm text-stone-300 font-light max-w-lg mx-auto leading-relaxed">
                    Ramadan is the golden season of transformation. Choose one sacred aspiration to dedicate your heart, schedule, and prayers toward.
                  </p>
                </div>

                {/* Suggested Goals Chips Grid */}
                <div className="space-y-3 pt-2 text-left">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block text-center">
                    Select a recommended spiritual dream:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_RAMADAN_GOALS.map((goal) => {
                      const isSelected = selectedGoalChipId === goal.id && !customGoalText;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => {
                            setSelectedGoalChipId(goal.id);
                            setSelectedCategory(goal.category);
                            setCustomGoalText('');
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 card-hover-lift btn-press-bounce ${
                            isSelected
                              ? 'bg-[#18233C] border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.25)] ring-1 ring-[#DFBA7F]/40'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-stone-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                              isSelected
                                ? 'bg-[#DFBA7F] border-[#DFBA7F] text-[#050811]'
                                : 'border-stone-500'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{goal.label}</span>
                            </div>
                            <p className="text-[11px] text-stone-400 font-light mt-0.5">
                              {goal.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Goal Input */}
                <div className="pt-2 text-left space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block">
                    Or write your custom personal dream:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customGoalText}
                      onChange={(e) => {
                        setCustomGoalText(e.target.value);
                        if (e.target.value) {
                          setSelectedGoalChipId('');
                        }
                      }}
                      placeholder="e.g., Read Surah Al-Baqarah weekly and maintain tahajjud..."
                      className="w-full py-3 px-4 rounded-2xl bg-black/40 border border-[#C9A063]/30 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#DFBA7F] transition-colors"
                    />
                    {customGoalText && (
                      <button
                        type="button"
                        onClick={() => setCustomGoalText('')}
                        className="absolute right-3 top-3 text-stone-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmation Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleConfirmDream}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#080B10] font-bold text-sm tracking-wide shadow-lg shadow-[#C9A063]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Set My Dream & Build Daily Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'plan_builder' ? (
            /* ========================================================================= */
            /* 2. PLAN BUILDER VIEW (Custom & Al-Noor Plan)                               */
            /* ========================================================================= */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-[#0B101D] border border-[#C9A063]/30 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#DFBA7F] font-bold">
                      Personal Daily Routine
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif-heading font-bold text-white">
                      Build Your Daily Ramadan Plan
                    </h2>
                    <p className="text-xs text-stone-300 mt-1">
                      Targeting your dream: <strong className="text-[#DFBA7F]">"{userData?.goalText}"</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyAlNoorPlan}
                      className="px-3.5 py-2 rounded-xl bg-[#C9A063]/15 hover:bg-[#C9A063]/25 border border-[#C9A063]/40 text-[#DFBA7F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Al-Noor Plan</span>
                    </button>
                  </div>
                </div>

                {/* Pre-built Al-Noor Plan Info Callout */}
                <div className="p-4 rounded-2xl bg-black/40 border border-[#C9A063]/20 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-stone-300 space-y-1">
                    <p className="font-semibold text-white">The Al-Noor Recommended Routine:</p>
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      Combines authentic Sunnah practices: Suhoor 1 hr before Fajr, post-Fajr Quran session, Morning & Afternoon Adhkar, Maghrib Adhkar & Sunset Iftar, Taraweeh after Isha, and Tahajjud in the last third of the night. You may customize any activity or time below.
                    </p>
                  </div>
                </div>

                {/* Activities List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono px-1">
                    <span>Scheduled Daily Routines ({draftActivities.length})</span>
                    <span>Toggle to Enable/Disable</span>
                  </div>

                  <div className="space-y-2">
                    {draftActivities.map((act) => (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          act.isActive
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-black/30 border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActivity(act.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                              act.isActive
                                ? 'bg-[#DFBA7F] border-[#DFBA7F] text-[#0A0E18]'
                                : 'border-stone-600'
                            }`}
                          >
                            {act.isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              {act.activityName}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {act.duration ? `${act.duration} minutes` : 'Fixed prayer/session'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#DFBA7F]">
                            <Clock className="w-3 h-3" />
                            <span>{act.scheduledTime}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1.5 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Activity Form */}
                {isAddingActivity ? (
                  <div className="p-4 rounded-2xl bg-black/50 border border-[#C9A063]/30 space-y-3 animate-fadeIn">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-[#DFBA7F]" />
                      <span>Add Custom Routine</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Activity name (e.g., Memorize Surah Mulk)"
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#DFBA7F]"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">Time:</span>
                        <input
                          type="time"
                          value={newActivityTime}
                          onChange={(e) => setNewActivityTime(e.target.value)}
                          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#DFBA7F] w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">Min:</span>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={newActivityDuration}
                          onChange={(e) => setNewActivityDuration(Number(e.target.value))}
                          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#DFBA7F] w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingActivity(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-stone-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewActivity}
                        className="px-4 py-1.5 rounded-xl bg-[#DFBA7F] text-black text-xs font-bold"
                      >
                        Add Routine
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingActivity(true)}
                    className="w-full py-2.5 rounded-2xl border border-dashed border-white/20 hover:border-[#DFBA7F]/50 text-stone-300 hover:text-[#DFBA7F] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Custom Activity</span>
                  </button>
                )}

                {/* Plan Save Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('dashboard')}
                    className="px-4 py-2.5 rounded-xl text-xs text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-black text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    Save & Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 3. RAMADAN DASHBOARD VIEW                                                 */
            /* ========================================================================= */
            <div className="space-y-6 animate-fadeIn">
              {/* Dream Banner Card */}
              <div className="rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#0F1626] via-[#090D18] to-[#04060C] border border-[#C9A063]/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFBA7F]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/40 shadow-xs flex items-center gap-1.5">
                        <Moon className="w-3 h-3 fill-current" />
                        <span>Day {currentDayIndex} of 30</span>
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        {percentageComplete}% Goal Completed
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif-heading font-bold text-white leading-snug">
                      "{userData?.goalText}"
                    </h2>

                    <p className="text-xs text-stone-400">
                      Category: <span className="capitalize text-[#DFBA7F] font-semibold">{userData?.goalCategory}</span> • Saved locally in IndexedDB
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('plan_builder')}
                      className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#DFBA7F]" />
                      <span>Adjust Daily Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPulseModalOpen(true)}
                      className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Today's Inspiration Pulse</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('onboarding')}
                      className="py-2 px-3 text-[11px] font-mono text-stone-400 hover:text-stone-200 underline text-center cursor-pointer"
                    >
                      Change My Dream
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Dream Check-In Interactive Section (Day currentDayIndex) */}
              <div className="p-6 rounded-3xl bg-[#090E1C]/90 border border-[#C9A063]/25 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#DFBA7F] font-bold">
                        Daily Dream Accountability
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                        Day {currentDayIndex} of 30 (Today)
                      </span>
                    </div>
                    <h3 className="text-lg font-serif-heading font-bold text-white mt-0.5">
                      Did you work toward your dream today?
                    </h3>
                    <p className="text-[11px] text-stone-400 font-light">
                      Upcoming days are locked (Tomorrow Insha'Allah, and subsequent days Insha'Allah that time).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDailyCheckIn('yes')}
                      className="py-2.5 px-5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Yes, I did!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDailyCheckIn('no')}
                      className="py-2.5 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Heart className="w-4 h-4 text-purple-400" />
                      <span>Not today</span>
                    </button>
                  </div>
                </div>

                {todayFeedback && (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-[#C9A063]/20 text-xs text-center text-[#DFBA7F] font-serif italic animate-fadeIn">
                    "{todayFeedback}"
                  </div>
                )}
              </div>

              {/* 30-Day Ramadan Visual Calendar Progress Grid */}
              <div className="p-6 rounded-3xl bg-[#080D1A]/90 border border-[#C9A063]/20 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-[#DFBA7F]" />
                    <div>
                      <h3 className="text-base font-serif-heading font-bold text-white">
                        30-Day Ramadan Journey Calendar
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        Current Day is active • Tomorrow shows "Tomorrow Insha'Allah" • Subsequent days show "Insha'Allah that time"
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-[#DFBA7F]">
                    {daysAchieved} Days Achieved • {30 - daysAchieved} Days Left
                  </div>
                </div>

                {/* Day Lock Notice Toast Banner */}
                {dayNotice && (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between animate-fadeIn transition-all ${
                      dayNotice.type === 'tomorrow'
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : dayNotice.type === 'later'
                        ? 'bg-stone-900/80 border-stone-700 text-stone-300'
                        : dayNotice.type === 'today'
                        ? 'bg-[#DFBA7F]/20 border-[#DFBA7F]/40 text-[#DFBA7F]'
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {dayNotice.type === 'tomorrow' || dayNotice.type === 'later' ? (
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium">{dayNotice.message}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDayNotice(null)}
                      className="p-1 text-stone-400 hover:text-white transition-colors"
                      aria-label="Dismiss notice"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 30-Day Grid with Day-Locking Rules */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const dayNum = i + 1;
                    const isPast = dayNum < currentDayIndex;
                    const isCurrent = dayNum === currentDayIndex;
                    const isTomorrow = dayNum === currentDayIndex + 1;
                    const isLater = dayNum > currentDayIndex + 1;
                    const hasLogged = dailyLogs[i];

                    let bgClass = 'bg-white/[0.02] border-white/5 text-stone-500';
                    let subLabel = '';
                    let icon = null;

                    if (isPast) {
                      if (hasLogged?.status === 'yes') {
                        bgClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold';
                        subLabel = 'Achieved';
                        icon = <Check className="w-3 h-3 text-emerald-400" />;
                      } else {
                        bgClass = 'bg-stone-800/60 border-stone-700/80 text-stone-400';
                        subLabel = 'Recorded';
                        icon = <Heart className="w-3 h-3 text-purple-400" />;
                      }
                    } else if (isCurrent) {
                      bgClass = 'bg-[#DFBA7F]/25 border-[#DFBA7F] text-[#DFBA7F] font-bold ring-2 ring-[#DFBA7F]/40 shadow-[0_0_12px_rgba(223,186,127,0.3)] animate-pulse';
                      subLabel = 'Today';
                      icon = <Sparkles className="w-3 h-3 text-[#DFBA7F]" />;
                    } else if (isTomorrow) {
                      // Locked: Tomorrow Insha'Allah
                      bgClass = 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:border-amber-400/60';
                      subLabel = "Tomorrow Insha'Allah";
                      icon = <Lock className="w-3 h-3 text-amber-400" />;
                    } else {
                      // Locked: Insha'Allah that time
                      bgClass = 'bg-white/[0.02] border-white/5 text-stone-500 hover:border-stone-600';
                      subLabel = "Insha'Allah that time";
                      icon = <Lock className="w-2.5 h-2.5 text-stone-500" />;
                    }

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          if (isTomorrow) {
                            setDayNotice({
                              day: dayNum,
                              message: `Tomorrow Insha'Allah! Day ${dayNum} will unlock tomorrow at Fajr.`,
                              type: 'tomorrow',
                            });
                          } else if (isLater) {
                            setDayNotice({
                              day: dayNum,
                              message: `Insha'Allah that time! Day ${dayNum} is locked until that day arrives.`,
                              type: 'later',
                            });
                          } else if (isCurrent) {
                            setDayNotice({
                              day: dayNum,
                              message: `Today is Day ${dayNum} of Ramadan! Record your daily check-in below.`,
                              type: 'today',
                            });
                          } else {
                            setDayNotice({
                              day: dayNum,
                              message: `Day ${dayNum} (Past Day): ${hasLogged?.status === 'yes' ? 'Alhamdulillah, goal achieved!' : 'Logged with sincere intention.'}`,
                              type: 'past',
                            });
                          }
                        }}
                        className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[72px] transition-all cursor-pointer active:scale-95 ${bgClass}`}
                      >
                        <div className="flex items-center justify-between w-full px-0.5">
                          <span className="text-[9px] font-mono opacity-60">D{dayNum}</span>
                          {icon}
                        </div>
                        <span className="text-xs sm:text-sm font-bold font-mono my-0.5">{dayNum}</span>
                        <span className={`text-[8px] leading-tight text-center line-clamp-2 px-0.5 ${
                          isTomorrow ? 'text-amber-300 font-bold' : isCurrent ? 'text-[#DFBA7F] font-bold' : isPast ? 'text-stone-300' : 'text-stone-400'
                        }`}>
                          {subLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* End of Ramadan Closing Du'a Card if near or complete */}
                {daysAchieved >= 25 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 mt-4 animate-fadeIn">
                    <div className="font-bold font-cinzel text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>Closing Ramadan Du'a of Gratitude:</span>
                    </div>
                    <p className="font-arabic text-base leading-loose text-center text-[#DFBA7F]" dir="rtl">
                      « اللَّهُمَّ لَا تَجْعَلْهُ آخِرَ الْعَهْدِ مِنْ صِيَامِنَا إِيَّاهُ، فَإِنْ جَعَلْتَهُ فَاجْعَلْنَا مَرْحُومِينَ وَلَا تَجْعَلْنَا مَحْرُومِينَ »
                    </p>
                    <p className="italic text-stone-300 text-center font-light">
                      "O Allah, let this not be the final covenant of our fasting; and if You have decreed it so, make us among those showered in mercy, not those denied."
                    </p>
                  </div>
                )}
              </div>

              {/* Motivation Boost: Categorized Authentic Verses & Hadiths */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F1728] to-[#0A101D] border border-[#C9A063]/30 shadow-lg space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#DFBA7F]" />
                  <h3 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                    Motivation Boost (Category: {userData?.goalCategory})
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-[#C9A063]/20 space-y-3">
                  <p className="text-xl sm:text-2xl font-arabic font-bold text-[#DFBA7F] leading-loose text-center" dir="rtl">
                    « {motivationItem.arabicVerseOrHadith} »
                  </p>
                  <p className="text-xs sm:text-sm text-stone-200 font-serif italic text-center">
                    "{motivationItem.translation}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-2 border-t border-white/5">
                    <span>Authentic Source: {motivationItem.reference}</span>
                    <span className="text-[#DFBA7F] capitalize">Category: {motivationItem.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-stone-400">
                    Rotates every 5 days with authentic verses on patience, recitation, and mercy.
                  </p>
                  <button
                    type="button"
                    onClick={handleAskNoorAIForMotivation}
                    className="py-1.5 px-3 rounded-xl bg-[#DFBA7F]/15 hover:bg-[#DFBA7F]/25 border border-[#DFBA7F]/30 text-[#DFBA7F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask NOOR AI for Goal Advice</span>
                  </button>
                </div>
              </div>

              {/* Today's Plan Activities Schedule */}
              <div className="p-6 rounded-3xl bg-[#090D1A]/90 border border-[#C9A063]/20 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-[#DFBA7F]" />
                    <div>
                      <h3 className="text-base font-serif-heading font-bold text-white">
                        Today's Scheduled Routines (Day {currentDayIndex})
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        Tomorrow's routine will unlock Tomorrow Insha'Allah.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('plan_builder')}
                    className="text-xs text-[#DFBA7F] hover:underline cursor-pointer"
                  >
                    Edit Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(userData?.planActivities || draftActivities)
                    .filter((a) => a.isActive)
                    .map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#DFBA7F]" />
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              {act.activityName}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {act.duration ? `${act.duration} minutes` : 'Daily time'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#DFBA7F]">
                          {act.scheduledTime}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 24-Hour Daily Inspiration Pulse Modal */}
      <DailyInspirationPulseModal
        isOpen={isPulseModalOpen}
        onDismissTemporarily={() => setIsPulseModalOpen(false)}
        onEngagedComplete={() => setIsPulseModalOpen(false)}
        item={inspirationPulseItem}
        dayNumber={currentDayIndex}
        isDark={isDark}
      />

      {/* Ramadan Updates Modal (Shows ONLY updates) */}
      <NoorRamadanUpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        isDark={isDark}
        ramadanStatus={hijriStatus}
        isRamadanSimulated={isRamadanSimulated}
        onToggleSimulated={() => {
          const nextVal = !isRamadanSimulated;
          setIsRamadanSimulated(nextVal);
          localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
          detectRamadanStatus().then((s) => setHijriStatus(s));
        }}
        onProceedToRamadan={
          isRamadanActive
            ? () => {
                setIsUpdatesModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
};
