import { useState, useEffect } from 'react';
import { SupportedLanguageCode, getLanguageCode, getGlobalLanguage } from './i18n';

export interface StudyModuleTranslation {
  title: string;
  arabicTitle: string;
  description: string;
  badge: string;
}

export interface StudyTranslations {
  // Navigation & Header
  academyTitle: string;
  lifetimeFree: string;
  curriculum: string;
  hub: string;
  termsAndNotice: string;
  backToAcademy: string;
  enterModule: string;

  // Hero Section
  heroBadge: string;
  heroSubBadge: string;
  heroTitle: string;
  heroDesc: string;
  lettersMastered: string;
  arabicIq: string;
  readingLevel: string;

  // Reading Levels
  levelBeginner: string;
  levelElementary: string;
  levelIntermediate: string;
  levelAdvanced: string;

  // Modules List
  modules: {
    alphabet: StudyModuleTranslation;
    speaking: StudyModuleTranslation;
    live_arabic: StudyModuleTranslation;
    listening: StudyModuleTranslation;
    reading: StudyModuleTranslation;
    vocabulary: StudyModuleTranslation;
    iq_memory: StudyModuleTranslation;
    test: StudyModuleTranslation;
    teacher: StudyModuleTranslation;
    progress: StudyModuleTranslation;
  };

  // Common Study Actions
  listen: string;
  speak: string;
  stop: string;
  recording: string;
  check: string;
  next: string;
  previous: string;
  restart: string;
  practice: string;
  explain: string;
  translate: string;
  slowDown: string;
  repeat: string;
  correctMe: string;
  testMe: string;
  askTeacher: string;
  send: string;
  clear: string;
  score: string;
  accuracy: string;
  flipCard: string;
  mastered: string;
  needsReview: string;
  tashkeelOn: string;
  tashkeelOff: string;
  rootWord: string;
  grammarTip: string;

  // Onboarding & Terms
  onboardingIntroTitle: string;
  onboardingIntroSub: string;
  onboardingPreparing: string;
  onboardingFreeRevealTitle: string;
  onboardingFreeRevealDesc: string;
  onboardingTermsTitle: string;
  onboardingTermsDesc: string;
  onboardingNoticeTitle: string;
  onboardingNoticeDesc: string;
  onboardingAgreeButton: string;
  onboardingStartButton: string;
}

