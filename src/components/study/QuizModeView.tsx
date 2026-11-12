import React, { useState } from 'react';
import {
  FileQuestion,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  FileText,
  UploadCloud,
} from 'lucide-react';
import {
  Subject,
  Topic,
  QuizType,
  QuizDifficulty,
  QuizQuestion,
  QuizResult,
} from '../../types/study';
import { saveQuizResult, loadStudyData } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface QuizModeViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const QuizModeView: React.FC<QuizModeViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  // Quiz State
  const [quizState, setQuizState] = useState<'setup' | 'in_progress' | 'completed'>('setup');
  const [isGenerating, setIsGenerating] = useState(false);

  // Setup options
  const [sourceType, setSourceType] = useState<'topic' | 'notes' | 'file' | 'flashcards'>('topic');
  const [customText, setCustomText] = useState('');
  const [quizType, setQuizType] = useState<QuizType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [fileAttachment, setFileAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);

  // Active Quiz Data
  const [currentQuizTitle, setCurrentQuizTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [calculatedResult, setCalculatedResult] = useState<QuizResult | null>(null);
  const [quizGenError, setQuizGenError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFileAttachment({
        data: reader.result as string,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setQuizGenError(null);

    try {
      let promptText = customText.trim();
      if (sourceType === 'flashcards') {
        const studyData = loadStudyData();
        const cards = studyData.flashcards.filter((f) => f.subjectId === selectedSubject.id);
        promptText = `Create quiz questions based on these flashcard concepts:\n${cards
          .map((c) => `Q: ${c.front} | A: ${c.back}`)
          .join('\n')}`;
      }

      const res = await fetch(getApiUrl('/api/study/generate-quiz'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          text: promptText || undefined,
          attachment: fileAttachment,
          type: quizType,
          difficulty,
          questionCount,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentQuizTitle(data.title || `${selectedTopic?.name || selectedSubject.name} Quiz`);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizState('in_progress');
      } else {
        setQuizGenError(data.error || 'Could not generate quiz questions. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setQuizGenError('Error connecting with quiz generator. Please check your network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleFinishQuiz = () => {
    let correct = 0;
    const weakAreas: string[] = [];

    questions.forEach((q) => {
      const studentAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (studentAns === correctAns) {
        correct++;
      } else {
        // Collect concept/topic as needing review
        weakAreas.push(selectedTopic?.name || selectedSubject.name);
      }
    });

    const scorePct = Math.round((correct / questions.length) * 100);

    const result = saveQuizResult({
      quizTitle: currentQuizTitle,
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      difficulty,
      totalQuestions: questions.length,
      score: scorePct,
      correctCount: correct,
      incorrectCount: questions.length - correct,
      userAnswers,
      questions,
      weakAreas: Array.from(new Set(weakAreas)),
    });

    setCalculatedResult(result);
    setQuizState('completed');
    onRefreshData?.();
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-[#DFBA7F]" />
            <span>AI Quiz Mode</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Rigorous, non-revealing assessment for {selectedSubject.name}{' '}
            {selectedTopic ? `• ${selectedTopic.name}` : ''}
          </p>
        </div>

        {quizState !== 'setup' && (
          <button
            type="button"
            onClick={() => setQuizState('setup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isDark ? 'border-white/10 text-stone-300' : 'border-stone-300 text-stone-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Quiz</span>
          </button>
        )}
      </div>

      {/* SETUP VIEW */}
      {quizState === 'setup' && (
        <div
          className={`max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg ${
            isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#DFBA7F]" />
            <h3 className="text-base font-bold">Configure Quiz Parameters</h3>
          </div>
          <p className="text-xs text-stone-400 mb-6">
            Questions are generated to test active conceptual recall without early answer leakage.
          </p>

          <form onSubmit={handleGenerateQuiz} className="space-y-5">
            {/* Source selector */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                Generate From
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'topic' as const, label: 'Subject Topic' },
                  { id: 'notes' as const, label: 'Custom Text' },
                  { id: 'file' as const, label: 'PDF / Image' },
                  { id: 'flashcards' as const, label: 'Flashcards' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSourceType(s.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      sourceType === s.id
                        ? 'bg-[#C9A063] text-[#080A0E] border-[#C9A063]'
                        : isDark
                        ? 'border-white/10 text-stone-400 hover:text-stone-200'
                        : 'border-stone-200 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {sourceType === 'topic' && (
              <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-stone-300">
                Generating quiz based on:{' '}
                <strong>{selectedTopic?.name || selectedSubject.name}</strong>
              </div>
            )}

            {sourceType === 'notes' && (
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  Paste Study Notes or Text
                </label>
                <textarea
                  required
                  rows={4}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste lecture excerpts or textbook paragraphs to test..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>
            )}

            {sourceType === 'file' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-400 block">
                  Upload PDF or Textbook Worksheet Photo
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="text-xs text-stone-400"
                />
                {fileAttachment && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    Ready to analyze: {fileAttachment.name}
                  </div>
                )}
              </div>
            )}

            {/* Quiz Type & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                  Question Format
                </label>
                <select
                  aria-label="Select Quiz Question Format"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <option value="multiple_choice">Multiple Choice (4 Options)</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="mixed">Mixed Quiz Formats</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                  Difficulty Tier
                </label>
                <select
                  aria-label="Select Quiz Difficulty Tier"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <option value="easy">Easy (Foundations)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="hard">Hard (Rigorous)</option>
                  <option value="exam">Exam-Level (Challenging)</option>
                </select>
              </div>
            </div>

            {/* Question Count */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-400">Total Questions</span>
                <div className="flex items-center gap-1.5">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs ${
                        questionCount === num
                          ? 'bg-[#C9A063] text-[#080A0E] border-[#C9A063]'
                          : 'border-white/10 text-stone-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {quizGenError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {quizGenError}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm disabled:opacity-40 transition-opacity"
            >
              {isGenerating ? 'Generating Structured Quiz...' : 'Start Quiz Now'}
            </button>
          </form>
        </div>
      )}

      {/* IN PROGRESS VIEW */}
      {quizState === 'in_progress' && currentQ && (
        <div
          className={`max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg ${
            isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="font-bold text-[#DFBA7F]">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="capitalize">{difficulty} Difficulty</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-500/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4 mb-8">
            <h3 className="text-base sm:text-lg font-bold leading-relaxed">{currentQ.question}</h3>
          </div>

          {/* Options / Answer Input */}
          <div className="space-y-2.5 mb-8">
            {currentQ.options && currentQ.options.length > 0 ? (
              currentQ.options.map((option, idx) => {
                const isSelected = userAnswers[currentQ.id] === option;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAnswer(currentQ.id, option)}
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
                  value={userAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your concise answer..."
                  className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-medium rounded-xl text-stone-400 hover:text-stone-200 disabled:opacity-30"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                disabled={!userAnswers[currentQ.id]}
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C9A063] text-[#080A0E] disabled:opacity-40 transition-opacity"
              >
                Next Question
              </button>
            ) : (
              <button
                type="button"
                disabled={!userAnswers[currentQ.id]}
                onClick={handleFinishQuiz}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white disabled:opacity-40 transition-opacity shadow-sm"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED VIEW */}
      {quizState === 'completed' && calculatedResult && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Result Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border text-center ${
              isDark ? 'bg-[#0E131E] border-white/15' : 'bg-white border-stone-200'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-[#DFBA7F]/20 text-[#DFBA7F] flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-1">Quiz Completed</h3>
            <p className="text-xs text-stone-400 mb-6">{calculatedResult.quizTitle}</p>

            <div className="flex items-center justify-center gap-6 py-4 border-y border-white/10">
              <div>
                <span className="text-3xl font-extrabold text-[#DFBA7F] font-mono">
                  {calculatedResult.score}%
                </span>
                <p className="text-[10px] uppercase font-bold text-stone-400">Score</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {calculatedResult.correctCount}
                </span>
                <p className="text-[10px] uppercase font-bold text-stone-400">Correct</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="text-2xl font-bold text-red-400 font-mono">
                  {calculatedResult.incorrectCount}
                </span>
                <p className="text-[10px] uppercase font-bold text-stone-400">Mistakes</p>
              </div>
            </div>

            {calculatedResult.weakAreas.length > 0 && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <span className="font-bold">Topics Needing Review: </span>
                <span>{calculatedResult.weakAreas.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Breakdown of Every Question */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-300">Detailed Answer Review & Solutions</h4>
            {calculatedResult.questions.map((q, idx) => {
              const studentChoice = calculatedResult.userAnswers[q.id] || '(Unanswered)';
              const isCorrect =
                studentChoice.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-stone-400">Question {idx + 1}</span>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                        <XCircle className="w-4 h-4" />
                        <span>Needs Review</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-stone-100">{q.question}</p>

                  <div className="text-xs space-y-1">
                    <p className="text-stone-400">
                      Your answer:{' '}
                      <strong className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {studentChoice}
                      </strong>
                    </p>
                    {!isCorrect && (
                      <p className="text-stone-300">
                        Correct answer: <strong className="text-emerald-400">{q.correctAnswer}</strong>
                      </p>
                    )}
                  </div>

                  {/* Explanation Callout */}
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      isDark ? 'bg-black/30 text-stone-300' : 'bg-white/80 text-stone-800'
                    }`}
                  >
                    <strong className="text-[#DFBA7F] block mb-1">Why:</strong>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
