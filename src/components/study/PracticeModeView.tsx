import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  HelpCircle,
  RotateCw,
} from 'lucide-react';
import { Subject, Topic, PracticeQuestion, QuizDifficulty } from '../../types/study';
import { recordStudyActivity } from '../../utils/studyStorage';

interface PracticeModeViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const PracticeModeView: React.FC<PracticeModeViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState<QuizDifficulty>('medium');
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streakCount, setStreakCount] = useState(0); // local session accuracy tracking

  const fetchNextQuestion = async (lastWasCorrect?: boolean) => {
    setIsLoading(true);
    setIsAnswered(false);
    setSelectedAnswer('');

    // Dynamically adjust difficulty
    let nextDiff: QuizDifficulty = currentDifficulty;
    if (lastWasCorrect === true) {
      if (currentDifficulty === 'easy') nextDiff = 'medium';
      else if (currentDifficulty === 'medium') nextDiff = 'hard';
      else if (currentDifficulty === 'hard') nextDiff = 'exam';
    } else if (lastWasCorrect === false) {
      if (currentDifficulty === 'exam') nextDiff = 'hard';
      else if (currentDifficulty === 'hard') nextDiff = 'medium';
      else if (currentDifficulty === 'medium') nextDiff = 'easy';
    }
    setCurrentDifficulty(nextDiff);

    try {
      const res = await fetch('/api/study/practice-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          difficulty: nextDiff,
          lastCorrect: lastWasCorrect ?? true,
        }),
      });

      const data = await res.json();
      setCurrentQuestion(data);
    } catch (err) {
      console.error(err);
      setCurrentQuestion({
        id: 'fallback-' + Date.now(),
        subjectId: selectedSubject.id,
        topicId: selectedTopic?.id,
        type: 'multiple_choice',
        difficulty: nextDiff,
        question: `Review: What is a foundational principle of mastering ${selectedSubject.name}?`,
        options: ['Continuous reflection and consistent practice', 'Passive skimming only', 'Rushing without comprehension', 'Omitting spaced repetitions'],
        correctAnswer: 'Continuous reflection and consistent practice',
        explanation: 'Consistent daily practice and thoughtful reflection solidify foundational knowledge.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [selectedSubject.id, selectedTopic?.id]);

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer.trim()) return;

    const correct =
      selectedAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setStreakCount((prev) => prev + 1);
    } else {
      setStreakCount(0);
    }

    recordStudyActivity(
      'practice',
      `Practiced: ${selectedSubject.name}`,
      `${correct ? 'Correct' : 'Incorrect'} on ${currentDifficulty} level question`,
      selectedSubject.id,
      selectedTopic?.id
    );
    onRefreshData?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-[#DFBA7F]" />
            <span>Adaptive Practice</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            One-by-one questions adapting to your mastery level in {selectedSubject.name}{' '}
            {selectedTopic ? `• ${selectedTopic.name}` : ''}
          </p>
        </div>

        {/* Difficulty indicator badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">Current Level:</span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              currentDifficulty === 'easy'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : currentDifficulty === 'medium'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : currentDifficulty === 'hard'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
            }`}
          >
            {currentDifficulty}
          </span>
        </div>
      </div>

      {/* Main Practice Container */}
      <div
        className={`max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg transition-colors ${
          isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#DFBA7F] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-medium">
              Generating your next adaptive question...
            </p>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-6">
            {/* Question Box */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Target Question
              </span>
              <h3 className="text-base sm:text-lg font-bold leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Choices */}
            <div className="space-y-2.5">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => setSelectedAnswer(option)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#C9A063]/20 border-[#C9A063] text-[#DFBA7F] font-semibold'
                          : isDark
                          ? 'bg-[#121826] border-white/10 hover:border-white/20 text-stone-200'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <span>{option}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#DFBA7F] bg-[#DFBA7F]' : 'border-stone-500'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#080A0E]" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div>
                  <input
                    type="text"
                    disabled={isAnswered}
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Enter your concise answer..."
                    className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border outline-none ${
                      isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Submit Answer Button */}
            {!isAnswered ? (
              <button
                type="button"
                disabled={!selectedAnswer.trim()}
                onClick={handleSubmitAnswer}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] disabled:opacity-40 transition-opacity"
              >
                Check Answer
              </button>
            ) : (
              /* Answer Feedback Section */
              <div className="space-y-4 pt-4 border-t border-white/10 animate-fadeIn">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 shrink-0 text-red-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isCorrect ? 'Correct! Well reasoned.' : 'Not quite. Keep going!'}
                    </h4>
                    {!isCorrect && (
                      <p className="text-xs mt-0.5">
                        Correct answer: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-[#141B2B] border-white/10 text-stone-300' : 'bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <strong className="text-[#DFBA7F] block mb-1">Step-by-Step Explanation:</strong>
                  {currentQuestion.explanation}
                </div>

                {/* Optional follow-up challenge */}
                {currentQuestion.followUpPrompt && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <strong className="block mb-0.5">Deeper Reflection:</strong>
                    {currentQuestion.followUpPrompt}
                  </div>
                )}

                {/* Next Question */}
                <button
                  type="button"
                  onClick={() => fetchNextQuestion(isCorrect)}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xs text-stone-400">Failed to load question.</p>
            <button
              type="button"
              onClick={() => fetchNextQuestion()}
              className="mt-3 px-4 py-2 rounded-xl text-xs bg-[#C9A063] text-[#080A0E]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
