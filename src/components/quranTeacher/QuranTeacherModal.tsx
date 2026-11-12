import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Surah, Ayah, UserStats } from '../../types';
import {
  QuranTeacherMode,
  QuranTeacherState,
  RecitationEvaluationResult,
  QuranTeacherSessionStats,
  StruggledAyahRecord,
  QuranTeacherVoiceId,
  QuranTeacherLanguage,
} from '../../types/quranTeacher';
import { QuranTeacherController } from '../../utils/quranTeacherVoice';
import { loadCompleteSurah } from '../../utils/quranLoader';
import { QuranTeacherSetup } from './QuranTeacherSetup';
import { QuranTeacherLesson } from './QuranTeacherLesson';
import { QuranTeacherCompletion } from './QuranTeacherCompletion';
import { recordUserActivity } from '../../utils/streakManager';

interface QuranTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  initialSurahNumber?: number;
  initialStartAyah?: number;
  initialEndAyah?: number;
}

export const QuranTeacherModal: React.FC<QuranTeacherModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userStats,
  onUpdateStats,
  initialSurahNumber = 1,
  initialStartAyah = 1,
  initialEndAyah = 7,
}) => {
  const [modalStep, setModalStep] = useState<'setup' | 'lesson' | 'completion'>('setup');
  const [teacherState, setTeacherState] = useState<QuranTeacherState>('idle');
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [loadedAyahs, setLoadedAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [mode, setMode] = useState<QuranTeacherMode>('learn');
  const [teacherVoice, setTeacherVoice] = useState<QuranTeacherVoiceId>('Fenrir');
  const [teacherLanguage, setTeacherLanguage] = useState<QuranTeacherLanguage>('ar');

  // Real-time audio waveform data
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  // Lesson messages
  const [teacherMessage, setTeacherMessage] = useState<string>('');
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [lastEvaluation, setLastEvaluation] = useState<RecitationEvaluationResult | null>(null);
  const [isAiMuted, setIsAiMuted] = useState(false);

  // Session Statistics tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [ayahEvaluations, setAyahEvaluations] = useState<Map<number, RecitationEvaluationResult[]>>(new Map());
  const [totalRetries, setTotalRetries] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState<QuranTeacherSessionStats | null>(null);

  const controllerRef = useRef<QuranTeacherController | null>(null);

  // Cleanup on unmount or close
  const cleanupController = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupController();
    };
  }, [cleanupController]);

  // If closed, reset state
  useEffect(() => {
    if (!isOpen) {
      cleanupController();
      setModalStep('setup');
      setTeacherState('idle');
      setAudioLevel(0);
      setSpokenTranscript('');
      setLastEvaluation(null);
    }
  }, [isOpen, cleanupController]);

  // Start lesson execution
  const handleStartLesson = async (
    surah: Surah,
    startAyah: number,
    endAyah: number,
    selectedMode: QuranTeacherMode,
    selectedVoice: QuranTeacherVoiceId = 'Fenrir',
    selectedLanguage: QuranTeacherLanguage = 'ar'
  ) => {
    setCurrentSurah(surah);
    setMode(selectedMode);
    setTeacherVoice(selectedVoice);
    setTeacherLanguage(selectedLanguage);
    setSessionStartTime(Date.now());
    setAyahEvaluations(new Map());
    setTotalRetries(0);

    try {
      // Load authentic complete ayahs in user's chosen language
      const allAyahs = await loadCompleteSurah(surah.number, userStats.language);
      // Slice requested range
      const selectedAyahs = allAyahs.filter(
        (a) => a.numberInSurah >= startAyah && a.numberInSurah <= endAyah
      );

      if (selectedAyahs.length === 0) {
        console.warn('[QuranTeacherModal] Could not load the requested Ayahs.');
        return;
      }

      setLoadedAyahs(selectedAyahs);
      setCurrentAyahIndex(0);
      setModalStep('lesson');

      // Initialize voice controller with selected neural voice & language
      const controller = new QuranTeacherController({
        onStateChange: (st) => setTeacherState(st),
        onAudioLevel: (lvl, freq) => {
          setAudioLevel(lvl);
          setFrequencyData(freq);
        },
        onTranscriptChange: (text) => setSpokenTranscript(text),
        onTeacherSpeech: (msg) => setTeacherMessage(msg),
        onAyahEvaluated: (res) => {
          setLastEvaluation(res);
          if (!res.isCorrect) {
            setTotalRetries((prev) => prev + 1);
          }
          setAyahEvaluations((prev) => {
            const next = new Map(prev);
            const existing = next.get(res.ayahNumber) || [];
            next.set(res.ayahNumber, [...existing, res]);
            return next;
          });
        },
        onAyahAdvanced: (nextIndex) => {
          setCurrentAyahIndex(nextIndex);
          setSpokenTranscript('');
          setLastEvaluation(null);
        },
        onLessonCompleted: () => {
          handleFinishLesson(surah, selectedAyahs, selectedMode);
        },
        onError: (err) => {
          console.warn('[QuranTeacherModal] Controller error:', err);
        },
      }, { voice: selectedVoice, language: selectedLanguage });

      controllerRef.current = controller;
      await controller.startLesson(
        surah.number,
        surah.englishName,
        selectedAyahs,
        selectedMode,
        selectedVoice,
        selectedLanguage
      );
    } catch (e) {
      console.error('[QuranTeacherModal] Start error:', e);
    }
  };

  // Finish lesson & calculate stats
  const handleFinishLesson = (
    surah: Surah,
    ayahs: Ayah[],
    lessonMode: QuranTeacherMode
  ) => {
    cleanupController();

    const duration = Math.round((Date.now() - sessionStartTime) / 1000);

    // Build final ayah status summary
    let struggledCount = 0;
    const finalAyahStatus = ayahs.map((a) => {
      const results = ayahEvaluations.get(a.numberInSurah) || [];
      const hasMistake = results.some((r) => !r.isCorrect);
      if (hasMistake) struggledCount++;

      const lastRes = results[results.length - 1];
      return {
        ayahNumber: a.numberInSurah,
        ayahText: a.text,
        status: hasMistake ? ('needs_practice' as const) : ('perfect' as const),
        retries: Math.max(0, results.length - 1),
        lastFeedback: lastRes ? lastRes.feedbackMessage : 'Recited correctly.',
        missingWords: lastRes ? lastRes.missingWords : [],
      };
    });

    const statsObj: QuranTeacherSessionStats = {
      surahNumber: surah.number,
      surahName: surah.name,
      surahEnglishName: surah.englishName,
      startAyah: ayahs[0].numberInSurah,
      endAyah: ayahs[ayahs.length - 1].numberInSurah,
      totalAyahs: ayahs.length,
      mode: lessonMode,
      durationSeconds: duration,
      completedAyahsCount: ayahs.length,
      struggledAyahsCount: struggledCount,
      totalRetries: totalRetries,
      ayahResults: ayahEvaluations,
      finalAyahStatus,
    };

    setSessionStats(statsObj);
    setModalStep('completion');

    // Update user stats & streak
    try {
      const streakUpdates = recordUserActivity(userStats, 'quran');
      onUpdateStats({
        ...streakUpdates,
        totalXP: (userStats.totalXP || 0) + 50,
        lastReadSurah: surah.number,
        lastReadAyah: ayahs[ayahs.length - 1].numberInSurah,
      });

      // Save struggled ayahs to localStorage for Revision mode
      if (struggledCount > 0) {
        const storedStrugglesRaw = localStorage.getItem('noor_quran_teacher_struggles');
        const storedStruggles: StruggledAyahRecord[] = storedStrugglesRaw ? JSON.parse(storedStrugglesRaw) : [];
        finalAyahStatus
          .filter((s) => s.status === 'needs_practice')
          .forEach((s) => {
            storedStruggles.push({
              surahNumber: surah.number,
              ayahNumber: s.ayahNumber,
              ayahText: s.ayahText,
              surahName: surah.englishName,
              mistakeType: s.lastFeedback,
              timestamp: new Date().toISOString(),
            });
          });
        localStorage.setItem('noor_quran_teacher_struggles', JSON.stringify(storedStruggles.slice(-100)));
      }
    } catch (e) {
      console.warn('Error recording stats:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="quran-teacher-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 pt-[max(12px,env(safe-area-inset-top))] pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <div className="w-full flex justify-center">
        {modalStep === 'setup' && (
          <QuranTeacherSetup
            isDark={isDark}
            initialSurahNumber={initialSurahNumber}
            initialStartAyah={initialStartAyah}
            initialEndAyah={initialEndAyah}
            onStartLesson={handleStartLesson}
            onClose={onClose}
          />
        )}

        {modalStep === 'lesson' && currentSurah && loadedAyahs.length > 0 && (
          <QuranTeacherLesson
            isDark={isDark}
            surah={currentSurah}
            ayahs={loadedAyahs}
            currentAyahIndex={currentAyahIndex}
            state={teacherState}
            mode={mode}
            teacherVoice={teacherVoice}
            teacherLanguage={teacherLanguage}
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            teacherMessage={teacherMessage}
            spokenTranscript={spokenTranscript}
            lastEvaluation={lastEvaluation}
            isMuted={isAiMuted}
            onToggleMute={() => {
              const next = !isAiMuted;
              setIsAiMuted(next);
              controllerRef.current?.setMuted(next);
            }}
            onTogglePause={() => controllerRef.current?.togglePauseLesson()}
            onRepeatInstruction={() => controllerRef.current?.repeatTeacherInstruction()}
            onRepeatCurrentAyah={() => controllerRef.current?.repeatCurrentAyah()}
            onExitLesson={() => {
              cleanupController();
              onClose();
            }}
            onReturnToSetup={() => {
              cleanupController();
              setModalStep('setup');
            }}
          />
        )}

        {modalStep === 'completion' && sessionStats && (
          <QuranTeacherCompletion
            isDark={isDark}
            stats={sessionStats}
            onPracticeAgain={() => {
              if (currentSurah) {
                handleStartLesson(
                  currentSurah,
                  sessionStats.startAyah,
                  sessionStats.endAyah,
                  mode,
                  teacherVoice,
                  teacherLanguage
                );
              }
            }}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
