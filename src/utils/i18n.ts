export type SupportedLanguageCode =
  | 'en'
  | 'ar'
  | 'am'
  | 'fr'
  | 'zh'
  | 'es'
  | 'tr'
  | 'ur'
  | 'id'
  | 'de';

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', direction: 'ltr', flag: '🇪🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', flag: '🇹🇷' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', flag: '🇵🇰' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', flag: '🇮🇩' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
];

export type TranslationKey =
  // App brand & common
  | 'appName'
  | 'peaceBeUponYou'
  | 'welcome'
  | 'welcomeUser'
  | 'continue'
  | 'back'
  | 'next'
  | 'save'
  | 'done'
  | 'cancel'
  | 'confirm'
  | 'close'
  | 'edit'
  | 'delete'
  | 'search'
  | 'loading'
  | 'error'
  | 'success'
  | 'retry'
  | 'viewAll'
  | 'copy'
  | 'copied'
  | 'share'
  | 'connected'
  | 'today'
  | 'streak'
  | 'daysStreak'
  | 'activeStreak'
  | 'days'
  | 'madeBy'
  | 'creatorName'

  // First time language selection
  | 'chooseLanguageTitle'
  | 'chooseLanguageSubtitle'
  | 'continueWithLanguage'
  | 'languageSelectedDesc'

  // Navigation tabs
  | 'home'
  | 'quran'
  | 'dhikr'
  | 'noorAi'
  | 'study'
  | 'profile'
  | 'sanctuary'
  | 'homeDesc'
  | 'quranDesc'
  | 'dhikrDesc'
  | 'noorAiDesc'
  | 'studyDesc'
  | 'profileDesc'

  // Authentication & Onboarding
  | 'authWelcomeTitle'
  | 'authWelcomeSubtitle'
  | 'signIn'
  | 'signUp'
  | 'createAccount'
  | 'continueAsGuest'
  | 'continueWithGoogle'
  | 'emailAddress'
  | 'password'
  | 'fullName'
  | 'forgotPassword'
  | 'resetPassword'
  | 'dontHaveAccount'
  | 'alreadyHaveAccount'
  | 'adminAccess'
  | 'adminTitle'
  | 'adminPassword'
  | 'enterAdminCode'
  | 'termsAgreement'
  | 'guestNotice'

  // Home Screen
  | 'nextPrayer'
  | 'prayerTimes'
  | 'fajr'
  | 'sunrise'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'remainingTime'
  | 'qiblaDirection'
  | 'dailyAyah'
  | 'dailyReflection'
  | 'listenAyah'
  | 'quickActions'
  | 'continueReading'
  | 'recentSurah'
  | 'tasbihCounter'
  | 'askNoorAi'
  | 'trackPrayer'
  | 'prayersCompletedToday'
  | 'tapToLog'
  | 'prayerLogged'
  | 'hisnulMuslim'
  | 'allPrayers'

  // Quran & Tasmee3
  | 'quranHeader'
  | 'quranSubheader'
  | 'searchSurah'
  | 'surah'
  | 'ayah'
  | 'ayahs'
  | 'juz'
  | 'page'
  | 'reciter'
  | 'selectReciter'
  | 'playAudio'
  | 'pauseAudio'
  | 'viewTafsir'
  | 'startTasmee3'
  | 'tasmee3Title'
  | 'tasmee3Subtitle'
  | 'listening'
  | 'accuracy'
  | 'micPermissionNeeded'

  // Dhikr & Dua
  | 'dhikrHeader'
  | 'dhikrSubheader'
  | 'morningAdhkar'
  | 'eveningAdhkar'
  | 'afterPrayerAdhkar'
  | 'dailyDuas'
  | 'tapToCount'
  | 'resetCounter'
  | 'targetReached'
  | 'saveDua'
  | 'saved'

  // Noor AI
  | 'noorAiHeader'
  | 'noorAiSubheader'
  | 'askPlaceholder'
  | 'send'
  | 'suggestedQuestions'
  | 'clearChat'
  | 'newConversation'
  | 'disclaimer'
  | 'sourcesVerified'

  // Study & Learning
  | 'studyHeader'
  | 'studySubheader'
  | 'courses'
  | 'startLesson'
  | 'continueLesson'
  | 'lessonCompleted'
  | 'quizTitle'
  | 'earnXp'

  // Settings & Profile
  | 'settings'
  | 'journey'
  | 'bookmarks'
  | 'settingsTitle'
  | 'language'
  | 'languageSubtitle'
  | 'theme'
  | 'themeSubtitle'
  | 'themeLight'
  | 'themeLightDesc'
  | 'themeDark'
  | 'themeDarkDesc'
  | 'themeSystem'
  | 'themeSystemDesc'
  | 'accountSection'
  | 'activeCloudSync'
  | 'manageAccount'
  | 'signInOrCreate'
  | 'prayerReminders'
  | 'prayerRemindersDesc'
  | 'remindersPaused'
  | 'turnOnReminders'
  | 'enableAlert'
  | 'sendTestAlert'
  | 'locationSection'
  | 'calcMethod'
  | 'privacySection'
  | 'privacyPolicy'
  | 'exportData'
  | 'supportSection'
  | 'supportAi'
  | 'giveBack'
  | 'resetApp'
  | 'logOut'
  | 'logOutConfirmTitle'
  | 'logOutConfirmDesc'
  | 'totalXp'
  | 'lessonsCompleted'

  // About Modal
  | 'aboutTitle'
  | 'aboutSubtitle'
  | 'openAbout'
  | 'appDescription'
  | 'noorAiTitle'
  | 'noorAiSubtitle'
  | 'openNoorAi'
  | 'noorAiDescShort'
  | 'appInfo'
  | 'version'
  | 'devStatus'
  | 'devStatusVal'
  | 'aiInfo'
  | 'aiInfoVal'
  | 'termsInfo'
  | 'termsInfoVal'
  | 'privacyInfo'
  | 'privacyInfoVal'

  // Navigation & Badges
  | 'prayerCheck'
  | 'prayerCheckDesc'
  | 'prayerCheckShort'
  | 'sanctuaryEmblem'
  | 'timeLeft'
  | 'atRisk'

  // Home & Quick Actions
  | 'dailyPrayerCheck'
  | 'remindersLabel'
  | 'remindersNormal'
  | 'bismillahTranslation'
  | 'appEmblemText'
  | 'pagesReadCount'
  | 'exploreFortressHome'
  | 'noorCompanion'
  | 'askNoor'
  | 'liveGuide'
  | 'verseRestReflection'

  // Prayer Check Screen & Modal
  | 'prayerCheckHeroTitle'
  | 'prayerCheckHeroDesc'
  | 'checkNow'
  | 'nextLocked'
  | 'todays5Prayers'
  | 'completedOf5'
  | 'statusPending'
  | 'statusLocked'
  | 'statusOnTime'
  | 'statusLate'
  | 'statusDidNotPray'
  | 'statusMissed'
  | 'statusTimeArrived'
  | 'stepOf'
  | 'prayerVerificationStep'
  | 'reflectionStep'
  | 'confirmationStep'
  | 'recordSavedStep'
  | 'didYouPrayQuestion'
  | 'scheduledAt'
  | 'yesOnTime'
  | 'yesOnTimeDesc'
  | 'yesLate'
  | 'yesLateDesc'
  | 'noDidNotPray'
  | 'noDidNotPrayDesc'
  | 'solemnReflectionTitle'
  | 'solemnReflectionArabic'
  | 'solemnReflectionP1'
  | 'solemnReflectionP2'
  | 'learnMoreFaq'
  | 'countdownInProgress'
  | 'countdownComplete'
  | 'iUnderstandConfirm'
  | 'secs'
  | 'ready'
  | 'oathSolemnTitle'
  | 'oathSolemnSub'
  | 'oathArabicFormula'
  | 'oathEnglishFormula'
  | 'oathConfirmBtn'
  | 'backToSelection'
  | 'prayerRecordedTitle'
  | 'prayerRecordedSub'
  | 'returnHome'
  | 'viewPrayerHistory'

  // Streak Risk & Exit Modals
  | 'streakAtRiskBadge'
  | 'dontLoseStreak'
  | 'streakActionPrompt'
  | 'completeDhikrNow'
  | 'readQuranNow'
  | 'learnNow'
  | 'exitTitle'
  | 'exitSub'
  | 'stayInApp'
  | 'confirmExit'

  // Notifications & Toasts
  | 'prayerReminderTitle'
  | 'prayerScheduledFor'
  | 'prayerNowTime'
  | 'prayerInMin'

  // Profile & Settings
  | 'khatmPlannerTitle'
  | 'khatmPagesProgress'
  | 'khatmRemaining'
  | 'khatmPagesLeft'
  | 'accountSyncTitle'
  | 'changeLanguageBtn'
  | 'languagesCount'
  | 'notificationsSettingsTitle'
  | 'notificationsSettingsSub'
  | 'locationAstroTitle'
  | 'browserPushActive'
  | 'browserPushBlocked'
  | 'browserPushNeeded'
  | 'browserPushActiveDesc'
  | 'browserPushNeededDesc'
  | 'enableSystemAlert'
  | 'requesting'
  | 'remindersPausedText'
  | 'calcMethodTitle';

