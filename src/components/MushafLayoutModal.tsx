import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, AlignRight, Languages, Check, SlidersHorizontal, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';
import { MushafLayout, MushafEdition } from '../types/mushaf';

interface MushafLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
  activeLayout: MushafLayout;
  onSelectLayout: (layout: MushafLayout) => void;
  activeEdition: MushafEdition;
  onSelectEdition: (edition: MushafEdition) => void;
  showTransliteration: boolean;
  onToggleTransliteration: (val: boolean) => void;
  showTranslation: boolean;
  onToggleTranslation: (val: boolean) => void;
  enableTajweedColors: boolean;
  onToggleTajweedColors: (val: boolean) => void;
  arabicFontSize: number;
  onChangeArabicFontSize: (val: number) => void;
  onOpenTajweedLegend: () => void;
}

export const MushafLayoutModal: React.FC<MushafLayoutModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
  activeLayout,
  onSelectLayout,
  activeEdition,
  onSelectEdition,
  showTransliteration,
  onToggleTransliteration,
  showTranslation,
  onToggleTranslation,
  enableTajweedColors,
  onToggleTajweedColors,
  arabicFontSize,
  onChangeArabicFontSize,
  onOpenTajweedLegend,
}) => {
  if (!isOpen) return null;

  const layoutOptions = [
    {
      id: 'book' as MushafLayout,
      title: isArabic ? 'مصحف المدينة (صفحات كاملة)' : 'Book (Madani Mushaf)',
      subtitle: isArabic ? 'العرض الأصلي لمصحف مجمع الملك فهد (١٤٠٥هـ) بصفحاته الـ ٦٠٤ كاملة' : 'Traditional 604-page Madani Mushaf (1405 AH) with authentic page divisions',
      icon: Book,
      badge: isArabic ? 'التقليدي الأصيل' : 'Traditional'
    },
    {
      id: 'text' as MushafLayout,
      title: isArabic ? 'النص القرآني (آية آية)' : 'Quran Text',
      subtitle: isArabic ? 'عرض الآيات بخط عثماني نقي وواضح مع التحكم التام بحجم الخط وسهولة القراءة' : 'Clean verse-by-verse text with smooth scrolling and adjustable Arabic calligraphy',
      icon: AlignRight,
      badge: isArabic ? 'قراءة سلسة' : 'Clean Text'
    },
    {
      id: 'translation' as MushafLayout,
      title: isArabic ? 'الترجمة واللفظ الصوتي' : 'Translation & Transliteration',
      subtitle: isArabic ? 'عرض النص العربي مع ترجمة المعاني المعتمدة والنطق الصوتي اللاتيني' : 'Arabic verses alongside verified translation and optional phonetic transliteration',
      icon: Languages,
      badge: isArabic ? 'تدبر ودراسة' : 'Study Mode'
    }
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border shadow-2xl max-h-[88vh] flex flex-col relative overflow-hidden ${
            isDark
              ? 'bg-[#0A0D13]/98 border-[#DFBA7F]/35 text-stone-100'
              : 'bg-white/98 border-[#C9A063]/40 text-stone-900 shadow-xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Golden Glow Line on Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-60" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#C9A063]/20 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C9A063]/15 border border-[#C9A063]/30 flex items-center justify-center text-[#DFBA7F]">
                <Book className="w-4 h-4 text-[#C9A063]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif-heading font-bold text-[#DFBA7F]">
                  {isArabic ? 'تخطيط المصحف الشريف' : 'Mushaf Layout'}
                </h2>
                <p className="text-[11px] text-stone-400">
                  {isArabic ? 'اختر طريقة العرض المفضلة ومصحف القراءة' : 'Select your reading layout and Mushaf edition'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              aria-label={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto pr-1 space-y-5 no-scrollbar flex-1 pb-2">
            {/* 1. Reading Layout Options */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F]">
                  {isArabic ? 'طريقة القراءة والعرض' : 'Reading Layout'}
                </span>
                <span className="text-[10px] text-stone-400">
                  {isArabic ? '٣ طرق عرض معتمدة' : '3 Verified Views'}
                </span>
              </div>

              <div className="space-y-2.5">
                {layoutOptions.map((opt) => {
                  const isSelected = activeLayout === opt.id;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectLayout(opt.id)}
                      className={`w-full p-3.5 rounded-2xl text-left rtl:text-right border transition-all duration-200 cursor-pointer active:scale-[0.99] relative overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'bg-[#C9A063]/15 border-[#DFBA7F] shadow-[0_0_20px_rgba(201,160,99,0.2)]'
                            : 'bg-amber-50/80 border-[#C9A063] shadow-sm'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:border-[#C9A063]/30 hover:bg-white/8'
                          : 'bg-stone-50 border-stone-200 hover:border-[#C9A063]/40 hover:bg-stone-100/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Radio Icon Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-[#DFBA7F] bg-[#DFBA7F] text-[#090B0E]'
                              : 'border-stone-500 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Layout Icon & Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-[#DFBA7F]' : 'text-stone-400'}`} />
                              <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#DFBA7F]' : ''}`}>
                                {opt.title}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono font-medium border bg-[#C9A063]/10 text-[#DFBA7F] border-[#C9A063]/25 shrink-0">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 leading-relaxed">
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mushaf Edition Selection */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F]">
                  {isArabic ? 'طبعة المصحف الشريف' : 'Mushaf Edition'}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {isArabic ? 'موثق ومعتمد' : 'Verified'}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  activeEdition === 'madani-1405'
                    ? isDark
                      ? 'bg-gradient-to-tr from-[#C9A063]/15 to-[#DFBA7F]/10 border-[#DFBA7F]/50 shadow-sm'
                      : 'bg-amber-50/70 border-[#C9A063]/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                      ١٤٠٥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#DFBA7F]">
                          {isArabic ? 'مصحف المدينة المنورة (١٤٠٥هـ)' : 'Madani Mushaf (1405 AH)'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                          {isArabic ? 'المعتمد الرسمي' : 'Official Print'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {isArabic
                          ? 'مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة - الخطاط عثمان طه (٦٠٤ صفحة)'
                          : 'King Fahd Complex for Printing the Holy Quran, Medina - Calligrapher Uthman Taha (604 pages)'}
                      </p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#DFBA7F] text-[#090B0E] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Reading Customization Options */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F]">
                  {isArabic ? 'إعدادات القراءة والخط' : 'Reading Customization'}
                </span>
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              >
                {/* Arabic Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-stone-300">
                      {isArabic ? 'حجم الخط العربي' : 'Arabic Font Size'}
                    </span>
                    <span className="font-mono font-bold text-[#DFBA7F]">{arabicFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="44"
                    step="1"
                    value={arabicFontSize}
                    onChange={(e) => onChangeArabicFontSize(Number(e.target.value))}
                    className="w-full accent-[#C9A063] cursor-pointer h-2 bg-stone-700/60 rounded-lg"
                  />
                  <div className="text-right font-arabic text-sm text-[#DFBA7F] mt-1 select-none" dir="rtl">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                </div>

                {/* Transliteration Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[#C9A063]/15">
                  <div>
                    <div className="text-xs font-semibold">
                      {isArabic ? 'اللفظ الصوتي اللاتيني (Transliteration)' : 'Phonetic Transliteration'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {isArabic ? 'مساعدة نطق الكلمات بالحروف اللاتينية' : 'Romanized pronunciation guide beneath verses'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTransliteration(!showTransliteration)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      showTransliteration ? 'bg-[#C9A063]' : 'bg-stone-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        showTransliteration ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Tajweed Colors Toggle & Legend Button */}
                <div className="space-y-2.5 pt-2 border-t border-[#C9A063]/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{isArabic ? 'ألوان أحكام التجويد' : 'Tajweed Rule Colors'}</span>
                        <Sparkles className="w-3 h-3 text-[#DFBA7F]" />
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {isArabic ? 'تمييز الغنة والمدود والقلقلة' : 'Visual color guidance for Ghunnah, Madd and Qalqalah'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleTajweedColors(!enableTajweedColors)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        enableTajweedColors ? 'bg-[#C9A063]' : 'bg-stone-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          enableTajweedColors ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Button to Open Tajweed Legend */}
                  <button
                    type="button"
                    onClick={onOpenTajweedLegend}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#C9A063]/10 border-[#DFBA7F]/30 text-[#DFBA7F] hover:bg-[#C9A063]/20'
                        : 'bg-amber-50 border-[#C9A063]/45 text-[#8E6527] hover:bg-amber-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {isArabic ? '📖 عرض دليل أحكام التجويد والأسطورة' : '📖 View Tajweed Rules Legend'}
                    </span>
                  </button>
                </div>

                {/* Translation Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[#C9A063]/15">
                  <div>
                    <div className="text-xs font-semibold">
                      {isArabic ? 'إظهار الترجمة المعتمدة' : 'Show Verified Translation'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {isArabic ? 'ترجمة معاني الآيات باللغة المختارة' : 'Displays approved translation below verses'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTranslation(!showTranslation)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      showTranslation ? 'bg-[#C9A063]' : 'bg-stone-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        showTranslation ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Button */}
          <div className="pt-3 border-t border-[#C9A063]/20 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] font-bold text-xs shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isArabic ? 'تطبيق وحفظ التفضيلات' : 'Apply & Save Preferences'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
