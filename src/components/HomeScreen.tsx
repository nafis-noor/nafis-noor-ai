import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  GraduationCap,
  ChevronRight,
  RotateCcw,
  Check,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Layers,
  Heart,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Compass,
  ArrowRight,
  Sliders,
  SunMedium,
  CheckCircle2,
  Bell,
  BellRing,
  ShieldAlert
} from 'lucide-react';
import { UserStats, Dua } from '../types';
import { NavTab } from './Navigation';
import { calculatePrayerTimes } from '../utils/prayerTimes';
import { DUAS_LIST } from '../data/duasData';
import { LocationModal } from './LocationModal';
import { recordUserActivity } from '../utils/streakManager';
import { useBackHandler } from '../utils/historyManager';
import { NoorAIIcon } from './NoorAIIcon';
import { DhikrDuaSection } from './DhikrDuaSection';
import { PullToRefresh } from './PullToRefresh';
import { t, getLanguageCode } from '../utils/i18n';

interface HomeScreenProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenQuranSurah?: (surahNumber: number) => void;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isDark,
  userStats,
  onUpdateStats,
  onNavigate,
  onOpenQuranSurah,
  onOpenNoorAIWithPrompt,
}) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [prayerData, setPrayerData] = useState(() =>
    calculatePrayerTimes({
      latitude: userStats.userLatitude,
      longitude: userStats.userLongitude,
      locationName: userStats.userLocation,
      calculationMethod: userStats.prayerCalculationMethod,
      asrMadhab: userStats.asrJuristicMethod,
    })
  );
  const [copiedDua, setCopiedDua] = useState(false);
  const [isSpeakingDua, setIsSpeakingDua] = useState(false);
  const [isDhikrAnimating, setIsDhikrAnimating] = useState(false);
  const [showAllPrayers, setShowAllPrayers] = useState(false);

  // Browser Back button navigation hooks
  useBackHandler(isLocationModalOpen, () => setIsLocationModalOpen(false), 'home-location-modal');
  useBackHandler(showAllPrayers, () => setShowAllPrayers(false), 'home-all-prayers');

  // Compute the designated Dua for today based on calendar day
  const todayDuaIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % DUAS_LIST.length;
  }, []);

  const [activeDuaIndex, setActiveDuaIndex] = useState(todayDuaIndex);
  const currentDua: Dua = DUAS_LIST[activeDuaIndex] || DUAS_LIST[0];

  // Update prayer times on options change or 1-second interval
  useEffect(() => {
    const update = () => {
      setPrayerData(
        calculatePrayerTimes({
          latitude: userStats.userLatitude,
          longitude: userStats.userLongitude,
          locationName: userStats.userLocation,
          calculationMethod: userStats.prayerCalculationMethod,
          asrMadhab: userStats.asrJuristicMethod,
        })
      );
    };

    update();
    // 15-second interval avoids 60 re-renders/minute on iOS while keeping time accurate
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, [
    userStats.userLatitude,
    userStats.userLongitude,
    userStats.userLocation,
    userStats.prayerCalculationMethod,
    userStats.asrJuristicMethod,
  ]);

  // Dhikr options
  const dhikrOptions = [
    { text: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', meaningAr: 'تسبيح الله وتنزيهه عن كل نقص' },
    { text: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All Praise is to Allah', meaningAr: 'الثناء الكامل والمطلق لله وحده' },
    { text: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', meaningAr: 'الله أعظم وأجلّ من كل شيء' },
    { text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: "I seek Allah's Forgiveness", meaningAr: 'طلب المغفرة والستر من الله' },
    { text: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', meaningAr: 'كلمة التوحيد: لا معبود بحق إلا الله' },
  ];

  const activeDhikrObj = dhikrOptions.find((d) => d.text === userStats.currentDhikrText) || dhikrOptions[0];

  // Subtle audio click chime synthesized on demand
  const playTactileChime = () => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      }
    } catch {
      // Audio optional
    }
  };

  const handleIncrementDhikr = (amount = 1) => {
    playTactileChime();
    setIsDhikrAnimating(true);
    setTimeout(() => setIsDhikrAnimating(false), 200);

    const newCount = userStats.dhikrCount + amount;
    const streakUpdates = recordUserActivity(userStats, 'dhikr');

    onUpdateStats({
      dhikrCount: newCount,
      ...streakUpdates,
    });
  };

  const handleResetDhikr = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStats({ dhikrCount: 0 });
  };

  const handleSelectDhikrText = (dhikrText: string) => {
    onUpdateStats({ currentDhikrText: dhikrText });
  };

  const handleToggleSaveDua = () => {
    const saved = userStats.savedDuas || [];
    const isSaved = saved.includes(currentDua.id);
    const newSaved = isSaved
      ? saved.filter((id) => id !== currentDua.id)
      : [...saved, currentDua.id];
    onUpdateStats({ savedDuas: newSaved });
  };

  const handleCopyDua = () => {
    const textToCopy = `${currentDua.title}\n\n${currentDua.arabic}\n\n${currentDua.transliteration}\n\n"${currentDua.translation}"\n— ${currentDua.source} (Via NOOR)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDua(true);
    setTimeout(() => setCopiedDua(false), 2000);
  };

  const handleSpeakDua = () => {
    if ('speechSynthesis' in window) {
      if (isSpeakingDua) {
        window.speechSynthesis.cancel();
        setIsSpeakingDua(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(currentDua.arabic);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.onend = () => setIsSpeakingDua(false);
      utterance.onerror = () => setIsSpeakingDua(false);
      setIsSpeakingDua(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const isDuaSaved = (userStats.savedDuas || []).includes(currentDua.id);
  const lang = getLanguageCode(userStats.language);

  const getPrayerLocalizedName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fajr')) return t(lang, 'fajr');
    if (lower.includes('sun')) return t(lang, 'sunrise');
    if (lower.includes('dhuhr') || lower.includes('zuhr')) return t(lang, 'dhuhr');
    if (lower.includes('asr')) return t(lang, 'asr');
    if (lower.includes('maghrib')) return t(lang, 'maghrib');
    if (lower.includes('isha')) return t(lang, 'isha');
    return name;
  };

  const handlePullRefresh = async () => {
    setPrayerData(
      calculatePrayerTimes({
        latitude: userStats.userLatitude,
        longitude: userStats.userLongitude,
        locationName: userStats.userLocation,
        calculationMethod: userStats.prayerCalculationMethod,
        asrMadhab: userStats.asrJuristicMethod,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh} isDark={isDark}>
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 pb-32 lg:pb-16 space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOP PEACEFUL DIGITAL HOME GREETING                                     */}
      {/* ========================================================================= */}
      <div className="pt-1 px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-cinzel font-semibold tracking-widest text-[#DFBA7F]">
            {t(lang, 'peaceBeUponYou')}
          </p>
          <h2
            className={`text-2xl sm:text-3xl font-serif-heading font-bold tracking-tight mt-0.5 ${
              isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
            }`}
          >
            {userStats.userName ? t(lang, 'welcomeUser', { name: userStats.userName }) : t(lang, 'authWelcomeTitle')}
          </h2>
          <p className={`text-xs mt-1 font-light ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            {t(lang, 'verseRestReflection')}
          </p>
        </div>

        {/* Location & Method Badge */}
        <div className="flex items-center gap-2">
          <button
            id="home-location-badge"
            onClick={() => setIsLocationModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all group ${
              isDark
                ? 'border-[#C9A063]/30 bg-[#C9A063]/10 text-[#DFBA7F] hover:bg-[#C9A063]/20 shadow-sm'
                : 'border-[#A67C38]/30 bg-amber-50 text-[#8E6527] hover:bg-amber-100 shadow-2xs'
            }`}
            title={lang === 'ar' ? 'تغيير الموقع وطريقة الحساب' : 'Change Location & Calculation Method'}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C9A063] group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[140px]">{userStats.userLocation || 'Makkah'}</span>
            <Sliders className="w-3 h-3 text-[#DFBA7F]/70 ml-0.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP BENTO ROW: 🕌 PRAYER CARD & 📖 QUR'AN CARD                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PRAYER CARD */}
        <div
          id="home-prayer-card"
          className={`rounded-[32px] p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between ${
            isDark
              ? 'liquid-glass-hero-dark border-[#DFBA7F]/35 shadow-md'
              : 'liquid-glass-hero-light border-[#A67C38]/30 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🕌</span>
                <div>
                  <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                    {t(lang, 'nextPrayer')}
                  </span>
                  <h3 className={`text-xl font-bold font-cinzel ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                    {getPrayerLocalizedName(prayerData.nextPrayer.name)}
                  </h3>
                </div>
              </div>

              {/* Countdown Pill */}
              <div
                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-mono text-xs font-bold ${
                  isDark
                    ? 'bg-[#080A0E]/80 border-[#DFBA7F]/40 text-[#DFBA7F] shadow-sm'
                    : 'bg-white/90 border-[#A67C38]/40 text-[#8E6527] shadow-sm'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#C9A063]" />
                <span>{prayerData.timeUntilNext}</span>
              </div>
            </div>

            {/* 5 Daily Prayers Pill Grid */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {prayerData.prayers.map((prayer) => {
                const isNext = prayer.name === prayerData.nextPrayer.name;
                return (
                  <div
                    key={prayer.name}
                    className={`py-2.5 px-1 rounded-2xl text-center border transition-all ${
                      isNext
                        ? isDark
                          ? 'bg-gradient-to-b from-[#DFBA7F]/25 to-[#C9A063]/15 border-[#DFBA7F] ring-2 ring-[#DFBA7F]/30 shadow-md'
                          : 'bg-gradient-to-b from-amber-100 to-amber-50 border-[#A67C38] ring-2 ring-[#A67C38]/20 shadow-sm'
                        : isDark
                        ? 'bg-[#111620]/60 border-stone-800/80 text-stone-400'
                        : 'bg-white/70 border-stone-200 text-stone-600'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-medium tracking-tight ${
                        isNext ? (isDark ? 'text-[#DFBA7F] font-bold' : 'text-[#8E6527] font-bold') : ''
                      }`}
                    >
                      {getPrayerLocalizedName(prayer.name)}
                    </div>
                    <div
                      className={`text-[11px] font-bold font-mono mt-0.5 ${
                        isNext ? (isDark ? 'text-white' : 'text-stone-950') : ''
                      }`}
                    >
                      {prayer.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Access to Daily Prayer Check */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('prayer-check')}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#C9A063]/20 via-[#DFBA7F]/15 to-[#C9A063]/20 hover:from-[#C9A063]/30 hover:to-[#DFBA7F]/30 border border-[#C9A063]/40 text-[#DFBA7F] text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{t(lang, 'dailyPrayerCheck')}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-[#DFBA7F]">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Toggle Calculation & Notification info */}
          <div className="mt-4 pt-3 border-t border-[#C9A063]/15 flex items-center justify-between text-[11px]">
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-1.5 text-stone-400 hover:text-[#DFBA7F] transition-colors group"
              title={lang === 'ar' ? 'انقر لتعديل وتيرة التذكيرات' : 'Click to adjust notification frequency'}
            >
              {userStats.notificationsEnabled ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-[#DFBA7F] group-hover:scale-110 transition-transform" />
                  <span>
                    {t(lang, 'remindersLabel')}:{' '}
                    <strong className="text-[#DFBA7F]">
                      {userStats.personalization?.reminderFrequency === 'Normal' || !userStats.personalization?.reminderFrequency
                        ? t(lang, 'remindersNormal')
                        : userStats.personalization.reminderFrequency}
                    </strong>
                  </span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t(lang, 'remindersLabel')}: <strong className="text-stone-500">{t(lang, 'remindersPaused')}</strong></span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="text-[#DFBA7F] hover:underline font-semibold flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>{t(lang, 'edit')}</span>
            </button>
          </div>
        </div>

        {/* QUR'AN CARD */}
        <div
          id="home-quran-card"
          onClick={() => onNavigate('quran')}
          className={`group rounded-[32px] p-5 sm:p-6 border cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${
            isDark
              ? 'liquid-glass-primary-dark border-[#C9A063]/25 hover:border-[#DFBA7F]/45 shadow-md'
              : 'liquid-glass-primary-light border-[#A67C38]/25 hover:border-[#A67C38]/45 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063]/25 to-[#DFBA7F]/15 border border-[#C9A063]/35 flex items-center justify-center text-[#DFBA7F]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                      {t(lang, 'quranHeader')}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold font-serif-heading ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                    {userStats.quranPagesRead > 0
                      ? `${t(lang, 'surah')} ${userStats.lastReadSurah || 1} • ${t(lang, 'ayah')} ${userStats.lastReadAyah || 1}`
                      : t(lang, 'continueReading')}
                  </h3>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full border border-[#C9A063]/30 bg-[#C9A063]/10 flex items-center justify-center text-[#DFBA7F] group-hover:bg-[#C9A063] group-hover:text-[#080A0E] transition-all">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Arabic Calligraphy Snippet */}
            <div className="p-3.5 rounded-2xl bg-[#080A0E]/30 border border-[#C9A063]/15 my-2 text-center">
              <p className="font-arabic text-xl text-[#DFBA7F]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
              <p className={`text-[11px] font-light mt-1 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {t(lang, 'bismillahTranslation')}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-[#C9A063]/15">
            <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {t(lang, 'pagesReadCount', { count: userStats.quranPagesRead })}
            </span>
            <span className="font-cinzel font-bold text-[#DFBA7F] flex items-center gap-1 group-hover:underline">
              <span>{userStats.quranPagesRead > 0 ? t(lang, 'continueReading') : t(lang, 'quran')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE BENTO ROW: 📿 DHIKR & 🔥 DAILY DUA                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* DHIKR CARD */}
        <div
          id="home-dhikr-card"
          className={`rounded-[30px] p-5 sm:p-6 border flex flex-col justify-between transition-all ${
            isDark
              ? 'liquid-glass-secondary-dark border-[#C9A063]/25 shadow-md'
              : 'liquid-glass-secondary-light border-[#A67C38]/25 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📿</span>
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                  {t(lang, 'tasbihCounter')}
                </span>
              </div>
              <button
                onClick={handleResetDhikr}
                className="text-[10px] text-stone-400 hover:text-stone-200 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-stone-800/40 transition-colors"
                title={lang === 'ar' ? 'إعادة ضبط العداد' : 'Reset counter'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t(lang, 'resetCounter')}</span>
              </button>
            </div>

            {/* Dhikr Arabic & Meaning */}
            <div className="text-center my-3">
              <div className="font-arabic text-2xl font-bold text-[#DFBA7F]">
                {activeDhikrObj.arabic}
              </div>
              {lang !== 'ar' && (
                <div className="text-xs font-semibold text-stone-200 mt-1">
                  {activeDhikrObj.text}
                </div>
              )}
              <div className="text-[11px] text-stone-400 font-light mt-0.5">
                {lang === 'ar' ? activeDhikrObj.meaningAr : activeDhikrObj.meaning}
              </div>
            </div>
          </div>

          {/* Interactive Tap Button */}
          <button
            id="home-dhikr-tap-btn"
            type="button"
            onClick={() => handleIncrementDhikr(1)}
            className={`w-full mt-3 py-3.5 px-4 rounded-2xl font-mono text-center border transition-all duration-150 transform active:scale-95 ${
              isDhikrAnimating
                ? 'scale-95 bg-[#DFBA7F] text-[#080A0E] border-[#DFBA7F] ring-4 ring-[#DFBA7F]/40'
                : 'bg-gradient-to-r from-[#C9A063]/25 via-[#DFBA7F]/20 to-[#C9A063]/25 border-[#DFBA7F]/40 text-[#DFBA7F] hover:bg-[#C9A063]/35'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold">{userStats.dhikrCount}</div>
            <div className="text-[10px] tracking-wider uppercase font-sans font-semibold opacity-80 mt-0.5">
              {t(lang, 'tapToCount')} {lang === 'ar' ? '(+١)' : '(+1)'}
            </div>
          </button>

          <button
            onClick={() => onNavigate('dhikr')}
            className="w-full mt-2.5 py-1.5 text-center text-xs text-[#DFBA7F] hover:text-[#FFE2AA] transition-colors flex items-center justify-center gap-1 opacity-90 hover:opacity-100"
          >
            <span>{t(lang, 'exploreFortressHome')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* DAILY DUA CARD */}
        <div
          id="home-daily-dua-card"
          className={`rounded-[32px] p-5 sm:p-6 border flex flex-col justify-between transition-all ${
            isDark
              ? 'liquid-glass-primary-dark border-[#C9A063]/20 shadow-md'
              : 'liquid-glass-primary-light border-[#A67C38]/20 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#C9A063] fill-[#C9A063]" />
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                  {t(lang, 'dailyReflection')} • {t(lang, 'streak')}: {userStats.overallStreak} {t(lang, 'days')}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSpeakDua}
                  className={`p-1.5 rounded-full hover:bg-stone-800/40 transition-colors ${
                    isSpeakingDua ? 'text-emerald-400 animate-pulse' : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title={t(lang, 'listenAyah')}
                >
                  {isSpeakingDua ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopyDua}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
                  title={t(lang, 'copy')}
                >
                  {copiedDua ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleToggleSaveDua}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
                  title={t(lang, 'saveDua')}
                >
                  <Bookmark className={`w-4 h-4 ${isDuaSaved ? 'text-[#DFBA7F] fill-[#DFBA7F]' : ''}`} />
                </button>
              </div>
            </div>

            <h4 className={`text-base font-serif-heading font-bold ${lang === 'ar' ? 'font-arabic text-right' : ''} ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
              {lang === 'ar' ? (currentDua.titleAr || currentDua.title) : currentDua.title}
            </h4>

            {/* Arabic Text */}
            <p className="font-arabic text-lg sm:text-xl text-[#DFBA7F] text-right my-2 leading-loose">
              {currentDua.arabic}
            </p>

            {/* Transliteration & Translation (Only for non-Arabic) */}
            {lang !== 'ar' && (
              <>
                <p className="text-xs text-stone-300 italic mb-1 font-light">
                  {currentDua.transliteration}
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                  "{currentDua.translation}"
                </p>
              </>
            )}
            {lang === 'ar' && currentDua.benefit && (
              <p className={`text-xs leading-relaxed font-light mt-1 text-right text-stone-300`}>
                {currentDua.benefit}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-[#C9A063]/15 flex items-center justify-between text-[10px] text-stone-400">
            <a
              href="#dhikr-dua-section"
              className="text-[10px] text-[#DFBA7F] hover:underline font-semibold flex items-center gap-0.5 group"
            >
              <span>{t(lang, 'viewAll')}</span>
              <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
            </a>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveDuaIndex((prev) => (prev > 0 ? prev - 1 : DUAS_LIST.length - 1))}
                className="p-1 rounded hover:text-stone-200 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {activeDuaIndex + 1} / {DUAS_LIST.length}
              </span>
              <button
                onClick={() => setActiveDuaIndex((prev) => (prev < DUAS_LIST.length - 1 ? prev + 1 : 0))}
                className="p-1 rounded hover:text-stone-200 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM BENTO ROW: 🤖 NOOR AI HERO & 🎓 LEARN CARD                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ASK NOOR AI (Spans 2 columns on lg) */}
        <div
          id="home-noor-ai-orb-card"
          onClick={() => onNavigate('noor-ai')}
          className={`lg:col-span-2 group relative overflow-hidden rounded-[32px] p-5 sm:p-6 cursor-pointer border transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${
            isDark
              ? 'liquid-glass-orb border-[#DFBA7F]/45 shadow-md'
              : 'bg-gradient-to-r from-amber-500/15 via-amber-200/25 to-amber-500/15 border-[#A67C38]/40 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] flex items-center justify-center text-[#080A0E] shadow-sm ring-2 ring-white/25 shrink-0">
                  <NoorAIIcon className="w-6 h-6 text-[#080A0E] animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-stone-950 shadow-sm" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-cinzel font-bold tracking-wider text-[#DFBA7F]">
                      ✦ {t(lang, 'noorCompanion')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C9A063]/25 text-[#DFBA7F] border border-[#C9A063]/40">
                      {t(lang, 'askNoor')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {t(lang, 'liveGuide')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 font-light mt-0.5">
                    {t(lang, 'noorAiSubheader')}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full border border-[#C9A063]/40 bg-[#C9A063]/15 flex items-center justify-center text-[#DFBA7F] group-hover:bg-[#C9A063] group-hover:text-[#080A0E] transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* LEARN CARD (1 column on lg) */}
        <div
          id="home-learn-card"
          onClick={() => onNavigate('learn')}
          className={`group rounded-[30px] p-5 sm:p-6 border cursor-pointer flex flex-col justify-between transition-all transform hover:-translate-y-0.5 active:scale-[0.99] ${
            isDark
              ? 'liquid-glass-secondary-dark border-[#C9A063]/25 shadow-md'
              : 'liquid-glass-secondary-light border-[#A67C38]/25 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#DFBA7F]" />
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                  {t(lang, 'studyHeader')}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/25">
                {userStats.totalXP} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}
              </span>
            </div>

            <h4 className={`text-base font-bold font-serif-heading mt-2 ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
              {userStats.lessonsCompleted === 0
                ? t(lang, 'startLesson')
                : `${userStats.lessonsCompleted} ${t(lang, 'lessonsCompleted')}`}
            </h4>
            <p className="text-xs text-stone-300 font-light mt-1 line-clamp-2">
              {t(lang, 'studySubheader')}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#C9A063]/15 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#DFBA7F] font-semibold">
              {userStats.completedLessonIds.length === 0 ? t(lang, 'courses') : t(lang, 'continueLesson')}
            </span>
            <span className="font-cinzel font-bold text-[#DFBA7F] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>{t(lang, 'next')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. HOMEPAGE STUDY & ISLAMIC LEARNING SHOWCASE                            */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-[32px] border relative overflow-hidden ${
        isDark ? 'liquid-glass-secondary-dark border-[#DFBA7F]/25 text-stone-100' : 'bg-white/95 border-[#C9A063]/30 text-stone-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold shadow-md shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
                  {lang === 'ar' ? 'التعليم والتفقه في الدين' : 'ISLAMIC STUDY PATH'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DFBA7F]/15 text-[#DFBA7F] border border-[#DFBA7F]/25">
                  {userStats.totalXP} XP
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif-heading font-bold mt-0.5">
                {lang === 'ar' ? 'دروس تفاعلية في التفسير والتجويد والسنة' : 'Interactive Islamic Lessons & Study Tracks'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => onNavigate('learn')}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] text-xs font-bold font-cinzel flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
          >
            <span>{lang === 'ar' ? 'استعراض المسارات' : 'Open Study'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Interactive Study Tracks Carousel/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              titleAr: 'تفسير وتدبر القرآن',
              titleEn: 'Quran Tafsir & Tadabbur',
              descAr: 'فهم معاني الآيات وأسباب النزول',
              descEn: 'Meanings of the verses and context',
              icon: BookOpen,
              tag: 'Tafsir',
              color: 'from-amber-500/20 to-[#DFBA7F]/10',
            },
            {
              titleAr: 'مخارج الحروف والتجويد',
              titleEn: 'Tajweed & Phonology',
              descAr: 'النطق الصحيح لحروف كتاب الله',
              descEn: 'Authentic Arabic articulation & rules',
              icon: Sparkles,
              tag: 'Tajweed',
              color: 'from-emerald-500/20 to-teal-500/10',
            },
            {
              titleAr: 'الأحاديث النبوية والآداب',
              titleEn: 'Prophetic Hadith & Adab',
              descAr: 'الأربعون النووية ومكارم الأخلاق',
              descEn: 'Forty Hadith and noble character',
              icon: Heart,
              tag: 'Hadith',
              color: 'from-blue-500/20 to-indigo-500/10',
            },
            {
              titleAr: 'فقه العبادات والخشوع',
              titleEn: 'Daily Fiqh & Khushu',
              descAr: 'أحكام الطهارة والصلاة والسنن',
              descEn: 'Purity, Salah, and prayer focus',
              icon: Compass,
              tag: 'Fiqh',
              color: 'from-purple-500/20 to-amber-500/10',
            },
          ].map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate('learn')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:-translate-y-0.5 active:scale-95 ${
                  isDark
                    ? 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-[#DFBA7F]/40'
                    : 'bg-white hover:bg-amber-50/50 border-stone-200 hover:border-[#C9A063]/50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${track.color} text-[#DFBA7F]`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                    {track.tag}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold font-serif-heading line-clamp-1 group-hover:text-[#DFBA7F] transition-colors">
                  {lang === 'ar' ? track.titleAr : track.titleEn}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">
                  {lang === 'ar' ? track.descAr : track.descEn}
                </p>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#DFBA7F] font-semibold">
                  <span>{lang === 'ar' ? 'ابدأ الدرس' : 'Start Lesson'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. HOMEPAGE QUICK TASBIH & DHIKR PULSE SHOWCASE CARD                      */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-[32px] border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
        isDark ? 'liquid-glass-secondary-dark border-[#DFBA7F]/25 text-stone-100' : 'bg-white/95 border-[#C9A063]/30 text-stone-900 shadow-sm'
      }`}>
        <div className="space-y-3 flex-1 text-center md:text-left rtl:md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-cinzel font-bold tracking-widest text-[#DFBA7F] uppercase">
              {lang === 'ar' ? 'المسبحة الإلكترونية اليومية' : 'DAILY TASBIH & DHIKR'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              {userStats.dhikrStreak} {lang === 'ar' ? 'أيام متتالية' : 'Days Streak'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif-heading font-bold">
            {lang === 'ar' ? 'ألا بذكر الله تطمئن القلوب' : 'Heartfelt Daily Remembrance'}
          </h3>

          <p className="text-xs text-stone-400 max-w-lg">
            {lang === 'ar'
              ? 'ردد أذكار اليوم المباركة واكسب الحسنات وضاعف رصيدك الإيماني بنقرة واحدة.'
              : 'Recite authentic daily Adhkar to cultivate peace of mind and steady faith.'}
          </p>

          {/* Quick Dhikr Chips */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {dhikrOptions.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => onUpdateStats({ currentDhikrText: opt.text })}
                className={`px-3 py-1.5 rounded-xl text-xs font-arabic border transition-all ${
                  userStats.currentDhikrText === opt.text
                    ? 'bg-[#DFBA7F]/25 border-[#DFBA7F] text-[#DFBA7F] font-bold shadow-xs'
                    : isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                }`}
              >
                {opt.arabic}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Tasbih Tap Button with Peak Pulse Animation */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <button
            onClick={() => handleIncrementDhikr(1)}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full relative flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 ${
              isDhikrAnimating ? 'scale-95' : 'hover:scale-105'
            } bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#FFE3A8] text-[#080B10] shadow-[0_0_30px_rgba(223,186,127,0.5)] animate-peak-pulse`}
          >
            <span className="text-3xl font-bold font-mono tracking-tight leading-none">
              {userStats.dhikrCount}
            </span>
            <span className="text-[10px] font-cinzel uppercase tracking-widest font-bold opacity-80 mt-1">
              {lang === 'ar' ? 'انقر للتسبيح' : 'TAP TASBIH'}
            </span>
          </button>
          <span className="text-[11px] text-stone-400 mt-2 font-mono">
            {lang === 'ar' ? `الهدف: ${userStats.dhikrGoal || 33} تسبيحة` : `Goal: ${userStats.dhikrGoal || 33} counts`}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. SCROLLABLE DHIKR & DU'A SECTION                                        */}
      {/* ========================================================================= */}
      <DhikrDuaSection
        isDark={isDark}
        userStats={userStats}
        onUpdateStats={onUpdateStats}
        onOpenNoorAIWithPrompt={onOpenNoorAIWithPrompt}
      />

      {/* Location Modal */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          isDark={isDark}
          userStats={userStats}
          onClose={() => setIsLocationModalOpen(false)}
          onUpdateStats={(locData) => {
            onUpdateStats(locData);
            setIsLocationModalOpen(false);
          }}
        />
      )}
      </div>
    </PullToRefresh>
  );
};
