import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Volume2,
  Mic,
  Brain,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { loadArabicProgress } from '../../utils/arabicStorage';
import { ARABIC_LETTERS } from '../../data/arabicCurriculum';

interface ArabicProgressTrackingViewProps {
  isDark: boolean;
  language?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const ArabicProgressTrackingView: React.FC<ArabicProgressTrackingViewProps> = ({
  isDark,
  language,
  onNavigateSection,
}) => {
  const [progress, setProgress] = useState(() => loadArabicProgress());

  const learnedCount = progress.lettersLearned.length;
  const alphabetPercentage = Math.round((learnedCount / 28) * 100);

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
                <TrendingUp className="w-3.5 h-3.5" />
                Empirical Mastery Metrics
              </span>
              <span className="text-xs text-stone-500">Real Learning Analytics</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Arabic Mastery & Competency Profile
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Accurately tracking your retention across the 28 letters, vocabulary bank, 4 core language competencies, and cognitive metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-stone-500/5 border border-white/5 text-right">
              <span className="text-[10px] text-stone-500 uppercase block">Active Practice Time</span>
              <span className="text-lg font-bold text-stone-200 font-serif">
                {progress.totalLearningMinutes} mins
              </span>
            </div>
          </div>
        </div>

        {/* 4 Competency Bars */}
        <div className="mt-6 pt-5 border-t border-stone-200/50 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reading */}
          <div className="p-4 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-[#DFBA7F]" />
                Reading
              </span>
              <span className="text-stone-200 capitalize font-serif">{progress.readingLevel}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#DFBA7F] to-[#C9A063]"
                style={{
                  width:
                    progress.readingLevel === 'advanced'
                      ? '100%'
                      : progress.readingLevel === 'intermediate'
                      ? '70%'
                      : progress.readingLevel === 'elementary'
                      ? '45%'
                      : '20%',
                }}
              />
            </div>
          </div>

          {/* Listening */}
          <div className="p-4 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5 font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                Listening
              </span>
              <span className="text-stone-200 capitalize font-serif">{progress.listeningLevel}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-blue-400"
                style={{
                  width:
                    progress.listeningLevel === 'advanced'
                      ? '100%'
                      : progress.listeningLevel === 'intermediate'
                      ? '70%'
                      : '35%',
                }}
              />
            </div>
          </div>

          {/* Speaking */}
          <div className="p-4 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5 font-semibold">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Speaking
              </span>
              <span className="text-stone-200 capitalize font-serif">{progress.speakingLevel}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{
                  width:
                    progress.speakingLevel === 'advanced'
                      ? '100%'
                      : progress.speakingLevel === 'intermediate'
                      ? '70%'
                      : '30%',
                }}
              />
            </div>
          </div>

          {/* Grammar */}
          <div className="p-4 rounded-xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Grammar (Naḥw)
              </span>
              <span className="text-stone-200 capitalize font-serif">{progress.grammarLevel}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-purple-400"
                style={{
                  width:
                    progress.grammarLevel === 'advanced'
                      ? '100%'
                      : progress.grammarLevel === 'intermediate'
                      ? '65%'
                      : '25%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alphabet Map Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Alphabet Mastery (28 Letters)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {learnedCount} of 28 Letters Mastered ({alphabetPercentage}%)
                </p>
              </div>

              <button
                onClick={() => onNavigateSection?.('alphabet')}
                className="text-xs text-[#DFBA7F] hover:underline"
              >
                Open Letter Lab
              </button>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
              {ARABIC_LETTERS.map(l => {
                const isLearned = progress.lettersLearned.includes(l.id);
                const isWeak = progress.weakLetters.includes(l.id);

                return (
                  <div
                    key={l.id}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border text-center transition-all ${
                      isWeak
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                        : isLearned
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/5 text-stone-500'
                    }`}
                    title={`${l.name} - ${isLearned ? 'Learned' : isWeak ? 'Needs Practice' : 'Not started'}`}
                  >
                    <span className="text-lg font-serif">{l.letter}</span>
                    <span className="text-[8px]">{l.transliteration}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Examination History */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DFBA7F]" />
                <span>Diagnostic Assessment Record</span>
              </h3>
              <button
                onClick={() => onNavigateSection?.('test')}
                className="text-xs text-[#DFBA7F] hover:underline"
              >
                Take Assessment
              </button>
            </div>

            {progress.testsHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-white/5 rounded-xl">
                No formal assessments recorded yet. Take the diagnostic test to benchmark your strengths.
              </div>
            ) : (
              <div className="space-y-3">
                {progress.testsHistory.map(test => (
                  <div
                    key={test.id}
                    className="p-4 rounded-xl bg-stone-500/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-stone-200 block">
                        Assessment Date: {test.date}
                      </span>
                      <span className="text-stone-400 capitalize">
                        Assessed Level: <strong className="text-[#DFBA7F]">{test.estimatedLevel}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 block font-serif">
                        {test.totalScore} / {test.maxScore}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {Math.round((test.totalScore / test.maxScore) * 100)}% Accuracy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Identified Weaknesses to Target */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Identified Target Weaknesses</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-stone-400 block mb-1 font-semibold">Letters Needing Drill:</span>
                {progress.weakLetters.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {progress.weakLetters.map(lId => (
                      <span
                        key={lId}
                        className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      >
                        {lId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-400">All practiced letters solid</span>
                )}
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="text-stone-400 block mb-1 font-semibold">Weak Vocabulary:</span>
                {progress.weakVocabulary.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {progress.weakVocabulary.map(vId => (
                      <span
                        key={vId}
                        className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      >
                        {vId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-400">No weak words flagged</span>
                )}
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="text-stone-400 block mb-1 font-semibold">Cognitive Arabic Index:</span>
                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <span className="text-stone-400">Linguistic IQ</span>
                  <span className="text-base font-serif font-bold text-[#DFBA7F]">
                    {progress.arabicIQScore}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 mt-2">
                  <span className="text-stone-400">Memory Accuracy</span>
                  <span className="text-base font-serif font-bold text-emerald-400">
                    {progress.memoryAccuracy}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
