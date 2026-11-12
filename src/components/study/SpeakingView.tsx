import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Globe,
} from 'lucide-react';
import {
  speakArabic,
  stopArabicSpeech,
  createArabicSpeechRecognition,
  SpeechRecognitionController,
} from '../../utils/arabicSpeech';
import { getLanguageHeaders } from '../../utils/i18n';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';
import { Skeleton } from '../SkeletonLoaders';

interface SpeakingViewProps {
  isDark: boolean;
  language?: string;
}

interface SpeechMessage {
  id: string;
  sender: 'user' | 'noor';
  arabicText: string;
  transliteration?: string;
  englishTranslation?: string;
  corrections?: string;
  grammarTip?: string;
}

export const SpeakingView: React.FC<SpeakingViewProps> = ({ isDark, language }) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [messages, setMessages] = useState<SpeechMessage[]>([
    {
      id: 'init-1',
      sender: 'noor',
      arabicText: 'السَّلَامُ عَلَيْكُمْ! أَنَا مُعَلِّمُكَ نُور. كَيْفَ حَالُكَ اليَوْمَ؟',
      transliteration: 'As-salāmu ‘alaykum! Anā mu‘allimuka Nūr. Kayfa ḥāluka al-yawm?',
      englishTranslation: 'Peace be upon you! I am your teacher Noor. How are you today?',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [practiceTopic, setPracticeTopic] = useState<'beginner' | 'everyday' | 'qa' | 'pronounce'>('beginner');
  const [speechRate, setSpeechRate] = useState<number>(0.85);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi]);

  const startListening = () => {
    setSpeechError(null);
    const controller = createArabicSpeechRecognition({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript, isFinal) => {
        setInputVal(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setSpeechError(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (controller) {
      recognitionRef.current = controller;
      controller.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoadingAi) return;

    const userMsg: SpeechMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      arabicText: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoadingAi(true);
    setSpeechError(null);

    try {
      // Call dedicated study tutor endpoint with Arabic language instruction
      const response = await fetch('/api/study/tutor', {
        method: 'POST',
        headers: getLanguageHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          language: activeLang,
          message: `The user said this in Arabic: "${text}".
Practice Mode: ${practiceTopic}
Evaluate their Arabic carefully. Check for:
1. Grammar or word choice errors (if any).
2. Diacritics and correct classical pronunciation.
Provide a natural, welcoming response in Arabic at a beginner/intermediate level with full vowel marks (tashkeel), followed by its transliteration, translation in the user's selected language (${activeLang}), and a short constructive correction/explanation in the user's language (${activeLang}) if they made a mistake. Format as JSON:
{
  "arabicText": "Arabic response with Tashkeel",
  "transliteration": "Latin transliteration",
  "englishTranslation": "Translation in the user's language",
  "corrections": "Optional correction or empty string",
  "grammarTip": "Optional short grammar tip or empty string"
}`,
          history: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.arabicText,
          })),
          mode: 'general',
          subject: 'Arabic Language Learning',
        }),
      });

      if (!response.ok) throw new Error('Could not reach Arabic AI tutor');
      const data = await response.json();

      let parsed: any = null;
      try {
        const cleaned = (data.result || data.answer || '').replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          arabicText: data.result || 'أَحْسَنْتَ! لُغَتُكَ العَرَبِيَّةُ تَتَحَسَّنُ كُلَّ يَوْمٍ.',
          transliteration: 'Aḥsanta! Lughatuka al-‘arabiyyatu tataḥassanu kulla yawm.',
          englishTranslation: 'Well done! Your Arabic is improving every day.',
          corrections: '',
          grammarTip: '',
        };
      }

      const noorMsg: SpeechMessage = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabicText: parsed.arabicText || 'مُمْتَاز! وَاصِل التَّدْرِيبَ.',
        transliteration: parsed.transliteration,
        englishTranslation: parsed.englishTranslation,
        corrections: parsed.corrections,
        grammarTip: parsed.grammarTip,
      };

      setMessages(prev => [...prev, noorMsg]);
      // Speak Noor's reply automatically
      speakArabic(noorMsg.arabicText, { rate: speechRate });
    } catch (err: any) {
      console.warn('Speaking AI fallback:', err);
      const fallbackMsg: SpeechMessage = {
        id: `noor-${Date.now()}`,
        sender: 'noor',
        arabicText: 'شُكْرًا لَكَ عَلَى الإِجَابَةِ! هَلْ يُمْكِنُكَ أَنْ تُعِيدَهَا مَرَّةً أُخْرَى بِنُطْقٍ أَوْضَح؟',
        transliteration: 'Shukran laka ‘alā al-ijābah! Hal yumkinuka an tu‘īdahā marratan ukhrā bi-nuṭqin awḍaḥ?',
        englishTranslation: 'Thank you for your answer! Can you repeat it once more with clearer pronunciation?',
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speakArabic(fallbackMsg.arabicText, { rate: speechRate });
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#101318] border-white/5 shadow-xl' : 'bg-white border-stone-200 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                Arabic Speaking Studio
              </span>
              <span className="text-xs text-stone-500">Live Speech & AI Correction</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Interactive Arabic Speaking Practice
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Speak naturally in Arabic to Noor AI. Get live pronunciation feedback, vocabulary expansions, and grammatical corrections.
            </p>
          </div>

          {/* Topic Selectors */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'beginner', label: 'Beginner Greetings' },
              { id: 'everyday', label: 'Everyday Life' },
              { id: 'qa', label: 'Q&A Practice' },
              { id: 'pronounce', label: 'Pronunciation Drill' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPracticeTopic(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  practiceTopic === t.id
                    ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F]'
                    : isDark
                    ? 'border-white/5 bg-white/5 text-stone-400 hover:text-stone-200'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {speechError && (
        <div className="px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
          <span>{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="text-stone-400 hover:text-stone-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Conversation Canvas */}
      <div
        className={`rounded-2xl border flex flex-col h-[520px] overflow-hidden ${
          isDark ? 'bg-[#101318] border-white/5' : 'bg-white border-stone-200 shadow-sm'
        }`}
      >
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => {
            const isNoor = msg.sender === 'noor';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isNoor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isNoor && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFBA7F] to-[#C9A063] flex items-center justify-center text-[#080A0E] text-xs font-bold flex-shrink-0 mt-1 shadow-xs">
                    ن
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border text-sm space-y-2 ${
                    isNoor
                      ? isDark
                        ? 'bg-stone-900/70 border-white/5 text-stone-200'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                      : 'bg-gradient-to-r from-[#DFBA7F]/20 to-[#C9A063]/20 border-[#C9A063]/30 text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#DFBA7F]">
                      {isNoor ? 'Noor AI (Arabic Teacher)' : 'You (Arabic Learner)'}
                    </span>
                    <button
                      onClick={() => speakArabic(msg.arabicText, { rate: speechRate })}
                      className="text-stone-400 hover:text-[#DFBA7F] transition-colors p-1"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-2xl font-serif text-right text-stone-100 select-text leading-relaxed">
                    {msg.arabicText}
                  </p>

                  {msg.transliteration && (
                    <p className="text-xs text-stone-400 font-sans italic">
                      {msg.transliteration}
                    </p>
                  )}

                  {msg.englishTranslation && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 border-t border-stone-500/10 pt-1.5">
                      {msg.englishTranslation}
                    </p>
                  )}

                  {/* Constructive Error Correction & Grammar Tips */}
                  {msg.corrections && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Teacher Correction</span>
                      </div>
                      <p>{msg.corrections}</p>
                    </div>
                  )}

                  {msg.grammarTip && (
                    <div className="p-2 rounded-xl bg-[#C9A063]/10 border border-[#C9A063]/20 text-xs text-[#DFBA7F]">
                      💡 <strong>Grammar Tip:</strong> {msg.grammarTip}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoadingAi && (
            <div className="flex gap-3 max-w-md mr-auto w-full animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-[#DFBA7F] flex items-center justify-center text-[#080A0E] text-xs font-bold shrink-0">
                ن
              </div>
              <div className={`p-4 rounded-2xl border text-xs flex-1 space-y-2.5 ${
                isDark ? 'bg-stone-900/80 border-white/10' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-pulse" />
                  <span className="text-[11px] text-[#DFBA7F] font-semibold">Noor is analyzing your Arabic...</span>
                </div>
                <Skeleton className="h-3.5 w-[90%] rounded-md" isDark={isDark} />
                <Skeleton className="h-3.5 w-[70%] rounded-md" isDark={isDark} />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Speaking Bar */}
        <div className="p-4 border-t border-stone-200/50 dark:border-white/5 bg-black/20 space-y-3">
          {/* Quick Arabic Starter Phrases */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-stone-500 flex-shrink-0">Quick starters:</span>
            {[
              'كَيْفَ حَالُكَ؟',
              'أَنَا بِخَيْرٍ وَالحَمْدُ لِلَّه',
              'أَنَا أَتَعَلَّمُ اللُّغَةَ العَرَبِيَّةَ',
              'شُكْرًا جَزِيلًا لَكَ',
            ].map(phrase => (
              <button
                key={phrase}
                onClick={() => setInputVal(phrase)}
                className="px-2.5 py-1 rounded-lg bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 flex-shrink-0 text-xs font-serif"
              >
                {phrase}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Mic Toggle Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-[#DFBA7F] text-[#080A0E] hover:bg-[#C9A063]'
              }`}
              title={isListening ? 'Stop Speaking' : 'Start Speaking in Arabic'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input Box */}
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                isListening
                  ? 'Listening in Arabic... (Speak now)'
                  : 'Type or speak Arabic (e.g. أَهْلًا وَسَهْلًا)...'
              }
              dir="auto"
              className={`flex-1 px-4 py-3 rounded-2xl border text-sm focus:outline-hidden transition-all ${
                isDark
                  ? 'bg-stone-900 border-white/10 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
              }`}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoadingAi}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-90 disabled:opacity-30 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
