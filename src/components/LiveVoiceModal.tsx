/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Radio,
  RotateCcw,
  Sliders,
  Check,
  User,
  Heart,
  BookOpen,
  Send,
  RefreshCw,
} from 'lucide-react';
import { NoorAIIcon } from './NoorAIIcon';
import {
  LiveVoiceSession,
  LiveTranscriptEntry,
  LiveConnectionState,
} from '../utils/audioLiveManager';
import { getLanguageCode } from '../utils/i18n';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: (transcripts: LiveTranscriptEntry[]) => void;
  isDark: boolean;
  initialVoice?: string;
  onSaveToChat?: (transcripts: LiveTranscriptEntry[]) => void;
}

const VOICE_OPTIONS = [
  { id: 'Zephyr', name: 'Zephyr', nameAr: 'صوت هادئ وسكينة (زفير)', description: 'Serene, Balanced & Tranquil', descAr: 'هادئ ومتزن ومريح للنفس' },
  { id: 'Kore', name: 'Kore', nameAr: 'صوت دافئ ومطمئن (كور)', description: 'Gentle, Warm & Soothing', descAr: 'لطيف ودافئ ومطمئن للقلب' },
  { id: 'Puck', name: 'Puck', nameAr: 'صوت فصيح وملهم (باك)', description: 'Clear, Engaging & Uplifting', descAr: 'فصيح ومحفز ومشرق' },
  { id: 'Fenrir', name: 'Fenrir', nameAr: 'صوت وقور ورصين (فنرير)', description: 'Deep, Resonant & Reflective', descAr: 'عميق ورنان ومفكر' },
  { id: 'Charon', name: 'Charon', nameAr: 'صوت تأملي خاشع (شارون)', description: 'Soft & Contemplative', descAr: 'رقيق وتدبري هادئ' },
];

const SUGGESTED_VOICE_PROMPTS_EN = [
  'What is the spiritual virtue of Tahajjud prayer?',
  'How do I cultivate patience (Sabr) during hardship?',
  'Teach me a heart-softening Du\'a for anxiety.',
  'What is the meaning of Surah Al-Inshirah?',
];

