/**
 * Noor Unified Theme Design Tokens
 * 
 * Provides mathematically calibrated, semantic styling tokens for both
 * 🌙 Dark Mode (deep obsidian, crystalline gold accents, high contrast text)
 * ☀️ Light Mode (clean warm neutral ivory/linen, antique bronze accents, crisp charcoal text)
 * 
 * Zero hardcoded breaking colors. Every component uses these tokens for consistent visual hierarchy.
 */

export interface ThemeTokens {
  isDark: boolean;

  // Background canvases
  canvas: string;
  canvasPattern: string;

  // Surfaces & Glass
  cardPrimary: string;
  cardSecondary: string;
  cardHero: string;
  cardModal: string;
  navFloating: string;
  orb: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textGold: string;
  textGoldBright: string;
  textArabic: string;
  textHeading: string;

  // Borders & Dividers
  borderSubtle: string;
  borderCard: string;
  borderGold: string;
  borderActive: string;
  divider: string;

  // Form Controls
  input: string;
  inputCompact: string;
  select: string;

  // Buttons
  btnPrimary: string;
  btnSecondary: string;
  btnGhost: string;
  btnGoldOutline: string;

  // Status & Badges
  badgeGold: string;
  badgeEmerald: string;
  badgeAmber: string;
  badgeRose: string;
  badgeNeutral: string;

  // Interactive items (lists, surah rows, cards)
  itemHover: string;
  itemActive: string;
}

export function getThemeTokens(isDark: boolean): ThemeTokens {
  if (isDark) {
    return {
      isDark: true,
      canvas: 'bg-[#06080B] text-stone-100',
      canvasPattern: 'islamic-pattern opacity-60',

      cardPrimary: 'liquid-glass-primary-dark',
      cardSecondary: 'liquid-glass-secondary-dark',
      cardHero: 'liquid-glass-hero-dark',
      cardModal: 'liquid-glass-modal-dark',
      navFloating: 'liquid-glass-floating-nav-dark',
      orb: 'liquid-glass-orb',

      textPrimary: 'text-[#F5EFE6]',
      textSecondary: 'text-stone-300',
      textMuted: 'text-stone-400',
      textGold: 'text-[#DFBA7F]',
      textGoldBright: 'text-[#F5D89F]',
      textArabic: 'text-[#DFBA7F]',
      textHeading: 'text-[#F5EFE6]',

      borderSubtle: 'border-white/10',
      borderCard: 'border-[#C9A063]/25',
      borderGold: 'border-[#C9A063]/40',
      borderActive: 'border-[#DFBA7F]',
      divider: 'bg-white/10',

      input: 'liquid-glass-input-dark',
      inputCompact: 'bg-[#10141B]/85 border border-[#C9A063]/25 text-stone-100 placeholder:text-stone-500 focus:border-[#DFBA7F]',
      select: 'bg-[#12161D] border border-[#C9A063]/30 text-stone-100 focus:border-[#DFBA7F]',

      btnPrimary: 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all',
      btnSecondary: 'bg-[#141A22]/80 border border-white/10 hover:border-[#C9A063]/40 text-stone-200 hover:text-white active:scale-[0.98] transition-all',
      btnGhost: 'text-stone-400 hover:text-stone-200 hover:bg-white/5 active:scale-95 transition-all',
      btnGoldOutline: 'border border-[#C9A063]/40 text-[#DFBA7F] hover:bg-[#C9A063]/15 active:scale-[0.98] transition-all',

      badgeGold: 'bg-[#C9A063]/15 border border-[#C9A063]/30 text-[#DFBA7F]',
      badgeEmerald: 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300',
      badgeAmber: 'bg-amber-500/15 border border-amber-500/35 text-amber-300',
      badgeRose: 'bg-rose-500/15 border border-rose-500/35 text-rose-300',
      badgeNeutral: 'bg-stone-800/80 border border-stone-700/60 text-stone-300',

      itemHover: 'hover:bg-white/5 hover:border-[#C9A063]/40 transition-colors',
      itemActive: 'bg-[#C9A063]/20 border-[#DFBA7F] text-[#DFBA7F]',
    };
  }

  // ☀️ LIGHT MODE: Warm neutral sand/ivory, antique bronze, crisp charcoal text
  return {
    isDark: false,
    canvas: 'bg-[#F8F6F0] text-stone-900',
    canvasPattern: 'islamic-pattern-light opacity-80',

    cardPrimary: 'liquid-glass-primary-light',
    cardSecondary: 'liquid-glass-secondary-light',
    cardHero: 'liquid-glass-hero-light',
    cardModal: 'liquid-glass-modal-light',
    navFloating: 'liquid-glass-floating-nav-light',
    orb: 'liquid-glass-orb-light',

    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-700',
    textMuted: 'text-stone-500',
    textGold: 'text-[#8E6527]',
    textGoldBright: 'text-[#A67C38]',
    textArabic: 'text-stone-900',
    textHeading: 'text-stone-900',

    borderSubtle: 'border-stone-200',
    borderCard: 'border-[#C9A063]/35',
    borderGold: 'border-[#A67C38]/40',
    borderActive: 'border-[#8E6527]',
    divider: 'bg-stone-200',

    input: 'liquid-glass-input-light',
    inputCompact: 'bg-white/95 border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-[#A67C38]',
    select: 'bg-white border border-stone-300 text-stone-900 focus:border-[#A67C38]',

    btnPrimary: 'bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#090B0E] font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all',
    btnSecondary: 'bg-white/90 border border-stone-300 hover:border-[#A67C38]/50 text-stone-800 hover:text-stone-950 shadow-sm active:scale-[0.98] transition-all',
    btnGhost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 active:scale-95 transition-all',
    btnGoldOutline: 'border border-[#A67C38]/40 text-[#8E6527] hover:bg-amber-50 active:scale-[0.98] transition-all',

    badgeGold: 'bg-amber-100/90 border border-amber-300/80 text-[#73501A]',
    badgeEmerald: 'bg-emerald-50 border border-emerald-300 text-emerald-800',
    badgeAmber: 'bg-amber-50 border border-amber-300 text-amber-800',
    badgeRose: 'bg-rose-50 border border-rose-300 text-rose-800',
    badgeNeutral: 'bg-stone-100 border border-stone-300 text-stone-700',

    itemHover: 'hover:bg-stone-100/80 hover:border-[#C9A063]/50 transition-colors',
    itemActive: 'bg-amber-50/90 border-[#A67C38] text-[#8E6527] shadow-sm',
  };
}
