import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  GraduationCap,
  Sparkles,
  Send,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { updateTopicMastery, recordStudyActivity } from '../../utils/studyStorage';
import { Skeleton } from '../SkeletonLoaders';

interface TeachMeViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

interface SocraticTurn {
  id: string;
  role: 'tutor' | 'student';
  text: string;
}

export const TeachMeView: React.FC<TeachMeViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [concept, setConcept] = useState(selectedTopic?.name || '');
  const [sessionActive, setSessionActive] = useState(false);
  const [turns, setTurns] = useState<SocraticTurn[]>([]);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [isMastered, setIsMastered] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isLoading]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setIsLoading(true);
    setSessionActive(true);
    setTurns([]);
    setTurnCount(0);
    setIsMastered(false);

    try {
      const res = await fetch('/api/study/teach-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept.trim(),
          history: [],
          studentAnswer: '',
          subject: selectedSubject.name,
        }),
      });

      const data = await res.json();
      setTurns([
        {
          id: `tutor-init-${Date.now()}`,
          role: 'tutor',
          text: data.reply || `Let's explore ${concept}. To start, what is your initial thought or intuition on how it works?`,
        },
      ]);
      setTurnCount(1);
    } catch (err) {
      console.error(err);
      setTurns([
        {
          id: `tutor-init-${Date.now()}`,
          role: 'tutor',
          text: `Welcome! Let's explore "${concept}". In your own words, how would you describe what this concept means or why it matters?`,
        },
      ]);
      setTurnCount(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || isLoading) return;

    const studentTurn: SocraticTurn = {
      id: `student-${Date.now()}`,
      role: 'student',
      text: inputAnswer.trim(),
    };

    setTurns((prev) => [...prev, studentTurn]);
    const answerToSend = inputAnswer.trim();
    setInputAnswer('');
    setIsLoading(true);

    try {
      const historyPayload = turns.map((t) => ({
        role: (t.role === 'student' ? 'user' : 'model') as 'user' | 'model',
        text: t.text,
      }));

      const res = await fetch('/api/study/teach-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          history: historyPayload,
          studentAnswer: answerToSend,
          subject: selectedSubject.name,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Great thought! Now consider: what happens next in this process?';

      setTurns((prev) => [
        ...prev,
        {
          id: `tutor-${Date.now()}`,
          role: 'tutor',
          text: reply,
        },
      ]);
      setTurnCount((prev) => prev + 1);

      // If several turns completed, mark topic as learning or mastered
      if (turnCount >= 4 && selectedTopic) {
        updateTopicMastery(selectedTopic.id, 'learning');
      }
    } catch (err) {
      console.error(err);
      setTurns((prev) => [
        ...prev,
        {
          id: `tutor-err-${Date.now()}`,
          role: 'tutor',
          text: `Insightful perspective. Let's explore further: What real-world example or core scenario best illustrates this principle in action?`,
        },
      ]);
      setTurnCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkMastered = () => {
    if (selectedTopic) {
      updateTopicMastery(selectedTopic.id, 'understood');
    }
    setIsMastered(true);
    recordStudyActivity(
      'explain',
      `Mastered through Socratic Dialogue: ${concept}`,
      `Completed interactive Teach Me cycle in ${selectedSubject.name}`,
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
            <GraduationCap className="w-5 h-5 text-[#DFBA7F]" />
            <span>Teach Me Mode</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Active Socratic dialogue: the AI guides you to discovery with targeted questions.
          </p>
        </div>

        {sessionActive && (
          <button
            type="button"
            onClick={() => setSessionActive(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isDark ? 'border-white/10 text-stone-300' : 'border-stone-300 text-stone-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Concept</span>
          </button>
        )}
      </div>

      {!sessionActive ? (
        /* Setup / Concept selection */
        <div
          className={`max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg text-center ${
            isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#DFBA7F]/15 text-[#DFBA7F] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold mb-1">What would you like to master?</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto mb-6">
            Instead of giving you a long lecture, the AI tutor will ask you questions step-by-step
            so you develop genuine, lasting understanding.
          </p>

          <form onSubmit={handleStartSession} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                Concept or Topic in {selectedSubject.name}
              </label>
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Mitochondria & ATP, Limit Definition of Derivative, Supply Elasticity..."
                className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border outline-none ${
                  isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !concept.trim()}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm disabled:opacity-40"
            >
              {isLoading ? 'Preparing Socratic Lesson...' : 'Begin Active Learning'}
            </button>
          </form>
        </div>
      ) : (
        /* Interactive Socratic Dialogue */
        <div
          className={`max-w-3xl mx-auto rounded-3xl border flex flex-col h-[70vh] overflow-hidden shadow-lg ${
            isDark ? 'bg-[#0A0D14] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          {/* Top session bar */}
          <div
            className={`px-6 py-3 border-b flex items-center justify-between text-xs ${
              isDark ? 'bg-[#0E131E] border-white/10' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#DFBA7F]">{concept}</span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-400">Step {turnCount}</span>
            </div>

            {!isMastered ? (
              <button
                type="button"
                onClick={handleMarkMastered}
                className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] hover:bg-emerald-500/25 transition-colors"
              >
                ✓ I&apos;ve Mastered This!
              </button>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Concept Mastered</span>
              </span>
            )}
          </div>

          {/* Dialogue Turns */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex gap-3 max-w-2xl ${
                  turn.role === 'student' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {turn.role === 'tutor' && (
                  <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    turn.role === 'student'
                      ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-medium rounded-tr-none'
                      : isDark
                      ? 'bg-[#121826] border border-white/10 text-stone-100 rounded-tl-none'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                </div>

                {turn.role === 'student' && (
                  <div className="w-8 h-8 rounded-xl bg-stone-700/40 border border-white/10 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-xl mr-auto w-full animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] shrink-0">
                  <Bot className="w-4 h-4 text-[#DFBA7F]" />
                </div>
                <div
                  className={`p-4 rounded-2xl rounded-tl-none border text-xs flex-1 space-y-2.5 ${
                    isDark ? 'bg-[#121826] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#DFBA7F]">Tutor is evaluating...</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA7F] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                  <Skeleton className="h-3.5 w-[90%] rounded-md" isDark={isDark} />
                  <Skeleton className="h-3.5 w-[75%] rounded-md" isDark={isDark} />
                  <Skeleton className="h-3.5 w-[50%] rounded-md" isDark={isDark} />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Student Response Form */}
          <div
            className={`p-4 border-t ${
              isDark ? 'bg-[#0E131E] border-white/10' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <form onSubmit={handleSendAnswer} className="flex items-center gap-2">
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Type your response to the tutor's question..."
                className={`flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm border outline-none ${
                  isDark
                    ? 'bg-[#141B2B] border-white/10 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputAnswer.trim()}
                className="p-3 rounded-xl bg-[#C9A063] text-[#080A0E] font-semibold disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
