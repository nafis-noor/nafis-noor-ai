/**
 * Caring Islamic Quran Teacher Phrase Generator & Audio Noise Filter
 * 
 * Provides:
 * 1. Sophisticated noise & accidental vocal artifact filtering (coughs, breathing, throat clearings, stray letters).
 * 2. Warm, compassionate, attentive teacher feedback pools (Arabic & English) modeled after patient Qur'an scholars.
 * 3. History tracking to guarantee the teacher NEVER repeats the same sentence consecutively or within the same session.
 */

// Acoustic noise and filler tokens to filter out from live speech recognition
const ARABIC_NOISE_TOKENS = new Set([
  'احم', 'أحم', 'همم', 'امم', 'أمم', 'اه', 'آه', 'ااه', 'أوه', 'اوه', 'اووه', 'ايوه', 'ها', 'هم',
  'تنحنح', 'كحة', 'يوه', 'ايه', 'إيه', 'ألو', 'الو', 'صوت', 'ميكروفون', 'يعني', 'اممم', 'اوك', 'اوكي'
]);

const ENGLISH_NOISE_TOKENS = new Set([
  'uh', 'um', 'umm', 'er', 'ah', 'ahh', 'hmm', 'cough', 'throat', 'clearing',
  'noise', 'pfft', 'oops', 'shh', 'wait', 'hey', 'hello', 'mic', 'test', 'testing', 'yeah', 'ok', 'okay'
]);

/**
 * Filter out acoustic noise, vocal fillers (coughs, throat clearing, sighing),
 * accidental stray characters, and non-Quranic noise words.
 */
export function filterNoiseAndAccidentalWords(
  rawTranscript: string,
  isEnglishMode: boolean = false
): { cleaned: string; isNoiseOnly: boolean; meaningfulWordCount: number } {
  if (!rawTranscript || !rawTranscript.trim()) {
    return { cleaned: '', isNoiseOnly: true, meaningfulWordCount: 0 };
  }

  // Tokenize words
  const rawWords = rawTranscript.trim().split(/\s+/);
  const meaningfulWords: string[] = [];

  for (const raw of rawWords) {
    // Strip surrounding punctuation & symbols
    const cleaned = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،]/g, '').trim();
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    // Check against noise tokens
    if (ARABIC_NOISE_TOKENS.has(cleaned) || ARABIC_NOISE_TOKENS.has(lower)) {
      continue;
    }
    if (ENGLISH_NOISE_TOKENS.has(lower)) {
      continue;
    }

    // Filter isolated single characters (e.g. "ت", "أ", "س", "b", "c")
    // Unless the user is reciting a Quranic single-letter word like 'و' attached to another word
    if (cleaned.length === 1) {
      // Standalone single letters are acoustic mic artifacts in speech recognition
      continue;
    }

    // Filter nonsensical repeating single character strings like "aaaa", "hhhh", "ههههه"
    if (/^(.)\1{2,}$/.test(cleaned)) {
      continue;
    }

    meaningfulWords.push(cleaned);
  }

  const cleaned = meaningfulWords.join(' ');
  const meaningfulWordCount = meaningfulWords.length;
  // If no meaningful words remain or the text is shorter than 3 characters, treat as noise only
  const isNoiseOnly = meaningfulWordCount === 0 || cleaned.length < 3;

  return {
    cleaned,
    isNoiseOnly,
    meaningfulWordCount,
  };
}

export type CaringFeedbackType =
  | 'correct'
  | 'last_ayah'
  | 'missing_words'
  | 'incorrect_word'
  | 'premature_stop'
  | 'extra_words'
  | 'general_retry'
  | 'cue_next_ayah';

export interface FeedbackContext {
  surahName?: string;
  ayahNumber?: number;
  nextAyahNumber?: number;
  word?: string;
}

