import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  CheckCircle2,
  Heart,
  ChevronRight,
  Flame,
  Calendar,
  Compass,
} from 'lucide-react';
import { RamadanUserData } from '../../types/ramadan';
import { recordDailyCheckIn, getRamadanUserData } from '../../utils/ramadanDb';

interface RamadanCheckInCardProps {
  isDark?: boolean;
  onNavigateToRamadan?: () => void;
  className?: string;
}

export const RamadanCheckInCard: React.FC<RamadanCheckInCardProps> = ({
  isDark = true,
  onNavigateToRamadan,
  className = '',
}) => {
  const [userData, setUserData] = useState<RamadanUserData | null>(null);
  const [todayStatus, setTodayStatus] = useState<'yes' | 'no' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const data = await getRamadanUserData();
      if (!isMounted) return;
      if (data) {
        setUserData(data);
        const todayLog = data.dailyLog.find((l) => l.date === todayStr);
        if (todayLog) {
          setTodayStatus(todayLog.status);
          if (todayLog.status === 'yes') {
            setFeedbackMessage('Alhamdulillah! May Allah accept every step of your effort today.');
          } else {
            setFeedbackMessage('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
          }
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  const handleCheckIn = async (status: 'yes' | 'no') => {
    setIsSubmitting(true);
    setTodayStatus(status);
    if (status === 'yes') {
      setFeedbackMessage('Alhamdulillah! May Allah accept every step of your effort today.');
    } else {
      setFeedbackMessage('Allah sees your sincere intention. Rest with peace and rise renewed tomorrow.');
    }

    try {
      const updated = await recordDailyCheckIn(status, todayStr);
      setUserData(updated);
    } catch (err) {
      console.warn('Check in save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no dream set yet, show an invitation card to set Ramadan dream
  if (!userData) {
    return (
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#0C1222] via-[#090E1A] to-[#060A14] border-[#C9A063]/30 text-stone-100 shadow-md'
            : 'bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-100/60 border-[#C9A063]/40 text-stone-900 shadow-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30 flex items-center justify-center text-[#DFBA7F] shrink-0 shadow-sm">
            <Moon className="w-5 h-5 text-[#DFBA7F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#DFBA7F] font-bold">
                Noor Ramadan 1447 AH
              </span>
              <span className="text-xs font-arabic text-[#DFBA7F]" dir="rtl">
                رمضان كريم
              </span>
            </div>
            <h3 className="text-sm font-serif-heading font-bold text-white">
              What is your spiritual dream for this Ramadan?
            </h3>
            <p className="text-xs text-stone-400 font-light mt-0.5">
              Set one sincere goal, build your daily schedule, and track 30 days of divine growth.
            </p>
          </div>
        </div>

        {onNavigateToRamadan && (
          <button
            type="button"
            onClick={onNavigateToRamadan}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#07090F] text-xs font-cinzel font-bold tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Set My Dream</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Calculate streak from dailyLog
  const daysAchieved = userData.dailyLog.filter((l) => l.status === 'yes').length;
  const progressPercent = Math.min(100, Math.round((daysAchieved / 30) * 100));

  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden space-y-4 ${
        isDark
          ? 'bg-gradient-to-b from-[#0B1120] to-[#070B16] border-[#C9A063]/30 text-stone-100 shadow-md'
          : 'bg-white border-[#C9A063]/35 text-stone-900 shadow-xs'
      } ${className}`}
    >
      {/* Top Gold Trim */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-80" />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C9A063]/15 border border-[#C9A063]/30 flex items-center justify-center text-[#DFBA7F]">
            <Moon className="w-4 h-4 text-[#DFBA7F]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#DFBA7F] font-semibold">
              Daily Ramadan Dream Check-In
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
              "{userData.goalText}"
            </h4>
          </div>
        </div>

        {onNavigateToRamadan && (
          <button
            type="button"
            onClick={onNavigateToRamadan}
            className="text-[11px] font-mono text-[#DFBA7F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Plan</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Question & Actions */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium text-stone-200">
            Did you work toward your Ramadan dream today?
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-400">
              {daysAchieved}/30 Days Achieved ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCheckIn('yes')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              todayStatus === 'yes'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yes, I did!</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleCheckIn('no')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              todayStatus === 'no'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-purple-400" />
            <span>Not today</span>
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <p className="text-[11px] text-center font-light italic text-[#DFBA7F] animate-fadeIn">
            {feedbackMessage}
          </p>
        )}
      </div>
    </div>
  );
};
