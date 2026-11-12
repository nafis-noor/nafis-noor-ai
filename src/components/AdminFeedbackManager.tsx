import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  RefreshCw,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Mail,
  User,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Check,
  KeyRound,
} from 'lucide-react';
import { SupportedLanguageCode, isRTLLanguage } from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  FeedbackStatus,
  FeedbackSubmission,
  getFeedbackTranslations,
  fetchAdminFeedbackList,
  updateAdminFeedbackItem,
} from '../utils/feedbackService';
import { authenticateAdmin, authenticateWithGoogle } from '../utils/accountManager';
import { UserStats } from '../types';

interface AdminFeedbackManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: SupportedLanguageCode;
  userStats: UserStats;
  onAdminAuthenticated?: (updatedStats: Partial<UserStats>) => void;
  initialSubmissionId?: string | null;
}

export const AdminFeedbackManager: React.FC<AdminFeedbackManagerProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
  userStats,
  onAdminAuthenticated,
  initialSubmissionId,
}) => {
  useModalScrollLock(isOpen, 'admin-feedback-manager-modal');

  const tr = getFeedbackTranslations(lang);
  const isRtl = isRTLLanguage(lang);
  const isArabic = lang === 'ar';

  const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(() => {
    if (userStats.role === 'admin') return true;
    if (typeof window !== 'undefined' && sessionStorage.getItem('noor_admin_token')) {
      return true;
    }
    return false;
  });

  // Admin Login Gate States
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Feedback List & Filter States
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSubmissionId || null);

  // Reply & Action States
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  useEffect(() => {
    if (
      userStats.role === 'admin' ||
      (typeof window !== 'undefined' && Boolean(sessionStorage.getItem('noor_admin_token')))
    ) {
      setHasAdminAccess(true);
    }
  }, [userStats.role, isOpen]);

  useEffect(() => {
    if (initialSubmissionId) {
      setSelectedId(initialSubmissionId);
    }
  }, [initialSubmissionId]);

  const loadFeedback = useCallback(async () => {
    if (!hasAdminAccess) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await fetchAdminFeedbackList('All', 'All');
      setSubmissions(list);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        for (const item of list) {
          if (next[item.id] === undefined && item.adminReply) {
            next[item.id] = item.adminReply;
          }
        }
        return next;
      });
      if (initialSubmissionId) {
        setSelectedId(initialSubmissionId);
      } else if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Failed to load feedback submissions. Please verify your administrator session.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasAdminAccess, initialSubmissionId]);

  useEffect(() => {
    if (isOpen && hasAdminAccess) {
      loadFeedback();
    }
  }, [isOpen, hasAdminAccess, loadFeedback]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => {
      setActionToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!adminPassword.trim()) {
      setAuthError(isArabic ? 'يرجى إدخال كلمة مرور المسؤول.' : 'Please enter the Administrator password.');
      return;
    }
    setIsAuthenticating(true);
    try {
      const result = await authenticateAdmin(adminPassword.trim());
      if (!result.success) {
        setAuthError(result.error || 'Invalid administrator credentials.');
      } else {
        setHasAdminAccess(true);
        setAdminPassword('');
        if (onAdminAuthenticated) {
          onAdminAuthenticated({ role: 'admin', isLoggedIn: true });
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFounderGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithGoogle(userStats);
      if (result.cancelled) {
        return;
      }
      if (result.success && result.account && (result.account.role === 'admin' || result.account.email?.toLowerCase() === 'alnoorgroup.n@gmail.com')) {
        // Also request a verified server admin token using the Founder's Firebase ID token
        await authenticateAdmin('');
        setHasAdminAccess(true);
        if (onAdminAuthenticated) {
          onAdminAuthenticated({
            ...result.account.stats,
            role: 'admin',
            isLoggedIn: true,
          });
        }
      } else {
        setAuthError(
          isArabic
            ? 'هذا الحساب غير مصرح له بصلاحيات المؤسس (alnoorgroup.n@gmail.com).'
            : 'This Google account is not authorized as the Nafis Noor Founder (alnoorgroup.n@gmail.com).'
        );
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStatusUpdate = async (item: FeedbackSubmission, newStatus: FeedbackStatus) => {
    setUpdatingId(item.id);
    setLoadError(null);
    try {
      const res = await updateAdminFeedbackItem(
        item.id,
        { status: newStatus },
        item
      );
      setSubmissions((prev) =>
        prev.map((s) => (s.id === item.id ? res.submission : s))
      );
      showToast(
        isArabic
          ? `تم تحديث حالة الملاحظة (${item.id}) إلى ${tr.statuses[newStatus]}`
          : `Updated ${item.id} status to ${newStatus}`
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleResolved = async (item: FeedbackSubmission) => {
    setUpdatingId(item.id);
    setLoadError(null);
    try {
      const nextResolved = !item.isResolved;
      const res = await updateAdminFeedbackItem(
        item.id,
        { isResolved: nextResolved },
        item
      );
      setSubmissions((prev) =>
        prev.map((s) => (s.id === item.id ? res.submission : s))
      );
      showToast(
        nextResolved
          ? isArabic
            ? `تم تحديد (${item.id}) كـ تم الحل`
            : `Marked ${item.id} as Resolved`
          : isArabic
          ? `تم إعادة فتح (${item.id})`
          : `Reopened ${item.id}`
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to update resolution status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReply = async (item: FeedbackSubmission) => {
    const replyText = (replyDrafts[item.id] ?? '').trim();
    if (!replyText) return;

    setUpdatingId(item.id);
    setLoadError(null);
    try {
      const res = await updateAdminFeedbackItem(
        item.id,
        {
          adminReply: replyText,
          status: 'Answered',
        },
        item
      );
      setSubmissions((prev) =>
        prev.map((s) => (s.id === item.id ? res.submission : s))
      );
      showToast(
        res.userReplyEmailed
          ? isArabic
            ? `تم حفظ الرد وإرساله إلى بريد المستخدم (${item.email})`
            : `Reply saved & emailed to ${item.email}`
          : isArabic
          ? 'تم حفظ الرد وتحديث الحالة إلى تم الرد'
          : 'Reply saved & status updated to Answered'
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((item) => {
    if (categoryFilter !== 'All' && item.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'Resolved') {
        if (!item.isResolved) return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.userName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeItem =
    filteredSubmissions.find((s) => s.id === selectedId) ||
    submissions.find((s) => s.id === selectedId) ||
    filteredSubmissions[0] ||
    null;

  const totalCount = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'Pending').length;
  const reviewCount = submissions.filter((s) => s.status === 'Under Review').length;
  const answeredCount = submissions.filter((s) => s.status === 'Answered').length;
  const resolvedCount = submissions.filter((s) => s.isResolved).length;

  return (
    <div
      id="founder-feedback-management-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 overflow-y-auto transition-colors duration-300 ${
        isDark
          ? 'bg-[#070A0F]/95 text-[#F5EFE6]'
          : 'bg-[#F8F5EE]/95 text-stone-900'
      } backdrop-blur-xl animate-fadeIn`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-24">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            id="founder-feedback-back-btn"
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#12161F]/90 border-[#C9A063]/30 text-[#DFBA7F] hover:bg-[#181E29]'
                : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100 shadow-xs'
            }`}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isArabic ? 'إغلاق لوحة الإدارة' : 'Close Admin Console'}</span>
          </button>

          {hasAdminAccess && (
            <button
              id="founder-feedback-refresh-btn"
              type="button"
              onClick={loadFeedback}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isArabic ? 'تحديث القائمة' : 'Refresh Submissions'}</span>
            </button>
          )}
        </div>

        {/* Header Banner */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border mb-5 ${
            isDark
              ? 'liquid-glass border-emerald-500/35 shadow-lg'
              : 'liquid-glass-light border-emerald-600/35 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className={`text-base sm:text-lg font-serif-heading font-bold ${
                      isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                    }`}
                  >
                    {tr.adminConsoleTitle}
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isArabic ? 'خاص بالمؤسس والمسؤولين' : 'FOUNDER & ADMIN ONLY'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">{tr.adminConsoleSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* If not yet authenticated as Admin, show strict Founder Authentication Gate */}
        {!hasAdminAccess ? (
          <div
            id="founder-admin-auth-gate"
            className={`max-w-md mx-auto rounded-3xl p-6 sm:p-7 border space-y-5 ${
              isDark
                ? 'liquid-glass border-[#C9A063]/35 shadow-xl'
                : 'liquid-glass-light border-[#C9A063]/40 shadow-lg'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#C9A063]/20 border border-[#C9A063]/40 text-[#DFBA7F] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-base font-serif-heading font-bold">
                {isArabic
                  ? 'التحقق من صلاحية مؤسس نفيس نور'
                  : 'Authorized Founder Verification'}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isArabic
                  ? 'محتوى الملاحظات وعناوين البريد الإلكتروني محمية بالكامل. يرجى تسجيل الدخول بحساب المؤسس أو رمز المسؤول.'
                  : 'User feedback and email addresses are strictly protected. Sign in as the Founder or enter the server Administrator password.'}
              </p>
            </div>

            <button
              id="founder-google-auth-btn"
              type="button"
              onClick={handleFounderGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-2xl border border-[#C9A063]/45 bg-[#C9A063]/15 hover:bg-[#C9A063]/25 text-[#DFBA7F] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>
                {isArabic
                  ? 'الدخول بحساب Google للمؤسس (alnoorgroup.n@gmail.com)'
                  : 'Verify with Founder Google Account'}
              </span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-700/40" />
              <span className="shrink mx-3 text-[10px] uppercase tracking-wider text-stone-400">
                {isArabic ? 'أو عبر مفتاح المسؤول' : 'OR ADMIN KEY'}
              </span>
              <div className="flex-grow border-t border-stone-700/40" />
            </div>

            <form onSubmit={handlePasswordAuth} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#DFBA7F] absolute top-1/2 -translate-y-1/2 left-3.5" />
                <input
                  id="founder-admin-password-input"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={isArabic ? 'كلمة مرور المسؤول...' : 'Administrator password...'}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0D1119] border-stone-800 text-stone-100 focus:border-[#DFBA7F]'
                      : 'bg-white border-stone-300 text-stone-900 focus:border-[#C9A063]'
                  }`}
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                id="founder-admin-login-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#090C11] font-bold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                {isAuthenticating
                  ? isArabic
                    ? 'جارٍ التحقق...'
                    : 'Verifying...'
                  : isArabic
                  ? 'فتح لوحة إدارة الملاحظات'
                  : 'Unlock Feedback Management'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                {
                  label: isArabic ? 'الإجمالي' : 'Total',
                  value: totalCount,
                  tone: 'text-[#DFBA7F] border-[#C9A063]/30',
                },
                {
                  label: tr.statuses.Pending,
                  value: pendingCount,
                  tone: 'text-amber-300 border-amber-500/30',
                },
                {
                  label: tr.statuses['Under Review'],
                  value: reviewCount,
                  tone: 'text-sky-300 border-sky-500/30',
                },
                {
                  label: tr.statuses.Answered,
                  value: answeredCount,
                  tone: 'text-emerald-300 border-emerald-500/30',
                },
                {
                  label: tr.resolvedBadge,
                  value: resolvedCount,
                  tone: 'text-teal-300 border-teal-500/30',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border ${stat.tone} ${
                    isDark ? 'bg-[#0E131C]/90' : 'bg-white/90'
                  }`}
                >
                  <div className="text-[11px] text-stone-400 truncate">{stat.label}</div>
                  <div className="text-lg font-mono font-bold mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Filters & Search Bar */}
            <div
              className={`rounded-3xl p-4 sm:p-5 border space-y-3 ${
                isDark
                  ? 'liquid-glass border-[#C9A063]/25'
                  : 'liquid-glass-light border-[#C9A063]/30'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3.5" />
                  <input
                    id="admin-feedback-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isArabic
                        ? 'بحث بالرقم، العنوان، الرسالة، أو البريد...'
                        : 'Search ID, title, message, or email...'
                    }
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none ${
                      isDark
                        ? 'bg-[#0D1119] border-stone-800 text-stone-100 focus:border-[#DFBA7F]'
                        : 'bg-white border-stone-300 text-stone-900 focus:border-[#C9A063]'
                    }`}
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#DFBA7F] shrink-0" />
                  <select
                    id="admin-feedback-category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none ${
                      isDark
                        ? 'bg-[#0D1119] border-stone-800 text-stone-100'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="All">{tr.allCategories}</option>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {tr.categories[cat] || cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    id="admin-feedback-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none ${
                      isDark
                        ? 'bg-[#0D1119] border-stone-800 text-stone-100'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="All">{tr.allStatuses}</option>
                    {FEEDBACK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {tr.statuses[st] || st}
                      </option>
                    ))}
                    <option value="Resolved">{tr.resolvedFilter}</option>
                  </select>
                </div>
              </div>
            </div>

            {actionToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{actionToast}</span>
              </div>
            )}

            {loadError && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loadError}</span>
              </div>
            )}

            {/* Master-Detail Split Layout */}
            {filteredSubmissions.length === 0 ? (
              <div
                className={`rounded-3xl p-10 border text-center space-y-2 ${
                  isDark
                    ? 'liquid-glass border-stone-800 text-stone-400'
                    : 'liquid-glass-light border-stone-200 text-stone-600'
                }`}
              >
                <MessageSquare className="w-8 h-8 text-[#DFBA7F] mx-auto opacity-75" />
                <div className="text-sm font-semibold">{tr.noFeedbackFound}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Submissions List */}
                <div className="lg:col-span-5 space-y-2.5 max-h-[68vh] overflow-y-auto pr-1">
                  {filteredSubmissions.map((item) => {
                    const isSelected = activeItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`admin-feedback-row-${item.id}`}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full text-start p-4 rounded-2xl border transition-all space-y-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A063]/20 border-[#DFBA7F] shadow-md'
                            : isDark
                            ? 'bg-[#0E131D]/90 border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#DFBA7F]">
                            {item.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                item.status === 'Answered'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : item.status === 'Under Review'
                                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {tr.statuses[item.status] || item.status}
                            </span>
                            {item.isResolved && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-teal-500/20 text-teal-300 border border-teal-500/35">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-xs font-bold line-clamp-1 ${
                            isDark ? 'text-stone-100' : 'text-stone-900'
                          }`}
                        >
                          {item.title}
                        </div>

                        <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-700/20">
                          <span>{tr.categories[item.category] || item.category}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Full Submission Reader & Founder Action Console */}
                {activeItem && (
                  <div
                    id="admin-feedback-detail-panel"
                    className={`lg:col-span-7 rounded-3xl p-5 sm:p-6 border space-y-5 ${
                      isDark
                        ? 'liquid-glass border-[#C9A063]/35 shadow-xl'
                        : 'liquid-glass-light border-[#C9A063]/35 shadow-md'
                    }`}
                  >
                    {/* Top Metadata & Badges */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-700/30 pb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#DFBA7F]">
                            {activeItem.id}
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 font-semibold">
                            {tr.categories[activeItem.category] || activeItem.category}
                          </span>
                          {activeItem.isResolved && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {tr.resolvedBadge}
                            </span>
                          )}
                        </div>
                        <h2
                          className={`text-base sm:text-lg font-serif-heading font-bold mt-2 ${
                            isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                          }`}
                        >
                          {activeItem.title}
                        </h2>
                      </div>

                      {/* Mark as Resolved Toggle Button */}
                      <button
                        id="admin-toggle-resolved-btn"
                        type="button"
                        disabled={updatingId === activeItem.id}
                        onClick={() => handleToggleResolved(activeItem)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeItem.isResolved
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : isDark
                            ? 'bg-[#121722] border-stone-700 text-stone-300 hover:border-emerald-500/40'
                            : 'bg-stone-100 border-stone-300 text-stone-800 hover:border-emerald-600/40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {activeItem.isResolved ? tr.resolvedBadge : tr.markResolved}
                        </span>
                      </button>
                    </div>

                    {/* Submitter Info & Protected Email */}
                    <div
                      className={`p-3.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs ${
                        isDark
                          ? 'bg-[#0B0F17] border-stone-800'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                        <span className="truncate font-medium">
                          {activeItem.userName || 'Guest User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                        <span className="truncate font-mono text-[11px]">
                          {activeItem.email || (isArabic ? 'لم يُرفق بريد' : 'No email provided')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                        <span className="truncate text-[11px] text-stone-400">
                          {new Date(activeItem.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Full Message Body */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#DFBA7F] mb-1.5">
                        {tr.messageLabel}
                      </div>
                      <div
                        className={`p-4 rounded-2xl border text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                          isDark
                            ? 'bg-[#0B0F17]/90 border-stone-800 text-stone-100'
                            : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        {activeItem.message}
                      </div>
                    </div>

                    {/* Status Selector (Pending | Under Review | Answered) */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#DFBA7F] mb-2">
                        {tr.statusLabel}
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {FEEDBACK_STATUSES.map((st) => {
                          const isCurrent = activeItem.status === st;
                          return (
                            <button
                              key={st}
                              id={`admin-set-status-${st.toLowerCase().replace(/\s+/g, '-')}-btn`}
                              type="button"
                              disabled={updatingId === activeItem.id}
                              onClick={() => handleStatusUpdate(activeItem, st)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#DFBA7F] text-[#090C11] border-[#DFBA7F] shadow-sm'
                                  : isDark
                                  ? 'bg-[#101520] border-stone-800 text-stone-300 hover:border-[#C9A063]/40'
                                  : 'bg-white border-stone-300 text-stone-700 hover:border-[#C9A063]'
                              }`}
                            >
                              {tr.statuses[st] || st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reply to User Composer */}
                    <div className="space-y-2.5 pt-2 border-t border-stone-700/30">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="admin-reply-textarea"
                          className="text-xs font-bold text-[#DFBA7F]"
                        >
                          {tr.founderReplyLabel}
                        </label>
                        {activeItem.email && (
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {isArabic
                              ? `سيُرسل الرد أيضاً إلى: ${activeItem.email}`
                              : `Will also email reply to: ${activeItem.email}`}
                          </span>
                        )}
                      </div>

                      <textarea
                        id="admin-reply-textarea"
                        rows={4}
                        value={replyDrafts[activeItem.id] ?? activeItem.adminReply ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [activeItem.id]: e.target.value,
                          }))
                        }
                        placeholder={tr.replyPlaceholder}
                        className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none ${
                          isDark
                            ? 'bg-[#0B0F17] border-stone-800 text-stone-100 focus:border-[#DFBA7F]'
                            : 'bg-white border-stone-300 text-stone-900 focus:border-[#C9A063]'
                        }`}
                      />

                      <button
                        id="admin-send-reply-btn"
                        type="button"
                        disabled={
                          updatingId === activeItem.id ||
                          !(replyDrafts[activeItem.id] ?? activeItem.adminReply ?? '').trim()
                        }
                        onClick={() => handleSendReply(activeItem)}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#090C11] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{tr.sendReplyBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