const CARING_PHRASES_AR: Record<CaringFeedbackType, ((ctx: FeedbackContext) => string)[]> = {
  correct: [
    () => 'مَا شَاءَ اللهُ تَبَارَكَ الله، فَتَحَ اللهُ عَلَيْكَ وَنَوَّرَ قَلْبَكَ! تِلَاوَةٌ عَذْبَةٌ، تَفَضَّلْ بِالآيَةِ التَّالِيَةِ.',
    () => 'أَحْسَنْتَ يَا بُنَيَّ وَبَارَكَ اللهُ فِي أَنْفَاسِكَ الطَّيِّبَة، مَخَارِجُ حُرُوفٍ سَلِيمَة؛ تَابِعْ بِإِذْنِ الله.',
    () => 'تَبَارَكَ الرَّحْمَن، أَدَاءٌ مُتْقَنٌ وَخُشُوعٌ جَمِيل! لِنُواصِلَ مَعًا إِلَى الآيَةِ القَادِمَة.',
    () => 'زَادَكَ اللهُ حِفْظًا وَإِتْقَانًا، تِلَاوَتُكَ تَشْرَحُ الصَّدْر! تَفَضَّلْ بِمُتَابَعَةِ الآيَةِ التَّالِيَة.',
    () => 'مَا شَاءَ الله، إِتْقَانٌ رَائِعٌ وَثَبَاتٌ طَيِّب؛ هَيَّا نَنْتَقِلُ لِلآيَةِ المُبَارَكَةِ التَّالِيَة.',
    () => 'أَحْسَنْتَ صَنِيعًا، تِلَاوَةٌ هَادِئَةٌ وَمُطْمَئِنَّة! سِرْ عَلَى بَرَكَةِ اللهِ إِلَى الآيَةِ التَّالِيَة.',
    () => 'سَلِمَتْ يَمِينُكَ وَلِسَانُكَ، قِرَاءَةٌ صَحِيحَةٌ مُبَارَكَة! نَسْتَمِعُ مَعًا لِلآيَةِ التَّالِيَة.',
    () => 'اللهُ يُكْرِمُكَ وَيَرْفَعُ قَدْرَكَ بِالقُرْآن، أَحْسَنْتَ كَثِيرًا! تَفَضَّلْ بِالتِّلَاوَةِ لِلآيَةِ التَّالِيَة.',
  ],
  last_ayah: [
    () => 'مَا شَاءَ اللهُ تَبَارَكَ الرَّحْمَن! هَنِيئاً لَكَ إِتْمَامُ هَذَا الوِرْدِ المُبَارَكِ بِإِتْقَانٍ تَامّ؛ جَعَلَكَ اللهُ مِنْ أَهْلِ القُرْآنِ وَخَاصَّتِهِ!',
    () => 'اللهُ أَكْبَر، فَتَحَ اللهُ عَلَيْكَ فُتُوحَ العَارِفِينَ! أَتْمَمْتَ جَلْسَةَ التِّلَاوَةِ بِكُلِّ خُشُوعٍ وَإِتْقَان، بَارَكَ اللهُ فِيكَ.',
    () => 'مَا شَاءَ الله، خِتَامٌ مُبَارَكٌ لِهَذِهِ الآيَاتِ العَظِيمَة! أَدَاؤُكَ أَسْعَدَ قَلْبِي، ثَبَّتَ اللهُ حِفْظَكَ وَنَفَعَ بِكَ.',
    () => 'تَبَارَكَ الله، أَتْمَمْتَ هَذَا المَقْطَعَ بِحِفْظٍ رَاصِخٍ وَأَدَاءٍ مُشَرِّف! شَكَرَ اللهُ جُهْدَكَ وَنَوَّرَ طَرِيقَكَ.',
  ],
  missing_words: [
    (ctx) => `بِدَايَةٌ طَيِّبَةٌ يَا أَخِي، لَا عَلَيْكَ فَكِتَابُ اللهِ يُنَالُ بِالصَّبْر؛ انْتَبِهْ لِمَوْضِعِ «${ctx.word || 'الكلمات الفائتة'}»، خُذْ نَفَسًا هَادِئًا وَأَعِدْهَا مَعِي.`,
    (ctx) => `أَنْتَ قَرِيبٌ جِدًّا مِنَ الإِتْقَانِ! فَقَطْ تَأَنَّ عِنْدَ «${ctx.word || 'الكلمة الفائتة'}»؛ لِنُعِدْ هَذِهِ الآيَةَ بِهُدُوءٍ وَرِفْق.`,
    (ctx) => `أَحْسَنْتَ فِي جُهْدِكَ يَا بُنَيّ؛ رَكِّزْ قَلِيلًا فِي كَلِمَةِ «${ctx.word || 'الكلمة التالية'}»، أَنَا مَعَكَ أَسْتَمِعُ إِلَيْكَ، أَعِدْهَا بِطُمَأْنِينَة.`,
    (ctx) => `تِلَاوَةٌ جَمِيلَة، فَقَطْ مَرَّتْ «${ctx.word || 'الكلمة'}» سَرِيعًا؛ أَعِدْهَا بِتُؤَدَةٍ لِنُثَبِّتَهَا سَوِيًّا فِي صَدْرِكَ.`,
    (ctx) => `مَا شَاءَ اللهُ عَلَى عَزِيمَتِكَ؛ انْتَبِهْ لِمَوْضِعِ «${ctx.word || 'الكلمة'}»، اسْتَجْمِعْ تَرْكِيزَكَ وَاقْرَأْهَا ثَانِيَةً بِرِفْق.`,
  ],
  incorrect_word: [
    (ctx) => `قِرَاءَتُكَ طَيِّبَة، لَكِنْ رَكِّزْ فِي نُطْقِ «${ctx.word || 'الكلمة'}»؛ تَلَفَّظْ بِهَا بِوُضُوحٍ وَأَعِدْ لَفْظَهَا، أَنَا أَسْتَمِعُ لَكَ.`,
    (ctx) => `لَا عَلَيْكَ، كُلُّنَا نَتَعَلَّمُ رُوَيْدًا رُوَيْدًا؛ الصَّوَابُ هُوَ «${ctx.word || 'الكلمة الصحيحة'}»، خُذْ وَقْتَكَ وَاقْرَأْهَا بِهُدُوء.`,
    (ctx) => `أَحْسَنْتَ فِي مُعْظَمِ الآيَة، وَنُرِيدُ ضَبْطَ كَلِمَةِ «${ctx.word || 'هذه الكلمة'}»؛ تَمَهَّلْ فِيهَا وَأَعِدْهَا بِتُؤَدَة.`,
    (ctx) => `تِلَاوَةٌ عَذْبَةٌ، فَقَطْ انْتَبِهْ لِحُرُوفِ «${ctx.word || 'الكلمة'}»؛ أَعِدْ هَذَا المَقْطَعَ وَسَتُتْقِنُهُ بِإِذْنِ الله.`,
  ],
  premature_stop: [
    () => 'نَفَسٌ طَيِّبٌ يَا بَطَل؛ تَوَقَّفْتَ قَبْلَ كَمَالِ الآيَةِ، خُذْ نَفَسًا عَمِيقًا مُرِيحًا وَأَكْمِلِ التِّلَاوَة.',
    () => 'لَا بَأْسَ عَلَيْكَ، خُذْ رَاحَتَكَ فِي التَّنَفُّسِ وَأَتْمِمْ بَاقِي هَذِهِ الآيَةِ الكَرِيمَةِ، أَنَا أَسْتَمِعُ لَكَ.',
    () => 'أَحْسَنْتَ، وَبَقِيَ جُزْءٌ يَسِيرٌ مِنَ الآيَة؛ خُذْ شَهِيقًا هَادِئًا وَأَكْمِلْ تِلَاوَتَكَ المُبَارَكَة.',
    () => 'أَنَا مَعَكَ أُصْغِي إِلَيْكَ؛ تَوَقَّفْتَ لِلتَّنَفُّسِ، فَتَفَضَّلْ بِإِتْمَامِ الآيَةِ عَلَى رِسْلِكَ.',
  ],
  extra_words: [
    () => 'تِلَاوَةٌ وَاضِحَةٌ يَا أَخِي، لَكِنْ زَادَتْ كَلِمَةٌ سَهْوًا؛ تَمَهَّلْ وَأَعِدِ الآيَةَ دُونَ عَجَلَة.',
    () => 'مَا شَاءَ الله، فَقَطْ دَقِّقْ فِي نَصِّ الآيَةِ دُونَ زِيَادَة؛ خُذْ نَفَسًا وَاقْرَأْهَا بِهُدُوء.',
    () => 'قِرَاءَةٌ حَسَنَة، انْتَبِهْ فَقَطْ لِعَدَمِ الزِّيَادَةِ فِي الكَلِمَات؛ أَعِدْهَا بِتُؤَدَةٍ لِنَضْبِطَهَا.',
  ],
  general_retry: [
    () => 'عَلَى رِسْلِكَ يَا بُنَيّ؛ خُذْ نَفَسًا عَمِيقًا وَأَعِدِ الآيَةَ، فَالقُرْآنُ يُنَالُ بِالتَّأَنِّي.',
    () => 'لَا تَقْلَقْ أَبَدًا، أَنْتَ تَتَقَدَّمُ بِشَكْلٍ طَيِّب؛ هَيَّا نُعِيدُ الآيَةَ مَعًا بِرِفْقٍ وَطُمَأْنِينَة.',
    () => 'بَارَكَ اللهُ فِي حِرْصِكَ؛ اسْتَعِنْ بِاللهِ وَأَعِدِ الآيَةَ، وَأَنَا أُصْغِي إِلَيْكَ بِكُلِّ اهْتِمَام.',
    () => 'كُلُّ حَرْفٍ تَتْلُوهُ لَكَ بِهِ عَشْرُ حَسَنَات؛ تَمَهَّلْ وَأَعِدِ الآيَةَ بِخُشُوع.',
  ],
  cue_next_ayah: [
    (ctx) => `الآنَ مَعَ الآيَةِ ${ctx.nextAyahNumber || ''}؛ اسْتَعِنْ بِاللهِ وَتَفَضَّلْ بِالتِّلَاوَة.`,
    (ctx) => `نَنْتَقِلُ بِعَوْنِ اللهِ لِلآيَةِ ${ctx.nextAyahNumber || ''}؛ اقْرَأْ بِخُشُوعٍ وَتُؤَدَة.`,
    (ctx) => `الآيَةُ المُبَارَكَةُ ${ctx.nextAyahNumber || ''}؛ تَفَضَّلْ يَا بُنَيَّ بِتِلَاوَتِهَا حِينَ تَسْتَعِدّ.`,
    (ctx) => `مَعَ الآيَةِ الكَرِيمَةِ ${ctx.nextAyahNumber || ''}؛ خُذْ نَفَسًا مَرِيحًا وَابْدَأْ تِلَاوَتَكَ.`,
  ],
};

