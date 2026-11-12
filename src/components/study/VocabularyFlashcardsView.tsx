import React, { useState } from 'react';
import {
  Layers,
  Volume2,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Search,
  BookMarked,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ARABIC_VOCABULARY_BANK, FLASHCARD_DECKS } from '../../data/arabicCurriculum';
import { ArabicVocabularyWord } from '../../types/arabic';
import { speakArabic } from '../../utils/arabicSpeech';
import { markWordPracticed, flagWeakVocabulary } from '../../utils/arabicStorage';

interface VocabularyFlashcardsViewProps {
  isDark: boolean;
  language?: string;
}

export const VocabularyFlashcardsView: React.FC<VocabularyFlashcardsViewProps> = ({ isDark, language }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'flashcards'>('flashcards');

  // Flashcards state
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsReviewed, setCardsReviewed] = useState<Record<string, 'easy' | 'hard' | 'again'>>({});

  // Vocabulary bank state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWordType, setSelectedWordType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentDeck = FLASHCARD_DECKS[currentDeckIndex];
  const currentCard = currentDeck?.cards[cardIndex % (currentDeck?.cards.length || 1)];

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleCardRate = (rating: 'easy' | 'hard' | 'again') => {
    if (!currentCard) return;
    setCardsReviewed(prev => ({ ...prev, [currentCard.id]: rating }));

    if (rating === 'easy') {
      markWordPracticed(currentCard.id, true);
    } else {
      flagWeakVocabulary(currentCard.id);
    }

    setIsFlipped(false);
    setCardIndex(prev => prev + 1);
  };

  // Filtered Vocab Bank
  const filteredWords = ARABIC_VOCABULARY_BANK.filter(w => {
    const matchesCat = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesType = selectedWordType === 'all' || w.grammarCategory === selectedWordType;
    const matchesSearch =
      !searchQuery ||
      w.arabic.includes(searchQuery) ||
      w.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.root && w.root.includes(searchQuery));
    return matchesCat && matchesType && matchesSearch;
  });

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
                <BookMarked className="w-3.5 h-3.5" />
                Arabic Lexicon & Memory
              </span>
              <span className="text-xs text-stone-500">Root-based System with Audio</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Vocabulary & Smart Flashcards
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Review words by tri-literal roots, plurals, and contextual sentences, or train spaced recall with interactive flipcards.
            </p>
          </div>

          {/* Mode Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-stone-100 border-stone-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Smart Flashcards
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bank'
                  ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Vocabulary Bank
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Smart Flashcards */}
      {activeTab === 'flashcards' && currentCard && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Deck selector ribbon */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
            {FLASHCARD_DECKS.map((deck, dIdx) => (
              <button
                key={deck.id}
                onClick={() => {
                  setCurrentDeckIndex(dIdx);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  currentDeckIndex === dIdx
                    ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F]'
                    : isDark
                    ? 'border-white/5 bg-white/5 text-stone-400 hover:text-stone-200'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {deck.title}
              </button>
            ))}
          </div>

          {/* Flashcard Box */}
          <div
            onClick={handleFlip}
            className={`cursor-pointer min-h-[340px] p-8 rounded-3xl border flex flex-col items-center justify-between text-center transition-all transform select-none relative ${
              isDark
                ? 'bg-[#101318] border-white/5 shadow-2xl hover:border-white/10'
                : 'bg-white border-stone-200 shadow-lg hover:border-stone-300'
            }`}
          >
            <div className="w-full flex items-center justify-between text-xs text-stone-500">
              <span>Card {(cardIndex % currentDeck.cards.length) + 1} of {currentDeck.cards.length}</span>
              <span className="flex items-center gap-1 text-[#DFBA7F]">
                <RotateCw className="w-3 h-3" />
                <span>Tap card to flip</span>
              </span>
            </div>

            {!isFlipped ? (
              /* Front of Card: Arabic Prompt */
              <div className="my-auto space-y-4">
                <span className="text-5xl md:text-6xl font-serif text-[#DFBA7F] font-bold block select-text">
                  {currentCard.frontArabic}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakArabic(currentCard.frontArabic);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 text-xs font-semibold hover:bg-[#C9A063]/25"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              </div>
            ) : (
              /* Back of Card: English & Linguistic breakdown */
              <div className="my-auto space-y-3">
                <span className="text-3xl font-serif text-[#DFBA7F] block">
                  {currentCard.frontArabic}
                </span>
                <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {currentCard.backEnglish}
                </p>
                {currentCard.root && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-stone-500/10 text-[#DFBA7F] text-xs font-serif">
                    Root: {currentCard.root}
                  </span>
                )}
                {currentCard.exampleSentence && (
                  <p className="text-xs text-stone-400 font-serif italic max-w-sm mx-auto">
                    "{currentCard.exampleSentence}"
                  </p>
                )}
              </div>
            )}

            <div className="text-[11px] text-stone-500 w-full text-center border-t border-stone-200/40 dark:border-white/5 pt-3">
              {isFlipped ? 'How well did you know this word?' : 'Think of the meaning, then tap to check'}
            </div>
          </div>

          {/* Spaced Repetition Rating Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleCardRate('again')}
              className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all flex flex-col items-center gap-1"
            >
              <span>Hard / Again</span>
              <span className="text-[10px] text-rose-400/80">Review soon</span>
            </button>

            <button
              onClick={() => handleCardRate('hard')}
              className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all flex flex-col items-center gap-1"
            >
              <span>Medium</span>
              <span className="text-[10px] text-amber-400/80">Recall OK</span>
            </button>

            <button
              onClick={() => handleCardRate('easy')}
              className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all flex flex-col items-center gap-1"
            >
              <span>Easy / Mastered</span>
              <span className="text-[10px] text-emerald-400/80">Known well</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Full Vocabulary Bank */}
      {activeTab === 'bank' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Arabic, English meaning, or root..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                  isDark
                    ? 'bg-[#101318] border-white/10 text-stone-100 placeholder-stone-500'
                    : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-[#101318] border-white/10 text-stone-200'
                    : 'bg-white border-stone-200 text-stone-800'
                }`}
              >
                <option value="all">All Categories</option>
                <option value="greetings">Greetings & Etiquette</option>
                <option value="family">Family (الأسرة)</option>
                <option value="daily_life">Daily Life & Objects</option>
                <option value="verbs">Essential Verbs</option>
                <option value="education">Education & Knowledge</option>
              </select>

              <select
                value={selectedWordType}
                onChange={e => setSelectedWordType(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-[#101318] border-white/10 text-stone-200'
                    : 'bg-white border-stone-200 text-stone-800'
                }`}
              >
                <option value="all">All Parts of Speech</option>
                <option value="noun">Nouns (اسم)</option>
                <option value="verb">Verbs (فعل)</option>
                <option value="particle">Particles (حرف)</option>
              </select>
            </div>
          </div>

          {/* Words Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className={`p-5 rounded-2xl border space-y-3 transition-all ${
                  isDark
                    ? 'bg-[#101318] border-white/5 hover:border-white/10'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl font-serif text-[#DFBA7F] block">
                      {word.arabic}
                    </span>
                    <span className="text-xs text-stone-400 font-sans italic">
                      {word.transliteration}
                    </span>
                  </div>
                  <button
                    onClick={() => speakArabic(word.arabic)}
                    className="p-2 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] hover:bg-[#C9A063]/25 transition-colors"
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-stone-300 font-semibold">
                    <span>Meaning:</span>
                    <span>{word.english}</span>
                  </div>

                  {word.plural && (
                    <div className="flex justify-between text-stone-400">
                      <span>Plural (جمع):</span>
                      <span className="font-serif text-[#DFBA7F]">{word.plural}</span>
                    </div>
                  )}

                  {word.root && (
                    <div className="flex justify-between text-stone-400">
                      <span>Root (الجذر):</span>
                      <span className="font-serif text-[#DFBA7F]">{word.root}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-stone-500/5 border border-stone-200/30 dark:border-white/5 text-[11px] text-stone-400 space-y-0.5">
                  <span className="text-stone-500 block">Example Context:</span>
                  <p className="font-serif text-stone-200 text-right">
                    {typeof word.exampleSentence === 'string'
                      ? word.exampleSentence
                      : word.exampleSentence?.arabic}
                  </p>
                  <p className="text-stone-400 italic">
                    {word.exampleTranslation ||
                      (typeof word.exampleSentence !== 'string'
                        ? word.exampleSentence?.english
                        : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
