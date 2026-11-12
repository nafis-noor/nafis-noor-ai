import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Mic,
  Radio,
  Layers,
  Brain,
  FileQuestion,
  GraduationCap,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { LetterLabView } from './LetterLabView';
import { SpeakingView } from './SpeakingView';
import { LiveArabicView } from './LiveArabicView';
import { ListeningView } from './ListeningView';
import { ReadingView } from './ReadingView';
import { VocabularyFlashcardsView } from './VocabularyFlashcardsView';
import { ArabicIQMemoryView } from './ArabicIQMemoryView';
import { DiagnosticTestView } from './DiagnosticTestView';
import { PersonalAITeacherView } from './PersonalAITeacherView';
import { ArabicProgressTrackingView } from './ArabicProgressTrackingView';
import { ArabicLearningOnboarding } from './ArabicLearningOnboarding';
import { loadArabicProgress } from '../../utils/arabicStorage';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface ArabicLearningViewProps {
  isDark: boolean;
  language?: string;
  onBackToStudyDashboard?: () => void;
}

export type ArabicModuleId =
  | 'overview'
  | 'alphabet'
  | 'speaking'
  | 'live_arabic'
  | 'listening'
  | 'reading'
  | 'vocabulary'
  | 'iq_memory'
  | 'test'
  | 'teacher'
  | 'progress';

