import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, Globe } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  LanguageInfo,
  t,
  isRTLLanguage,
} from '../utils/i18n';
import { AppLogoIcon } from './AppLogoIcon';

interface FirstTimeLanguageScreenProps {
  isDark: boolean;
  onSelectLanguage: (code: SupportedLanguageCode) => void;
}

export const FirstTimeLanguageScreen: React.FC<FirstTimeLanguageScreenProps> = ({
  isDark,
  onSelectLanguage,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageCode>('en');

  const handleCardClick = (code: SupportedLanguageCode) => {
    setSelectedLang(code);
    // Instant live preview of direction
    const isRtl = isRTLLanguage(code);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
  };

  const handleConfirm = () => {
    onSelectLanguage(selectedLang);
  };

  const currentInfo: LanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const isRtl = isRTLLanguage(selectedLang);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#080A0E] text-[#F5EFE6] selection:bg-[#C9A063]/30">
      {/* Dynamic Ambient Optical Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[#C9A063]/14 blur-[160px] animate-pulseGlow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#DFBA7F]/10 blur-[170px]" />
        <div className="absolute top-[45%] right-[25%] w-[320px] h-[320px] rounded-full bg-[#B88E4F]/8 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto my-auto animate-fadeIn">
        <div
          id="first-time-language-card"
          className={`rounded-[36px] p-6 sm:p-8 text-center transition-all ${
            isDark
              ? 'liquid-glass-hero-dark text-stone-100 shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-[#C9A063]/30'
              : 'liquid-glass-hero-light text-stone-900 border-[#C9A063]/40 shadow-2xl'
          }`}
        >
          {/* Liquid Glass Orb Emblem */}
          <div className="mx-auto w-20 h-20 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(201,160,99,0.35)] mb-5">
            <AppLogoIcon className="w-full h-full" withContainer={true} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 mb-3">
            <Globe className="w-3.5 h-3.5 text-[#C9A063]" />
            <span>NAFIS NOOR</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-wide mb-1.5 text-[#F5EFE6]">
            {t(selectedLang, 'chooseLanguageTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto mb-6">
            {t(selectedLang, 'chooseLanguageSubtitle')}
          </p>

          {/* 10 Supported Languages Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6 text-left" dir="ltr">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`lang-choice-${lang.code}`}
                  onClick={() => handleCardClick(lang.code)}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A063]/25 to-[#DFBA7F]/15 border-[#DFBA7F] shadow-[0_4px_16px_rgba(201,160,99,0.25)] ring-1 ring-[#DFBA7F]/50'
                      : isDark
                      ? 'bg-[#12161D]/80 border-stone-800 hover:border-stone-700 text-stone-300 hover:bg-[#161B24]'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? 'text-[#DFBA7F]' : isDark ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {lang.nativeName}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">{lang.name}</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-[#DFBA7F] border-[#DFBA7F] text-[#090B0E]'
                        : 'border-stone-700/60 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            id="confirm-language-button"
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-[0_8px_24px_rgba(201,160,99,0.35)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{t(selectedLang, 'continueWithLanguage', { lang: currentInfo.nativeName })}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          {/* Subtext */}
          <p className="text-[11px] text-stone-500 mt-4">
            {t(selectedLang, 'languageSelectedDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};