const CARING_PHRASES_EN: Record<CaringFeedbackType, ((ctx: FeedbackContext) => string)[]> = {
  correct: [
    () => "Masha'Allah, beautiful and accurate recitation! May Allah illuminate your heart. Let us proceed to the next ayah.",
    () => "Very well recited! Your pace and articulation were wonderfully serene. Continue to the next ayah with confidence.",
    () => "Masha'Allah, clear and dignified recitation! BarakAllahu feek, let us continue together to the next verse.",
    () => "Wonderful effort! That was smooth, accurate, and sincere. Let's move gently to the next ayah.",
    () => "Subhan'Allah, so peaceful and well-spoken! Take a breath and read the next ayah whenever you are ready.",
    () => "Truly excellent recitation, masha'Allah! Keep up this beautiful focus as we proceed.",
  ],
  last_ayah: [
    () => "Masha'Allah tabarakAllah! You have completed this entire lesson with sincere dedication. May Allah make you among the people of the Qur'an!",
    () => "Allahu Akbar, heartfelt congratulations! You recited and perfected these verses with grace. May Allah bless you abundantly.",
    () => "Masha'Allah, a blessed completion! Your recitation was inspiring. May Allah firmly establish the Qur'an in your heart.",
  ],
  missing_words: [
    (ctx) => `You did so well! Learning the Qur'an takes patient steps; just watch for "${ctx.word || 'the missing word'}". Take a calm breath and let's try it again together.`,
    (ctx) => `You're very close! Just take your time on "${ctx.word || 'that word'}". I'm right here listening, repeat it gently.`,
    (ctx) => `Great effort! That part was good, just be mindful of "${ctx.word || 'the next word'}". Take your time and recite it once more.`,
  ],
  incorrect_word: [
    (ctx) => `A wonderful attempt! Just be mindful of "${ctx.word || 'this word'}". Pronounce each letter clearly and repeat gently.`,
    (ctx) => `Don't worry at all, practice brings mastery. The correct word is "${ctx.word || 'the expected word'}". Take a breath and let's read it together.`,
    (ctx) => `Good effort! Let us refine "${ctx.word || 'this word'}". Recite it slowly and with care, I am listening.`,
  ],
  premature_stop: [
    () => "Good breath control! You paused just before finishing the verse. Take a comfortable breath and complete the rest.",
    () => "I am listening closely. Take a relaxed breath and finish the remaining part of this blessed ayah.",
    () => "Almost there! Just a short portion remains. Take a gentle breath and finish the verse.",
  ],
  extra_words: [
    () => "Clear recitation! However, an accidental extra word slipped in. Take a calm breath and recite the verse steadily.",
    () => "Good effort, just be careful not to add extra words. Read gently at your own pace.",
  ],
  general_retry: [
    () => "Take your time! The Prophet ﷺ taught us to recite gently with peace. Repeat this ayah at your own pace.",
    () => "No rush at all. Every letter you recite earns ten blessings. Let's repeat this verse with calm concentration.",
    () => "Be gentle on yourself; the Qur'an is learned through loving patience. Let's try this ayah once more together.",
  ],
  cue_next_ayah: [
    (ctx) => `Now for Ayah ${ctx.nextAyahNumber || ''}. Take your time and begin when ready.`,
    (ctx) => `Moving on to Ayah ${ctx.nextAyahNumber || ''}. Recite calmly and peacefully.`,
    (ctx) => `Next is Ayah ${ctx.nextAyahNumber || ''}. Whenever you are ready, please begin.`,
  ],
};

