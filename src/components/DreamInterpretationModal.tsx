import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Clock,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useModalScrollLock } from '../utils/useModalScrollLock';
import { getApiUrl } from '../utils/apiConfig';

interface DreamInterpretationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  initialDreamPrompt?: string;
}

export interface DreamInterpretationResult {
  topic: string;
  symbolsDetected: string[];
  keyElements: string;
  emotionalContext: {
    emotion: string;
    impact: string;
    psychologicalLayer: string;
  };
  primaryInterpretation: {
    text: string;
    why: string;
    supportingEvidence: string;
  };
  alternativeInterpretations: Array<{
    title: string;
    why: string;
    mostLikelyIf: string;
  }>;
  scholarlyReferences: string[];
  importantNotes: string[];
  fullFormattedText: string;
}

const SAMPLE_DREAMS = [
  {
    title: '💧 Clear Blue Water',
    titleAr: '💧 ماء عذب صافٍ',
    text: 'I dreamed I was swimming in clear blue water and I felt very peaceful and refreshed.',
    textAr: 'رأيت في منامي أنني أسبح في ماء زلال صافٍ وشعرت بسكينة وانتعاش عظيمين.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🕊️ Flying in the Sky',
    titleAr: '🕊️ الطيران في السماء',
    text: 'I saw myself flying freely high above the ground and green hills, looking down without fear.',
    textAr: 'رأيت نفسي أطير في الفضاء بحرية فوق روابٍ خضراء دون خوف أو وجل.',
    emotion: 'joyful',
    timing: 'night',
  },
  {
    title: '🕋 Seeing the Holy Kaaba',
    titleAr: '🕋 رؤية الكعبة المشرفة',
    text: 'I dreamed I was standing before the Holy Kaaba in Makkah, touching the Kiswah in tears of gratitude.',
    textAr: 'رأيت أنني أقف أمام الكعبة المشرفة بمكة المكرمة وألمس كسوتها بدموع الشكر لله.',
    emotion: 'peaceful',
    timing: 'sahar',
  },
  {
    title: '🔑 Finding a Golden Key',
    titleAr: '🔑 العثور على مفتاح ذهبي',
    text: 'I found an ancient ornate golden key lying on a table in a bright, clean house.',
    textAr: 'وجدت مفتاحاً ذهبياً مزخرفاً موضوعاً على طاولة في بيت مشرق ونظيف.',
    emotion: 'joyful',
    timing: 'night',
  },
];

