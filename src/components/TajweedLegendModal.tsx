import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { TAJWEED_LEGEND_ITEMS } from '../utils/tajweedHighlighter';

interface TajweedLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isArabic: boolean;
}

export const TajweedLegendModal: React.FC<TajweedLegendModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isArabic,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
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
                <Sparkles className="w-4 h-4 text-[#C9A063]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif-heading font-bold text-[#DFBA7F]">
                  {isArabic ? 'دليل أحكام التجويد والألوان' : 'Tajweed Color Rules Legend'}
                </h2>
                <p className="text-[11px] text-stone-400">
                  {isArabic ? 'دليل الألوان التوضيحية لتلاوة صحيحة ومحكمة' : 'Visual color-coded guide for accurate recitation'}
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
          <div className="overflow-y-auto pr-1 space-y-3 no-scrollbar flex-1 pb-2">
            <div className="text-xs text-stone-300 bg-[#C9A063]/10 border border-[#C9A063]/25 p-3 rounded-2xl mb-3 leading-relaxed">
              {isArabic
                ? 'تظهر ألوان التجويد تلقائياً عند تفعيل "ألوان أحكام التجويد" في إعدادات المصحف لمساعدتك على تطبيق قواعد المد، الغنة، القلقلة والإقلاب بدقة أثناء القراءة.'
                : 'Tajweed colors automatically highlight when enabled in Mushaf settings, helping you master rules like Madd, Ghunnah, Qalqalah, and Iqlab while reading.'}
            </div>

            {TAJWEED_LEGEND_ITEMS.map((item, idx) => {
              const textColor = isDark ? item.textDarkClass : item.textLightClass;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 hover:border-[#C9A063]/30'
                      : 'bg-stone-50 border-stone-200 hover:border-[#C9A063]/40'
                  }`}
                >
                  {/* Color Dot / Badge */}
                  <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${item.dotClass} shadow-[0_0_10px_currentColor]`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-bold font-serif-heading ${textColor}`}>
                        {isArabic ? item.labelAr : item.labelEn}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/20 text-stone-300 border border-white/10">
                        {isArabic ? item.labelEn : item.labelAr}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 font-light leading-relaxed">
                      {item.descAr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Close Button */}
          <div className="pt-3 border-t border-[#C9A063]/20 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] font-bold text-xs shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isArabic ? 'فهمت، العودة للمصحف' : 'Got it, Return to Mushaf'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
