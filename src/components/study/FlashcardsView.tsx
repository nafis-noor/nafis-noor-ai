import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Shuffle,
  FileText,
  Upload,
  ArrowRight,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Subject, Topic, Flashcard, FlashcardRating } from '../../types/study';
import {
  saveFlashcard,
  saveBatchFlashcards,
  deleteFlashcard,
  rateFlashcard,
  loadStudyData,
} from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface FlashcardsViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

type StudyFilterMode = 'review' | 'difficult' | 'random' | 'recent' | 'manage';

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [filterMode, setFilterMode] = useState<StudyFilterMode>('review');
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Add Form State
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');

  // AI Gen Form State
  const [aiSourceMode, setAiSourceMode] = useState<'topic' | 'text' | 'file'>('topic');
  const [aiTextPrompt, setAiTextPrompt] = useState('');
  const [aiCardCount, setAiCardCount] = useState(5);
  const [aiFileAttachment, setAiFileAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load latest cards from storage
  const [allCards, setAllCards] = useState<Flashcard[]>(() => {
    return loadStudyData().flashcards;
  });

  const reloadCards = () => {
    const updated = loadStudyData().flashcards;
    setAllCards(updated);
    onRefreshData?.();
  };

  // Filter cards by subject and topic
  const subjectCards = useMemo(() => {
    return allCards.filter((c) => {
      if (c.subjectId !== selectedSubject.id) return false;
      if (selectedTopic && c.topicId && c.topicId !== selectedTopic.id) return false;
      return true;
    });
  }, [allCards, selectedSubject.id, selectedTopic]);

  // Apply active deck mode
  const activeDeck = useMemo(() => {
    if (filterMode === 'difficult') {
      return subjectCards.filter((c) => c.difficulty === 'again' || c.difficulty === 'hard');
    }
    if (filterMode === 'recent') {
      return [...subjectCards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (filterMode === 'random') {
      return [...subjectCards].sort(() => Math.random() - 0.5);
    }
    // 'review' mode: cards due or not yet reviewed
    return subjectCards;
  }, [subjectCards, filterMode]);

  const currentCard = activeDeck[currentIndex];

  const handleRate = (rating: FlashcardRating) => {
    if (!currentCard) return;
    rateFlashcard(currentCard.id, rating);
    reloadCards();
    setIsFlipped(false);
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFront.trim() || !manualBack.trim()) return;

    saveFlashcard({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      front: manualFront.trim(),
      back: manualBack.trim(),
    });

    setManualFront('');
    setManualBack('');
    setShowAddModal(false);
    reloadCards();
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch(getApiUrl('/api/study/generate-flashcards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          text: aiTextPrompt.trim() || undefined,
          attachment: aiFileAttachment,
          count: aiCardCount,
        }),
      });

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        saveBatchFlashcards(
          data.flashcards.map((fc: { front: string; back: string }) => ({
            front: fc.front,
            back: fc.back,
            subjectId: selectedSubject.id,
            topicId: selectedTopic?.id,
          }))
        );
        reloadCards();
        setShowGenerateModal(false);
        setAiTextPrompt('');
        setAiFileAttachment(null);
      } else {
        setGenerateError(data.error || 'No flashcards generated. Please try a different prompt.');
      }
    } catch (err) {
      console.error(err);
      setGenerateError('Failed to connect to flashcard generator. Please check your network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAiFileAttachment({
        data: reader.result as string,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Deck Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#DFBA7F]" />
            <span>Flashcards</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Spaced repetition mastery for {selectedSubject.name}{' '}
            {selectedTopic ? `• ${selectedTopic.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-white/10 hover:border-white/20 text-stone-200 bg-[#121724]'
                : 'border-stone-300 hover:border-stone-400 text-stone-800 bg-white shadow-xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm hover:opacity-95 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generate</span>
          </button>
        </div>
      </div>

      {/* Mode Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'review' as StudyFilterMode, label: 'Review Deck', icon: Layers },
          { id: 'difficult' as StudyFilterMode, label: 'Difficult Cards', icon: AlertCircle },
          { id: 'random' as StudyFilterMode, label: 'Random Shuffle', icon: Shuffle },
          { id: 'recent' as StudyFilterMode, label: 'Recently Created', icon: Clock },
          { id: 'manage' as StudyFilterMode, label: 'Manage All Cards', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterMode(tab.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium shrink-0 transition-all ${
                isActive
                  ? 'bg-[#C9A063] text-[#080A0E] font-bold shadow-xs'
                  : isDark
                  ? 'bg-[#121722] text-stone-400 hover:text-stone-200 border border-white/10'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'difficult' && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 font-mono">
                  {
                    subjectCards.filter(
                      (c) => c.difficulty === 'again' || c.difficulty === 'hard'
                    ).length
                  }
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Flashcard Study View */}
      {filterMode !== 'manage' ? (
        activeDeck.length === 0 ? (
          <div
            className={`p-12 text-center rounded-3xl border ${
              isDark ? 'bg-[#0D1220] border-white/10' : 'bg-white border-stone-200'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#C9A063]/15 text-[#DFBA7F] flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-1">No Flashcards in this Deck</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto mb-4">
              {filterMode === 'difficult'
                ? 'No cards are marked as difficult. Great job retaining this material!'
                : 'Create cards manually or let AI generate active-recall cards from your study notes or textbook.'}
            </p>
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#C9A063] text-[#080A0E]"
            >
              Generate Cards with AI
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Progress / Remaining stats */}
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>
                Card <strong className="text-stone-200 font-mono">{currentIndex + 1}</strong> of{' '}
                <span className="font-mono">{activeDeck.length}</span>
              </span>
              <span className="font-mono">
                {activeDeck.length - (currentIndex + 1)} remaining in session
              </span>
            </div>

            {/* The Flashcard (Interactive Flip) */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative min-h-[320px] sm:min-h-[360px] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer border shadow-lg transition-all duration-300 select-none ${
                isDark
                  ? 'bg-gradient-to-b from-[#111728] to-[#0A0E18] border-white/15 hover:border-[#DFBA7F]/40 text-stone-100'
                  : 'bg-white border-stone-300 hover:border-[#C9A063]/60 text-stone-900'
              }`}
            >
              {/* Badge indicating Front / Back */}
              <div className="absolute top-5 left-5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-stone-500/15 text-stone-400">
                {isFlipped ? 'Answer / Explanation' : 'Question / Concept'}
              </div>

              {/* Tap to flip hint */}
              <div className="absolute top-5 right-5 flex items-center gap-1 text-[11px] text-stone-400">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap to flip</span>
              </div>

              {/* Card Content */}
              <div className="space-y-4 max-w-lg">
                {!isFlipped ? (
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold leading-relaxed">
                      {currentCard?.front}
                    </h3>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <p className="text-sm sm:text-base leading-relaxed text-stone-300 dark:text-stone-200 whitespace-pre-wrap">
                      {currentCard?.back}
                    </p>
                  </div>
                )}
              </div>

              {!isFlipped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(true);
                  }}
                  className="mt-8 px-4 py-2 rounded-xl text-xs font-semibold bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30 hover:bg-[#DFBA7F]/30 transition-colors"
                >
                  Show Answer
                </button>
              )}
            </div>

            {/* Spaced Repetition Rating Buttons */}
            {isFlipped && (
              <div className="p-4 rounded-2xl border bg-stone-900/40 border-white/10 space-y-2 animate-fadeIn">
                <p className="text-center text-xs font-semibold text-stone-400 mb-2">
                  Rate your recall difficulty:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate('again')}
                    className="p-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Again</span>
                    <span className="text-[10px] text-red-400 opacity-80 font-mono">&lt; 10m</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('hard')}
                    className="p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Hard</span>
                    <span className="text-[10px] text-amber-400 opacity-80 font-mono">1 day</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('good')}
                    className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Good</span>
                    <span className="text-[10px] text-emerald-400 opacity-80 font-mono">3 days</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate('easy')}
                    className="p-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Easy</span>
                    <span className="text-[10px] text-blue-400 opacity-80 font-mono">7 days</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Management Table of All Cards */
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="p-4 border-b flex items-center justify-between text-xs text-stone-400">
            <span>Total Cards: {subjectCards.length}</span>
          </div>

          {subjectCards.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">No cards created yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {subjectCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/5 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-stone-100">{card.front}</p>
                    <p className="text-stone-400 line-clamp-2">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        card.difficulty === 'again'
                          ? 'bg-red-500/20 text-red-400'
                          : card.difficulty === 'hard'
                          ? 'bg-amber-500/20 text-amber-400'
                          : card.difficulty === 'good'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {card.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        deleteFlashcard(card.id);
                        reloadCards();
                      }}
                      className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <h3 className="text-base font-bold mb-1">Add Flashcard</h3>
            <p className="text-xs text-stone-400 mb-4">
              Saving to: {selectedSubject.name} {selectedTopic ? `• ${selectedTopic.name}` : ''}
            </p>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  Front (Question / Prompt)
                </label>
                <textarea
                  required
                  rows={2}
                  value={manualFront}
                  onChange={(e) => setManualFront(e.target.value)}
                  placeholder="e.g. What is the primary function of ribosomes?"
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  Back (Answer / Explanation)
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualBack}
                  onChange={(e) => setManualBack(e.target.value)}
                  placeholder="e.g. Ribosomes perform protein synthesis by translating mRNA into amino acid polypeptide chains."
                  className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#C9A063] text-[#080A0E]"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Flashcards Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
              isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#DFBA7F]" />
              <h3 className="text-base font-bold">Generate Active-Recall Flashcards</h3>
            </div>
            <p className="text-xs text-stone-400 mb-4">
              AI creates high-yield cards with key definitions, formulas, and concepts.
            </p>

            <form onSubmit={handleAiGenerate} className="space-y-4">
              {/* Source tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-black/20 text-xs">
                <button
                  type="button"
                  onClick={() => setAiSourceMode('topic')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'topic' ? 'bg-[#C9A063] text-[#080A0E] font-bold' : 'text-stone-400'
                  }`}
                >
                  Topic Core
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceMode('text')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'text' ? 'bg-[#C9A063] text-[#080A0E] font-bold' : 'text-stone-400'
                  }`}
                >
                  Paste Notes
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceMode('file')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    aiSourceMode === 'file' ? 'bg-[#C9A063] text-[#080A0E] font-bold' : 'text-stone-400'
                  }`}
                >
                  Upload PDF/Image
                </button>
              </div>

              {aiSourceMode === 'topic' && (
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-stone-300">
                  Will generate cards based on: <strong>{selectedTopic?.name || selectedSubject.name}</strong>
                </div>
              )}

              {aiSourceMode === 'text' && (
                <textarea
                  rows={4}
                  value={aiTextPrompt}
                  onChange={(e) => setAiTextPrompt(e.target.value)}
                  placeholder="Paste lecture notes, study guide text, or textbook excerpt here..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              )}

              {aiSourceMode === 'file' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="text-xs text-stone-400"
                  />
                  {aiFileAttachment && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                      Attached: {aiFileAttachment.name}
                    </div>
                  )}
                </div>
              )}

              {/* Card Count Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-medium">Number of Cards:</span>
                <div className="flex items-center gap-1.5">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAiCardCount(num)}
                      className={`px-3 py-1 rounded-lg border font-mono font-bold transition-all ${
                        aiCardCount === num
                          ? 'bg-[#C9A063] text-[#080A0E] border-[#C9A063]'
                          : 'border-white/10 text-stone-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {generateError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {generateError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] disabled:opacity-40"
                >
                  {isGenerating ? 'Analyzing & Generating...' : 'Generate Flashcards'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
