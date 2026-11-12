import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Trophy,
  ChevronRight,
  Star,
  Columns3,
  Droplets,
  Heart,
  Compass
} from 'lucide-react';
import { Course, Lesson, LessonStep, UserStats, Achievement } from '../types';
import { COURSES, INITIAL_ACHIEVEMENTS } from '../data/learnData';
import { recordUserActivity } from '../utils/streakManager';
import { useBackHandler } from '../utils/historyManager';
import { t, getLanguageCode } from '../utils/i18n';

interface LearnScreenProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({
  isDark,
  userStats,
  onUpdateStats,
}) => {
  const lang = getLanguageCode(userStats.language);
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [orderItemsState, setOrderItemsState] = useState<{ id: string; text: string; textAr?: string; correctIndex: number }[]>([]);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // Browser Back button navigation hooks
  useBackHandler(Boolean(activeLesson), () => setActiveLesson(null), 'learn-active-lesson');
  useBackHandler(showAchievements, () => setShowAchievements(false), 'learn-achievements');

  // Filter courses
  const filteredCourses = COURSES.filter((c) => {
    if (selectedLevel === 'All') return true;
    return c.level === selectedLevel;
  });

  // Start a lesson
  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentStepIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsCorrectAnswer(null);
    setLessonCompleted(false);

    // Initialize ordering state if first step is ordering
    const firstStep = lesson.steps[0];
    if (firstStep?.type === 'ordering' && firstStep.orderItems) {
      // Shuffle order items
      setOrderItemsState([...firstStep.orderItems].sort(() => Math.random() - 0.5));
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleCheckAnswer = () => {
    if (!activeLesson) return;
    const currentStep = activeLesson.steps[currentStepIndex];

    if (currentStep.type === 'concept') {
      handleNextStep();
      return;
    }

    if (currentStep.type === 'multiple-choice' || currentStep.type === 'match') {
      const selectedOption = currentStep.options?.find(o => o.id === selectedOptionId);
      const isCorrect = !!selectedOption?.isCorrect;
      setIsAnswerSubmitted(true);
      setIsCorrectAnswer(isCorrect);
    } else if (currentStep.type === 'ordering') {
      // Check if current order matches correctIndex 0,1,2...
      const isCorrect = orderItemsState.every((item, idx) => item.correctIndex === idx);
      setIsAnswerSubmitted(true);
      setIsCorrectAnswer(isCorrect);
    }
  };

  const handleMoveOrderItem = (fromIndex: number, toIndex: number) => {
    if (isAnswerSubmitted) return;
    const updated = [...orderItemsState];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setOrderItemsState(updated);
  };

  const handleNextStep = () => {
    if (!activeLesson) return;

    if (currentStepIndex < activeLesson.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsCorrectAnswer(null);

      const nextStep = activeLesson.steps[nextIdx];
      if (nextStep.type === 'ordering' && nextStep.orderItems) {
        setOrderItemsState([...nextStep.orderItems].sort(() => Math.random() - 0.5));
      }
    } else {
      // Completed full lesson!
      setLessonCompleted(true);
      const earnedXP = activeLesson.xp;
      const streakUpdates = recordUserActivity(userStats, 'learning');
      const updatedCompleted = Array.from(new Set([...(userStats.completedLessonIds || []), activeLesson.id]));
      onUpdateStats({
        totalXP: userStats.totalXP + earnedXP,
        lessonsCompleted: updatedCompleted.length,
        completedLessonIds: updatedCompleted,
        ...streakUpdates,
      });

      // Confetti celebration (capped to 24 particles for iOS Safari performance)
      try {
        confetti({
          particleCount: 24,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#f59e0b', '#6366f1'],
        });
      } catch {}
    }
  };

  const currentStep = activeLesson?.steps[currentStepIndex];

  // User Level calculation (e.g. Level 1: Seeker of Knowledge)
  const getUserLevelName = (xp: number) => {
    if (lang === 'ar') {
      if (xp >= 1000) return 'حارس الحكمة (المستوى 5)';
      if (xp >= 500) return 'عالم النور (المستوى 4)';
      if (xp >= 250) return 'طالب الحق (المستوى 3)';
      if (xp >= 100) return 'السالك المخلص (المستوى 2)';
      if (xp === 0) return 'الباحث المبتدئ (المستوى 0)';
      return 'طالب العلم (المستوى 1)';
    }
    if (xp >= 1000) return 'Guardian of Wisdom (Level 5)';
    if (xp >= 500) return 'Scholar of Light (Level 4)';
    if (xp >= 250) return 'Student of Truth (Level 3)';
    if (xp >= 100) return 'Devoted Seeker (Level 2)';
    if (xp === 0) return 'New Seeker (Level 0)';
    return 'Seeker of Knowledge (Level 1)';
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 pb-32 lg:pb-16 space-y-6 animate-fadeIn">
      {/* 1. Duolingo-style XP & Level Progress Banner */}
      <div
        id="learn-level-banner"
        className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          isDark
            ? 'liquid-glass border-[#C9A063]/30 shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
            : 'liquid-glass-light border-[#C9A063]/30 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C9A063] to-[#DFBA7F] text-[#090B0E] flex items-center justify-center shadow-md font-bold">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-cinzel font-semibold text-[#DFBA7F]">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A063]" />
                <span>{getUserLevelName(userStats.totalXP)}</span>
              </div>
              <h2 className={`text-base font-serif-heading font-bold mt-0.5 ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                {userStats.totalXP === 0
                  ? (lang === 'ar' ? 'رحلتك في طلب العلم تبدأ هنا.' : 'Your learning journey starts here.')
                  : `${userStats.totalXP} ${lang === 'ar' ? 'نقطة خبرة' : 'Total XP'}`}
              </h2>
            </div>
          </div>

          {/* Learning Streak Pill */}
          <div className="flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                isDark
                  ? 'bg-[#C9A063]/15 border-[#C9A063]/30 text-[#DFBA7F]'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#C9A063] fill-[#C9A063]" />
              <span>
                {userStats.learningStreak === 0
                  ? (lang === 'ar' ? '0 يوم التزام' : '0d Streak')
                  : `${userStats.learningStreak}${lang === 'ar' ? ' يوم التزام' : 'd Streak'}`}
              </span>
            </div>

            <button
              onClick={() => setShowAchievements(true)}
              className="text-[11px] text-[#DFBA7F] hover:underline flex items-center gap-0.5 font-medium font-cinzel"
            >
              <Award className="w-3 h-3 text-[#C9A063]" />
              <span>{t(lang, 'achievements')}</span>
            </button>
          </div>
        </div>

        {/* XP Level Progress Bar */}
        <div className="w-full bg-stone-800/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] h-2 rounded-full transition-all duration-200 shadow-xs"
            style={{ width: `${Math.max(userStats.totalXP > 0 ? 2 : 0, Math.min(100, (userStats.totalXP % 250) / 2.5))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5">
          <span>{userStats.lessonsCompleted} {t(lang, 'completed')}</span>
          <span>{lang === 'ar' ? 'المرحلة القادمة: ' : 'Next Milestone: '}{Math.max(50, Math.ceil((userStats.totalXP + 1) / 250) * 250)} {lang === 'ar' ? 'نقطة' : 'XP'}</span>
        </div>
      </div>

      {/* 2. Level Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
          const levelLabel = lang === 'ar'
            ? level === 'All' ? 'الكل' : level === 'Beginner' ? 'مبتدئ' : level === 'Intermediate' ? 'متوسط' : 'متقدم'
            : level === 'All' ? t(lang, 'all') : level;

          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedLevel === level
                  ? 'bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] text-[#090B0E] border-[#C9A063] shadow-sm font-bold'
                  : isDark
                  ? 'bg-[#0E1217]/85 border-[#C9A063]/20 text-stone-300 hover:text-white'
                  : 'bg-white border-stone-200 text-stone-700 hover:text-stone-900 shadow-2xs'
              }`}
            >
              {levelLabel}
            </button>
          );
        })}
      </div>

      {/* 3. Courses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            id={`course-card-${course.id}`}
            className={`rounded-3xl p-5 border transition-all ${
              isDark
                ? 'bg-[#0E1217]/98 border-[#C9A063]/20 shadow-md'
                : 'bg-white/98 border-stone-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1E2530] to-[#12161D] border border-[#C9A063]/30 text-[#DFBA7F] flex items-center justify-center shadow-sm`}>
                  {course.id === 'five-pillars' && <Columns3 className="w-5 h-5" />}
                  {course.id === 'wudu-purity' && <Droplets className="w-5 h-5" />}
                  {course.id === 'islamic-manners' && <Heart className="w-5 h-5" />}
                  {course.id === 'quranic-vocabulary' && <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-serif-heading font-bold ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                      {lang === 'ar' ? (course.arabicTitle || course.title) : course.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      course.level === 'Beginner'
                        ? isDark ? 'bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30' : 'bg-amber-50 text-amber-800'
                        : isDark ? 'bg-amber-700/20 text-amber-300 border border-amber-600/30' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {lang === 'ar' ? (course.level === 'Beginner' ? 'مبتدئ' : course.level === 'Intermediate' ? 'متوسط' : 'متقدم') : course.level}
                    </span>
                  </div>
                  {lang !== 'ar' && (
                    <div className="font-arabic text-sm text-[#DFBA7F] font-medium mt-0.5">
                      {course.arabicTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {lang === 'ar' ? (course.descriptionAr || course.description) : course.description}
            </p>

            {/* Lessons in Course */}
            <div className="space-y-2">
              {course.lessons.map((lesson, idx) => {
                const isCompleted = userStats.completedLessonIds?.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    id={`lesson-item-${lesson.id}`}
                    onClick={() => handleStartLesson(lesson)}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] flex items-center justify-between ${
                      isCompleted
                        ? isDark
                          ? 'bg-[#12161D]/90 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                        : isDark
                        ? 'bg-[#12161D]/80 border-white/10 hover:border-[#C9A063]/50'
                        : 'bg-stone-50 border-stone-200 hover:border-[#C9A063]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono border ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-[#C9A063]/15 border-[#C9A063]/30 text-[#DFBA7F]'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div>
                        <div className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-[#F5EFE6]' : 'text-stone-900'}`}>
                          <span>{lang === 'ar' ? (lesson.titleAr || lesson.title) : lesson.title}</span>
                          {isCompleted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {lang === 'ar' ? 'مكتمل' : 'Completed'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {lang === 'ar'
                            ? `${lesson.estimatedMinutes} دقائق • ${lesson.steps.length} خطوات تفاعلية`
                            : `${lesson.estimatedMinutes} mins • ${lesson.steps.length} interactive steps`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#C9A063]/15 text-[#DFBA7F] border-[#C9A063]/30'
                        }`}
                      >
                        +{lesson.xp} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. ACTIVE LESSON MODAL PLAYER */}
      {activeLesson && currentStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all max-h-[90vh] overflow-y-auto flex flex-col justify-between ${
              isDark
                ? 'bg-[#0E1217] border-[#C9A063]/30 shadow-2xl text-white'
                : 'bg-white border-stone-200 shadow-2xl text-stone-900'
            }`}
          >
            {lessonCompleted ? (
              /* LESSON COMPLETED CELEBRATION */
              <div className="text-center py-6 space-y-4 animate-scaleUp">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] mx-auto flex items-center justify-center shadow-xl">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>

                <div>
                  <h3 className="text-xl font-serif-heading font-bold text-[#DFBA7F]">
                    {lang === 'ar' ? 'مبارك! تم إكمال الدرس بنجاح' : 'Mubarak! Lesson Completed'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {lang === 'ar' ? `لقد رسخت علمك في هذا الباب المبارك.` : `You have strengthened your knowledge of ${activeLesson.title}.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3">
                  <div className="p-3 rounded-2xl bg-[#C9A063]/15 border border-[#C9A063]/30">
                    <div className="text-xs font-semibold text-[#DFBA7F]">{lang === 'ar' ? 'النقاط المكتسبة' : 'XP Earned'}</div>
                    <div className="text-xl font-bold text-[#F5EFE6]">+{activeLesson.xp} {lang === 'ar' ? 'نقطة خبرة' : 'XP'}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#DFBA7F]/15 border border-[#DFBA7F]/30">
                    <div className="text-xs font-semibold text-[#DFBA7F]">{lang === 'ar' ? 'استمرار الالتزام' : 'Streak Maintained'}</div>
                    <div className="text-xl font-bold text-[#F5EFE6]">{userStats.learningStreak} {lang === 'ar' ? 'أيام' : 'Days'} 🔥</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveLesson(null)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 text-[#090B0E] font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'ar' ? 'الحمد لله، متابعة' : 'Alhamdulillah, Continue'}
                </button>
              </div>
            ) : (
              /* ACTIVE STEP CARD */
              <div className="space-y-4">
                {/* Step Progress & Close */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-cinzel font-semibold text-[#DFBA7F]">
                    {lang === 'ar'
                      ? `المرحلة ${currentStepIndex + 1} من ${activeLesson.steps.length}`
                      : `Step ${currentStepIndex + 1} of ${activeLesson.steps.length}`}
                  </span>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="text-stone-400 hover:text-stone-200 text-xs font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? '✕ إغلاق' : '✕ Close'}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${((currentStepIndex + 1) / activeLesson.steps.length) * 100}%` }}
                  />
                </div>

                {/* Step Title */}
                <h3 className="text-base font-serif-heading font-bold tracking-tight text-[#F5EFE6]">
                  {lang === 'ar' ? (currentStep.titleAr || currentStep.title) : currentStep.title}
                </h3>

                {/* CONCEPT STEP */}
                {currentStep.type === 'concept' && (
                  <div className="space-y-3 my-3">
                    {currentStep.arabicText && (
                      <div className="p-4 rounded-2xl bg-[#C9A063]/12 border border-[#C9A063]/30 text-center">
                        <div className="font-arabic text-2xl text-[#DFBA7F] font-bold leading-loose">
                          {currentStep.arabicText}
                        </div>
                        {currentStep.transliteration && lang !== 'ar' && (
                          <div className="text-xs italic text-stone-400 mt-1">
                            "{currentStep.transliteration}"
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                      {lang === 'ar' ? (currentStep.contentAr || currentStep.content) : currentStep.content}
                    </p>
                    <div className="p-3 rounded-2xl bg-[#12161D] border border-stone-800 text-xs text-stone-300 italic">
                      💡 {lang === 'ar' ? (currentStep.explanationAr || currentStep.explanation) : currentStep.explanation}
                    </div>
                  </div>
                )}

                {/* MULTIPLE CHOICE / MATCH STEP */}
                {(currentStep.type === 'multiple-choice' || currentStep.type === 'match') && (
                  <div className="space-y-3 my-2">
                    <p className="text-xs font-semibold text-stone-300">
                      {lang === 'ar' ? (currentStep.questionAr || currentStep.question) : currentStep.question}
                    </p>
                    <div className="space-y-2">
                      {currentStep.options?.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        let optionStyle = isDark ? 'bg-[#12161D] border-white/10 text-stone-200' : 'bg-stone-50 border-stone-200 text-stone-800';

                        if (isAnswerSubmitted) {
                          if (opt.isCorrect) {
                            optionStyle = 'bg-[#C9A063]/25 border-[#C9A063] text-[#DFBA7F] font-semibold';
                          } else if (isSelected && !opt.isCorrect) {
                            optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-[#C9A063]/20 border-[#C9A063] text-[#DFBA7F] font-semibold';
                        }

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(opt.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left rtl:text-right text-xs font-medium transition-all cursor-pointer ${optionStyle}`}
                          >
                            {lang === 'ar' ? (opt.textAr || opt.text) : opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ORDERING STEP */}
                {currentStep.type === 'ordering' && (
                  <div className="space-y-3 my-2">
                    <p className="text-xs font-semibold text-stone-300">
                      {lang === 'ar'
                        ? `${currentStep.questionAr || currentStep.question} (المس الأسهم لإعادة الترتيب)`
                        : `${currentStep.question} (Tap arrows to reorder)`}
                    </p>
                    <div className="space-y-2">
                      {orderItemsState.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                            isAnswerSubmitted
                              ? item.correctIndex === idx
                                ? 'bg-[#C9A063]/25 border-[#C9A063] text-[#DFBA7F]'
                                : 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : isDark
                              ? 'bg-[#12161D] border-white/10 text-stone-200'
                              : 'bg-stone-50 border-stone-200 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#C9A063]/20 border border-[#C9A063]/30 text-[#DFBA7F] flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{lang === 'ar' ? (item.textAr || item.text) : item.text}</span>
                          </div>

                          {!isAnswerSubmitted && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveOrderItem(idx, idx - 1)}
                                className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 disabled:opacity-30 text-[10px] cursor-pointer"
                              >
                                ▲
                              </button>
                              <button
                                disabled={idx === orderItemsState.length - 1}
                                onClick={() => handleMoveOrderItem(idx, idx + 1)}
                                className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 disabled:opacity-30 text-[10px] cursor-pointer"
                              >
                                ▼
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FEEDBACK BANNER */}
                {isAnswerSubmitted && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs animate-fadeIn ${
                      isCorrectAnswer
                        ? 'bg-[#C9A063]/20 border-[#C9A063]/40 text-[#DFBA7F]'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isCorrectAnswer ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#DFBA7F]" />
                          <span>{lang === 'ar' ? 'إجابة صحيحة! بارك الله فيك' : 'Correct! SubhanAllah'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>{lang === 'ar' ? 'محاولة طيبة، فلنتدبر الصواب' : 'Good effort, keep learning'}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-300">
                      {lang === 'ar' ? (currentStep.explanationAr || currentStep.explanation) : currentStep.explanation}
                    </p>
                  </div>
                )}

                {/* BOTTOM BUTTON */}
                <div className="pt-2">
                  {!isAnswerSubmitted && currentStep.type !== 'concept' ? (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={currentStep.type === 'multiple-choice' && !selectedOptionId}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 disabled:opacity-40 text-[#090B0E] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {t(lang, 'checkAnswer')}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextStep}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] hover:opacity-95 text-[#090B0E] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>{t(lang, 'continue')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ACHIEVEMENTS MODAL */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border transition-all max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#0E1217] border-[#C9A063]/30 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#DFBA7F]" />
                <h3 className="text-base font-serif-heading font-bold text-[#F5EFE6]">
                  {lang === 'ar' ? 'الإنجازات الإيمانية' : 'Spiritual Achievements'}
                </h3>
              </div>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-bold cursor-pointer"
              >
                {lang === 'ar' ? '✕ إغلاق' : '✕'}
              </button>
            </div>

            <div className="space-y-3">
              {INITIAL_ACHIEVEMENTS.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                    ach.unlocked
                      ? 'bg-[#C9A063]/15 border-[#C9A063]/35'
                      : isDark
                      ? 'bg-[#12161D]/50 border-white/5 opacity-60'
                      : 'bg-stone-100 border-stone-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      ach.unlocked ? 'bg-[#C9A063]/25 text-[#DFBA7F]' : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    🏆
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#F5EFE6]">
                        {lang === 'ar' ? (ach.titleAr || ach.title) : ach.title}
                      </h4>
                      {ach.unlocked && (
                        <span className="text-[10px] text-[#DFBA7F] font-semibold font-cinzel">
                          {lang === 'ar' ? 'تم الإنجاز' : 'Unlocked'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {lang === 'ar' ? (ach.descriptionAr || ach.description) : ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