const SUGGESTED_VOICE_PROMPTS_AR = [
  'ما هو فضل وبركات صلاة قيام الليل والتهجد؟',
  'كيف يحقق المسلم الصبر والسكينة عند نزول البلاء؟',
  'علمني دعاءً نبوياً مأثوراً لراحة القلب وتفريج الهم.',
  'ما هي أسرار ومعاني سورة الشرح المباركة؟',
];

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  isDark,
  initialVoice = 'Zephyr',
  onSaveToChat,
}) => {
  const isArabic = getLanguageCode() === 'ar';
  const suggestedPrompts = isArabic ? SUGGESTED_VOICE_PROMPTS_AR : SUGGESTED_VOICE_PROMPTS_EN;

  const [connectionState, setConnectionState] = useState<LiveConnectionState>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoice);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isRetryingMic, setIsRetryingMic] = useState<boolean>(false);
  const [userVolume, setUserVolume] = useState<number>(0);
  const [aiVolume, setAiVolume] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<LiveTranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [customInputText, setCustomInputText] = useState<string>('');

  const sessionRef = useRef<LiveVoiceSession | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize and start live session when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      return;
    }

    setErrorMessage(null);
    setTranscripts([]);
    setIsMicActive(true);

    const session = new LiveVoiceSession(
      {
        onStateChange: (state) => {
          setConnectionState(state);
        },
        onTranscriptUpdate: (newTranscripts) => {
          setTranscripts(newTranscripts);
        },
        onUserVolume: (vol) => {
          setUserVolume(vol);
        },
        onAiVolume: (vol) => {
          setAiVolume(vol);
        },
        onError: (err) => {
          setErrorMessage(err);
        },
        onMicStatusChange: (isActive) => {
          setIsMicActive(isActive);
          if (isActive) {
            setErrorMessage(null);
          }
        },
      },
      selectedVoice
    );

    sessionRef.current = session;
    session.start();

    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, [isOpen, selectedVoice]);

  // Auto-scroll transcripts
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const handleToggleMute = () => {
    if (!isMicActive) {
      handleRetryMic();
      return;
    }
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sessionRef.current?.setMuted(nextMute);
  };

  const handleRetryMic = async () => {
    if (!sessionRef.current) return;
    setIsRetryingMic(true);
    setErrorMessage(null);
    try {
      const ok = await sessionRef.current.retryMicrophone();
      setIsMicActive(ok);
      if (ok) {
        setIsMuted(false);
      }
    } finally {
      setIsRetryingMic(false);
    }
  };

  const handleInterrupt = () => {
    sessionRef.current?.interrupt();
  };

  const handleSendQuickPrompt = (prompt: string) => {
    if (!prompt.trim()) return;
    sessionRef.current?.sendTextMessage(prompt.trim());
    setCustomInputText('');
  };

  const handleReconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    setErrorMessage(null);
    const session = new LiveVoiceSession(
      {
        onStateChange: (state) => setConnectionState(state),
        onTranscriptUpdate: (newTranscripts) => setTranscripts(newTranscripts),
        onUserVolume: (vol) => setUserVolume(vol),
        onAiVolume: (vol) => setAiVolume(vol),
        onError: (err) => setErrorMessage(err),
        onMicStatusChange: (isActive) => {
          setIsMicActive(isActive);
          if (isActive) setErrorMessage(null);
        },
      },
      selectedVoice
    );
    sessionRef.current = session;
    session.start();
  };

  const handleClose = () => {
    const currentTranscripts = sessionRef.current ? sessionRef.current.getTranscripts() : transcripts;
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    if (currentTranscripts.length > 0 && onSaveToChat) {
      onSaveToChat(currentTranscripts);
    }
    onClose(currentTranscripts);
  };

  if (!isOpen) return null;

  // Dynamic visualizer values
  const activeScale = 1 + (connectionState === 'speaking' ? aiVolume * 0.45 : userVolume * 0.4);
  const activeGlow = connectionState === 'speaking'
    ? `0 0 ${25 + aiVolume * 60}px rgba(223, 186, 127, ${0.4 + aiVolume * 0.6})`
    : connectionState === 'listening' && isMicActive
    ? `0 0 ${20 + userVolume * 45}px rgba(96, 165, 250, ${0.3 + userVolume * 0.5})`
    : '0 0 20px rgba(201, 160, 99, 0.25)';

  const selectedVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice);
  const selectedVoiceLabel = isArabic && selectedVoiceObj ? selectedVoiceObj.nameAr : selectedVoice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 pt-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        id="live-voice-sanctuary-modal"
        className={`w-full max-w-xl h-[88dvh] max-h-[680px] rounded-3xl border flex flex-col overflow-hidden shadow-2xl relative transition-all ${
          isDark
            ? 'bg-[#090C11]/95 border-[#DFBA7F]/30 text-stone-100'
            : 'bg-[#FCFAF6]/98 border-[#C9A063]/40 text-stone-900'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center shadow-lg font-bold">
              <Radio className={`w-5 h-5 ${connectionState === 'speaking' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-heading font-bold text-sm sm:text-base tracking-wider text-[#DFBA7F]">
                  {isArabic ? 'محادثة نور الصوتية الحية' : 'NOOR LIVE VOICE'}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isArabic ? 'مباشر وتفاعلي' : 'Gemini Live'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isArabic
                  ? 'حوار إسلامي مباشر بالصوت الحي والذكاء الهادئ الرصين'
                  : 'Natural Islamic voice conversation with real-time audio'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                showVoiceSettings
                  ? 'bg-[#DFBA7F]/20 border-[#DFBA7F] text-[#DFBA7F]'
                  : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
              }`}
              title={isArabic ? 'إعدادات الصوت والنبرة' : 'Voice Settings'}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-[11px]">{selectedVoiceLabel}</span>
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-stone-400 hover:text-white transition-all"
              title={isArabic ? 'إنهاء وإغلاق المحادثة' : 'End & Close Live Voice'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Persona Dropdown Drawer */}
        {showVoiceSettings && (
          <div className="p-4 border-b border-[#DFBA7F]/20 bg-[#0E1217] space-y-2 animate-fadeIn shrink-0">
            <div className="text-[11px] font-bold text-[#DFBA7F] uppercase tracking-wider">
              {isArabic ? 'اختر نبرة الصوت المريحة' : 'Select Voice Tone'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    setShowVoiceSettings(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedVoice === voice.id
                      ? 'bg-[#DFBA7F]/20 border-[#DFBA7F] text-[#DFBA7F]'
                      : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{isArabic ? voice.nameAr : voice.name}</div>
                    <div className="text-[10px] text-stone-400">{isArabic ? voice.descAr : voice.description}</div>
                  </div>
                  {selectedVoice === voice.id && <Check className="w-4 h-4 text-[#DFBA7F]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Central Visualizer & Status Area */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar">
          {/* Glowing Animated Audio Orb */}
          <div className="flex flex-col items-center justify-center my-auto py-3 relative">
            {/* Outer Sound Wave Rings */}
            <div
              className="absolute w-44 h-44 rounded-full border border-[#DFBA7F]/30 transition-transform duration-100 pointer-events-none"
              style={{
                transform: `scale(${activeScale * 1.15})`,
                opacity: (connectionState === 'speaking' || (connectionState === 'listening' && isMicActive)) ? 0.6 : 0.2,
              }}
            />
            <div
              className="absolute w-56 h-56 rounded-full border border-[#DFBA7F]/15 transition-transform duration-150 pointer-events-none"
              style={{
                transform: `scale(${activeScale * 1.35})`,
                opacity: (connectionState === 'speaking' || (connectionState === 'listening' && isMicActive)) ? 0.4 : 0.1,
              }}
            />

            {/* Core Radiant Orb */}
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full relative flex items-center justify-center cursor-pointer transition-all duration-100 active:scale-95"
              style={{
                boxShadow: activeGlow,
                transform: `scale(${activeScale})`,
                background:
                  connectionState === 'speaking'
                    ? 'radial-gradient(circle at 35% 30%, #F5DEB3 0%, #DFBA7F 40%, #8A642B 100%)'
                    : connectionState === 'listening' && isMicActive
                    ? 'radial-gradient(circle at 35% 30%, #BFDBFE 0%, #60A5FA 45%, #1E3A8A 100%)'
                    : 'radial-gradient(circle at 35% 30%, #DFBA7F 0%, #C9A063 50%, #151922 100%)',
              }}
              onClick={
                connectionState === 'speaking'
                  ? handleInterrupt
                  : !isMicActive
                  ? handleRetryMic
                  : handleToggleMute
              }
              title={
                connectionState === 'speaking'
                  ? (isArabic ? 'انقر للمقاطعة والاستفسار' : 'Tap to interrupt')
                  : !isMicActive
                  ? (isArabic ? 'انقر لتفعيل الميكروفون' : 'Tap to enable microphone')
                  : isMuted
                  ? (isArabic ? 'انقر لإلغاء الكتم' : 'Tap to unmute')
                  : (isArabic ? 'نور يستمع لصوتك' : 'Listening')
              }
            >
              <div className="text-[#090B0E] flex flex-col items-center justify-center">
                {connectionState === 'speaking' ? (
                  <Volume2 className="w-8 h-8 animate-bounce" />
                ) : !isMicActive ? (
                  <MicOff className="w-8 h-8 text-amber-900" />
                ) : isMuted ? (
                  <MicOff className="w-8 h-8 text-red-900" />
                ) : (
                  <Mic className="w-8 h-8 animate-pulse" />
                )}
              </div>
            </div>

            {/* Status Pill */}
            <div className="mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionState === 'speaking'
                    ? 'bg-[#DFBA7F] animate-ping'
                    : connectionState === 'listening' && isMicActive
                    ? 'bg-blue-400 animate-pulse'
                    : connectionState === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : !isMicActive
                    ? 'bg-amber-400'
                    : isMuted
                    ? 'bg-red-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs font-semibold tracking-wide">
                {connectionState === 'speaking'
                  ? (isArabic ? 'نور يتحدث بصوت هادئ...' : 'Noor AI is speaking...')
                  : connectionState === 'connecting'
                  ? (isArabic ? 'جاري الاتصال بالخدمة الصوتية...' : 'Connecting to Live API...')
                  : connectionState === 'error'
                  ? (isArabic ? 'انقطع الاتصال الصوتي' : 'Connection interrupted')
                  : !isMicActive
                  ? (isArabic ? 'الميكروفون غير نشط • انقر على سؤال أو أعد الفحص' : 'Mic offline • Tap suggested topics or Retry')
                  : isMuted
                  ? (isArabic ? 'تم كتم الميكروفون' : 'Microphone muted')
                  : (isArabic ? 'نور يستمع لصوتك الكريم...' : 'Listening to your voice...')}
              </span>
            </div>

            {/* Interactive Error / Guidance Box */}
            {errorMessage && (
              <div className="mt-3 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-center max-w-md shadow-lg space-y-2">
                <p className="leading-relaxed">{errorMessage}</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {!isMicActive && (
                    <button
                      onClick={handleRetryMic}
                      disabled={isRetryingMic}
                      className="px-3 py-1 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/40 text-amber-100 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRetryingMic ? 'animate-spin' : ''}`} />
                      <span>{isRetryingMic ? (isArabic ? 'فحص الميكروفون...' : 'Checking Microphone...') : (isArabic ? 'فحص الميكروفون' : 'Retry Microphone')}</span>
                    </button>
                  )}
                  {connectionState === 'error' && (
                    <button
                      onClick={handleReconnect}
                      className="px-3 py-1 rounded-xl bg-[#DFBA7F]/30 hover:bg-[#DFBA7F]/40 border border-[#DFBA7F]/50 text-[#DFBA7F] text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'إعادة الاتصال' : 'Reconnect'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 text-[11px] transition-all"
                  >
                    {isArabic ? 'تجاهل' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Live Transcript Bubble */}
          <div className="w-full max-h-44 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-black/40 border border-white/10 text-xs">
            <div className="text-[10px] font-bold text-[#DFBA7F] flex items-center justify-between">
              <span>{isArabic ? 'النص المباشر للمحادثة' : 'LIVE TRANSCRIPT'}</span>
              {transcripts.length > 0 && (
                <span>{isArabic ? `${transcripts.length} تبادل حديث` : `${transcripts.length} exchanges`}</span>
              )}
            </div>

            {transcripts.length === 0 ? (
              <p className="text-stone-400 italic text-center py-2">
                {isMicActive
                  ? (isArabic
                      ? 'تحدث بطلاقة وسكينة عبر الميكروفون. قل "السلام عليكم"، أو اسأل عن آية، أو اطلب دعاءً طيباً.'
                      : 'Speak freely into your microphone. Say "Assalamu Alaikum", ask about a verse, or seek guidance.')
                  : (isArabic
                      ? 'يمكنك النقر على أي سؤال بالأسفل أو كتابة استفسارك للحديث مع نور بالصوت المباشر.'
                      : 'You can tap any question below or type to converse with Noor AI in live spoken audio.')}
              </p>
            ) : (
              transcripts.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl ${
                    entry.sender === 'user'
                      ? 'bg-[#DFBA7F]/20 text-[#DFBA7F] ml-6 border border-[#DFBA7F]/30'
                      : 'bg-white/10 text-stone-200 mr-6 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-semibold opacity-70 mb-0.5">
                    {entry.sender === 'user' ? <User className="w-3 h-3" /> : <NoorAIIcon className="w-3 h-3 text-[#DFBA7F]" />}
                    <span>{entry.sender === 'user' ? (isArabic ? 'أنت' : 'You') : (isArabic ? 'نور' : 'Noor AI')}</span>
                    <span className="text-[9px] opacity-60 ml-auto">{entry.timestamp}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>

          {/* Quick Voice Topics / Starters */}
          <div className="w-full mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                {transcripts.length === 0
                  ? (isArabic ? 'أسئلة مباركة مقترحة لبدء الحديث:' : 'Suggested questions to ask:')
                  : (isArabic ? 'اطرح سؤالاً آخر:' : 'Ask another question:')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestedPrompts.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendQuickPrompt(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#DFBA7F]/20 border border-white/10 hover:border-[#DFBA7F]/40 text-stone-300 hover:text-[#DFBA7F] text-[11px] transition-all text-left active:scale-95"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Control Dock with Always-Visible Input & Buttons */}
        <div className="p-3 sm:p-4 border-t border-white/10 flex flex-col gap-2.5 bg-white/5 shrink-0">
          {/* In-Modal Quick Question Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuickPrompt(customInputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={customInputText}
              onChange={(e) => setCustomInputText(e.target.value)}
              placeholder={isArabic ? 'اكتب سؤالك للإجابة الصوتية الفورية...' : 'Type a question for live spoken answer...'}
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#DFBA7F]"
            />
            <button
              type="submit"
              disabled={!customInputText.trim()}
              className="p-2 rounded-xl bg-[#DFBA7F] text-[#090B0E] hover:brightness-110 disabled:opacity-40 transition-all font-semibold shrink-0"
              title={isArabic ? 'إرسال للمحادثة الصوتية' : 'Send to Live Voice'}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {!isMicActive ? (
              <button
                onClick={handleRetryMic}
                disabled={isRetryingMic}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl border text-xs font-semibold transition-all active:scale-95 bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRetryingMic ? 'animate-spin' : ''}`} />
                <span className="text-[11px] sm:text-xs">{isRetryingMic ? (isArabic ? 'فحص...' : 'Checking...') : (isArabic ? 'تفعيل المايك' : 'Enable Mic')}</span>
              </button>
            ) : (
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl border text-xs font-semibold transition-all active:scale-95 ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-white/10 hover:bg-white/15 border-white/15 text-stone-200'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-[11px] sm:text-xs">{isMuted ? (isArabic ? 'إلغاء الكتم' : 'Unmute') : (isArabic ? 'كتم المايك' : 'Mute')}</span>
              </button>
            )}

            {connectionState === 'speaking' && (
              <button
                onClick={handleInterrupt}
                className="flex items-center gap-1 px-2.5 sm:px-4 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all active:scale-95 animate-pulse"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">{isArabic ? 'مقاطعة' : 'Interrupt'}</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="flex items-center gap-1 px-3.5 sm:px-5 py-2 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] text-xs font-bold shadow-lg hover:brightness-110 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">{isArabic ? 'إنهاء المحادثة' : 'Close'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