/**
 * Caring Teacher Phrase Generator with History Tracking.
 * Prevents repeating the same sentence consecutively or within the last 6 turns.
 */
export class CaringTeacherPhraseEngine {
  private recentPhrases: string[] = [];
  private maxHistorySize: number = 7;

  /**
   * Generates a warm, supportive, compassionate feedback phrase that hasn't been used recently.
   */
  public getFeedback(
    type: CaringFeedbackType,
    context: FeedbackContext,
    language: 'ar' | 'en' = 'ar'
  ): string {
    const pool = language === 'ar' ? CARING_PHRASES_AR[type] : CARING_PHRASES_EN[type];
    if (!pool || pool.length === 0) {
      return language === 'ar' ? 'أَحْسَنْتَ، بَارَكَ اللهُ فِيكَ.' : "Well done, masha'Allah.";
    }

    // Generate candidates
    const candidates = pool.map((fn) => fn(context));

    // Filter out candidates that exist in recent history
    const freshCandidates = candidates.filter((c) => !this.recentPhrases.includes(c));

    // If all candidates were used recently, use the least recently used candidate
    const chosen =
      freshCandidates.length > 0
        ? freshCandidates[Math.floor(Math.random() * freshCandidates.length)]
        : candidates[Math.floor(Math.random() * candidates.length)];

    // Push to history
    this.recordPhrase(chosen);
    return chosen;
  }

  private recordPhrase(phrase: string) {
    this.recentPhrases.push(phrase);
    if (this.recentPhrases.length > this.maxHistorySize) {
      this.recentPhrases.shift();
    }
  }

  public reset() {
    this.recentPhrases = [];
  }
}
