import React, { useState } from 'react';
import {
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Headphones,
  Gauge,
  Ear,
} from 'lucide-react';
import { speakArabic, playChimeSound } from '../../utils/arabicSpeech';

interface ListeningViewProps {
  isDark: boolean;
  language?: string;
}

type ListeningCategory =
  | 'letter_sounds'
  | 'words'
  | 'sentences'
  | 'missing_words'
  | 'listening_memory';

interface ListeningQuestion {
  id: string;
  category: ListeningCategory;
  level: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  audioPrompt: string;
  slowAudioPrompt?: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LISTENING_QUESTIONS: ListeningQuestion[] = [
  {
    id: 'lq-1-throat-sound',
    category: 'letter_sounds',
    level: 'beginner',
    title: 'Pharyngeal Sound Discrimination (ح vs هـ)',
    audioPrompt: 'حَبِيب',
    questionText: 'Which letter produces the initial deep throat sound you just heard?',
    options: ['ح (Haa - deep throat friction)', 'هـ (Haa - soft chest breath)', 'خ (Khaa - scraping sound)', 'ع (Ayn)'],
    correctIndex: 0,
    explanation: 'The word spoken was "حَبِيب" (ḥabīb), which begins with the deep pharyngeal unpointed Haa (ح).',
  },
  {
    id: 'lq-2-word-meaning',
    category: 'words',
    level: 'beginner',
    title: 'Word Identification & Meaning',
    audioPrompt: 'مَدْرَسَة',
    questionText: 'Listen to the spoken Arabic word. What does it mean in English?',
    options: ['School', 'Hospital', 'Library', 'Airport'],
    correctIndex: 0,
    explanation: 'The word is "مَدْرَسَة" (madrasah), which means school.',
  },
  {
    id: 'lq-3-missing-word',
    category: 'missing_words',
    level: 'intermediate',
    title: 'Fill-in-the-Blank Acoustic Cloze',
    audioPrompt: 'كَتَبَ الطَّالِبُ الدَّرْسَ بِالقَلَمِ',
    questionText: 'You heard: "كَتَبَ الطَّالِبُ الدَّرْسَ بِـ _____". Which instrument was mentioned?',
    options: ['القَلَمِ (al-qalam - with the pen)', 'الكِتَابِ (al-kitāb - with the book)', 'الدَّفْتَرِ (ad-daftar - with the notebook)', 'المِسْطَرَةِ (al-misṭarah - with the ruler)'],
    correctIndex: 0,
    explanation: 'The speaker finished with "بِالقَلَمِ" (with the pen).',
  },
  {
    id: 'lq-4-sentence-meaning',
    category: 'sentences',
    level: 'intermediate',
    title: 'Sentence Comprehension',
    audioPrompt: 'ذَهَبَ أَبِي إِلَى المَسْجِدِ لِصَلَاةِ الفَجْرِ',
    questionText: 'According to the sentence you heard, where did the father go and why?',
    options: [
      'To the mosque for Fajr prayer',
      'To the market to buy fruit',
      'To school to teach students',
      'To the library to read books',
    ],
    correctIndex: 0,
    explanation: 'The sentence states: "ذَهَبَ أَبِي إِلَى المَسْجِدِ لِصَلَاةِ الفَجْرِ" (My father went to the mosque for Fajr prayer).',
  },
  {
    id: 'lq-5-listening-memory',
    category: 'listening_memory',
    level: 'intermediate',
    title: 'Acoustic Memory Sequence',
    audioPrompt: 'شَمْس ... قَمَر ... نُور',
    questionText: 'Listen to the sequence of 3 words. Which word was spoken in the SECOND position?',
    options: ['قَمَر (Moon)', 'شَمْس (Sun)', 'نُور (Light)', 'سَمَاء (Sky)'],
    correctIndex: 0,
    explanation: 'The sequence was: 1. شَمْس (Sun), 2. قَمَر (Moon), 3. نُور (Light). The second word was قَمَر.',
  },
];

export const ListeningView: React.FC<ListeningViewProps> = ({ isDark, language }) => {
  const [selectedCategory, setSelectedCategory] = useState<ListeningCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [isSlow, setIsSlow] = useState(false);

  const filteredQuestions = LISTENING_QUESTIONS.filter(
    q => selectedCategory === 'all' || q.category === selectedCategory
  );

  const currentQ = filteredQuestions[currentIndex % filteredQuestions.length];

  const handlePlayAudio = (rate = isSlow ? 0.6 : 0.85) => {
    speakArabic(currentQ.audioPrompt, { rate });
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      playChimeSound('success');
    } else {
      playChimeSound('hint');
    }
    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(prev => prev + 1);
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
                <Ear className="w-3.5 h-3.5" />
                Arabic Listening Center
              </span>
              <span className="text-xs text-stone-500">Acoustic Discrimination & Memory</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Listen & Comprehend Arabic
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Train your ear to distinguish subtle throat letters, recognize vocab by sound, identify missing words, and develop listening memory.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Exercises' },
              { id: 'letter_sounds', label: 'Letter Sounds' },
              { id: 'words', label: 'Vocabulary' },
              { id: 'sentences', label: 'Sentences' },
              { id: 'missing_words', label: 'Missing Words' },
              { id: 'listening_memory', label: 'Memory' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as any);
                  setCurrentIndex(0);
                  setIsAnswered(false);
                  setSelectedOption(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedCategory === cat.id
                    ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F]'
                    : isDark
                    ? 'border-white/5 bg-white/5 text-stone-400 hover:text-stone-200'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Exercise Card */}
      <div
        className={`max-w-2xl mx-auto p-7 rounded-2xl border text-center space-y-6 ${
          isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Question {currentIndex + 1} of {filteredQuestions.length}</span>
          <span className="px-2 py-0.5 rounded-md bg-[#C9A063]/15 text-[#DFBA7F] font-semibold uppercase text-[10px]">
            {currentQ.level}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {currentQ.title}
          </h3>
          <p className="text-sm text-stone-400">{currentQ.questionText}</p>
        </div>

        {/* Big Audio Play Button */}
        <div className="py-4 flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => handlePlayAudio()}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#DFBA7F] to-[#C9A063] text-[#080A0E] flex items-center justify-center shadow-lg hover:scale-105 transition-transform group"
            title="Listen to Arabic Audio"
          >
            <Volume2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePlayAudio(0.85)}
              className="text-xs font-semibold text-stone-400 hover:text-[#DFBA7F] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Normal Speed (1.0x)</span>
            </button>
            <span className="text-stone-600">•</span>
            <button
              onClick={() => handlePlayAudio(0.6)}
              className="text-xs font-semibold text-stone-400 hover:text-[#DFBA7F] flex items-center gap-1"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Slow Pace (0.6x)</span>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            let btnStyle = isDark
              ? 'bg-stone-900/60 border-white/5 text-stone-200 hover:bg-white/10'
              : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Answer Feedback */}
        {isAnswered && (
          <div
            className={`p-4 rounded-2xl border text-left text-xs space-y-3 ${
              selectedOption === currentQ.correctIndex
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {selectedOption === currentQ.correctIndex ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correctly Identified!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Let's listen again and analyze:</span>
                </>
              )}
            </div>
            <p className="text-stone-300">{currentQ.explanation}</p>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-semibold text-xs flex items-center gap-1.5 ml-auto"
            >
              <span>Next Exercise</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="text-xs text-stone-500 pt-2 border-t border-stone-200/40 dark:border-white/5 flex items-center justify-between">
          <span>Actual listening accuracy:</span>
          <span className="font-semibold text-stone-300">
            {sessionScore.total > 0
              ? `${Math.round((sessionScore.correct / sessionScore.total) * 100)}% (${sessionScore.correct}/${sessionScore.total})`
              : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};
