import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Gauge,
  Sparkles,
  HelpCircle,
  Languages,
  CheckCircle2,
  FileQuestion,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  speakArabic,
  stopArabicSpeech,
  createArabicSpeechRecognition,
  SpeechRecognitionController,
} from '../../utils/arabicSpeech';
import { getLanguageHeaders } from '../../utils/i18n';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface LiveArabicViewProps {
  isDark: boolean;
  language?: string;
}

interface LiveExchange {
  id: string;
  sender: 'user' | 'noor';
  arabic: string;
  transliteration?: string;
  english?: string;
  notes?: string;
  actionTag?: string;
}

export const LiveArabicView: React.FC<LiveArabicViewProps> = ({ isDark, language }) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [sessionActive, setSessionActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85 normal, 0.6 slow
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [exchanges, setExchanges] = useState<LiveExchange[]>([
    {
      id: 'live-start',
      sender: 'noor',
      arabic: 'مَرْحَبًا بِكَ فِي جَلْسَةِ المُحَادَثَةِ المُبَاشِرَةِ! عَمَّ تُرِيدُ أَنْ نَتَحَدَّثَ اليَوْمَ؟',
      transliteration: 'Marḥaban bika fī jalsati al-muḥādathati al-mubāshirah! ‘Amma turīdu an nataḥaddatha al-yawm?',
      english: 'Welcome to the Live Arabic session! What would you like to speak about today?',
      notes: 'Ready for interactive practice. Use any action button below or speak naturally.',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges, isProcessing]);

  const startVoiceInput = () => {
    setSpeechError(null);
    const controller = createArabicSpeechRecognition({
      onStart: () => setIsListening(true),
      onResult: (transcript, isFinal) => {
        setInputVal(transcript);
        if (isFinal) {
          setIsListening(false);
          handleTriggerTurn(transcript);
        }
      },
      onError: err => {
        setIsListening(false);
        setSpeechError(err);
      },
      onEnd: () => setIsListening(false),
    });

    if (controller) {
      recognitionRef.current = controller;
      controller.start();
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Turn Trigger with Action Modifiers
  const handleTriggerTurn = async (
    customText?: string,
    actionOverride?: 'repeat' | 'slow_down' | 'make_easier' | 'explain' | 'translate' | 'correct_me' | 'test_me'
  ) => {
    const text = (customText ?? inputVal).trim();
    if (!text && !actionOverride) return;

    let actionPrompt = '';
    let actionLabel = '';

    if (actionOverride === 'repeat') {
      const lastNoor = exchanges.slice().reverse().find(e => e.sender === 'noor');
      if (lastNoor) {
        speakArabic(lastNoor.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
      }
      return;
    } else if (actionOverride === 'slow_down') {
      setIsSlowMode(prev => !prev);
      const newRate = !isSlowMode ? 0.6 : 0.85;
      setSpeechRate(newRate);
      const lastNoor = exchanges.slice().reverse().find(e => e.sender === 'noor');
      if (lastNoor) {
        speakArabic(lastNoor.arabic, { rate: newRate });
      }
      return;
    } else if (actionOverride === 'make_easier') {
      setIsEasyMode(true);
      actionLabel = 'Make Easier';
      actionPrompt = 'Simplify the conversation: use foundational vocabulary, short 3-word sentences, and very clear elementary Arabic.';
    } else if (actionOverride === 'explain') {
      actionLabel = 'Explain';
      actionPrompt = `Explain the grammar, morphology, and vocabulary of the last sentence thoroughly in the user's selected language (${activeLang}).`;
    } else if (actionOverride === 'translate') {
      actionLabel = 'Translate';
      actionPrompt = `Provide a complete word-by-word breakdown and natural translation in the user's selected language (${activeLang}) of what was just said.`;
    } else if (actionOverride === 'correct_me') {
      actionLabel = 'Correct Me';
      actionPrompt = `Examine the student's Arabic: "${text}". Point out any pronunciation, grammar, or word choice flaws and show the perfect vocalized form. Explain in the user's selected language (${activeLang}).`;
    } else if (actionOverride === 'test_me') {
      actionLabel = 'Test Me';
      actionPrompt = `Ask me a direct check-for-understanding question in Arabic based on our current conversation, with 3 options. Provide brief instructions in the user's selected language (${activeLang}).`;
    }

    if (text) {
      setExchanges(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          arabic: text,
          actionTag: actionLabel || undefined,
        },
      ]);
    }

    setInputVal('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/study/tutor', {
        method: 'POST',
        headers: getLanguageHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          language: activeLang,
          message: actionPrompt
            ? `${actionPrompt}\nUser input: "${text}"`
            : `User spoke: "${text}". Respond in natural conversational Arabic with diacritics. If providing translations or explanations, respond in the user's selected language (${activeLang}). Keep it engaging.`,
          history: exchanges.slice(-6).map(e => ({
            role: e.sender === 'user' ? 'user' : 'model',
            text: e.arabic,
          })),
          mode: 'general',
          subject: 'Live Arabic Conversation',
        }),
      });

      if (!response.ok) throw new Error('Live tutor service unavailable');
      const data = await response.json();
      const rawText = data.result || data.answer || 'مُمْتَاز! لِنُتَابِع المُحَادَثَة.';

      const newNoorMsg: LiveExchange = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabic: rawText,
        notes: actionLabel ? `Handled action: ${actionLabel}` : undefined,
      };

      setExchanges(prev => [...prev, newNoorMsg]);
      speakArabic(newNoorMsg.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
    } catch (err) {
      console.warn('Live tutor fallback:', err);
      const fallbackMsg: LiveExchange = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabic: 'أَحْسَنْتَ قَوْلًا! هَلْ تُرِيدُ أَنْ نُمَارِسَ المَزِيدَ مِنَ الكَلِمَاتِ؟',
        english: 'Well said! Would you like to practice more words together?',
      };
      setExchanges(prev => [...prev, fallbackMsg]);
      speakArabic(fallbackMsg.arabic, { rate: isSlowMode ? 0.6 : 0.85 });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Session Banner */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Arabic Session Active
              </span>
              {isSlowMode && (
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Slow Pace (0.6x)
                </span>
              )}
              {isEasyMode && (
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Elementary Vocabulary
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Live Conversational Arabic with Noor
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Natural real-time dialogue. Control pace, difficulty, translation, explanations, and instant corrections on demand.
            </p>
          </div>

          {/* Real-Time Interaction Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Speak */}
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Stop' : 'Speak'}</span>
            </button>

            {/* Listen */}
            <button
              onClick={() => {
                const last = exchanges.slice().reverse().find(e => e.sender === 'noor');
                if (last) speakArabic(last.arabic, { rate: speechRate });
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 border border-white/5 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>

            {/* Repeat */}
            <button
              onClick={() => handleTriggerTurn(undefined, 'repeat')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 border border-white/5 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat</span>
            </button>

            {/* Slow down */}
            <button
              onClick={() => handleTriggerTurn(undefined, 'slow_down')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isSlowMode
                  ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                  : 'border-white/5 bg-stone-500/10 text-stone-300 hover:bg-stone-500/20'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{isSlowMode ? 'Normal Speed' : 'Slow Down'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Action Toolbar: Make easier, Explain, Translate, Correct me, Test me */}
        <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-500 mr-1">Noor AI Controls:</span>

          <button
            onClick={() => handleTriggerTurn(undefined, 'make_easier')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-[#C9A063]/20 text-stone-300 hover:text-[#DFBA7F] border border-white/5 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Make easier</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'explain')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-[#C9A063]/20 text-stone-300 hover:text-[#DFBA7F] border border-white/5 transition-all flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
            <span>Explain</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'translate')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-[#C9A063]/20 text-stone-300 hover:text-[#DFBA7F] border border-white/5 transition-all flex items-center gap-1"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-300" />
            <span>Translate</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(inputVal || 'كَتَبْتُ الدَّرْسِ', 'correct_me')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-[#C9A063]/20 text-stone-300 hover:text-[#DFBA7F] border border-white/5 transition-all flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />
            <span>Correct me</span>
          </button>

          <button
            onClick={() => handleTriggerTurn(undefined, 'test_me')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-[#C9A063]/20 text-stone-300 hover:text-[#DFBA7F] border border-white/5 transition-all flex items-center gap-1"
          >
            <FileQuestion className="w-3.5 h-3.5 text-rose-300" />
            <span>Test me</span>
          </button>
        </div>
      </div>

      {speechError && (
        <div className="px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-stone-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Conversation Stream */}
      <div
        className={`rounded-2xl border flex flex-col h-[500px] overflow-hidden ${
          isDark ? 'bg-[#101318] border-white/5' : 'bg-white border-stone-200 shadow-sm'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {exchanges.map(ex => {
            const isNoor = ex.sender === 'noor';
            return (
              <div
                key={ex.id}
                className={`flex gap-3 max-w-2xl ${isNoor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isNoor && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFBA7F] to-[#C9A063] flex items-center justify-center text-[#080A0E] text-xs font-bold flex-shrink-0 mt-1">
                    ن
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border text-sm space-y-2 ${
                    isNoor
                      ? isDark
                        ? 'bg-stone-900/80 border-white/5 text-stone-200'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                      : 'bg-[#C9A063]/20 border-[#C9A063]/30 text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#DFBA7F]">
                      {isNoor ? 'Noor AI (Live)' : 'You'}
                    </span>
                    {ex.actionTag && (
                      <span className="px-2 py-0.5 text-[10px] rounded-md bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30">
                        {ex.actionTag}
                      </span>
                    )}
                    <button
                      onClick={() => speakArabic(ex.arabic, { rate: speechRate })}
                      className="text-stone-400 hover:text-[#DFBA7F]"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-2xl font-serif text-right text-stone-100 leading-relaxed select-text">
                    {ex.arabic}
                  </p>

                  {ex.transliteration && (
                    <p className="text-xs text-stone-400 italic">{ex.transliteration}</p>
                  )}

                  {ex.english && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 border-t border-white/5 pt-1.5">
                      {ex.english}
                    </p>
                  )}

                  {ex.notes && (
                    <div className="p-2 rounded-xl bg-stone-500/10 text-xs text-stone-300">
                      {ex.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-xl bg-[#DFBA7F] flex items-center justify-center text-[#080A0E] text-xs font-bold">
                ن
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-white/5 text-xs text-stone-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-pulse" />
                <span>Noor is adapting and responding in Arabic...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Live Input Field */}
        <div className="p-4 border-t border-stone-200/50 dark:border-white/5 bg-black/20 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTriggerTurn()}
            placeholder="Type your Arabic response, or click 'Speak' above..."
            dir="auto"
            className={`flex-1 px-4 py-3 rounded-2xl border text-sm focus:outline-hidden ${
              isDark
                ? 'bg-stone-900 border-white/10 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
            }`}
          />
          <button
            onClick={() => handleTriggerTurn()}
            disabled={!inputVal.trim() || isProcessing}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-90 disabled:opacity-30 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
