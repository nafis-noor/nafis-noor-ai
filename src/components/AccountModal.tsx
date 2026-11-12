import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Cloud,
  Check,
} from 'lucide-react';
import { UserStats, UserAccount } from '../types';
import {
  registerAccount,
  authenticateAccount,
  authenticateWithGoogle,
  logoutAccount,
  syncAccountData,
  hasAccountWithEmail,
} from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onAccountLoaded: (stats: UserStats) => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onAccountLoaded,
  onLogout,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'account-sync-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [view, setView] = useState<'status' | 'login' | 'register'>(
    userStats.isLoggedIn ? 'status' : 'login'
  );

  // Form states
  const [name, setName] = useState(userStats.userName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [syncNotice, setSyncNotice] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleSubmitting(true);
    try {
      const res = await authenticateWithGoogle(userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        setErrorMsg(res.error || (isArabic ? 'فشل تسجيل الدخول بحساب Google.' : 'Failed to sign in with Google.'));
      }
    } catch {
      setErrorMsg(isArabic ? 'تعذر إتمام الدخول بحساب Google.' : 'Google sign in was interrupted.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    if (hasAccountWithEmail(cleanEmail)) {
      setIsSubmitting(false);
      setView('login');
      setErrorMsg(
        isArabic
          ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
          : 'You have used this app before. Please log in with your password.'
      );
      return;
    }

    try {
      const res = await registerAccount(name, cleanEmail, password, userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        const errLower = (res.error || '').toLowerCase();
        if (
          errLower.includes('already in use') ||
          errLower.includes('already exists') ||
          errLower.includes('sign in') ||
          errLower.includes('log in')
        ) {
          setView('login');
          setErrorMsg(
            isArabic
              ? 'لقد استخدمت هذا التطبيق مسبقاً، يرجى تسجيل الدخول بكلمة المرور الخاصة بك.'
              : 'You have used this app before. Please log in with your password.'
          );
        } else {
          setErrorMsg(res.error || (isArabic ? 'فشل إنشاء الحساب.' : 'Failed to create account.'));
        }
      }
    } catch {
      setErrorMsg(isArabic ? 'حدث خطأ أثناء إنشاء الحساب.' : 'An error occurred during account creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authenticateAccount(email, password, userStats);
      if (res.success && res.account) {
        onAccountLoaded(res.account.stats);
        setView('status');
      } else {
        setErrorMsg(res.error || (isArabic ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.'));
      }
    } catch {
      setErrorMsg(isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = () => {
    if (userStats.accountId) {
      syncAccountData(userStats.accountId, userStats);
      setSyncNotice(true);
      setTimeout(() => setSyncNotice(false), 2500);
    }
  };

  const handleSignOut = () => {
    logoutAccount();
    onLogout();
    setView('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(14px,env(safe-area-inset-bottom))] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="account-modal-container"
        className={`w-full max-w-md rounded-[32px] p-5 sm:p-7 border shadow-2xl overflow-y-auto max-h-[min(92dvh,700px)] flex flex-col ${
          isDark
            ? 'bg-[#0E1217] border-[#C9A063]/30 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-700/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                {userStats.isLoggedIn
                  ? (isArabic ? 'حساب نور والمزامنة الآمنة' : 'Noor Account & Device Sync')
                  : (isArabic ? 'الحساب والمزامنة' : 'Account & Sync')}
              </h2>
              <p className="text-xs text-stone-400">
                {userStats.isLoggedIn
                  ? (isArabic ? 'سجل إيماني محفوظ ومزامن بأمان عبر أجهزتك' : 'Your spiritual journey saved safely across devices')
                  : (isArabic ? 'مزامنة إنجازاتك الحقيقية عبر جميع أجهزتك' : 'Sync your real progress across devices')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: ACTIVE LOGGED IN ACCOUNT STATUS */}
        {userStats.isLoggedIn && view === 'status' && (
          <div className="py-4 space-y-4 text-xs">
            {/* Account Card */}
            <div className="p-4 rounded-2xl bg-[#12161D] border border-[#C9A063]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif-heading font-bold text-sm text-[#F5EFE6]">
                  {userStats.userName || (isArabic ? 'عبد الله' : 'Servant of Allah')}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  <Cloud className="w-3 h-3" />
                  {isArabic ? 'متزامن بأمان' : 'Safely Synced'}
                </span>
              </div>
              <p className="text-stone-400 text-xs font-mono">{userStats.accountEmail || (isArabic ? 'حساب Google' : 'Google Account')}</p>

              {userStats.accountId && (
                <div className="text-[10px] text-stone-500 font-mono truncate">
                  {isArabic ? 'المعرف: ' : 'UID: '}{userStats.accountId}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="p-2 rounded-xl bg-[#090B0E]">
                  <div className="text-[10px] text-stone-400">{isArabic ? 'المواظبة' : 'Overall Streak'}</div>
                  <div className="font-bold text-[#DFBA7F]">{userStats.overallStreak}{isArabic ? ' يوم' : 'd'}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#090B0E]">
                  <div className="text-[10px] text-stone-400">{isArabic ? 'صفحات القرآن' : 'Pages Read'}</div>
                  <div className="font-bold text-stone-200">{userStats.quranPagesRead}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#090B0E]">
                  <div className="text-[10px] text-stone-400">{isArabic ? 'نقاط الإنجاز' : 'Total XP'}</div>
                  <div className="font-bold text-stone-200">{userStats.totalXP}</div>
                </div>
              </div>
            </div>

            {/* Sync Now Action */}
            <button
              onClick={handleManualSync}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C9A063]/15 hover:bg-[#C9A063]/25 border border-[#C9A063]/30 text-[#DFBA7F] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncNotice ? 'animate-spin' : ''}`} />
              <span>
                {syncNotice
                  ? (isArabic ? 'تم حفظ التحديثات بنجاح!' : 'Progress saved successfully!')
                  : (isArabic ? 'حفظ التحديثات الآن' : 'Save Progress Now')}
              </span>
            </button>

            {/* Sign Out Button */}
            <button
              id="account-signout-btn"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-stone-300 hover:text-red-400 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تسجيل الخروج من هذا الجهاز' : 'Sign Out from This Device'}</span>
            </button>
            <p className="text-[10px] text-center text-stone-500">
              {isArabic
                ? 'تسجيل الخروج يحفظ جميع بياناتك وقراءاتك بأمان.'
                : 'Signing out keeps all your reading progress and streaks safe.'}
            </p>
          </div>
        )}

        {/* VIEW 2: LOGIN */}
        {(!userStats.isLoggedIn || view === 'login') && view !== 'register' && (
          <div className="py-4 space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-white hover:bg-stone-100 text-stone-800 shadow-md transition-all flex items-center justify-center gap-2.5"
            >
              {isGoogleSubmitting ? (
                <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleSubmitting ? (isArabic ? 'جاري الدخول...' : 'Signing in...') : (isArabic ? 'المتابعة بحساب Google' : 'Continue with Google')}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-stone-500 uppercase font-mono">{isArabic ? 'أو بالبريد الإلكتروني' : 'or email'}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-stone-400 mb-1">{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#C9A063]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">{isArabic ? 'كلمة المرور' : 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#C9A063]"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? (isArabic ? 'جاري الدخول...' : 'Signing In...') : (isArabic ? 'دخول واستعادة الإنجازات' : 'Sign In & Restore Progress')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center text-stone-400 text-[11px]">
              {isArabic ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('register');
                }}
                className="text-[#DFBA7F] font-semibold underline hover:opacity-90"
              >
                {isArabic ? 'إنشاء حساب جديد' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: REGISTER */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="py-4 space-y-3 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-stone-400 mb-1">{isArabic ? 'الاسم الكريم' : 'Your Name'}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: عبد الله' : 'e.g. Abdullah'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#C9A063]"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#C9A063]"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{isArabic ? 'كلمة المرور (٦ أحرف كحد أدنى)' : 'Password (min 6 characters)'}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#C9A063]"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? (isArabic ? 'جاري إنشاء الحساب...' : 'Creating Account...') : (isArabic ? 'إنشاء الحساب والمزامنة' : 'Create Account')}</span>
              <Sparkles className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-stone-400 text-[11px]">
              {isArabic ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('login');
                }}
                className="text-[#DFBA7F] font-semibold underline hover:opacity-90"
              >
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
