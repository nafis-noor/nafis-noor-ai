import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquarePlus,
  Sparkles,
  Bug,
  BookOpen,
  Mic,
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Clock,
  Lock,
} from 'lucide-react';
import { UserStats } from '../types';
import { SupportedLanguageCode, isRTLLanguage } from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import {
  FeedbackCategory,
  FEEDBACK_CATEGORIES,
  FeedbackSubmission,
  getFeedbackTranslations,
  submitUserFeedback,
  fetchMyFeedbackSubmissions,
  validateFeedbackInput,
} from '../utils/feedbackService';

interface FeedbackScreenProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: SupportedLanguageCode;
  userStats: UserStats;
  onOpenAdminConsole?: () => void;
}

const CATEGORY_META: Record<
  FeedbackCategory,
  {
    icon: React.FC<{ className?: string }>;
    accentClass: string;
  }
> = {
  'General Feedback': {
    icon: MessageSquare,
    accentClass: 'text-[#DFBA7F]',
  },
  'Feature Request': {
    icon: Sparkles,
    accentClass: 'text-amber-400',
  },
  'Bug Report': {
    icon: Bug,
    accentClass: 'text-rose-400',
  },
  'Quran Experience': {
    icon: BookOpen,
    accentClass: 'text-emerald-400',
  },
  'Tasme3 Experience': {
    icon: Mic,
    accentClass: 'text-sky-400',
  },
  Other: {
    icon: HelpCircle,
    accentClass: 'text-purple-400',
  },
};

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
  userStats,
  onOpenAdminConsole,
}) => {
  useModalScrollLock(isOpen, 'feedback-submission-screen');

  const tr = getFeedbackTranslations(lang);
  const isRtl = isRTLLanguage(lang);
  const isArabic = lang === 'ar';

  const defaultEmail =
    userStats.accountEmail &&
    userStats.accountEmail.includes('@') &&
    !userStats.accountEmail.endsWith('@nafisnoor.local')
      ? userStats.accountEmail
      : '';

  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSubmission, setSavedSubmission] = useState<FeedbackSubmission | null>(null);
  const [founderNotified, setFounderNotified] = useState<boolean>(false);
  const [mySubmissions, setMySubmissions] = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    if (defaultEmail && !email) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchMyFeedbackSubmissions().then((items) => {
      if (active && items.length > 0) {
        setMySubmissions(items);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, savedSubmission]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateFeedbackInput({
      category,
      title,
      message,
      email,
    });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitUserFeedback({
        category,
        title,
        message,
        email,
        userName: userStats.userName || (userStats.isLoggedIn ? 'Registered User' : 'Guest User'),
      });

      setSavedSubmission(result.submission);
      setFounderNotified(result.founderNotified);
      setMySubmissions((prev) => {
        const filtered = prev.filter((item) => item.id !== result.submission.id);
        return [result.submission, ...filtered];
      });
      setTitle('');
      setMessage('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to save your feedback right now. Please verify your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSavedSubmission(null);
    setErrorMessage(null);
    setTitle('');
    setMessage('');
  };

  return (
    <div
      id="nafis-noor-feedback-screen"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 overflow-y-auto transition-colors duration-300 ${
        isDark
          ? 'bg-[#070A0F]/95 text-[#F5EFE6]'
          : 'bg-[#F8F5EE]/95 text-stone-900'
      } backdrop-blur-xl animate-fadeIn`}
    >
      {/* Ambient Radial Illumination */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-[#C9A063]/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            id="feedback-screen-back-btn"
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#12161F]/90 border-[#C9A063]/30 text-[#DFBA7F] hover:bg-[#181E29]'
                : 'bg-white/90 border-stone-300 text-stone-800 hover:bg-stone-100 shadow-xs'
            }`}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isArabic ? 'العودة للإعدادات' : 'Back to Settings'}</span>
          </button>

          {onOpenAdminConsole && userStats.role === 'admin' && (
            <button
              id="feedback-open-founder-console-btn"
              type="button"
              onClick={onOpenAdminConsole}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{tr.adminConsoleBtn}</span>
            </button>
          )}
        </div>

        {/* Screen Hero Header Card */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border mb-5 transition-all ${
            isDark
              ? 'liquid-glass border-[#C9A063]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
              : 'liquid-glass-light border-[#C9A063]/35 shadow-md'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DFBA7F] to-[#A67C38] text-[#090C11] flex items-center justify-center shrink-0 shadow-md shadow-[#C9A063]/20">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className={`text-lg sm:text-xl font-serif-heading font-bold tracking-wide ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {tr.screenTitle}
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                  isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                {tr.screenSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmed Submission State OR Submission Form */}
        {savedSubmission ? (
          <div
            id="feedback-submission-confirmed-card"
            className={`rounded-3xl p-6 sm:p-8 border transition-all space-y-5 ${
              isDark
                ? 'liquid-glass border-emerald-500/40 shadow-[0_16px_48px_rgba(0,0,0,0.55)]'
                : 'liquid-glass-light border-emerald-600/40 shadow-lg'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h2
                className={`text-base sm:text-lg font-serif-heading font-bold ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {tr.successTitle}
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                {tr.successSubtitle}
              </p>
            </div>

            {/* Saved Details Receipt */}
            <div
              className={`rounded-2xl p-4 border space-y-2.5 text-xs ${
                isDark
                  ? 'bg-[#0B0E14]/90 border-white/10 text-stone-200'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <div className="flex items-center justify-between py-1 border-b border-stone-700/20">
                <span className="text-stone-400">{tr.submissionIdLabel}</span>
                <span className="font-mono font-bold text-[#DFBA7F]">{savedSubmission.id}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-700/20">
                <span className="text-stone-400">{tr.categoryLabel}</span>
                <span className="font-semibold">
                  {tr.categories[savedSubmission.category] || savedSubmission.category}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-700/20">
                <span className="text-stone-400">{tr.statusLabel}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {tr.statuses[savedSubmission.status] || savedSubmission.status}
                </span>
              </div>
              <div className="pt-1">
                <div className="text-[11px] text-stone-400 mb-1">{tr.titleLabel}</div>
                <div className="font-bold">{savedSubmission.title}</div>
                <p className="text-[11px] text-stone-400 mt-1 whitespace-pre-wrap leading-relaxed">
                  {savedSubmission.message}
                </p>
              </div>
              {founderNotified && (
                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isArabic
                      ? 'تم إرسال إشعار فوري بالبريد الإلكتروني لمؤسس نفيس نور.'
                      : 'Founder email notification dispatched with secure review link.'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                id="feedback-submit-another-btn"
                type="button"
                onClick={handleResetForm}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090C11] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                {tr.submitAnotherBtn}
              </button>
              <button
                id="feedback-done-return-btn"
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto py-3 px-5 rounded-2xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-stone-700 bg-stone-800/70 text-stone-200 hover:bg-stone-700'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                }`}
              >
                {isArabic ? 'العودة للإعدادات' : 'Return to Settings'}
              </button>
            </div>
          </div>
        ) : (
          <form
            id="nafis-noor-feedback-form"
            onSubmit={handleSubmit}
            className={`rounded-3xl p-5 sm:p-6 border space-y-5 transition-all ${
              isDark
                ? 'liquid-glass border-[#C9A063]/30 shadow-[0_16px_44px_rgba(0,0,0,0.45)]'
                : 'liquid-glass-light border-[#C9A063]/30 shadow-md'
            }`}
          >
            {/* 1. Category Selector */}
            <div>
              <label className="block text-xs font-serif-heading font-bold uppercase tracking-wider text-[#DFBA7F] mb-2.5">
                {tr.categoryLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  const meta = CATEGORY_META[cat];
                  const IconComponent = meta.icon;
                  return (
                    <button
                      key={cat}
                      id={`feedback-category-${cat.toLowerCase().replace(/\s+/g, '-')}-btn`}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A063]/20 border-[#DFBA7F] shadow-[0_4px_16px_rgba(201,160,99,0.2)] ring-1 ring-[#DFBA7F]/40'
                          : isDark
                          ? 'bg-[#10141D]/80 border-stone-800 hover:border-stone-700 text-stone-300'
                          : 'bg-white/90 border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#DFBA7F] text-[#090C11]'
                            : isDark
                            ? 'bg-[#171C28] ' + meta.accentClass
                            : 'bg-stone-100 ' + meta.accentClass
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs font-semibold leading-snug ${
                          isSelected
                            ? isDark
                              ? 'text-[#F5EFE6]'
                              : 'text-stone-950'
                            : ''
                        }`}
                      >
                        {tr.categories[cat] || cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Feedback Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="feedback-title-input"
                  className={`text-xs font-bold ${
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  }`}
                >
                  {tr.titleLabel} <span className="text-[#DFBA7F]">*</span>
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  {title.trim().length}/200
                </span>
              </div>
              <input
                id="feedback-title-input"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr.titlePlaceholder}
                className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-[#0E131C] border-stone-800 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F]'
                    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
                }`}
              />
            </div>

            {/* 3. Detailed Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="feedback-message-input"
                  className={`text-xs font-bold ${
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  }`}
                >
                  {tr.messageLabel} <span className="text-[#DFBA7F]">*</span>
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  {message.trim().length}/5000
                </span>
              </div>
              <textarea
                id="feedback-message-input"
                required
                rows={5}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={tr.messagePlaceholder}
                className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm leading-relaxed transition-colors focus:outline-none resize-y ${
                  isDark
                    ? 'bg-[#0E131C] border-stone-800 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F]'
                    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
                }`}
              />
            </div>

            {/* 4. Optional Email Address for Receiving Replies */}
            <div>
              <label
                htmlFor="feedback-email-input"
                className={`block text-xs font-bold mb-1.5 ${
                  isDark ? 'text-stone-200' : 'text-stone-800'
                }`}
              >
                {tr.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#DFBA7F] absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none" />
                <input
                  id="feedback-email-input"
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tr.emailPlaceholder}
                  dir="ltr"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-[#0E131C] border-stone-800 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F]'
                      : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{tr.emailHelper}</span>
              </div>
            </div>

            {/* Error Alert Banner (Real validation/network error feedback) */}
            {errorMessage && (
              <div
                id="feedback-error-alert"
                className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 5. Submit Feedback Button */}
            <button
              id="submit-feedback-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#090C11] font-bold text-sm tracking-wide shadow-lg shadow-[#C9A063]/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? tr.submittingBtn : tr.submitBtn}</span>
            </button>
          </form>
        )}

        {/* User's Own Submitted Feedback History (with live Status & Founder Replies) */}
        {mySubmissions.length > 0 && (
          <div
            className={`mt-6 rounded-3xl p-5 sm:p-6 border space-y-3.5 ${
              isDark
                ? 'liquid-glass border-[#C9A063]/25'
                : 'liquid-glass-light border-[#C9A063]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-xs sm:text-sm font-serif-heading font-bold flex items-center gap-2 ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                <Clock className="w-4 h-4 text-[#DFBA7F]" />
                <span>{tr.mySubmissionsTitle}</span>
              </h3>
              <span className="text-[11px] font-mono text-stone-400">
                {mySubmissions.length}
              </span>
            </div>

            <div className="space-y-3">
              {mySubmissions.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isDark
                      ? 'bg-[#0D1119]/90 border-stone-800'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#DFBA7F]">
                        {item.id}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/25">
                        {tr.categories[item.category] || item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${
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
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {tr.resolvedBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold ${
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    }`}
                  >
                    {item.title}
                  </div>
                  <p className="text-xs text-stone-400 whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>

                  {item.adminReply && (
                    <div
                      className={`mt-2 p-3 rounded-xl border ${
                        isDark
                          ? 'bg-[#131924] border-[#C9A063]/35 text-stone-200'
                          : 'bg-amber-50/70 border-[#C9A063]/40 text-stone-800'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#DFBA7F] mb-1">
                        {tr.founderReplyLabel}
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {item.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
