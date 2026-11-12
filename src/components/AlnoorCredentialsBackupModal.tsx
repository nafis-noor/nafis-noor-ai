import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Mail,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { UserStats } from '../types';
import { hashPassword } from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface AlnoorCredentialsBackupModalProps {
  isOpen: boolean;
  onClose: (updatedUsername?: string, passwordHash?: string, updatedEmail?: string) => void;
  isDark: boolean;
  userStats: UserStats;
  initialEmail?: string;
  initialName?: string;
}

export const AlnoorCredentialsBackupModal: React.FC<AlnoorCredentialsBackupModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  initialEmail,
  initialName,
}) => {
  useModalScrollLock(isOpen, 'alnoor-credentials-backup-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [email, setEmail] = useState(initialEmail || userStats.accountEmail || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(initialName || userStats.userName || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(
        isArabic
          ? 'يرجى إدخال بريد إلكتروني صحيح لتتمكن من تسجيل الدخول في أي وقت.'
          : 'Please enter a valid email address so you can log in anytime.'
      );
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg(
        isArabic
          ? 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل لحماية حسابك.'
          : 'Password must be at least 8 characters for your security.'
      );
      return;
    }

    const cleanUser = username.trim() || cleanEmail.split('@')[0] || 'Servant of Allah';

    setIsSaving(true);
    try {
      const pHash = await hashPassword(password, cleanEmail);
      setIsSaving(false);
      onClose(cleanUser, pHash, cleanEmail);
    } catch {
      setIsSaving(false);
      setErrorMsg(
        isArabic
          ? 'تعذر حفظ بيانات الاعتماد على خادم مجموعة نور.'
          : 'Failed to securely encrypt & backup credentials to Alnoorgroup server.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="alnoor-credentials-backup-container"
        className={`w-full max-w-md rounded-[32px] p-6 sm:p-7 border shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-[#0E1217] border-[#C9A063]/40 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-[#C9A063]/40 text-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.2)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-700/20 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                {isArabic ? 'خادم مجموعة نور الآمن للنسخ الاحتياطي' : 'Alnoorgroup Secure Cloud Backup'}
              </h2>
              <p className="text-xs text-stone-400">
                {isArabic ? 'حماية تامة وسرية مطلقة لبياناتك الشخصية' : 'Private & confidential Alnoorgroup server storage'}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs space-y-1.5 mb-5">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{isArabic ? 'تنبيه أمني هام: بريدك الإلكتروني هو مفتاح دخولك' : 'Important: Your Email is Your Login Key'}</span>
          </div>
          <p className="text-stone-300 font-light leading-relaxed">
            {isArabic
              ? 'يرجى حفظ بريدك الإلكتروني وكلمة المرور الخاصة بك جيداً! تتيح لك هذه البيانات تسجيل الدخول في أي وقت من أي جهاز، بينما تحافظ مجموعة نور على خصوصية جميع إنجازاتك ونشاطك داخل خوادمنا الآمنة.'
              : 'Please set and remember your login email and password! This ensures you can sign in anytime from any device, while Alnoorgroup securely backs up your progress in our private server.'}
          </p>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          {/* Email Field (Primary) */}
          <div>
            <label className="block text-xs font-bold text-[#DFBA7F] mb-1.5">
              {isArabic ? 'البريد الإلكتروني الأساسي لتسجيل الدخول' : 'Alnoorgroup Login Email'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#DFBA7F] absolute top-1/2 -translate-y-1/2 left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isArabic ? 'your.email@example.com' : 'your.email@example.com'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#12161D] border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#DFBA7F]"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-[#DFBA7F] mb-1.5">
              {isArabic ? 'أنشئ كلمة المرور الخاصة بك' : 'Create Secure Password'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#DFBA7F] absolute top-1/2 -translate-y-1/2 left-3.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isArabic ? '٨ أحرف على الأقل...' : 'At least 8 characters...'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#12161D] border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#DFBA7F]"
              />
            </div>
          </div>

          {/* Username Field (Secondary / Optional) */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              {isArabic ? 'اسم المستخدم في التطبيق (اختياري)' : 'App Username (Optional)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isArabic ? 'اسمك المستعار...' : 'Your display name...'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#12161D] border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#DFBA7F]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#090B0E] font-bold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSaving
                ? (isArabic ? 'جارٍ الحفظ على خادم مجموعة نور...' : 'Backing up to Alnoorgroup Server...')
                : (isArabic ? 'حفظ ونسخ احتياطي على خادم مجموعة نور' : 'Save & Securely Backup to Alnoorgroup Server')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
