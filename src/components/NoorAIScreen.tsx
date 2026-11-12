import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  Copy,
  History,
  MessageSquare,
  Lock,
  X,
  Volume2,
  VolumeX,
  Radio,
  Settings,
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import { NoorAIResponseSkeleton } from './SkeletonLoaders';
import {
  NoorAIMessage,
  UserStats,
} from '../types';
import { LiveVoiceModal } from './LiveVoiceModal';
import { TTSPlayer, LiveTranscriptEntry } from '../utils/audioLiveManager';
import { t, getLanguageCode, getGlobalLanguage } from '../utils/i18n';
import { getApiUrl } from '../utils/apiConfig';

export const getInitialWelcomeMessage = (isArabic: boolean): NoorAIMessage => ({
  id: 'welcome-initial',
  sender: 'noor',
  text: isArabic
    ? "السلام عليكم ورحمة الله وبركاته. مرحباً بكم في رحاب نور. أنا رفيقكم الإسلامي الهادئ، يسعدني الإجابة عن تساؤلاتكم وتدارس العلوم النافعة بكل وضوح وسكينة. كيف يمكنني إعانتكم اليوم؟"
    : "Assalamu Alaikum wa Rahmatullahi wa Barakatuh. Welcome! I am Noor, your peaceful Islamic companion. How may I assist your reflection and learning today?",
  timestamp: isArabic ? 'الآن' : 'Just now',
});

export const DEFAULT_WELCOME_MESSAGE: NoorAIMessage = getInitialWelcomeMessage(true);

interface NoorAIScreenProps {
  isDark: boolean;
  initialPrompt?: string;
  userStats?: UserStats;
  onUpdateStats?: (stats: Partial<UserStats>) => void;
  messages?: NoorAIMessage[];
  onUpdateMessages?: (messages: NoorAIMessage[]) => void;
}

