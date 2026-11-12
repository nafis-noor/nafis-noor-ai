import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  ArrowRight,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import { ARABIC_READING_CURRICULUM } from '../../data/arabicCurriculum';
import { ArabicReadingPassage } from '../../types/arabic';
import { speakArabic, playChimeSound } from '../../utils/arabicSpeech';

interface ReadingViewProps {
  isDark: boolean;
  language?: string;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ isDark, language }) => {
  const [selectedPassage, setSelectedPassage] = useState<ArabicReadingPassage>(
    ARABIC_READING_CURRICULUM[0]
  );
  const [showTashkeel, setShowTashkeel] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  } | null>(null);

  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, boolean>>({});

  const handlePlayPassageAudio = () => {
    speakArabic(selectedPassage.arabicTashkeel || selectedPassage.arabicText, { rate: 0.8 });
  };

  const vocabList = (selectedPassage.vocabularyHighlights || []) as Array<{
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  }>;

  const questionsList = selectedPassage.questions || selectedPassage.comprehensionQuestions || [];

  const handleSelectWord = (wordObj: {
    arabic: string;
    english: string;
    root?: string;
    grammar?: string;
  }) => {
    setSelectedWord(wordObj);
    speakArabic(wordObj.arabic);
  };

  const handleAnswerQuestion = (qId: string, optIdx: number, correctIdx: number) => {
    const isCorrect = optIdx === correctIdx;
    if (isCorrect) {
      playChimeSound('success');
    } else {
      playChimeSound('hint');
    }
    setQuestionAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setQuestionFeedback(prev => ({ ...prev, [qId]: isCorrect }));
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
                <BookOpen className="w-3.5 h-3.5" />
                Arabic Reading Academy
              </span>
              <span className="text-xs text-stone-500">Graded Passages (Levels 1 to 4)</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Progressive Arabic Reading & Comprehension
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Read classical and modern Arabic texts. Toggle vowel markings (Tashkeel), tap words for morphology & roots, and verify your comprehension.
            </p>
          </div>

          {/* Controls: Tashkeel toggle & Audio */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTashkeel(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                showTashkeel
                  ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F]'
                  : 'border-stone-500/20 bg-stone-500/10 text-stone-400'
              }`}
            >
              <span>{showTashkeel ? 'Vowels ON (مُشَكَّل)' : 'Vowels OFF (غَيْر مُشَكَّل)'}</span>
            </button>

            <button
              onClick={handlePlayPassageAudio}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] text-xs font-semibold flex items-center gap-1.5 shadow-md hover:opacity-90"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen to Passage</span>
            </button>
          </div>
        </div>

        {/* Level Passages Ribbon */}
        <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-white/5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ARABIC_READING_CURRICULUM.map(passage => {
            const isSelected = passage.id === selectedPassage.id;
            return (
              <button
                key={passage.id}
                onClick={() => {
                  setSelectedPassage(passage);
                  setSelectedWord(null);
                  setQuestionAnswers({});
                  setQuestionFeedback({});
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex-shrink-0 transition-all ${
                  isSelected
                    ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F] shadow-xs'
                    : isDark
                    ? 'border-white/5 bg-white/5 text-stone-400 hover:text-stone-200'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>Level {passage.level}: {passage.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Passage Text Column */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className={`p-7 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                  {selectedPassage.title}
                </h3>
                <span className="text-xs text-[#DFBA7F] font-serif">{selectedPassage.arabicTitle}</span>
              </div>
              <span className="text-xs text-stone-500">Tap any word to inspect</span>
            </div>

            {/* Arabic Reading Body */}
            <div className="p-6 rounded-2xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 mb-6">
              <p
                dir="rtl"
                className="text-2xl md:text-3xl font-serif text-stone-100 leading-[2.2] tracking-wide select-text text-right"
              >
                {(showTashkeel
                  ? selectedPassage.arabicTashkeel || selectedPassage.arabicText
                  : selectedPassage.arabicPlain ||
                    (selectedPassage.arabicTashkeel || selectedPassage.arabicText).replace(
                      /[\u064B-\u065F\u0670]/g,
                      ''
                    )
                )
                  .split(' ')
                  .map((word, wIdx) => {
                    const cleanWord = word.replace(/[.,،؛!?]/g, '');
                    const matchingVocab = vocabList.find(
                      v =>
                        cleanWord.includes(v.arabic.replace(/[.,،؛!?]/g, '')) ||
                        v.arabic.replace(/[.,،؛!?]/g, '').includes(cleanWord)
                    );

                    return (
                      <span
                        key={wIdx}
                        onClick={() => {
                          if (matchingVocab) {
                            handleSelectWord(matchingVocab);
                          } else {
                            handleSelectWord({
                              arabic: word,
                              english: 'Click to pronounce or analyze',
                            });
                          }
                        }}
                        className="cursor-pointer mx-1 hover:text-[#DFBA7F] hover:bg-[#C9A063]/15 px-1 py-0.5 rounded-lg transition-colors inline-block"
                        title="Click to analyze"
                      >
                        {word}
                      </span>
                    );
                  })}
              </p>
            </div>

            {/* English Translation Toggle */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-400">English Translation:</span>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed italic bg-stone-500/5 p-4 rounded-xl border border-stone-200/30 dark:border-white/5">
                "{selectedPassage.englishTranslation}"
              </p>
            </div>

            {/* Comprehension Questions */}
            <div className="mt-8 pt-6 border-t border-stone-200/50 dark:border-white/5 space-y-5">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#C9A063]" />
                <span>Comprehension Questions</span>
              </h4>

              {questionsList.map((q, qIdx) => {
                const userSelected = questionAnswers[q.id];
                const isAnswered = userSelected !== undefined;
                const isCorrect = questionFeedback[q.id];

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-stone-200/50 dark:border-white/5 bg-stone-500/5 space-y-3"
                  >
                    <p className="text-sm font-semibold text-stone-200">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = isDark
                          ? 'bg-stone-900/60 border-white/5 text-stone-300 hover:bg-white/10'
                          : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100';

                        if (isAnswered) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold';
                          } else if (userSelected === optIdx) {
                            btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswerQuestion(q.id, optIdx, q.correctIndex)}
                            disabled={isAnswered}
                            className={`p-3 rounded-xl border text-xs text-left transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <span className="font-semibold block mb-0.5">
                          {isCorrect ? 'Correct!' : 'Incorrect.'}
                        </span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Word Inspector & Root Analysis Column */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-[#C9A063]" />
              <span>Linguistic & Root Inspector</span>
            </h4>

            {selectedWord ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-stone-500/10 border border-white/5">
                  <span className="text-4xl font-serif text-[#DFBA7F] block mb-1">
                    {selectedWord.arabic}
                  </span>
                  <button
                    onClick={() => speakArabic(selectedWord.arabic)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C9A063]/20 text-[#DFBA7F] text-xs font-semibold mt-2"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Pronounce</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-stone-500">Meaning:</span>
                    <span className="text-stone-200 font-semibold">{selectedWord.english}</span>
                  </div>

                  {selectedWord.root && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-stone-500">Tri-literal Root (الجذر):</span>
                      <span className="text-[#DFBA7F] font-serif font-bold text-sm">
                        {selectedWord.root}
                      </span>
                    </div>
                  )}

                  {selectedWord.grammar && (
                    <div className="py-1.5">
                      <span className="text-stone-500 block mb-1">Morphology & Grammar:</span>
                      <p className="text-stone-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        {selectedWord.grammar}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-500 space-y-2">
                <p className="text-xs">Click or tap any Arabic word in the reading passage to inspect its root, grammar function, and sound.</p>
              </div>
            )}
          </div>

          {/* Key Vocabulary from this Passage */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#101318] border-white/5 shadow-md' : 'bg-white border-stone-200 shadow-sm'
            }`}
          >
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A063]" />
              <span>Vocabulary in this Passage</span>
            </h4>

            <div className="space-y-2">
              {vocabList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectWord(item)}
                  className="p-2.5 rounded-xl bg-stone-500/5 hover:bg-stone-500/10 border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-sm font-serif text-[#DFBA7F] block">{item.arabic}</span>
                    <span className="text-[11px] text-stone-400">{item.english}</span>
                  </div>
                  {item.root && (
                    <span className="text-xs font-serif text-stone-400 bg-white/5 px-2 py-0.5 rounded-md">
                      {item.root}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
