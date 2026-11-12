import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Target,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Subject, Topic, StudyPlan, StudyPlanTask } from '../../types/study';
import {
  saveStudyPlan,
  togglePlanTaskCompleted,
  loadStudyData,
  recordStudyActivity,
} from '../../utils/studyStorage';

interface StudyPlannerViewProps {
  isDark: boolean;
  subjects: Subject[];
  selectedSubject: Subject;
  selectedTopic?: Topic;
  onRefreshData?: () => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  isDark,
  subjects,
  selectedSubject,
  selectedTopic,
  onRefreshData,
}) => {
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(() => {
    return loadStudyData().studyPlan;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !targetDate) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/study/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Create a calm, intelligent, non-stressful academic study plan for: "${examTitle}". Target Exam Date: ${targetDate}. Daily study capacity: ${hoursPerDay} hours per day. Subject: ${selectedSubject.name} (${selectedTopic?.name || 'All topics'}).
              Return ONLY a valid JSON array of 5 to 7 sequential study tasks with this structure:
              [
                { "dayLabel": "Day 1", "title": "...", "description": "...", "estimatedMinutes": 60 }
              ]`,
            },
          ],
          subject: selectedSubject.name,
          topic: selectedTopic?.name || '',
        }),
      });

      const data = await res.json();
      let parsedTasks: Array<{
        dayLabel: string;
        title: string;
        description: string;
        estimatedMinutes: number;
      }> = [];

      try {
        const text = data.reply || '[]';
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          parsedTasks = JSON.parse(match[0]);
        }
      } catch (pErr) {
        console.warn('Fallback manual parse', pErr);
      }

      if (parsedTasks.length === 0) {
        parsedTasks = [
          {
            dayLabel: 'Day 1',
            title: `Core Conceptual Review: ${selectedSubject.name}`,
            description: 'Read through fundamentals and highlight key formulas/theorems.',
            estimatedMinutes: hoursPerDay * 60,
          },
          {
            dayLabel: 'Day 2',
            title: 'Active Flashcard Drill',
            description: 'Test recall on high-frequency definitions and concepts.',
            estimatedMinutes: hoursPerDay * 60,
          },
          {
            dayLabel: 'Day 3',
            title: 'Diagnostic Practice Questions',
            description: 'Complete 10 adaptive questions to uncover weak areas.',
            estimatedMinutes: hoursPerDay * 60,
          },
          {
            dayLabel: 'Day 4',
            title: 'Targeted Review & Deep Explanation',
            description: 'Use Explain Mode to conquer tricky concepts.',
            estimatedMinutes: hoursPerDay * 60,
          },
          {
            dayLabel: 'Day 5',
            title: 'Full Simulation Quiz & Rest',
            description: 'Take exam-level quiz, review solutions calmly, and rest.',
            estimatedMinutes: hoursPerDay * 60,
          },
        ];
      }

      const formattedTasks: StudyPlanTask[] = parsedTasks.map((t, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        title: t.title || `Study Session ${idx + 1}`,
        description: t.description || '',
        dueDate: targetDate,
        subjectId: selectedSubject.id,
        completed: false,
        estimatedMinutes: t.estimatedMinutes || 60,
      }));

      const plan: StudyPlan = {
        id: `plan-${Date.now()}`,
        targetGoal: examTitle,
        examDate: targetDate,
        dailyHoursAvailable: hoursPerDay,
        tasks: formattedTasks,
        createdAt: new Date().toISOString(),
      };

      saveStudyPlan(plan);
      setActivePlan(plan);
      recordStudyActivity(
        'planner',
        `Created Study Plan: ${examTitle}`,
        `${formattedTasks.length} calm milestones scheduled before ${targetDate}`,
        selectedSubject.id
      );
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      const fallbackTasks: StudyPlanTask[] = [
        {
          id: `task-${Date.now()}-1`,
          title: `Diagnostic Review: Foundational Concepts in ${selectedSubject.name}`,
          description: `Review syllabus, summarize key terms, and assess baseline comprehension.`,
          dueDate: targetDate,
          subjectId: selectedSubject.id,
          completed: false,
          estimatedMinutes: hoursPerDay * 60,
        },
        {
          id: `task-${Date.now()}-2`,
          title: `Active Recall & Spaced Repetition Mastery`,
          description: `Test core definitions, practice exercises, and solidify key concepts.`,
          dueDate: targetDate,
          subjectId: selectedSubject.id,
          completed: false,
          estimatedMinutes: hoursPerDay * 60,
        },
        {
          id: `task-${Date.now()}-3`,
          title: `Comprehensive Exam Simulation & Final Polish`,
          description: `Timed practice session under test conditions and targeted revision.`,
          dueDate: targetDate,
          subjectId: selectedSubject.id,
          completed: false,
          estimatedMinutes: hoursPerDay * 60,
        },
      ];
      const plan: StudyPlan = {
        id: `plan-${Date.now()}`,
        targetGoal: examTitle,
        examDate: targetDate,
        dailyHoursAvailable: hoursPerDay,
        tasks: fallbackTasks,
        createdAt: new Date().toISOString(),
      };
      saveStudyPlan(plan);
      setActivePlan(plan);
      onRefreshData?.();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    togglePlanTaskCompleted(taskId);
    const updated = loadStudyData().studyPlan;
    setActivePlan(updated);
    onRefreshData?.();
  };

  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activePlan) return;

    const newTask: StudyPlanTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: 'Custom milestone',
      dueDate: activePlan.examDate,
      subjectId: selectedSubject.id,
      completed: false,
      estimatedMinutes: 45,
    };

    const updatedPlan: StudyPlan = {
      ...activePlan,
      tasks: [...activePlan.tasks, newTask],
    };

    saveStudyPlan(updatedPlan);
    setActivePlan(updatedPlan);
    setNewTaskTitle('');
    onRefreshData?.();
  };

  const isArabic = typeof window !== 'undefined'
    ? (localStorage.getItem('noor_app_language') || 'ar') === 'ar'
    : true;

  const completedCount = activePlan?.tasks.filter((t) => t.completed).length || 0;
  const totalCount = activePlan?.tasks.length || 0;

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#DFBA7F]" />
            <span>{isArabic ? 'خطة المذاكرة الذكية' : 'AI Study Planner'}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {isArabic
              ? 'جدولة هادئة ومنهجية للامتحانات والأهداف الأكاديمية دون إجهاد.'
              : 'Structured, calm, milestone-based scheduling for exams and targets without burnout.'}
          </p>
        </div>

        {activePlan && (
          <button
            type="button"
            onClick={() => setActivePlan(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
              isDark ? 'border-white/10 text-stone-300' : 'border-stone-300 text-stone-700'
            }`}
          >
            {isArabic ? 'إنشاء خطة جديدة' : 'Create New Plan'}
          </button>
        )}
      </div>

      {!activePlan ? (
        /* Plan Generator Form */
        <div
          className={`max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-lg ${
            isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#DFBA7F]" />
            <h3 className="text-base font-bold">
              {isArabic ? 'جدولة اختبار أو هدف دراسي' : 'Schedule an Exam or Learning Goal'}
            </h3>
          </div>
          <p className="text-xs text-stone-400 mb-6">
            {isArabic
              ? 'حدد موعد الاختبار وعدد الساعات اليومية المتاحة، وسيقوم الذكاء بتقسيم المنهج إلى محطات يومية ميسرة.'
              : 'Tell the AI your target date and capacity. It will break the syllabus into manageable, bite-sized daily milestones.'}
          </p>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                {isArabic ? 'اسم الاختبار أو الهدف الأكاديمي' : 'Target Exam or Academic Goal'}
              </label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder={isArabic ? 'مثال: اختبار الكيمياء الحيوية، نهائي التفاضل والتكامل، الفقه الميسر' : 'e.g. Organic Chemistry Midterm, Calculus Final, AP Biology Unit 4'}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none ${
                  isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  {isArabic ? 'موعد الاختبار' : 'Target Date'}
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  {isArabic ? 'ساعات المذاكرة المتاحة يومياً' : 'Available Daily Study Hours'}
                </label>
                <select
                  aria-label="Select Daily Study Hours"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <option value={1}>{isArabic ? 'ساعة واحدة يومياً (هادئ)' : '1 hour / day (Calm)'}</option>
                  <option value={2}>{isArabic ? 'ساعتان يومياً (موصى به)' : '2 hours / day (Recommended)'}</option>
                  <option value={3}>{isArabic ? '٣ ساعات يومياً (مكثف)' : '3 hours / day (Intensive)'}</option>
                  <option value={4}>{isArabic ? '٤+ ساعات يومياً (أسبوع الامتحانات)' : '4+ hours / day (Exam Week)'}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !examTitle.trim() || !targetDate}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {isGenerating
                ? (isArabic ? 'جاري بناء الجدول الأكاديمي الهادئ...' : 'Structuring Calm Academic Schedule...')
                : (isArabic ? 'توليد خطة المذاكرة' : 'Generate Study Plan')}
            </button>
          </form>
        </div>
      ) : (
        /* Active Plan View */
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Plan Header Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
              isDark ? 'bg-[#0E131E] border-white/15 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-[#DFBA7F]" />
                <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                  {isArabic ? 'الهدف الأكاديمي' : 'Target Goal'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-100">{activePlan.targetGoal}</h3>
              <p className="text-xs text-stone-400 mt-1">
                {isArabic ? 'تاريخ الهدف: ' : 'Target Date: '}
                <strong>{new Date(activePlan.examDate).toLocaleDateString()}</strong> •{' '}
                {isArabic
                  ? `${activePlan.dailyHoursAvailable} ساعات / يوم`
                  : `${activePlan.dailyHoursAvailable} hrs/day pace`}
              </p>
            </div>

            {/* Progress Fraction */}
            <div className={`flex items-center gap-4 border-t sm:border-t-0 ${isArabic ? 'sm:border-r sm:pr-6' : 'sm:border-l sm:pl-6'} border-white/10 pt-4 sm:pt-0`}>
              <div>
                <span className="text-3xl font-extrabold text-[#DFBA7F] font-mono">
                  {completedCount}
                </span>
                <span className="text-xs text-stone-400 font-mono">/{totalCount}</span>
                <p className="text-[10px] uppercase font-bold text-stone-400">
                  {isArabic ? 'المحطات المكتملة' : 'Milestones Done'}
                </p>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#0E131E] border-white/15' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="font-bold text-sm text-stone-300">
                {isArabic ? 'المحطات المجدولة' : 'Scheduled Milestones'}
              </h4>
              <span className="text-xs text-stone-400 font-mono">
                {Math.round(totalCount > 0 ? (completedCount / totalCount) * 100 : 0)}% {isArabic ? 'مكتمل' : 'Complete'}
              </span>
            </div>

            <div className="space-y-2.5">
              {activePlan.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    task.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-stone-400'
                      : isDark
                      ? 'bg-[#121826] border-white/10 hover:border-white/20 text-stone-200'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-800'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p
                      className={`text-xs sm:text-sm font-semibold ${
                        task.completed ? 'line-through text-stone-500' : 'text-stone-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-stone-400">{task.description}</p>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-500 font-mono shrink-0">
                    {task.estimatedMinutes} {isArabic ? 'د' : 'm'}
                  </span>
                </div>
              ))}
            </div>

            {/* Add manual milestone */}
            <form onSubmit={handleAddManualTask} className="pt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={isArabic ? 'أضف مهمة دراسية مخصصة أخرى...' : 'Add another custom study task...'}
                className={`flex-1 p-2.5 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#141B2B] border-white/10' : 'bg-stone-50 border-stone-200'
                }`}
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-3 py-2.5 rounded-xl bg-[#C9A063] text-[#080A0E] text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                {isArabic ? 'إضافة مهمة' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
