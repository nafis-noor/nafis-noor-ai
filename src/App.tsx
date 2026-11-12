/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserStats } from './types';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { QuranScreen } from './components/QuranScreen';
import { NoorAIScreen } from './components/NoorAIScreen';
import { StudyDashboard } from './components/study/StudyDashboard';
import { ProfileScreen } from './components/ProfileScreen';
import { DhikrDuaSection } from './components/DhikrDuaSection';
import { PrayerCheckScreen } from './components/prayerCheck/PrayerCheckScreen';
import { NoorRamadanScreen } from './components/ramadan/NoorRamadanScreen';
import { DailyInspirationPulseModal } from './components/ramadan/DailyInspirationPulseModal';
import { getInspirationPulseForDay } from './utils/ramadanContent';
import { detectRamadanStatus } from './utils/hijriCalendar';
import { AuthWelcomeScreen } from './components/AuthWelcomeScreen';
import { FirstTimeLanguageScreen } from './components/FirstTimeLanguageScreen';
import { PrayerNotificationToast } from './components/PrayerNotificationToast';
import { StreakWarningToast } from './components/StreakWarningToast';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pageVariants,
  parallaxBackgroundVariants,
  SPRING_TRANSITION,
} from './utils/animations';
import {
  evaluateStreakIntegrity,
  checkStreakRisk,
  StreakRiskStatus,
  getMillisecondsUntilMidnight,
  getLocalDateString,
} from './utils/streakManager';
import {
  syncAccountData,
  getActiveSession,
  logoutAccount,
  verifyAdminSessionWithServer,
} from './utils/accountManager';
import { subscribeToUserDocument } from './lib/firebase';
import {
  scheduleDynamicPrayerNotifications,
  PrayerNotificationEvent,
  sendBrowserNotification,
} from './utils/notificationService';
import {
  initHistory,
  pushTabNavigation,
  onTabHistoryChange,
  onExitRequested,
  useBackHandler,
} from './utils/historyManager';
import {
  getLanguageCode,
  isRTLLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  setGlobalLanguage,
} from './utils/i18n';

// Pure CSS Star Particles - Maximum 24 particles, GPU optimized, zero JS calculation
const CSS_STARS = [
  { top: '8%', left: '15%', size: '1.5px', delay: '0s', duration: '2.8s' },
  { top: '14%', left: '72%', size: '2px', delay: '0.4s', duration: '3.2s' },
  { top: '22%', left: '38%', size: '1px', delay: '1.2s', duration: '2.5s' },
  { top: '28%', left: '88%', size: '2.5px', delay: '0.8s', duration: '3.6s' },
  { top: '35%', left: '8%', size: '1.5px', delay: '1.6s', duration: '3s' },
  { top: '42%', left: '55%', size: '2px', delay: '0.2s', duration: '2.7s' },
  { top: '48%', left: '26%', size: '1px', delay: '1.9s', duration: '3.4s' },
  { top: '56%', left: '82%', size: '2px', delay: '0.7s', duration: '2.9s' },
  { top: '63%', left: '19%', size: '1.5px', delay: '1.3s', duration: '3.1s' },
  { top: '69%', left: '64%', size: '2px', delay: '0.5s', duration: '3.5s' },
  { top: '75%', left: '42%', size: '1px', delay: '1.7s', duration: '2.6s' },
  { top: '83%', left: '91%', size: '2px', delay: '1.1s', duration: '3.3s' },
  { top: '89%', left: '12%', size: '1.5px', delay: '0.3s', duration: '2.8s' },
  { top: '18%', left: '48%', size: '2px', delay: '2.1s', duration: '3.2s' },
  { top: '31%', left: '78%', size: '1.5px', delay: '1.5s', duration: '3s' },
  { top: '52%', left: '4%', size: '2px', delay: '0.9s', duration: '2.7s' },
  { top: '67%', left: '94%', size: '1px', delay: '2.3s', duration: '3.4s' },
  { top: '79%', left: '31%', size: '2px', delay: '0.6s', duration: '3.1s' },
  { top: '92%', left: '68%', size: '1.5px', delay: '1.8s', duration: '2.9s' },
  { top: '11%', left: '33%', size: '1.5px', delay: '2s', duration: '3.5s' },
  { top: '45%', left: '85%', size: '2px', delay: '1.4s', duration: '2.8s' },
  { top: '59%', left: '45%', size: '1px', delay: '0.1s', duration: '3.2s' },
  { top: '71%', left: '10%', size: '2px', delay: '1.6s', duration: '3s' },
  { top: '86%', left: '52%', size: '1.5px', delay: '2.2s', duration: '3.3s' },
];

