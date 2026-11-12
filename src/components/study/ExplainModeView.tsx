import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  UploadCloud,
  FileText,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { saveStudyNote, recordStudyActivity } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';
import { DocumentAnalysisSkeleton } from '../SkeletonLoaders';

interface ExplainModeViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

type ExplainLevel = 'quick' | 'simple' | 'detailed' | 'deep';
type ExplainAngle = 'example' | 'step_by_step' | 'new_to_this' | 'real_world';

export const ExplainModeView: React.FC<ExplainModeViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [concept, setConcept] = useState(selectedTopic?.name || '');
  const [level, setLevel] = useState<ExplainLevel>('detailed');
  const [angle, setAngle] = useState<ExplainAngle>('step_by_step');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [attachment, setAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        data: reader.result as string,
        mimeType: file.type || 'application/pdf',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExplain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!concept.trim() && !attachment) return;

    setIsLoading(true);
    setCopied(false);
    setSavedToNotes(false);

    try {
      const res = await fetch(getApiUrl('/api/study/explain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept.trim(),
          level,
          angle,
          attachment,
          subject: selectedSubject.name,
        }),
      });

      const data = await res.json();
      setExplanation(data.explanation || 'No explanation generated.');
      recordStudyActivity(
        'explain',
        `Deep Explanation: ${concept || attachment?.name || selectedSubject.name}`,
        `Level: ${level}, Angle: ${angle}`,
        selectedSubject.id,
        selectedTopic?.id
      );
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      setExplanation('Error fetching explanation. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = () => {
    if (!explanation) return;
    saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: `Explanation: ${concept || selectedTopic?.name || selectedSubject.name}`,
      content: explanation,
      tags: ['AI Explanation', level, angle],
    });
    setSavedToNotes(true);
    onRefreshData?.();
    setTimeout(() => setSavedToNotes(false), 3000);
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#DFBA7F]" />
          <span>Explain Mode</span>
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Demystify difficult concepts through customized pedagogical angles in{' '}
          {selectedSubject.name} {selectedTopic ? `• ${selectedTopic.name}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (Left) */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border shadow-sm space-y-5 h-fit ${
            isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <form onSubmit={handleExplain} className="space-y-4">
            {/* Concept Input */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                Concept, Problem, or Theorem to Explain
              </label>
              <textarea
                rows={3}
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Endosymbiotic Theory, Fourier Transform, Keynesian Multiplier..."
                className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                  isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              />
            </div>

            {/* Optional attachment */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                Or Attach Diagram / Problem Image / PDF
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="text-xs text-stone-400"
              />
              {attachment && (
                <div className="p-2 mt-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  Attached: {attachment.name}
                </div>
              )}
            </div>

            {/* Explanation Depth */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                Explanation Depth
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'quick' as const, label: '⚡ Quick' },
                  { id: 'simple' as const, label: '🌱 Simple' },
                  { id: 'detailed' as const, label: '📖 Detailed' },
                  { id: 'deep' as const, label: '🔬 Deep Academic' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={`py-2 px-2.5 rounded-xl border font-medium text-xs transition-all ${
                      level === l.id
                        ? 'bg-[#C9A063] text-[#080A0E] font-bold border-[#C9A063]'
                        : isDark
                        ? 'border-white/10 text-stone-400 hover:text-stone-200'
                        : 'border-stone-200 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Angle */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                Perspective Angle
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'step_by_step' as const, label: 'Step by Step' },
                  { id: 'example' as const, label: 'With an Example' },
                  { id: 'new_to_this' as const, label: "Like I'm New to This" },
                  { id: 'real_world' as const, label: 'Real-World Application' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAngle(a.id)}
                    className={`py-2 px-2.5 rounded-xl border font-medium text-xs text-left transition-all ${
                      angle === a.id
                        ? 'bg-[#C9A063] text-[#080A0E] font-bold border-[#C9A063]'
                        : isDark
                        ? 'border-white/10 text-stone-400 hover:text-stone-200'
                        : 'border-stone-200 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!concept.trim() && !attachment)}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] disabled:opacity-40 shadow-sm"
            >
              {isLoading ? 'Crafting Explanation...' : 'Explain Now'}
            </button>
          </form>
        </div>

        {/* Output Column (Right) */}
        <div className="lg:col-span-7">
          {isLoading ? (
            <DocumentAnalysisSkeleton
              isDark={isDark}
              label="AI is crafting comprehensive concept explanation..."
            />
          ) : explanation ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-lg space-y-4 animate-fadeIn ${
                isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                <span className="font-bold text-[#DFBA7F] uppercase tracking-wider text-[10px]">
                  {level} • {angle.replace('_', ' ')}
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
                    onClick={handleSaveToNotes}
                    className="flex items-center gap-1 text-stone-400 hover:text-[#DFBA7F]"
                  >
                    {savedToNotes ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{savedToNotes ? 'Saved in Notes' : 'Save to Notes'}</span>
                  </button>
                </div>
              </div>

              {/* Formatted Content */}
              <div className="markdown-study-content space-y-3 leading-relaxed text-xs sm:text-sm">
                <Markdown>{explanation}</Markdown>
              </div>
            </div>
          ) : (
            <div
              className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center min-h-[360px] ${
                isDark ? 'bg-[#0D1220] border-white/10' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#DFBA7F]/15 text-[#DFBA7F] flex items-center justify-center mb-3">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-1">Awaiting Concept</h3>
              <p className="text-xs text-stone-400 max-w-sm">
                Enter any term or problem on the left and select your preferred explanation depth.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