import { en } from './translations/en';
import { ar } from './translations/ar';
import { am } from './translations/am';
import { fr } from './translations/fr';
import { zh } from './translations/zh';
import { es } from './translations/es';
import { tr } from './translations/tr';
import { ur } from './translations/ur';
import { id } from './translations/id';
import { de } from './translations/de';

export const TRANSLATIONS: Record<SupportedLanguageCode, Record<TranslationKey, string>> = {
  en,
  ar,
  am,
  fr,
  zh,
  es,
  tr,
  ur,
  id,
  de,
};

export function getGlobalLanguage(): SupportedLanguageCode {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('noor_app_language');
      if (stored) return getLanguageCode(stored);
    } catch {
      // ignore
    }
  }
  return 'en';
}

let activeGlobalLang: SupportedLanguageCode = 'en';

export function setGlobalLanguage(langInput: string): SupportedLanguageCode {
  const code = getLanguageCode(langInput);
  activeGlobalLang = code;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('noor_app_language', code);
      document.documentElement.lang = code;
      document.documentElement.dir = isRTLLanguage(code) ? 'rtl' : 'ltr';
      window.dispatchEvent(new CustomEvent('app_language_changed', { detail: { language: code } }));
    } catch {
      // ignore
    }
  }
  return code;
}

// Client-side language header helpers
export function getLanguageHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders || {});
  try {
    const lang = getGlobalLanguage();
    if (!headers.has('x-app-language')) {
      headers.set('x-app-language', lang);
    }
    if (!headers.has('x-language')) {
      headers.set('x-language', lang);
    }
  } catch {
    // Ignore fallback
  }
  return headers;
}