interface ModuleCard {
  id: ArabicModuleId;
  title: string;
  arabicTitle: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const ArabicLearningView: React.FC<ArabicLearningViewProps> = ({
  isDark,
  language,
  onBackToStudyDashboard,
}) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [isOnboarded, setIsOnboarded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('nafis_noor_learning_onboarded') === 'true';
  });
  const [reviewOnboarding, setReviewOnboarding] = useState(false);
  const [activeModule, setActiveModule] = useState<ArabicModuleId>('overview');
  const [progress, setProgress] = useState(() => loadArabicProgress());

  const modules: ModuleCard[] = [
    {
      id: 'alphabet',
      title: st.modules.alphabet.title,
      arabicTitle: st.modules.alphabet.arabicTitle,
      description: st.modules.alphabet.description,
      badge: st.modules.alphabet.badge,
      icon: Layers,
      accentColor: '#DFBA7F',
    },
    {
      id: 'speaking',
      title: st.modules.speaking.title,
      arabicTitle: st.modules.speaking.arabicTitle,
      description: st.modules.speaking.description,
      badge: st.modules.speaking.badge,
      icon: Mic,
      accentColor: '#34D399',
    },
    {
      id: 'live_arabic',
      title: st.modules.live_arabic.title,
      arabicTitle: st.modules.live_arabic.arabicTitle,
      description: st.modules.live_arabic.description,
      badge: st.modules.live_arabic.badge,
      icon: Radio,
      accentColor: '#60A5FA',
    },
    {
      id: 'listening',
      title: st.modules.listening.title,
      arabicTitle: st.modules.listening.arabicTitle,
      description: st.modules.listening.description,
      badge: st.modules.listening.badge,
      icon: Volume2,
      accentColor: '#818CF8',
    },
    {
      id: 'reading',
      title: st.modules.reading.title,
      arabicTitle: st.modules.reading.arabicTitle,
      description: st.modules.reading.description,
      badge: st.modules.reading.badge,
      icon: BookOpen,
      accentColor: '#F59E0B',
    },
    {
      id: 'vocabulary',
      title: st.modules.vocabulary.title,
      arabicTitle: st.modules.vocabulary.arabicTitle,
      description: st.modules.vocabulary.description,
      badge: st.modules.vocabulary.badge,
      icon: Layers,
      accentColor: '#A78BFA',
    },
    {
      id: 'iq_memory',
      title: st.modules.iq_memory.title,
      arabicTitle: st.modules.iq_memory.arabicTitle,
      description: st.modules.iq_memory.description,
      badge: st.modules.iq_memory.badge,
      icon: Brain,
      accentColor: '#EC4899',
    },
    {
      id: 'test',
      title: st.modules.test.title,
      arabicTitle: st.modules.test.arabicTitle,
      description: st.modules.test.description,
      badge: st.modules.test.badge,
      icon: FileQuestion,
      accentColor: '#10B981',
    },
    {
      id: 'teacher',
      title: st.modules.teacher.title,
      arabicTitle: st.modules.teacher.arabicTitle,
      description: st.modules.teacher.description,
      badge: st.modules.teacher.badge,
      icon: GraduationCap,
      accentColor: '#C9A063',
    },
    {
      id: 'progress',
      title: st.modules.progress.title,
      arabicTitle: st.modules.progress.arabicTitle,
      description: st.modules.progress.description,
      badge: st.modules.progress.badge,
      icon: TrendingUp,
      accentColor: '#38BDF8',
    },
  ];

  const localizedReadingLevel =
    progress.readingLevel === 'beginner'
      ? st.levelBeginner
      : progress.readingLevel === 'elementary'
      ? st.levelElementary
      : progress.readingLevel === 'intermediate'
      ? st.levelIntermediate
      : st.levelAdvanced;

  // Show the Lifetime Free Reveal -> Terms -> Pre-Release Notice flow on first visit or when reviewing
  if (!isOnboarded || reviewOnboarding) {
    return (
      <div className="space-y-4">
        {reviewOnboarding && (
          <div className="flex justify-end max-w-4xl mx-auto px-4">
            <button
              onClick={() => setReviewOnboarding(false)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ← {st.backToAcademy}
            </button>
          </div>
        )}
        <ArabicLearningOnboarding
          isDark={isDark}
          language={activeLang}
          initialStage={reviewOnboarding ? 'terms' : 'intro'}
          onComplete={() => {
            setIsOnboarded(true);
            setReviewOnboarding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Bar for Arabic Modules */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 overflow-x-auto scrollbar-none transition-all ${
          isDark
            ? 'bg-[#101318]/95 border-white/5 shadow-lg'
            : 'bg-white border-stone-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          {activeModule !== 'overview' && (
            <button
              onClick={() => setActiveModule('overview')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all mr-1 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              title="Return to Arabic Curriculum Hub"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{st.hub}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DFBA7F]" />
            <span className="text-xs font-bold font-serif text-stone-900 dark:text-stone-100 whitespace-nowrap">
              {st.academyTitle}
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
              {st.lifetimeFree}
            </span>
          </div>
        </div>

        {/* Quick Module Switcher Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveModule('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'overview'
                ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {st.curriculum}
          </button>
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeModule === m.id
                  ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] shadow-xs'
                  : isDark
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {m.title}
            </button>
          ))}

          {/* Discreet Terms & Pre-Release Notice Link */}
          <button
            onClick={() => setReviewOnboarding(true)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1 cursor-pointer ${
              isDark
                ? 'border-white/10 bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
                : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Review Lifetime Free Reveal, Terms & Pre-Release Notice"
          >
            <ShieldCheck className="w-3 h-3 text-[#DFBA7F]" />
            <span>{st.termsAndNotice}</span>
          </button>
        </div>
      </div>

      {/* View Router */}
      {activeModule === 'overview' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div
            className={`p-8 rounded-3xl border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#101318] via-[#151921] to-[#101318] border-white/5 shadow-2xl'
                : 'bg-gradient-to-br from-white via-stone-50 to-stone-100 border-stone-200 shadow-xl'
            }`}
          >
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-[#C9A063]/20 text-[#DFBA7F] border border-[#C9A063]/30">
                  {st.heroBadge}
                </span>
                <span className="text-xs text-stone-500">{st.heroSubBadge}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100">
                {st.heroTitle}
              </h1>

              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                {st.heroDesc}
              </p>

              {/* Real Performance Snapshot */}
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {st.lettersMastered}: <strong className="text-[#DFBA7F]">{progress.lettersLearned.length}/28</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>
                    {st.arabicIq}: <strong className="text-[#DFBA7F]">{progress.arabicIQScore}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-300">
                  <GraduationCap className="w-4 h-4 text-[#DFBA7F]" />
                  <span>
                    {st.readingLevel}: <strong className="text-stone-200 capitalize">{localizedReadingLevel}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 10 Specialized Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map(m => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`p-6 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                    isDark
                      ? 'bg-[#101318] border-white/5 hover:border-[#C9A063]/50 hover:bg-[#141820]'
                      : 'bg-white border-stone-200 hover:border-[#C9A063]/50 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${m.accentColor}18`, color: m.accentColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-stone-400 border border-white/5">
                        {m.badge}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#DFBA7F] transition-colors">
                          {m.title}
                        </h3>
                        <span className="text-xs font-serif text-[#DFBA7F]/80">
                          {m.arabicTitle}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/40 dark:border-white/5 flex items-center justify-between text-xs text-[#DFBA7F] font-semibold">
                    <span>{st.enterModule}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specialized Module Views */}
      {activeModule === 'alphabet' && (
        <LetterLabView
          isDark={isDark}
          language={activeLang}
          onLetterLearned={() => setProgress(loadArabicProgress())}
        />
      )}

      {activeModule === 'speaking' && <SpeakingView isDark={isDark} language={activeLang} />}

      {activeModule === 'live_arabic' && <LiveArabicView isDark={isDark} language={activeLang} />}

      {activeModule === 'listening' && <ListeningView isDark={isDark} language={activeLang} />}

      {activeModule === 'reading' && <ReadingView isDark={isDark} language={activeLang} />}

      {activeModule === 'vocabulary' && <VocabularyFlashcardsView isDark={isDark} language={activeLang} />}

      {activeModule === 'iq_memory' && <ArabicIQMemoryView isDark={isDark} language={activeLang} />}

      {activeModule === 'test' && <DiagnosticTestView isDark={isDark} language={activeLang} />}

      {activeModule === 'teacher' && <PersonalAITeacherView isDark={isDark} language={activeLang} />}

      {activeModule === 'progress' && (
        <ArabicProgressTrackingView
          isDark={isDark}
          language={activeLang}
          onNavigateSection={sec => setActiveModule(sec as any)}
        />
      )}
    </div>
  );
};