export const STUDY_TRANSLATIONS: Record<SupportedLanguageCode, StudyTranslations> = {
  en: {
    academyTitle: 'Noor Arabic Academy',
    lifetimeFree: 'Lifetime Free',
    curriculum: 'Curriculum',
    hub: 'Hub',
    termsAndNotice: 'Terms & Notice',
    backToAcademy: 'Back to Arabic Academy',
    enterModule: 'Enter Module',

    heroBadge: 'Comprehensive Arabic Environment',
    heroSubBadge: 'Pure Classical & Modern Arabic',
    heroTitle: 'Master Arabic with Noor AI',
    heroDesc:
      'An authentic, distraction-free environment built for real language acquisition. Learn letters with anatomical articulation (Makhārij), speak live with AI corrections, expand root-based vocabulary, and build true cognitive fluency.',
    lettersMastered: 'Letters Mastered',
    arabicIq: 'Arabic IQ',
    readingLevel: 'Reading Level',

    levelBeginner: 'Beginner',
    levelElementary: 'Elementary',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',

    modules: {
      alphabet: {
        title: 'Alphabet Lab',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 letters, articulation points (Makhārij), positional forms, Harakat soundboard, stroke tracing canvas & challenges.',
        badge: '28 Letters',
      },
      speaking: {
        title: 'Speaking Practice',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Talk to Noor AI in Arabic. Speech recognition, automatic error analysis, pronunciation drills, and vocalized responses.',
        badge: 'Interactive Mic',
      },
      live_arabic: {
        title: 'Live Arabic',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Real-time conversational partner. Dynamic controls: Repeat, Slow down, Make easier, Explain, Translate, Correct me, Test me.',
        badge: 'Live Session',
      },
      listening: {
        title: 'Listening Exercises',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Letter sound discrimination (Haa vs Haa, Ayn, etc.), missing words, sentence comprehension, and acoustic memory sequence.',
        badge: 'Acoustic Ear',
      },
      reading: {
        title: 'Reading Academy',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Graded texts (Levels 1 to 4). Toggle Tashkeel (vowels), tap any word for tri-literal root analysis, and answer comprehension questions.',
        badge: 'Tashkeel Toggle',
      },
      vocabulary: {
        title: 'Vocabulary & Flashcards',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Root-based vocabulary bank with audio & plurals, paired with spaced-repetition flip flashcards and weak-word tracking.',
        badge: 'Root System',
      },
      iq_memory: {
        title: 'Arabic IQ & Memory',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Linguistic IQ deduction: root patterns, morphological transformations (Wazn), word puzzles, and sequential memory retention.',
        badge: 'Cognitive Lab',
      },
      test: {
        title: 'Diagnostic Test',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Comprehensive assessment across Alphabet, Phonetics, Vocabulary, Grammar, and Morphology with an empirical level report.',
        badge: 'CEFR Benchmark',
      },
      teacher: {
        title: 'Personal AI Teacher',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Dedicated Noor Arabic tutor aware of your weak points. Deep explanations for Grammar (Naḥw), Morphology (Ṣarf), and dialects.',
        badge: 'Adaptive Tutor',
      },
      progress: {
        title: 'Mastery & Progress',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Real learning analytics: letters mastered out of 28, reading/speaking/listening/grammar competency levels, and identified weaknesses.',
        badge: 'Empirical Stats',
      },
    },

    listen: 'Listen',
    speak: 'Speak',
    stop: 'Stop',
    recording: 'Recording...',
    check: 'Check Answer',
    next: 'Next',
    previous: 'Previous',
    restart: 'Restart',
    practice: 'Practice',
    explain: 'Explain',
    translate: 'Translate',
    slowDown: 'Slow Down',
    repeat: 'Repeat',
    correctMe: 'Correct Me',
    testMe: 'Test Me',
    askTeacher: 'Ask Teacher',
    send: 'Send',
    clear: 'Clear',
    score: 'Score',
    accuracy: 'Accuracy',
    flipCard: 'Flip Card',
    mastered: 'Mastered',
    needsReview: 'Needs Review',
    tashkeelOn: 'Vowels (Tashkeel) On',
    tashkeelOff: 'Vowels (Tashkeel) Off',
    rootWord: 'Root Word',
    grammarTip: 'Grammar Tip',

    onboardingIntroTitle: 'Welcome to Noor Arabic Academy',
    onboardingIntroSub: 'An authentic, comprehensive environment for classical & modern Arabic.',
    onboardingPreparing: 'Preparing your lifetime free curriculum...',
    onboardingFreeRevealTitle: '100% Free for Life',
    onboardingFreeRevealDesc: 'No subscriptions, no paywalls, and no advertisements. Dedicated solely for the sincere student of knowledge.',
    onboardingTermsTitle: 'Educational Covenant & Transparency',
    onboardingTermsDesc: 'Built with scholarly respect, anatomical phonetics, and AI-assisted conversational practice.',
    onboardingNoticeTitle: 'Pre-Release Dedication',
    onboardingNoticeDesc: 'Continuous improvements are integrated directly into your learning journey.',
    onboardingAgreeButton: 'I Agree & Enter Academy',
    onboardingStartButton: 'Begin Free Learning',
  },

  ar: {
    academyTitle: 'أكاديمية نور للغة العربية',
    lifetimeFree: 'مجاني مدى الحياة',
    curriculum: 'المنهج الدراسي',
    hub: 'المركز التعليمي',
    termsAndNotice: 'الشروط والإشعار',
    backToAcademy: 'العودة إلى أكاديمية العربية',
    enterModule: 'دخول الوحدة',

    heroBadge: 'بيئة لغوية متكاملة وخالصة',
    heroSubBadge: 'فصحى تراثية ومعاصرة',
    heroTitle: 'أتقن لغة القرآن والبيان مع نور الذكي',
    heroDesc:
      'بيئة تعليمية أصيلة خالية من المشتتات لاكتساب اللغة بأسس راسخة. تعلم مخارج الحروف تشريحياً، وحاور الذكاء الاصطناعي مع التصحيح المباشر، ونمّ حصيلتك الاشتقاقية والجذرية.',
    lettersMastered: 'الحروف المتقنة',
    arabicIq: 'الذكاء اللغوي',
    readingLevel: 'مستوى القراءة',

    levelBeginner: 'مبتدئ',
    levelElementary: 'تأسيسي',
    levelIntermediate: 'متوسط',
    levelAdvanced: 'متقدم',

    modules: {
      alphabet: {
        title: 'مختبر الحروف والمخارج',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '٢٨ حرفاً مع المخارج الصوتية والتشريحية، وأشكال الحروف، ولوحة صوتيات الحركات، ولوحة رسم مسار الحرف.',
        badge: '٢٨ حرفاً',
      },
      speaking: {
        title: 'ممارسة النطق والمحادثة',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'تحدث مع نور بالعربية. تمييز صوتي فوري، وتحليل تلقائي للأخطاء، وتدريبات على مخارج الفصحى.',
        badge: 'ميكروفون تفاعلي',
      },
      live_arabic: {
        title: 'العربية المباشرة',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'شريك محادثة فوري ومباشر مع خيارات: أعد، تمهل، بسّط، اشرح، ترجم، صحح لي، اختبرني.',
        badge: 'جلسة حية',
      },
      listening: {
        title: 'تدريبات الاستماع والتمييز',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'التمييز بين الحروف المتقاربة (ح/هـ، ع/أ)، والكلمات المفقودة، وفهم الجمل السمعي.',
        badge: 'أذن صوتية',
      },
      reading: {
        title: 'أكاديمية القراءة والنصوص',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'نصوص متدرجة (المستويات ١ إلى ٤). إمكانية تشغيل التشكيل أو إخفائه، وتحليل الجذور الثلاثية.',
        badge: 'تحكم بالتشكيل',
      },
      vocabulary: {
        title: 'بنك المفردات والبطاقات',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'معجم جذري صوتي يربط المشتقات والجموع، مع بطاقات تكرار متباعد لتثبيت الحفظ.',
        badge: 'النظام الجذري',
      },
      iq_memory: {
        title: 'الذكاء اللغوي والذاكرة',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'استنتاج الأوزان الصرفية وتطبيقات الميزان الصرفي وألغاز الكلمات وتمرين الذاكرة التسلسلية.',
        badge: 'مختبر الإدراك',
      },
      test: {
        title: 'الاختبار التشخيصي',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'تقييم شامل في الحروف، والصوتيات، والمفردات، والنحو، والصرف مع تقرير مستوى معياري دقيق.',
        badge: 'معيار دقيق',
      },
      teacher: {
        title: 'المعلم العربي الشخصي',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'معلم مخصص يعرف نقاط ضعفك ويقدم شروحات متعمقة في النحو والصرف وفقه اللغة.',
        badge: 'معلم تكيفي',
      },
      progress: {
        title: 'سجل الإتقان والإحصائيات',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'تحليلات تعليمية حقيقية: عدد الحروف المتقنة، ومستويات القراءة والاستماع والنطق والنحو.',
        badge: 'إحصاءات حقيقية',
      },
    },

    listen: 'استمع',
    speak: 'تحدث',
    stop: 'إيقاف',
    recording: 'جارٍ الاستماع...',
    check: 'تحقق من الإجابة',
    next: 'التالي',
    previous: 'السابق',
    restart: 'إعادة البدء',
    practice: 'تمرين',
    explain: 'اشرح لي',
    translate: 'ترجم',
    slowDown: 'تمهل بالحديث',
    repeat: 'أعد العبارة',
    correctMe: 'صحح لي',
    testMe: 'اختبرني',
    askTeacher: 'اسأل المعلم',
    send: 'إرسال',
    clear: 'مسح',
    score: 'النتيجة',
    accuracy: 'الدقة',
    flipCard: 'اقلب البطاقة',
    mastered: 'تم الحفظ والإتقان',
    needsReview: 'بحاجة لمراجعة',
    tashkeelOn: 'إظهار التشكيل',
    tashkeelOff: 'إخفاء التشكيل',
    rootWord: 'الجذر اللغوي',
    grammarTip: 'فائدة نحوية',

    onboardingIntroTitle: 'مرحباً بكم في أكاديمية نور للغة العربية',
    onboardingIntroSub: 'بيئة تعليمية أصيلة ومتكاملة للغة الفصحى لغة القرآن الكريم.',
    onboardingPreparing: 'جارٍ تحضير المنهج التعليمي المجاني بالكامل...',
    onboardingFreeRevealTitle: 'مجانية بالكامل مدى الحياة ١٠٠٪',
    onboardingFreeRevealDesc: 'بلا اشتراكات وبلا إعلانات، صُممت ابتغاء وجه الله وخدمة لطلاب العلم.',
    onboardingTermsTitle: 'ميثاق الأمانة العلمية والتعليمية',
    onboardingTermsDesc: 'مبنية على أصول لغوية معتبرة، ومخارج تشريحية دقيقة، ومحادثة صوتية ذكية.',
    onboardingNoticeTitle: 'إشعار النسخة التمهيدية',
    onboardingNoticeDesc: 'تطوير مستمر ومباشر يواكب رحلتكم في تعلم لغة الضاد.',
    onboardingAgreeButton: 'أوافق وأدخل الأكاديمية',
    onboardingStartButton: 'ابدأ التعلم مجاناً',
  },

  am: {
    academyTitle: 'የኑር አረብኛ አካዳሚ',
    lifetimeFree: 'የዕድሜ ልክ ነፃ',
    curriculum: 'የትምህርት መርሃግብር',
    hub: 'ዋና ማዕከል',
    termsAndNotice: 'ውሎች እና ማስታወቂያ',
    backToAcademy: 'ወደ አረብኛ አካዳሚ ተመለስ',
    enterModule: 'ወደ ሞጁሉ ይግቡ',

    heroBadge: 'ሁለንተናዊ የአረብኛ መማሪያ',
    heroSubBadge: 'ንፁህ ክላሲካል እና ዘመናዊ አረብኛ',
    heroTitle: 'አረብኛን በኑር AI ይማሩ',
    heroDesc:
      'እውነተኛ እና ያልተወሳሰበ የአረብኛ ቋንቋ መማሪያ። የፊደላት አነባበብ (መኻሪጅ)፣ የቀጥታ የንግግር ልምምድ ከAI እርማት ጋር፣ የቃላት ግንባታ እና ጥልቅ የቋንቋ ግንዛቤ ያግኙ።',
    lettersMastered: 'የተካኑ ፊደላት',
    arabicIq: 'የአረብኛ አይኪው',
    readingLevel: 'የንባብ ደረጃ',

    levelBeginner: 'ጀማሪ',
    levelElementary: 'መሰረታዊ',
    levelIntermediate: 'መካከለኛ',
    levelAdvanced: 'ከፍተኛ',

    modules: {
      alphabet: {
        title: 'የፊደላት ቤተ-ሙከራ',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 ፊደላት፣ የአፈጣጠር መውጫዎች (መኻሪጅ)፣ የተለያዩ ቅርፆች፣ የድምፅ ሰሌዳ እና የመፃፍ ልምምድ።',
        badge: '28 ፊደላት',
      },
      speaking: {
        title: 'የንግግር ልምምድ',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'ከኑር AI ጋር በአረብኛ ይነጋገሩ። የድምፅ እውቅና፣ ራስ-ሰር የስህተት ትንተና እና የአነባበብ ልምምዶች።',
        badge: 'የድምፅ ማይክ',
      },
      live_arabic: {
        title: 'የቀጥታ አረብኛ',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'የቀጥታ ውይይት ጓደኛ: ድገም፣ አቀስቅስ፣ አቅልል፣ አስረዳ፣ ተርጉም፣ አርመኝ እና ፈትነኝ አማራጮች።',
        badge: 'የቀጥታ ክፍለ-ጊዜ',
      },
      listening: {
        title: 'የማዳመጥ ልምምዶች',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'ተመሳሳይ ድምፆችን መለየት፣ የጎደሉ ቃላት፣ የዓረፍተ-ነገር ግንዛቤ እና የአኮስቲክ ማስታወስ ችሎታ።',
        badge: 'የማዳመጥ ልምምድ',
      },
      reading: {
        title: 'የንባብ አካዳሚ',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'ደረጃቸውን የጠበቁ ፅሁፎች (ከደረጃ 1 እስከ 4)። ተሽኪል ማብራት/ማጥፋት እና የቃላት ስር ትንተና።',
        badge: 'ተሽኪል መቆጣጠሪያ',
      },
      vocabulary: {
        title: 'ቃላት እና ፍላሽካርዶች',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'በስረ-ቃል ላይ የተመሰረተ የቃላት ባንክ ከድምፅ ጋር፣ እና በማስታወስ ላይ የተመሰረተ ፍላሽካርዶች።',
        badge: 'የቃላት ስር',
      },
      iq_memory: {
        title: 'የአረብኛ አይኪው እና ማስታወስ',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'የቋንቋ አመክንዮ: የቃላት ሚዛን (ወዝን)፣ የቃላት እንቆቅልሾች እና ተከታታይ የማስታወስ ችሎታ።',
        badge: 'የማሰብ ቤተ-ሙከራ',
      },
      test: {
        title: 'የደረጃ መፈተሻ ፈተና',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'በፊደላት፣ በድምፆች፣ በቃላት፣ በሰዋሰው እና በስነ-ቅርፅ ላይ የተመሰረተ አጠቃላይ የደረጃ ግምገማ።',
        badge: 'መደበኛ ፈተና',
      },
      teacher: {
        title: 'የግል AI መምህር',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'ደካማ ጎኖቻችሁን የሚያውቅ የግል አረብኛ አስተማሪ። ለሰዋሰው (ነህው) እና ለስነ-ቅርፅ (ሰርፍ) ጥልቅ ማብራሪያ።',
        badge: 'ተስማሚ መምህር',
      },
      progress: {
        title: 'የዕድገት እና የውጤት መዝገብ',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'እውነተኛ የትምህርት ትንተና: የተካኗቸው ፊደላት፣ የንባብ/የንግግር/የማዳመጥ እና የሰዋሰው ብቃት ደረጃዎች።',
        badge: 'እውነተኛ ስታቲስቲክስ',
      },
    },

    listen: 'አዳምጥ',
    speak: 'ተናገር',
    stop: 'አቁም',
    recording: 'እያዳመጠ ነው...',
    check: 'መልስ አረጋግጥ',
    next: 'ቀጣይ',
    previous: 'ቀደምት',
    restart: 'እንደገና ጀምር',
    practice: 'ልምምድ',
    explain: 'አስረዳኝ',
    translate: 'ተርጉም',
    slowDown: 'ቀስ በል',
    repeat: 'ድገም',
    correctMe: 'አርመኝ',
    testMe: 'ፈትነኝ',
    askTeacher: 'መምህሩን ጠይቅ',
    send: 'ላክ',
    clear: 'አጽዳ',
    score: 'ውጤት',
    accuracy: 'ትክክለኛነት',
    flipCard: 'ካርድ ገልብጥ',
    mastered: 'ተካኗል',
    needsReview: 'ክለሳ ይፈልጋል',
    tashkeelOn: 'ተሽኪል በርቷል',
    tashkeelOff: 'ተሽኪል ጠፍቷል',
    rootWord: 'የቃል ስር',
    grammarTip: 'የሰዋሰው ፍንጭ',

    onboardingIntroTitle: 'ወደ ኑር አረብኛ አካዳሚ እንኳን በደህና መጡ',
    onboardingIntroSub: 'ለቁርኣን ቋንቋ የተዘጋጀ ጥራት ያለው ሁለንተናዊ የትምህርት ማዕከል',
    onboardingPreparing: 'የዕድሜ ልክ ነፃ ትምህርት እየተዘጋጀ ነው...',
    onboardingFreeRevealTitle: '100% የዕድሜ ልክ ነፃ',
    onboardingFreeRevealDesc: 'ምንም አይነት ክፍያ የሌለው፣ ያለ ማስታወቂያ የተዘጋጀ የትምህርት መድረክ።',
    onboardingTermsTitle: 'የትምህርት ስምምነት እና ግልፅነት',
    onboardingTermsDesc: 'በጥንቃቄ እና በከፍተኛ ጥራት የተገነባ የአረብኛ ቋንቋ መማሪያ ስርዓት።',
    onboardingNoticeTitle: 'የመጀመሪያ እትም ማስታወቂያ',
    onboardingNoticeDesc: 'የትምህርት ጉዞዎን ለማሳደግ ቀጣይነት ያለው ማሻሻያ ይደረጋል።',
    onboardingAgreeButton: 'ተስማምቼ ወደ አካዳሚው እገባለሁ',
    onboardingStartButton: 'ትምህርቱን በነፃ ጀምር',
  },

  fr: {
    academyTitle: "Académie d'Arabe Noor",
    lifetimeFree: 'Gratuit à Vie',
    curriculum: 'Programme',
    hub: 'Centre',
    termsAndNotice: 'Conditions & Avis',
    backToAcademy: "Retour à l'Académie d'Arabe",
    enterModule: 'Entrer dans le Module',

    heroBadge: 'Environnement Arabe Complet',
    heroSubBadge: 'Arabe Classique et Moderne Pur',
    heroTitle: "Maîtrisez l'Arabe avec Noor IA",
    heroDesc:
      "Un environnement authentique et sans distraction pour une véritable acquisition de la langue. Apprenez les lettres avec leur point d'articulation (Makhārij), parlez en direct avec corrections IA, et enrichissez votre vocabulaire basé sur les racines.",
    lettersMastered: 'Lettres Maîtrisées',
    arabicIq: 'QI Arabe',
    readingLevel: 'Niveau de Lecture',

    levelBeginner: 'Débutant',
    levelElementary: 'Élémentaire',
    levelIntermediate: 'Intermédiaire',
    levelAdvanced: 'Avancé',

    modules: {
      alphabet: {
        title: "Laboratoire de l'Alphabet",
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 lettres, points d’articulation (Makhārij), formes positionnelles, tableau des voyelles Harakat et traçage interactif.',
        badge: '28 Lettres',
      },
      speaking: {
        title: 'Pratique de l’Expression Orale',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Parlez en arabe avec Noor IA. Reconnaissance vocale, analyse automatique des erreurs et exercices de prononciation.',
        badge: 'Micro Interactif',
      },
      live_arabic: {
        title: 'Arabe en Direct',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Partenaire de conversation en temps réel. Commandes: Répéter, Ralentir, Simplifier, Expliquer, Traduire, Corrige-moi.',
        badge: 'Session Directe',
      },
      listening: {
        title: 'Exercices d’Écoute',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Discrimination des sons (Haa vs Haa, Ayn, etc.), mots manquants, compréhension de phrases et mémoire acoustique.',
        badge: 'Oreille Acoustique',
      },
      reading: {
        title: 'Académie de Lecture',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Textes gradués (Niveaux 1 à 4). Activez/désactivez le Tashkeel (voyelles) et découvrez la racine trilittère de chaque mot.',
        badge: 'Contrôle Voyelles',
      },
      vocabulary: {
        title: 'Vocabulaire & Flashcards',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Banque de vocabulaire basée sur les racines avec audio, cartes mémoire à répétition espacée et suivi des mots difficiles.',
        badge: 'Système Racines',
      },
      iq_memory: {
        title: 'QI Arabe & Mémoire',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Déduction linguistique: schémas de racines (Wazn), énigmes de mots et mémorisation séquentielle.',
        badge: 'Labo Cognitif',
      },
      test: {
        title: 'Test Diagnostique',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Évaluation complète couvrant Alphabet, Phonétique, Vocabulaire, Grammaire et Morphologie avec rapport de niveau.',
        badge: 'Norme CEFR',
      },
      teacher: {
        title: 'Professeur IA Personnel',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Tuteur arabe dédié attentif à vos faiblesses. Explications approfondies en grammaire (Naḥw) et morphologie (Ṣarf).',
        badge: 'Tuteur Adaptatif',
      },
      progress: {
        title: 'Maîtrise & Progression',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Statistiques réelles: lettres maîtrisées sur 28, compétences en lecture, expression, écoute et grammaire.',
        badge: 'Stats Réelles',
      },
    },

    listen: 'Écouter',
    speak: 'Parler',
    stop: 'Arrêter',
    recording: 'Écoute en cours...',
    check: 'Vérifier la Réponse',
    next: 'Suivant',
    previous: 'Précédent',
    restart: 'Recommencer',
    practice: 'Pratiquer',
    explain: 'Expliquer',
    translate: 'Traduire',
    slowDown: 'Ralentir',
    repeat: 'Répéter',
    correctMe: 'Corrige-moi',
    testMe: 'Teste-moi',
    askTeacher: 'Demander au Tuteur',
    send: 'Envoyer',
    clear: 'Effacer',
    score: 'Score',
    accuracy: 'Précision',
    flipCard: 'Retourner la Carte',
    mastered: 'Maîtrisé',
    needsReview: 'À Réviser',
    tashkeelOn: 'Voyelles (Tashkeel) Activées',
    tashkeelOff: 'Voyelles (Tashkeel) Désactivées',
    rootWord: 'Racine du Mot',
    grammarTip: 'Conseil Grammatical',

    onboardingIntroTitle: "Bienvenue à l'Académie d'Arabe Noor",
    onboardingIntroSub: "Un environnement authentique pour l'arabe classique et moderne.",
    onboardingPreparing: 'Préparation de votre cursus gratuit à vie...',
    onboardingFreeRevealTitle: '100% Gratuit à Vie',
    onboardingFreeRevealDesc: 'Sans abonnement ni publicité. Dédié sincèrement aux étudiants de la langue arabe.',
    onboardingTermsTitle: 'Pacte Éducatif & Transparence',
    onboardingTermsDesc: 'Conçu avec rigueur phonétique, articulation anatomique et pratique interactive.',
    onboardingNoticeTitle: 'Avis de Pré-Lancement',
    onboardingNoticeDesc: 'Des améliorations continues accompagnent votre apprentissage.',
    onboardingAgreeButton: "J'Accepte & J'Entre dans l'Académie",
    onboardingStartButton: 'Commencer Gratuitement',
  },

  zh: {
    academyTitle: 'Noor阿拉伯语学院',
    lifetimeFree: '终生免费',
    curriculum: '课程',
    hub: '中心',
    termsAndNotice: '条款与声明',
    backToAcademy: '返回阿拉伯语学院',
    enterModule: '进入模块',

    heroBadge: '全面的阿拉伯语学习环境',
    heroSubBadge: '纯正经典与现代阿拉伯语',
    heroTitle: '通过Noor AI精通阿拉伯语',
    heroDesc:
      '真实的沉浸式无干扰环境，助您真正掌握语言。通过发音器官解剖学学习字母发音点（Makhārij），通过AI即时纠错进行口语对话，扩展词根词汇。',
    lettersMastered: '已掌握字母',
    arabicIq: '阿拉伯语智商',
    readingLevel: '阅读水平',

    levelBeginner: '初学者',
    levelElementary: '初级',
    levelIntermediate: '中级',
    levelAdvanced: '高级',

    modules: {
      alphabet: {
        title: '字母发音实验室',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28个字母、发音部位（Makhārij）、形态变化、元音音板及笔画书写互动练习。',
        badge: '28个字母',
      },
      speaking: {
        title: '口语表达练习',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: '与Noor AI进行阿拉伯语对话。语音识别、自动错误分析及发音纠正。',
        badge: '互动麦克风',
      },
      live_arabic: {
        title: '实时阿拉伯语对话',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: '实时对话伙伴。支持：重复、放慢、简化、解释、翻译、纠正我、测试我。',
        badge: '在线互动',
      },
      listening: {
        title: '听力强化练习',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: '易混字母辨析（如ح与هـ、ع与أ）、填空、句子理解与听觉记忆强化。',
        badge: '听觉辨析',
      },
      reading: {
        title: '阅读进阶学院',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: '分级阅读文本（1至4级）。支持开关动符（Tashkeel）及三字母词根分析。',
        badge: '动符开关',
      },
      vocabulary: {
        title: '词汇库与记忆卡片',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: '基于词根的词汇库，附带真人发音与复数形式，配合间隔重复记忆卡。',
        badge: '词根系统',
      },
      iq_memory: {
        title: '语言智商与记忆训练',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: '语言学逻辑推导：词根词型（Wazn）、词汇谜题与序列记忆提升。',
        badge: '认知实验室',
      },
      test: {
        title: '水平诊断测试',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: '涵盖字母、语音、词汇、语法与构词法的综合评估报告。',
        badge: '标准测评',
      },
      teacher: {
        title: '专属AI阿拉伯语导师',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: '了解您学习弱点的专属导师。深入讲解语法（Naḥw）与构词法（Ṣarf）。',
        badge: '自适应导师',
      },
      progress: {
        title: '学习掌握度与统计',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: '真实学习数据：已掌握字母数、阅读/口语/听力/语法能力雷达图。',
        badge: '真实数据',
      },
    },

    listen: '听',
    speak: '说话',
    stop: '停止',
    recording: '正在聆听...',
    check: '检查答案',
    next: '下一题',
    previous: '上一题',
    restart: '重新开始',
    practice: '练习',
    explain: '解释',
    translate: '翻译',
    slowDown: '放慢速度',
    repeat: '重复',
    correctMe: '纠正我',
    testMe: '考考我',
    askTeacher: '请教导师',
    send: '发送',
    clear: '清除',
    score: '得分',
    accuracy: '准确率',
    flipCard: '翻转卡片',
    mastered: '已掌握',
    needsReview: '待复习',
    tashkeelOn: '显示动符',
    tashkeelOff: '隐藏动符',
    rootWord: '词根',
    grammarTip: '语法提示',

    onboardingIntroTitle: '欢迎来到Noor阿拉伯语学院',
    onboardingIntroSub: '纯正经典的古汉与现代阿拉伯语学习平台。',
    onboardingPreparing: '正在准备您的终身免费课程...',
    onboardingFreeRevealTitle: '100% 终生免费',
    onboardingFreeRevealDesc: '无订阅、无付费墙、无广告。真诚献给所有求学者。',
    onboardingTermsTitle: '学术公约与透明度',
    onboardingTermsDesc: '遵循严谨语音学、解剖发音部位与AI智能辅助。',
    onboardingNoticeTitle: '先行体验版声明',
    onboardingNoticeDesc: '持续优化您的阿拉伯语学习体验。',
    onboardingAgreeButton: '我同意并进入学院',
    onboardingStartButton: '开始免费学习',
  },

  es: {
    academyTitle: 'Academia de Árabe Noor',
    lifetimeFree: 'Gratis de por Vida',
    curriculum: 'Plan de Estudios',
    hub: 'Centro',
    termsAndNotice: 'Términos y Aviso',
    backToAcademy: 'Volver a la Academia de Árabe',
    enterModule: 'Entrar al Módulo',

    heroBadge: 'Entorno Integral de Árabe',
    heroSubBadge: 'Árabe Clásico y Moderno Puro',
    heroTitle: 'Domina el Árabe con Noor IA',
    heroDesc:
      'Un entorno auténtico y libre de distracciones para la verdadera adquisición del idioma. Aprende letras con articulación anatómica (Makhārij), habla en vivo con correcciones por IA y expande tu vocabulario por raíces.',
    lettersMastered: 'Letras Dominadas',
    arabicIq: 'CI de Árabe',
    readingLevel: 'Nivel de Lectura',

    levelBeginner: 'Principiante',
    levelElementary: 'Elemental',
    levelIntermediate: 'Intermedio',
    levelAdvanced: 'Avanzado',

    modules: {
      alphabet: {
        title: 'Laboratorio del Alfabeto',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 letras, puntos de articulación (Makhārij), formas posicionales, sonidos de Harakat y trazo interactivo.',
        badge: '28 Letras',
      },
      speaking: {
        title: 'Práctica de Conversación',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Habla en árabe con Noor IA. Reconocimiento de voz, análisis de errores en tiempo real y ejercicios de pronunciación.',
        badge: 'Micrófono Activo',
      },
      live_arabic: {
        title: 'Árabe en Vivo',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Compañero de conversación en tiempo real con controles: Repetir, Más lento, Simplificar, Explicar, Traducir, Corrígeme.',
        badge: 'Sesión en Vivo',
      },
      listening: {
        title: 'Ejercicios de Escucha',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Discriminación auditiva de letras, palabras faltantes, comprensión de oraciones y memoria acústica.',
        badge: 'Oído Acústico',
      },
      reading: {
        title: 'Academia de Lectura',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Textos graduados (Niveles 1 a 4). Activa o desactiva vocales (Tashkeel) y consulta la raíz trilítera de cada palabra.',
        badge: 'Control Vocálico',
      },
      vocabulary: {
        title: 'Vocabulario y Tarjetas',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Banco de vocabulario basado en raíces con audio y plurales, junto con tarjetas de repetición espaciada.',
        badge: 'Sistema de Raíces',
      },
      iq_memory: {
        title: 'CI Árabe y Memoria',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Deducción lingüística: patrones de raíces (Wazn), acertijos morfológicos y memoria secuencial.',
        badge: 'Laboratorio Cognitivo',
      },
      test: {
        title: 'Test Diagnóstico',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Evaluación completa en Alfabeto, Fonética, Vocabulario, Gramática y Morfología con reporte empírico de nivel.',
        badge: 'Nivel CEFR',
      },
      teacher: {
        title: 'Profesor Personal IA',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Tutor dedicado de árabe que conoce tus puntos débiles. Explicaciones de Gramática (Naḥw) y Morfología (Ṣarf).',
        badge: 'Tutor Adaptativo',
      },
      progress: {
        title: 'Dominio y Progreso',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Estadísticas reales: letras dominadas de 28, niveles de competencia en lectura, conversación y gramática.',
        badge: 'Estadísticas Reales',
      },
    },

    listen: 'Escuchar',
    speak: 'Hablar',
    stop: 'Detener',
    recording: 'Escuchando...',
    check: 'Comprobar Respuesta',
    next: 'Siguiente',
    previous: 'Anterior',
    restart: 'Reiniciar',
    practice: 'Practicar',
    explain: 'Explicar',
    translate: 'Traducir',
    slowDown: 'Más Despacio',
    repeat: 'Repetir',
    correctMe: 'Corrígeme',
    testMe: 'Pruébame',
    askTeacher: 'Preguntar al Tutor',
    send: 'Enviar',
    clear: 'Limpiar',
    score: 'Puntuación',
    accuracy: 'Precisión',
    flipCard: 'Voltear Tarjeta',
    mastered: 'Dominado',
    needsReview: 'Necesita Repaso',
    tashkeelOn: 'Vocales (Tashkeel) Activas',
    tashkeelOff: 'Vocales (Tashkeel) Inactivas',
    rootWord: 'Raíz de la Palabra',
    grammarTip: 'Consejo Gramatical',

    onboardingIntroTitle: 'Bienvenido a la Academia de Árabe Noor',
    onboardingIntroSub: 'Un entorno auténtico para el árabe clásico y moderno.',
    onboardingPreparing: 'Preparando tu plan de estudios gratis de por vida...',
    onboardingFreeRevealTitle: '100% Gratis de por Vida',
    onboardingFreeRevealDesc: 'Sin suscripciones, sin muros de pago y sin anuncios. Dedicado sinceramente al estudiante del idioma.',
    onboardingTermsTitle: 'Pacto Educativo y Transparencia',
    onboardingTermsDesc: 'Construido con rigor fonético, articulación anatómica y práctica conversacional asistida por IA.',
    onboardingNoticeTitle: 'Aviso de Acceso Temprano',
    onboardingNoticeDesc: 'Mejoras continuas integradas en tu viaje de aprendizaje.',
    onboardingAgreeButton: 'Acepto y Entro a la Academia',
    onboardingStartButton: 'Comenzar Gratis',
  },

  tr: {
    academyTitle: 'Noor Arapça Akademisi',
    lifetimeFree: 'Ömür Boyu Ücretsiz',
    curriculum: 'Müfredat',
    hub: 'Merkez',
    termsAndNotice: 'Şartlar ve Bildirim',
    backToAcademy: 'Arapça Akademisine Dön',
    enterModule: 'Modüle Gir',

    heroBadge: 'Kapsamlı Arapça Ortamı',
    heroSubBadge: 'Saf Klasik ve Modern Arapça',
    heroTitle: 'Noor AI ile Arapça Öğrenin',
    heroDesc:
      'Gerçek dil edinimi için tasarlanmış dikkat dağıtıcı unsurlardan uzak özgün bir ortam. Harfleri anatomik mahreçleriyle öğrenin, yapay zeka ile canlı konuşup anında geri bildirim alın.',
    lettersMastered: 'Öğrenilen Harfler',
    arabicIq: 'Arapça IQ',
    readingLevel: 'Okuma Seviyesi',

    levelBeginner: 'Başlangıç',
    levelElementary: 'Temel',
    levelIntermediate: 'Orta',
    levelAdvanced: 'İleri',

    modules: {
      alphabet: {
        title: 'Harf ve Mahreç Laboratuvarı',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 harf, mahreç noktaları (Makhārij), harf konumları, harekeler ses paneli ve çizim pratiği.',
        badge: '28 Harf',
      },
      speaking: {
        title: 'Konuşma Pratiği',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Noor AI ile Arapça konuşun. Ses tanıma, otomatik hata analizi ve doğru telaffuz alıştırmaları.',
        badge: 'İnteraktif Mikrofon',
      },
      live_arabic: {
        title: 'Canlı Arapça Sohbet',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Gerçek zamanlı sohbet ortağı: Tekrarla, Yavaşla, Basitleştir, Açıkla, Çevir, Düzelt, Test et.',
        badge: 'Canlı Oturum',
      },
      listening: {
        title: 'Dinleme Alıştırmaları',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Benzer harfleri ayırt etme, eksik kelimeyi bulma, cümle anlama ve işitsel hafıza eğitimi.',
        badge: 'İşitsel Kulak',
      },
      reading: {
        title: 'Okuma Akademisi',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Seviyeli metinler (1-4 Seviye). Harekeleri açıp kapatma ve üçlü kök harf analizi.',
        badge: 'Hareke Kontrolü',
      },
      vocabulary: {
        title: 'Kelime Bankası ve Kartlar',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Kök tabanlı kelime haznesi, sesli telaffuzlar ve aralıklı tekrar kart sistemi.',
        badge: 'Kök Sistemi',
      },
      iq_memory: {
        title: 'Arapça IQ ve Hafıza',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Dil mantığı: Vezin kalıpları (Wazn), kelime bulmacaları ve sıralı hafıza egzersizleri.',
        badge: 'Bilişsel Lab',
      },
      test: {
        title: 'Seviye Tespit Sınavı',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Harfler, fonetik, kelime, nahiv ve sarf konularında kapsamlı düzey raporu.',
        badge: 'Standart Sınav',
      },
      teacher: {
        title: 'Kişisel Yapay Zeka Öğretmeni',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Eksiklerinizi bilen özel öğretmen. Nahiv (dilbilgisi) ve Sarf (şekilbilgisi) detaylı açıklamaları.',
        badge: 'Uyumlu Öğretmen',
      },
      progress: {
        title: 'İlerleme ve İstatistikler',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Gerçek öğrenme verileri: öğrenilen harf sayısı, okuma/konuşma/dinleme ve dilbilgisi düzeyleri.',
        badge: 'Gerçek Veriler',
      },
    },

    listen: 'Dinle',
    speak: 'Konuş',
    stop: 'Durdur',
    recording: 'Dinleniyor...',
    check: 'Cevabı Kontrol Et',
    next: 'Sonraki',
    previous: 'Önceki',
    restart: 'Yeniden Başlat',
    practice: 'Pratik Yap',
    explain: 'Açıkla',
    translate: 'Çevir',
    slowDown: 'Yavaşla',
    repeat: 'Tekrar Et',
    correctMe: 'Beni Düzelt',
    testMe: 'Beni Sına',
    askTeacher: 'Öğretmene Sor',
    send: 'Gönder',
    clear: 'Temizle',
    score: 'Puan',
    accuracy: 'Doğruluk',
    flipCard: 'Kartı Çevir',
    mastered: 'Öğrenildi',
    needsReview: 'Tekrar Gerekli',
    tashkeelOn: 'Harekeler Açık',
    tashkeelOff: 'Harekeler Kapalı',
    rootWord: 'Kök Kelime',
    grammarTip: 'Dilbilgisi İpucu',

    onboardingIntroTitle: 'Noor Arapça Akademisine Hoş Geldiniz',
    onboardingIntroSub: 'Klasik ve modern Arapça için özgün eğitim ortamı.',
    onboardingPreparing: 'Ömür boyu ücretsiz müfredatınız hazırlanıyor...',
    onboardingFreeRevealTitle: 'Ömür Boyu %100 Ücretsiz',
    onboardingFreeRevealDesc: 'Abonelik yok, gizli ücret yok, reklam yok. İlim talebelerine samimiyetle adanmıştır.',
    onboardingTermsTitle: 'Eğitim Ahdi ve Şeffaflık',
    onboardingTermsDesc: 'Doğru fonetik, anatomik mahreçler ve yapay zeka destekli konuşma pratiği.',
    onboardingNoticeTitle: 'Erken Erişim Bildirimi',
    onboardingNoticeDesc: 'Öğrenme sürecinizi destekleyen sürekli geliştirmeler.',
    onboardingAgreeButton: 'Kabul Ediyorum ve Başlıyorum',
    onboardingStartButton: 'Ücretsiz Öğrenmeye Başla',
  },

  ur: {
    academyTitle: 'نور عربی اکیڈمی',
    lifetimeFree: 'تاحیات مفت',
    curriculum: 'نصاب',
    hub: 'مرکزی ڈیش بورڈ',
    termsAndNotice: 'شرائط و نوٹس',
    backToAcademy: 'عربی اکیڈمی کی طرف واپس',
    enterModule: 'ماڈیول میں داخل ہوں',

    heroBadge: 'جامع عربی تعلیمی ماحول',
    heroSubBadge: 'خالص کلاسیکی و جدید عربی',
    heroTitle: 'نور AI کے ساتھ عربی پر عبور حاصل کریں',
    heroDesc:
      'بغیر کسی خلفشار کے عربی زبان سیکھنے کا مستند پلیٹ فارم۔ حروف کو ان کے درست مخارج سے سیکھیں، لائیو AI کے ساتھ گفتگو کریں اور اپنی لغوی صلاحیتوں کو جلا بخشیں۔',
    lettersMastered: 'مہارت یافتہ حروف',
    arabicIq: 'عربی آئی کیو',
    readingLevel: 'پڑھنے کی سطح',

    levelBeginner: 'مبتدی',
    levelElementary: 'ابتدائی',
    levelIntermediate: 'متوسط',
    levelAdvanced: 'اعلیٰ',

    modules: {
      alphabet: {
        title: 'حروف اور مخارج کی لیب',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 حروف، صوتی مخارج، حرکات کا ساؤنڈ بورڈ، مختلف اشکال اور قلمی ٹریسنگ۔',
        badge: '28 حروف',
      },
      speaking: {
        title: 'گفتگو اور تلفظ کی مشق',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'نور AI کے ساتھ عربی میں بات چیت کریں۔ فوری صوتی جانچ اور درستی۔',
        badge: 'انٹرایکٹو مائیک',
      },
      live_arabic: {
        title: 'لائیو عربی بات چیت',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'ریئل ٹائم ہم کلام ساتھی: دہرائیں، آہستہ بولیں، آسان بنائیں، وضاحت کریں، ترجمہ کریں، تصحیح کریں۔',
        badge: 'لائیو سیشن',
      },
      listening: {
        title: 'سماعت اور پہچان کی مشقیں',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'قریبی المخرج حروف میں تفریق (ح/ہ، ع/ء)، خالی جگہ اور جملوں کو سمجھنے کی صلاحیت۔',
        badge: 'صوتی سماعت',
      },
      reading: {
        title: 'اکیڈمی برائے قرأت و مطالعہ',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'مختلف درجاتی متون (سطح 1 تا 4)۔ اعراب (تشکیل) کو آن/آف کریں اور سہ حرفی مادہ تلاش کریں۔',
        badge: 'اعراب کنٹرول',
      },
      vocabulary: {
        title: 'ذخیرہ الفاظ اور فلیش کارڈز',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'جڑوں پر مبنی لغت مع صوتی تلفظ و جمع، اور وقفہ وقفہ سے دہرائی کے فلیش کارڈز۔',
        badge: 'نظامِ اشتقاق',
      },
      iq_memory: {
        title: 'عربی ذہانت اور حافظہ',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'صرفی اوزان کا استنباط، کلمات کی پہیلیاں اور مسلسل حافظے کی تقویت۔',
        badge: 'ادراکی لیب',
      },
      test: {
        title: 'تشخیصی امتحان',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'حروف، صوتیات، مفردات، نحو اور صرف کا جامع اور معیاری امتحانی جائزہ۔',
        badge: 'معیاری جانچ',
      },
      teacher: {
        title: 'ذاتی AI عربی استاد',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'آپ کی کمزوریوں سے باخبر استاد۔ نحو و صرف اور قواعد کی آسان اور عمیق تفہیم۔',
        badge: 'موافق استاد',
      },
      progress: {
        title: 'پیش رفت اور کارکردگی',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'حقیقی تعلیمی اعداد و شمار: حروف کی مہارت، قرأت، سماعت، اور قواعد کے مدارج۔',
        badge: 'حقیقی اعداد',
      },
    },

    listen: 'سنیں',
    speak: 'بولیں',
    stop: 'روکیں',
    recording: 'سنا جا رہا ہے...',
    check: 'جواب چیک کریں',
    next: 'اگلا',
    previous: 'پچھلا',
    restart: 'دوبارہ شروع کریں',
    practice: 'مشق کریں',
    explain: 'وضاحت کریں',
    translate: 'ترجمہ کریں',
    slowDown: 'آہستہ بولیں',
    repeat: 'دہرائیں',
    correctMe: 'میری اصلاح کریں',
    testMe: 'میرا امتحان لیں',
    askTeacher: 'استاد سے پوچھیں',
    send: 'ارسال کریں',
    clear: 'صاف کریں',
    score: 'اسکور',
    accuracy: 'درستگی',
    flipCard: 'کارڈ پلٹیں',
    mastered: 'یاد ہو گیا',
    needsReview: 'دہرائی درکار ہے',
    tashkeelOn: 'اعراب (تشکیل) ظاہر',
    tashkeelOff: 'اعراب (تشکیل) پوشیدہ',
    rootWord: 'مادہ (جڑ)',
    grammarTip: 'نحوی نکتہ',

    onboardingIntroTitle: 'نور عربی اکیڈمی میں خوش آمدید',
    onboardingIntroSub: 'قرآن کریم کی زبان سیکھنے کے لیے خالص اور مستند ماحول۔',
    onboardingPreparing: 'آپ کا تاحیات مفت نصاب تیار کیا جا رہا ہے...',
    onboardingFreeRevealTitle: '100% تاحیات بالکل مفت',
    onboardingFreeRevealDesc: 'کوئی فیس نہیں، کوئی اشتہار نہیں۔ خالصتاً علم کے متلاشیوں کے لیے وقف۔',
    onboardingTermsTitle: 'تعلیمی دیانت اور شفافیت',
    onboardingTermsDesc: 'مستند صوتیات، تشریحی مخارج اور گفتگو کی سائنسی بنیادوں پر مبنی۔',
    onboardingNoticeTitle: 'ابتدائی ورژن کی اطلاع',
    onboardingNoticeDesc: 'آپ کے تعلیمی سفر کو بہترین بنانے کے لیے مسلسل بہتری کا عمل جاری ہے۔',
    onboardingAgreeButton: 'میں متفق ہوں اور اکیڈمی میں داخل ہوں',
    onboardingStartButton: 'مفت سیکھنا شروع کریں',
  },

  id: {
    academyTitle: 'Akademi Bahasa Arab Noor',
    lifetimeFree: 'Gratis Seumur Hidup',
    curriculum: 'Kurikulum',
    hub: 'Pusat',
    termsAndNotice: 'Syarat & Pemberitahuan',
    backToAcademy: 'Kembali ke Akademi Arab',
    enterModule: 'Masuk Modul',

    heroBadge: 'Lingkungan Bahasa Arab Komprehensif',
    heroSubBadge: 'Bahasa Arab Klasik & Modern Murni',
    heroTitle: 'Kuasai Bahasa Arab bersama Noor AI',
    heroDesc:
      'Lingkungan belajar otentik tanpa gangguan untuk penguasaan bahasa yang sesungguhnya. Pelajari huruf dengan makharijul huruf anatomis, berbicara langsung dengan koreksi AI, dan perluas kosakata berbasis akar kata.',
    lettersMastered: 'Huruf Dikuasai',
    arabicIq: 'IQ Bahasa Arab',
    readingLevel: 'Tingkat Membaca',

    levelBeginner: 'Pemula',
    levelElementary: 'Dasar',
    levelIntermediate: 'Menengah',
    levelAdvanced: 'Lanjutan',

    modules: {
      alphabet: {
        title: 'Laboratorium Huruf & Makhraj',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 huruf, titik artikulasi (Makhārij), bentuk posisi, papan suara Harakat, dan kanvas latihan menulis.',
        badge: '28 Huruf',
      },
      speaking: {
        title: 'Latihan Berbicara',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Bicara bahasa Arab dengan Noor AI. Pengenalan suara, analisis kesalahan otomatis, dan latihan pengucapan.',
        badge: 'Mikrofon Interaktif',
      },
      live_arabic: {
        title: 'Bahasa Arab Langsung',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Teman percakapan real-time. Kontrol: Ulangi, Lebih lambat, Permudah, Jelaskan, Terjemahkan, Koreksi saya, Uji saya.',
        badge: 'Sesi Langsung',
      },
      listening: {
        title: 'Latihan Mendengarkan',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Diskriminasi bunyi huruf yang mirip, melengkapi kata yang hilang, pemahaman kalimat, dan memori akustik.',
        badge: 'Telinga Akustik',
      },
      reading: {
        title: 'Akademi Membaca',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Teks bertingkat (Level 1 sampai 4). Nyalakan/matikan harakat (Tashkeel) dan lihat akar kata triliteral.',
        badge: 'Kontrol Harakat',
      },
      vocabulary: {
        title: 'Kosakata & Kartu Kilas',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Bank kosakata berbasis akar kata dengan audio & bentuk jamak, dipadukan dengan kartu pengulangan berkala.',
        badge: 'Sistem Akar',
      },
      iq_memory: {
        title: 'IQ Arab & Memori',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Deduksi linguistik: pola akar (Wazan), teka-teki kata, dan latihan ingatan sekuensial.',
        badge: 'Lab Kognitif',
      },
      test: {
        title: 'Tes Diagnostik',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Penilaian komprehensif meliputi Huruf, Fonetik, Kosakata, Nahwu, dan Sharaf dengan laporan tingkat kemampuan.',
        badge: 'Standar CEFR',
      },
      teacher: {
        title: 'Guru AI Pribadi',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Tutor khusus yang memahami kelemahan Anda. Penjelasan mendalam untuk Nahwu, Sharaf, dan kaidah bahasa.',
        badge: 'Tutor Adaptif',
      },
      progress: {
        title: 'Penguasaan & Kemajuan',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Analisis belajar nyata: huruf yang dikuasai dari 28, tingkat kompetensi membaca, berbicara, dan mendengar.',
        badge: 'Statistik Nyata',
      },
    },

    listen: 'Dengarkan',
    speak: 'Bicara',
    stop: 'Berhenti',
    recording: 'Mendengarkan...',
    check: 'Periksa Jawaban',
    next: 'Selanjutnya',
    previous: 'Sebelumnya',
    restart: 'Mulai Ulang',
    practice: 'Latihan',
    explain: 'Jelaskan',
    translate: 'Terjemahkan',
    slowDown: 'Lebih Lambat',
    repeat: 'Ulangi',
    correctMe: 'Koreksi Saya',
    testMe: 'Uji Saya',
    askTeacher: 'Tanya Guru',
    send: 'Kirim',
    clear: 'Hapus',
    score: 'Skor',
    accuracy: 'Akurasi',
    flipCard: 'Balik Kartu',
    mastered: 'Dikuasai',
    needsReview: 'Perlu Diulang',
    tashkeelOn: 'Harakat Aktif',
    tashkeelOff: 'Harakat Nonaktif',
    rootWord: 'Akar Kata',
    grammarTip: 'Kaidah Tata Bahasa',

    onboardingIntroTitle: 'Selamat Datang di Akademi Bahasa Arab Noor',
    onboardingIntroSub: 'Lingkungan otentik untuk mempelajari bahasa Arab klasik dan modern.',
    onboardingPreparing: 'Menyiapkan kurikulum gratis seumur hidup...',
    onboardingFreeRevealTitle: '100% Gratis Seumur Hidup',
    onboardingFreeRevealDesc: 'Tanpa langganan, tanpa biaya tersembunyi, dan tanpa iklan. Didedikasikan untuk para pencari ilmu.',
    onboardingTermsTitle: 'Kesepakatan Edukatif & Transparansi',
    onboardingTermsDesc: 'Dibangun dengan ketelitian fonetik, makhraj anatomis, dan latihan percakapan didukung AI.',
    onboardingNoticeTitle: 'Pemberitahuan Pra-Rilis',
    onboardingNoticeDesc: 'Peningkatan berkelanjutan dihadirkan langsung dalam perjalanan belajar Anda.',
    onboardingAgreeButton: 'Saya Setuju & Masuk Akademi',
    onboardingStartButton: 'Mulai Belajar Gratis',
  },

  de: {
    academyTitle: 'Noor Arabisch-Akademie',
    lifetimeFree: 'Lebenslang Kostenlos',
    curriculum: 'Lehrplan',
    hub: 'Zentrum',
    termsAndNotice: 'Bedingungen & Hinweis',
    backToAcademy: 'Zurück zur Arabisch-Akademie',
    enterModule: 'Modul starten',

    heroBadge: 'Umfassende Arabisch-Lernumgebung',
    heroSubBadge: 'Reines klassisches & modernes Arabisch',
    heroTitle: 'Meistern Sie Arabisch mit Noor KI',
    heroDesc:
      'Eine authentische, ablenkungsfreie Umgebung für echten Spracherwerb. Lernen Sie Buchstaben mit anatomischer Artikulation (Makhārij), sprechen Sie live mit KI-Korrekturen und bauen Sie einen fundierten Wortschatz auf.',
    lettersMastered: 'Gemeisterte Buchstaben',
    arabicIq: 'Arabisch IQ',
    readingLevel: 'Lesestufe',

    levelBeginner: 'Anfänger',
    levelElementary: 'Grundstufe',
    levelIntermediate: 'Mittelstufe',
    levelAdvanced: 'Fortgeschritten',

    modules: {
      alphabet: {
        title: 'Alphabet-Labor',
        arabicTitle: 'مُخْتَبَرُ الحُرُوف',
        description: '28 Buchstaben, Artikulationspunkte (Makhārij), Positionsformen, Harakat-Soundboard & Schreibübungen.',
        badge: '28 Buchstaben',
      },
      speaking: {
        title: 'Sprechpraxis',
        arabicTitle: 'مُمَارَسَةُ النُّطْق',
        description: 'Sprechen Sie mit Noor KI auf Arabisch. Spracherkennung, automatische Fehleranalyse und Ausspracheübungen.',
        badge: 'Interaktives Mikrofon',
      },
      live_arabic: {
        title: 'Live-Arabisch',
        arabicTitle: 'العَرَبِيَّةُ المُبَاشِرَة',
        description: 'Echtzeit-Gesprächspartner: Wiederholen, Verlangsamen, Vereinfachen, Erklären, Übersetzen, Korrigieren.',
        badge: 'Live-Sitzung',
      },
      listening: {
        title: 'Hörübungen',
        arabicTitle: 'تَدْرِيبَاتُ الاسْتِمَاع',
        description: 'Lautunterscheidung ähnlicher Buchstaben, fehlende Wörter, Satzverständnis und akustisches Gedächtnis.',
        badge: 'Akustisches Ohr',
      },
      reading: {
        title: 'Lese-Akademie',
        arabicTitle: 'أَكَادِيمِيَّةُ القِرَاءَة',
        description: 'Gestufte Lesetexte (Stufen 1 bis 4). Vokalisierung (Tashkeel) ein/ausschalten und dreiradikalige Wortstämme analysieren.',
        badge: 'Vokal-Schalter',
      },
      vocabulary: {
        title: 'Wortschatz & Karteikarten',
        arabicTitle: 'المُفْرَدَاتُ وَالبِطَاقَات',
        description: 'Stammbasierte Wortschatzdatenbank mit Audio & Pluralen, kombiniert mit Karteikarten für zeitversetztes Wiederholen.',
        badge: 'Stammsystem',
      },
      iq_memory: {
        title: 'Arabisch IQ & Gedächtnis',
        arabicTitle: 'الذَّكَاءُ وَالذَّاكِرَة',
        description: 'Linguistische Logik: Stammformen (Wazn), Worträtsel und sequenzielle Gedächtnisförderung.',
        badge: 'Kognitives Labor',
      },
      test: {
        title: 'Diagnosetest',
        arabicTitle: 'الاِخْتِبَارُ التَّشْخِيصِيّ',
        description: 'Umfassende Bewertung über Alphabet, Phonetik, Wortschatz, Grammatik und Morphologie mit Niveaubericht.',
        badge: 'CEFR-Benchmark',
      },
      teacher: {
        title: 'Persönlicher KI-Lehrer',
        arabicTitle: 'المُعَلِّمُ الشَّخْصِيّ',
        description: 'Ihr engagierter Arabisch-Tutor, der Ihre Schwachstellen kennt. Vertiefte Erklärungen zu Grammatik (Naḥw) und Morphologie (Ṣarf).',
        badge: 'Adaptiver Tutor',
      },
      progress: {
        title: 'Meisterschaft & Fortschritt',
        arabicTitle: 'سِجِلُّ التَّقَدُّم',
        description: 'Echte Lernstatistiken: gemeisterte Buchstaben von 28, Kompetenzstufen in Lesen, Sprechen und Hören.',
        badge: 'Echte Statistiken',
      },
    },

    listen: 'Anhören',
    speak: 'Sprechen',
    stop: 'Stoppen',
    recording: 'Zuhören...',
    check: 'Antwort prüfen',
    next: 'Weiter',
    previous: 'Zurück',
    restart: 'Neustart',
    practice: 'Üben',
    explain: 'Erklären',
    translate: 'Übersetzen',
    slowDown: 'Langsamer',
    repeat: 'Wiederholen',
    correctMe: 'Korrigiere mich',
    testMe: 'Teste mich',
    askTeacher: 'Lehrer fragen',
    send: 'Senden',
    clear: 'Löschen',
    score: 'Ergebnis',
    accuracy: 'Genauigkeit',
    flipCard: 'Karte umdrehen',
    mastered: 'Gemeistert',
    needsReview: 'Wiederholen',
    tashkeelOn: 'Vokale (Tashkeel) An',
    tashkeelOff: 'Vokale (Tashkeel) Aus',
    rootWord: 'Wortstamm',
    grammarTip: 'Grammatik-Tipp',

    onboardingIntroTitle: 'Willkommen bei der Noor Arabisch-Akademie',
    onboardingIntroSub: 'Eine authentische Lernumgebung für klassisches und modernes Arabisch.',
    onboardingPreparing: 'Ihr lebenslang kostenloser Lehrplan wird vorbereitet...',
    onboardingFreeRevealTitle: '100% Lebenslang Kostenlos',
    onboardingFreeRevealDesc: 'Keine Abonnements, keine Bezahlschranken, keine Werbung. Aufrichtig gewidmet für Lernende der arabischen Sprache.',
    onboardingTermsTitle: 'Pädagogisches Bündnis & Transparenz',
    onboardingTermsDesc: 'Mit phonetischer Genauigkeit, anatomischen Lautstellen und KI-gestützter Sprachpraxis.',
    onboardingNoticeTitle: 'Vorab-Veröffentlichungshinweis',
    onboardingNoticeDesc: 'Kontinuierliche Verbesserungen begleiten Ihre Lernreise.',
    onboardingAgreeButton: 'Ich stimme zu & Starte Akademie',
    onboardingStartButton: 'Kostenlos starten',
  },
};

export function getStudyTranslations(langCode?: string): StudyTranslations {
  const code = getLanguageCode(langCode);
  return STUDY_TRANSLATIONS[code] || STUDY_TRANSLATIONS.en;
}

/**
 * Custom hook that listens to both props and the global 'app_language_changed' event.
 * Guarantees that changing language in Settings updates the Study views instantly!
 */
export function useStudyLanguage(propLang?: string): SupportedLanguageCode {
  const [currentLang, setCurrentLang] = useState<SupportedLanguageCode>(() => {
    if (propLang) return getLanguageCode(propLang);
    return getGlobalLanguage();
  });

  useEffect(() => {
    if (propLang) {
      setCurrentLang(getLanguageCode(propLang));
    }
  }, [propLang]);

  useEffect(() => {
    const handleAppLangChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: SupportedLanguageCode }>;
      if (customEvent.detail?.language) {
        setCurrentLang(getLanguageCode(customEvent.detail.language));
      } else {
        setCurrentLang(getGlobalLanguage());
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'noor_app_language' && event.newValue) {
        setCurrentLang(getLanguageCode(event.newValue));
      }
    };

    window.addEventListener('app_language_changed', handleAppLangChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('app_language_changed', handleAppLangChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return currentLang;
}
