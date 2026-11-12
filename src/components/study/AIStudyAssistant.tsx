import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bot,
  User,
  ArrowDownCircle,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { recordStudyActivity } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachment?: {
    name: string;
    type: 'image' | 'pdf';
    previewUrl?: string;
  };
  timestamp: string;
}

interface AIStudyAssistantProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onNavigateTab?: (tab: any) => void;
  onOpenLiveStudy?: () => void;
}

export const AIStudyAssistant: React.FC<AIStudyAssistantProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onNavigateTab,
  onOpenLiveStudy,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState<{
    file: File;
    name: string;
    mimeType: string;
    data: string; // base64
    previewUrl?: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImage = file.type.startsWith('image/');
      setActiveAttachment({
        file,
        name: file.name,
        mimeType: file.type || (isImage ? 'image/jpeg' : 'application/pdf'),
        data: base64,
        previewUrl: isImage ? base64 : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customPrompt?: string, mode: 'general' | 'simplify' | 'examples' | 'differently' | 'test_understanding' | 'recap' = 'general') => {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() && !activeAttachment) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: promptToSend.trim(),
      attachment: activeAttachment
        ? {
            name: activeAttachment.name,
            type: activeAttachment.mimeType.includes('pdf') ? 'pdf' : 'image',
            previewUrl: activeAttachment.previewUrl,
          }
        : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const attachmentPayload = activeAttachment
      ? {
          data: activeAttachment.data,
          mimeType: activeAttachment.mimeType,
          name: activeAttachment.name,
        }
      : null;

    setActiveAttachment(null);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch(getApiUrl('/api/study/tutor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend.trim(),
          history: historyPayload,
          mode,
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          attachment: attachmentPayload,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'I could not generate an explanation at this time. Please try again.';

      const aiResponse: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiResponse]);
      recordStudyActivity(
        'notes',
        `Study Tutor: ${selectedSubject.name}`,
        `Asked: "${promptToSend.slice(0, 45)}..."`,
        selectedSubject.id,
        selectedTopic?.id
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'model',
          text: 'There was an error connecting with the Study Tutor. Please check your network and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  return (
    <div className="flex flex-col h-full max-h-[82vh] rounded-2xl overflow-hidden border shadow-sm transition-colors">
      {/* Top Banner / Session Info */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between text-xs transition-colors ${
          isDark ? 'bg-[#0E131E] border-white/10 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-semibold text-sm text-[#DFBA7F]">{selectedSubject.name}</span>
          {selectedTopic && (
            <>
              <span className="text-stone-400">•</span>
              <span className="text-stone-400 font-medium">{selectedTopic.name}</span>
            </>
          )}
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 ${
          isDark ? 'bg-[#0A0D14]' : 'bg-stone-100/50'
        }`}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 px-4">
            <div className="w-14 h-14 rounded-3xl bg-[#C9A063]/15 border border-[#C9A063]/30 flex items-center justify-center text-[#DFBA7F] mb-4 shadow-sm">
              <Bot className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold mb-1">
              AI Study Tutor for {selectedSubject.name}
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed mb-6">
              Ask any question, paste assignment problems, upload textbook photos or study PDFs.
              The AI tutor guides your understanding step by step.
            </p>

            {/* Quick Starter Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
              {[
                { label: 'Explain the core principles', mode: 'general' as const },
                { label: 'Give me real-world examples', mode: 'examples' as const },
                { label: 'Explain like I am new to this', mode: 'simplify' as const },
                { label: 'Test my current understanding', mode: 'test_understanding' as const },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      `Can you help me understand ${selectedTopic?.name || selectedSubject.name}? ${p.label}.`,
                      p.mode
                    )
                  }
                  className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-[#121724] border-white/10 hover:border-[#C9A063]/40 text-stone-200'
                      : 'bg-white border-stone-200 hover:border-[#C9A063]/60 text-stone-800 shadow-sm'
                  }`}
                >
                  {p.label} →
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`space-y-1.5 max-w-[88%] sm:max-w-[80%]`}>
              {/* Attachment preview in message */}
              {msg.attachment && (
                <div
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-medium mb-1 ${
                    isDark ? 'bg-[#181F2F] border-white/10 text-stone-200' : 'bg-stone-200/70 border-stone-300 text-stone-800'
                  }`}
                >
                  {msg.attachment.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-red-400" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="truncate max-w-[180px]">{msg.attachment.name}</span>
                  {msg.attachment.previewUrl && (
                    <img
                      src={msg.attachment.previewUrl}
                      alt="Attachment"
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 object-cover rounded-lg ml-auto border border-white/10"
                    />
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#DFBA7F] to-[#C9A063] text-[#080A0E] font-medium rounded-tr-none'
                    : isDark
                    ? 'bg-[#121722] border border-white/10 text-stone-100 rounded-tl-none'
                    : 'bg-white border border-stone-200 text-stone-900 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="markdown-study-content space-y-2">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>

              {/* Action Buttons for AI response */}
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 text-[11px] text-stone-400 px-1">
                  <span>{msg.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="hover:text-stone-200 flex items-center gap-1"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeak(msg.id, msg.text)}
                    className="hover:text-stone-200 flex items-center gap-1"
                    title="Read aloud"
                  >
                    {speakingId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-stone-700/40 border border-white/10 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-[#C9A063]/20 border border-[#C9A063]/40 flex items-center justify-center text-[#DFBA7F] shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div
              className={`p-4 rounded-2xl text-xs rounded-tl-none border flex items-center gap-2 ${
                isDark ? 'bg-[#121722] border-white/10 text-stone-300' : 'bg-white border-stone-200 text-stone-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#DFBA7F] animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium">Tutor is analyzing your question...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Pedagogical Quick Action Bar */}
      {messages.length > 0 && !isLoading && (
        <div
          className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto no-scrollbar text-xs ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] uppercase font-bold text-stone-500 shrink-0">Tutor:</span>
          <button
            type="button"
            onClick={() => handleSendMessage('Can you simplify this explanation and use an everyday analogy?', 'simplify')}
            className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              isDark ? 'border-white/10 hover:border-[#DFBA7F] text-stone-300' : 'border-stone-300 hover:border-[#DFBA7F] text-stone-700'
            }`}
          >
            💡 Simplify this
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Could you provide 2 clear, concrete examples of this?', 'examples')}
            className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              isDark ? 'border-white/10 hover:border-[#DFBA7F] text-stone-300' : 'border-stone-300 hover:border-[#DFBA7F] text-stone-700'
            }`}
          >
            📌 Give examples
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Can you explain this from a different angle or perspective?', 'differently')}
            className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              isDark ? 'border-white/10 hover:border-[#DFBA7F] text-stone-300' : 'border-stone-300 hover:border-[#DFBA7F] text-stone-700'
            }`}
          >
            🔄 Explain differently
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Please quiz me with 1 question to test if I understood this correctly.', 'test_understanding')}
            className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
              isDark ? 'border-white/10 hover:border-[#DFBA7F] text-stone-300' : 'border-stone-300 hover:border-[#DFBA7F] text-stone-700'
            }`}
          >
            🎯 Test my understanding
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {activeAttachment && (
        <div
          className={`px-4 py-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'bg-[#151C2C] border-white/10 text-stone-200' : 'bg-stone-200 border-stone-300 text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {activeAttachment.mimeType.includes('pdf') ? (
              <FileText className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="font-semibold truncate">{activeAttachment.name}</span>
            <span className="text-[10px] text-stone-400">Ready to analyze</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveAttachment(null)}
            className="p-1 rounded-md hover:bg-white/10 text-stone-400 hover:text-stone-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div
        className={`p-3 sm:p-4 border-t transition-colors ${
          isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          {/* File input (PDF / Images) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {/* Camera input (Mobile textbook capture) */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload textbook photo, diagram, or study PDF"
              className={`p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/5'
                  : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              title="Snap photo with camera"
              className={`p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/5'
                  : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask a question or paste text from ${selectedSubject.name}...`}
            rows={1}
            className={`flex-1 max-h-32 min-h-[42px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border resize-none outline-none leading-relaxed transition-all ${
              isDark
                ? 'bg-[#141A27] border-white/15 text-stone-100 placeholder-stone-500 focus:border-[#C9A063]'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-[#C9A063]'
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !activeAttachment)}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