export const NoorAIScreen: React.FC<NoorAIScreenProps> = ({
  isDark,
  initialPrompt,
  userStats,
  onUpdateStats,
  messages: externalMessages,
  onUpdateMessages,
}) => {
  const lang = getLanguageCode(userStats?.language);
  const isArabic = lang === 'ar';
  // Extract or initialize sessions
  const existingSessions = userStats?.noorAiSessions || [];
  const currentActiveId = userStats?.activeNoorSessionId;

  // Find or create active session
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (currentActiveId && existingSessions.some((s) => s.id === currentActiveId)) {
      return currentActiveId;
    }
    if (existingSessions.length > 0) {
      return existingSessions[0].id;
    }
    return `session-${Date.now()}`;
  });

  // Current session messages
  const currentSession = existingSessions.find((s) => s.id === activeSessionId);
  const activeMessages = currentSession
    ? currentSession.messages
    : externalMessages && externalMessages.length > 0
    ? externalMessages
    : [];

  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [expandedExplainMore, setExpandedExplainMore] = useState<Record<string, boolean>>({});
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState<boolean>(false);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Zephyr');
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);
  const [isTtsLoadingId, setIsTtsLoadingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsStopFnRef = useRef<(() => void) | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, isLoading]);

  // Handle external initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isArabic ? 'ar-SA' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isArabic]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast(isArabic ? 'الإدخال الصوتي غير مدعوم في هذا المتصفح.' : 'Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to persist updated messages to session list
  const persistSessionMessages = (
    sessId: string,
    newMessages: NoorAIMessage[],
    customTitle?: string
  ) => {
    const now = new Date().toISOString();
    let sessions = [...(userStats?.noorAiSessions || [])];
    const existingIndex = sessions.findIndex((s) => s.id === sessId);

    // Generate smart title from user's first question if not provided
    let title = customTitle;
    if (!title) {
      const firstUserMsg = newMessages.find((m) => m.sender === 'user');
      if (firstUserMsg) {
        title = firstUserMsg.text.slice(0, 32);
        if (firstUserMsg.text.length > 32) title += '...';
      } else {
        title = isArabic ? 'محادثة إسلامية' : 'Islamic Guidance';
      }
    }

    if (existingIndex >= 0) {
      sessions[existingIndex] = {
        ...sessions[existingIndex],
        title: sessions[existingIndex].title !== 'New Conversation' && sessions[existingIndex].title !== 'محادثة جديدة' ? sessions[existingIndex].title : title,
        updatedAt: now,
        messages: newMessages,
      };
    } else {
      sessions.unshift({
        id: sessId,
        title: title || (isArabic ? 'محادثة إسلامية' : 'Islamic Conversation'),
        createdAt: now,
        updatedAt: now,
        messages: newMessages,
      });
    }

    if (onUpdateStats) {
      onUpdateStats({
        noorAiSessions: sessions,
        activeNoorSessionId: sessId,
        noorAiConversation: newMessages, // backward compatibility
      });
    }
    if (onUpdateMessages) {
      onUpdateMessages(newMessages);
    }
  };

  // Handle Text-to-Speech (TTS) for individual Noor AI responses
  const handleToggleTTS = async (msg: NoorAIMessage) => {
    if (playingTtsId === msg.id) {
      if (ttsStopFnRef.current) {
        ttsStopFnRef.current();
        ttsStopFnRef.current = null;
      }
      TTSPlayer.stop();
      setPlayingTtsId(null);
      return;
    }

    if (ttsStopFnRef.current) {
      ttsStopFnRef.current();
      ttsStopFnRef.current = null;
    }
    TTSPlayer.stop();

    setIsTtsLoadingId(msg.id);

    // Prepare speech text
    const textToRead = [
      msg.text || '',
      msg.explanation ? (isArabic ? `البيان: ${msg.explanation}` : `Explanation: ${msg.explanation}`) : '',
      msg.concludingDua ? (isArabic ? `الدعاء: ${msg.concludingDua}` : `Supplication: ${msg.concludingDua}`) : '',
    ]
      .filter(Boolean)
      .join('. ');

    const stopFn = await TTSPlayer.playText(
      textToRead,
      activeVoiceName,
      () => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(msg.id);
      },
      () => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(null);
        ttsStopFnRef.current = null;
      },
      (err) => {
        setIsTtsLoadingId(null);
        setPlayingTtsId(null);
        showToast(isArabic ? `تعذر تشغيل الصوت: ${err}` : `Voice audio: ${err}`);
      }
    );
    ttsStopFnRef.current = stopFn;
  };

  // Save live voice transcripts to conversation session
  const handleLiveSessionTranscripts = (liveEntries: LiveTranscriptEntry[]) => {
    if (!liveEntries || liveEntries.length === 0) return;

    const newMsgs: NoorAIMessage[] = liveEntries.map((entry) => ({
      id: entry.id,
      sender: entry.sender === 'user' ? 'user' : 'noor',
      text: entry.text,
      timestamp: entry.timestamp || (isArabic ? 'الآن' : 'Just now'),
      sourceVerification:
        entry.sender === 'noor'
          ? (isArabic ? 'محادثة صوتية حية ومباشرة' : 'Live Voice Conversation')
          : undefined,
    }));

    const updatedMessages = [...activeMessages, ...newMsgs];
    persistSessionMessages(activeSessionId, updatedMessages, isArabic ? 'محادثة صوتية حية' : 'Live Voice Talk');
    showToast(isArabic ? 'تم حفظ المحادثة الصوتية في السجل بنجاح' : 'Live voice conversation saved to chat history');
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setLastFailedQuery(null);

    const userMessage: NoorAIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: isArabic ? 'الآن' : 'Just now',
    };

    const newHistory = [...activeMessages, userMessage];
    persistSessionMessages(activeSessionId, newHistory);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/noor-ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-language': getGlobalLanguage(),
          'x-language': getGlobalLanguage(),
        },
        body: JSON.stringify({
          question: textToSend,
          conversationHistory: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
          language: getGlobalLanguage(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const noorReply = data.data;

        const noorMessage: NoorAIMessage = {
          id: `noor-${Date.now()}`,
          sender: 'noor',
          text: noorReply.directAnswer || (isArabic ? 'طلب العلم الشرعي بإخلاص وسكينة من أعظم القربات.' : 'Seeking knowledge with sincerity is deeply rewarded.'),
          timestamp: isArabic ? 'الآن' : 'Just now',
        };

        const updatedWithNoor = [...newHistory, noorMessage];
        persistSessionMessages(activeSessionId, updatedWithNoor, noorReply.suggestedTitle);
      } else {
        throw new Error('API returned unformatted response');
      }
    } catch (err) {
      console.error('Error fetching Noor AI:', err);
      setErrorMessage(isArabic ? 'تعذر إتمام الإجابة حالياً، يرجى المحاولة مرة أخرى.' : "I couldn't complete that answer right now. Please try again.");
      setLastFailedQuery(textToSend);

      // Add graceful error message with retry
      const errorReply: NoorAIMessage = {
        id: `noor-err-${Date.now()}`,
        sender: 'noor',
        text: isArabic
          ? 'تعذر إتمام الإجابة حالياً بسبب انقطاع الاتصال بالشبكة. يرجى الضغط على زر إعادة المحاولة.'
          : "I couldn't complete that answer right now due to a network connection issue. Please tap 'Retry' below.",
        isError: true,
        timestamp: isArabic ? 'الآن' : 'Just now',
      };
      persistSessionMessages(activeSessionId, [...newHistory, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      // Remove the last error message
      const filtered = activeMessages.filter((m) => !m.isError);
      persistSessionMessages(activeSessionId, filtered);
      handleSendMessage(lastFailedQuery);
    }
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    persistSessionMessages(newId, [], isArabic ? 'محادثة جديدة' : 'New Conversation');
    setInputQuery('');
    setShowHistoryDrawer(false);
    showToast(isArabic ? 'بدء محادثة جديدة.' : 'Started a new conversation.');
  };

  const handleSwitchSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const target = userStats?.noorAiSessions?.find((s) => s.id === sessionId);
    if (target && onUpdateStats) {
      onUpdateStats({
        activeNoorSessionId: sessionId,
        noorAiConversation: target.messages,
      });
    }
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let sessions = [...(userStats?.noorAiSessions || [])];
    sessions = sessions.filter((s) => s.id !== sessionId);

    let nextActiveId = activeSessionId;
    if (activeSessionId === sessionId) {
      nextActiveId = sessions.length > 0 ? sessions[0].id : `session-${Date.now()}`;
      setActiveSessionId(nextActiveId);
    }

    const nextMessages = sessions.find((s) => s.id === nextActiveId)?.messages || [];

    if (onUpdateStats) {
      onUpdateStats({
        noorAiSessions: sessions,
        activeNoorSessionId: nextActiveId,
        noorAiConversation: nextMessages,
      });
    }
    setSessionToDelete(null);
    showToast(isArabic ? 'تم حذف المحادثة.' : 'Conversation deleted.');
  };

  const handleClearCurrentConversation = () => {
    persistSessionMessages(activeSessionId, []);
    setShowClearConfirmModal(false);
    showToast(isArabic ? 'تم مسح المحادثة بنجاح.' : 'Conversation cleared.');
  };

  const handleFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
    const updated = activeMessages.map((m) => {
      if (m.id === msgId) {
        const newFeedback = m.feedback === type ? undefined : type;
        return { ...m, feedback: newFeedback };
      }
      return m;
    });
    persistSessionMessages(activeSessionId, updated);
    showToast(type === 'helpful' ? (isArabic ? 'شكراً لتقييمك الكريم! ♡' : 'Thank you for your feedback! ♡') : (isArabic ? 'تم تسجيل رأيك وملاحظتك.' : 'Feedback noted.'));
  };

  const handleToggleSave = (msg: NoorAIMessage) => {
    const isNowSaved = !msg.isSaved;
    const updatedMessages = activeMessages.map((m) =>
      m.id === msg.id ? { ...m, isSaved: isNowSaved } : m
    );
    persistSessionMessages(activeSessionId, updatedMessages);

    // Also update savedNoorMessages collection in userStats
    if (onUpdateStats && userStats) {
      let saved = [...(userStats.savedNoorMessages || [])];
      if (isNowSaved) {
        if (!saved.some((s) => s.id === msg.id)) {
          saved.push({ ...msg, isSaved: true });
        }
      } else {
        saved = saved.filter((s) => s.id !== msg.id);
      }
      onUpdateStats({ savedNoorMessages: saved });
    }

    showToast(isNowSaved ? (isArabic ? 'تم الحفظ في مجموعتك 🔖' : 'Saved to your Noor collection 🔖') : (isArabic ? 'تمت الإزالة من المحفوظات' : 'Removed from saved answers.'));
  };

  const handleCopyMessage = (msg: NoorAIMessage) => {
    let fullText = '';
    if (msg.greeting) {
      fullText += `${msg.greeting}\n\n`;
    }
    fullText += msg.text;
    navigator.clipboard.writeText(fullText);
    setCopiedId(msg.id);
    showToast(isArabic ? 'تم النسخ إلى الحافظة 📋' : 'Copied to clipboard 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareMessage = async (msg: NoorAIMessage) => {
    const textToShare = `${msg.greeting ? msg.greeting + '\n\n' : ''}${msg.text}\n\n— ${isArabic ? 'مشارك من تطبيق نور' : 'Shared from Noor AI'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isArabic ? 'نور - الهداية والعلم النافع' : 'Noor AI - Islamic Guidance',
          text: textToShare,
        });
      } catch {
        handleCopyMessage(msg);
      }
    } else {
      handleCopyMessage(msg);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleExplainMore = (msgId: string) => {
    setExpandedExplainMore((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };



  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-6 pt-2 pb-2 sm:pb-3 relative animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#090B0E]/98 text-[#DFBA7F] border border-[#DFBA7F]/40 shadow-md text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#DFBA7F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar with Verified Badge, History & New Chat */}
      <div
        id="noor-ai-top-header"
        className={`p-2.5 sm:p-3 pr-14 lg:pr-3 rounded-2xl border flex items-center justify-between mb-2.5 sm:mb-3 shrink-0 transition-all duration-200 ${
          isDark
            ? 'bg-black/25 backdrop-blur-md border-[#C9A063]/25 shadow-sm'
            : 'bg-white/80 backdrop-blur-md border-[#C9A063]/25 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center shadow-md font-bold shrink-0">
            <NoorAIIcon className="w-4 h-4 text-[#090B0E]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h2
                className={`text-xs sm:text-sm font-bold tracking-wider ${
                  isArabic ? 'font-serif-heading' : 'font-cinzel'
                } ${
                  isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
                }`}
              >
                {isArabic ? 'نور الإسلامي' : 'NOOR AI'}
              </h2>
              <span className="hidden xs:flex items-center gap-0.5 text-[9px] font-semibold text-[#DFBA7F] bg-[#C9A063]/10 px-1.5 py-0.5 rounded-full border border-[#C9A063]/25 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" />
                {t(lang, 'verifiedSources')}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 truncate max-w-[130px] sm:max-w-[280px]">
              {currentSession?.title || t(lang, 'noorAiTitle')}
            </p>
          </div>
        </div>

        {/* Action Controls: Live Voice, History, New Chat, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="open-live-voice-btn"
            onClick={() => setShowLiveVoiceModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] hover:brightness-110 text-[#090B0E] text-[11px] font-bold shadow-md transition-all active:scale-95 animate-pulse"
            title={isArabic ? 'محادثة صوتية حية ومباشرة' : 'Open Real-time Live Voice Talk'}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(lang, 'liveVoice')}</span>
            <span className="sm:hidden">{isArabic ? 'مباشر' : 'Live'}</span>
          </button>

          <button
            id="open-history-btn"
            onClick={() => setShowHistoryDrawer(true)}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-stone-800/40 border-stone-700/60 text-stone-300 hover:text-white hover:bg-stone-800/80'
                : 'bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
            title={isArabic ? 'سجل المحادثات' : 'Conversation History'}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">{t(lang, 'history')}</span>
          </button>

          <button
            id="new-chat-btn"
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#C9A063]/20 to-[#DFBA7F]/20 hover:from-[#C9A063]/30 hover:to-[#DFBA7F]/30 text-[#DFBA7F] text-[11px] font-semibold border border-[#C9A063]/35 transition-all active:scale-95 shadow-2xs"
            title={isArabic ? 'بدء محادثة جديدة' : 'Start a new chat'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(lang, 'newChat')}</span>
          </button>

          <button
            id="noor-ai-settings-btn"
            onClick={() => setShowSettingsModal(true)}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs transition-all flex items-center gap-1 ${
              isDark
                ? 'bg-stone-800/40 border-stone-700/60 text-stone-300 hover:text-[#DFBA7F] hover:border-[#DFBA7F]/40 hover:bg-stone-800/80'
                : 'bg-stone-100 border-stone-200 text-stone-700 hover:text-[#B88E4F] hover:border-[#C9A063]/40 hover:bg-stone-200'
            }`}
            title={isArabic ? 'إعدادات نور والخصوصية' : 'Noor AI Settings & Privacy'}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">
              {isArabic ? 'الإعدادات' : 'Settings'}
            </span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
        {/* Brand New User / Zero-Conversation Sanctuary Header (Clean, without suggestion cards) */}
        {activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fadeIn px-2 my-auto">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] flex items-center justify-center text-[#090B0E] shadow-[0_8px_32px_rgba(201,160,99,0.4)] animate-pulse">
                <NoorAIIcon className="w-8 h-8 text-[#090B0E]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0E1217] border-2 border-[#DFBA7F] flex items-center justify-center text-[#DFBA7F]">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>

            <h3
              className={`font-serif-heading font-bold text-lg sm:text-xl mb-1.5 ${
                isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
              }`}
            >
              {t(lang, 'noorAiHeader')}
            </h3>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              {t(lang, 'noorAiSubheader')}
            </p>
          </div>
        ) : (
          activeMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSaved = msg.isSaved || userStats?.savedNoorMessages?.some((s) => s.id === msg.id);

            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                {/* User Message (Floating Liquid Glass Bubble) */}
                {isUser ? (
                  <div className="max-w-[88%] sm:max-w-[80%] rounded-3xl rounded-br-xs px-4 py-3 bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] font-medium border border-[#DFBA7F]/40 shadow-md">
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                ) : (
                  /* Noor AI Response (Conversational, borderless & background-free) */
                  <div className="w-full max-w-[98%] sm:max-w-[94%] py-1.5 animate-fadeIn">
                    {/* Error State with Retry */}
                    {msg.isError ? (
                      <div className="space-y-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{isArabic ? 'انقطع الاتصال' : 'Response Interrupted'}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-stone-300">{msg.text}</p>
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'إعادة المحاولة' : 'Retry'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Conversational Row: Small Noor insignia + Pure Text with NO inner box background */}
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center shadow-xs shrink-0 mt-0.5 select-none">
                            <NoorAIIcon className="w-3.5 h-3.5 text-[#090B0E]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Concise direct answer without any inner box background */}
                            <div className="text-xs sm:text-sm leading-relaxed font-normal whitespace-pre-wrap">
                              <span className={isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}>
                                {msg.text}
                              </span>
                            </div>

                            {/* Minimal conversational action toolbar (no inner card boxes) */}
                            <div className="pt-2 mt-1 flex items-center justify-between text-[11px] text-stone-400/90 select-none">
                              <div className="flex items-center gap-1">
                                {/* Helpful ♡ */}
                                <button
                                  onClick={() => handleFeedback(msg.id, 'helpful')}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    msg.feedback === 'helpful'
                                      ? 'text-[#DFBA7F] font-semibold'
                                      : 'hover:text-stone-200 text-stone-400'
                                  }`}
                                  title={isArabic ? 'إجابة نافعة' : 'Helpful response'}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span className="text-[10px]">{isArabic ? 'نافع' : 'Helpful'}</span>
                                </button>

                                {/* Not helpful 👎 */}
                                <button
                                  onClick={() => handleFeedback(msg.id, 'unhelpful')}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    msg.feedback === 'unhelpful'
                                      ? 'text-stone-300 font-semibold'
                                      : 'hover:text-stone-200 text-stone-400'
                                  }`}
                                  title={isArabic ? 'غير دقيق' : 'Not helpful'}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Read Aloud / TTS Voice 🔊 */}
                                <button
                                  onClick={() => handleToggleTTS(msg)}
                                  disabled={isTtsLoadingId === msg.id}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    playingTtsId === msg.id
                                      ? 'text-[#DFBA7F] font-bold animate-pulse'
                                      : 'hover:text-[#DFBA7F] text-stone-400'
                                  }`}
                                  title={
                                    playingTtsId === msg.id
                                      ? (isArabic ? 'إيقاف الصوت' : 'Stop audio')
                                      : (isArabic ? 'استماع للإجابة بصوت هادئ' : 'Listen to response with tranquil AI voice')
                                  }
                                >
                                  {isTtsLoadingId === msg.id ? (
                                    <div className="w-3.5 h-3.5 border-2 border-[#DFBA7F] border-t-transparent rounded-full animate-spin" />
                                  ) : playingTtsId === msg.id ? (
                                    <VolumeX className="w-3.5 h-3.5 text-[#DFBA7F]" />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                  )}
                                  <span className="text-[10px]">
                                    {isTtsLoadingId === msg.id
                                      ? (isArabic ? '...' : '...')
                                      : playingTtsId === msg.id
                                      ? (isArabic ? 'تشغيل' : 'Playing')
                                      : (isArabic ? 'استماع' : 'Listen')}
                                  </span>
                                </button>

                                {/* Save / Bookmark 🔖 */}
                                <button
                                  onClick={() => handleToggleSave(msg)}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    isSaved
                                      ? 'text-[#DFBA7F]'
                                      : 'hover:text-stone-200 text-stone-400'
                                  }`}
                                  title={isSaved ? (isArabic ? 'محفوظ في العلامات' : 'Saved to bookmarks') : (isArabic ? 'حفظ الإجابة' : 'Save response')}
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="w-3.5 h-3.5 text-[#DFBA7F]" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Copy 📋 */}
                                <button
                                  onClick={() => handleCopyMessage(msg)}
                                  className="p-1.5 rounded-lg hover:text-[#DFBA7F] text-stone-400 transition-all cursor-pointer"
                                  title={isArabic ? 'نسخ الإجابة كاملة' : 'Copy answer'}
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-[#DFBA7F]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Share ↗ */}
                                <button
                                  onClick={() => handleShareMessage(msg)}
                                  className="p-1.5 rounded-lg hover:text-[#DFBA7F] text-stone-400 transition-all cursor-pointer"
                                  title={isArabic ? 'مشاركة الإجابة' : 'Share answer'}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-stone-400 mt-1 px-2">{msg.timestamp}</span>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="py-2">
            <NoorAIResponseSkeleton isDark={isDark} isArabic={isArabic} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Liquid Glass Message Composer (Translucent so background shows through) */}
      <div className="mt-auto pt-2 pb-1 shrink-0 relative z-20 bg-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={isListening ? t(lang, 'listening') : t(lang, 'askPlaceholder')}
            disabled={isLoading}
            className={`w-full pl-4.5 pr-32 sm:pr-36 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A063]/50 shadow-md ${
              isListening
                ? 'ring-2 ring-red-500/50 bg-red-500/10'
                : ''
            } ${
              isDark
                ? 'bg-black/25 backdrop-blur-xl border-[#DFBA7F]/35 text-white placeholder-stone-400 shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
                : 'bg-white/70 backdrop-blur-xl border-[#C9A063]/35 text-stone-900 placeholder-stone-500 shadow-[0_8px_32px_rgba(201,160,99,0.12)]'
            }`}
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {/* 🎙️ Live Voice Talk Launcher */}
            <button
              type="button"
              onClick={() => setShowLiveVoiceModal(true)}
              className="w-8 h-8 rounded-xl bg-[#DFBA7F]/20 hover:bg-[#DFBA7F]/30 border border-[#DFBA7F]/40 text-[#DFBA7F] flex items-center justify-center transition-all active:scale-95 shadow-2xs"
              title={isArabic ? 'المحادثة الصوتية المباشرة' : 'Live Voice Talk (Gemini Live)'}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            {/* 🎙️ Voice Dictation Toggle */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : isDark
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900'
              }`}
              title={isListening ? (isArabic ? 'إيقاف الإملاء' : 'Stop dictation') : (isArabic ? 'إملاء صوتي' : 'Speech to text dictation')}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* ➤ Send Button (Active only when text entered) */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] hover:opacity-95 disabled:opacity-30 text-[#090B0E] font-bold flex items-center justify-center shadow-md transition-all active:scale-95 disabled:pointer-events-none"
              title={isArabic ? 'إرسال' : 'Send message'}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>

        <p className="text-[10px] sm:text-[11px] text-center text-stone-400/80 mt-2 tracking-wide font-normal">
          {isArabic
            ? 'سل → تدبّر → تفقّه. للأحكام الشرعية الخاصة والمسائل الفقهية الدقيقة يُرجى استفتاء أهل العلم المعتمدين.'
            : 'Ask → understand → learn. Always verify personal verdicts with a trusted scholar.'}
        </p>
      </div>

      {/* Conversation History Drawer / Modal with Premium Fluid Physics */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <motion.div
            key="history-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md"
            onClick={() => setShowHistoryDrawer(false)}
          >
            <motion.div
              key="history-drawer-panel"
              initial={{ x: isArabic ? '-100%' : '100%', opacity: 0.8, scale: 0.98 }}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1,
                transition: {
                  type: 'spring',
                  damping: 28,
                  stiffness: 320,
                  mass: 0.8,
                },
              }}
              exit={{
                x: isArabic ? '-100%' : '100%',
                opacity: 0,
                scale: 0.94,
                transition: {
                  duration: 0.28,
                  ease: [0.32, 0.72, 0, 1],
                },
              }}
              className={`w-full max-w-sm h-full p-5 flex flex-col border-l shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative ${
                isDark
                  ? 'bg-[#080B0F]/98 border-[#C9A063]/30 text-stone-100'
                  : 'bg-white/98 border-stone-200 text-stone-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-800/60 shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#DFBA7F]" />
                  <h3 className="font-serif-heading font-bold text-sm">
                    {isArabic ? 'سجل المحادثات' : 'Conversation History'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* New Chat Button inside drawer */}
              <button
                onClick={handleNewChat}
                className="w-full mt-4 p-3 rounded-2xl bg-gradient-to-tr from-[#C9A063]/20 to-[#DFBA7F]/20 hover:from-[#C9A063]/30 hover:to-[#DFBA7F]/30 border border-[#C9A063]/40 text-[#DFBA7F] text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isArabic ? 'بدء محادثة جديدة' : 'Start New Chat'}</span>
              </button>

              {/* List of Sessions */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 no-scrollbar">
                {existingSessions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-stone-400">
                    {isArabic
                      ? 'لا توجد محادثات سابقة بعد. اسأل نور ما تشاء!'
                      : 'No conversation history yet. Start asking Noor!'}
                  </div>
                ) : (
                  existingSessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    const messageCount = sess.messages.length;

                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSwitchSession(sess.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                          isActive
                            ? 'bg-[#DFBA7F]/15 border-[#DFBA7F]/50 text-[#DFBA7F]'
                            : isDark
                            ? 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 text-stone-300'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageSquare
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#DFBA7F]' : 'text-stone-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{sess.title}</p>
                            <p className="text-[10px] text-stone-400">
                              {isArabic
                                ? `${messageCount} رسائل`
                                : `${messageCount} ${messageCount === 1 ? 'message' : 'messages'}`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-all shrink-0 ml-2 cursor-pointer"
                          title={isArabic ? 'حذف المحادثة' : 'Delete conversation'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Saved Messages Quick Link */}
              {userStats?.savedNoorMessages && userStats.savedNoorMessages.length > 0 && (
                <div className="pt-3 border-t border-stone-800/60 shrink-0">
                  <div className="text-[10px] uppercase font-bold text-stone-400 mb-2">
                    {isArabic
                      ? `الفوائد المحفوظة (${userStats.savedNoorMessages.length})`
                      : `Saved Insights (${userStats.savedNoorMessages.length})`}
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 no-scrollbar">
                    {userStats.savedNoorMessages.slice(0, 3).map((saved) => (
                      <div
                        key={saved.id}
                        className="p-2 rounded-xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-300 truncate"
                      >
                        🔖 {saved.text.slice(0, 45)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Noor AI Settings Modal (Houses Privacy & Data Transparency, AI Voice, & Clear Conversation) */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            key="noor-ai-settings-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              key="noor-ai-settings-modal-card"
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: { type: 'spring', damping: 26, stiffness: 340 },
              }}
              exit={{ scale: 0.93, opacity: 0, y: 10, transition: { duration: 0.18 } }}
              className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 border shadow-[0_24px_64px_rgba(0,0,0,0.7)] my-auto relative ${
                isDark
                  ? 'bg-[#080B0F]/98 border-[#C9A063]/30 text-stone-100'
                  : 'bg-white/98 border-stone-200 text-stone-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#C9A063]/20 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063]/20 to-[#DFBA7F]/20 border border-[#C9A063]/35 flex items-center justify-center text-[#DFBA7F] shadow-inner">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-heading font-bold text-base sm:text-lg">
                      {isArabic ? 'إعدادات نور الإسلامي' : 'Noor AI Settings'}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {isArabic ? 'تخصيص الرفيق، الخصوصية، وإدارة المحادثات' : 'Personalization, privacy guarantees & chats'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1 no-scrollbar">
                {/* Section 1: Privacy & Data Transparency */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-black/35 border-stone-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-[#DFBA7F] font-semibold text-xs sm:text-sm">
                    <Lock className="w-4 h-4" />
                    <span>{isArabic ? 'الخصوصية وأمان البيانات' : 'Privacy & Data Transparency'}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-300 leading-relaxed mb-3">
                    {isArabic
                      ? 'محادثاتك في نور الإسلامي مصممة بأعلى معايير الخصوصية التامة. لا يتم بيع بياناتك أو مشاركتها لأغراض إعلانية، وإجابات نور مستندة حصراً إلى المصادر الشرعية الموثوقة.'
                      : 'Your conversations with Noor AI are engineered with complete privacy. Your queries remain confidential, are never sold for ad targeting, and are strictly grounded in authentic Islamic sources.'}
                  </p>
                  <div className="space-y-1.5 text-[11px] text-stone-400">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                      <span>{isArabic ? 'تشفير كامل وحفظ سحابي خاص بحسابك' : 'Private encryption linked securely to your account'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                      <span>{isArabic ? 'إجابات منقحة من القرآن الكريم والسنة النبوية' : 'Grounded in the Holy Qur’an and authentic Hadith'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0" />
                      <span>{isArabic ? 'الحرية الكاملة في حذف أي محادثة في أي وقت' : 'Complete freedom to wipe conversation records anytime'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: AI Voice Selection */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-black/35 border-stone-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[#DFBA7F] font-semibold text-xs sm:text-sm">
                      <Volume2 className="w-4 h-4" />
                      <span>{isArabic ? 'صوت الذكاء الاصطناعي (المحادثة والقراءة)' : 'AI Voice Model (Live & Read-Aloud)'}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3">
                    {isArabic
                      ? 'اختر النبرة الصوتية المفضلة عند الاستماع إلى إجابات نور والمحادثة المباشرة'
                      : 'Select your preferred voice tone when listening to answers and during Live Voice Talk'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Zephyr', name: isArabic ? 'زفير (هادئ ووقور)' : 'Zephyr (Serene & Gentle)' },
                      { id: 'Puck', name: isArabic ? 'باك (واضح ومشرق)' : 'Puck (Crisp & Engaging)' },
                      { id: 'Fenrir', name: isArabic ? 'فينرير (عميق ورخيم)' : 'Fenrir (Deep & Resonant)' },
                      { id: 'Aoede', name: isArabic ? 'أويدي (دافئ وناعم)' : 'Aoede (Warm & Soft)' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setActiveVoiceName(v.id);
                          showToast(isArabic ? `تم تفعيل صوت ${v.id}` : `Selected ${v.id} voice`);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          activeVoiceName === v.id
                            ? 'bg-[#C9A063]/20 border-[#DFBA7F] text-[#DFBA7F] font-semibold shadow-xs'
                            : isDark
                            ? 'bg-black/20 border-white/5 text-stone-300 hover:border-white/20'
                            : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <span className="truncate">{v.name}</span>
                        {activeVoiceName === v.id && <Check className="w-3.5 h-3.5 text-[#DFBA7F] shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Conversation Management (Delete Conversation) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-black/35 border-stone-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-stone-200 font-semibold text-xs sm:text-sm">
                    <MessageSquare className="w-4 h-4 text-[#DFBA7F]" />
                    <span>{isArabic ? 'إدارة وسجل المحادثات' : 'Conversation Management'}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3">
                    {isArabic
                      ? `المحادثة الحالية تحتوي على ${activeMessages.length} رسالة.`
                      : `The current active conversation contains ${activeMessages.length} messages.`}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      id="settings-clear-current-chat-btn"
                      type="button"
                      disabled={activeMessages.length === 0}
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowClearConfirmModal(true);
                      }}
                      className="flex-1 py-2.5 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'مسح المحادثة الحالية' : 'Clear Current Conversation'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowHistoryDrawer(true);
                      }}
                      className="py-2.5 px-3.5 rounded-xl border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'عرض سجل المحادثات' : 'View All History'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 mt-2 border-t border-[#C9A063]/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isArabic ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <motion.div
            key="clear-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setShowClearConfirmModal(false)}
          >
            <motion.div
              key="clear-modal-box"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 350 } }}
              exit={{ scale: 0.92, opacity: 0, transition: { duration: 0.2 } }}
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
                isDark
                  ? 'bg-[#080B0F]/98 border-[#C9A063]/30 text-stone-100'
                  : 'bg-white/98 border-stone-200 text-stone-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-center font-serif-heading font-bold text-base mb-2">
                {isArabic ? 'مسح المحادثة الحالية؟' : 'Clear Conversation?'}
              </h3>
              <p className="text-center text-xs text-stone-400 leading-relaxed mb-6">
                {isArabic
                  ? 'هل أنت متأكد من رغبتك في مسح المحادثة الحالية؟ ستبقى محادثاتك السابقة في السجل بأمان دون تغيير.'
                  : 'Are you sure you want to clear the current conversation? Your previous chats in history will remain intact.'}
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  id="confirm-delete-chat-btn"
                  onClick={handleClearCurrentConversation}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
                >
                  {isArabic ? 'مسح المحادثة' : 'Clear Chat'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini Live Voice Real-Time Talk Modal */}
      <LiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        isDark={isDark}
        initialVoice={activeVoiceName}
        onSaveToChat={handleLiveSessionTranscripts}
      />
    </div>
  );
};
