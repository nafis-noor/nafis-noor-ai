import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Sparkles,
  BookOpen,
  Layers,
  FileQuestion,
  Lightbulb,
  BookmarkPlus,
  Copy,
  Check,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Subject, Topic, StudyDocument } from '../../types/study';
import { DocumentAnalysisSkeleton } from '../SkeletonLoaders';
import {
  saveStudyDocument,
  deleteStudyDocument,
  loadStudyData,
  saveStudyNote,
  saveBatchFlashcards,
  recordStudyActivity,
} from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface DocumentStudyViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

export const DocumentStudyView: React.FC<DocumentStudyViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onNavigateTab,
  onRefreshData,
}) => {
  const [documents, setDocuments] = useState<StudyDocument[]>(() => {
    return loadStudyData().documents;
  });

  const [activeDoc, setActiveDoc] = useState<StudyDocument | null>(() => {
    const docs = loadStudyData().documents;
    return docs.length > 0 ? docs[0] : null;
  });

  const [customQuestion, setCustomQuestion] = useState('');
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [activeActionLabel, setActiveActionLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const newDoc = saveStudyDocument({
        name: file.name,
        type: isImg ? 'image' : 'pdf',
        sizeFormatted: formattedSize,
        base64Data: base64,
        mimeType: file.type || (isImg ? 'image/jpeg' : 'application/pdf'),
      });

      const updated = loadStudyData().documents;
      setDocuments(updated);
      setActiveDoc(newDoc);
      setActionOutput(null);
      onRefreshData?.();
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: string) => {
    deleteStudyDocument(docId);
    const updated = loadStudyData().documents;
    setDocuments(updated);
    if (activeDoc?.id === docId) {
      setActiveDoc(updated.length > 0 ? updated[0] : null);
      setActionOutput(null);
    }
    onRefreshData?.();
  };

  const handleRunAction = async (action: 'understand' | 'summarize' | 'important_concepts' | 'make_notes' | 'ask_question') => {
    if (!activeDoc) return;
    setIsLoading(true);
    setCopied(false);
    setSavedSuccess(null);

    let label = 'Analysis';
    if (action === 'understand') label = 'Comprehension Analysis';
    else if (action === 'summarize') label = 'Executive Summary';
    else if (action === 'important_concepts') label = 'Key Concepts & Formulas';
    else if (action === 'make_notes') label = 'Revision Study Notes';
    else if (action === 'ask_question') label = `Q: ${customQuestion}`;
    setActiveActionLabel(label);

    try {
      const res = await fetch(getApiUrl('/api/study/document-action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            data: activeDoc.base64Data,
            mimeType: activeDoc.mimeType,
            name: activeDoc.name,
          },
          action,
          query: customQuestion.trim() || undefined,
          subject: selectedSubject.name,
        }),
      });

      const data = await res.json();
      setActionOutput(data.result || 'No analysis available.');
      if (action === 'ask_question') setCustomQuestion('');
    } catch (err) {
      console.error(err);
      setActionOutput('Error analyzing document with AI. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcardsFromDoc = async () => {
    if (!activeDoc) return;
    setIsLoading(true);
    setActiveActionLabel('Generating Flashcards from Document...');

    try {
      const res = await fetch('/api/study/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
          attachment: {
            data: activeDoc.base64Data,
            mimeType: activeDoc.mimeType,
          },
          count: 5,
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
        setActionOutput(`✅ Successfully created and saved ${data.flashcards.length} flashcards directly to your deck for ${selectedSubject.name}!`);
        setSavedSuccess('Flashcards created & saved!');
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
      setActionOutput('⚠️ Failed to generate flashcards from this document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOutputToNotes = () => {
    if (!actionOutput || !activeDoc) return;
    saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: `${activeActionLabel} (${activeDoc.name})`,
      content: actionOutput,
      tags: ['Document Study', activeDoc.type.toUpperCase()],
    });
    setSavedSuccess('Saved to Smart Notes!');
    onRefreshData?.();
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleCopy = () => {
    if (!actionOutput) return;
    navigator.clipboard.writeText(actionOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#DFBA7F]" />
            <span>PDF & Image / Camera Study</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            AI multimodal analysis of textbooks, worksheets, handwritten notes, and PDF chapters.
          </p>
        </div>

        {/* Hidden inputs for file and camera */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-white/10 hover:border-white/20 text-stone-200 bg-[#121724]'
                : 'border-stone-300 hover:border-stone-400 text-stone-800 bg-white shadow-xs'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents Library & Active Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-4 rounded-3xl border shadow-sm ${
              isDark ? 'bg-[#0E131E] border-white/15' : 'bg-white border-stone-200'
            }`}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 px-1">
              Study Library ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-dashed rounded-2xl border-white/10">
                <UploadCloud className="w-6 h-6 mx-auto mb-2 text-stone-500" />
                <p>No documents uploaded yet.</p>
                <p className="text-[11px] text-stone-500 mt-1">Upload a PDF or snap a worksheet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActiveDoc(doc);
                        setActionOutput(null);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 text-xs transition-all ${
                        isSelected
                          ? 'bg-[#C9A063]/15 border-[#C9A063] text-[#DFBA7F]'
                          : isDark
                          ? 'bg-[#121826] border-white/10 hover:border-white/20 text-stone-300'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {doc.type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <div className="truncate text-left">
                          <p className="font-bold truncate">{doc.name}</p>
                          <span className="text-[10px] opacity-70">{doc.sizeFormatted}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        className="p-1 text-stone-500 hover:text-red-400"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Document Details */}
          {activeDoc && (
            <div
              className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
                isDark ? 'bg-[#0E131E] border-white/15' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DFBA7F]/20 text-[#DFBA7F]">
                  Selected
                </span>
                <span className="text-xs font-semibold truncate text-stone-200">
                  {activeDoc.name}
                </span>
              </div>

              {activeDoc.type === 'image' && activeDoc.base64Data && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-48 bg-black/40 flex items-center justify-center">
                  <img
                    src={activeDoc.base64Data}
                    alt={activeDoc.name}
                    loading="lazy"
                    decoding="async"
                    className="object-contain max-h-48 w-full"
                  />
                </div>
              )}

              {/* 1-Click Action Buttons */}
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  AI Study Tools
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('understand')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#141B2B] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-[#DFBA7F] text-stone-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#DFBA7F]" />
                  <span>Understand this Document</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('summarize')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#141B2B] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-[#DFBA7F] text-stone-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Summarize Key Points</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('important_concepts')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#141B2B] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-[#DFBA7F] text-stone-800'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extract Important Concepts & Formulas</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGenerateFlashcardsFromDoc}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#141B2B] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-[#DFBA7F] text-stone-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Generate Flashcards from Document</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAction('make_notes')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    isDark
                      ? 'bg-[#141B2B] border-white/10 hover:border-[#DFBA7F] text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-[#DFBA7F] text-stone-800'
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create Structured Study Notes</span>
                </button>
              </div>

              {/* Specific Question Input */}
              <div className="pt-2 border-t border-white/10">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Ask Question About Document
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="e.g. Solve problem #4, What is equation 2..."
                    className={`flex-1 p-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={isLoading || !customQuestion.trim()}
                    onClick={() => handleRunAction('ask_question')}
                    className="p-2 rounded-xl bg-[#C9A063] text-[#080A0E] disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis & Extraction Output */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <DocumentAnalysisSkeleton
              isDark={isDark}
              label={`AI is reading & processing ${activeDoc?.name || 'document'}...`}
            />
          ) : actionOutput ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-lg space-y-4 animate-fadeIn ${
                isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                <span className="font-bold text-[#DFBA7F] uppercase tracking-wider text-[10px]">
                  {activeActionLabel}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-stone-400 hover:text-stone-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOutputToNotes}
                    className="flex items-center gap-1 text-stone-400 hover:text-[#DFBA7F]"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save to Notes</span>
                  </button>
                </div>
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{savedSuccess}</span>
                </div>
              )}

              <div className="markdown-study-content space-y-3 leading-relaxed text-xs sm:text-sm">
                <Markdown>{actionOutput}</Markdown>
              </div>
            </div>
          ) : (
            <div
              className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center min-h-[420px] ${
                isDark ? 'bg-[#0D1220] border-white/10' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#DFBA7F]/15 text-[#DFBA7F] flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base mb-1">Select a Document & Tool</h3>
              <p className="text-xs text-stone-400 max-w-sm">
                Upload a textbook PDF or photo of notes on the left, then click any action like
                &quot;Understand this Document&quot; or &quot;Extract Formulas&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
