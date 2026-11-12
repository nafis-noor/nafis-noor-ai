import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  FileText,
  Volume2,
  Mic,
  ArrowRight,
  GraduationCap,
  Info,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudyLanguage, getStudyTranslations } from '../../utils/studyTranslations';

interface ArabicLearningOnboardingProps {
  isDark: boolean;
  language?: string;
  onComplete: () => void;
  initialStage?: 'intro' | 'reveal' | 'terms' | 'notice';
}

type OnboardingStage = 'intro' | 'reveal' | 'terms' | 'notice';

export const ArabicLearningOnboarding: React.FC<ArabicLearningOnboardingProps> = ({
  isDark,
  language,
  onComplete,
  initialStage = 'intro',
}) => {
  const activeLang = useStudyLanguage(language);
  const st = getStudyTranslations(activeLang);

  const [stage, setStage] = useState<OnboardingStage>(initialStage);
  const [introProgress, setIntroProgress] = useState(0);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // 10-second introductory visual transition (No fake countdown numbers)
  useEffect(() => {
    if (stage !== 'intro') return;

    const durationMs = 10000;
    const intervalMs = 100;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setIntroProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setStage('reveal');
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [stage]);

  // Elegant celebratory effect upon entering the Lifetime Free Reveal
  useEffect(() => {
    if (stage === 'reveal') {
      try {
        // Serene gold and emerald celebration capped to 24 particles for iOS Safari
        confetti({
          particleCount: 24,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#DFBA7F', '#C9A063', '#10B981', '#F59E0B', '#E5E7EB'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if canvas is restricted
      }
    }
  }, [stage]);

  const handleFinishOnboarding = () => {
    try {
      localStorage.setItem('nafis_noor_learning_onboarded', 'true');
      localStorage.setItem('nafis_noor_learning_onboarded_at', new Date().toISOString());
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
    onComplete();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. INTRODUCTORY SCREEN (10s Visual Transition, NO fake countdown)         */}
      {/* ========================================================================= */}
      {stage === 'intro' && (
        <div
          id="learning-intro-screen"
          className={`p-8 sm:p-14 rounded-3xl border text-center relative overflow-hidden transition-all duration-500 shadow-2xl ${
            isDark
              ? 'bg-gradient-to-b from-[#101318] via-[#141821] to-[#0D1016] border-[#DFBA7F]/20 text-stone-100'
              : 'bg-gradient-to-b from-white via-stone-50 to-stone-100 border-[#C9A063]/30 text-stone-900 shadow-xl'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#DFBA7F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-8">
            {/* Islamic geometric badge emblem */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#DFBA7F]/20 to-[#C9A063]/10 border border-[#DFBA7F]/40 shadow-inner">
              <span className="text-3xl font-serif text-[#DFBA7F] select-none">ن</span>
            </div>

            <div className="space-y-3">
              <div className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#C9A063]/15 text-[#DFBA7F] border border-[#C9A063]/30">
                {activeLang === 'ar' ? 'أكاديمية نور' : 'NOOR AI'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100">
                {st.onboardingIntroTitle}
              </h1>
              <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium">
                {st.onboardingPreparing}
              </p>
            </div>

            {/* Smooth 10s progress bar animation without fake numerical countdown */}
            <div className="space-y-3 pt-4">
              <div className="w-full h-2 rounded-full bg-stone-200/60 dark:bg-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[#DFBA7F] via-[#F3DEB8] to-[#C9A063] rounded-full transition-all duration-100 ease-linear shadow-sm"
                  style={{ width: `${introProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 pt-1">
                <span>
                  {activeLang === 'ar'
                    ? 'تهيئة محرك الصوتيات الفصحى واللغة العربية'
                    : 'Initializing classical phonetics & language engine'}
                </span>
                <button
                  type="button"
                  id="skip-intro-btn"
                  onClick={() => setStage('reveal')}
                  className="hover:text-[#DFBA7F] transition-colors underline cursor-pointer text-xs"
                >
                  {activeLang === 'ar' ? 'تخطي المقدمة' : 'Skip intro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THE BIG REVEAL (Lifetime Free Announcement)                            */}
      {/* ========================================================================= */}
      {stage === 'reveal' && (
        <div
          id="learning-reveal-screen"
          className={`p-8 sm:p-14 rounded-3xl border text-center relative overflow-hidden transition-all duration-500 shadow-2xl ${
            isDark
              ? 'bg-gradient-to-b from-[#101318] via-[#151A24] to-[#0D1016] border-[#DFBA7F]/30 text-stone-100'
              : 'bg-gradient-to-b from-white via-amber-50/30 to-stone-50 border-[#C9A063]/40 text-stone-900 shadow-xl'
          }`}
        >
          {/* Subtle Ambient Radiance */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-[#DFBA7F]/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeLang === 'ar' ? 'بشرى سارة' : 'GOOD NEWS'}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                {st.academyTitle} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA7F] via-[#F0D5A3] to-[#C9A063]">
                  {st.onboardingFreeRevealTitle}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
                {st.onboardingFreeRevealDesc}
              </p>
            </div>

            {/* Reassurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-left" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'بدون اشتراكات' : 'No Subscriptions'}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'وصول كامل ومفتوح لكافة المسارات التعليمية العشرة دون أي رسوم متكررة.'
                    : 'Full access to all 10 Arabic learning modules with no recurring billing.'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'بدون رسوم خفية' : 'No Hidden Fees'}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'لا بطاقات دفع، لا بوابات مشتريات، ولا حجب لأي محتوى علمي.'
                    : 'Zero payment processing, zero credit card prompts, zero paywalls.'}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-xs font-semibold mb-1">
                  <Check className="w-4 h-4" />
                  <span>{activeLang === 'ar' ? 'تعليم إسلامي رصين' : 'Dignified Learning'}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'صوتيات فصحى وقراءة وقواعد نحوية وتدبر في بيئة نقية خالية من الإعلانات.'
                    : 'Classical phonetics, reading, and grammar without commercial distraction.'}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                id="reveal-continue-btn"
                onClick={() => setStage('terms')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <span>{st.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TERMS & IMPORTANT INFORMATION                                         */}
      {/* ========================================================================= */}
      {stage === 'terms' && (
        <div
          id="learning-terms-screen"
          className={`p-6 sm:p-10 rounded-3xl border relative transition-all duration-300 shadow-xl ${
            isDark
              ? 'bg-[#101318] border-white/10 text-stone-100'
              : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b pb-5 border-stone-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#DFBA7F]/15 text-[#DFBA7F] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{activeLang === 'ar' ? 'السياسة التعليمية' : 'Educational Policy'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100">
                  {st.onboardingTermsTitle}
                </h2>
              </div>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {st.termsAndNotice}
              </span>
            </div>

            {/* Sections */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              {/* 1. Terms of Use */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm mb-2">
                  <FileText className="w-4 h-4 text-[#DFBA7F]" />
                  <h3>{activeLang === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'منهاج نور التعليمي أداة تعليمية تهدف إلى مساعدة الراغبين في إتقان لغة القرآن الكريم، مع التركيز على مخارج الحروف الـ٢٨، وضبط أشكالها، والجذور اللغوية، والقراءة المتدرجة، والحوارات الفصيحة، وقواعد النحو الأساسية.'
                    : 'Noor AI Learning is an educational tool designed to help users learn the Arabic language. It provides focused practice across the 28 Arabic letters, pronunciation articulation points (Makhārij), positional forms, vocabulary root structures, graded reading passages, conversational dialogues, and grammar fundamentals.'}
                </p>
              </div>

              {/* 2. Privacy */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm mb-2">
                  <Lock className="w-4 h-4 text-[#DFBA7F]" />
                  <h3>{activeLang === 'ar' ? 'الخصوصية وأمان البيانات' : 'Privacy'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'تُعامل جميع البيانات وأذونات الاستخدام كالإدخال الصوتي وفق سياسة الخصوصية الصارمة للتطبيق. يتم حفظ تقدمك الدراسي محلياً على جهازك لضمان استمرارية تعلمك وحفظ سجلك.'
                    : "Any information or permissions used by the learning feature—such as speech input or study progress—are handled strictly in accordance with the application's privacy policy. Your learning activity and progress state are stored locally on your device to maintain your practice history."}
                </p>
              </div>

              {/* 3. AI Information */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3>{activeLang === 'ar' ? 'معلومات الذكاء الاصطناعي' : 'AI Information'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'نور رفيق تعليمي مدعوم بالذكاء الاصطناعي مصمم وفق أصول العربية الفصحى. الشروحات والتحليلات الصرفية واللغوية موجهة للتعلم والمدارسة مع أهمية الاستئناس بالمصادر المعتمدة.'
                    : 'Noor AI is an AI-based educational assistant. While designed with rigorous academic guidelines for Classical and Modern Standard Arabic, AI-generated explanations, morphological analyses, and translations can occasionally contain mistakes. We encourage critical review alongside standard educational resources.'}
                </p>
              </div>

              {/* 4. Educational Notice */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm mb-2">
                  <GraduationCap className="w-4 h-4 text-[#DFBA7F]" />
                  <h3>{activeLang === 'ar' ? 'إشعار تعليمي وتنبيه' : 'Educational Notice'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'تطبيق نور مخصص للتعلم وتدارس علوم اللغة والقرآن الكريم، ولا يُعتبر مرجعاً بديلاً للإفتاء الشرعي أو الأحكام الفقهية المعتمدة.'
                    : 'Noor AI is intended strictly for learning, language practice, and study support. It should not be treated as an unquestionable authority on theological, jurisprudential, or definitive linguistic matters.'}
                </p>
              </div>

              {/* 5. Voice & Learning Features */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm mb-2">
                  <Mic className="w-4 h-4 text-[#34D399]" />
                  <h3>{activeLang === 'ar' ? 'الميزات الصوتية والنطق' : 'Voice & Learning Features'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeLang === 'ar'
                    ? 'تعتمد الميزات الصوتية على التعرف على الكلام عبر المتصفح والنطق الصوتي لضبط مخارج الحروف دون ادعاء تقييمات آلية مصطنعة.'
                    : 'Voice features utilize standard web microphone input for speech-to-text practice and client-side speech synthesis for Arabic pronunciation. Noor AI only provides capabilities supported by the technical platform and does not fabricate pronunciation scoring or speech metrics that do not exist.'}
                </p>
              </div>
            </div>

            {/* Mandatory Checkbox Agreement */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                hasAgreedToTerms
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-emerald-50/60 border-emerald-300'
                  : isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-stone-100/70 border-stone-200'
              }`}
            >
              <input
                type="checkbox"
                id="agree-terms-checkbox"
                checked={hasAgreedToTerms}
                onChange={e => setHasAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#DFBA7F] focus:ring-[#DFBA7F] border-stone-400 cursor-pointer accent-[#C9A063]"
              />
              <label
                htmlFor="agree-terms-checkbox"
                className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 cursor-pointer select-none leading-relaxed"
              >
                {activeLang === 'ar'
                  ? 'قرأت وفهمت الشروط والسياسة التعليمية الهامة وأوافق عليها.'
                  : 'I have read and understood the Terms & Important Information.'}
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-400 dark:text-stone-500 order-2 sm:order-1">
                {activeLang === 'ar'
                  ? 'الموافقة مطلوبة للمتابعة إلى المسارات التعليمية.'
                  : 'Acknowledgment is required to proceed.'}
              </span>
              <button
                type="button"
                id="terms-agree-btn"
                disabled={!hasAgreedToTerms}
                onClick={() => setStage('notice')}
                className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                  hasAgreedToTerms
                    ? 'bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95 shadow-md cursor-pointer'
                    : 'bg-stone-300 dark:bg-white/10 text-stone-500 dark:text-stone-400 cursor-not-allowed opacity-60'
                }`}
              >
                <span>{st.onboardingAgreeButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FINAL PRE-RELEASE NOTICE                                               */}
      {/* ========================================================================= */}
      {stage === 'notice' && (
        <div
          id="learning-prerelease-screen"
          className={`p-6 sm:p-12 rounded-3xl border relative transition-all duration-300 shadow-2xl ${
            isDark
              ? 'bg-[#101318] border-white/10 text-stone-100'
              : 'bg-white border-stone-200 text-stone-900 shadow-xl'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Info className="w-3.5 h-3.5" />
              <span>{activeLang === 'ar' ? 'إشعار التطوير المستمر' : 'Pre-Release Notice'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100">
              {activeLang === 'ar'
                ? 'تطبيق نفيس نور قيد التطوير والتحسين المستمر'
                : 'Nafis Noor is still in development'}
            </h1>

            {/* Exact Specified Professional Notice */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border text-left text-xs sm:text-sm leading-relaxed space-y-3.5 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-stone-300'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {activeLang === 'ar'
                  ? 'نشكركم على انضمامكم إلى رحاب تطبيق نفيس نور.'
                  : 'Thank you for being part of Nafis Noor.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'تطبيق نفيس نور يمر حالياً بمرحلة تطوير وتحسين مبكرة، ونعمل جاهدين على اختبار ميزاته وتحديثها باستمرار لتقديم أقصى درجات الإتقان والرصانة.'
                  : 'Nafis Noor is currently in an early development and pre-release stage. The application is not yet fully published, and several parts of the experience are still being developed, tested, refined, and improved.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'قد تتطور بعض الميزات والخدمات تباعاً مع التحديثات القادمة بهدف الارتقاء بالتجربة التعليمية والقرآنية.'
                  : 'Some features may change before the official release, and certain functionality may not yet be available or may behave differently during development.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'هدفنا بناء تجربة موثوقة ومتقنة ونافعة تثري أوقاتكم بكل ما يقربكم لكتاب الله تعالى ولغته الخالدة.'
                  : 'Our goal is to build a reliable, useful, and high-quality experience, so we are continuing to work on the application before its full public release.'}
              </p>

              <p>
                {activeLang === 'ar'
                  ? 'لذا فإن استخدامكم الحالي يمثل معاينة مباركة لتطبيق ينمو باستمرار بتوفيق الله ثم ملاحظاتكم الكريمة.'
                  : 'Your current experience should therefore be considered a preview of an application that is still being actively developed.'}
              </p>

              <p className="pt-1 text-stone-600 dark:text-stone-400 font-medium">
                {activeLang === 'ar'
                  ? 'جزاكم الله خيراً وبارك في مسعاكم وتفهمكم في هذه الرحلة المباركة.'
                  : 'Thank you for your patience and understanding while Nafis Noor continues to grow.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="enter-learning-btn"
                onClick={handleFinishOnboarding}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#DFBA7F] to-[#C9A063] text-[#080A0E] hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <span>{st.onboardingStartButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