export async function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const nextInit: RequestInit = init ? { ...init } : {};
  nextInit.headers = getLanguageHeaders(nextInit.headers);
  return window.fetch(input, nextInit);
}

// Client-side automatic language header injection for all API calls (safe against read-only window.fetch)
try {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    const interceptedFetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      try {
        const lang = getGlobalLanguage();
        const isApi =
          (typeof input === 'string' && input.includes('/api/')) ||
          (input instanceof URL && input.pathname.includes('/api/')) ||
          (typeof input === 'object' && input !== null && 'url' in input && typeof (input as Request).url === 'string' && (input as Request).url.includes('/api/'));

        if (isApi) {
          init = init ? { ...init } : {};
          const headers = new Headers(init.headers || {});
          if (!headers.has('x-app-language')) {
            headers.set('x-app-language', lang);
          }
          if (!headers.has('x-language')) {
            headers.set('x-language', lang);
          }
          init.headers = headers;
        }
      } catch {
        // Safe fallback
      }
      return originalFetch(input, init);
    };

    // Try defining property or assigning safely; ignore if getter-only or sealed
    try {
      Object.defineProperty(window, 'fetch', {
        value: interceptedFetch,
        writable: true,
        configurable: true,
      });
    } catch {
      // In sandboxed frames or environments where window.fetch has only a getter, silently ignore
    }
  }
} catch {
  // Safe fallback
}

export function getLanguageCode(langString?: string): SupportedLanguageCode {
  if (!langString) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('noor_app_language');
        if (stored) return getLanguageCode(stored);
      } catch {
        // ignore
      }
    }
    return activeGlobalLang || 'en';
  }
  const lower = langString.toLowerCase().trim();
  if (lower === 'ar' || lower.includes('arab') || lower.includes('عرب')) return 'ar';
  if (lower === 'am' || lower.includes('amhar') || lower.includes('አማር')) return 'am';
  if (lower === 'fr' || lower.includes('french') || lower.includes('franç')) return 'fr';
  if (lower === 'zh' || lower.includes('chin') || lower.includes('中文')) return 'zh';
  if (lower === 'es' || lower.includes('span') || lower.includes('españ')) return 'es';
  if (lower === 'tr' || lower.includes('turk') || lower.includes('türk')) return 'tr';
  if (lower === 'ur' || lower.includes('urdu') || lower.includes('اردو')) return 'ur';
  if (lower === 'id' || lower.includes('indo') || lower.includes('bahasa')) return 'id';
  if (lower === 'de' || lower.includes('germ') || lower.includes('deutsch')) return 'de';
  return 'en';
}

export function isRTLLanguage(langCode: SupportedLanguageCode | string): boolean {
  const code = getLanguageCode(langCode);
  return code === 'ar' || code === 'ur';
}

export function t(
  lang: SupportedLanguageCode | string | undefined,
  key: TranslationKey | string,
  params?: Record<string, string | number>
): string {
  const code = getLanguageCode(lang);
  const dict = TRANSLATIONS[code] || TRANSLATIONS.en;
  let val =
    (dict as Record<string, string>)[key] ||
    (TRANSLATIONS.en as Record<string, string>)[key] ||
    key;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      val = val.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }
  return val;
}
