import React, { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, GraduationCap, User, Sparkles, Flame, Sun, Moon, ShieldAlert, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import { AppLogoIcon } from './AppLogoIcon';
import { getLanguageCode, isRTLLanguage, t } from '../utils/i18n';

export type NavTab = 'home' | 'ramadan' | 'prayer-check' | 'quran' | 'dhikr' | 'noor-ai' | 'learn' | 'profile';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDark: boolean;
  streak?: number;
  hijriDate?: string;
  onToggleTheme?: () => void;
  userName?: string;
  language?: string;
  lastActivityDate?: string;
  isAtRisk?: boolean;
  riskFormattedTime?: string;
  onOpenStreakRisk?: () => void;
}

export const Navigation: React.FC<NavigationProps> = memo(({
  activeTab,
  onTabChange,
  isDark,
  streak = 0,
  hijriDate,
  onToggleTheme,
  userName,
  language,
  lastActivityDate,
  isAtRisk = false,
  riskFormattedTime,
  onOpenStreakRisk,
}) => {
  const lang = getLanguageCode(language);
  const isRtl = isRTLLanguage(lang);
  const isImmersiveMobile = activeTab === 'noor-ai' || activeTab === 'quran';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Streak pulse and glow state
  const [isStreakGlowing, setIsStreakGlowing] = useState(false);
  const prevStreakRef = useRef(streak);
  const prevDateRef = useRef(lastActivityDate);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerStreakGlow = () => {
    setIsStreakGlowing(true);
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    glowTimerRef.current = setTimeout(() => {
      setIsStreakGlowing(false);
    }, 2800);
  };

  // Trigger whenever a new streak day is recorded (streak increases)
  useEffect(() => {
    if (prevStreakRef.current !== undefined && streak !== undefined && streak > prevStreakRef.current) {
      triggerStreakGlow();
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Trigger whenever daily activity is recorded today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastActivityDate === today && prevDateRef.current !== today) {
      triggerStreakGlow();
    }
    prevDateRef.current = lastActivityDate;
  }, [lastActivityDate]);

  // Listen to global activity completed event
  useEffect(() => {
    const handleActivity = () => {
      triggerStreakGlow();
    };
    window.addEventListener('noor:activity-completed', handleActivity);
    return () => {
      window.removeEventListener('noor:activity-completed', handleActivity);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isCompletedToday = lastActivityDate === todayStr;

  const isArabic = lang === 'ar' || language?.toLowerCase() === 'arabic' || language === 'ar';
  const bottomLogoSrc = isArabic
    ? isDark
      ? 'https://img.sanishtech.com/u/6b5138e1cc808c3100e2c1e21e9bb415.png'
      : 'https://img.sanishtech.com/u/cfa42449de79e4e28b5e89bc3647fb0f.png'
    : isDark
      ? 'https://img.sanishtech.com/u/4839c88e05c99a48b9e5f34c39915b4f.png'
      : 'https://img.sanishtech.com/u/90884012596474b554555f339ebce3f7.png';

  const desktopTabs = [
    { id: 'home' as NavTab, label: t(lang, 'home'), icon: Home, desc: t(lang, 'homeDesc') },
    { id: 'prayer-check' as NavTab, label: t(lang, 'prayerCheck'), icon: ShieldAlert, desc: t(lang, 'prayerCheckDesc') },
    { id: 'quran' as NavTab, label: t(lang, 'quran'), icon: BookOpen, desc: t(lang, 'quranDesc') },
    { id: 'dhikr' as NavTab, label: t(lang, 'dhikr'), icon: Sparkles, desc: t(lang, 'dhikrDesc') },
    { id: 'noor-ai' as NavTab, label: t(lang, 'noorAi'), icon: NoorAIIcon, isSpecial: true, desc: t(lang, 'noorAiDesc') },
    { id: 'learn' as NavTab, label: t(lang, 'study'), icon: GraduationCap, desc: t(lang, 'studyDesc') },
    { id: 'profile' as NavTab, label: t(lang, 'profile'), icon: User, desc: t(lang, 'profileDesc') },
  ];

  // Mobile frame navigation: 5 balanced tabs with Prayer Check and Noor AI
  const mobileTabs = [
    { id: 'home' as NavTab, label: t(lang, 'home'), icon: Home },
    { id: 'prayer-check' as NavTab, label: t(lang, 'prayerCheckShort'), icon: ShieldAlert },
    { id: 'noor-ai' as NavTab, label: t(lang, 'noorAi'), icon: NoorAIIcon, isSpecial: true },
    { id: 'quran' as NavTab, label: t(lang, 'quran'), icon: BookOpen },
    { id: 'profile' as NavTab, label: t(lang, 'profile'), icon: User },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP / LAPTOP FULL-HEIGHT LIQUID GLASS SIDEBAR (>= 1024px)          */}
      {/* ========================================================================= */}
      <aside
        id="desktop-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: isRtl ? 'auto' : 0,
          right: isRtl ? 0 : 'auto',
          height: '100vh',
          zIndex: 40,
        }}
        className={`hidden lg:flex flex-col justify-between w-64 xl:w-72 h-screen max-h-screen h-[100dvh] max-h-[100dvh] fixed top-0 left-0 rtl:left-auto rtl:right-0 shrink-0 z-40 border-r rtl:border-r-0 rtl:border-l p-5 select-none overflow-y-auto overscroll-none scrollbar-none ${
          isDark
            ? 'bg-[#080B0F]/95 border-[#C9A063]/20 backdrop-blur-md text-stone-100'
            : 'bg-white/95 border-[#C9A063]/25 backdrop-blur-md text-stone-900 shadow-sm'
        }`}
        aria-label="Desktop Navigation Sidebar"
      >
        {/* Top: Brand Header */}
        <div>
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-sm shrink-0">
              <AppLogoIcon className="w-full h-full" withContainer={true} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-base font-cinzel font-bold tracking-widest ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                  {isArabic ? 'نور' : 'NOOR'}
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-[#C9A063]" />
                  {t(lang, 'sanctuaryEmblem')}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {hijriDate || t(lang, 'sanctuaryEmblem')}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main menu">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`desktop-nav-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all duration-150 group relative active:scale-[0.98] ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-[#C9A063]/25 to-[#DFBA7F]/15 border border-[#DFBA7F]/40 text-[#DFBA7F] shadow-[0_4px_16px_rgba(201,160,99,0.15)] font-semibold'
                        : 'bg-amber-100/70 border border-[#C9A063]/40 text-[#8E6527] shadow-2xs font-semibold'
                      : isDark
                      ? 'border border-transparent text-stone-300 hover:text-white hover:bg-white/5'
                      : 'border border-transparent text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
                      isActive
                        ? tab.isSpecial
                          ? 'bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#080A0E] shadow-md'
                          : isDark
                          ? 'bg-[#DFBA7F]/20 text-[#DFBA7F]'
                          : 'bg-[#C9A063]/25 text-[#8E6527]'
                        : tab.isSpecial
                        ? 'bg-[#C9A063]/15 text-[#DFBA7F] group-hover:bg-[#C9A063]/25'
                        : isDark
                        ? 'bg-stone-800/60 text-stone-400 group-hover:text-stone-200'
                        : 'bg-stone-100 text-stone-500 group-hover:text-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs tracking-wide">{tab.label}</span>
                      {tab.isSpecial && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30">
                          {isArabic ? 'ذكي' : 'AI'}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? (isDark ? 'text-stone-300' : 'text-stone-600') : 'text-stone-400'}`}>
                      {tab.desc}
                    </p>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#C9A063] to-[#DFBA7F] shadow-[0_0_8px_#DFBA7F] absolute right-2" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Watermark Emblem, Streak Badge, Theme Switcher & User */}
        <div className="space-y-2.5 pt-3 border-t border-[#C9A063]/15">
          {/* Watermark Emblem above the streak count (not in a button / no separate box) */}
          <div className="flex items-center justify-center select-none pointer-events-none py-1 px-2">
            <img
              src={bottomLogoSrc}
              alt="Logo"
              className="h-9 xl:h-10 w-auto max-w-[180px] object-contain opacity-90 hover:opacity-100 transition-opacity select-none pointer-events-none drop-shadow-xs"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const fallback = isArabic
                  ? (isDark ? '/brand-logo-ar-dark.svg' : '/brand-logo-ar-light.svg')
                  : (isDark ? '/brand-logo-en-dark.svg' : '/brand-logo-en-light.svg');
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.includes(fallback)) {
                  img.src = fallback;
                }
              }}
            />
          </div>

          {/* Daily Streak Card with Subtle Pulse & Glow on Activity/Streak Record */}
          <div
            id="desktop-streak-card"
            onClick={isAtRisk && onOpenStreakRisk ? onOpenStreakRisk : undefined}
            className={`p-3 rounded-2xl border flex items-center justify-between relative overflow-hidden transition-all duration-200 ${
              isStreakGlowing
                ? 'animate-streak-glow border-[#DFBA7F] bg-gradient-to-r from-[#C9A063]/30 via-[#DFBA7F]/20 to-[#C9A063]/25 text-[#DFBA7F] shadow-xs'
                : isAtRisk
                ? 'cursor-pointer border-amber-500/60 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 text-amber-300 shadow-xs'
                : isDark
                ? 'bg-[#12161E]/80 border-[#C9A063]/25 text-[#DFBA7F]'
                : 'bg-amber-50/90 border-[#C9A063]/30 text-amber-900 shadow-2xs'
            }`}
          >
            {/* Subtle Radiant Shimmer when glowing */}
            {isStreakGlowing && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFF3D1]/20 to-transparent pointer-events-none" />
            )}

            <div className="flex items-center gap-2.5 relative z-10">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isStreakGlowing
                    ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 scale-110 shadow-xs animate-flame-radiant'
                    : isAtRisk
                    ? 'bg-amber-500/30 text-amber-400 shadow-xs animate-flame-radiant'
                    : isCompletedToday
                    ? 'bg-[#C9A063]/30 shadow-xs'
                    : 'bg-[#C9A063]/20'
                }`}
              >
                <Flame
                  className={`w-4 h-4 transition-all duration-200 ${
                    isStreakGlowing
                      ? 'text-stone-950 fill-stone-950 scale-110'
                      : isAtRisk
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#C9A063] fill-[#C9A063]'
                  }`}
                />
              </div>

              <div>
                <div className="text-[10px] uppercase font-cinzel font-bold text-[#DFBA7F] flex items-center gap-1.5">
                  <span>{t(lang, 'activeStreak')}</span>
                  {isCompletedToday ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]"
                      title={isArabic ? 'سُجل نشاط اليوم' : 'Daily activity recorded today'}
                    />
                  ) : isAtRisk ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]"
                      title={isArabic ? 'حافظ على مسار التزامك! أنجز ورداً أو درساً اليوم' : 'Streak at risk! Complete study or dhikr today'}
                    />
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`text-xs font-bold font-mono transition-all duration-200 ${
                      isStreakGlowing
                        ? 'text-[#FFF2CC] scale-110 font-extrabold'
                        : isAtRisk
                        ? 'text-amber-300 font-extrabold'
                        : ''
                    }`}
                  >
                    {streak} {t(lang, 'days')}
                  </div>
                  {isCompletedToday ? (
                    <span className="text-[9px] font-semibold text-emerald-400 font-mono tracking-tight">
                      ✓ {t(lang, 'done')}
                    </span>
                  ) : isAtRisk ? (
                    <span className="text-[9px] font-bold text-amber-400 font-mono tracking-tight animate-pulse">
                      ⚠️ {riskFormattedTime ? `${riskFormattedTime}` : t(lang, 'atRisk')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-all active:scale-95 relative z-10 ${
                  isDark
                    ? 'bg-stone-800/80 border-stone-700 text-[#DFBA7F] hover:text-white'
                    : 'bg-white border-stone-200 text-stone-700 hover:text-stone-900 shadow-2xs'
                }`}
                title={isArabic ? 'تبديل المظهر' : 'Toggle Theme'}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {userName && (
            <div className="px-2 py-0.5 text-[11px] text-stone-400 flex items-center justify-between">
              <span className="truncate">{userName}</span>
              <span className="text-[10px] text-emerald-400 font-medium">● {t(lang, 'connected')}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop sidebar placeholder spacer to preserve layout flow while sidebar is locked in place */}
      <div
        className="hidden lg:block w-64 xl:w-72 shrink-0 pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 2. MOBILE / TABLET FLOATING LIQUID GLASS NAVIGATION (< 1024px)            */}
      {/* ========================================================================= */}
      {!isImmersiveMobile ? (
        <nav
          id="main-navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 pointer-events-none w-full max-w-lg mx-auto"
          aria-label="Bottom Mobile Navigation"
        >
          <div
            className={`pointer-events-auto rounded-[32px] transition-all duration-200 transform-gpu ${
              isDark
                ? 'liquid-glass-floating-nav-dark text-stone-100'
                : 'liquid-glass-floating-nav-light text-stone-900'
            } px-2.5 py-2 flex items-center justify-around shadow-md`}
          >
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              if (tab.isSpecial) {
                return (
                  <button
                    key={tab.id}
                    id={`nav-${tab.id}`}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className="relative -top-5 flex flex-col items-center group focus:outline-none min-w-[56px] active:scale-95 transition-transform"
                    aria-label={tab.label}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 transform group-hover:scale-105 ${
                        isActive
                          ? 'liquid-glass-orb text-[#080A0E] scale-105 ring-4 ring-[#DFBA7F]/40 shadow-[0_2px_8px_rgba(201,160,99,0.4)]'
                          : isDark
                          ? 'bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#080A0E] shadow-sm'
                          : 'bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#080A0E] shadow-sm'
                      }`}
                    >
                      <Icon className="w-6 h-6 animate-pulse" />
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1 tracking-tight flex items-center gap-0.5 ${
                        isActive
                          ? 'text-[#DFBA7F] font-bold'
                          : isDark
                          ? 'text-stone-300'
                          : 'text-stone-600'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex flex-col items-center py-1.5 px-3 rounded-2xl min-h-[44px] min-w-[48px] justify-center transition-all duration-150 active:scale-90 focus:outline-none ${
                    isActive
                      ? isDark
                        ? 'text-[#DFBA7F] font-medium bg-[#DFBA7F]/10'
                        : 'text-[#8E6527] font-semibold bg-amber-100/60'
                      : isDark
                      ? 'text-stone-400 hover:text-stone-200'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#DFBA7F] rounded-full shadow-[0_0_8px_#DFBA7F]" />
                    )}
                  </div>
                  <span className="text-[11px] mt-1.5 tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : (
        /* In AI and Quran modes on mobile: Hide bottom bar, show floating arrow trigger in top-right frame */
        <motion.button
          id="mobile-drawer-trigger"
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden fixed top-3 right-3 z-40 w-11 h-11 rounded-2xl bg-black/85 backdrop-blur-2xl border border-[#DFBA7F]/60 text-[#DFBA7F] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(201,160,99,0.35)] flex items-center justify-center cursor-pointer group active:scale-95"
          aria-label={isArabic ? 'فتح قائمة التنقل وتغيير الأقسام' : 'Open Navigation & Change Sections'}
          title={isArabic ? 'تغيير الأقسام أو الخروج' : 'Exit or change sections'}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#C9A063]/30 via-[#DFBA7F]/15 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-center">
            <ChevronLeft className={`w-5 h-5 text-[#DFBA7F] transition-transform duration-200 group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180 group-hover:translate-x-0.5' : ''}`} />
          </div>
        </motion.button>
      )}

      {/* Mobile Left-Side Navigation Drawer with Premium Spring & Exit Animation */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            key="mobile-nav-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut' }}
            className="lg:hidden fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <motion.div
              key="mobile-nav-drawer-panel"
              initial={{ x: isRtl ? '100%' : '-100%', opacity: 0.8, scale: 0.98 }}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1,
                transition: {
                  type: 'spring',
                  damping: 28,
                  stiffness: 320,
                  mass: 0.8,
                },
              }}
              exit={{
                x: isRtl ? '100%' : '-100%',
                opacity: 0,
                scale: 0.93,
                transition: {
                  duration: 0.28,
                  ease: [0.32, 0.72, 0, 1], // iOS-style fluid cubic-bezier curve
                },
              }}
              className={`w-72 sm:w-80 h-full p-5 flex flex-col justify-between border-r rtl:border-r-0 rtl:border-l shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative ${
                isDark
                  ? 'bg-[#080B0F]/98 border-[#C9A063]/30 text-stone-100'
                  : 'bg-white/98 border-[#C9A063]/30 text-stone-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header with Logo & Close Button */}
              <div>
                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <AppLogoIcon className="w-full h-full" withContainer={true} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h1 className={`text-base font-cinzel font-bold tracking-widest ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                          {isArabic ? 'نور' : 'NOOR'}
                        </h1>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5 text-[#C9A063]" />
                          {t(lang, 'sanctuaryEmblem')}
                        </span>
                      </div>
                      <p className={`text-[10px] font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {hijriDate || t(lang, 'sanctuaryEmblem')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Tabs */}
                <nav className="space-y-1.5" aria-label="Mobile Drawer Navigation">
                  {desktopTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onTabChange(tab.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 group relative active:scale-[0.98] ${
                          isActive
                            ? isDark
                              ? 'bg-gradient-to-r from-[#C9A063]/25 to-[#DFBA7F]/15 border border-[#DFBA7F]/40 text-[#DFBA7F] font-semibold'
                              : 'bg-amber-100/70 border border-[#C9A063]/40 text-[#8E6527] font-semibold'
                            : isDark
                            ? 'border border-transparent text-stone-300 hover:text-white hover:bg-white/5'
                            : 'border border-transparent text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform shrink-0 ${
                            isActive
                              ? tab.isSpecial
                                ? 'bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#080A0E] shadow-md'
                                : isDark
                                ? 'bg-[#DFBA7F]/20 text-[#DFBA7F]'
                                : 'bg-[#C9A063]/25 text-[#8E6527]'
                              : tab.isSpecial
                              ? 'bg-[#C9A063]/15 text-[#DFBA7F]'
                              : isDark
                              ? 'bg-stone-800/60 text-stone-400'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs tracking-wide">{tab.label}</span>
                            {tab.isSpecial && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30">
                                {isArabic ? 'ذكي' : 'AI'}
                              </span>
                            )}
                          </div>
                        </div>

                        {isActive && (
                          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#C9A063] to-[#DFBA7F] shadow-[0_0_8px_#DFBA7F]" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Drawer Footer: Streak, Theme Toggle */}
              <div className="space-y-2.5 pt-3 border-t border-[#C9A063]/20">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#DFBA7F]" />
                    <span className="text-xs font-mono font-bold text-[#DFBA7F]">{streak} {t(lang, 'days')}</span>
                  </div>

                  {onToggleTheme && (
                    <button
                      onClick={onToggleTheme}
                      className={`p-2 rounded-xl border transition-all active:scale-95 ${
                        isDark
                          ? 'bg-stone-800/80 border-stone-700 text-[#DFBA7F]'
                          : 'bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

