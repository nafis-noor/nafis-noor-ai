import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { SupportedLanguageCode, t } from '../utils/i18n';

export type ThemePreferenceMode = 'light' | 'dark' | 'system';

interface ThemeSelectorProps {
  currentPreference: ThemePreferenceMode;
  isDark: boolean;
  onSelectTheme: (theme: ThemePreferenceMode) => void;
  lang: SupportedLanguageCode;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentPreference,
  isDark,
  onSelectTheme,
  lang,
}) => {
  const themes: {
    id: ThemePreferenceMode;
    label: string;
    description: string;
    icon: typeof Sun;
    previewBg: string;
    previewBorder: string;
    accentGlow: string;
  }[] = [
    {
      id: 'light',
      label: t(lang, 'themeLight'),
      description: t(lang, 'themeLightDesc'),
      icon: Sun,
      previewBg: 'from-amber-100/90 via-stone-50 to-stone-100',
      previewBorder: 'border-amber-300/60',
      accentGlow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]',
    },
    {
      id: 'dark',
      label: t(lang, 'themeDark'),
      description: t(lang, 'themeDarkDesc'),
      icon: Moon,
      previewBg: 'from-[#0C1017] via-[#12161F] to-[#080B0F]',
      previewBorder: 'border-[#C9A063]/50',
      accentGlow: 'hover:shadow-[0_8px_30px_rgba(201,160,99,0.3)]',
    },
    {
      id: 'system',
      label: t(lang, 'themeSystem'),
      description: t(lang, 'themeSystemDesc'),
      icon: Laptop,
      previewBg: 'from-stone-800/40 via-stone-900/60 to-stone-950',
      previewBorder: 'border-sky-400/40',
      accentGlow: 'hover:shadow-[0_8px_30px_rgba(56,189,248,0.25)]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = currentPreference === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              id={`theme-option-${theme.id}`}
              onClick={() => onSelectTheme(theme.id)}
              className={`group relative text-start p-4 rounded-2xl border transition-all duration-300 transform active:scale-[0.97] focus:outline-none flex flex-col justify-between overflow-hidden card-hover-lift btn-press-bounce ${
                isSelected
                  ? isDark
                    ? 'liquid-glass border-[#DFBA7F] shadow-[0_0_25px_rgba(201,160,99,0.35)] ring-2 ring-[#DFBA7F]/40'
                    : 'liquid-glass-light border-[#C9A063] shadow-[0_0_20px_rgba(201,160,99,0.25)] ring-2 ring-[#C9A063]/40'
                  : isDark
                  ? 'bg-[#10141C]/60 border-stone-800/80 hover:border-stone-700 hover:bg-[#151B24]'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300 hover:bg-stone-100/70'
              } ${theme.accentGlow}`}
            >
              {/* Top Row: Icon + Selection Indicator */}
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#0A0D12] shadow-md shadow-[#C9A063]/30 scale-105'
                      : isDark
                      ? 'bg-stone-800/80 text-stone-300 group-hover:text-stone-100'
                      : 'bg-stone-200/80 text-stone-700 group-hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Animated Selection Radio Indicator with SVG Stroke Draw */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#0A0D12] scale-100 shadow-sm'
                      : 'border border-stone-600/40 text-transparent opacity-0 group-hover:opacity-60 scale-90'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" className={isSelected ? 'animate-draw-check' : ''} />
                  </svg>
                </div>
              </div>

              {/* Theme Name & Description */}
              <div>
                <div
                  className={`text-sm font-bold font-serif-heading mb-0.5 transition-colors ${
                    isSelected
                      ? isDark
                        ? 'text-[#F5EFE6]'
                        : 'text-stone-900'
                      : isDark
                      ? 'text-stone-200 group-hover:text-stone-100'
                      : 'text-stone-800 group-hover:text-stone-900'
                  }`}
                >
                  {theme.label}
                </div>
                <div
                  className={`text-[11px] leading-snug font-light ${
                    isSelected
                      ? isDark
                        ? 'text-stone-300'
                        : 'text-stone-600'
                      : 'text-stone-400'
                  }`}
                >
                  {theme.description}
                </div>
              </div>

              {/* Mini visual preview stripe */}
              <div
                className={`mt-3 h-1.5 w-full rounded-full bg-gradient-to-r ${theme.previewBg} border ${theme.previewBorder} opacity-70 group-hover:opacity-100 transition-opacity`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
