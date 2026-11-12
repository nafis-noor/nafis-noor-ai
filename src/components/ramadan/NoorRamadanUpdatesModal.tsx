import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  Heart,
  BookOpen,
  Compass,
  ArrowRight,
  X,
  Share2,
  AlertCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { HijriDateInfo } from '../../utils/hijriCalendar';

interface NoorRamadanUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  ramadanStatus: HijriDateInfo | null;
  isRamadanSimulated: boolean;
  onToggleSimulated?: () => void;
  onProceedToRamadan?: () => void;
}

export const NoorRamadanUpdatesModal: React.FC<NoorRamadanUpdatesModalProps> = ({
  isOpen,
  onClose,
  isDark,
  ramadanStatus,
  isRamadanSimulated,
  onToggleSimulated,
  onProceedToRamadan,
}) => {
  const [currentLiveTime, setCurrentLiveTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [currentLiveDate, setCurrentLiveDate] = useState<string>(() =>
    new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  );

  // Update clock every second while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentLiveDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isRamadanActive = Boolean(ramadanStatus?.isRamadan || isRamadanSimulated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl relative transition-all flex flex-col ${
          isDark
            ? 'bg-[#090D16] border-[#DFBA7F]/40 text-[#F5EFE6]'
            : 'bg-white border-[#C9A063]/40 text-stone-900'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFBA7F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 left-0 w-48 h-48 bg-[#C9A063]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="sticky top-0 z-20 px-6 py-4 border-b border-[#C9A063]/20 backdrop-blur-xl bg-inherit/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DFBA7F] to-[#A67C38] text-[#090C11] flex items-center justify-center shadow-md shadow-[#C9A063]/25 shrink-0">
              <Moon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif-heading font-bold text-[#DFBA7F]">
                  Ramadan Updates & Features
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFBA7F]/15 text-[#DFBA7F] border border-[#DFBA7F]/30 uppercase">
                  Release Notes
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light">
                Verified Islamic Schedule & Guidelines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-700/60 bg-stone-800/40 hover:bg-stone-800 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Real-Time Date & Time Verification Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isRamadanActive
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#DFBA7F]" />
                <span>Real-Time Date & Time Verification</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-[#DFBA7F]">
                <Clock className="w-3 h-3 animate-spin text-[#DFBA7F]" />
                <span>{currentLiveTime}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Gregorian Live:</span>
                <p className="font-semibold text-white">{currentLiveDate}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Hijri Calendar:</span>
                <p className="font-semibold text-[#DFBA7F]">
                  {ramadanStatus ? `${ramadanStatus.day} ${ramadanStatus.monthNameEn} ${ramadanStatus.year} AH` : 'Calculating...'}
                  {ramadanStatus?.monthNameAr && ` (${ramadanStatus.monthNameAr})`}
                </p>
              </div>
            </div>

            {/* Lock / Active Status Notice */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isRamadanActive ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-emerald-300">
                      Ramadan Active (Month 9) • Events Unlocked
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-amber-300">
                      Events Locked: Currently outside Ramadan (Month {ramadanStatus?.monthNumber || 5} of 12).
                    </span>
                  </>
                )}
              </div>

              <span className="text-[10px] font-mono text-stone-400">
                Aladhan Sync
              </span>
            </div>
          </div>

          {/* 2. Important Architectural Rules Notice */}
          <div className="p-4 rounded-2xl bg-black/40 border border-[#C9A063]/25 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ramadan Event Access & Day Locking Rules</span>
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed font-light">
              By Islamic principle and app design, Ramadan events activate <strong>only on verified Ramadan dates</strong>. Furthermore, to keep focus on today's sincere efforts, upcoming days in the Ramadan journey are locked sequentially:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-[#DFBA7F]/10 border border-[#DFBA7F]/30 text-[#DFBA7F] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="font-bold block">Tomorrow:</span>
                  <span className="text-[11px] text-stone-200">Locked with label <strong>"Tomorrow Insha'Allah"</strong> (unlocks at Fajr).</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-stone-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="font-bold block">Future Days (Day +2 onward):</span>
                  <span className="text-[11px] text-stone-300">Locked with label <strong>"Insha'Allah that time"</strong>.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ramadan Features & Updates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              What's Included in the Ramadan Update
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Feature 1 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C9A063]/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0 mt-0.5">
                  <Moon className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">1. One Personal Spiritual Dream</h5>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Set a single, heart-centered goal for Ramadan (Fast 30 days, Read full Quran, Taraweeh nightly, Daily charity, Memorize surahs, Stop a bad habit, Patience) or enter a custom dream.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C9A063]/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">2. Al-Noor Plan & Custom Daily Routine</h5>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Pre-built 10-step routine combining best practices (Suhoor before Fajr, post-Fajr Quran, Morning & Afternoon Adhkar, Maghrib/Iftar, Taraweeh, Tahajjud) with customizable times.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C9A063]/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">3. Daily Maghrib Check-In & Affirmation</h5>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    "Did you work toward your dream today?" with affirmative reinforcement or guilt-free encouragement grounded in Allah's mercy.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C9A063]/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">4. 30-Day Journey Calendar & Progress</h5>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Visual 30-day grid with streak tracker and completion percentage. Today is active; Tomorrow shows "Tomorrow Insha'Allah"; all subsequent days show "Insha'Allah that time".
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C9A063]/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">5. 24-Hour Daily Inspiration Pulse</h5>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Full-screen card with amber glow featuring rotating Quranic verses, life transformations, global charity calls, and authentic hadiths.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Area */}
          <div className="pt-2 border-t border-[#C9A063]/20 space-y-3">
            {isRamadanActive ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                  Ramadan date verified! You can enter and interact with the Ramadan module.
                </div>
                {onProceedToRamadan && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToRamadan();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DFBA7F] via-[#C9A063] to-[#A67C38] text-[#080B10] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Moon className="w-4 h-4 fill-current" />
                    <span>Open Ramadan Events</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Ramadan Events are locked until Ramadan begins.</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  The live date & time check confirms that we are currently in Month {ramadanStatus?.monthNumber || 5} ({ramadanStatus?.monthNameEn || 'Islamic Calendar'}). Ramadan events will unlock automatically on 1 Ramadan 1447, Insha'Allah.
                </p>
              </div>
            )}

            {/* Developer Testing Simulation Toggler */}
            {onToggleSimulated && (
              <div className="flex items-center justify-between pt-2 text-[11px] text-stone-400">
                <span>Testing Mode (Simulate Ramadan Date):</span>
                <button
                  type="button"
                  onClick={onToggleSimulated}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                    isRamadanSimulated
                      ? 'border-[#DFBA7F]/50 bg-[#DFBA7F]/20 text-[#DFBA7F]'
                      : 'border-stone-700 bg-stone-800 text-stone-300'
                  }`}
                >
                  {isRamadanSimulated ? 'Simulation Enabled (Testing)' : 'Real Date Check (Standard)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#C9A063]/20 bg-inherit flex items-center justify-between text-xs text-stone-400">
          <span>NOOR Islamic App • Ramadan 1447</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
