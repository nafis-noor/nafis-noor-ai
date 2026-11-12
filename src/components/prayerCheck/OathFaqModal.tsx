import React from 'react';
import { X, ShieldAlert, BookOpen, AlertOctagon, HeartHandshake, CheckCircle } from 'lucide-react';
import { useModalScrollLock } from '../../utils/useModalScrollLock';
import { getLanguageCode, isRTLLanguage } from '../../utils/i18n';

interface OathFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  language?: string;
}

export const OathFaqModal: React.FC<OathFaqModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  language = 'en',
}) => {
  useModalScrollLock(isOpen, 'oath-faq-modal');

  if (!isOpen) return null;

  const langCode = getLanguageCode(language);
  const isArabic = langCode === 'ar';
  const isRTL = isRTLLanguage(langCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'الأسئلة الشائعة حول عِظَم اليمين في الإسلام' : 'The Gravity of Swearing Falsely in Islam FAQ'}
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-xl max-h-[88vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isDark
            ? 'bg-[#0A101D] border-[#C9A063]/30 text-stone-100'
            : 'bg-[#F9F7F2] border-[#C9A063]/40 text-stone-900'
        }`}
      >
        {/* Luminous Top Gold Trim */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#DFBA7F] to-transparent opacity-90" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A063]/20 bg-[#060B14]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif-heading font-bold text-[#DFBA7F]">
                {isArabic ? 'عِظَمُ اليمين في الإسلام' : 'The Weight of an Oath in Islam'}
              </h3>
              <p className="text-xs text-stone-400 font-arabic">
                {isArabic ? 'حكم اليمين الغموس وحقيقة محاسبة النفس' : 'عِظَمُ اليمين في الإسلام وخطر اليمين الغموس'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isArabic ? 'إغلاق' : 'Close FAQ'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FAQ Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed">
          {isArabic ? (
            <>
              {/* Question 1 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2 text-right">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ما هي اليمين الغموس؟</span>
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  في الفقه الإسلامي، <strong className="text-amber-300">اليمين الغموس</strong> هي الحلف بالله تعالى كذباً مع العلم والتعمد. وسُمّيت غموساً لأنها تغمس صاحبها في الإثم ثم تغمسه في نار جهنم والعياذ بالله.
                </p>
                <blockquote className="border-r-2 border-[#C9A063] pr-3 py-1 my-2 text-xs italic text-stone-400 font-serif">
                  «الكبائر: الإشراك بالله، وعقوق الوالدين، وقتل النفس، واليمين الغموس»
                  <span className="block text-[11px] text-amber-400/80 not-italic mt-0.5">— صحيح البخاري (6675)</span>
                </blockquote>
              </div>

              {/* Question 2 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2 text-right">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C9A063] shrink-0" />
                  <span>لماذا يعتمد تطبيق «نور» على نظام الإقرار الشرعي؟</span>
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  الصلاة هي عماد الدين ورابطتنا الوثيقة برب العالمين. في تطبيقات المتابعة الرقمية، قد يقع المرء في فخ الضغط على "تم" فقط للحفاظ على السلسلة دون صدق حقيقي.
                </p>
                <p className="text-stone-300 text-xs sm:text-sm">
                  وضعنا هذا الإقرار الواعي لنزع الغفلة واستشعار الوقوف بين يدي الله بصدق وإخلاص لا تشوبه شائبة.
                </p>
              </div>

              {/* Question 3 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2 text-right">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>ماذا أفعل إن لم أكن قد صليت بعد؟</span>
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  لا تُحرج أبداً ولا تحلف كذباً؛ اختر ببساطة <strong className="text-purple-300">«لم أصلِّ»</strong>. فالصدق والاعتراف أحب إلى الله تعالى من أي ادعاء باطل.
                </p>
                <p className="text-stone-300 text-xs sm:text-sm">
                  وإن فاتتك الصلاة لنوم أو نسيان، قال النبي ﷺ: «من نسي صلاة أو نام عنها فكفارتها أن يصليها إذا ذكرها» (صحيح مسلم 684). بادر وتوضأ وصلّها قضاءً الآن.
                </p>
              </div>

              {/* Question 4 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2 text-right">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ما هو الفرق بين الصلاة «في وقتها» و«قضاءً»؟</span>
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  إذا أديت الصلاة مع الأذان وفي أول وقتها مع مهلة <strong className="text-emerald-400">10 دقائق</strong> فتُسجل في وقتها. وإن صليتها بعد ذلك ضمن وقت الفريضة فتُسجل قضاءً أو متأخرة. وإن مضت المدة دون تسجيل فتُحفظ أمانةً بأنها فاتت لتحافظ على مصداقية سجلك.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Question 1 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                  What is Al-Yameen Al-Ghamoos (اليمين الغموس)?
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  In Islamic jurisprudence, <strong className="text-amber-300">Al-Yameen Al-Ghamoos</strong> (the plunging oath) is swearing falsely by Allah deliberately knowing that one is lying. It is called <em>ghamoos</em> because it plunges the person into sin and into the Fire.
                </p>
                <blockquote className="border-l-2 border-[#C9A063] pl-3 py-1 my-2 text-xs italic text-stone-400 font-serif">
                  "The major sins are: Associating partners with Allah, disobeying parents, taking an innocent life, and false oath (al-yameen al-ghamoos)."
                  <span className="block text-[11px] text-amber-400/80 not-italic mt-0.5">— Sahih al-Bukhari 6675</span>
                </blockquote>
              </div>

              {/* Question 2 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C9A063] shrink-0" />
                  Why does Noor use an Oath Confirmation system?
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  Salah (prayer) is the cornerstone of Islam and our covenant with our Creator. Gamified trackers often tempt users into blindly clicking "Done" just to maintain a streak.
                </p>
                <p className="text-stone-300 text-xs sm:text-sm">
                  The oath system removes false complacency. It restores absolute mindfulness, ensuring every recorded prayer reflects genuine standing before Allah.
                </p>
              </div>

              {/* Question 3 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-purple-400 shrink-0" />
                  What if I did not pray yet?
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  Never feel pressured to swear. Simply select <strong className="text-purple-300">"I Did Not Pray"</strong>. Honesty is infinitely more beloved to Allah than a false assertion.
                </p>
                <p className="text-stone-300 text-xs sm:text-sm">
                  If a prayer was missed due to sleep or forgetfulness, the Prophet ﷺ taught us: <em>"Whoever forgets a prayer or sleeps through it, its expiation is to pray it when he remembers it."</em> (Sahih Muslim 684). Perform wudu now and make up the prayer (Qada).
                </p>
              </div>

              {/* Question 4 */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C9A063]/15 space-y-2">
                <h4 className="font-semibold text-[#DFBA7F] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  What counts as "On Time" vs "Late"?
                </h4>
                <p className="text-stone-300 text-xs sm:text-sm">
                  Our system honors a <strong className="text-emerald-400">10-minute grace period</strong> after the adhan/scheduled time as "On time". If you performed the prayer later within its valid prayer window, select "Late". If 30 minutes pass without response, it is respectfully archived as missed so your records remain authentic.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#C9A063]/20 bg-[#060B14]/80 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-[#C9A063] via-[#DFBA7F] to-[#C9A063] text-[#050811] text-xs font-bold font-cinzel tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            {isArabic ? 'فهمت وأقر — العودة إلى التحقق' : 'I Understand — Return to Check'}
          </button>
        </div>
      </div>
    </div>
  );
};
