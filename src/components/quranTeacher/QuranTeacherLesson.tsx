import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Ayah, Surah } from '../../types';
import {
  QuranTeacherState,
  QuranTeacherMode,
  RecitationEvaluationResult,
  QuranTeacherVoiceId,
  QuranTeacherLanguage,
} from '../../types/quranTeacher';
import { QuranTeacherWaveform } from './QuranTeacherWaveform';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherLessonProps {
  isDark: boolean;
  surah: Surah;
  ayahs: Ayah[];
  currentAyahIndex: number;
  state: QuranTeacherState;
  mode: QuranTeacherMode;
  audioLevel: number;
  frequencyData?: Uint8Array | null;
  teacherMessage: string;
  spokenTranscript: string;
  lastEvaluation: RecitationEvaluationResult | null;
  isMuted: boolean;
  teacherVoice?: QuranTeacherVoiceId;
  teacherLanguage?: QuranTeacherLanguage;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRepeatInstruction: () => void;
  onRepeatCurrentAyah: () => void;
  onExitLesson: () => void;
  onReturnToSetup?: () => void;
}

export const QuranTeacherLesson: React.FC<QuranTeacherLessonProps> = ({
  isDark,
  surah,
  ayahs,
  currentAyahIndex,
  state,
  mode,
  audioLevel,
  frequencyData,
  teacherMessage,
  spokenTranscript,
  lastEvaluation,
  isMuted,
  teacherVoice = 'Fenrir',
  teacherLanguage = 'ar',
  onToggleMute,
  onTogglePause,
  onRepeatInstruction,
  onRepeatCurrentAyah,
  onExitLesson,
  onReturnToSetup,
}) => {
  const isArabic = getLanguageCode() === 'ar' || teacherLanguage === 'ar';
  const currentAyah = ayahs[currentAyahIndex] || ayahs[0];
  const progressPercent = Math.round(((currentAyahIndex + 1) / ayahs.length) * 100);

  // Status Indicator details
  const getStatusBadge = () => {
    switch (state) {
      case 'ai_speaking':
        return {
          label: isArabic ? 'المعلم يتلو الآية المباركة...' : 'AI Teacher Speaking',
          color: isDark ? 'bg-[#DFBA7F]/20 text-[#DFBA7F] border-[#DFBA7F]/40' : 'bg-amber-100 text-[#8E6527] border-[#C9A063]/40',
          icon: Volume2,
          pulse: true,
        };
      case 'listening':
        return {
          label: audioLevel > 0.08
            ? (isArabic ? 'نور يستمع لتلاوتك الكريمة...' : 'Listening to Recitation...')
            : (isArabic ? 'دورك الآن · اتلُ الآية المباركة' : 'Your Turn · Recite Now'),
          color: audioLevel > 0.08
            ? isDark
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : isDark
            ? 'bg-[#C9A063]/20 text-[#DFBA7F] border-[#C9A063]/40'
            : 'bg-amber-100 text-[#8E6527] border-[#C9A063]/40',
          icon: Mic,
          pulse: true,
        };
      case 'evaluating':
        return {
          label: isArabic ? 'تحليل التلاوة وتأكيد الحفظ...' : 'Analyzing Recitation...',
          color: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Sparkles,
          pulse: true,
        };
      case 'paused':
        return {
          label: isArabic ? 'الجلسة متوقفة مؤقتاً' : 'Lesson Paused',
          color: isDark ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-stone-200 text-stone-700 border-stone-300',
          icon: Pause,
          pulse: false,
        };
      default:
        return {
          label: isArabic ? 'جاهز للتلاوة' : 'Ready',
          color: isDark ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-stone-200 text-stone-700 border-stone-300',
          icon: Mic,
          pulse: false,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  const teacherDisplayName = isArabic
    ? (teacherVoice === 'Fenrir' ? 'الأستاذ راشد' : teacherVoice === 'Kore' ? 'الأستاذة مريم' : 'الشيخ طارق')
    : (teacherVoice === 'Fenrir' ? 'Ustadh Rashid' : teacherVoice === 'Kore' ? 'Ustadha Maryam' : 'Sheikh Tariq');

  const modeDisplayName = isArabic
    ? (mode === 'learn' ? 'تعلّم وتلقين' : mode === 'practice' ? 'تسميع وممارسة' : 'مراجعة وتثبيت')
    : `${mode} Mode`;

  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-[36px] border shadow-md overflow-hidden flex flex-col transition-all duration-200 ${
        isDark
          ? 'bg-[#06080C]/98 border-[#C9A063]/30 text-stone-100'
          : 'bg-white/98 border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(45,35,20,0.06)]'
      }`}
    >
      {/* Top Navigation Bar */}
      <div className="px-6 py-4 border-b border-[#C9A063]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30 flex items-center justify-center font-serif-heading font-bold text-xs">
            {surah.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide">
                {isArabic ? `سورة ${surah.name}` : `Surah ${surah.englishName}`}
              </span>
              {!isArabic && (
                <span className="text-xs text-stone-400 font-arabic">
                  {surah.name}
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span>{isArabic ? `الآية ${currentAyah.numberInSurah} من أصل ${surah.numberOfAyahs} آية` : `Ayah ${currentAyah.numberInSurah} of ${surah.numberOfAyahs}`}</span>
              <span>•</span>
              <span>{modeDisplayName}</span>
              <span>•</span>
              <span className="text-[#DFBA7F] font-medium">{teacherDisplayName}</span>
            </div>
          </div>
        </div>

        {/* Progress & Exit */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-mono font-semibold text-[#DFBA7F]">
              {isArabic ? `${currentAyahIndex + 1} من ${ayahs.length} آيات` : `${currentAyahIndex + 1} / ${ayahs.length} Ayahs`}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-stone-800/40 overflow-hidden mt-1 border border-[#C9A063]/20">
              <div
                className="h-full bg-gradient-to-r from-[#C9A063] to-[#DFBA7F] transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Settings / Return to Setup */}
          {onReturnToSetup && (
            <button
              type="button"
              onClick={onReturnToSetup}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isDark
                  ? 'bg-stone-900/80 border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800'
                  : 'bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-200'
              }`}
              title={isArabic ? 'تغيير إعدادات الجلسة' : 'Session Settings'}
            >
              <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
            </button>
          )}

          {/* Prominent Exit Button */}
          <button
            type="button"
            onClick={onExitLesson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/35 transition-all shadow-xs cursor-pointer active:scale-95"
            title={isArabic ? 'خروج من المعلم والعودة للمصحف' : 'Exit Lesson and return to reader'}
          >
            <X className="w-4 h-4" />
            <span className="font-medium">{isArabic ? 'خروج' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Main Lesson Stage */}
      <div className="p-6 sm:p-10 flex flex-col items-center justify-between min-h-[460px]">
        {/* Status Indicator & Teacher Persona Badge */}
        <div className="flex items-center flex-wrap justify-center gap-2 mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusBadge.color}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${statusBadge.pulse ? 'animate-pulse' : ''}`} />
            <span>{statusBadge.label}</span>
          </span>

          {/* Teacher Badge */}
          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#C9A063]/10 text-[#DFBA7F] border border-[#C9A063]/25 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DFBA7F]" />
            <span>{teacherDisplayName}</span>
          </span>

          {isMuted && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              {isArabic ? 'الصوت مكتوم' : 'AI Audio Muted'}
            </span>
          )}
        </div>

        {/* Authentic Quran Ayah Card */}
        <div className="w-full max-w-3xl my-auto text-center px-4 py-8 sm:py-10 rounded-3xl relative overflow-hidden bg-gradient-to-b from-[#C9A063]/5 via-transparent to-[#C9A063]/5 border border-[#C9A063]/15">
          {/* Bismillah Header if applicable */}
          {currentAyah.numberInSurah === 1 && surah.number !== 9 && surah.number !== 1 && (
            <div className="font-arabic text-xl sm:text-2xl text-[#DFBA7F]/80 mb-6 select-none">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}

          {/* Large Authentic Quran Text */}
          <div
            className={`font-arabic text-3xl sm:text-4xl md:text-5xl leading-[2.2] sm:leading-[2.3] transition-all tracking-normal ${
              isDark ? 'text-[#F5EFE6]' : 'text-stone-900'
            }`}
            dir="rtl"
          >
            {currentAyah.text}
            <span className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 mx-2 rounded-full border border-[#C9A063]/40 text-xs sm:text-sm font-sans font-bold text-[#DFBA7F] align-middle bg-[#C9A063]/10">
              {currentAyah.numberInSurah}
            </span>
          </div>

          {/* Translation */}
          {!isArabic && currentAyah.translation && (
            <p
              className={`mt-6 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed ${
                isDark ? 'text-stone-300' : 'text-stone-600'
              }`}
            >
              "{currentAyah.translation}"
            </p>
          )}

          {/* Live Recognized Spoken Preview */}
          {spokenTranscript && (
            <div className="mt-5 inline-block px-4 py-2 rounded-2xl bg-[#080A0E]/70 border border-[#C9A063]/25 text-xs text-[#DFBA7F] max-w-lg">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">{isArabic ? 'ما تم سماعه:' : 'Heard:'}</span>
              <span className="font-arabic text-sm">{spokenTranscript}</span>
            </div>
          )}
        </div>

        {/* Real-time Reactive Waveform */}
        <div className="w-full max-w-md my-4">
          <QuranTeacherWaveform
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            isActive={state === 'listening'}
            isDark={isDark}
            state={state}
          />
        </div>

        {/* Teacher Instruction Bubble */}
        <div
          className={`w-full max-w-xl p-4 sm:p-5 rounded-2xl border text-center transition-all duration-200 shadow-md ${
            isDark
              ? 'bg-[#0E1218]/90 border-[#C9A063]/25 text-stone-200'
              : 'bg-stone-50 border-[#C9A063]/30 text-stone-800'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#DFBA7F] uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DFBA7F]" />
            <span>{isArabic ? `توجيه ${teacherDisplayName}` : `${teacherDisplayName} Feedback`}</span>
          </div>

          <p className="text-sm font-medium leading-relaxed font-arabic text-base sm:text-lg text-[#DFBA7F]/95 my-1" dir="rtl">
            {teacherLanguage === 'ar' && lastEvaluation?.spokenFeedbackInstructionAr
              ? lastEvaluation.spokenFeedbackInstructionAr
              : teacherMessage || 'السَّلامُ عَلَيْكُمْ. تَفَضَّلْ بِالتِّلَاوَةِ حِينَ تَكُونُ مُسْتَعِدًّا.'}
          </p>

          {teacherLanguage !== 'ar' && teacherMessage && (
            <p className="text-xs text-stone-400 font-sans mt-1">{teacherMessage}</p>
          )}

          {/* Specific mistake breakdown if student struggled */}
          {lastEvaluation && !lastEvaluation.isCorrect && (
            <div className="mt-3 pt-2.5 border-t border-stone-700/30 text-xs">
              {lastEvaluation.missingWords.length > 0 && (
                <div className="text-amber-400 font-medium">
                  <span>{isArabic ? 'كلمات ساقطة من التلاوة: ' : 'Missing: '}</span>
                  <span className="font-arabic font-bold text-sm">{lastEvaluation.missingWords.join(' · ')}</span>
                </div>
              )}
              {lastEvaluation.incorrectWords.length > 0 && (
                <div className="text-rose-400 mt-1 font-medium">
                  <span>{isArabic ? 'الصواب: ' : 'Expected: '}</span>
                  <span className="font-arabic font-bold text-sm">{lastEvaluation.incorrectWords[0].expected}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="px-6 py-4 border-t border-[#C9A063]/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              state === 'paused'
                ? 'bg-[#C9A063] text-[#080A0E] border-[#C9A063]'
                : isDark
                ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-950'
            }`}
          >
            {state === 'paused' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{state === 'paused' ? (isArabic ? 'متابعة' : 'Resume') : (isArabic ? 'إيقاف مؤقت' : 'Pause')}</span>
          </button>

          {/* Mute AI */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs border transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : isDark
                ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-950'
            }`}
            title={isMuted ? (isArabic ? 'تشغيل صوت المعلم' : 'Unmute AI voice') : (isArabic ? 'كتم صوت المعلم' : 'Mute AI voice')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Exit Lesson */}
          <button
            type="button"
            onClick={onExitLesson}
            className="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all text-rose-400 border-rose-500/30 hover:bg-rose-500/15"
            title={isArabic ? 'إنهاء جلسة التسميع والخروج' : 'Exit lesson and return to reader'}
          >
            <X className="w-3.5 h-3.5" />
            <span>{isArabic ? 'خروج' : 'Exit'}</span>
          </button>
        </div>

        {/* Repeat Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRepeatInstruction}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-950'
            }`}
            title={isArabic ? 'إعادة توجيه المعلم' : "Repeat teacher's instruction"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة التوجيه' : 'Repeat Instruction'}</span>
          </button>

          <button
            type="button"
            onClick={onRepeatCurrentAyah}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-700 text-[#DFBA7F] hover:bg-stone-800'
                : 'bg-amber-50 border-[#C9A063]/40 text-[#8E6527] hover:bg-amber-100'
            }`}
            title={isArabic ? 'إعادة الاستماع للآية الحالية' : 'Repeat current ayah from beginning'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة الآية' : 'Repeat Ayah'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
