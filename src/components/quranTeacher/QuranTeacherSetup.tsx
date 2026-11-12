import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  GraduationCap,
  Play,
  Flame,
  ArrowRight,
  Sliders,
  ChevronDown,
  X
} from 'lucide-react';
import { Surah } from '../../types';
import { ALL_SURAHS } from '../../data/quranData';
import { QuranTeacherMode, QuranTeacherVoiceId, QuranTeacherLanguage } from '../../types/quranTeacher';
import { getLanguageCode } from '../../utils/i18n';

interface QuranTeacherSetupProps {
  isDark: boolean;
  initialSurahNumber?: number;
  initialStartAyah?: number;
  initialEndAyah?: number;
  onStartLesson: (
    surah: Surah,
    startAyah: number,
    endAyah: number,
    mode: QuranTeacherMode,
    voice: QuranTeacherVoiceId,
    language: QuranTeacherLanguage
  ) => void;
  onClose: () => void;
}

export const QuranTeacherSetup: React.FC<QuranTeacherSetupProps> = ({
  isDark,
  initialSurahNumber = 1,
  initialStartAyah = 1,
  initialEndAyah = 7,
  onStartLesson,
  onClose,
}) => {
  const isArabic = getLanguageCode() === 'ar';

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
  const [surahSearch, setSurahSearch] = useState('');
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<QuranTeacherVoiceId>('Fenrir');
  const [selectedLanguage, setSelectedLanguage] = useState<QuranTeacherLanguage>(isArabic ? 'ar' : 'en');

  const selectedSurah = useMemo(() => {
    return ALL_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_SURAHS[0];
  }, [selectedSurahNumber]);

  const maxAyahs = selectedSurah.numberOfAyahs;

  const [startAyah, setStartAyah] = useState<number>(() => {
    return Math.min(Math.max(1, initialStartAyah), maxAyahs);
  });

  const [endAyah, setEndAyah] = useState<number>(() => {
    if (selectedSurah.number === 1) return 7;
    return Math.min(Math.max(startAyah, initialEndAyah || Math.min(startAyah + 6, maxAyahs)), maxAyahs);
  });

  const [selectedMode, setSelectedMode] = useState<QuranTeacherMode>('learn');

  // Filter Surahs by search query (Arabic name, English name, number)
  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return ALL_SURAHS;
    const q = surahSearch.toLowerCase().trim();
    return ALL_SURAHS.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q
    );
  }, [surahSearch]);

  const totalAyahsSelected = useMemo(() => {
    return Math.max(1, endAyah - startAyah + 1);
  }, [startAyah, endAyah]);

  // Quick preset ranges with deduplicated, unique keys
  const presetOptions = useMemo(() => {
    const defaultSteps = [3, 5, 7, 10];
    const validSteps = defaultSteps.filter((n) => n < maxAyahs);
    const result: { count: number; isFull: boolean; key: string }[] = validSteps.map((n) => ({
      count: n,
      isFull: false,
      key: `step-${n}`,
    }));
    result.push({
      count: maxAyahs,
      isFull: true,
      key: `full-surah-${maxAyahs}`,
    });
    return result;
  }, [maxAyahs]);

  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    const surah = ALL_SURAHS.find((s) => s.number === surahNum) || ALL_SURAHS[0];
    setStartAyah(1);
    setEndAyah(Math.min(7, surah.numberOfAyahs));
    setIsSurahDropdownOpen(false);
    setSurahSearch('');
  };

  const handleStartAyahChange = (val: number) => {
    const clamped = Math.min(Math.max(1, val), maxAyahs);
    setStartAyah(clamped);
    if (endAyah < clamped) {
      setEndAyah(clamped);
    }
  };

  const handleEndAyahChange = (val: number) => {
    const clamped = Math.min(Math.max(startAyah, val), maxAyahs);
    setEndAyah(clamped);
  };

  // Quick preset ranges
  const setPresetRange = (count: number) => {
    const targetEnd = Math.min(startAyah + count - 1, maxAyahs);
    setEndAyah(targetEnd);
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-[32px] p-6 sm:p-8 border shadow-md transition-all duration-200 ${
        isDark
          ? 'bg-[#080B10]/98 border-[#C9A063]/30 text-stone-100'
          : 'bg-white/98 border-[#C9A063]/35 text-stone-900 shadow-[0_2px_8px_rgba(45,35,20,0.06)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-[#C9A063]/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#8E6527] flex items-center justify-center text-[#080A0E] shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif-heading tracking-wide">
                {isArabic ? 'معلم القرآن التفاعلي' : 'Quran Teacher AI'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C9A063]/20 text-[#DFBA7F] border border-[#C9A063]/30">
                {isArabic ? 'جلسة صوتية حية' : 'Live Voice Session'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {isArabic
                ? 'تسميع صوتي مباشر وتصحيح تفاعلي مستمر مع توجيهات المعلم الموثوقة'
                : 'Interactive, continuous voice recitation with authentic teacher guidance'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-500/10 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 border border-stone-500/20 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95"
          title={isArabic ? 'إغلاق المعلم والعودة' : 'Close and return'}
        >
          <X className="w-4 h-4" />
          <span>{isArabic ? 'إغلاق' : 'Close'}</span>
        </button>
      </div>

      {/* Surah Selection */}
      <div className="mt-6">
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-[#DFBA7F]' : 'text-[#8E6527]'}`}>
          {isArabic ? 'اختيار السورة الكريمة' : 'Select Surah'}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
              isDark
                ? 'bg-[#0E1218] border-[#C9A063]/30 hover:border-[#DFBA7F]/60 text-white'
                : 'bg-stone-50 border-[#C9A063]/35 hover:border-[#A67C38] text-stone-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/25 flex items-center justify-center font-mono text-xs font-bold">
                {selectedSurah.number}
              </span>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span>{isArabic ? `سورة ${selectedSurah.name}` : selectedSurah.englishName}</span>
                  {!isArabic && (
                    <span className="text-xs text-stone-400 font-normal">({selectedSurah.englishNameTranslation})</span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400">
                  {isArabic
                    ? `${selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${selectedSurah.numberOfAyahs} آيات`
                    : `${selectedSurah.revelationType} • ${selectedSurah.numberOfAyahs} Ayahs`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-arabic text-xl text-[#DFBA7F]">{selectedSurah.name}</span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isSurahDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Surah Dropdown Menu */}
          {isSurahDropdownOpen && (
            <div
              className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border max-h-72 flex flex-col shadow-lg overflow-hidden ${
                isDark ? 'bg-[#0A0D13] border-[#C9A063]/30' : 'bg-white border-[#C9A063]/40'
              }`}
            >
              {/* Search bar inside dropdown */}
              <div className="p-3 border-b border-[#C9A063]/20 sticky top-0 bg-inherit">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder={isArabic ? 'ابحث عن السورة باسمها أو رقمها...' : 'Search Surah by name or number...'}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-stone-900/90 border-stone-700 text-white placeholder-stone-500 focus:border-[#DFBA7F]'
                        : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#A67C38]'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Surah List */}
              <div className="overflow-y-auto divide-y divide-stone-800/30">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => handleSurahChange(surah.number)}
                    className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                      surah.number === selectedSurah.number
                        ? isDark
                          ? 'bg-[#C9A063]/20 text-[#DFBA7F]'
                          : 'bg-amber-100 text-[#8E6527]'
                        : isDark
                        ? 'hover:bg-white/5 text-stone-200'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold w-6 text-stone-400">{surah.number}</span>
                      <div>
                        <div className="text-xs font-semibold">{isArabic ? `سورة ${surah.name}` : surah.englishName}</div>
                        <div className="text-[10px] text-stone-400">{isArabic ? `${surah.numberOfAyahs} آيات` : `${surah.numberOfAyahs} Ayahs`}</div>
                      </div>
                    </div>
                    <span className="font-arabic text-base text-[#DFBA7F]">{surah.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ayah Range Selection */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#DFBA7F]' : 'text-[#8E6527]'}`}>
            {isArabic ? 'نطاق الآيات المباركة للتسميع' : 'Recitation Range'}
          </label>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
            {isArabic ? `تم تحديد ${totalAyahsSelected} آيات` : `${totalAyahsSelected} ${totalAyahsSelected === 1 ? 'Ayah' : 'Ayahs'} selected`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Starting Ayah */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#0E1218] border-[#C9A063]/25' : 'bg-stone-50 border-[#C9A063]/25'
            }`}
          >
            <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'آية البداية' : 'Starting Ayah'}</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                min={1}
                max={maxAyahs}
                value={startAyah}
                onChange={(e) => handleStartAyahChange(parseInt(e.target.value) || 1)}
                className={`w-20 font-mono text-xl font-bold bg-transparent outline-none ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              />
              <span className="text-xs text-stone-400 font-mono">/ {maxAyahs}</span>
            </div>
          </div>

          {/* Ending Ayah */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-[#0E1218] border-[#C9A063]/25' : 'bg-stone-50 border-[#C9A063]/25'
            }`}
          >
            <span className="text-[11px] text-stone-400 block mb-1">{isArabic ? 'آية النهاية' : 'Ending Ayah'}</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                min={startAyah}
                max={maxAyahs}
                value={endAyah}
                onChange={(e) => handleEndAyahChange(parseInt(e.target.value) || startAyah)}
                className={`w-20 font-mono text-xl font-bold bg-transparent outline-none ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              />
              <span className="text-xs text-stone-400 font-mono">/ {maxAyahs}</span>
            </div>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-stone-400 whitespace-nowrap">{isArabic ? 'خيارات سريعة:' : 'Presets:'}</span>
          {presetOptions.map((opt) => {
            const isFull = opt.isFull;
            const label = isFull ? (isArabic ? 'كامل السورة' : 'Full Surah') : `${opt.count} ${isArabic ? 'آيات' : 'Ayahs'}`;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPresetRange(opt.count)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  totalAyahsSelected === Math.min(opt.count, maxAyahs - startAyah + 1)
                    ? isDark
                      ? 'bg-[#C9A063] text-[#080A0E] font-semibold'
                      : 'bg-[#A67C38] text-white font-semibold'
                    : isDark
                    ? 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Mode Selection */}
      <div className="mt-6">
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-[#DFBA7F]' : 'text-[#8E6527]'}`}>
          {isArabic ? 'نمط الجلسة التعليمية' : 'Lesson Mode'}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Learn Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('learn')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'learn'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'تعلّم وتلقين' : 'Learn'}</span>
              {selectedMode === 'learn' && <CheckCircle2 className="w-4 h-4 text-[#DFBA7F]" />}
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {isArabic
                ? 'توجيه خطوة بخطوة. المعلم يقرأ الآية ويؤكد صحة قراءتك.'
                : 'Step-by-step guidance. AI introduces each ayah and confirms accuracy.'}
            </p>
          </button>

          {/* Practice Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('practice')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'practice'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'تسميع وممارسة' : 'Practice'}</span>
              {selectedMode === 'practice' && <CheckCircle2 className="w-4 h-4 text-[#DFBA7F]" />}
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {isArabic
                ? 'تسميع حر ومستقل مع تقييم الآيات وتثبيت الحفظ.'
                : 'Independent recitation. Less teacher intervention, evaluates on pause.'}
            </p>
          </button>

          {/* Revision Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('revision')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedMode === 'revision'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold">{isArabic ? 'مراجعة وتثبيت' : 'Revision'}</span>
              {selectedMode === 'revision' && <CheckCircle2 className="w-4 h-4 text-[#DFBA7F]" />}
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {isArabic
                ? 'تثبيت الحفظ في الذاكرة والتركيز على مواضع الإتقان.'
                : 'Memory reinforcement. Focuses on areas needing perfection.'}
            </p>
          </button>
        </div>
      </div>

      {/* Flagship Teacher Voice & Persona Selection */}
      <div className="mt-6 pt-5 border-t border-[#C9A063]/15">
        <label className="block text-xs font-semibold text-[#DFBA7F] uppercase tracking-wider mb-2.5">
          {isArabic ? 'نبرة صوت وشخصية المعلم' : 'AI Teacher Voice & Persona'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Ustadh Rashid - Fenrir */}
          <button
            type="button"
            onClick={() => setSelectedVoice('Fenrir')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Fenrir'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الأستاذ راشد' : 'Ustadh Rashid'}</span>
              {selectedVoice === 'Fenrir' && <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />}
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              {isArabic ? 'صوت وقور ورصين بنطق عربي فصيح وهادئ.' : 'Mature, calm & dignified voice with classical Arabic phonetics.'}
            </p>
          </button>

          {/* Ustadha Maryam - Kore */}
          <button
            type="button"
            onClick={() => setSelectedVoice('Kore')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Kore'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الأستاذة مريم' : 'Ustadha Maryam'}</span>
              {selectedVoice === 'Kore' && <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />}
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              {isArabic ? 'صوت دافئ ومريح للنفس بنطق فائق الوضوح.' : 'Warm, serene & soothing voice with crystal-clear pronunciation.'}
            </p>
          </button>

          {/* Sheikh Tariq - Charon */}
          <button
            type="button"
            onClick={() => setSelectedVoice('Charon')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedVoice === 'Charon'
                ? isDark
                  ? 'bg-gradient-to-b from-[#C9A063]/25 to-[#DFBA7F]/10 border-[#DFBA7F] shadow-[0_0_15px_rgba(201,160,99,0.15)] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] shadow-sm ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 hover:border-stone-700'
                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">{isArabic ? 'الشيخ طارق' : 'Sheikh Tariq'}</span>
              {selectedVoice === 'Charon' && <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />}
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              {isArabic ? 'صوت خاشع ومفكر مع وقفات متأنية ومريحة.' : 'Deep, reflective & measured voice with patient pauses.'}
            </p>
          </button>
        </div>
      </div>

      {/* Instruction Language Preference */}
      <div className="mt-4 pt-4 border-t border-[#C9A063]/15">
        <label className="block text-xs font-semibold text-[#DFBA7F] uppercase tracking-wider mb-2">
          {isArabic ? 'لغة التوجيه والتعليم' : 'Instruction Language'}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedLanguage('ar')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedLanguage === 'ar'
                ? isDark
                  ? 'bg-[#C9A063]/20 border-[#DFBA7F] text-[#DFBA7F] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] text-[#8E6527] ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 text-stone-400'
                : 'bg-stone-50 border-stone-200 text-stone-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-arabic text-base">العربية الفصحى</span>
              {selectedLanguage === 'ar' && <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />}
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">{isArabic ? 'توجيهات وإرشادات باللغة العربية' : 'Classical Arabic teacher guidance'}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLanguage('en')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedLanguage === 'en'
                ? isDark
                  ? 'bg-[#C9A063]/20 border-[#DFBA7F] text-[#DFBA7F] ring-1 ring-[#DFBA7F]'
                  : 'bg-amber-50 border-[#A67C38] text-[#8E6527] ring-1 ring-[#A67C38]'
                : isDark
                ? 'bg-[#0E1218] border-stone-800 text-stone-400'
                : 'bg-stone-50 border-stone-200 text-stone-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isArabic ? 'الإنجليزية مع المصطلحات' : 'English Bilingual'}</span>
              {selectedLanguage === 'en' && <CheckCircle2 className="w-3.5 h-3.5 text-[#DFBA7F]" />}
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">{isArabic ? 'شرح بالإنجليزية مع مصطلحات القرآن' : 'English with proper Arabic terms'}</p>
          </button>
        </div>
      </div>

      {/* Start Lesson Button */}
      <div className="mt-8 pt-4 border-t border-[#C9A063]/20">
        <button
          type="button"
          onClick={() =>
            onStartLesson(selectedSurah, startAyah, endAyah, selectedMode, selectedVoice, selectedLanguage)
          }
          className="w-full py-4 px-6 rounded-2xl font-serif-heading font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#8E6527] text-[#080A0E] shadow-[0_6px_24px_rgba(201,160,99,0.4)] hover:shadow-[0_8px_32px_rgba(201,160,99,0.5)] transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isArabic ? `بدء جلسة التسميع (${totalAyahsSelected} آيات)` : `START LESSON (${totalAyahsSelected} AYAHS)`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className={`text-center text-[11px] mt-2.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {isArabic
            ? 'صوت تعليمي طبيعي ومريح · استماع تفاعلي مستمر'
            : 'Natural, gentle teacher recitation · Continuous listening session'}
        </p>
      </div>
    </div>
  );
};
