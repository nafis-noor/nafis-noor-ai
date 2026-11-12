import React, { useState } from 'react';
import {
  FileQuestion,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ARABIC_DIAGNOSTIC_TEST } from '../../data/arabicCurriculum';
import { ArabicTestResult } from '../../types/arabic';
import { recordArabicTestResult, loadArabicProgress } from '../../utils/arabicStorage';

interface DiagnosticTestViewProps {
  isDark: boolean;
  language?: string;
}

export const DiagnosticTestView: React.FC<DiagnosticTestViewProps> = ({ isDark, language }) => {
  const [testState, setTestState] = useState<'intro' | 'active' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalResult, setFinalResult] = useState<ArabicTestResult | null>(null);

  const questions = ARABIC_DIAGNOSTIC_TEST;
  const currentQ = questions[currentQuestionIndex];

  const handleSelectAnswer = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: optIndex }));

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate real diagnostic results
      finishTest({ ...answers, [currentQ.id]: optIndex });
    }
  };

  const finishTest = (finalAnswers: Record<string, number>) => {
    let totalScore = 0;
    const breakdown: Record<string, { total: number; correct: number }> = {};
    const weaknesses: string[] = [];
    const strengths: string[] = [];

    questions.forEach(q => {
      const userChoice = finalAnswers[q.id];
      const isCorrect = userChoice === q.correctIndex;

      if (!breakdown[q.category]) {
        breakdown[q.category] = { total: 0, correct: 0 };
      }
      breakdown[q.category].total += 1;
      if (isCorrect) {
        breakdown[q.category].correct += 1;
        totalScore += 1;
      } else {
        if (!weaknesses.includes(q.category)) {
          weaknesses.push(`${q.category}: review key concepts`);
        }
      }
    });

    Object.keys(breakdown).forEach(cat => {
      const b = breakdown[cat];
      if (b.correct === b.total) {
        strengths.push(`${cat.toUpperCase()} mastery`);
      }
    });

    const percentage = Math.round((totalScore / questions.length) * 100);
    let level: ArabicTestResult['estimatedLevel'] = 'beginner';
    if (percentage >= 80) level = 'intermediate';
    else if (percentage >= 50) level = 'elementary';

    const plan: string[] = [];
    if (breakdown['alphabet']?.correct < breakdown['alphabet']?.total) {
      plan.push('Spend 10 minutes in the Letter Lab studying Makhārij and non-connecting letters.');
    }
    if (breakdown['vocabulary']?.correct < breakdown['vocabulary']?.total) {
      plan.push('Review the foundational 50 flashcards focusing on triconsonantal roots.');
    }
    if (breakdown['grammar']?.correct < breakdown['grammar']?.total) {
      plan.push('Practice sentence structures in the Live Arabic tutor with real-time corrections.');
    }
    if (plan.length === 0) {
      plan.push('Advance to Level 4 Classical Reading and live Arabic philosophical debates.');
    }

    const testResult: ArabicTestResult = {
      id: `test-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      totalScore,
      maxScore: questions.length,
      estimatedLevel: level,
      sectionBreakdown: breakdown,
      identifiedStrengths: strengths.length ? strengths : ['Diagnostic Baseline Established'],
      identifiedWeaknesses: weaknesses.length ? weaknesses : ['No major defects identified'],
      recommendedPlan: plan,
    };

    recordArabicTestResult(testResult);
    setFinalResult(testResult);
    setTestState('results');
  };

  const handleRetest = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setFinalResult(null);
    setTestState('active');
  };

  return (
    <div className="space-y-6">
      {/* Intro Screen */}
      {testState === 'intro' && (
        <div
          className={`max-w-2xl mx-auto p-8 rounded-3xl border text-center space-y-6 ${
            isDark ? 'bg-[#101318] border-white/5 shadow-2xl' : 'bg-white border-stone-200 shadow-xl'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30 text-[#DFBA7F] mx-auto flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DFBA7F]">
              Comprehensive Assessment
            </span>
            <h2 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Arabic Diagnostic Examination
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
              Evaluate your Arabic knowledge across Alphabet, Phonetics, Vocabulary, Grammar, and Morphology to identify your true CEFR level and exact weaknesses.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-stone-500/5 border border-white/5">
              <span className="text-[10px] text-stone-500 uppercase block">Questions</span>
              <span className="text-base font-bold text-stone-200 font-serif">
                {questions.length} Diagnostic Items
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-500/5 border border-white/5">
              <span className="text-[10px] text-stone-500 uppercase block">Sections</span>
              <span className="text-base font-bold text-stone-200 font-serif">
                Alphabet, Vocab, Nahw
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-500/5 border border-white/5">
              <span className="text-[10px] text-stone-500 uppercase block">Duration</span>
              <span className="text-base font-bold text-stone-200 font-serif">
                ~5 Minutes
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-500/5 border border-white/5">
              <span className="text-[10px] text-stone-500 uppercase block">Outcome</span>
              <span className="text-base font-bold text-[#DFBA7F] font-serif">
                Personalized Plan
              </span>
            </div>
          </div>

          <button
            onClick={() => setTestState('active')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
          >
            <span>Begin Diagnostic Examination</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Examination Screen */}
      {testState === 'active' && currentQ && (
        <div
          className={`max-w-2xl mx-auto p-7 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500 border-b border-white/5 pb-3">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C9A063]/15 text-[#DFBA7F] font-semibold uppercase text-[10px]">
              Section: {currentQ.category}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {currentQ.question}
            </h3>

            {currentQ.arabicPrompt && (
              <div className="text-4xl font-serif text-[#DFBA7F] py-3 text-center">
                {currentQ.arabicPrompt}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full p-4 rounded-xl border text-sm text-left font-serif transition-all flex items-center justify-between ${
                  isDark
                    ? 'bg-stone-900/60 border-white/5 text-stone-200 hover:border-[#C9A063]/50 hover:bg-stone-800'
                    : 'bg-stone-50 border-stone-200 text-stone-800 hover:border-[#C9A063]/50 hover:bg-stone-100'
                }`}
              >
                <span>{opt}</span>
                <span className="w-5 h-5 rounded-full border border-stone-600 flex items-center justify-center text-xs text-stone-400">
                  {String.fromCharCode(65 + idx)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Screen */}
      {testState === 'results' && finalResult && (
        <div
          className={`max-w-2xl mx-auto p-8 rounded-3xl border space-y-6 ${
            isDark ? 'bg-[#101318] border-white/5 shadow-2xl' : 'bg-white border-stone-200 shadow-xl'
          }`}
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#DFBA7F]">
              Assessment Complete
            </span>
            <h2 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Diagnostic Evaluation Report
            </h2>
            <p className="text-sm text-stone-400">
              Overall Accuracy:{' '}
              <strong className="text-emerald-400 font-bold">
                {Math.round((finalResult.totalScore / finalResult.maxScore) * 100)}%
              </strong>{' '}
              ({finalResult.totalScore}/{finalResult.maxScore} correct)
            </p>
          </div>

          {/* Level Assessment Badge */}
          <div className="p-5 rounded-2xl bg-[#C9A063]/10 border border-[#C9A063]/30 text-center space-y-1">
            <span className="text-xs text-stone-400 uppercase tracking-wider">
              Assessed Arabic Proficiency
            </span>
            <div className="text-2xl font-serif font-bold text-[#DFBA7F] capitalize">
              {finalResult.estimatedLevel} Level
            </div>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Your foundational knowledge has been mapped to your personal Arabic curriculum.
            </p>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Section-by-Section Performance
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(finalResult.sectionBreakdown).map(([sec, stats]) => (
                <div key={sec} className="p-3 rounded-xl bg-stone-500/5 border border-white/5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-stone-300 font-semibold">{sec}</span>
                    <span className="text-stone-400">
                      {stats.correct} / {stats.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#DFBA7F] to-[#C9A063]"
                      style={{
                        width: `${Math.round((stats.correct / stats.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Study Plan */}
          <div className="p-5 rounded-2xl bg-stone-500/5 border border-white/5 space-y-3">
            <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DFBA7F]" />
              <span>Recommended Study Action Plan</span>
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              {finalResult.recommendedPlan.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#DFBA7F] font-bold mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleRetest}
            className="w-full py-3 rounded-xl border border-stone-500/20 bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retest Assessment to Measure Growth</span>
          </button>
        </div>
      )}
    </div>
  );
};
