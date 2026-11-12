import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Notebook,
  Plus,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Eye,
  Edit3,
  Tag,
  Save,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { Subject, Topic, StudyNote } from '../../types/study';
import { saveStudyNote, deleteStudyNote, loadStudyData } from '../../utils/studyStorage';
import { getApiUrl } from '../../utils/apiConfig';

interface SmartNotesViewProps {
  isDark: boolean;
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const SmartNotesView: React.FC<SmartNotesViewProps> = ({
  isDark,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [notes, setNotes] = useState<StudyNote[]>(() => {
    return loadStudyData().notes;
  });

  const [activeNote, setActiveNote] = useState<StudyNote | null>(() => {
    const all = loadStudyData().notes;
    return all.length > 0 ? all[0] : null;
  });

  // Editor states
  const [isEditing, setIsEditing] = useState(true);
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');
  const [tagsText, setTagsText] = useState(activeNote?.tags?.join(', ') || '');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const reloadNotes = (newActive?: StudyNote) => {
    const updated = loadStudyData().notes;
    setNotes(updated);
    if (newActive) {
      setActiveNote(newActive);
      setTitle(newActive.title);
      setContent(newActive.content);
      setTagsText(newActive.tags.join(', '));
    } else if (activeNote && !updated.some((n) => n.id === activeNote.id)) {
      const fallback = updated[0] || null;
      setActiveNote(fallback);
      setTitle(fallback?.title || '');
      setContent(fallback?.content || '');
      setTagsText(fallback?.tags?.join(', ') || '');
    }
    onRefreshData?.();
  };

  const handleSelectNote = (n: StudyNote) => {
    setActiveNote(n);
    setTitle(n.title);
    setContent(n.content);
    setTagsText(n.tags?.join(', ') || '');
  };

  const handleCreateNew = () => {
    const newNote = saveStudyNote({
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: 'Untitled Note',
      content: '',
      tags: [selectedSubject.name],
    });
    reloadNotes(newNote);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved = saveStudyNote({
      id: activeNote?.id,
      subjectId: selectedSubject.id,
      topicId: selectedTopic?.id,
      title: title.trim(),
      content,
      tags,
    });

    setSaveStatus('Saved!');
    reloadNotes(saved);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleDelete = (noteId: string) => {
    deleteStudyNote(noteId);
    reloadNotes();
  };

  const handleAiOrganize = async () => {
    if (!content.trim()) {
      setSaveStatus('Please enter or paste some rough notes first.');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsOrganizing(true);
    try {
      const res = await fetch(getApiUrl('/api/study/organize-notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: content,
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
        }),
      });

      const data = await res.json();
      if (data.structuredNotes) {
        setContent(data.structuredNotes);
        setSaveStatus('Organized by AI! Review & save.');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Failed to organize notes. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter notes for selected subject
  const subjectNotes = notes.filter((n) => n.subjectId === selectedSubject.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Notebook className="w-5 h-5 text-[#DFBA7F]" />
            <span>AI Smart Notes</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Structured study notes with automated AI formatting and revision summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Notes List */}
        <div className="lg:col-span-4 space-y-3">
          <div
            className={`p-4 rounded-3xl border shadow-sm ${
              isDark ? 'bg-[#0E131E] border-white/15' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-stone-400 mb-3 px-1">
              <span className="font-bold uppercase tracking-wider">
                {selectedSubject.name} Notes ({subjectNotes.length})
              </span>
            </div>

            {subjectNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 border border-dashed rounded-2xl border-white/10">
                <Notebook className="w-6 h-6 mx-auto mb-2 text-stone-500" />
                <p>No notes in this subject yet.</p>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C9A063] text-[#080A0E]"
                >
                  Create First Note
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {subjectNotes.map((n) => {
                  const isSelected = activeNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleSelectNote(n)}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-xs space-y-1 transition-all ${
                        isSelected
                          ? 'bg-[#C9A063]/15 border-[#C9A063] text-[#DFBA7F]'
                          : isDark
                          ? 'bg-[#121826] border-white/10 hover:border-white/20 text-stone-300'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold truncate text-stone-100">{n.title || 'Untitled'}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          className="p-1 text-stone-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-2">
                        {n.content || '(Empty content)'}
                      </p>
                      <span className="text-[10px] text-stone-500 font-mono block pt-0.5">
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Note Editor / Markdown Preview */}
        <div className="lg:col-span-8">
          {activeNote ? (
            <div
              className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
                isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              {/* Note Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="font-bold text-base sm:text-lg bg-transparent outline-none flex-1 min-w-[200px]"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiOrganize}
                    disabled={isOrganizing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#DFBA7F]/20 text-[#DFBA7F] border border-[#DFBA7F]/30 hover:bg-[#DFBA7F]/30 disabled:opacity-40 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isOrganizing ? 'Organizing...' : 'AI Organize'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-2 rounded-xl border text-xs ${
                      !isEditing ? 'bg-[#C9A063] text-[#080A0E]' : 'border-white/10 text-stone-300'
                    }`}
                    title={isEditing ? 'Preview Markdown' : 'Edit raw text'}
                  >
                    {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 rounded-xl border border-white/10 text-stone-400 hover:text-stone-200"
                    title="Copy note"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C9A063] text-[#080A0E] shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {saveStatus && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  {saveStatus}
                </div>
              )}

              {/* Tags line */}
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="Comma-separated tags (e.g. Exam 1, Formulas, Chapter 3)"
                  className="bg-transparent border-b border-white/10 text-xs py-0.5 outline-none flex-1 text-stone-300"
                />
              </div>

              {/* Content Area */}
              {isEditing ? (
                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your study notes, paste text, or jot down ideas. Click 'AI Organize' to turn rough notes into formatted exam summaries!"
                  className={`w-full p-4 rounded-2xl text-xs sm:text-sm border outline-none font-mono leading-relaxed resize-y ${
                    isDark ? 'bg-[#141B2B] border-white/10 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              ) : (
                <div
                  className={`p-5 rounded-2xl border min-h-[300px] text-xs sm:text-sm leading-relaxed markdown-study-content space-y-3 ${
                    isDark ? 'bg-[#141B2B] border-white/10 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <Markdown>{content || '*No content to display*'}</Markdown>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`p-16 text-center rounded-3xl border flex flex-col items-center justify-center min-h-[400px] ${
                isDark ? 'bg-[#0D1220] border-white/10' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Notebook className="w-10 h-10 text-stone-500 mb-2" />
              <h3 className="font-bold text-base mb-1">No Note Selected</h3>
              <p className="text-xs text-stone-400 mb-4">
                Select an existing note from the list or create a new one.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C9A063] text-[#080A0E]"
              >
                Create Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
