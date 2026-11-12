import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Layers,
  FileQuestion,
  TrendingUp,
  History,
  BookOpen,
} from 'lucide-react';
import { Subject, Topic, MasteryStatus } from '../../types/study';
import {
  calculateAcademicProgress,
  loadStudyData,
  updateTopicMastery,
} from '../../utils/studyStorage';

interface KnowledgeMapProgressViewProps {
  isDark: boolean;
  subjects: Subject[];
  topics: Topic[];
  onRefreshData?: () => void;
}

export const KnowledgeMapProgressView: React.FC<KnowledgeMapProgressViewProps> = ({
  isDark,
  subjects,
  topics,
  onRefreshData,
}) => {
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const progress = calculateAcademicProgress();
  const studyData = loadStudyData();
  const activities = studyData.activities;

  const handleToggleStatus = (topicId: string, currentStatus: MasteryStatus) => {
    let nextStatus: MasteryStatus = 'learning';
    if (currentStatus === 'not_started') nextStatus = 'learning';
    else if (currentStatus === 'learning') nextStatus = 'understood';
    else if (currentStatus === 'understood') nextStatus = 'not_started';

    updateTopicMastery(topicId, nextStatus);
    onRefreshData?.();
  };

  const filteredTopics = activeSubjectFilter === 'all'
    ? topics
    : topics.filter((t) => t.subjectId === activeSubjectFilter);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#DFBA7F]" />
          <span>Knowledge Map & Academic Progress</span>
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Objective evaluation of concepts mastered, in-progress modules, and areas needing review.
        </p>
      </div>

      {/* Academic Metrics Row (Strictly Non-Gamified) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Topics Covered */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Curriculum Studied
            </span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-stone-100 font-mono">
              {progress.topicsStudiedCount}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ {progress.topicsTotalCount} topics</span>
          </div>
          <div className="w-full h-1 rounded-full bg-stone-500/20 mt-3 overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{
                width: `${
                  progress.topicsTotalCount > 0
                    ? (progress.topicsStudiedCount / progress.topicsTotalCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Quiz Accuracy */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Quiz Average
            </span>
            <FileQuestion className="w-4 h-4 text-[#DFBA7F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#DFBA7F] font-mono">
              {progress.quizAverageScore !== null ? `${progress.quizAverageScore}%` : 'N/A'}
            </span>
            <span className="text-xs text-stone-400">({progress.quizzesTakenCount} taken)</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-3 truncate">
            {progress.quizAverageScore !== null
              ? progress.quizAverageScore >= 80
                ? 'High comprehension retention'
                : 'Consistent practice advised'
              : 'No quizzes completed yet'}
          </p>
        </div>

        {/* Metric 3: Flashcards Recall */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Active Recall Cards
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-stone-100 font-mono">
              {progress.flashcardsReviewedCount}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ {progress.flashcardsTotalCount} active</span>
          </div>
          <div className="w-full h-1 rounded-full bg-stone-500/20 mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${
                  progress.flashcardsTotalCount > 0
                    ? (progress.flashcardsReviewedCount / progress.flashcardsTotalCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Metric 4: Focus Time */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Deep Study Time
            </span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-stone-100 font-mono">
              {progress.totalFocusTimeMinutes}
            </span>
            <span className="text-xs text-stone-400 font-mono">minutes total</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-3">Recorded in distraction-free mode</p>
        </div>
      </div>

      {/* Strong Areas vs Areas Needing Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Areas */}
        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3 text-emerald-400">
            <Award className="w-4 h-4" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Strong Areas</h3>
          </div>
          {progress.strongAreas.length === 0 ? (
            <p className="text-xs text-stone-500 py-3">
              No strong areas identified yet. Score 80%+ on quizzes or mark topics as understood to build this list.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {progress.strongAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                >
                  ✓ {area}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Areas Needing Improvement */}
        <div
          className={`p-5 rounded-3xl border ${
            isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Areas Needing Review</h3>
          </div>
          {progress.areasNeedingImprovement.length === 0 ? (
            <p className="text-xs text-stone-500 py-3">
              No weak areas detected! Take quizzes or rate difficult flashcards to identify areas to review.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {progress.areasNeedingImprovement.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300"
                >
                  ⚠ {area}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Knowledge Map Grid */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base">Visual Knowledge Map</h3>
            <p className="text-xs text-stone-400">
              Click any topic badge to cycle its status: Not Started → Learning → Understood
            </p>
          </div>

          {/* Subject filter */}
          <select
            aria-label="Filter Knowledge Map by Subject"
            value={activeSubjectFilter}
            onChange={(e) => setActiveSubjectFilter(e.target.value)}
            className={`p-2 rounded-xl text-xs border outline-none font-medium ${
              isDark ? 'bg-[#141B2B] border-white/10 text-stone-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-stone-400 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>✓ Understood / Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>◐ Currently Learning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-stone-500 bg-transparent" />
            <span>○ Not Started</span>
          </div>
        </div>

        {/* Topics by Subject Bento Grid */}
        <div className="space-y-6">
          {subjects
            .filter((s) => activeSubjectFilter === 'all' || s.id === activeSubjectFilter)
            .map((subj) => {
              const subjTopics = topics.filter((t) => t.subjectId === subj.id);
              if (subjTopics.length === 0) return null;

              return (
                <div key={subj.id} className="space-y-3">
                  <h4 className="text-xs font-bold text-[#DFBA7F] uppercase tracking-wider">
                    {subj.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subjTopics.map((top) => {
                      const isUnderstood = top.masteryStatus === 'understood';
                      const isLearning = top.masteryStatus === 'learning';

                      return (
                        <button
                          key={top.id}
                          type="button"
                          onClick={() => handleToggleStatus(top.id, top.masteryStatus)}
                          className={`p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                            isUnderstood
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              : isLearning
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : isDark
                              ? 'bg-[#121826] border-white/10 text-stone-400 hover:border-white/20'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-stone-100">{top.name}</p>
                            {top.description && (
                              <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">
                                {top.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 mt-0.5">
                            {isUnderstood ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                Mastered
                              </span>
                            ) : isLearning ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                Learning
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-stone-500/15 text-stone-400">
                                To Do
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Real Study History Feed (Strictly Real Data) */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E131E] border-white/10' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#DFBA7F]" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-300">
            Recent Study Activity
          </h3>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 border border-dashed rounded-2xl border-white/10">
            No study activity yet. Complete a quiz, review flashcards, or finish a focus session to log real activity.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 15).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-stone-200">{act.title}</p>
                  <p className="text-stone-400 text-[11px]">{act.details}</p>
                </div>
                <span className="text-[10px] text-stone-500 font-mono shrink-0">
                  {new Date(act.timestamp).toLocaleDateString()}{' '}
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
