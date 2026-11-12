import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { recordStudyActivity, recordStudySession } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';
import { Skeleton } from '../SkeletonLoaders';

interface LiveStudyModalProps {
  isDark: boolean;
  subject?: Subject;
  topic?: Topic;
  selectedSubject?: Subject;
  selectedTopic?: Topic;
  onClose: () => void;
}

interface LiveMessage {
  id: string;
  sender: 'tutor' | 'student';
  text: string;
  time: string;
}

export const LiveStudyModal: React.FC<LiveStudyModalProps> = ({
  isDark,
  subject,
  topic,
  selectedSubject,
  selectedTopic,
  onClose,
}) => {
  const currentSubject = selectedSubject || subject || {
    id: 'sub-general',
    name: 'General Studies',
    color: '#C9A063',
    createdAt: '',
  };
  const currentTopic = selectedTopic || topic;
  const [concept, setConcept] = useState(currentTopic?.name || currentSubject.name);
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'live-intro',
      sender: 'tutor',
      text: `Welcome to Live Study. We are reviewing **${concept}**. You can speak or type your questions, tell me to slow down, ask for examples, or ask me to quiz you at any time. What would you like to start with?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const recognitionRef = useRef<any>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakReply = (text: string) => {
    if (!voiceOutputEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'tutor',
          text: 'Speech recognition microphone is not supported in this browser mode. Please type your responses in the box below and I will respond immediately!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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
        console.error(err);
      }
    }
  };

  const handleSend = async (customText?: string, action: string = 'explain') => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const studentMsg: LiveMessage = {
      id: `live-${Date.now()}`,
      sender: 'student',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: (m.sender === 'student' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const res = await fetch(getApiUrl('/api/study/live'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          concept,
          action,
          history: historyPayload,
          subject: currentSubject.name,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Let us continue our live study session. What concept would you like to review next?';

      const tutorMsg: LiveMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
      speakReply(reply);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tutor-err-${Date.now()}`,
          sender: 'tutor',
          text: 'I had trouble connecting for a moment. Could you repeat that or choose an action below?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSession = () => {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
    recordStudySession(currentSubject.id, elapsedMinutes, currentTopic?.id, `Live study session on ${concept}`);
    recordStudyActivity(
      'live_study',
      `Live Study Session (${elapsedMinutes} min)`,
      `Covered: ${concept} in ${currentSubject.name}`,
      currentSubject.id,
      currentTopic?.id
    );
    window.speechSynthesis.cancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 pt-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl h-[92dvh] max-h-[min(92dvh,850px)] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-colors ${
          isDark ? 'bg-[#080B14] border-white/15 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#0D1220] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">Live Study Session</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DFBA7F]/20 text-[#DFBA7F]">
                  Real-Time Tutor
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {subject.name} {topic ? `• ${topic.name}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                if (voiceOutputEnabled) window.speechSynthesis.cancel();
                setVoiceOutputEnabled(!voiceOutputEnabled);
              }}
              title={voiceOutputEnabled ? 'Mute AI voice' : 'Enable AI voice'}
              className={`p-2 rounded-xl border transition-colors ${
                voiceOutputEnabled
                  ? 'border-[#DFBA7F]/50 text-[#DFBA7F] bg-[#DFBA7F]/10'
                  : 'border-stone-500/30 text-stone-400'
              }`}
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* End Session Button */}
            <button
              type="button"
              onClick={handleFinishSession}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Live Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.sender === 'student'
                    ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-medium rounded-tr-none'
                    : isDark
                    ? 'bg-[#121827] border border-white/10 text-stone-100 rounded-tl-none'
                    : 'bg-white border border-stone-200 text-stone-900 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                  <span className="font-bold uppercase tracking-wider">
                    {m.sender === 'student' ? 'You' : 'AI Study Coach'}
                  </span>
                  <span>{m.time}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full max-w-sm animate-fadeIn">
              <div
                className={`p-4 rounded-2xl rounded-tl-none border text-xs w-full space-y-2.5 ${
                  isDark ? 'bg-[#121827] border-white/10 text-stone-400' : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#DFBA7F]">Coach is reflecting...</span>
                </div>
                <Skeleton className="h-3.5 w-[90%] rounded-md" isDark={isDark} />
                <Skeleton className="h-3.5 w-[65%] rounded-md" isDark={isDark} />
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Quick Action Interactive Chips */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-t flex items-center gap-2 overflow-x-auto no-scrollbar text-xs ${
            isDark ? 'bg-[#0B0F1C] border-white/10' : 'bg-stone-100 border-stone-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-stone-500 shrink-0">Quick Commands:</span>
          {[
            { label: '🐢 Slow down', prompt: 'Please slow down and explain that again step by step.', action: 'simplify' },
            { label: '🔄 Explain differently', prompt: 'Can you explain this from an alternative perspective or visual analogy?', action: 'explain' },
            { label: '🎯 Quiz me on this', prompt: 'Quiz me right now on what you just explained.', action: 'quiz_me' },
            { label: '💡 Give me an example', prompt: 'Give me a vivid, real-world example of this concept in action.', action: 'example' },
            { label: '📌 Recap key points', prompt: 'Give me a 3-bullet recap of the most crucial points.', action: 'recap' },
            { label: '🤔 Do I understand this?', prompt: 'Let me summarize my understanding: ', action: 'verify_understanding' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (chip.action === 'verify_understanding') {
                  setInputText('I understand this as: ');
                } else {
                  handleSend(chip.prompt, chip.action);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border shrink-0 text-xs font-medium transition-all ${
                isDark
                  ? 'bg-[#141B2D] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                  : 'bg-white border-stone-200 hover:border-[#DFBA7F] text-stone-800 shadow-xs'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Live Input Controls & Speech Mic */}
        <div
          className={`p-4 border-t flex items-center gap-3 ${
            isDark ? 'bg-[#0D1220] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          {/* Speech Mic button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start speaking to study tutor'}
            className={`p-3.5 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-[#C9A063]/20 border border-[#C9A063]/40 text-[#DFBA7F] hover:bg-[#C9A063]/30'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice... (Speak now)'
                  : 'Type a message or press the microphone to speak...'
              }
              className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                isDark
                  ? 'bg-[#141B2D] border-white/15 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-tr from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-semibold disabled:opacity-40 transition-opacity shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
