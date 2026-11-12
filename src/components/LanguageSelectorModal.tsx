import React, { useState } from 'react';
import { Globe, Check, Search, X } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  LanguageInfo,
  t,
} from '../utils/i18n';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguageCode;
  onSelectLanguage: (lang: SupportedLanguageCode) => void;
  isDark: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
  isDark,
}) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'language-selector-modal');

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="language-selector-modal"
        className={`w-full max-w-md rounded-[28px] border shadow-md overflow-hidden transition-all duration-200 ${
          isDark
            ? 'liquid-glass border-[#C9A063]/30 text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            : 'liquid-glass-light border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-700/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center justify-center shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif-heading font-bold text-[#F5EFE6]">
                {t(currentLanguage, 'language')}
              </h2>
              <p className="text-xs text-stone-400 font-light">
                {t(currentLanguage, 'languageSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-800/40 hover:bg-stone-800/80 transition-colors"
            aria-label="Close language selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'بحث عن لغة...' : 'Search language...'}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#12161F]/80 border-stone-700/70 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F]'
                  : 'bg-stone-100/90 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
              }`}
            />
          </div>
        </div>

        {/* Language List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {filteredLanguages.map((lang: LanguageInfo) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                id={`language-option-${lang.code}`}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-start group ${
                  isSelected
                    ? isDark
                      ? 'liquid-glass border-[#DFBA7F] bg-[#DFBA7F]/10 shadow-sm'
                      : 'liquid-glass-light border-[#C9A063] bg-[#C9A063]/10 shadow-sm'
                    : isDark
                    ? 'bg-[#11151D]/60 border-stone-800/80 hover:bg-[#181F2A] hover:border-stone-700'
                    : 'bg-stone-50/80 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xl shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isSelected
                            ? isDark
                              ? 'text-[#F5EFE6]'
                              : 'text-stone-900'
                            : isDark
                            ? 'text-stone-200 group-hover:text-stone-100'
                            : 'text-stone-800 group-hover:text-stone-900'
                        }`}
                      >
                        {lang.name}
                      </span>
                      {lang.direction === 'rtl' && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/25">
                          RTL
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        isSelected ? 'text-[#DFBA7F] font-medium' : 'text-stone-400'
                      }`}
                    >
                      {lang.nativeName}
                    </span>
                  </div>
                </div>

                {/* Selected Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#0A0D12] shadow-sm'
                      : 'border border-stone-700/60 text-transparent opacity-0 group-hover:opacity-40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
