import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Volume2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import { loadArabicProgress } from '../../utils/arabicStorage';
import { speakArabic } from '../../utils/arabicSpeech';
import { getLanguageHeaders } from '../../utils/i18n';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';
import { Skeleton } from '../SkeletonLoaders';

interface PersonalAITeacherViewProps {
  isDark: boolean;
  language?: string;
}

interface TeacherChatMsg {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  transliteration?: string;
  translation?: string;
  topicTag?: string;
}

export const PersonalAITeacherView: React.FC<PersonalAITeacherViewProps> = ({ isDark, language }) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [progress, setProgress] = useState(() => loadArabicProgress());
  const [messages, setMessages] = useState<TeacherChatMsg[]>([
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: 'مَرْحَبًا بِكَ يَا طَالِبَ العِلْمِ! أَنَا مُعَلِّمُكَ الخَاصّ لِلُّغَةِ العَرَبِيَّةِ. أَنَا هُنَا لِمُسَاعَدَتِكَ فِي النَّحْوِ، وَالصَّرْفِ، وَتَحْلِيلِ الجُذُورِ، وَتَصْحِيحِ الأَخْطَاءِ.',
      transliteration: 'Marḥaban bika yā ṭāliba al-‘ilm! Anā mu‘allimuka al-khāṣṣ li-lughati al-‘arabiyyah. Anā hunā li-musā‘adatika fī an-naḥw, wa aṣ-ṣarf, wa taḥlīli al-judhūr, wa taṣḥīḥi al-akhṭā’.',
      translation: 'Welcome, student of knowledge! I am your personal Arabic language master tutor. I am here to assist you in grammar (Nahw), morphology (Sarf), root analysis, and mistake review.',
      topicTag: 'Orientation',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInquiryTopic, setSelectedInquiryTopic] = useState<
    'nahw' | 'sarf' | 'tashkeel' | 'roots' | 'sentence' | 'dialect_vs_msa'
  >('nahw');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const inquiryCategories = [
    { id: 'nahw', label: 'Grammar (النحو)', prompt: 'Explain the rules of nominative (Marfoo), accusative (Mansoub), and genitive (Majroor) cases.' },
    { id: 'sarf', label: 'Morphology (الصرف)', prompt: 'How does the 10-form verb system (Wazn) transform meanings from base tri-literal roots?' },
    { id: 'tashkeel', label: 'Tashkeel (التشكيل)', prompt: 'Explain how ending short vowels change based on the grammatical role (I‘rab) of the word.' },
    { id: 'roots', label: 'Root System (الجذور)', prompt: 'Show me how words like كَتَبَ, كِتَاب, مَكْتَبَة, and كَاتِب all stem from the root K-T-B.' },
    { id: 'sentence', label: 'Sentence Types (الجملة)', prompt: 'What is the exact difference between a Nominal sentence (جملة اسمية) and a Verbal sentence (جملة فعلية)?' },
    { id: 'dialect_vs_msa', label: 'Dialect vs MSA (فصحى)', prompt: 'How does Modern Standard Arabic (Fusha) differ from regional spoken dialects like Egyptian, Levantine, or Gulf?' },
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputVal).trim();
    if (!promptToSend || isLoading) return;

    const userMsg: TeacherChatMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      topicTag: selectedInquiryTopic,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/study/tutor', {
        method: 'POST',
        headers: getLanguageHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          language: activeLang,
          message: `User asked their Personal Arabic Master Tutor: "${promptToSend}".
Topic: ${selectedInquiryTopic}
User's current profile:
- Reading Level: ${progress.readingLevel}
- Known weak letters: ${progress.weakLetters.join(', ') || 'None'}
- Known weak vocabulary: ${progress.weakVocabulary.join(', ') || 'None'}
- Arabic IQ: ${progress.arabicIQScore}
Answer in the user's selected language (${activeLang}) with deep pedagogical clarity. Include:
1. Arabic examples with full Tashkeel (vowel marks).
2. Word-by-word transliteration & translation in the user's selected language (${activeLang}).
3. Crystal-clear morphological or grammatical breakdown.
Keep tone respectful, scholarly, and supportive.`,
          history: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          mode: 'general',
          subject: 'Personal Arabic Language Teacher',
        }),
      });

      if (!response.ok) throw new Error('Tutor unavailable');
      const data = await response.json();
      const raw = data.reply || data.result || data.answer || 'مُمْتَاز! هَذَا سُؤَالٌ دَقِيقٌ فِي اللُّغَةِ العَرَبِيَّةِ.';

      const tutorMsg: TeacherChatMsg = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: raw,
        topicTag: selectedInquiryTopic,
      };

      setMessages(prev => [...prev, tutorMsg]);
    } catch (err) {
      console.warn('Teacher AI fallback:', err);
      const fallbackMsg: TeacherChatMsg = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: 'فِي اللُّغَةِ العَرَبِيَّةِ، يُبْنَى المَعْنَى عَلَى أَصْلِ الجَذْرِ الثُّلَاثِيِّ وَحَرَكَاتِ الإِعْرَابِ. هَلْ تُرِيدُ أَنْ نُفَصِّلَ مِثَالًا؟',
        translation: 'In the Arabic language, meaning is built upon the tri-literal root and inflectional vowels. Would you like us to examine a specific example together?',
        topicTag: 'General Grammar',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
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
                <GraduationCap className="w-3.5 h-3.5" />
                Personal Arabic Master Tutor
              </span>
              <span className="text-xs text-stone-500">Adaptive Linguistic Pedagogy</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Noor Personal Arabic Teacher
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Ask deep questions about Arabic grammar (Naḥw), word derivation (Ṣarf), vocalization rules (Tashkīl), roots, and dialects.
            </p>
          </div>

          {/* Student Profile Snapshot Badge */}
          <div className="p-3 rounded-xl bg-stone-500/5 border border-white/5 text-xs text-stone-400 flex items-center gap-4">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block">Level</span>
              <span className="text-stone-200 font-semibold capitalize font-serif">{progress.readingLevel}</span>
            </div>
            <div className="border-l border-white/5 pl-4">
              <span className="text-[10px] text-stone-500 uppercase block">Weak Letters</span>
              <span className="text-amber-400 font-semibold font-serif">
                {progress.weakLetters.length ? progress.weakLetters.length : '0 identified'}
              </span>
            </div>
            <div className="border-l border-white/5 pl-4">
              <span className="text-[10px] text-stone-500 uppercase block">Arabic IQ</span>
              <span className="text-[#DFBA7F] font-semibold font-serif">{progress.arabicIQScore}</span>
            </div>
          </div>
        </div>

        {/* Quick Curriculum Inquiries */}
        <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-white/5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {inquiryCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedInquiryTopic(cat.id as any);
                handleSend(cat.prompt);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
                selectedInquiryTopic === cat.id
                  ? 'border-[#C9A063] bg-[#C9A063]/20 text-[#DFBA7F]'
                  : isDark
                  ? 'border-white/5 bg-white/5 text-stone-400 hover:text-stone-200'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Lightbulb className="w-3 h-3 text-[#DFBA7F]" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tutor Conversation Window */}
      <div
        className={`rounded-2xl border flex flex-col h-[520px] overflow-hidden ${
          isDark ? 'bg-[#101318] border-white/5' : 'bg-white border-stone-200 shadow-sm'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => {
            const isTutor = msg.sender === 'tutor';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isTutor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isTutor && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFBA7F] to-[#C9A063] flex items-center justify-center text-[#080A0E] text-xs font-bold flex-shrink-0 mt-1 shadow-xs">
                    ن
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border text-sm space-y-2 leading-relaxed ${
                    isTutor
                      ? isDark
                        ? 'bg-stone-900/80 border-white/5 text-stone-200'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                      : 'bg-[#C9A063]/20 border-[#C9A063]/30 text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-[#DFBA7F]">
                      {isTutor ? 'Noor Personal Arabic Teacher' : 'You'}
                    </span>
                    <div className="flex items-center gap-2">
                      {isTutor && (
                        <button
                          onClick={() => speakArabic(msg.text)}
                          className="p-1 rounded-md text-stone-400 hover:text-[#DFBA7F] transition-colors flex items-center gap-1 text-[11px]"
                          title="Listen in Arabic"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </button>
                      )}
                      {msg.topicTag && (
                        <span className="px-2 py-0.5 text-[10px] rounded-md bg-stone-500/10 text-stone-400">
                          {msg.topicTag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap select-text text-stone-100">
                    {msg.text}
                  </div>

                  {msg.translation && (
                    <p className="text-xs text-stone-400 italic border-t border-white/5 pt-2">
                      {msg.translation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md mr-auto w-full animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-[#DFBA7F] flex items-center justify-center text-[#080A0E] text-xs font-bold shrink-0">
                ن
              </div>
              <div className={`p-4 rounded-2xl border text-xs flex-1 space-y-2.5 ${
                isDark ? 'bg-stone-900/80 border-white/10' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-pulse" />
                  <span className="text-[11px] text-[#DFBA7F] font-semibold">Teacher is composing your lesson...</span>
                </div>
                <Skeleton className="h-3.5 w-[92%] rounded-md" isDark={isDark} />
                <Skeleton className="h-3.5 w-[75%] rounded-md" isDark={isDark} />
                <Skeleton className="h-3.5 w-[55%] rounded-md" isDark={isDark} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200/50 dark:border-white/5 bg-black/20 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your Arabic teacher about grammar, roots, Tashkeel, or mistakes..."
            className={`flex-1 px-4 py-3 rounded-2xl border text-sm focus:outline-hidden ${
              isDark
                ? 'bg-stone-900 border-white/10 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-90 disabled:opacity-30 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
