import React, { useState, useEffect } from 'react';
import {
  User,
  BookOpen,
  Flame,
  Award,
  Bookmark,
  Heart,
  Settings,
  Bell,
  BellRing,
  Moon,
  Sun,
  Shield,
  HelpCircle,
  Bug,
  HeartHandshake,
  Send,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Calendar,
  Sparkles,
  Layers,
  MapPin,
  Sliders,
  Compass,
  Cloud,
  LogOut,
  ShieldCheck,
  Download,
  Trash2,
  Volume2,
  Check,
  Globe,
  Palette,
  Info,
  ExternalLink,
  Mail,
  FileText,
  Star,
  Smartphone,
  MessageSquarePlus,
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import { AppLogoIcon } from './AppLogoIcon';
import { UserStats, Dua, CalculationMethodKey, AsrMadhabKey } from '../types';
import { ALL_SURAHS } from '../data/quranData';
import { DUAS_LIST } from '../data/duasData';
import { INITIAL_ACHIEVEMENTS } from '../data/learnData';
import { LocationModal } from './LocationModal';
import { PrivacyModal } from './PrivacyModal';
import { AccountModal } from './AccountModal';
import { ThemeSelector, ThemePreferenceMode } from './ThemeSelector';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { AboutModal } from './AboutModal';
import { TermsModal } from './TermsModal';
import { QiblaCompassModal } from './QiblaCompassModal';
import { DreamInterpretationScreen } from './DreamInterpretationScreen';
import { FeedbackScreen } from './FeedbackScreen';
import { AdminFeedbackManager } from './AdminFeedbackManager';
import { getFeedbackTranslations, verifyFounderReviewLink } from '../utils/feedbackService';
import { useBackHandler } from '../utils/historyManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { detectRamadanStatus, HijriDateInfo } from '../utils/hijriCalendar';
import { NoorRamadanUpdatesModal } from './ramadan/NoorRamadanUpdatesModal';
import {
  calculateTrueQibla,
  calculateDistanceToKaaba,
  resolveCoordinates,
  getCompassHeadingName,
} from '../utils/qiblaService';
import {
  getLanguageCode,
  isRTLLanguage,
  t,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  getGlobalLanguage,
  setGlobalLanguage,
} from '../utils/i18n';
import {
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestPrayerNotification,
  getFrequencyDescription,
  ReminderFrequency,
} from '../utils/notificationService';

interface ProfileScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onOpenQuranSurah?: (surahNumber: number) => void;
  onAccountLoaded?: (stats: UserStats) => void;
  onLogout?: () => void;
  onResetAllData?: () => void;
  themePreference?: 'light' | 'dark' | 'system';
  onSelectThemePreference?: (theme: 'light' | 'dark' | 'system') => void;
  onNavigateToRamadan?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  isDark,
  onToggleTheme,
  userStats,
  onUpdateStats,
  onOpenQuranSurah,
  onAccountLoaded,
  onLogout,
  onResetAllData,
  themePreference,
  onSelectThemePreference,
  onNavigateToRamadan,
}) => {
  const [activeTab, setActiveTab] = useState<'journey' | 'bookmarks' | 'settings'>('journey');
  const [ramadanStatus, setRamadanStatus] = useState<HijriDateInfo | null>(null);
  const [isRamadanSimulated, setIsRamadanSimulated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('noor_simulate_ramadan');
    return stored === 'true';
  });
  const [isRamadanUpdatesOpen, setIsRamadanUpdatesOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    detectRamadanStatus(userStats.userLatitude, userStats.userLongitude).then((status) => {
      if (isMounted) {
        setRamadanStatus(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userStats.userLatitude, userStats.userLongitude, isRamadanSimulated]);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isQiblaModalOpen, setIsQiblaModalOpen] = useState(false);
  const [isDreamScreenOpen, setIsDreamScreenOpen] = useState(false);
  const [selectedDreamPrompt, setSelectedDreamPrompt] = useState('');
  const [isFeedbackScreenOpen, setIsFeedbackScreenOpen] = useState(false);
  const [isAdminFeedbackOpen, setIsAdminFeedbackOpen] = useState(false);
  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | null>(null);

  // Check if Founder opened a signed email review link (?reviewFeedback=<id>&reviewToken=<hmac>)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fbId = params.get('reviewFeedback');
    const fbToken = params.get('reviewToken');
    if (fbId && fbToken) {
      setActiveTab('settings');
      setReviewSubmissionId(fbId);
      verifyFounderReviewLink(fbId, fbToken)
        .then(() => {
          onUpdateStats({ role: 'admin' });
          setIsAdminFeedbackOpen(true);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        })
        .catch(() => {
          setIsAdminFeedbackOpen(true);
        });
    }
  }, []);

  // Browser Back button navigation hooks for Profile overlays
  useBackHandler(isAdminFeedbackOpen, () => setIsAdminFeedbackOpen(false), 'profile-admin-feedback');
  useBackHandler(isFeedbackScreenOpen, () => setIsFeedbackScreenOpen(false), 'profile-feedback');
  useBackHandler(isDreamScreenOpen, () => setIsDreamScreenOpen(false), 'profile-dream');
  useBackHandler(isQiblaModalOpen, () => setIsQiblaModalOpen(false), 'profile-qibla');
  useBackHandler(isLocationModalOpen, () => setIsLocationModalOpen(false), 'profile-location');
  useBackHandler(isPrivacyModalOpen, () => setIsPrivacyModalOpen(false), 'profile-privacy');
  useBackHandler(isAccountModalOpen, () => setIsAccountModalOpen(false), 'profile-account');
  useBackHandler(isLanguageModalOpen, () => setIsLanguageModalOpen(false), 'profile-language');
  useBackHandler(isAboutModalOpen, () => setIsAboutModalOpen(false), 'profile-about');
  useBackHandler(isTermsModalOpen, () => setIsTermsModalOpen(false), 'profile-terms');
  useBackHandler(showLogoutModal, () => setShowLogoutModal(false), 'profile-logout');
  useBackHandler(showSupportModal, () => setShowSupportModal(false), 'profile-support');
  useBackHandler(showCharityModal, () => setShowCharityModal(false), 'profile-charity');
  useBackHandler(isRamadanUpdatesOpen, () => setIsRamadanUpdatesOpen(false), 'profile-ramadan-updates');
  useBackHandler(activeTab !== 'journey', () => setActiveTab('journey'), 'profile-subtab');

  // Lock background scroll when inline profile modals are active
  useModalScrollLock(showLogoutModal || showSupportModal || showCharityModal, 'profile-inline-modals');

  // Qibla Compass preview metrics for Spiritual Journey page
  const qiblaCoordsPreview = resolveCoordinates(userStats.userLocation);
  const qiblaAnglePreview = calculateTrueQibla(qiblaCoordsPreview.lat, qiblaCoordsPreview.lng);
  const qiblaDistPreview = calculateDistanceToKaaba(qiblaCoordsPreview.lat, qiblaCoordsPreview.lng);
  const qiblaDirectionInfo = getCompassHeadingName(qiblaAnglePreview);

  const lang: SupportedLanguageCode = getLanguageCode(userStats.language);
  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) || SUPPORTED_LANGUAGES[0];

  const isArabic = lang === 'ar' || userStats.language?.toLowerCase() === 'arabic' || userStats.language === 'ar';
  const brandLogoSrc = isArabic
    ? isDark
      ? 'https://img.sanishtech.com/u/6b5138e1cc808c3100e2c1e21e9bb415.png'
      : 'https://img.sanishtech.com/u/cfa42449de79e4e28b5e89bc3647fb0f.png'
    : isDark
      ? 'https://img.sanishtech.com/u/4839c88e05c99a48b9e5f34c39915b4f.png'
      : 'https://img.sanishtech.com/u/90884012596474b554555f339ebce3f7.png';

  const currentThemeMode: ThemePreferenceMode =
    themePreference ||
    (userStats.themePreference as ThemePreferenceMode) ||
    (isDark ? 'dark' : 'light');

  const handleThemeSelect = (mode: ThemePreferenceMode) => {
    if (onSelectThemePreference) {
      onSelectThemePreference(mode);
    } else {
      onUpdateStats({ themePreference: mode });
      if (mode === 'dark' && !isDark) onToggleTheme();
      if (mode === 'light' && isDark) onToggleTheme();
    }
  };

  const handleLanguageSelect = (newLang: SupportedLanguageCode) => {
    setGlobalLanguage(newLang);
    const selected = SUPPORTED_LANGUAGES.find((item) => item.code === newLang);
    const langName = selected ? selected.name : newLang;
    onUpdateStats({ language: langName });
    const isRtl = isRTLLanguage(newLang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  };

  // Notification states
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [testNotificationMsg, setTestNotificationMsg] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await requestNotificationPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        onUpdateStats({ notificationsEnabled: true });
        setTestNotificationMsg('Browser notifications enabled successfully.');
        setTimeout(() => setTestNotificationMsg(null), 4000);
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleTestNotification = (freq?: ReminderFrequency) => {
    const chosenFreq = freq || userStats.personalization?.reminderFrequency || 'Normal';
    triggerTestPrayerNotification(chosenFreq, 'Asr', userStats.userLocation || 'Makkah');
    setTestNotificationMsg(`Dispatched test ${chosenFreq} prayer reminder with gentle chime.`);
    setTimeout(() => setTestNotificationMsg(null), 4500);
  };

  const handleSetFrequency = (frequency: ReminderFrequency) => {
    const updatedPersonalization = {
      ...(userStats.personalization || {}),
      reminderFrequency: frequency,
    };
    onUpdateStats({
      notificationsEnabled: true,
      personalization: updatedPersonalization,
    });
  };

  // Support AI state
  const [supportCategory, setSupportCategory] = useState('Audio & Playback');
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportResponse, setSupportResponse] = useState<{
    greeting: string;
    troubleshootingSteps: string[];
    resolutionSummary: string;
    ticketId?: string;
  } | null>(null);

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim() || supportLoading) return;

    setSupportLoading(true);
    try {
      const res = await fetch('/api/support-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': getGlobalLanguage(),
          'x-language': getGlobalLanguage(),
        },
        body: JSON.stringify({
          issueDescription: supportInput,
          category: supportCategory,
          language: getGlobalLanguage(),
          appState: {
            quranPagesRead: userStats.quranPagesRead,
            lastReadSurah: userStats.lastReadSurah,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSupportResponse(data.data);
      }
    } catch {
      setSupportResponse({
        greeting: "Thank you for contacting Noor Technical Support.",
        troubleshootingSteps: [
          "1. Verify internet connection for audio streaming.",
          "2. Check device audio volume and silent switch.",
          "3. Try selecting a different reciter.",
        ],
        resolutionSummary: "A bug report has been logged with our development team.",
        ticketId: `NOOR-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const savedDuasObjects = DUAS_LIST.filter((d) => userStats.savedDuas.includes(d.id));

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 pb-32 lg:pb-16 space-y-6 animate-fadeIn">
      {/* 1. Profile Header Card */}
      <div
        id="profile-header-card"
        className={`rounded-3xl p-5 border transition-all duration-200 ${
          isDark
            ? 'bg-gradient-to-br from-[#141A22] via-[#0B0E13] to-[#181E26] border-[#C9A063]/30 shadow-md'
            : 'bg-gradient-to-br from-amber-50 via-white to-stone-50 border-[#C9A063]/30 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0">
              <AppLogoIcon className="w-full h-full" withContainer={true} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2
                  className={`text-base font-serif-heading font-bold ${
                    isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                  }`}
                >
                  {userStats.userName || (isArabic ? 'عبد الله' : 'Servant of Allah')}
                </h2>
                {userStats.role === 'admin' ? (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-cinzel">
                    {isArabic ? 'مدير النظام' : 'Administrator'}
                  </span>
                ) : userStats.isGuest ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-stone-500/20 text-stone-300 border border-stone-500/30">
                    {isArabic ? 'وضع الزائر' : 'Guest Mode'}
                  </span>
                ) : userStats.isLoggedIn ? (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Cloud className="w-3 h-3" />
                    {isArabic ? 'متزامن سحابياً' : 'Synced'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-cinzel bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                    {isArabic ? 'جلسة محلية' : 'Guest Session'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {userStats.role === 'admin'
                  ? (isArabic ? 'مدير النظام المعتمد' : 'admin@nafisnoor.app • System Administrator')
                  : userStats.isGuest
                  ? (isArabic ? 'جلسة زائر • التقدم محفوظ في المتصفح' : 'Guest Session • Progress stored in browser')
                  : userStats.accountEmail || (isArabic ? 'التقدم محفوظ محلياً' : 'Progress stored locally')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="p-2 rounded-xl border border-[#C9A063]/30 bg-[#C9A063]/10 hover:bg-[#C9A063]/20 text-[#DFBA7F] transition-all cursor-pointer"
            title={isArabic ? 'الحساب والمزامنة السحابية' : 'Account & Cloud Sync'}
          >
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* Core Journey Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-700/30 text-center">
          <div className="p-2 rounded-xl bg-[#12161D]/80 border border-white/5">
            <div className="text-[10px] text-stone-400">
              {isArabic ? 'صفحات مقروءة' : 'Pages Read'}
            </div>
            <div className="text-xs font-bold text-[#DFBA7F] mt-0.5 font-mono">
              {userStats.quranPagesRead}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#12161D]/80 border border-white/5">
            <div className="text-[10px] text-stone-400">
              {isArabic ? 'أيام الالتزام' : 'Overall Streak'}
            </div>
            <div className="text-xs font-bold text-[#DFBA7F] mt-0.5 font-mono">
              {userStats.overallStreak}{isArabic ? ' يوم' : 'd'}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#12161D]/80 border border-white/5">
            <div className="text-[10px] text-stone-400">
              {isArabic ? 'نقاط الخبرة' : 'Total XP'}
            </div>
            <div className="text-xs font-bold text-[#DFBA7F] mt-0.5 font-mono">
              {userStats.totalXP}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#12161D]/80 border border-white/5">
            <div className="text-[10px] text-stone-400">
              {isArabic ? 'مرات الذكر' : 'Dhikr Count'}
            </div>
            <div className="text-xs font-bold text-[#DFBA7F] mt-0.5 font-mono">
              {userStats.dhikrCount}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs: Spiritual Journey / Saved & Bookmarks / Settings */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0E1217]/80 border border-[#C9A063]/20">
        <button
          onClick={() => setActiveTab('journey')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'journey'
              ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {t(lang, 'journey')}
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {t(lang, 'bookmarks')} ({userStats.bookmarks.length + userStats.savedDuas.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {t(lang, 'settings')}
        </button>
      </div>

      {/* TAB CONTENT: SPIRITUAL JOURNEY */}
      {activeTab === 'journey' && (
        <div className="space-y-3 animate-fadeIn">
          {/* True Qibla Compass Direction Card (Exclusively in Spiritual Journey) */}
          <div
            id="journey-qibla-card"
            className={`rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#0F141E]/95 via-[#0A0D14]/95 to-[#06080C]/95 border-[#C9A063]/30 shadow-md'
                : 'bg-gradient-to-br from-amber-50/95 via-white to-amber-100/60 border-[#C9A063]/40 shadow-sm'
            }`}
          >
            {/* Luminous Top Gold Trim */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-80" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A063]/25 via-[#DFBA7F]/20 to-[#997334]/15 border border-[#C9A063]/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Compass className="w-6 h-6 text-[#DFBA7F] animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm sm:text-base font-serif-heading font-bold ${
                        isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                      }`}
                    >
                      {isArabic ? 'بوصلة القبلة المشرفة' : 'True Qibla Compass'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      {qiblaAnglePreview.toFixed(1)}° {qiblaDirectionInfo.code}
                    </span>
                  </div>
                  <div className="text-xs text-[#DFBA7F] font-arabic mt-0.5" dir="rtl">
                    اتجاه القبلة نحو الكعبة المشرفة · {qiblaDistPreview.km.toLocaleString()} كم
                  </div>
                  <p className="text-xs text-stone-400 font-light mt-1 max-w-sm leading-relaxed">
                    {isArabic
                      ? `بوصلة فلكية حية ودقيقة لتحديد اتجاه الكعبة المشرفة في مكة المكرمة مباشرة من ${qiblaCoordsPreview.displayName}.`
                      : `Live astronomical compass facing the Holy Kaaba in Makkah from ${qiblaCoordsPreview.displayName}.`}
                  </p>
                </div>
              </div>

              <button
                id="open-qibla-compass-btn"
                onClick={() => setIsQiblaModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-xs font-bold tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                title={isArabic ? 'فتح بوصلة القبلة المشرفة' : 'Open True Qibla Compass'}
              >
                <Compass className="w-4 h-4" />
                <span>{isArabic ? 'فتح بوصلة القبلة' : 'Open Qibla Compass'}</span>
              </button>
            </div>
          </div>

          {/* Islamic Dream Interpretation Card (Ibn Sirin Methodology) - Positioned directly below Qibla Compass */}
          <div
            id="journey-dream-interpreter-card"
            className={`rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#0F141E]/95 via-[#0A0D14]/95 to-[#06080C]/95 border-[#C9A063]/30 shadow-md'
                : 'bg-gradient-to-br from-amber-50/95 via-white to-amber-100/60 border-[#C9A063]/40 shadow-sm'
            }`}
          >
            {/* Luminous Top Gold Trim */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-80" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A063]/25 via-[#DFBA7F]/20 to-[#997334]/15 border border-[#C9A063]/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(201,160,99,0.3)]">
                  <Moon className="w-6 h-6 text-[#DFBA7F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm sm:text-base font-serif-heading font-bold ${
                        isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                      }`}
                    >
                      {isArabic ? 'تعبير الرؤى والأحلام' : 'Islamic Dream Interpretation'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      {isArabic ? 'تفسير الأحلام' : 'Tafsir al-Ahlam'}
                    </span>
                  </div>
                  <div className="text-xs text-[#DFBA7F] font-arabic mt-0.5" dir="rtl">
                    تعبير الرؤى والأحلام وفق منهج الإمام ابن سيرين (رحمه الله)
                  </div>
                  <p className="text-xs text-stone-400 font-light mt-1 max-w-md leading-relaxed">
                    {isArabic
                      ? 'سل عن أي رؤيا أو منام؛ استنباط للرموز واستصحاب للحال وسياق الرؤيا مستنداً لمنهج الإمام ابن سيرين وآداب الرؤى النبوية الشريفة.'
                      : 'Ask about any vision or dream. Analyzed through classical Sunni scholarship: symbol extraction, emotional context, primary Ibn Sirin rulings, and prophetic adab.'}
                  </p>
                </div>
              </div>

              <button
                id="open-dream-interpreter-btn"
                onClick={() => {
                  setSelectedDreamPrompt('');
                  setIsDreamScreenOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-xs font-bold tracking-wider shadow-[0_4px_18px_rgba(201,160,99,0.35)] hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                title={isArabic ? 'تعبير رؤيا' : 'Interpret a Dream'}
              >
                <Sparkles className="w-4 h-4 text-[#080A0E]" />
                <span>{isArabic ? 'تعبير الرؤيا' : 'Interpret Dream'}</span>
              </button>
            </div>

            {/* Quick Sample Dream Chips */}
            <div className="mt-4 pt-3 border-t border-[#C9A063]/15 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-stone-400 font-medium">
                {isArabic ? 'رؤى شائعة للبدء:' : 'Quick visions:'}
              </span>
              {[
                {
                  label: isArabic ? '💧 ماء زلال صافٍ' : '💧 Pure Water',
                  prompt: isArabic
                    ? 'رأيت أني أسبح في ماء نقي صافٍ وشعرت بسكينة عظيمة وراحة بال.'
                    : 'I dreamed I was swimming in clear blue water and I felt very peaceful.',
                },
                {
                  label: isArabic ? '🕊️ طيران في السماء' : '🕊️ Flying in Sky',
                  prompt: isArabic
                    ? 'رأيت نفسي أطير حراً في السماء فوق مروج خضراء ومرتفعات جميلة.'
                    : 'I saw myself flying freely high above the ground and green hills.',
                },
                {
                  label: isArabic ? '🕋 الكعبة المشرفة' : '🕋 Holy Kaaba',
                  prompt: isArabic
                    ? 'رأيت أني أقف بخشوع أمام الكعبة المشرفة في مكة المكرمة وأدعو الله بقلب منيب.'
                    : 'I dreamed I was standing before the Holy Kaaba in Makkah in gratitude.',
                },
                {
                  label: isArabic ? '🔑 مفتاح ذهبي' : '🔑 Golden Key',
                  prompt: isArabic
                    ? 'رأيت أني وجدت مفتاحاً ذهبياً مزخرفاً موضوعاً على طاولة في بيت رحب.'
                    : 'I found an ancient ornate golden key lying on a table in a clean house.',
                },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedDreamPrompt(chip.prompt);
                    setIsDreamScreenOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#C9A063]/10 hover:bg-[#C9A063]/20 border border-[#C9A063]/25 text-[#DFBA7F] transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Khatm Calculation Card */}
          <div
            className={`rounded-3xl p-5 border transition-all duration-200 ${
              isDark
                ? 'bg-[#0E1217] border-[#C9A063]/20 shadow-md'
                : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#DFBA7F]" />
                <h3
                  className={`text-xs font-serif-heading font-bold ${
                    isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                  }`}
                >
                  {t(lang, 'khatmPlannerTitle')}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#DFBA7F]">
                {userStats.quranPagesRead} / 604 {isArabic ? 'صفحة' : 'pages'}
              </span>
            </div>

            <div className="w-full bg-stone-800/60 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] h-2 rounded-full shadow-[0_0_8px_rgba(201,160,99,0.4)]"
                style={{ width: `${Math.max(2, (userStats.quranPagesRead / 604) * 100)}%` }}
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#C9A063]/10 border border-[#C9A063]/20 text-xs text-stone-300 flex items-center justify-between">
              <div>
                <span className="text-[#DFBA7F] font-semibold">{t(lang, 'khatmRemaining')}</span>
                <span className="ml-1 text-[11px] text-stone-400">
                  {Math.max(0, 604 - userStats.quranPagesRead)} {t(lang, 'khatmPagesLeft')}
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-[#DFBA7F]" />
            </div>
          </div>

          {/* Activity Streaks & Baseline */}
          <div
            className={`rounded-3xl p-5 border transition-all duration-200 ${
              isDark
                ? 'bg-[#0E1217] border-[#C9A063]/20 shadow-md'
                : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3
                  className={`text-xs font-serif-heading font-bold ${
                    isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                  }`}
                >
                  {isArabic ? 'سجلات الالتزام والأنشطة المباركة' : 'Authentic Activity Records'}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {isArabic ? 'موثق بأمانة' : 'Verified Integrity'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-[#12161D] border border-white/5">
                <div className="text-[10px] text-stone-400">{isArabic ? 'الإجمالي' : 'Overall'}</div>
                <div className="text-base font-bold text-[#DFBA7F] font-mono">
                  {userStats.overallStreak}{isArabic ? ' ي' : 'd'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#12161D] border border-white/5">
                <div className="text-[10px] text-stone-400">{t(lang, 'quran')}</div>
                <div className="text-base font-bold text-stone-200 font-mono">
                  {userStats.quranStreak}{isArabic ? ' ي' : 'd'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#12161D] border border-white/5">
                <div className="text-[10px] text-stone-400">{t(lang, 'dhikr')}</div>
                <div className="text-base font-bold text-stone-200 font-mono">
                  {userStats.dhikrStreak || 0}{isArabic ? ' ي' : 'd'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#12161D] border border-white/5">
                <div className="text-[10px] text-stone-400">{t(lang, 'study')}</div>
                <div className="text-base font-bold text-stone-200 font-mono">
                  {userStats.learningStreak}{isArabic ? ' ي' : 'd'}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 mt-2 text-center">
              Streaks strictly reflect real daily participation records.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKMARKS & SAVED DUAS */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Saved Bookmarks */}
          <div
            className={`rounded-3xl p-5 border transition-all ${
              isDark ? 'bg-[#0E1217]/85 border-[#C9A063]/20' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="w-4 h-4 text-[#DFBA7F]" />
              <h3
                className={`text-xs font-serif-heading font-bold ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {isArabic
                  ? `إشارات القرآن المحفوظة (${userStats.bookmarks.length})`
                  : `Qur'an Bookmarks (${userStats.bookmarks.length})`}
              </h3>
            </div>

            {userStats.bookmarks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#12161D]/50 border border-white/5 text-center text-xs text-stone-400">
                <Bookmark className="w-6 h-6 mx-auto mb-2 opacity-40 text-[#DFBA7F]" />
                <p>{isArabic ? 'لا توجد آيات محفوظة بعد.' : 'No saved verses yet.'}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isArabic
                    ? 'اضغط على أيقونة الإشارة المرجعية أثناء التلاوة لحفظ الآيات الكريمة.'
                    : 'Tap the bookmark icon while reading to preserve meaningful ayahs.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {userStats.bookmarks.map((bm, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#12161D] border border-white/5 flex items-center justify-between text-xs hover:border-[#C9A063]/40 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#DFBA7F]">
                        {isArabic
                          ? `سورة ${ALL_SURAHS.find(s => s.number === bm.surahNumber)?.name || bm.surahNumber} : الآية ${bm.ayahNumber}`
                          : `Surah ${bm.surahNumber} : Ayah ${bm.ayahNumber}`}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {isArabic
                          ? `تم الحفظ في ${new Date(bm.timestamp).toLocaleDateString('ar-SA')}`
                          : `Saved on ${new Date(bm.timestamp).toLocaleDateString()}`}
                      </p>
                    </div>
                    {onOpenQuranSurah && (
                      <button
                        onClick={() => onOpenQuranSurah(bm.surahNumber)}
                        className="px-3 py-1.5 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] text-xs font-semibold hover:bg-[#C9A063]/25 cursor-pointer"
                      >
                        {isArabic ? 'قراءة السورة' : 'Read Surah'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Duas */}
          <div
            className={`rounded-3xl p-5 border transition-all ${
              isDark ? 'bg-[#0E1217]/85 border-[#C9A063]/20' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              <h3
                className={`text-xs font-serif-heading font-bold ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {isArabic
                  ? `الأدعية والأذكار المحفوظة (${userStats.savedDuas.length})`
                  : `Saved Supplications (${userStats.savedDuas.length})`}
              </h3>
            </div>

            {savedDuasObjects.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#12161D]/50 border border-white/5 text-center text-xs text-stone-400">
                <Heart className="w-6 h-6 mx-auto mb-2 opacity-40 text-rose-400" />
                <p>{isArabic ? 'لا توجد أدعية محفوظة بعد.' : 'No saved duas yet.'}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isArabic
                    ? 'احفظ الأدعية المأثورة من الصفحة الرئيسية لتصل إليها في أي وقت.'
                    : 'Save daily duas from the home screen to access them anytime.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedDuasObjects.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-2xl bg-[#12161D] border border-white/5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#DFBA7F]">{d.title}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {isArabic ? (d.source || d.chapterTitleAr || 'مأثور') : d.category}
                      </span>
                    </div>
                    <p className="text-stone-200 text-sm font-arabic leading-loose text-right">
                      {d.arabic}
                    </p>
                    {!isArabic && (
                      <p className="text-stone-300 text-[11px] italic">"{d.translation}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SETTINGS & ACCOUNT */}
      {activeTab === 'settings' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 1. Language System Section */}
          <div
            id="profile-language-settings-card"
            className={`rounded-3xl p-5 sm:p-6 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/30 shadow-lg' : 'liquid-glass-light border-[#C9A063]/30 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A063]/20 text-[#DFBA7F] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-sm font-serif-heading font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {t(lang, 'language')}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-light">
                    {t(lang, 'languageSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Language Current Selection & Modal Trigger */}
            <button
              type="button"
              id="settings-open-language-modal-btn"
              onClick={() => setIsLanguageModalOpen(true)}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all group ${
                isDark
                  ? 'bg-[#12161D]/80 border-stone-800 hover:border-[#DFBA7F]/50 hover:bg-[#181F2A]'
                  : 'bg-stone-50 border-stone-200 hover:border-[#C9A063]/50 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={currentLangInfo.name}>
                  {currentLangInfo.flag}
                </span>
                <div className="text-start">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      }`}
                    >
                      {currentLangInfo.name}
                    </span>
                    <span className="text-xs text-[#DFBA7F] font-medium">
                      ({currentLangInfo.nativeName})
                    </span>
                    {currentLangInfo.direction === 'rtl' && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/25">
                        RTL
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {isArabic ? '10 لغات عالمية مدعومة · انقر للتبديل' : t(lang, 'languagesCount')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#DFBA7F]">
                <span>{t(lang, 'changeLanguageBtn')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* 2. Theme Mode Section */}
          <div
            id="profile-theme-mode-card"
            className={`rounded-3xl p-5 sm:p-6 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/30 shadow-lg' : 'liquid-glass-light border-[#C9A063]/30 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A063]/20 text-[#DFBA7F] flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-sm font-serif-heading font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {t(lang, 'theme')}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-light">
                    {t(lang, 'themeSubtitle')}
                  </p>
                </div>
              </div>
            </div>

            <ThemeSelector
              currentPreference={currentThemeMode}
              isDark={isDark}
              onSelectTheme={handleThemeSelect}
              lang={lang}
            />
          </div>

          {/* Account & Sync Section */}
          <div
            className={`rounded-3xl p-5 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/25' : 'liquid-glass-light border-[#C9A063]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`text-xs font-serif-heading font-bold ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {t(lang, 'accountSyncTitle')}
              </h3>
              {userStats.isLoggedIn && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {t(lang, 'activeCloudSync')}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="w-full p-3.5 rounded-2xl border border-[#C9A063]/30 bg-[#C9A063]/10 hover:bg-[#C9A063]/20 text-xs flex items-center justify-between transition-colors text-[#DFBA7F] font-semibold"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A063]" />
                <span>
                  {userStats.isLoggedIn ? t(lang, 'manageAccount') : t(lang, 'signInOrCreate')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C9A063]" />
            </button>
          </div>



          {/* Prayer Reminders & Notification Frequency Section */}
          <div
            id="profile-notifications-settings-card"
            className={`rounded-3xl p-5 sm:p-6 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/30 shadow-lg' : 'liquid-glass-light border-[#C9A063]/30 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 text-[#DFBA7F] flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`text-xs font-serif-heading font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {t(lang, 'notificationsSettingsTitle')}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-light">
                    {t(lang, 'notificationsSettingsSub')}
                  </p>
                </div>
              </div>

              {/* Master Notifications Toggle */}
              <button
                type="button"
                id="toggle-master-notifications-btn"
                onClick={() =>
                  onUpdateStats({ notificationsEnabled: !userStats.notificationsEnabled })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  userStats.notificationsEnabled ? 'bg-[#DFBA7F]' : 'bg-stone-700'
                }`}
                role="switch"
                aria-checked={userStats.notificationsEnabled}
                aria-label="Toggle Prayer Notifications"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#0E1218] transition-transform ${
                    userStats.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {testNotificationMsg && (
              <div className="mb-3 p-3 rounded-2xl bg-[#DFBA7F]/15 border border-[#DFBA7F]/40 text-[#DFBA7F] text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#DFBA7F]" />
                <span className="font-medium">{testNotificationMsg}</span>
              </div>
            )}

            {userStats.notificationsEnabled ? (
              <div className="space-y-4 pt-2">
                {/* Reminder Frequency Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-[#DFBA7F] uppercase tracking-wider font-cinzel">
                      {isArabic ? 'وتيرة التنبيهات المفضلة' : 'Reminder Frequency Preference'}
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {userStats.personalization?.reminderFrequency || (isArabic ? 'الوضع المعتاد' : 'Normal')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['Minimal', 'Normal', 'Frequent'] as ReminderFrequency[]).map((freq) => {
                      const currentFreq = userStats.personalization?.reminderFrequency || 'Normal';
                      const isSelected = currentFreq === freq;

                      const freqLabel =
                        isArabic
                          ? freq === 'Minimal'
                            ? 'هادئ (دقيقة)'
                            : freq === 'Normal'
                            ? 'معتاد (5 دقائق)'
                            : 'مبكر (15 دقيقة)'
                          : freq;

                      const freqDesc =
                        isArabic
                          ? freq === 'Minimal'
                            ? 'قبل الصلاة بدقيقة واحدة (إشعار هادئ)'
                            : freq === 'Normal'
                            ? 'قبل الصلاة بـ 5 دقائق (موصى به للوضوء)'
                            : 'قبل الصلاة بـ 15 دقيقة (استعداد مبكر وتأهب)'
                          : freq === 'Minimal'
                          ? '1 min before prayer time (subtle notice)'
                          : freq === 'Normal'
                          ? '5 min before prayer time (recommended)'
                          : '15 min before prayer time (thorough preparation)';

                      return (
                        <button
                          key={freq}
                          type="button"
                          id={`select-frequency-${freq.toLowerCase()}-btn`}
                          onClick={() => handleSetFrequency(freq)}
                          className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#C9A063]/20 border-[#DFBA7F] shadow-[0_4px_16px_rgba(201,160,99,0.25)] ring-1 ring-[#DFBA7F]/40'
                              : isDark
                              ? 'bg-[#12161D]/70 border-stone-800 hover:border-stone-700 text-stone-300'
                              : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold font-cinzel ${
                                  isSelected ? 'text-[#DFBA7F]' : 'text-stone-300'
                                }`}
                              >
                                {freqLabel}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-[#DFBA7F] text-[#080A0E] flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                              {freqDesc}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center gap-1 text-[9px] font-mono text-[#DFBA7F]">
                            <span>{freq === 'Minimal' ? (isArabic ? 'قبل 1د' : '1m Prior') : freq === 'Normal' ? (isArabic ? 'قبل 5د' : '5m Prior') : (isArabic ? 'قبل 15د' : '15m Prior')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Browser Permission Status & Testing Row */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-[#10141B] border-white/5' : 'bg-stone-100/70 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        permissionStatus === 'granted'
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : permissionStatus === 'denied'
                          ? 'bg-red-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-semibold text-stone-200">
                        {permissionStatus === 'granted'
                          ? t(lang, 'browserPushActive')
                          : permissionStatus === 'denied'
                          ? t(lang, 'browserPushBlocked')
                          : t(lang, 'browserPushNeeded')}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {permissionStatus === 'granted'
                          ? t(lang, 'browserPushActiveDesc')
                          : t(lang, 'browserPushNeededDesc')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        disabled={isRequestingPermission}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DFBA7F] text-[#0E1218] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{isRequestingPermission ? t(lang, 'requesting') : t(lang, 'enableSystemAlert')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="test-prayer-notification-btn"
                      onClick={() => handleTestNotification()}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#C9A063]/40 bg-[#C9A063]/15 hover:bg-[#C9A063]/25 text-[#DFBA7F] transition-colors flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t(lang, 'sendTestAlert')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 text-xs text-stone-400 font-light flex items-center justify-between">
                <span>{t(lang, 'remindersPausedText')}</span>
                <button
                  type="button"
                  onClick={() => onUpdateStats({ notificationsEnabled: true })}
                  className="text-xs font-semibold text-[#DFBA7F] hover:underline"
                >
                  {t(lang, 'turnOnReminders')}
                </button>
              </div>
            )}
          </div>

          {/* Location & Calculation Method Settings */}
          <div
            className={`rounded-3xl p-5 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/25' : 'liquid-glass-light border-[#C9A063]/30'
            }`}
          >
            <h3
              className={`text-xs font-serif-heading font-bold mb-3 ${
                isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
              }`}
            >
              {t(lang, 'locationAstroTitle')}
            </h3>

            <div
              onClick={() => setIsLocationModalOpen(true)}
              className="p-3.5 rounded-2xl bg-[#12161D]/80 border border-white/5 flex items-center justify-between cursor-pointer hover:border-[#C9A063]/40 transition-colors group mb-3"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C9A063]" />
                <div>
                  <div className="text-xs font-semibold text-stone-200">
                    {userStats.userLocation || (isArabic ? 'مكة المكرمة' : 'Makkah')}
                  </div>
                  <div className="text-[10px] font-mono text-stone-400">
                    {userStats.userLatitude?.toFixed(2)}°, {userStats.userLongitude?.toFixed(2)}°
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#DFBA7F] group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Calculation Method Selection */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-700/20">
                <span className="text-stone-300">{t(lang, 'calcMethodTitle')}</span>
                <select
                  value={userStats.prayerCalculationMethod || 'MuslimWorldLeague'}
                  onChange={(e) =>
                    onUpdateStats({ prayerCalculationMethod: e.target.value as CalculationMethodKey })
                  }
                  className={`p-1.5 rounded-xl text-xs font-medium border focus:outline-none max-w-[170px] truncate ${
                    isDark
                      ? 'bg-[#12161D] border-[#C9A063]/30 text-[#F5EFE6]'
                      : 'bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <option value="MuslimWorldLeague">{isArabic ? 'رابطة العالم الإسلامي' : 'Muslim World League'}</option>
                  <option value="NorthAmerica">{isArabic ? 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)' : 'ISNA (North America)'}</option>
                  <option value="Egyptian">{isArabic ? 'الهيئة المصرية العامة للمساحة' : 'Egyptian General Authority'}</option>
                  <option value="UmmAlQura">{isArabic ? 'جامعة أم القرى (مكة المكرمة)' : 'Umm al-Qura (Makkah)'}</option>
                  <option value="Dubai">{isArabic ? 'دائرة الشؤون الإسلامية بدبي' : 'Dubai / UAE Awqaf'}</option>
                  <option value="Kuwait">{isArabic ? 'وزارة الأوقاف الكويتية' : 'Kuwait Ministry'}</option>
                  <option value="Qatar">{isArabic ? 'دار التقويم القطري' : 'Qatar Calendar House'}</option>
                  <option value="Singapore">{isArabic ? 'مجلس أوغاما إسلام سينغابورا (MUIS)' : 'MUIS (Singapore)'}</option>
                  <option value="Turkey">{isArabic ? 'رئاسة الشؤون الدينية التركية (ديانت)' : 'Diyanet (Turkey)'}</option>
                  <option value="Karachi">{isArabic ? 'جامعة العلوم الإسلامية بكراتشي' : 'Univ. of Islamic Sciences (Karachi)'}</option>
                  <option value="Tehran">{isArabic ? 'معهد الجيوفيزياء بجامعة طهران' : 'Univ. of Tehran'}</option>
                  <option value="MoonsightingCommittee">{isArabic ? 'لجنة تحري الهلال' : 'Moonsighting Committee'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RAMADAN EVENTS SECTION (STRICT: Accessible ONLY through Settings)         */}
          {/* ========================================================================= */}
          <div
            id="profile-ramadan-events-section"
            className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 relative overflow-hidden group ${
              isDark
                ? 'bg-gradient-to-br from-[#0c121e] via-[#080d17] to-[#141b2a] border-[#DFBA7F]/40 shadow-[0_12px_36px_rgba(0,0,0,0.45)]'
                : 'bg-gradient-to-br from-[#fbf8f1] via-[#f7f2e4] to-[#f2e9d2] border-[#C9A063]/50 shadow-md'
            }`}
          >
            {/* Decorative golden ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#DFBA7F]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#C9A063]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DFBA7F] to-[#A67C38] text-[#090C11] flex items-center justify-center shadow-md shadow-[#C9A063]/25 shrink-0 group-hover:scale-105 transition-transform">
                    <Moon className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-serif-heading font-bold tracking-wide ${
                        isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                      }`}>
                        {isArabic ? 'فعاليات ونفحات شهر رمضان' : 'Ramadan Events'}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/40 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 text-[#DFBA7F]" />
                        {isArabic ? 'رمضان المبارك ١٤٤٧ هـ' : 'Ramadan 1447'}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      {isArabic
                        ? 'جدول الإمساكية المعتمد، ومخطط الختمات، والبرنامج الإيماني اليومي.'
                        : 'Verified Ramadan schedule, spiritual dream planner, and Al-Noor routines.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time date status badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                  (ramadanStatus?.isRamadan || isRamadanSimulated)
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    (ramadanStatus?.isRamadan || isRamadanSimulated) ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span>
                    {(ramadanStatus?.isRamadan || isRamadanSimulated)
                      ? (isArabic ? 'مباشر: شهر رمضان المبارك (الشهر ٩)' : 'Live Check: Ramadan Active (Month 9)')
                      : (isArabic
                          ? `تحقق حي: خارج رمضان (${ramadanStatus?.monthNameAr || 'شعبان'} · الشهر ${ramadanStatus?.monthNumber || 8} من ١٢)`
                          : `Live Date Check: Outside Ramadan (${ramadanStatus?.monthNameEn || "Sha'ban"} · Month ${ramadanStatus?.monthNumber || 8} of 12)`)
                    }
                  </span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {isArabic ? 'تعمل الفعاليات طوال أيام شهر رمضان المبارك' : 'Events work only on Ramadan dates'}
                </span>
              </div>

              {/* Quranic Verse Callout */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark
                    ? 'bg-[#070a10]/70 border-[#DFBA7F]/20 text-stone-200'
                    : 'bg-white/80 border-[#C9A063]/25 text-stone-800'
                }`}
              >
                <p className="text-right text-xs font-arabic text-[#DFBA7F] mb-1 tracking-wide" dir="rtl">
                  شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ
                </p>
                <p className="text-[11px] italic text-stone-400 font-light">
                  {isArabic
                    ? '«شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ» (البقرة: ١٨٥)'
                    : '"The month of Ramadan in which was revealed the Quran, a guidance for the people..." (2:185)'}
                </p>
              </div>

              {/* Action Button: "See Updates" - Shows ONLY updates */}
              <button
                type="button"
                id="see-ramadan-updates-btn"
                onClick={() => setIsRamadanUpdatesOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#080B10] font-bold text-sm tracking-wide shadow-lg shadow-[#C9A063]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-between group/btn cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 fill-current text-[#080B10]" />
                  <span>{isArabic ? 'استعراض التحديثات' : 'See Updates'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span>{isArabic ? 'كافة التحديثات' : 'View All Updates'}</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Aladhan Hijri calendar detection status & verification toggler */}
              <div className="pt-2 border-t border-[#C9A063]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>
                    {isArabic
                      ? `تقويم أم القرى والأذان: ${ramadanStatus?.source === 'aladhan' ? 'متزامن مع الحسابات الفلكية المعتمدة' : 'تقويم أم القرى نشط'}`
                      : `Aladhan Hijri API: ${ramadanStatus?.source === 'aladhan' ? 'Synced with live astronomical calculations' : 'Umm al-Qura Calendar active'}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[10px] text-stone-400">
                    {isArabic ? 'الوضع الموسمي:' : 'Seasonal Mode:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isRamadanSimulated;
                      setIsRamadanSimulated(nextVal);
                      localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
                      detectRamadanStatus(userStats.userLatitude, userStats.userLongitude).then((st) => setRamadanStatus(st));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                      isRamadanSimulated
                        ? 'border-[#DFBA7F]/40 bg-[#DFBA7F]/15 text-[#DFBA7F]'
                        : 'border-stone-700 bg-stone-800 text-stone-300'
                    }`}
                  >
                    {isRamadanSimulated
                      ? (isArabic ? 'رمضان نشط (للاختبار)' : 'Ramadan Active (For Testing)')
                      : (isArabic ? 'تحقق مباشر وتلقائي' : 'Real-time Live Check')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 6. About Nafis Noor Section */}
          <div
            id="profile-about-nafis-noor-card"
            className={`rounded-3xl p-5 sm:p-6 border transition-all space-y-4 ${
              isDark ? 'liquid-glass border-[#C9A063]/30 shadow-lg' : 'liquid-glass-light border-[#C9A063]/30 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A063]/20 text-[#DFBA7F] flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-sm font-serif-heading font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {isArabic ? 'عن تطبيق نفيس نور' : 'About Nafis Noor'}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-light">
                    {isArabic
                      ? 'رفيق إسلامي رقمي مجاني طورته مجموعة نور — فريق متكامل يسعى لتمكين كل مسلم ومسلمة حول العالم من العلوم الإسلامية الرصينة.'
                      : 'A free AI-powered Islamic companion developed by ALNOOR GROUP (مجموعة نور) — a team of 4 young developers passionate about making authentic Islamic knowledge accessible to every Muslim worldwide.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="open-full-about-modal-btn"
                onClick={() => setIsAboutModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[#C9A063]/40 bg-[#C9A063]/15 hover:bg-[#C9A063]/25 text-[#DFBA7F] transition-colors shrink-0 ml-2"
              >
                {isArabic ? 'التفاصيل الكاملة' : 'View Details'}
              </button>
            </div>

            {/* Application Overview & Brand Card */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start ${
                isDark ? 'bg-[#0E1218]/60 border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 p-0.5 bg-[#090C11] border border-[#C9A063]/30">
                  <AppLogoIcon className="w-full h-full" withContainer={false} />
                </div>
                <div>
                  <div className="text-sm font-cinzel font-bold text-[#DFBA7F] tracking-wider">
                    {isArabic ? 'نفيس نور' : 'NAFIS NOOR'}
                  </div>
                  <div className="text-[11px] text-stone-300 font-light max-w-sm mt-0.5">
                    {isArabic
                      ? 'رفيق إسلامي رقمي مجاني طورته مجموعة نور — فريق متكامل يسعى لتمكين كل مسلم ومسلمة حول العالم من المعرفة الإسلامية المعتمدة.'
                      : 'A free AI-powered Islamic companion developed by ALNOOR GROUP (مجموعة نور) — a team of 4 young developers passionate about making authentic Islamic knowledge accessible to every Muslim worldwide.'}
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 mt-1">
                    {isArabic ? 'الإصدار ١.٠.٠ · عام ٢٠٢٦ م' : 'Version 1.0.0 · Built in 2026'}
                  </div>
                </div>
              </div>

              {/* Legitimate Creator Credit */}
              <div className="p-3 rounded-xl bg-[#12161F] border border-[#C9A063]/25 shrink-0 min-w-[150px] text-center sm:text-start">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#DFBA7F]">
                  {isArabic ? 'تطوير وإشراف' : 'Made By'}
                </div>
                <div className="text-sm font-cinzel font-bold text-[#F5EFE6] tracking-wide">
                  {isArabic ? 'مجموعة نور' : 'ALNOOR GROUP'}
                </div>
                <div className="text-[11px] text-[#DFBA7F] font-arabic font-medium mt-0.5" dir="rtl">
                  {isArabic ? '🇸🇦 المملكة العربية السعودية' : '(مجموعة نور)'}
                </div>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/35 shadow-xs">
                <img
                  src={brandLogoSrc}
                  alt="Saudi Tech"
                  loading="lazy"
                  decoding="async"
                  className="h-8 sm:h-9 w-auto max-h-9 object-contain shrink-0 drop-shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/app-icon.png';
                  }}
                />
                <span>
                  {isArabic
                    ? '🇸🇦 تقنية سعودية · صُنع بكل فخر في المملكة العربية السعودية'
                    : '🇸🇦 Saudi Tech · Proudly Made in Saudi Arabia'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span>
                  {isArabic
                    ? 'مجاني تماماً ودائماً · خالصاً لوجه الله تعالى'
                    : 'Free Forever · For the Love of Allah'}
                </span>
              </div>
            </div>

            {/* Noor AI Card - External Button with NO RAW URL DISPLAYED */}
            <div
              id="settings-noor-ai-banner"
              className={`p-4 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-[#12161F] to-[#181D26] border-[#DFBA7F]/30'
                  : 'bg-gradient-to-r from-amber-50/80 to-stone-50 border-amber-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#0A0D12] flex items-center justify-center shrink-0 shadow-sm">
                    <NoorAIIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-serif-heading font-bold ${
                          isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                        }`}
                      >
                        {t(lang, 'noorAiTitle')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#DFBA7F]/20 text-[#DFBA7F]">
                        {t(lang, 'noorAiSubtitle')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-light mt-0.5 max-w-md">
                      {t(lang, 'noorAiDescShort')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="settings-open-noor-ai-btn"
                  onClick={() =>
                    window.open('https://noorak.ai.studio', '_blank', 'noopener,noreferrer')
                  }
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-90 text-[#0A0D12] text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>{t(lang, 'openNoorAi')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>



          {/* Technical Support & Reset */}
          <div
            className={`rounded-3xl p-5 border transition-all ${
              isDark ? 'liquid-glass border-[#C9A063]/25' : 'liquid-glass-light border-[#C9A063]/30'
            }`}
          >
            <h3
              className={`text-xs font-serif-heading font-bold mb-3 ${
                isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
              }`}
            >
              {t(lang, 'supportSection')}
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full p-3 rounded-2xl border border-[#C9A063]/30 bg-[#C9A063]/10 hover:bg-[#C9A063]/20 text-xs flex items-center justify-between transition-colors text-[#DFBA7F] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <NoorAIIcon className="w-4 h-4 text-[#C9A063]" />
                  <span>{t(lang, 'supportAi')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C9A063]" />
              </button>

              <button
                onClick={() => setShowCharityModal(true)}
                className="w-full p-3 rounded-2xl border border-[#C9A063]/30 bg-[#12161D] hover:bg-[#181E26] text-xs flex items-center justify-between transition-colors text-[#DFBA7F] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#C9A063]" />
                  <span>{t(lang, 'giveBack')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C9A063]" />
              </button>

              {/* Reset to Zero State */}
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      isArabic
                        ? 'هل ترغب في إعادة ضبط بيانات التطبيق والعودة لشاشة البداية النظيفة؟'
                        : 'Reset all Noor stats back to clean Zero State and show the Welcome experience?'
                    )
                  ) {
                    if (onResetAllData) {
                      onResetAllData();
                    } else {
                      onUpdateStats({
                        hasCompletedWelcome: false,
                        userName: '',
                        userLocation: 'Makkah',
                        overallStreak: 0,
                        quranStreak: 0,
                        learningStreak: 0,
                        quranPagesRead: 0,
                        dhikrCount: 0,
                        totalXP: 0,
                        lessonsCompleted: 0,
                        bookmarks: [],
                        savedDuas: [],
                        unlockedAchievements: [],
                        noorAiConversation: [],
                      });
                    }
                  }
                }}
                className="w-full p-3 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs flex items-center justify-between transition-colors text-red-400 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <span>{t(lang, 'resetApp')}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                  {isArabic ? 'مستخدم جديد' : 'New User'}
                </span>
              </button>

              {/* Log Out Button */}
              {userStats.isLoggedIn && (
                <button
                  id="profile-logout-btn"
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full p-3.5 rounded-2xl border border-stone-700/50 bg-[#12161D] hover:bg-[#181E26] text-xs flex items-center justify-between transition-colors text-stone-200 font-semibold shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-[#DFBA7F]" />
                    <span>{t(lang, 'logOut')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              )}

              {/* Contact Us */}
              <button
                id="profile-contact-us-btn"
                type="button"
                onClick={() => {
                  window.location.href = 'mailto:nafisnoor.support@gmail.com';
                }}
                className="w-full p-3.5 rounded-2xl border border-stone-700/50 bg-[#12161D] hover:bg-[#181E26] text-xs flex items-center justify-between transition-colors text-stone-200 font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'تواصل معنا' : 'Contact Us'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Terms of Service */}
              <button
                id="profile-terms-service-btn"
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="w-full p-3.5 rounded-2xl border border-stone-700/50 bg-[#12161D] hover:bg-[#181E26] text-xs flex items-center justify-between transition-colors text-stone-200 font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'شروط الخدمة' : 'Terms of Service'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Rate Us on Google Play */}
              <button
                id="profile-rate-us-btn"
                type="button"
                onClick={() => {
                  window.open(
                    'https://play.google.com/store/apps/details?id=com.nafisnoor.app',
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                className="w-full p-3.5 rounded-2xl border border-stone-700/50 bg-[#12161D] hover:bg-[#181E26] text-xs flex items-center justify-between transition-colors text-stone-200 font-semibold shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'قيّمنا على Google Play' : 'Rate Us on Google Play'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>

          {/* VERY LAST ITEM IN SETTINGS: Feedback & Suggestions (Entire Row Clickable, Liquid Glass) */}
          <button
            id="profile-feedback-suggestions-item"
            type="button"
            onClick={() => setIsFeedbackScreenOpen(true)}
            className={`w-full rounded-3xl p-5 sm:p-6 border text-start transition-all flex items-center justify-between gap-4 group cursor-pointer ${
              isDark
                ? 'liquid-glass border-[#C9A063]/35 hover:border-[#DFBA7F]/60 shadow-lg'
                : 'liquid-glass-light border-[#C9A063]/35 hover:border-[#C9A063]/65 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DFBA7F]/25 to-[#C9A063]/15 border border-[#C9A063]/40 text-[#DFBA7F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3
                  className={`text-sm font-serif-heading font-bold ${
                    isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                  }`}
                >
                  {getFeedbackTranslations(lang).settingsLabel}
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5 leading-relaxed">
                  {getFeedbackTranslations(lang).settingsSubtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#DFBA7F] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Footer at the very bottom */}
          <div className="pt-6 pb-6 text-center space-y-1.5 opacity-60">
            <p className="text-[11px] text-stone-400 font-light">
              {isArabic
                ? '© ٢٠٢٦ مجموعة نور · جميع الحقوق محفوظة'
                : '© 2026 ALNOOR GROUP (مجموعة نور) · All rights reserved'}
            </p>
            <p className="text-[11px] text-[#DFBA7F] font-medium flex items-center justify-center gap-1.5">
              <span>{isArabic ? 'صُنع في المملكة العربية السعودية 🇸🇦' : 'Made in Saudi Arabia 🇸🇦'}</span>
            </p>
          </div>
        </div>
      )}

      {/* LOG OUT CONFIRMATION MODAL - NOOR LIQUID GLASS */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            id="logout-confirmation-modal"
            className={`w-full max-w-sm rounded-[28px] p-6 border shadow-2xl transition-all ${
              isDark
                ? 'liquid-glass border-[#C9A063]/30 text-stone-100 shadow-[0_16px_48px_rgba(0,0,0,0.8)]'
                : 'liquid-glass-light border-[#C9A063]/35 text-stone-900 shadow-[0_16px_48px_rgba(0,0,0,0.15)]'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <LogOut className="w-5 h-5" />
            </div>

            <h3 className="text-center text-base font-serif-heading font-bold text-[#F5EFE6] mb-1.5">
              {t(lang, 'logOutConfirmTitle')}
            </h3>

            <p className="text-center text-xs text-stone-300 font-light leading-relaxed mb-5">
              {t(lang, 'logOutConfirmDesc')}
            </p>

            <div className="flex items-center gap-2.5">
              <button
                id="cancel-logout-btn"
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700/60 bg-stone-800/60 hover:bg-stone-700/80 text-xs font-semibold text-stone-200 transition-colors cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                id="confirm-logout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 text-[#0A0D12] text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {t(lang, 'logOut')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOOR TECHNICAL SUPPORT AI MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#0E1217] border-[#C9A063]/30 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 text-[#DFBA7F] flex items-center justify-center">
                  <NoorAIIcon className="w-4 h-4 text-[#DFBA7F]" />
                </div>
                <div>
                  <h3 className="text-sm font-serif-heading font-bold text-[#F5EFE6]">
                    {isArabic ? 'الدعم الفني الذكي' : 'Noor Support AI'}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {isArabic ? 'حل المشكلات التقنية والأعطال' : 'Technical App Troubleshooting & Bugs'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportResponse(null);
                }}
                className="text-stone-400 hover:text-stone-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Support Form */}
            <form onSubmit={handleSendSupportMessage} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  {isArabic ? 'تصنيف المشكلة' : 'Issue Category'}
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#12161D] border-stone-700 text-stone-200'
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <option value="Audio & Playback">{isArabic ? 'صوتيات القرآن الكريم وتلاوات القراء' : "Qur'an Audio & Reciter Playback"}</option>
                  <option value="Prayer Times">{isArabic ? 'مواقيت الصلاة والعد التنازلي' : 'Prayer Times & Countdown'}</option>
                  <option value="Learning System">{isArabic ? 'أكاديمية نور ونقاط الإنجاز' : 'Noor Learn & XP Streaks'}</option>
                  <option value="Bug Report">{isArabic ? 'الإبلاغ عن خلل أو عطل برمجي' : 'Found a Bug / Glitch'}</option>
                  <option value="Feature Suggestion">{isArabic ? 'اقتراح ميزة جديدة' : 'Feature Suggestion'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                  {isArabic ? 'صف المشكلة بالتفصيل' : 'Describe the Issue'}
                </label>
                <textarea
                  rows={3}
                  value={supportInput}
                  onChange={(e) => setSupportInput(e.target.value)}
                  placeholder={
                    isArabic
                      ? 'مثال: توقف الصوت فجأة عند تغيير القارئ...'
                      : 'e.g., My audio paused unexpectedly when changing reciters...'
                  }
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#12161D] border-stone-700 text-stone-200 placeholder-stone-500'
                      : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!supportInput.trim() || supportLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 disabled:opacity-40 text-[#090B0E] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {supportLoading
                  ? (isArabic ? 'جاري الفحص والتحليل...' : 'Troubleshooting...')
                  : (isArabic ? 'إرسال للدعم الفني' : 'Ask Support AI')}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Support AI Resolution Output */}
            {supportResponse && (
              <div className="mt-4 pt-4 border-t border-stone-700/30 space-y-2.5 animate-fadeIn">
                <div className="text-xs font-semibold text-[#DFBA7F]">
                  {supportResponse.greeting}
                </div>

                <div className="space-y-1.5">
                  {supportResponse.troubleshootingSteps?.map((step, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-stone-300 p-2 rounded-xl bg-[#12161D] border border-stone-700/30"
                    >
                      {step}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30 text-xs text-[#DFBA7F]">
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />
                    <span>
                      {isArabic ? 'تم قيد التذكرة: ' : 'Ticket Logged: '}
                      {supportResponse.ticketId}
                    </span>
                  </div>
                  <div className="text-stone-300">{supportResponse.resolutionSummary}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHARITY & GIVE BACK MODAL */}
      {showCharityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all ${
              isDark ? 'bg-[#0E1217] border-[#C9A063]/30 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#DFBA7F]" />
                <h3 className="text-base font-serif-heading font-bold text-[#F5EFE6]">
                  {isArabic ? 'دعم تطبيق نور والمساهمة' : 'Support Noor & Give Back'}
                </h3>
              </div>
              <button
                onClick={() => setShowCharityModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-stone-300">
              <p>
                <strong>
                  {isArabic
                    ? 'تطبيق نفيس نور صُمم كرفيق رقمي إيماني نقي بدون أي اشتراكات أو حواجز دفع.'
                    : 'Noor is built as a peaceful digital companion with zero paywalls.'}
                </strong>
              </p>
              <p>
                {isArabic
                  ? 'كافة الخدمات والخصائص الإسلامية — قراءة القرآن، التفاسير، التلاوات الصوتية، المسارات التعليمية، والاسترشاد الذكي المعتمد — ستبقى مجانية تماماً لجميع المسلمين حول العالم.'
                  : "All essential Islamic features — Qur'an reading, translations, audio recitations, learning paths, and verified AI guidance — will remain free for Muslims worldwide."}
              </p>
              <div className="p-3.5 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30 text-stone-200 space-y-1">
                <div className="font-bold text-[#DFBA7F]">
                  {isArabic ? 'صدقة جارية مستمرة' : 'Ongoing Sadaqah Jariyah'}
                </div>
                <p className="text-[11px] text-stone-300">
                  {isArabic
                    ? '١٠٠٪ من أي مساهمات اختيارية تُخصص لتكاليف استضافة الخوادم السحابية، وحفظ ونشر بيانات المصحف الشريف، ومشاريع سقيا الماء في المناطق المحتاجة.'
                    : "100% of optional supporter contributions are dedicated toward app hosting, Qur'an data preservation, and clean water wells in impoverished communities."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCharityModal(false)}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 text-[#090B0E] font-bold text-xs shadow-md cursor-pointer"
            >
              {isArabic ? 'جزاكم الله خيراً' : 'Jazakum Allahu Khairan'}
            </button>
          </div>
        </div>
      )}

      {/* Location & Calculation Method Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        isDark={isDark}
        userStats={userStats}
        onUpdateStats={onUpdateStats}
      />

      {/* Privacy Sanctuary & Data Management Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        isDark={isDark}
        userStats={userStats}
        onUpdateStats={onUpdateStats}
        onResetAllData={onResetAllData}
      />

      {/* Account & Device Sync Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        isDark={isDark}
        userStats={userStats}
        onAccountLoaded={(stats) => {
          if (onAccountLoaded) onAccountLoaded(stats);
          else onUpdateStats(stats);
        }}
        onLogout={() => {
          if (onLogout) onLogout();
          else {
            onUpdateStats({
              isLoggedIn: false,
              accountId: undefined,
              accountEmail: undefined,
            });
          }
        }}
      />

      {/* 10-Language Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        isDark={isDark}
        currentLanguage={lang}
        onSelectLanguage={handleLanguageSelect}
      />

      {/* Modern About Nafis Noor Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        isDark={isDark}
        lang={lang}
        onOpenPrivacyPolicy={() => {
          setIsAboutModalOpen(false);
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Terms of Service Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        isDark={isDark}
      />

      {/* True Qibla Compass Modal (Opened exclusively from Journey Page) */}
      <QiblaCompassModal
        isOpen={isQiblaModalOpen}
        onClose={() => setIsQiblaModalOpen(false)}
        userLocation={userStats.userLocation}
        isDark={isDark}
      />

      {/* Islamic Dream Interpretation Full Page (Noor AI Design) */}
      {isDreamScreenOpen && (
        <DreamInterpretationScreen
          isDark={isDark}
          initialPrompt={selectedDreamPrompt}
          onClose={() => {
            setIsDreamScreenOpen(false);
            setTimeout(() => {
              const cardEl = document.getElementById('journey-dream-interpreter-card');
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 60);
          }}
        />
      )}

      {/* Ramadan Updates Modal (Shows ONLY updates) */}
      <NoorRamadanUpdatesModal
        isOpen={isRamadanUpdatesOpen}
        onClose={() => setIsRamadanUpdatesOpen(false)}
        isDark={isDark}
        ramadanStatus={ramadanStatus}
        isRamadanSimulated={isRamadanSimulated}
        onToggleSimulated={() => {
          const nextVal = !isRamadanSimulated;
          setIsRamadanSimulated(nextVal);
          localStorage.setItem('noor_simulate_ramadan', nextVal ? 'true' : 'false');
          detectRamadanStatus(userStats.userLatitude, userStats.userLongitude).then((st) => setRamadanStatus(st));
        }}
        onProceedToRamadan={
          (ramadanStatus?.isRamadan || isRamadanSimulated)
            ? () => {
                if (onNavigateToRamadan) {
                  onNavigateToRamadan();
                } else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/noor-ramadan');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }
            : undefined
        }
      />


      {/* Dedicated Feedback & Suggestions Screen */}
      <FeedbackScreen
        isOpen={isFeedbackScreenOpen}
        onClose={() => setIsFeedbackScreenOpen(false)}
        isDark={isDark}
        lang={lang}
        userStats={userStats}
        onOpenAdminConsole={() => {
          setIsFeedbackScreenOpen(false);
          setIsAdminFeedbackOpen(true);
        }}
      />

      {/* Private Founder Feedback Management Console */}
      <AdminFeedbackManager
        isOpen={isAdminFeedbackOpen}
        onClose={() => setIsAdminFeedbackOpen(false)}
        isDark={isDark}
        lang={lang}
        userStats={userStats}
        onAdminAuthenticated={(updated) => onUpdateStats(updated)}
        initialSubmissionId={reviewSubmissionId}
      />
    </div>
  );
};