export const DreamInterpretationModal: React.FC<DreamInterpretationModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  initialDreamPrompt = '',
}) => {
  // Lock background scroll and return user to exact spot below Qibla Compass
  useModalScrollLock(isOpen, 'dream-interpretation-modal');

  const isArabic = typeof window !== 'undefined'
    ? (localStorage.getItem('noor_app_language') || 'ar') === 'ar'
    : true;

  const [dreamText, setDreamText] = useState(initialDreamPrompt);
  const [selectedEmotion, setSelectedEmotion] = useState('peaceful');
  const [selectedTiming, setSelectedTiming] = useState('sahar');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DreamInterpretationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'raw'>('structured');

  if (!isOpen) return null;

  const handleInterpret = async () => {
    if (!dreamText.trim() || dreamText.trim().length < 4) {
      setErrorMessage(
        isArabic
          ? 'يُرجى كتابة وصف المنام في بضع جمل واضحة.'
          : 'Please describe your dream in a few sentences.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl('/api/dream-interpretation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamDescription: dreamText.trim(),
          emotionalContext: selectedEmotion,
          timing: selectedTiming,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setErrorMessage(
          json.error ||
            (isArabic
              ? 'تعذر تأويل المنام حالياً. يُرجى المحاولة مرة أخرى.'
              : 'Failed to interpret dream. Please try again.')
        );
      }
    } catch {
      setErrorMessage(
        isArabic
          ? 'تعذر الاتصال بالخادم. يُرجى التحقق من اتصال الإنترنت والمحاولة ثانية.'
          : 'Network connection error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullFormattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_DREAMS)[0]) => {
    setDreamText(isArabic ? sample.textAr : sample.text);
    setSelectedEmotion(sample.emotion);
    setSelectedTiming(sample.timing);
    setResult(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setDreamText('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn select-none overscroll-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dream-modal-title"
    >
      <div
        id="dream-interpretation-dialog"
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`w-full max-w-2xl rounded-[32px] border shadow-2xl overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col overscroll-contain ${
          isDark
            ? 'bg-gradient-to-b from-[#0C1017] via-[#090C12] to-[#06080B] border-[#C9A063]/30 text-stone-100 shadow-[0_24px_70px_rgba(0,0,0,0.9)]'
            : 'bg-gradient-to-b from-[#FFFDF9] via-stone-50 to-stone-100 border-[#C9A063]/40 text-stone-900 shadow-2xl'
        }`}
      >
        {/* Luminous Top Gold Trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-85" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#C9A063]/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C9A063]/25 via-[#DFBA7F]/20 to-[#997334]/15 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.3)]">
              <Moon className="w-5 h-5 text-[#DFBA7F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="dream-modal-title" className="text-sm sm:text-base font-cinzel font-bold text-[#F5EFE6] tracking-wider">
                  {isArabic ? 'تفسير الرؤى والأحلام' : 'TAFSIR AL-AHLAM'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {isArabic ? 'منهج الإمام ابن سيرين' : 'Ibn Sirin Methodology'}
                </span>
              </div>
              <p className="text-[11px] text-[#DFBA7F] font-arabic mt-0.5" dir="rtl">
                تفسير الأحلام وفق منهج الإمام ابن سيرين والعلماء الأجلاء
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 bg-stone-800/40 hover:bg-stone-800/80 transition-colors cursor-pointer"
            aria-label="Close Dream Interpreter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Methodology Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
              isDark
                ? 'bg-[#101520]/80 border-[#C9A063]/20 text-stone-300'
                : 'bg-amber-50/80 border-[#C9A063]/30 text-amber-950'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#DFBA7F] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#DFBA7F]">
                {isArabic ? 'المنهج العلمي الاستقرائي: ' : 'Classical Analytical Process: '}
              </span>
              {isArabic
                ? 'يتم تعبير الرؤيا عبر سبع خطوات شرعية وتراثية أصيلة: استخراج الرموز، تحديد الموضوع، فحص السياق الوجداني، التأويل الراجح عند ابن سيرين، الأوجه والقرائن المحتملة، المراجع التراثية، وآداب وتوجيهات الهدي النبوي الشريف.'
                : 'Dreams are analyzed through 7 scholarly steps: Symbol Extraction, Topic Classification, Emotional Context, Primary Ibn Sirin Interpretation, Alternative Views, Scholarly Citations, and Prophetic Adab.'}
            </div>
          </div>

          {/* INPUT SECTION (Shown when no result or when editing) */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#DFBA7F] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {isArabic ? 'صِف ما رأيت في منامك بالتفصيل:' : 'Describe Your Dream (ماذا رأيت في المنام؟)'}
                </label>
                {dreamText && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                  >
                    {isArabic ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                rows={4}
                placeholder={isArabic
                  ? 'اكتب ما رأيته في المنام: الأشخاص، الكائنات، الأماكن، الألوان، الأفعال، وأبرز ما لفت انتباهك...'
                  : 'Describe what you saw in your dream: people, objects, animals, places, colors, actions, and what stood out most...'}
                className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border transition-all resize-none focus:outline-hidden ${
                  isDark
                    ? 'bg-[#0A0D14] border-[#C9A063]/30 text-stone-100 placeholder-stone-500 focus:border-[#DFBA7F] focus:ring-1 focus:ring-[#DFBA7F]/40'
                    : 'bg-white border-[#C9A063]/40 text-stone-900 placeholder-stone-400 focus:border-[#DFBA7F] focus:ring-1 focus:ring-[#DFBA7F]/40'
                }`}
              />
            </div>

            {/* Quick Sample Prompts */}
            {!result && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                  <span>{isArabic ? 'استكشف نماذج لرؤى شائعة:' : 'Explore sample visions:'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_DREAMS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#C9A063]/10 hover:bg-[#C9A063]/20 border border-[#C9A063]/30 text-[#DFBA7F] transition-all cursor-pointer"
                    >
                      {isArabic ? sample.titleAr : sample.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Context & Timing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Emotion Selector */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
                  {isArabic ? 'ما هو شعورك أثناء الرؤيا؟' : 'How did you feel? (الشعور أثناء الرؤيا)'}
                </label>
                <select
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-hidden ${
                    isDark
                      ? 'bg-[#0E1218] border-[#C9A063]/30 text-stone-200'
                      : 'bg-white border-[#C9A063]/40 text-stone-800'
                  }`}
                >
                  <option value="peaceful">{isArabic ? 'سكينة وطمأنينة وراحة' : 'Peaceful & Calm (سكينة وطمأنينة)'}</option>
                  <option value="joyful">{isArabic ? 'فرح واستبشار وسعادة' : 'Joyful & Glad Tidings (فرح واستبشار)'}</option>
                  <option value="fearful">{isArabic ? 'خوف أو قلق وتحذير' : 'Fearful or Anxious (خوف وتحذير)'}</option>
                  <option value="confused">{isArabic ? 'حيرة وتساؤل وعجب' : 'Confused or Puzzled (حيرة وتساؤل)'}</option>
                  <option value="sad">{isArabic ? 'حزن وشوق أو ضيق' : 'Sorrowful or Grieved (حزن وشوق)'}</option>
                </select>
              </div>

              {/* Timing Selector */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
                  {isArabic ? 'متى رأيت المنام؟' : 'When did the dream occur? (وقت الرؤيا)'}
                </label>
                <select
                  value={selectedTiming}
                  onChange={(e) => setSelectedTiming(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-hidden ${
                    isDark
                      ? 'bg-[#0E1218] border-[#C9A063]/30 text-stone-200'
                      : 'bg-white border-[#C9A063]/40 text-stone-800'
                  }`}
                >
                  <option value="sahar">{isArabic ? 'وقت السحر وقبيل الفجر (أصدق الرؤى)' : 'Pre-Dawn / Before Fajr (وقت السحر - Best)'}</option>
                  <option value="night">{isArabic ? 'في جوف الليل' : 'During the Night (في جوف الليل)'}</option>
                  <option value="qaylulah">{isArabic ? 'القيلولة بعد الظهر' : 'Afternoon Nap (القيلولة بعد الظهر)'}</option>
                  <option value="unknown">{isArabic ? 'غير محدد أو لا أذكر' : 'Unspecified / Unknown'}</option>
                </select>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleInterpret}
                disabled={isLoading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] hover:brightness-110 active:scale-98 text-[#080A0E] text-xs font-bold font-cinzel tracking-wider shadow-[0_4px_18px_rgba(201,160,99,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#080A0E]" />
                    <span>{isArabic ? 'جاري استنباط الدلالات وتأصيل الرؤيا...' : 'Analyzing Ibn Sirin Hermeneutics...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#080A0E]" />
                    <span>{isArabic ? 'تأويل الرؤيا المباركة' : 'Interpret Dream (تأويل الرؤيا)'}</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-3 rounded-2xl border border-[#C9A063]/40 bg-[#C9A063]/15 hover:bg-[#C9A063]/25 text-[#DFBA7F] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isArabic ? 'نسخ التحليل كاملاً' : 'Copy complete analysis'}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}</span>
                </button>
              )}
            </div>
          </div>

          {/* RESULTS VIEW */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-[#C9A063]/20 animate-fadeIn">
              {/* Tab Selector between Visual & Full Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#0E1218] p-1 rounded-xl border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('structured')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'structured'
                        ? 'bg-[#C9A063]/20 text-[#DFBA7F] font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {isArabic ? 'عرض تحليلي مفصل' : 'Structured View'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'raw'
                        ? 'bg-[#C9A063]/20 text-[#DFBA7F] font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {isArabic ? 'النص التراثي الكامل' : 'Classical Text Layout'}
                  </button>
                </div>

                <div className="text-[11px] text-stone-400">
                  {isArabic ? 'الموضوع: ' : 'Topic: '}<strong className="text-[#DFBA7F]">{result.topic}</strong>
                </div>
              </div>

              {activeTab === 'structured' ? (
                <div className="space-y-4">
                  {/* Step 1 & 2: Symbols & Key Elements */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#0E1218] border-[#C9A063]/25' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-[#DFBA7F]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F] font-mono">
                        {isArabic ? 'الرموز المستخرجة' : 'Symbols Detected (استخراج الرموز)'}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {result.symbolsDetected.map((sym, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 text-xs font-semibold"
                        >
                          ✦ {sym}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed font-light">
                      {result.keyElements}
                    </p>
                  </div>

                  {/* Step 3: Emotional Context Analysis */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#0E1218] border-white/5' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        {isArabic ? 'السياق الوجداني وتأثير الرؤيا' : 'Emotional Context (السياق الوجداني)'}
                      </h4>
                    </div>
                    <div className="text-xs text-stone-200 space-y-1 leading-relaxed">
                      <div>
                        <strong>{isArabic ? 'الحالة الشعورية: ' : 'Tenor: '}</strong>
                        <span className="text-[#DFBA7F]">{result.emotionalContext.emotion}</span>
                      </div>
                      <p>{result.emotionalContext.impact}</p>
                      <p className="text-stone-400 font-light italic">
                        {result.emotionalContext.psychologicalLayer}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Primary Interpretation (Ibn Sirin) */}
                  <div
                    className={`p-5 rounded-2xl border ${
                      isDark
                        ? 'bg-gradient-to-br from-[#121824] via-[#0E131C] to-[#0A0D14] border-[#DFBA7F]/40 shadow-lg'
                        : 'bg-amber-50/90 border-[#DFBA7F]/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-5 h-5 text-[#DFBA7F]" />
                      <h3 className="text-sm font-bold font-serif-heading text-[#F5EFE6]">
                        {isArabic ? 'التأويل الراجح عند ابن سيرين' : 'Primary Interpretation (التأويل الراجح عند ابن سيرين)'}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-200 font-medium leading-relaxed mb-3">
                      {result.primaryInterpretation.text}
                    </p>

                    <div className="p-3 rounded-xl bg-[#090C10]/80 border border-[#C9A063]/25 text-xs text-stone-300 space-y-1.5">
                      <div>
                        <strong className="text-[#DFBA7F]">
                          {isArabic ? 'العلة والتأصيل التراثي: ' : 'Scholarly Reasoning (العلة والتأصيل): '}
                        </strong>
                        {result.primaryInterpretation.why}
                      </div>
                      {result.primaryInterpretation.supportingEvidence && (
                        <div className="pt-1 border-t border-white/5 text-[11px] text-[#DFBA7F]">
                          <strong>{isArabic ? 'الشاهد والدليل: ' : 'Evidence: '}</strong>
                          {result.primaryInterpretation.supportingEvidence}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 5: Alternative Interpretations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFBA7F] font-mono flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      {isArabic ? 'التأويلات والوجوه المحتملة الأخرى' : 'Alternative Interpretations (التأويلات والوجوه الأخرى)'}
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {result.alternativeInterpretations.map((alt, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                            isDark ? 'bg-[#0E1218] border-white/5' : 'bg-white border-stone-200'
                          }`}
                        >
                          <div className="font-bold text-[#DFBA7F] text-xs mb-1">
                            {idx + 1}️⃣ {alt.title}
                          </div>
                          <div className="text-stone-300 mb-1.5">{alt.why}</div>
                          <div className="text-[11px] text-stone-400 bg-white/5 p-2 rounded-xl border border-white/5">
                            <span className="text-[#DFBA7F] font-semibold">
                              {isArabic ? 'أرجح في حال: ' : 'Most likely if: '}
                            </span>
                            {alt.mostLikelyIf}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 6: Scholarly References */}
                  <div
                    className={`p-4 rounded-2xl border text-xs ${
                      isDark ? 'bg-[#0E1218] border-white/5' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="font-bold text-[#DFBA7F] mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {isArabic ? 'المراجع والمصادر المعتمدة' : 'Scholarly References (المراجع المعتمدة)'}
                    </div>
                    <ul className="space-y-1.5 text-stone-300 text-[11px]">
                      {result.scholarlyReferences.map((ref, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#DFBA7F]">✦</span>
                          <span>{ref}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step 7: Important Notes & Prophetic Adab */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      {isArabic ? 'آداب الرؤى والتوجيه النبوي الشريف' : 'Prophetic Adab & Guidance (آداب الرؤى والأحلام)'}
                    </div>
                    <ul className="space-y-1 text-[11px] text-stone-300">
                      {result.importantNotes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Raw Exact Template Output View */
                <div className="relative">
                  <pre
                    className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border overflow-x-auto ${
                      isDark ? 'bg-[#06080B] border-[#C9A063]/30 text-stone-200' : 'bg-stone-900 border-stone-700 text-stone-100'
                    }`}
                  >
                    {result.fullFormattedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 border-t border-[#C9A063]/15 flex items-center justify-between bg-[#080B10]/80 shrink-0">
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DFBA7F]" />
            <span>{isArabic ? 'بواسطة ذكاء نور الاصطناعي · مجموعة النور' : 'Powered by Noor AI · ALNOOR GROUP'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#080A0E] text-xs font-bold hover:brightness-110 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            {isArabic ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
