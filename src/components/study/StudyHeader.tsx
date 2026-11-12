import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Timer,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
  FolderPlus,
  Radio,
} from 'lucide-react';
import { Subject, Topic } from '../../types/study';
import { addCustomSubject, addCustomTopic } from '../../utils/studyStorage';

export interface StudyHeaderProps {
  isDark: boolean;
  subjects: Subject[];
  topics: Topic[];
  selectedSubjectId: string;
  selectedTopicId?: string;
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic: (topicId?: string) => void;
  onAddSubject?: (name: string, color?: string) => void;
  onAddTopic?: (subjectId: string, name: string) => void;
  onOpenSearch?: () => void;
  onOpenFocusMode?: () => void;
  onOpenHelp?: () => void;
  onOpenLiveStudy?: () => void;
  onRefreshData?: () => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = ({
  isDark,
  subjects,
  topics,
  selectedSubjectId,
  selectedTopicId,
  onSelectSubject,
  onSelectTopic,
  onAddSubject,
  onAddTopic,
  onOpenSearch,
  onOpenFocusMode,
  onOpenHelp,
  onOpenLiveStudy,
  onRefreshData,
}) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const subjectTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
  const currentTopic = subjectTopics.find((t) => t.id === selectedTopicId);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    if (onAddSubject) {
      onAddSubject(newSubjectName.trim());
    } else {
      addCustomSubject(newSubjectName.trim());
      onRefreshData?.();
    }
    setNewSubjectName('');
    setShowSubjectModal(false);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    if (onAddTopic) {
      onAddTopic(selectedSubjectId, newTopicName.trim());
    } else {
      addCustomTopic(selectedSubjectId, newTopicName.trim());
      onRefreshData?.();
    }
    setNewTopicName('');
    setShowTopicModal(false);
  };

  return (
    <div
      className={`w-full border-b transition-colors px-4 sm:px-6 py-4 ${
        isDark ? 'bg-[#0A0D14]/95 border-white/10' : 'bg-white/95 border-stone-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Subject & Topic selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Dropdown */}
          <div className="relative group">
            <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500 block mb-0.5">
              Subject
            </label>
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Select Study Subject"
                value={selectedSubjectId}
                onChange={(e) => {
                  onSelectSubject(e.target.value);
                  onSelectTopic(undefined);
                }}
                className={`text-sm font-semibold rounded-xl px-3 py-2 border pr-8 appearance-none cursor-pointer outline-none transition-all shadow-sm ${
                  isDark
                    ? 'bg-[#121722] border-white/15 text-stone-100 hover:border-[#C9A063]/50 focus:border-[#C9A063]'
                    : 'bg-stone-50 border-stone-200 text-stone-900 hover:border-[#C9A063]/50 focus:border-[#C9A063]'
                }`}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowSubjectModal(true)}
                title="Add custom subject"
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/5'
                    : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Topic Dropdown */}
          <div className="relative group">
            <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500 block mb-0.5">
              Topic
            </label>
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Select Study Topic"
                value={selectedTopicId || ''}
                onChange={(e) => onSelectTopic(e.target.value || undefined)}
                className={`text-sm font-medium rounded-xl px-3 py-2 border pr-8 appearance-none cursor-pointer outline-none transition-all shadow-sm max-w-[200px] sm:max-w-xs truncate ${
                  isDark
                    ? 'bg-[#121722] border-white/15 text-stone-100 hover:border-[#C9A063]/50 focus:border-[#C9A063]'
                    : 'bg-stone-50 border-stone-200 text-stone-900 hover:border-[#C9A063]/50 focus:border-[#C9A063]'
                }`}
              >
                <option value="">All Topics (General)</option>
                {subjectTopics.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowTopicModal(true)}
                title="Add topic to this subject"
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/5'
                    : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Search, Focus Mode, Help */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Quick Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              isDark
                ? 'bg-[#121722] border-white/10 text-stone-300 hover:border-white/20 hover:text-white'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Search Study Data</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] rounded bg-black/20 text-stone-400 font-mono">
              /
            </kbd>
          </button>

          {/* Live Voice Study Button */}
          {onOpenLiveStudy && (
            <button
              type="button"
              onClick={onOpenLiveStudy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Study</span>
            </button>
          )}

          {/* Focus Mode Button */}
          {onOpenFocusMode && (
            <button
              type="button"
              onClick={onOpenFocusMode}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm hover:opacity-95 transition-opacity"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Focus Mode</span>
            </button>
          )}

          {/* Help Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            title="Study Assistant Guide"
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'border-white/10 text-stone-400 hover:text-stone-200 hover:bg-white/5'
                : 'border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Custom Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-fadeIn ${
              isDark ? 'bg-[#0F131C] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <h3 className="text-lg font-bold mb-1">Create Custom Subject</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add any field of study (e.g. Organic Chemistry, Macroeconomics, Robotics).
            </p>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Subject Name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                  isDark ? 'bg-[#181F2E] border-white/10 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSubjectName.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#C9A063] text-[#080A0E] disabled:opacity-40"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-fadeIn ${
              isDark ? 'bg-[#0F131C] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <h3 className="text-lg font-bold mb-1">Add Topic to {currentSubject?.name}</h3>
            <p className="text-xs text-stone-500 mb-4">
              Break down the subject into clear study modules (e.g. Newton&apos;s Laws, Mitochondria, Linear Equations).
            </p>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Topic Name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                  isDark ? 'bg-[#181F2E] border-white/10 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#C9A063] text-[#080A0E] disabled:opacity-40"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
