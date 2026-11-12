import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Code2,
  BookOpen,
  Compass,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { AppLogoIcon } from './AppLogoIcon';
import { NoorAIAvatar } from './NoorAIIcon';
import { SupportedLanguageCode, t } from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang: SupportedLanguageCode;
  onOpenPrivacyPolicy?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isDark,
  lang,
  onOpenPrivacyPolicy,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'about-nafis-noor-modal');

  const isArabic = lang === 'ar';
  const brandLogoSrc = isArabic
    ? isDark
      ? 'https://img.sanishtech.com/u/6b5138e1cc808c3100e2c1e21e9bb415.png'
      : 'https://img.sanishtech.com/u/cfa42449de79e4e28b5e89bc3647fb0f.png'
    : isDark
      ? 'https://img.sanishtech.com/u/4839c88e05c99a48b9e5f34c39915b4f.png'
      : 'https://img.sanishtech.com/u/90884012596474b554555f339ebce3f7.png';

  if (!isOpen) return null;

  // External link target handler without ever displaying raw URL in the DOM text
  const handleOpenNoorAI = () => {
    // Target external platform
    const targetUrl = 'https://noorak.ai.studio';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        id="about-nafis-noor-modal"
        className={`w-full max-w-lg rounded-[32px] border shadow-md overflow-hidden transition-all duration-200 max-h-[90vh] flex flex-col overscroll-contain ${
          isDark
            ? 'liquid-glass border-[#C9A063]/30 text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            : 'liquid-glass-light border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-700/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center justify-center shadow-sm">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif-heading font-bold text-[#F5EFE6]">
                {t(lang, 'aboutTitle')}
              </h2>
              <p className="text-[11px] text-stone-400 font-light">
                {t(lang, 'aboutSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-800/40 hover:bg-stone-800/80 transition-colors"
            aria-label="Close About Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: NAFIS NOOR IDENTITY & DESCRIPTION */}
          <div className="text-center flex flex-col items-center pt-2">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(201,160,99,0.2)] border border-[#C9A063]/40 mb-4 p-1 bg-[#090C11]">
              <AppLogoIcon className="w-full h-full" withContainer={false} />
            </div>

            <h1 className="text-2xl font-cinzel font-bold tracking-widest text-[#F5EFE6] mb-1">
              {isArabic ? 'نور' : 'NAFIS NOOR'}
            </h1>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 mb-3">
              <Sparkles className="w-3 h-3 mr-1 text-[#C9A063]" />
              {isArabic ? 'رفيق المسلم اليومي الهادئ' : 'Peaceful Islamic Companion'}
            </div>

            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-md mx-auto mb-3">
              {isArabic
                ? 'تطبيق إسلامي مجاني ومتكامل مطور بعناية وإخلاص من قِبل مجموعة نور — فريق شغوف بتسهيل الوصول إلى العلوم الإسلامية الصحيحة لكل مسلم حول العالم.'
                : 'A peaceful Islamic companion thoughtfully created by ALNOOR GROUP (مجموعة نور) — a team passionate about making authentic Islamic knowledge accessible to every Muslim worldwide.'}
            </p>

            {/* Badges & Version */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 shadow-xs">
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
                <span>{isArabic ? '🇸🇦 تقنية سعودية · صُنع بكل فخر في المملكة العربية السعودية' : '🇸🇦 Saudi Tech · Proudly Made in Saudi Arabia'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span>{isArabic ? 'مجاني لوجه الله تعالى دائماً وأبداً' : 'Free Forever · For the Love of Allah'}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-stone-400">
              {isArabic ? 'الإصدار 1.0.0 · عام 2026' : 'Version 1.0.0 · Built in 2026'}
            </div>
          </div>

          {/* SECTION 2: DIVIDER & MADE BY ALNOOR GROUP CREATOR SECTION */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A063]/25" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] font-mono tracking-widest uppercase text-stone-400 bg-[#0E1218]/90 border border-[#C9A063]/20 rounded-full">
                {t(lang, 'madeBy')}
              </span>
            </div>
          </div>

          {/* Legitimate developer/creator credit */}
          <div
            id="creator-credit-card"
            className={`rounded-2xl p-4 sm:p-5 border text-center transition-all ${
              isDark
                ? 'bg-gradient-to-b from-[#131822]/90 to-[#0C0F15]/90 border-[#C9A063]/30 shadow-md'
                : 'bg-gradient-to-b from-stone-50 to-stone-100 border-[#C9A063]/35 shadow-sm'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#DFBA7F] mb-0.5">
              {t(lang, 'madeBy')}
            </div>
            <div className="text-lg sm:text-xl font-cinzel font-bold tracking-wider text-[#F5EFE6] mb-0.5">
              {isArabic ? 'مجموعة نور' : 'ALNOOR GROUP'}
            </div>
            <div className="text-xs text-[#DFBA7F] font-arabic mb-1" dir="rtl">
              {isArabic ? '🇸🇦 المملكة العربية السعودية' : '(مجموعة نور)'}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 font-light">
              <Code2 className="w-3.5 h-3.5 text-[#C9A063]" />
              <span>{isArabic ? 'مبني بإخلاص وتقنية حديثة لخدمة أمة الإسلام' : 'Architected with devotion and modern craftsmanship'}</span>
            </div>
          </div>

          {/* SECTION 3: DIVIDER & NOOR AI COMPANION CARD */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A063]/25" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] font-mono tracking-widest uppercase text-stone-400 bg-[#0E1218]/90 border border-[#C9A063]/20 rounded-full">
                {isArabic ? 'الرفيق الإيماني' : 'Spiritual Companion'}
              </span>
            </div>
          </div>

          {/* NOOR AI Card - NEVER displays raw URL */}
          <div
            id="noor-ai-portal-card"
            className={`rounded-2xl p-5 border transition-all duration-200 ${
              isDark
                ? 'liquid-glass border-[#DFBA7F]/40 shadow-[0_2px_8px_rgba(201,160,99,0.2)]'
                : 'liquid-glass-light border-[#C9A063]/40 shadow-[0_2px_8px_rgba(201,160,99,0.1)]'
            }`}
          >
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#090C11] border border-[#C9A063]/40 flex items-center justify-center shrink-0 shadow-md shadow-[#C9A063]/25 overflow-hidden">
                <NoorAIAvatar size="lg" isDark={isDark} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-serif-heading font-bold text-[#F5EFE6]">
                    {t(lang, 'noorAiTitle')}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30">
                    {t(lang, 'noorAiSubtitle')}
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-light mt-1 leading-relaxed">
                  {t(lang, 'noorAiDescShort')}
                </p>
              </div>
            </div>

            {/* Launch button (opens external window without ever exposing the raw URL string) */}
            <button
              type="button"
              id="open-noor-ai-external-btn"
              onClick={handleOpenNoorAI}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 text-[#0A0D12] text-xs font-bold shadow-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              aria-label="Open Noor AI Assistant"
            >
              <span>{t(lang, 'openNoorAi')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SECTION 4: APPLICATION INFORMATION */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-serif-heading font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#C9A063]" />
              <span>{t(lang, 'appInfo')}</span>
            </h3>

            <div
              className={`rounded-2xl border divide-y transition-all ${
                isDark
                  ? 'bg-[#10141C]/80 border-stone-800/80 divide-stone-800/60 text-xs'
                  : 'bg-stone-50 border-stone-200 divide-stone-200 text-xs'
              }`}
            >
              {/* Version */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-stone-400">{t(lang, 'version')}</span>
                <span className="font-mono text-[#DFBA7F] font-semibold">
                  {isArabic ? 'الإصدار ١.٠.٠ · عام ٢٠٢٦ م' : 'Version 1.0.0 · Built in 2026'}
                </span>
              </div>

              {/* Development Status */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-stone-400">{t(lang, 'devStatus')}</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {t(lang, 'devStatusVal')}
                </span>
              </div>

              {/* AI Information */}
              <div className="p-3.5 space-y-1">
                <div className="text-stone-400 font-medium">{t(lang, 'aiInfo')}</div>
                <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                  {t(lang, 'aiInfoVal')}
                </p>
              </div>

              {/* Terms & Important Information */}
              <div className="p-3.5 space-y-1">
                <div className="text-stone-400 font-medium">{t(lang, 'termsInfo')}</div>
                <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                  {t(lang, 'termsInfoVal')}
                </p>
              </div>

              {/* Privacy */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-stone-400 font-medium">{t(lang, 'privacyInfo')}</div>
                  <p className="text-[11px] text-stone-300 font-light">
                    {t(lang, 'privacyInfoVal')}
                  </p>
                </div>
                {onOpenPrivacyPolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPrivacyPolicy();
                    }}
                    className="ml-3 shrink-0 px-2.5 py-1.5 rounded-lg border border-[#C9A063]/30 bg-[#C9A063]/10 hover:bg-[#C9A063]/20 text-[11px] text-[#DFBA7F] font-semibold transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A063]" />
                    <span>{isArabic ? 'عرض السياسة' : 'View Policy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-700/20 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold border border-stone-700/60 bg-stone-800/60 hover:bg-stone-700/80 text-stone-200 transition-colors"
          >
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
