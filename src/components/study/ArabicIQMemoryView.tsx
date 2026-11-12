import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  Award,
  HelpCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { ARABIC_IQ_CHALLENGES, ARABIC_MEMORY_CHALLENGES } from '../../data/arabicCurriculum';
import { ArabicIQChallenge, ArabicMemoryChallenge } from '../../types/arabic';
import { recordIQChallengeResult, recordMemoryChallengeResult, loadArabicProgress } from '../../utils/arabicStorage';

interface ArabicIQMemoryViewProps {
  isDark: boolean;
  language?: string;
}

export const ArabicIQMemoryView: React.FC<ArabicIQMemoryViewProps> = ({ isDark, language }) => {
  const [subTab, setSubTab] = useState<'iq' | 'memory'>('iq');

  // Arabic IQ State
  const [currentIqIndex, setCurrentIqIndex] = useState(0);
  const [iqSelectedOpt, setIqSelectedOpt] = useState<number | null>(null);
  const [iqFeedback, setIqFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [progressState, setProgressState] = useState(() => loadArabicProgress());

  // Memory Challenge State
  const [memIndex, setMemIndex] = useState(0);
  const [memPhase, setMemPhase] = useState<'memorize' | 'recall'>('memorize');
  const [memSelectedOpt, setMemSelectedOpt] = useState<number | null>(null);
  const [memFeedback, setMemFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  const currentIq = ARABIC_IQ_CHALLENGES[currentIqIndex % ARABIC_IQ_CHALLENGES.length];
  const currentMem = ARABIC_MEMORY_CHALLENGES[memIndex % ARABIC_MEMORY_CHALLENGES.length];

  // IQ Answer
  const handleIqSelect = (idx: number) => {
    if (iqFeedback) return;
    setIqSelectedOpt(idx);
    const isCorrect = idx === currentIq.correctIndex;
    const updated = recordIQChallengeResult(isCorrect);
    setProgressState(updated);
    setIqFeedback({
      isCorrect,
      explanation: currentIq.explanation,
    });
  };

  const handleNextIq = () => {
    setIqSelectedOpt(null);
    setIqFeedback(null);
    setCurrentIqIndex(prev => prev + 1);
  };

  // Memory Answer
  const handleMemSelect = (idx: number) => {
    if (memFeedback) return;
    setMemSelectedOpt(idx);
    const isCorrect = idx === currentMem.correctIndex;
    const updated = recordMemoryChallengeResult(isCorrect);
    setProgressState(updated);
    setMemFeedback({
      isCorrect,
      explanation: currentMem.explanation,
    });
  };

  const handleNextMem = () => {
    setMemSelectedOpt(null);
    setMemFeedback(null);
    setMemPhase('memorize');
    setMemIndex(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                Cognitive Arabic Lab
              </span>
              <span className="text-xs text-stone-500">Linguistic Reasoning & Memory</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Arabic Linguistic IQ & Memory Arena
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Challenge yourself with root derivations (Wazn), morphological deduction, odd-one-out patterns, and sequential Arabic memory retention.
            </p>
          </div>

          {/* Mode Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'
            }`}
          >
            <button
              onClick={() => setSubTab('iq')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'iq'
                  ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Arabic IQ Challenges
            </button>
            <button
              onClick={() => setSubTab('memory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subTab === 'memory'
                  ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Arabic Memory Training
            </button>
          </div>
        </div>

        {/* Real Live Metrics Bar */}
        <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5">
            <span className="text-[11px] text-stone-500 block">Linguistic IQ Index</span>
            <span className="text-xl font-bold text-[#DFBA7F] font-serif">
              {progressState.arabicIQScore}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5">
            <span className="text-[11px] text-stone-500 block">IQ Puzzles Solved</span>
            <span className="text-xl font-bold text-stone-200 font-serif">
              {progressState.iqChallengesCompleted}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5">
            <span className="text-[11px] text-stone-500 block">Memory Accuracy</span>
            <span className="text-xl font-bold text-emerald-400 font-serif">
              {progressState.memoryAccuracy}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5">
            <span className="text-[11px] text-stone-500 block">Memory Sessions</span>
            <span className="text-xl font-bold text-stone-200 font-serif">
              {progressState.memorySessionsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab 1: Arabic IQ */}
      {subTab === 'iq' && currentIq && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border text-center space-y-6 ${
            isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>IQ Puzzle {currentIqIndex + 1} of {ARABIC_IQ_CHALLENGES.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C9A063]/15 text-[#DFBA7F] font-semibold text-[10px] uppercase">
              {currentIq.type.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {currentIq.question}
            </h3>
            {currentIq.arabicPrompt && (
              <div className="text-3xl md:text-4xl font-serif text-[#DFBA7F] py-3 tracking-wide">
                {currentIq.arabicPrompt}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {currentIq.options.map((opt, idx) => {
              const isSelected = iqSelectedOpt === idx;
              const isCorrect = idx === currentIq.correctIndex;
              let btnStyle = isDark
                ? 'bg-stone-900/60 border-white/5 text-stone-200 hover:bg-white/10'
                : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100';

              if (iqFeedback) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleIqSelect(idx)}
                  disabled={Boolean(iqFeedback)}
                  className={`p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <span className="font-serif text-base">{opt}</span>
                  {iqFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {iqFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {iqFeedback && (
            <div
              className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
                iqFeedback.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {iqFeedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Linguistic Deduction Correct (+4 IQ points)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Linguistic Analysis</span>
                  </>
                )}
              </div>
              <p className="text-stone-300">{iqFeedback.explanation}</p>
              <button
                onClick={handleNextIq}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-semibold text-xs flex items-center gap-1.5 ml-auto"
              >
                <span>Next Linguistic Puzzle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Arabic Memory */}
      {subTab === 'memory' && currentMem && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border text-center space-y-6 ${
            isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Memory Challenge {memIndex + 1} of {ARABIC_MEMORY_CHALLENGES.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C9A063]/15 text-[#DFBA7F] font-semibold text-[10px] uppercase">
              {currentMem.type.replace('_', ' ')}
            </span>
          </div>

          {memPhase === 'memorize' ? (
            /* Phase 1: Memorization Display */
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Study & Commit to Memory:
                </span>
                <h3 className="text-xl font-bold font-serif text-stone-100">
                  {currentMem.presentationPrompt || currentMem.title}
                </h3>
              </div>

              {/* Items Card */}
              <div className="flex flex-wrap items-center justify-center gap-3 p-6 rounded-2xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5">
                {(currentMem.items || currentMem.itemsToMemorize || []).map((item, idx) => {
                  const arabicText = typeof item === 'string' ? item : item.arabic;
                  const meaningText =
                    typeof item === 'object' && item && 'meaning' in item
                      ? (item as any).meaning
                      : '';
                  return (
                    <span
                      key={idx}
                      className="px-5 py-3 rounded-2xl bg-black/40 border border-[#C9A063]/40 text-2xl md:text-3xl font-serif text-[#DFBA7F] shadow-sm flex flex-col items-center"
                    >
                      <span>{arabicText}</span>
                      {meaningText && (
                        <span className="text-[10px] font-sans text-stone-400 mt-0.5 font-normal">
                          {meaningText}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={() => setMemPhase('recall')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-xs font-semibold inline-flex items-center gap-2 shadow-md hover:opacity-90"
              >
                <EyeOff className="w-4 h-4" />
                <span>I Have Memorized This (Start Recall Test)</span>
              </button>
            </div>
          ) : (
            /* Phase 2: Recall Question */
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Recall Test:
                </span>
                <h3 className="text-xl font-bold font-serif text-stone-100">
                  {currentMem.questionText || currentMem.question}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {currentMem.options.map((opt, idx) => {
                  const isSelected = memSelectedOpt === idx;
                  const isCorrect = idx === currentMem.correctIndex;
                  let btnStyle = isDark
                    ? 'bg-stone-900/60 border-white/5 text-stone-200 hover:bg-white/10'
                    : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100';

                  if (memFeedback) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMemSelect(idx)}
                      disabled={Boolean(memFeedback)}
                      className={`p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <span className="font-serif text-lg">{opt}</span>
                      {memFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {memFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {memFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
                    memFeedback.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {memFeedback.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Flawless Memory Recall!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Memory Review</span>
                      </>
                    )}
                  </div>
                  <p className="text-stone-300">{memFeedback.explanation}</p>
                  <button
                    onClick={handleNextMem}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-semibold text-xs flex items-center gap-1.5 ml-auto"
                  >
                    <span>Next Memory Exercise</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
