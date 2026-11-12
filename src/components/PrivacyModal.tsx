import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  EyeOff,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserStats } from '../types';
import { exportUserDataJSON, deleteAccount } from '../utils/accountManager';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getLanguageCode } from '../utils/i18n';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onResetAllData?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onUpdateStats,
  onResetAllData,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'privacy-sanctuary-modal');

  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'policy' | 'manage' | 'delete'>('policy');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [copiedExport, setCopiedExport] = useState(false);
  const [hasClearedChat, setHasClearedChat] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    const jsonString = exportUserDataJSON(userStats);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noor-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleClearAiChatHistory = () => {
    onUpdateStats({
      noorAiConversation: [],
    });
    setHasClearedChat(true);
    setTimeout(() => setHasClearedChat(false), 3000);
  };

  const handleDeleteAccountPermanent = () => {
    if (userStats.accountId) {
      deleteAccount(userStats.accountId);
    }
    if (onResetAllData) {
      onResetAllData();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="privacy-modal-container"
        className={`w-full max-w-lg rounded-[32px] p-6 sm:p-7 border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#0E1217] border-[#C9A063]/30 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-700/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                {isArabic ? 'الخصوصية وأمان البيانات' : 'Privacy & Data Sanctuary'}
              </h2>
              <p className="text-xs text-stone-400">
                {isArabic ? 'شفافية كاملة وتحكم تام في بياناتك الشخصية' : 'Clear, transparent & respectful data control'}
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

        {/* Tab Navigation */}
        <div className="flex gap-1.5 p-1 my-4 rounded-2xl bg-stone-900/60 border border-stone-800 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('policy')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'policy'
                ? 'bg-[#C9A063]/25 text-[#DFBA7F] border border-[#C9A063]/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {isArabic ? 'مبادئ الخصوصية' : 'Privacy Principles'}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-[#C9A063]/25 text-[#DFBA7F] border border-[#C9A063]/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {isArabic ? 'إدارة بياناتي' : 'Manage My Data'}
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'delete'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-stone-400 hover:text-red-400'
            }`}
          >
            {isArabic ? 'حذف الحساب' : 'Delete Account'}
          </button>
        </div>

        {/* Tab 1: Privacy Principles */}
        {activeTab === 'policy' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs leading-relaxed text-stone-300 no-scrollbar">
            {/* Core Privacy Promise Callout */}
            <div className="p-4 rounded-2xl bg-[#C9A063]/10 border border-[#C9A063]/30 space-y-2">
              <h3 className="font-serif-heading font-bold text-sm text-[#DFBA7F] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isArabic ? 'خصوصيتك أمانة مقدسة' : 'Your privacy matters.'}</span>
              </h3>
              <p className="text-stone-200">
                {isArabic
                  ? 'نستخدم فقط البيانات التي تختار تقديمها لتخصيص تجربتك الإيمانية في نور وتحسين عبادتك اليومية.'
                  : 'We only use the information you choose to provide to personalize Noor and improve your spiritual experience.'}
              </p>
              <p className="text-stone-300 text-[11px]">
                {isArabic ? (
                  <>
                    • بياناتك الشخصية لا تُنشر علناً بأي شكل من الأشكال.<br />
                    • تُحفظ معلوماتك بأمان في حسابك السحابي لتبقى إعداداتك وإنجازاتك متزامنة عبر أجهزتك.<br />
                    • خالٍ تماماً من الإعلانات، بيع البيانات، أو برمجيات التتبع والتجسس.
                  </>
                ) : (
                  <>
                    • Your private information is never displayed publicly.<br />
                    • Some information is stored securely with your Noor account so your settings and progress can follow you across devices.<br />
                    • No ads, no data selling, no tracking pixels.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#12161D] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-stone-200">
                  <Server className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'ماذا نحفظ ولماذا؟' : 'What We Store & Why'}</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  {isArabic ? (
                    <>
                      <strong>معرّف الحساب والتفضيلات:</strong> لحفظ لغتك المختارة، المظهر، والموقع الجغرافي لحساب مواقيت الصلاة بدقة فلكية.<br />
                      <strong>سجلات العبادة الحقيقية:</strong> صفحات القرآن التي تقرأها، عداد الأذكار، الدروس المكتملة، ونقاط الإنجاز الفعلية.<br />
                      <strong>أسئلة نور الإسلامي:</strong> تُحفظ محلياً ومع حسابك فقط لربط سياق المحادثة عبر الشاشات المختلفة.
                    </>
                  ) : (
                    <>
                      <strong>Account ID & Preferences:</strong> To maintain your chosen language, theme, and location for astronomical prayer calculations.<br />
                      <strong>Legitimate Activity Records:</strong> Only the Qur'an pages you read, Dhikr counts, completed lessons, and earned XP you actually finish.<br />
                      <strong>Noor AI Questions:</strong> Saved locally / with your account only to preserve your conversational thread across screens.
                    </>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12161D] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-stone-200">
                  <Lock className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'أمان كلمة المرور والتشفير' : 'Password Security'}</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  {isArabic
                    ? 'يتم تشفير كلمات المرور باستخدام خوارزميات التشفير العالمية الموثوقة مع التمليح الأمني. لا تُحفظ أي كلمة مرور بنصها الصريح مطلقاً.'
                    : 'Passwords are cryptographically hashed using industry-standard SHA-256 with salting. Plaintext passwords are never stored in any database.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12161D] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-stone-200">
                  <EyeOff className="w-4 h-4 text-[#DFBA7F]" />
                  <span>{isArabic ? 'من يمكنه الوصول لبياناتك؟' : 'Who Can Access Your Data'}</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  {isArabic
                    ? 'أنت وحدك من يملك الوصول لإحصائياتك وسجل محادثاتك. يمكنك تصدير بياناتك أو حذفها بالكامل في أي وقت بحرية تامة.'
                    : 'Only you have access to your personal stats and conversation history. You can export or delete your entire record at any time with complete autonomy.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manage My Data */}
        {activeTab === 'manage' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs text-stone-300 no-scrollbar">
            <div className="p-4 rounded-2xl bg-[#12161D] border border-[#C9A063]/25 space-y-3">
              <h3 className="font-semibold text-stone-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#DFBA7F]" />
                <span>{isArabic ? 'سجل بياناتك الحالي' : 'Current Data Footprint'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'معرف الحساب' : 'Account ID'}</div>
                  <div className="font-mono text-[#DFBA7F] truncate">{userStats.accountId || (isArabic ? 'جلسة ضيف' : 'Guest Session')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'أيام المواظبة' : 'Overall Streak'}</div>
                  <div className="font-bold text-stone-200">{userStats.overallStreak} {isArabic ? 'يوم' : 'days'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'صفحات القرآن' : 'Pages Read'}</div>
                  <div className="font-bold text-stone-200">{userStats.quranPagesRead} {isArabic ? 'صفحة' : 'pages'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'الآيات المحفوظة' : 'Saved Bookmarks'}</div>
                  <div className="font-bold text-stone-200">{userStats.bookmarks.length} {isArabic ? 'آية' : 'ayahs'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'نقاط الإنجاز' : 'Total XP'}</div>
                  <div className="font-bold text-stone-200">{userStats.totalXP} {isArabic ? 'نقطة' : 'XP'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090B0E] border border-white/5">
                  <div className="text-stone-400">{isArabic ? 'رسائل نور الإسلامي' : 'AI Chat Messages'}</div>
                  <div className="font-bold text-stone-200">{userStats.noorAiConversation?.length || 0} {isArabic ? 'رسالة' : 'messages'}</div>
                </div>
              </div>
            </div>

            {/* Actions: Export Data & Clear AI History */}
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="w-full py-3 px-4 rounded-2xl bg-[#C9A063]/15 hover:bg-[#C9A063]/25 border border-[#C9A063]/35 text-[#DFBA7F] font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {copiedExport ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                <span>{copiedExport ? (isArabic ? 'تم تصدير وتنزيل ملف البيانات بنجاح!' : 'Data Exported to Download File!') : (isArabic ? 'تصدير كامل بياناتي بتنسيق JSON' : 'Export My Data as JSON')}</span>
              </button>

              <button
                onClick={handleClearAiChatHistory}
                className="w-full py-3 px-4 rounded-2xl bg-[#12161D] hover:bg-stone-800/80 border border-white/10 text-stone-300 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {hasClearedChat ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Trash2 className="w-4 h-4 text-stone-400" />}
                <span>{hasClearedChat ? (isArabic ? 'تم مسح سجل محادثات نور' : 'AI Chat History Cleared') : (isArabic ? 'مسح سجل محادثات نور الإسلامي' : 'Clear Noor AI Conversation History')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Delete Account */}
        {activeTab === 'delete' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs text-stone-300 no-scrollbar">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>{isArabic ? 'حذف الحساب نهائياً بلا رجعة' : 'Irreversible Account Deletion'}</span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {isArabic
                  ? 'حذف الحساب سيقوم بمسح كافة سجلات عبادتك وإنجازاتك، والعلامات المرجعية للقرآن، ونقاط الأكاديمية، والأدعية المحفوظة من هذا الجهاز ومن قاعدة البيانات نهائياً.'
                  : 'Deleting your account will permanently purge your progress records, Qur\'an bookmarks, learning XP, streaks, and saved duas from this device and our persistent database.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] text-stone-400">
                {isArabic ? (
                  <>
                    لتأكيد الحذف النهائي، اكتب <strong className="text-red-400">حذف</strong> في الحقل أدناه:
                  </>
                ) : (
                  <>
                    To confirm, type <strong className="text-red-400">DELETE</strong> in the box below:
                  </>
                )}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={isArabic ? 'اكتب كلمة حذف للتأكيد' : 'Type DELETE to confirm'}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#12161D] border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-red-500"
              />

              <button
                disabled={isArabic ? deleteConfirmText.trim() !== 'حذف' : deleteConfirmText.trim() !== 'DELETE'}
                onClick={handleDeleteAccountPermanent}
                className="w-full py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:pointer-events-none text-white font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isArabic ? 'حذف حسابي وبياناتي نهائياً' : 'Permanently Delete My Account & Data'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Close */}
        <div className="pt-4 mt-auto border-t border-stone-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            {isArabic ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
