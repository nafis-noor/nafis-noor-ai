import React from 'react';
import { X, FileText, CheckCircle2, Shield, HeartHandshake, Sparkles } from 'lucide-react';
import { useModalScrollLock } from '../utils/useModalScrollLock';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, isDark }) => {
  // Lock background scroll and return user to exact click position upon closing
  useModalScrollLock(isOpen, 'terms-of-service-modal');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="terms-of-service-modal"
        className={`w-full max-w-lg rounded-[32px] border shadow-md overflow-hidden transition-all duration-200 max-h-[90vh] flex flex-col overscroll-contain ${
          isDark
            ? 'liquid-glass border-[#C9A063]/30 text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
            : 'liquid-glass-light border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-700/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif-heading font-bold text-[#F5EFE6]">
                Terms of Service
              </h2>
              <p className="text-[11px] text-stone-400 font-light">
                ALNOOR GROUP (مجموعة نور) · Guidelines & Transparency
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-800/40 hover:bg-stone-800/80 transition-colors"
            aria-label="Close Terms Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-stone-300">
          <div className="p-4 rounded-2xl bg-[#C9A063]/10 border border-[#C9A063]/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#DFBA7F] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#DFBA7F] mb-0.5">
                Free Forever · For the Love of Allah
              </div>
              <p className="text-[11px] text-stone-300">
                Nafis Noor is dedicated to the Muslim Ummah globally without subscriptions, paywalls, or intrusive commercial tracking.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="font-semibold text-[#F5EFE6] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />
                <span>1. Authentic Religious Sources</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Quranic texts and Hisnul Muslim supplications are cross-checked with certified verified sources (including King Fahd Complex). Users are encouraged to cross-reference with qualified Islamic scholars for personal legal rulings (Fatwa).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="font-semibold text-[#F5EFE6] flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#DFBA7F]" />
                <span>2. AI Assistant & Guidance</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Noor AI provides grounded Islamic study assistance, historical context, and reflection tools. It is not an issuing authority of religious decrees and should be used respectfully for personal study and contemplation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5">
              <div className="font-semibold text-[#F5EFE6] flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5 text-[#DFBA7F]" />
                <span>3. Privacy & Sanctity of User Data</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Your spiritual streaks, prayer logs, bookmarks, and recitations remain private. We do not sell your personal data or prayer history to third-party ad networks.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-stone-500">
            Last updated: 2026 · ALNOOR GROUP (مجموعة نور) · Riyadh, Saudi Arabia
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700/20 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#DFBA7F] hover:bg-[#C9A063] text-stone-950 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
