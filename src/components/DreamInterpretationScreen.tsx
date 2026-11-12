import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Moon,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DreamInterpretationResult } from './DreamInterpretationModal';
import { useBackHandler } from '../utils/historyManager';
import { getApiUrl } from '../utils/apiConfig';

import { getLanguageCode } from '../utils/i18n';

interface DreamMessage {
  id: string;
  sender: 'user' | 'scholar';
  dreamText?: string;
  emotion?: string;
  timing?: string;
  data?: DreamInterpretationResult;
  timestamp: string;
}

interface DreamInterpretationScreenProps {
  isDark: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const STARTER_DREAMS_EN = [
  {
    title: '💧 Swimming in Clear Blue Water',
    desc: 'Pure water, swimming without struggle, feeling peaceful and light.',
    text: 'I dreamed I was swimming in clear blue water and I felt very peaceful and refreshed.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ Flying High Above the Ground',
    desc: 'Gliding freely over green hills and rivers with ease and joy.',
    text: 'I saw myself flying freely high above the ground and green hills, looking down without fear.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 Standing Before the Holy Kaaba',
    desc: 'Making Tawaf, touching the Kiswah in tears of humility.',
    text: 'I dreamed I was standing before the Holy Kaaba in Makkah, touching the Kiswah in tears of gratitude.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 Finding a Luminous Golden Key',
    desc: 'Discovering an ornate key in a brightly lit house.',
    text: 'I found an ancient ornate golden key lying on a table in a bright, clean house.',
    emotion: 'joyful',
    timing: 'night',
  },
];

const STARTER_DREAMS_AR = [
  {
    title: '💧 السباحة في ماء أزرق نقي',
    desc: 'ماء طاهر زلال، سباحة بيسر وسكينة، شعور بالانشراح والبركة.',
    text: 'رأيت في منامي أنني أسبح في ماء رقراق صافٍ عذب وأشعر بسكينة وانشراح صدر عظيم.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ الطيران والتحليق في السماء',
    desc: 'تحليق خفيف فوق الربى والأودية الخضراء بيسر وسرور دون خوف.',
    text: 'رأيت أنني أطير في السماء بكل يسر وسرور وأنظر إلى الرياض الخضراء من علو دون وجل.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 الوقوف أمام الكعبة المشرفة',
    desc: 'الطواف بالبيت العتيق، ولمس أستار الكعبة مع دموع الخشوع والشكر.',
    text: 'رأيت في منامي أنني قائم بين يدي الكعبة المشرفة بمكة المكرمة ألمس أستارها مع دموع الخشوع.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 العثور على مفتاح ذهبي وضاء',
    desc: 'وجدان مفتاح قديم مذهب وضاء على بساط في دار رحبة منيرة.',
    text: 'رأيت أنني عثرت على مفتاح ذهبي جميل وضاء في منزل رحب مشرق بنور طيب.',
    emotion: 'joyful',
    timing: 'night',
  },
];

export const DreamInterpretationScreen: React.FC<DreamInterpretationScreenProps> = ({
  isDark,
  onClose,
  initialPrompt = '',
}) => {
  // Use Back button to exit dream screen cleanly
  useBackHandler(true, onClose, 'dream-screen-view');

  const lang = getLanguageCode();
  const isArabic = lang === 'ar';
  const starterDreams = isArabic ? STARTER_DREAMS_AR : STARTER_DREAMS_EN;

  const [messages, setMessages] = useState<DreamMessage[]>([]);
  const [inputText, setInputText] = useState(initialPrompt);
  const [selectedEmotion, setSelectedEmotion] = useState('peaceful');
  const [selectedTiming, setSelectedTiming] = useState('sahar');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, 'structured' | 'raw'>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If initialPrompt provided, pre-fill
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSendDream = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || textToSend.trim().length < 3) {
      setErrorMessage(isArabic ? 'يرجى كتابة وصف موجز للرؤيا في بضع جمل.' : 'Please describe your dream in a few sentences.');
      return;
    }

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const newMessages: DreamMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        dreamText: textToSend.trim(),
        emotion: selectedEmotion,
        timing: selectedTiming,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-SA' : [], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/dream-interpretation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamDescription: textToSend.trim(),
          emotionalContext: selectedEmotion,
          timing: selectedTiming,
        }),
      });

      const json = await res.json();
      if (json && json.data) {
        const scholarMsgId = `scholar-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: scholarMsgId,
            sender: 'scholar',
            data: json.data,
            timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-SA' : [], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setViewModes((prev) => ({ ...prev, [scholarMsgId]: 'structured' }));
      } else {
        setErrorMessage(json?.error || (isArabic ? 'تعذر تعبير الرؤيا حالياً، يرجى المحاولة مرة أخرى.' : 'Unable to interpret dream. Please try again.'));
      }
    } catch {
      setErrorMessage(isArabic ? 'خطأ في الاتصال بالشبكة، يرجى إعادة المحاولة.' : 'Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div
      id="dream-interpretation-fullscreen-container"
      className={`fixed inset-0 z-50 flex flex-col w-full h-[100dvh] overflow-hidden select-none animate-fadeIn transition-all duration-200 ${
        isDark ? 'bg-[#07090E] text-stone-100' : 'bg-[#FAF8F5] text-stone-900'
      }`}
    >
      {/* Ambient background spiritual lighting (hardware-accelerated radial gradients) */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201, 160, 99, 0.1) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(223, 186, 127, 0.08) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)' }}
      />

      {/* 1. TOP HEADER BAR */}
      <header className={`w-full border-b shrink-0 z-10 transition-colors duration-200 ${
        isDark ? 'bg-[#0A0D14]/95 border-[#C9A063]/25 shadow-md' : 'bg-white/95 border-[#C9A063]/30 shadow-xs'
      }`}>
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A063] via-[#DFBA7F] to-[#997334] flex items-center justify-center text-[#090B0E] shadow-[0_4px_18px_rgba(201,160,99,0.35)] shrink-0">
              <Moon className="w-5 h-5 text-[#090B0E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-cinzel font-bold text-[#F5EFE6] tracking-wider">
                  {isArabic ? 'تفسير الرؤى والأحلام' : 'TAFSIR AL-AHLAM'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {isArabic ? 'منهج الإمام ابن سيرين' : 'Ibn Sirin Methodology'}
                </span>
              </div>
              <p className="text-[11px] text-[#DFBA7F] font-arabic mt-0.5" dir="rtl">
                تعبير الرؤى والأحلام وفق منهج الإمام ابن سيرين والعلماء الأجلاء
              </p>
            </div>
          </div>

          {/* Action Controls & Prominent X Close Button */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-2 rounded-xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-stone-400 hover:text-red-400 text-xs transition-all cursor-pointer"
                title={isArabic ? 'مسح المحادثة' : 'Clear dream conversation'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* THE X BUTTON: Exits the Dream Interpretation page and returns user to previous spot */}
            <button
              id="exit-dream-screen-btn"
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C9A063]/40 bg-[#C9A063]/20 hover:bg-[#C9A063]/35 text-[#DFBA7F] hover:text-white transition-all text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
              title={isArabic ? 'إغلاق والعودة' : 'Exit and return to Spiritual Journey'}
            >
              <X className="w-4 h-4" />
              <span>{isArabic ? 'إغلاق' : 'Exit (إغلاق)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE STREAM AREA */}
      <main className="flex-1 overflow-y-auto w-full min-h-0">
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
          {/* Zero-conversation Hero state */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center animate-fadeIn max-w-xl mx-auto">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] flex items-center justify-center text-[#090B0E] shadow-[0_8px_32px_rgba(201,160,99,0.4)] animate-pulse">
                  <Moon className="w-8 h-8 text-[#090B0E]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0E1217] border-2 border-[#DFBA7F] flex items-center justify-center text-[#DFBA7F]">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <h3 className="font-serif-heading font-bold text-lg sm:text-xl text-[#F5EFE6] mb-1.5">
                {isArabic ? 'تعبير الرؤى والأحلام في ضوء الكتاب والسنة' : 'Classical Islamic Dream Interpretation'}
              </h3>
              <p className="text-xs text-stone-400 max-w-md mb-6 leading-relaxed">
                {isArabic
                  ? 'صِف رؤياك بتفاصيلها ورموزها ومشاعرها ليتم تحليلها وتأويلها وفق الأصول المعتمدة عند أئمة التعبير كالإمام محمد بن سيرين مع الشواهد النبوية والقرآنية.'
                  : "Describe any dream or vision. Analyzed through Muhammad Ibn Sirin's 7-step classical framework: symbol extraction, emotional context, primary ruling, alternative possibilities, and authentic Hadith citations."}
              </p>

              {/* Quick Starter Suggestions */}
              <div className="w-full space-y-2 text-left rtl:text-right" dir={isArabic ? 'rtl' : 'ltr'}>
                <div className="text-[10px] font-cinzel font-bold uppercase tracking-wider text-[#DFBA7F] px-1">
                  {isArabic ? 'نماذج من الرؤى المأثورة والشائعة' : 'Common Prophetic & Classical Visions'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {starterDreams.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(item.text);
                        setSelectedEmotion(item.emotion);
                        setSelectedTiming(item.timing);
                        handleSendDream(item.text);
                      }}
                      className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all group flex items-start justify-between cursor-pointer ${
                        isDark
                          ? 'bg-[#0E1217]/80 hover:bg-[#151B24] border-[#C9A063]/20 hover:border-[#DFBA7F]/50 text-stone-200'
                          : 'bg-white hover:bg-amber-50/60 border-stone-200 hover:border-[#C9A063]/50 text-stone-800 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold group-hover:text-[#DFBA7F] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                          {item.desc}
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-stone-400 group-hover:text-[#DFBA7F] transition-transform group-hover:translate-x-1 shrink-0 ml-2 rtl:ml-0 rtl:mr-2 mt-0.5 ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation Messages */
            messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end animate-fadeIn">
                    <div className="max-w-xl rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#090B0E] shadow-md space-y-2">
                      <div className="flex items-center justify-between gap-3 text-[11px] font-bold opacity-80 border-b border-black/10 pb-1.5">
                        <span>{isArabic ? 'الرؤيا المروية' : 'Dream Narrated'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        "{msg.dreamText}"
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-black/15">
                          {isArabic ? 'المشاعر:' : 'Emotion:'} {msg.emotion}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/15">
                          {isArabic ? 'الوقت:' : 'Timing:'} {msg.timing}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              const data = msg.data;
              if (!data) return null;
              const currentMode = viewModes[msg.id] || 'structured';

              return (
                <div key={msg.id} className="flex justify-start animate-fadeIn">
                  <div
                    className={`w-full max-w-3xl rounded-3xl p-5 sm:p-6 border space-y-5 transition-all duration-200 shadow-md ${
                      isDark
                        ? 'bg-[#0E131C] border-[#DFBA7F]/30 text-stone-100'
                        : 'bg-white border-[#C9A063]/40 text-stone-900'
                    }`}
                  >
                    {/* Analysis Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9A063]/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 border border-[#DFBA7F]/40 flex items-center justify-center text-[#DFBA7F]">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-serif-heading font-bold text-[#F5EFE6]">
                            {isArabic ? '🌙 تأويل الرؤيا المباركة' : '🌙 Tafsir al-Ahlam Analysis'}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {isArabic ? 'الموضوع:' : 'Topic:'} <strong className="text-[#DFBA7F]">{data.topic}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewModes((prev) => ({
                              ...prev,
                              [msg.id]: currentMode === 'structured' ? 'raw' : 'structured',
                            }))
                          }
                          className="px-2.5 py-1 rounded-xl text-[11px] font-medium border border-white/10 hover:border-[#DFBA7F]/40 bg-white/5 text-[#DFBA7F] transition-all cursor-pointer"
                        >
                          {isArabic
                            ? currentMode === 'structured'
                              ? 'عرض النص كاملاً'
                              : 'عرض البطاقات'
                            : currentMode === 'structured'
                            ? 'View Template Box'
                            : 'View Visual Cards'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, data.fullFormattedText)}
                          className="p-1.5 rounded-xl border border-white/10 hover:border-[#DFBA7F]/40 bg-white/5 text-[#DFBA7F] transition-all cursor-pointer"
                          title={isArabic ? 'نسخ التحليل كاملاً' : 'Copy complete analysis'}
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {currentMode === 'structured' ? (
                      <div className="space-y-4">
                        {/* Step 1 & 2: Symbol Extraction & Topic Classification */}
                        <div
                          className={`p-4 rounded-2xl border ${
                            isDark ? 'bg-[#090C10] border-white/5' : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="text-[11px] font-mono uppercase tracking-wider text-[#DFBA7F] font-bold mb-2 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'استخراج الرموز والمعاني الدلالية' : 'Symbols Detected (استخراج الرموز)'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {data.symbolsDetected.map((sym, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30"
                              >
                                ✦ {sym}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-stone-300 leading-relaxed font-light">
                            {data.keyElements}
                          </p>
                        </div>

                        {/* Step 3: Emotional Context Analysis */}
                        <div
                          className={`p-4 rounded-2xl border ${
                            isDark ? 'bg-[#090C10] border-white/5' : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'السياق الوجداني وحال الرائي' : 'Emotional Context (السياق الوجداني)'}</span>
                          </div>
                          <div className="text-xs text-stone-200 space-y-1 leading-relaxed">
                            <div>
                              <strong>{isArabic ? 'طبيعة الشعور:' : 'Tenor:'} </strong>
                              <span className="text-[#DFBA7F]">{data.emotionalContext.emotion}</span>
                            </div>
                            <p>{data.emotionalContext.impact}</p>
                            <p className="text-stone-400 font-light italic">
                              {data.emotionalContext.psychologicalLayer}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Primary Interpretation (Ibn Sirin Methodology) */}
                        <div
                          className={`p-5 rounded-2xl border ${
                            isDark
                              ? 'bg-gradient-to-br from-[#121824] via-[#0E131C] to-[#0A0D14] border-[#DFBA7F]/40 shadow-lg'
                              : 'bg-amber-50/90 border-[#DFBA7F]/50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#DFBA7F]" />
                            <h4 className="text-sm font-bold font-serif-heading text-[#F5EFE6]">
                              {isArabic ? 'التأويل الراجح وفق أصول ابن سيرين' : 'Primary Classical Interpretation (التأويل الراجح عند ابن سيرين)'}
                            </h4>
                          </div>
                          <p className="text-xs sm:text-sm text-stone-200 font-medium leading-relaxed mb-3">
                            {data.primaryInterpretation.text}
                          </p>

                          <div className="p-3 rounded-xl bg-[#090C10]/80 border border-[#C9A063]/25 text-xs text-stone-300 space-y-1.5">
                            <div>
                              <strong className="text-[#DFBA7F]">{isArabic ? 'العلة والتأصيل الشرعي:' : 'Scholarly Reasoning (العلة والتأصيل):'} </strong>
                              {data.primaryInterpretation.why}
                            </div>
                            {data.primaryInterpretation.supportingEvidence && (
                              <div className="pt-1 border-t border-white/5 text-[11px] text-[#DFBA7F]">
                                <strong>{isArabic ? 'الشاهد والدليل:' : 'Evidence:'} </strong>
                                {data.primaryInterpretation.supportingEvidence}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 5: Alternative Interpretations */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-[#DFBA7F] font-bold flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'التأويلات والوجوه المحتملة الأخرى' : 'Alternative Contextual Interpretations (التأويلات الأخرى)'}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {data.alternativeInterpretations.map((alt, idx) => (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                                  isDark ? 'bg-[#090C10] border-white/5' : 'bg-stone-50 border-stone-200'
                                }`}
                              >
                                <div className="font-bold text-[#DFBA7F] text-xs mb-1">
                                  {idx + 1}️⃣ {alt.title}
                                </div>
                                <div className="text-stone-300 mb-1.5">{alt.why}</div>
                                <div className="text-[11px] text-stone-400 bg-white/5 p-2 rounded-xl border border-white/5">
                                  <span className="text-[#DFBA7F] font-semibold">{isArabic ? 'يرجح هذا الوجه إذا:' : 'Most likely if:'} </span>
                                  {alt.mostLikelyIf}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Step 6: Scholarly References */}
                        <div
                          className={`p-4 rounded-2xl border text-xs ${
                            isDark ? 'bg-[#090C10] border-white/5' : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="font-bold text-[#DFBA7F] mb-1.5 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'المراجع والمصادر المعتمدة' : 'Scholarly References (المراجع المعتمدة)'}</span>
                          </div>
                          <ul className="space-y-1 text-stone-300 text-[11px]">
                            {data.scholarlyReferences.map((ref, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-[#DFBA7F]">✦</span>
                                <span>{ref}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Step 7: Prophetic Adab */}
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isArabic ? 'الآداب النبوية والتوجيهات الإيمانية' : 'Prophetic Adab & Guidance (آداب الرؤى)'}</span>
                          </div>
                          <ul className="space-y-0.5 text-[11px] text-stone-300">
                            {data.importantNotes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span>•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      /* Verbatim Template View */
                      <pre
                        className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border overflow-x-auto ${
                          isDark ? 'bg-[#06080B] border-[#C9A063]/30 text-stone-200' : 'bg-stone-900 border-stone-700 text-stone-100'
                        }`}
                      >
                        {data.fullFormattedText}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0E131C] border border-[#DFBA7F]/30 text-xs text-[#DFBA7F]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#DFBA7F]" />
                <span>{isArabic ? 'جاري استخراج الرموز ومطابقتها مع أصول ابن سيرين...' : 'Consulting Ibn Sirin Hermeneutics & Extracting Symbols...'}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 3. BOTTOM INPUT BAR (Styled exactly like Noor AI) */}
      <footer className={`w-full border-t shrink-0 z-10 transition-colors duration-200 ${
        isDark ? 'bg-[#0A0D14]/95 border-[#C9A063]/25 shadow-lg' : 'bg-white/95 border-[#C9A063]/30 shadow-md'
      } pb-safe pb-4 sm:pb-5`}>
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 pt-3 space-y-2.5">
          {/* Context Controls (Emotion + Timing) */}
          <div className="flex flex-wrap items-center gap-2 text-xs" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-1.5 bg-[#07090E] px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-stone-400 font-medium">{isArabic ? 'المشاعر:' : 'Emotion:'}</span>
              <select
                value={selectedEmotion}
                onChange={(e) => setSelectedEmotion(e.target.value)}
                className="bg-transparent text-[#DFBA7F] font-semibold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="peaceful" className="bg-[#0E1218]">{isArabic ? 'سكينة واطمئنان' : 'Peaceful (سكينة)'}</option>
                <option value="joyful" className="bg-[#0E1218]">{isArabic ? 'بشرى وسرور' : 'Joyful (بشرى وفرح)'}</option>
                <option value="fearful" className="bg-[#0E1218]">{isArabic ? 'خوف وتحذير' : 'Fearful (خوف وتحذير)'}</option>
                <option value="confused" className="bg-[#0E1218]">{isArabic ? 'حيرة وتساؤل' : 'Confused (حيرة)'}</option>
                <option value="sad" className="bg-[#0E1218]">{isArabic ? 'حزن وشوق' : 'Sorrowful (حزن وشوق)'}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#07090E] px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-stone-400 font-medium">{isArabic ? 'الوقت:' : 'Time:'}</span>
              <select
                value={selectedTiming}
                onChange={(e) => setSelectedTiming(e.target.value)}
                className="bg-transparent text-[#DFBA7F] font-semibold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="sahar" className="bg-[#0E1218]">{isArabic ? 'وقت السحر (قبل الفجر)' : 'Pre-Dawn / Sahar (وقت السحر)'}</option>
                <option value="night" className="bg-[#0E1218]">{isArabic ? 'في جوف الليل' : 'Night (في الليل)'}</option>
                <option value="qaylulah" className="bg-[#0E1218]">{isArabic ? 'نوم القيلولة (نهاراً)' : 'Afternoon Nap (القيلولة)'}</option>
                <option value="unknown" className="bg-[#0E1218]">{isArabic ? 'غير محدد' : 'Unspecified'}</option>
              </select>
            </div>
          </div>

          {/* Input box & Send button */}
          <div className="flex items-center gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendDream();
                }
              }}
              rows={1}
              placeholder={isArabic ? 'صِف رؤياك بالتفصيل (الرموز، الأشخاص، الألوان، الأفعال، والمشاعر المصاحبة)...' : 'Describe your dream (symbols, actions, people, colors, sensations)...'}
              className={`flex-1 p-3 rounded-2xl text-xs sm:text-sm border transition-all resize-none focus:outline-hidden ${
                isDark
                  ? 'bg-[#07090E] border-[#C9A063]/30 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F]'
                  : 'bg-white border-[#C9A063]/40 text-stone-900 placeholder-stone-400 focus:border-[#DFBA7F]'
              }`}
            />

            <button
              type="button"
              onClick={() => handleSendDream()}
              disabled={isLoading || !inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] hover:brightness-110 active:scale-95 text-[#080A0E] font-bold shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title={isArabic ? 'تعبير الرؤيا' : 'Interpret Dream'}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