const INITIAL_ZERO_STATS: UserStats = {
  isLoggedIn: false,
  hasCompletedWelcome: false,
  userName: '',
  userLocation: 'Makkah',
  language: 'English',
  notificationsEnabled: true,
  themePreference: 'dark',
  overallStreak: 0,
  quranStreak: 0,
  learningStreak: 0,
  dhikrStreak: 0,
  completedLessonIds: [],
  quranPagesRead: 0,
  quranGoalPages: 5,
  dhikrCount: 0,
  dhikrGoal: 33,
  currentDhikrText: 'SubhanAllah',
  totalXP: 0,
  lessonsCompleted: 0,
  lastReadSurah: 1, // Al-Fatihah
  lastReadAyah: 1,
  bookmarks: [],
  savedDuas: [],
  completedDhikrIds: [],
  prayerHistory: [],
  unlockedAchievements: [],
  activityHistory: [],
  noorAiConversation: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('reviewFeedback') && searchParams.has('reviewToken')) {
        return 'profile';
      }
      if (window.location.pathname === '/noor-ramadan' || window.location.hash === '#noor-ramadan' || window.location.hash === '#ramadan') {
        return 'ramadan';
      }
      if (window.location.pathname === '/prayer-check' || window.location.hash === '#prayer-check') {
        return 'prayer-check';
      }
    }
    return 'home';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('noor_theme_mode') as 'light' | 'dark' | 'system' | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    const legacy = localStorage.getItem('noor_theme');
    return legacy === 'light' ? 'light' : 'dark';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('noor_theme_mode');
    if (savedMode === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    const saved = localStorage.getItem('noor_theme');
    return saved ? saved === 'dark' : true;
  });

  // Dynamic system theme listener and theme mode effect
  useEffect(() => {
    localStorage.setItem('noor_theme_mode', themeMode);
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode]);

  const [userStats, setUserStats] = useState<UserStats>(() => {
    // 1. Check saved user stats first for robust session persistence across refreshes (preventing auto-logout)
    const saved = localStorage.getItem('noor_user_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.isLoggedIn) {
          return { ...INITIAL_ZERO_STATS, ...parsed };
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Check active account session store
    const activeAccount = getActiveSession();
    if (activeAccount && activeAccount.stats) {
      return { ...INITIAL_ZERO_STATS, ...activeAccount.stats, isLoggedIn: true };
    }

    return INITIAL_ZERO_STATS;
  });



  const [selectedSurahForQuran, setSelectedSurahForQuran] = useState<number | undefined>(undefined);
  const [initialPromptForNoorAI, setInitialPromptForNoorAI] = useState<string | undefined>(undefined);
  const [activeNotification, setActiveNotification] = useState<PrayerNotificationEvent | null>(null);
  const [streakRiskStatus, setStreakRiskStatus] = useState<StreakRiskStatus | null>(null);
  const [isStreakWarningDismissed, setIsStreakWarningDismissed] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // 24-Hour Daily Inspiration Pulse popup state
  const [isRamadanPulseOpen, setIsRamadanPulseOpen] = useState(false);
  const [pulseDayIndex, setPulseDayIndex] = useState(1);

  // Check every 24h for the Ramadan Inspiration Pulse (Active ONLY during Ramadan)
  useEffect(() => {
    if (!userStats.isLoggedIn) return;

    let isMounted = true;
    detectRamadanStatus(userStats.userLatitude, userStats.userLongitude).then((status) => {
      if (!isMounted) return;
      if (!status.isRamadan) {
        setIsRamadanPulseOpen(false);
        return;
      }

      const today = getLocalDateString();
      const isEngaged = localStorage.getItem(`noor_pulse_engaged_${today}`) === 'true';
      const isTempDismissed = sessionStorage.getItem(`noor_pulse_temp_${today}`) === 'true';

      const dayNumber = Math.max(1, Math.min(30, status.day || 1));
      setPulseDayIndex(dayNumber);

      if (!isEngaged && !isTempDismissed) {
        const timer = setTimeout(() => {
          if (isMounted) setIsRamadanPulseOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userStats.isLoggedIn, userStats.userLatitude, userStats.userLongitude]);

  const handleDismissPulseTemporarily = () => {
    const today = getLocalDateString();
    sessionStorage.setItem(`noor_pulse_temp_${today}`, 'true');
    setIsRamadanPulseOpen(false);
  };

  const handleEngagePulseComplete = () => {
    const today = getLocalDateString();
    localStorage.setItem(`noor_pulse_engaged_${today}`, 'true');
    setIsRamadanPulseOpen(false);
  };

  // Check if initial language was already chosen
  const [hasSelectedInitialLanguage, setHasSelectedInitialLanguage] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('reviewFeedback') && searchParams.has('reviewToken')) {
        return true;
      }
    }
    const configured = localStorage.getItem('noor_language_configured');
    if (configured === 'true') return true;
    const saved = localStorage.getItem('noor_user_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.language && parsed.isLoggedIn) return true;
      } catch {
        // continue
      }
    }
    return false;
  });

  const handleSelectInitialLanguage = (code: SupportedLanguageCode) => {
    localStorage.setItem('noor_language_configured', 'true');
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    const langName = langObj ? langObj.name : 'English';
    handleUpdateStats({ language: langName });
    setHasSelectedInitialLanguage(true);
    const isRtl = isRTLLanguage(code);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
  };

  // Dynamic background prayer time notification scheduler
  useEffect(() => {
    if (!userStats.isLoggedIn || userStats.notificationsEnabled === false) {
      return;
    }

    // Schedule dynamically based on exact remaining time until the next prayer reminder
    const cleanup = scheduleDynamicPrayerNotifications(userStats, (event) => {
      setActiveNotification(event);
    });

    return () => cleanup();
  }, [
    userStats.isLoggedIn,
    userStats.notificationsEnabled,
    userStats.userLocation,
    userStats.userLatitude,
    userStats.userLongitude,
    userStats.prayerCalculationMethod,
    userStats.asrJuristicMethod,
    userStats.personalization?.reminderFrequency,
  ]);

  // Automated 24-Hour Streak Evaluator & Real-Time Risk Warning Daemon
  useEffect(() => {
    if (!userStats.isLoggedIn) {
      setStreakRiskStatus(null);
      return;
    }

    const evaluateAndCheckRisk = () => {
      // 1. Validate streak integrity (24h calendar boundary & rollover)
      const streakUpdates = evaluateStreakIntegrity(userStats);
      if (streakUpdates) {
        setUserStats((prev) => ({ ...prev, ...streakUpdates }));
      }

      // 2. Assess if the user's streak is in danger of being lost today
      const risk = checkStreakRisk(userStats);
      setStreakRiskStatus(risk);

      // 3. If at risk, check if we should dispatch a browser push notification
      if (risk.isAtRisk && userStats.notificationsEnabled !== false) {
        const todayStr = risk.todayDate;
        const lastNotifiedKey = `noor_streak_warned_${todayStr}`;
        const hasBeenNotifiedToday = sessionStorage.getItem(lastNotifiedKey) === 'true';

        if (!hasBeenNotifiedToday) {
          sessionStorage.setItem(lastNotifiedKey, 'true');
          sendBrowserNotification(
            `🔥 Don't lose your ${risk.currentStreak}-day streak!`,
            `Only ${risk.formattedTime} left today! Complete a quick Dhikr, Quran page, or Study session before midnight to keep your streak alive.`,
            'noor-streak-warning'
          );
        }
      }
    };

    evaluateAndCheckRisk();

    // 60-second periodic heartbeat for real-time countdown & risk updates
    const intervalId = setInterval(evaluateAndCheckRisk, 60000);

    // Exact midnight timer for 24-hour day rollover
    const msUntilMidnight = getMillisecondsUntilMidnight();
    const midnightTimer = setTimeout(() => {
      evaluateAndCheckRisk();
    }, msUntilMidnight + 1000);

    window.addEventListener('focus', evaluateAndCheckRisk);
    document.addEventListener('visibilitychange', evaluateAndCheckRisk);

    return () => {
      clearInterval(intervalId);
      clearTimeout(midnightTimer);
      window.removeEventListener('focus', evaluateAndCheckRisk);
      document.removeEventListener('visibilitychange', evaluateAndCheckRisk);
    };
  }, [
    userStats.isLoggedIn,
    userStats.lastActivityDate,
    userStats.overallStreak,
    userStats.notificationsEnabled,
  ]);

  // When daily activity is logged, clear any dismissed state and risk
  useEffect(() => {
    const today = getLocalDateString();
    if (userStats.lastActivityDate === today) {
      setIsStreakWarningDismissed(false);
      setStreakRiskStatus((prev) => (prev ? { ...prev, isAtRisk: false, hasActivityToday: true } : null));
    }
  }, [userStats.lastActivityDate]);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('noor_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Real language direction and language attribute handling
  useEffect(() => {
    const langCode = getLanguageCode(userStats.language);
    setGlobalLanguage(langCode);
    const isRtl = isRTLLanguage(langCode);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', langCode);
  }, [userStats.language]);

  // Sync user stats locally and to account cloud database if logged in
  useEffect(() => {
    if (userStats.isLoggedIn) {
      localStorage.setItem('noor_user_stats', JSON.stringify(userStats));
      if (userStats.accountId) {
        syncAccountData(userStats.accountId, userStats);
      }
    }
  }, [userStats]);

  // Firestore real-time subscription when user is logged in
  useEffect(() => {
    if (!userStats.isLoggedIn || !userStats.accountId) return;

    const unsubscribe = subscribeToUserDocument(userStats.accountId, (docData) => {
      if (docData && docData.stats) {
        setUserStats((current) => {
          // Merge incoming remote stats if remote is updated
          if (JSON.stringify(current.bookmarks) !== JSON.stringify(docData.stats.bookmarks) ||
              current.overallStreak !== docData.stats.overallStreak ||
              current.totalXP !== docData.stats.totalXP) {
            return {
              ...current,
              ...docData.stats,
              isLoggedIn: true,
            };
          }
          return current;
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userStats.isLoggedIn, userStats.accountId]);

  const handleUpdateStats = (newStats: Partial<UserStats>) => {
    setUserStats((prev) => {
      const updated = { ...prev, ...newStats };
      if (updated.accountId && updated.isLoggedIn) {
        syncAccountData(updated.accountId, updated);
      }
      return updated;
    });

    // Notify components when any daily activity or streak update occurs
    if (
      newStats.lastActivityDate !== undefined ||
      newStats.overallStreak !== undefined ||
      newStats.dhikrCount !== undefined ||
      newStats.quranPagesRead !== undefined ||
      newStats.lessonsCompleted !== undefined
    ) {
      window.dispatchEvent(
        new CustomEvent('noor:activity-completed', {
          detail: {
            streak: newStats.overallStreak,
            lastActivityDate: newStats.lastActivityDate,
          },
        })
      );
    }
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const nextMode = nextDark ? 'dark' : 'light';
    setThemeMode(nextMode);
    handleUpdateStats({ themePreference: nextMode });
  };

  const handleSelectThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleUpdateStats({ themePreference: mode });
  };

  const navigateToTab = (tab: NavTab, pushHistory = true) => {
    if (tab !== 'quran') setSelectedSurahForQuran(undefined);
    if (tab !== 'noor-ai') setInitialPromptForNoorAI(undefined);
    if (pushHistory) {
      pushTabNavigation(tab);
    }
    // Synchronize browser URL bar for /prayer-check and /noor-ramadan mounts
    if (typeof window !== 'undefined') {
      try {
        if (tab === 'ramadan' && window.location.pathname !== '/noor-ramadan') {
          window.history.pushState({ tab: 'ramadan' }, '', '/noor-ramadan');
        } else if (tab === 'prayer-check' && window.location.pathname !== '/prayer-check') {
          window.history.pushState({ tab: 'prayer-check' }, '', '/prayer-check');
        } else if (tab !== 'prayer-check' && tab !== 'ramadan' && (window.location.pathname === '/prayer-check' || window.location.pathname === '/noor-ramadan')) {
          window.history.pushState({ tab }, '', '/');
        }
      } catch {
        // ignore
      }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // Listen for direct URL routing or hash navigation to /prayer-check or /noor-ramadan
  useEffect(() => {
    const handleUrlRouting = () => {
      if (window.location.pathname === '/noor-ramadan' || window.location.hash === '#noor-ramadan' || window.location.hash === '#ramadan') {
        setActiveTab('ramadan');
      } else if (window.location.pathname === '/prayer-check' || window.location.hash === '#prayer-check') {
        setActiveTab('prayer-check');
      }
    };
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  // Synchronize browser history and popstate navigation
  useEffect(() => {
    initHistory(activeTab);
    const unregisterTab = onTabHistoryChange((prevTab) => {
      navigateToTab(prevTab, false);
    });
    const unregisterExit = onExitRequested(() => {
      setIsExitModalOpen(true);
    });
    return () => {
      unregisterTab();
      unregisterExit();
    };
  }, []);

  // Back button hooks for app-level overlays, active reading
  useBackHandler(Boolean(selectedSurahForQuran), () => setSelectedSurahForQuran(undefined), 'surah-selection');
  useBackHandler(Boolean(activeNotification), () => setActiveNotification(null), 'prayer-toast');
  useBackHandler(
    Boolean(streakRiskStatus?.isAtRisk && !isStreakWarningDismissed),
    () => setIsStreakWarningDismissed(true),
    'streak-warning-toast'
  );

  const handleOpenQuranSurah = (surahNumber: number) => {
    setSelectedSurahForQuran(surahNumber);
    navigateToTab('quran');
  };

  const handleOpenNoorAIWithPrompt = (prompt: string) => {
    setInitialPromptForNoorAI(prompt);
    navigateToTab('noor-ai');
  };

  // Called when user registers + finishes onboarding or logs in
  const handleAuthenticated = (authenticatedStats: UserStats) => {
    setUserStats(authenticatedStats);
    if (authenticatedStats.themePreference) {
      setIsDark(authenticatedStats.themePreference === 'dark');
    }
    setActiveTab('home');
  };

  const handleLogout = () => {
    logoutAccount();
    localStorage.removeItem('noor_active_session_id');
    localStorage.removeItem('noor_user_stats');
    sessionStorage.removeItem('noor_admin_token');
    setUserStats({
      ...INITIAL_ZERO_STATS,
      isLoggedIn: false,
      hasCompletedWelcome: false,
    });
    setActiveTab('home');
  };

  const handleResetAllData = () => {
    logoutAccount();
    localStorage.removeItem('noor_user_stats');
    localStorage.removeItem('noor_active_session_id');
    setUserStats(INITIAL_ZERO_STATS);
  };

  // Get Hijri Date formatted (e.g. 14 Sha'ban 1447 AH)
  const getHijriDate = () => {
    try {
      const today = new Date();
      return (
        new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(today) + ' AH'
      );
    } catch {
      return "14 Sha'ban 1447 AH";
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans ${
        isDark ? 'bg-[#06080B] text-stone-100' : 'bg-[#FAF9F5] text-stone-900'
      }`}
    >
      {/* Dynamic Background Glow Layer & Pure CSS Stars with Parallax Offset */}
      <motion.div
        key={`parallax-bg-${activeTab}`}
        variants={parallaxBackgroundVariants}
        initial="initial"
        animate="animate"
        className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-200 ${
          isDark ? 'islamic-pattern opacity-60' : 'islamic-pattern-light opacity-75'
        }`}
      >
        <div
          className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(201, 160, 99, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(201, 160, 99, 0.1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[35%] right-[-15%] w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(223, 186, 127, 0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(223, 186, 127, 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(140, 107, 50, 0.07) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(201, 160, 99, 0.06) 0%, transparent 70%)',
          }}
        />
        {/* CSS-Only Celestial Star Particles (Strictly 24 particles, zero JS loops) */}
        {CSS_STARS.map((star, idx) => (
          <span
            key={idx}
            className="star-particle"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </motion.div>

      {/* FIRST-TIME ONBOARDING: If user has never selected a language, show language screen */}
      {!hasSelectedInitialLanguage ? (
        <FirstTimeLanguageScreen
          isDark={isDark}
          onSelectLanguage={handleSelectInitialLanguage}
        />
      ) : !userStats.isLoggedIn ? (
        /* AUTHENTICATION MUST COME FIRST: If user is not authenticated, show AuthWelcomeScreen */
        <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
          <AuthWelcomeScreen
            isDark={isDark}
            onAuthenticated={handleAuthenticated}
            onToggleTheme={handleToggleTheme}
            initialZeroStats={INITIAL_ZERO_STATS}
            language={userStats.language}
          />
        </div>
      ) : (
        /* Authenticated Main Application: Full-Screen Viewport (Slides up with spring physics) */
        <motion.div
          key="main-app-shell"
          initial={{ y: 35, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transitionEnd: { transform: 'none' } }}
          transition={SPRING_TRANSITION}
          className="relative z-10 flex flex-col lg:flex-row min-h-screen min-h-[100dvh] w-full"
        >
          {/* Sidebar for Desktop / Bottom Nav for Mobile */}
          <Navigation
            activeTab={activeTab}
            onTabChange={(tab) => navigateToTab(tab)}
            isDark={isDark}
            streak={userStats.overallStreak}
            lastActivityDate={userStats.lastActivityDate}
            isAtRisk={Boolean(streakRiskStatus?.isAtRisk)}
            riskFormattedTime={streakRiskStatus?.formattedTime}
            onOpenStreakRisk={() => setIsStreakWarningDismissed(false)}
            hijriDate={getHijriDate()}
            onToggleTheme={handleToggleTheme}
            userName={userStats.userName}
            language={userStats.language}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen min-h-[100dvh]">
            {/* Mobile Header (Hidden on lg screens, and hidden on mobile when in AI or Quran mode) */}
            {activeTab !== 'noor-ai' && activeTab !== 'quran' && (
              <Header
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                streak={userStats.overallStreak}
                isAtRisk={Boolean(streakRiskStatus?.isAtRisk)}
                riskFormattedTime={streakRiskStatus?.formattedTime}
                onOpenStreakRisk={() => setIsStreakWarningDismissed(false)}
                hijriDate={getHijriDate()}
                language={userStats.language}
              />
            )}

            {/* Main View Screens with Page Transitions */}
            <main className="flex-1 min-w-0 w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {activeTab === 'home' && (
                    <HomeScreen
                      isDark={isDark}
                      userStats={userStats}
                      onUpdateStats={handleUpdateStats}
                      onNavigate={(tab) => {
                        if (tab !== 'quran') setSelectedSurahForQuran(undefined);
                        setActiveTab(tab);
                        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                      }}
                      onOpenQuranSurah={handleOpenQuranSurah}
                      onOpenNoorAIWithPrompt={handleOpenNoorAIWithPrompt}
                    />
                  )}

                  {activeTab === 'quran' && (
                    <QuranScreen
                      isDark={isDark}
                      userStats={userStats}
                      onUpdateStats={handleUpdateStats}
                      initialSurahNumber={selectedSurahForQuran}
                      language={userStats.language}
                    />
                  )}

                  {activeTab === 'dhikr' && (
                    <DhikrDuaSection
                      isDark={isDark}
                      userStats={userStats}
                      onUpdateStats={handleUpdateStats}
                      onOpenNoorAIWithPrompt={handleOpenNoorAIWithPrompt}
                      isStandalonePage={true}
                    />
                  )}

                  {activeTab === 'noor-ai' && (
                    <NoorAIScreen
                      isDark={isDark}
                      initialPrompt={initialPromptForNoorAI}
                      userStats={userStats}
                      onUpdateStats={handleUpdateStats}
                      messages={userStats.noorAiConversation || []}
                      onUpdateMessages={(msgs) => handleUpdateStats({ noorAiConversation: msgs })}
                    />
                  )}

                  {activeTab === 'ramadan' && (
                    <NoorRamadanScreen
                      isDark={isDark}
                      language={userStats.language}
                      userLocation={userStats.userLocation}
                      onOpenNoorAIWithPrompt={handleOpenNoorAIWithPrompt}
                      onNavigate={(tab) => navigateToTab(tab as NavTab)}
                    />
                  )}

                  {activeTab === 'prayer-check' && (
                    <PrayerCheckScreen
                      isDark={isDark}
                      userLocation={userStats.userLocation}
                      userLatitude={userStats.userLatitude}
                      userLongitude={userStats.userLongitude}
                      language={userStats.language}
                      onNavigate={(tab) => navigateToTab(tab as NavTab)}
                    />
                  )}

                  {activeTab === 'learn' && (
                    <StudyDashboard
                      isDark={isDark}
                      language={userStats.language}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <ProfileScreen
                      isDark={isDark}
                      onToggleTheme={handleToggleTheme}
                      themePreference={themeMode}
                      onSelectThemePreference={handleSelectThemeMode}
                      userStats={userStats}
                      onUpdateStats={handleUpdateStats}
                      onOpenQuranSurah={handleOpenQuranSurah}
                      onAccountLoaded={(stats) => setUserStats(stats)}
                      onLogout={handleLogout}
                      onResetAllData={handleResetAllData}
                      onNavigateToRamadan={() => navigateToTab('ramadan')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      )}

      {/* Floating In-App Prayer Notification Toast */}
      <PrayerNotificationToast
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
        onNavigateToTab={(tab) => {
          navigateToTab(tab as NavTab);
        }}
        isDark={isDark}
        language={userStats.language}
      />

      {/* Floating In-App Streak Risk Warning Alert (when user is about to lose streak) */}
      <StreakWarningToast
        status={isStreakWarningDismissed ? null : streakRiskStatus}
        onDismiss={() => setIsStreakWarningDismissed(true)}
        onNavigate={(tab) => {
          navigateToTab(tab as NavTab);
          setIsStreakWarningDismissed(true);
        }}
        isDark={isDark}
        language={userStats.language}
      />

      {/* Application Exit Confirmation Warning Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        streakCount={userStats.overallStreak}
        lastActivityDate={userStats.lastActivityDate}
        isDark={isDark}
        language={userStats.language}
      />

      {/* 24-Hour Daily Inspiration Pulse Modal */}
      <DailyInspirationPulseModal
        isOpen={isRamadanPulseOpen}
        onDismissTemporarily={handleDismissPulseTemporarily}
        onEngagedComplete={handleEngagePulseComplete}
        item={getInspirationPulseForDay(pulseDayIndex)}
        dayNumber={pulseDayIndex}
        isDark={isDark}
        language={userStats.language}
      />
    </div>
  );
}
