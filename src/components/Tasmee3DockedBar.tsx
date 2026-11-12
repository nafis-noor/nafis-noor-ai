import React from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Check,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { Tasmee3Status } from '../utils/tasmee3Speech';
import { Tasmee3Waveform } from './Tasmee3Waveform';

interface Tasmee3DockedBarProps {
  isDark: boolean;
  status: Tasmee3Status;
  surahName: string;
  surahEnglishName: string;
  currentVerse: number;
  startingVerse: number;
  totalAyahs: number;
  audioLevel: number;
  uncertainMessage: string | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onFinish: () => void;
  onExpand: () => void;
  onDismissUncertain: () => void;
}

export const Tasmee3DockedBar: React.FC<Tasmee3DockedBarProps> = ({
  isDark,
  status,
  surahName,
  surahEnglishName,
  currentVerse,
  startingVerse,
  totalAyahs,
  audioLevel,
  uncertainMessage,
  onPause,
  onResume,
  onStop,
  onFinish,
  onExpand,
  onDismissUncertain,
}) => {
  if (status === 'idle' || status === 'stopped' || status === 'finished') {
    return null;
  }

  return (
    <div
      id="tasmee3-docked-bar"
      className={`fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 z-40 sm:max-w-md w-auto rounded-3xl p-3 sm:p-4 border shadow-md transition-all duration-200 animate-fadeIn ${
        isDark
          ? 'bg-[#0E1217]/98 border-[#C9A063]/40 shadow-[0_2px_8px_rgba(0,0,0,0.25)] text-stone-100'
          : 'bg-white/98 border-[#C9A063]/40 shadow-[0_2px_8px_rgba(201,160,99,0.15)] text-stone-900'
      }`}
    >
      {/* Top row: Status, Surah info, Expand */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#C9A063]/20">
        <div className="flex items-center gap-2">
          {/* Audio reactive pulse icon */}
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
              status === 'listening'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#DFBA7F] font-serif-heading">
                Tasmee3 Active
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                  status === 'listening'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {status === 'listening' ? 'Listening…' : 'Paused'}
              </span>
            </div>
            <div className="text-[10px] text-stone-400">
              Surah {surahEnglishName} ({surahName})
            </div>
          </div>
        </div>

        {/* Expand full modal */}
        <button
          onClick={onExpand}
          className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 active:scale-95 transition-all"
          title="Expand Tasmee3 Full View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Position Display */}
      <div className="flex items-center justify-between gap-2 my-1.5">
        <div>
          <div className="text-[11px] text-stone-400 font-cinzel">Current position:</div>
          <div className="text-sm font-bold text-[#DFBA7F] font-serif-heading">
            Verse {currentVerse} <span className="text-xs text-stone-400 font-normal">of {totalAyahs}</span>
          </div>
        </div>

        {/* Real-time Compact Animated Voice Waveform */}
        <div className="w-32 sm:w-36 shrink-0">
          <Tasmee3Waveform
            audioLevel={audioLevel}
            isListening={status === 'listening'}
            isPaused={status === 'paused'}
            isDark={isDark}
            height={28}
            compact={true}
            showStatusHeader={false}
          />
        </div>
      </div>

      {/* Uncertain notice banner */}
      {uncertainMessage && (
        <div className="mt-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{uncertainMessage}</span>
          </div>
          <button
            onClick={onDismissUncertain}
            className="text-stone-400 hover:text-stone-200 text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control buttons: Pause/Resume, Stop, Finish */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#C9A063]/15">
        {status === 'listening' ? (
          <button
            onClick={onPause}
            className="flex-1 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onResume}
            className="flex-1 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Play className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={onStop}
          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 text-[11px] font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
        >
          <Square className="w-3 h-3" />
          <span>Stop</span>
        </button>

        <button
          onClick={onFinish}
          className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] text-[11px] font-bold shadow-xs hover:shadow-[0_0_15px_rgba(201,160,99,0.3)] active:scale-95 transition-all flex items-center justify-center gap-1"
        >
          <Check className="w-3 h-3" />
          <span>Finish</span>
        </button>
      </div>
    </div>
  );
};
