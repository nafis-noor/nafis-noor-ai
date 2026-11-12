import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  FileText,
  Mic,
  ArrowRight,
  GraduationCap,
  Info,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { AppLogoIcon } from './AppLogoIcon';

interface AuthLifetimeFreeFlowProps {
  isDark?: boolean;
  onComplete: () => void;
  userName?: string;
  initialStage?: 'notice' | 'terms';
}

type Stage = 'notice' | 'terms';

export const AuthLifetimeFreeFlow: React.FC<AuthLifetimeFreeFlowProps> = ({
  isDark = true,
  onComplete,
  userName,
  initialStage = 'notice',
}) => {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  const handleFinish = () => {
    try {
      localStorage.setItem('nafis_noor_terms_acknowledged', 'true');
      localStorage.setItem('nafis_noor_terms_date', new Date().toISOString());
    } catch {
      // safe fallback
    }
    onComplete();
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-3 sm:px-6 animate-fadeIn">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStage('notice')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
            stage === 'notice'
              ? 'bg-[#C9A063]/25 text-[#DFBA7F] border border-[#DFBA7F]/40'
              : 'bg-white/5 text-stone-400 hover:text-stone-200 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F]" />
          <span>1. Development Status</span>
        </button>

        <span className="text-stone-600 text-xs">/</span>

        <button
          type="button"
          onClick={() => setStage('terms')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
            stage === 'terms'
              ? 'bg-[#C9A063]/25 text-[#DFBA7F] border border-[#DFBA7F]/40'
              : 'bg-white/5 text-stone-400 hover:text-stone-200 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F]" />
          <span>2. Terms &amp; Acceptance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PRE-RELEASE / DEVELOPMENT NOTICE                                       */}
      {/* ========================================================================= */}
      {stage === 'notice' && (
        <div
          id="auth-prerelease-screen"
          className="p-6 sm:p-10 rounded-[32px] border relative transition-all shadow-2xl bg-[#101318] border-white/10 text-stone-100"
        >
          <div className="max-w-xl mx-auto space-y-5 text-center">
            {/* Logo Emblem */}
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-[0_6px_25px_rgba(201,160,99,0.3)] mb-1">
              <AppLogoIcon className="w-full h-full" withContainer={true} />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Info className="w-3.5 h-3.5" />
              <span>Pre-Release Notice</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-[#F5EFE6]">
              Nafis Noor is still in development
            </h1>

            <div className="p-5 rounded-2xl border text-left text-xs leading-relaxed space-y-3 bg-white/5 border-white/10 text-stone-300">
              <p className="font-semibold text-stone-100">
                Thank you for being part of Nafis Noor{userName ? `, ${userName}` : ''}.
              </p>

              <p>
                Nafis Noor is currently in an early development and pre-release stage. The application is not yet fully published, and several parts of the experience are still being developed, tested, refined, and improved.
              </p>

              <p>
                Some features may change before the official release, and certain functionality may not yet be available or may behave differently during development.
              </p>

              <p>
                Our goal is to build a reliable, useful, and high-quality experience, so we are continuing to work on the application before its full public release.
              </p>

              <p>
                Your current experience should therefore be considered a preview of an application that is still being actively developed.
              </p>

              <p className="text-stone-400 font-medium pt-1">
                Thank you for your patience and understanding while Nafis Noor continues to grow.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="auth-notice-continue-btn"
                onClick={() => setStage('terms')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer font-cinzel tracking-wider"
              >
                <span>Continue to Terms &amp; Conditions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TERMS & ACCEPTANCE                                                     */}
      {/* ========================================================================= */}
      {stage === 'terms' && (
        <div
          id="auth-terms-screen"
          className="p-6 sm:p-9 rounded-[32px] border relative transition-all shadow-xl bg-[#101318] border-white/10 text-stone-100"
        >
          <div className="max-w-xl mx-auto space-y-5">
            <div className="border-b pb-4 border-white/10 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#DFBA7F]/15 text-[#DFBA7F] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Essential Information</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif-heading font-bold text-[#F5EFE6]">
                  Terms &amp; Important Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStage('notice')}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-[#DFBA7F] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Notice</span>
              </button>
            </div>

            {/* Scrollable Terms Sections */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl border bg-white/5 border-white/5">
                <div className="flex items-center gap-2 text-stone-100 font-bold mb-1">
                  <FileText className="w-3.5 h-3.5 text-[#DFBA7F]" />
                  <span>Terms of Use</span>
                </div>
                <p className="text-stone-300">
                  Nafis Noor is an Islamic companion designed to assist Muslims with Qur'an reading, accurate prayer times, dhikr counting, authentic supplications, Islamic learning, and interactive knowledge assistance.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border bg-white/5 border-white/5">
                <div className="flex items-center gap-2 text-stone-100 font-bold mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#DFBA7F]" />
                  <span>Privacy &amp; Data Protection</span>
                </div>
                <p className="text-stone-300">
                  Your data, bookmarks, and journey progress are protected. When signed in, data syncs safely across your devices. Guest sessions store data strictly within your browser without creating an account.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border bg-white/5 border-white/5">
                <div className="flex items-center gap-2 text-stone-100 font-bold mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Assistance Notice</span>
                </div>
                <p className="text-stone-300">
                  Noor AI is an educational assistant grounded in verified Islamic references. While strictly guided, AI responses should not replace formal rulings from qualified scholars.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border bg-white/5 border-white/5">
                <div className="flex items-center gap-2 text-stone-100 font-bold mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#DFBA7F]" />
                  <span>Educational Purpose</span>
                </div>
                <p className="text-stone-300">
                  All learning modules and phonetics exercises are intended to enrich your spiritual habit and knowledge in a dignified, accessible manner.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border bg-white/5 border-white/5">
                <div className="flex items-center gap-2 text-stone-100 font-bold mb-1">
                  <Mic className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Voice &amp; Audio Features</span>
                </div>
                <p className="text-stone-300">
                  Audio features use standard device microphones and speech synthesis for interactive study. No unauthorized voice recording or profiling takes place.
                </p>
              </div>
            </div>

            {/* Checkbox agreement */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                hasAgreedToTerms
                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-stone-300'
              }`}
            >
              <input
                type="checkbox"
                id="agree-auth-terms-checkbox"
                checked={hasAgreedToTerms}
                onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#DFBA7F] focus:ring-[#DFBA7F] cursor-pointer accent-[#C9A063]"
              />
              <label
                htmlFor="agree-auth-terms-checkbox"
                className="text-xs font-medium cursor-pointer select-none leading-relaxed"
              >
                I have read and understood the Terms &amp; Important Information.
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStage('notice')}
                className="text-[11px] text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="auth-terms-agree-btn"
                disabled={!hasAgreedToTerms}
                onClick={handleFinish}
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 font-cinzel tracking-wider ${
                  hasAgreedToTerms
                    ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95 shadow-md cursor-pointer'
                    : 'bg-white/10 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span>I Agree &amp; Enter Nafis Noor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
