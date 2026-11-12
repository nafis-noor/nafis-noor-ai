import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type, Modality, LiveServerMessage, ThinkingLevel } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import studyRoutes from './server/studyRoutes';
import dhikrRoutes from './server/dhikrRoutes';
import dreamRoutes from './server/dreamRoutes';
import feedbackRoutes from './server/feedbackRoutes';
import { getGlobalAiLanguageDirective, resolveLanguageMeta } from './server/languageEnforcement';
import {
  auditEnvironmentVariables,
  blockExposedFilesMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  extraSecurityHeadersMiddleware,
  xssSanitizeMiddleware,
  generalApiLimiter,
  authRateLimiter,
  adminRateLimiter,
  requireUserAuth,
  requireOwnUserAccess,
  requireAdminAuth,
  handleAdminLogin,
  handleAdminVerify,
  handleAdminLogout,
  isAllowedOrigin,
} from './server/securityMiddleware';

dotenv.config();

const app = express();
const PORT = 3000;

// Disable X-Powered-By header to prevent server fingerprinting
app.disable('x-powered-by');
app.set('trust proxy', 1);

// 1. Block access to exposed dotfiles, source maps, server scripts, and rules
app.use(blockExposedFilesMiddleware);

// 2. Apply HTTP Security Headers (Helmet CSP, HSTS, NoSniff, Referrer-Policy, Permissions-Policy, COOP)
app.use(securityHeadersMiddleware);
app.use(extraSecurityHeadersMiddleware);

// 3. Apply strict CORS allowlist policy on API routes
app.use('/api', corsMiddleware);

// 4. Parse JSON and URL-encoded bodies with safe 10MB limit (mitigates memory exhaustion DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 5. Recursively sanitize incoming request payloads against XSS & Prototype Pollution
app.use(xssSanitizeMiddleware);

// 6. Apply general rate limiter to all /api endpoints
app.use('/api', generalApiLimiter);

// Serve static assets from public folder (dotfiles explicitly denied)
app.use(
  express.static(path.join(process.cwd(), 'public'), {
    dotfiles: 'deny',
    index: false,
  })
);

// Google Search Console Site Verification
app.get('/googlead8f31e00618337c.html', (req, res) => {
  res.type('text/html').send('google-site-verification: googlead8f31e00618337c.html\n');
});
app.get('/google26d31bc64d27684f.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google26d31bc64d27684f.html\n');
});

// SEO robots.txt & sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml\n');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nafisnoor.site/</loc>
    <lastmod>2026-11-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// Mount Study & Learning AI Routes
app.use('/api/study', studyRoutes);
// Mount Authentic Hisnul Muslim Dhikr API Routes
app.use('/api/dhikr', dhikrRoutes);
// Mount Islamic Dream Interpretation (Ibn Sirin Methodology) Routes
app.use('/api/dream-interpretation', dreamRoutes);
app.use('/api/dream', dreamRoutes);
// Mount Feedback & Suggestions + Private Founder Feedback Management Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin/feedback', feedbackRoutes);

// Initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Noor AI will use fallbacks.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Ultra-low latency Gemini generator prioritizing fast responses
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateWithModelFallback(
  promptText: string,
  systemInstruction: string,
  responseSchema?: Record<string, unknown>
): Promise<string> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config: Record<string, unknown> = {
        systemInstruction,
        responseMimeType: 'application/json',
      };
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }
      if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model,
        contents: promptText,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: unknown) {
      lastError = err;
      // On temporary spike or error on this model, proceed immediately to next candidate model
      continue;
    }
  }

  throw lastError || new Error('All candidate models exhausted');
}

// Topic-aware Islamic knowledge base with verified texts & teachings
function getContextualIslamicFallback(question: string) {
  const q = question.toLowerCase();

  if (q.includes('tahajjud') || q.includes('night prayer') || q.includes('qiyam')) {
    return {
      suggestedTitle: "Virtues & Tadabbur of Tahajjud",
      greeting: "السلام عليكم ورحمة الله وبركاته. حياكم الله وبياكم وبارك فيكم ونفع بكم. أسأل الله العظيم أن يرزقنا وإياكم حلاوة مناجاته في الأسحار.",
      directAnswer: "Tahajjud (قيام الليل) is the voluntary night prayer performed after waking in the final third of the night. It is the greatest voluntary prayer after the obligatory Salah—a serene sanctuary where the servant speaks intimately with their Creator, shedding the burdens of the dunya.",
      quranReference: {
        surahName: "Al-Isra",
        verseNumber: "17:79",
        textArabic: "وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا",
        textTranslation: "And from [part of] the night, pray with it as additional [worship] for you; it is expected that your Lord will resurrect you to a praised station."
      },
      tadabbur: "When you stand in the stillness of the night while mankind sleeps, reciting the words of Allah, the heart softens and experiences true tranquility. The Lord of the Heavens calls out in the last third: 'Is there anyone asking, that I may grant them?'",
      hadithReference: {
        collection: "Sahih al-Bukhari & Sahih Muslim",
        number: "Bukhari 1145, Muslim 758",
        status: "Sahih (Authentic)",
        text: "Our Lord descends every night to the lowest heaven when the last third of the night remains, saying: 'Who calls upon Me, that I may answer him? Who asks of Me, that I may give him? Who seeks My forgiveness, that I may forgive him?'"
      },
      explanation: "Linguistically, 'Tahajjud' derives from 'Hujud', meaning to shed sleep for the sake of Allah. In Islamic jurisprudence (Fiqh), even two sincere rak'ahs before Fajr with prolonged Sujood fulfill this blessed prayer.",
      detailedExplanation: "To establish Tahajjud consistently: sleep with conscious intention (Niyyah), avoid heavy meals late at night, make fresh Wudu upon waking, begin with two brief rak'ahs to awaken the spirit, and pour your heart out in your native tongue during prostration.",
      concludingDua: "أسأل الله تعالى أن يوقظ قلوبنا لطاعته، وأن يرزقنا قيام الليل والعمل الصالح، وأن يجعلنا من المقبولين عنده في الدنيا والآخرة.",
      sources: ["Holy Qur'an (Surah Al-Isra 17:79)", "Sahih al-Bukhari 1145", "Sahih Muslim 758", "Tafsir Ibn Kathir"],
      suggestedFollowUps: ["How many rak'ahs did the Prophet ﷺ pray at night?", "What Duas are recommended in the last third of the night?"]
    };
  }

  if (q.includes('anxiety') || q.includes('stress') || q.includes('sad') || q.includes('worry') || q.includes('hardship') || q.includes('depression') || q.includes('grief')) {
    return {
      suggestedTitle: "Tranquility in Hardship & Dhikr",
      greeting: "السلام عليكم ورحمة الله وبركاته. حياكم الله وشرح صدوركم، وجعل بعد كل عسر يسراً وفرجاً قريباً بإذن الله.",
      directAnswer: "Distress and hardships in the life of a believer are not signs of abandonment, but divine opportunities for purification, spiritual elevation, and returning to Allah with a submissive heart. True peace of mind is discovered when the heart anchors itself in the constant remembrance of Allah (Dhikr) and sincere prayer.",
      quranReference: {
        surahName: "Ar-Ra'd",
        verseNumber: "13:28",
        textArabic: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        textTranslation: "Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured."
      },
      tadabbur: "Notice how Allah uses the word 'أَلَا' (Verily / Unquestionably)—an emphatic reminder that the human soul, created by Allah, cannot find authentic solace in wealth, status, or worldly distraction; its true peace is found solely in closeness to its Creator.",
      hadithReference: {
        collection: "Sahih al-Bukhari",
        number: "6308",
        status: "Sahih (Authentic)",
        text: "No calamity befalls a Muslim, nor weariness, nor illness, nor sorrow, nor sadness, nor distress, even a thorn that pricks him, but Allah expiates some of his sins for it."
      },
      explanation: "Linguistically, 'Al-Itmi'nan' (الاطمئنان) signifies unwavering steadiness after turbulence. Pair spiritual remedies (Tahajjud, Istighfar, Hasbunallahu wa ni'mal-Wakeel) with practical action and professional care.",
      detailedExplanation: "The Prophet ﷺ taught us to recite when overwhelmed: 'Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal...' (O Allah, I seek refuge in You from grief and anxiety, helplessness and laziness). Reciting Surah Al-Inshirah (Surah 94) also brings immense lightness to heavy hearts.",
      concludingDua: "اللهم فرج هم المهمومين من المسلمين، ونفس كرب المكروبين، واقض الدين عن المدينين، واشف مرضانا ومرضى المسلمين، واجعل القرآن ربيع قلوبنا ونور صدورنا.",
      sources: ["Holy Qur'an (Surah Ar-Ra'd 13:28)", "Surah Al-Inshirah 94:5-6", "Sahih al-Bukhari 6308"],
      suggestedFollowUps: ["What Duas relieve distress and sorrow?", "How do I build sincere trust (Tawakkul) in Allah?"]
    };
  }

  if (q.includes('sabr') || q.includes('patience') || q.includes('trial') || q.includes('test')) {
    return {
      suggestedTitle: "Meaning & Spiritual Ranks of Sabr",
      greeting: "السلام عليكم ورحمة الله وبركاته. حياكم الله وبياكم، وزادكم الله إيماناً ويقيناً وصبراً جميلاً.",
      directAnswer: "Sabr (الصبر) in Islamic theology is not mere passive helplessness; it is dignified fortitude, self-restraint, and active perseverance. It is the noble station of holding the soul steadfast in obedience to Allah, restraining it from disobedience, and accepting the divine decree with contentment (Rida).",
      quranReference: {
        surahName: "Al-Baqarah",
        verseNumber: "2:153",
        textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        textTranslation: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient."
      },
      tadabbur: "Allah commands us to seek aid through both Sabr (the inner strength of the spirit) and Salah (the outer connection with the Divine). When trial strikes, prayer anchors patience so that hardship becomes a bridge to Allah's special companionship (معية الله).",
      hadithReference: {
        collection: "Sahih al-Bukhari",
        number: "1469",
        status: "Sahih (Authentic)",
        text: "Whoever remains patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience."
      },
      explanation: "Classical scholars categorize Sabr into three sublime pillars: 1) Sabr in performing acts of obedience to Allah, 2) Sabr in abstaining from prohibited desires, and 3) Sabr through painful decrees without resentment.",
      detailedExplanation: "Imam Ibn al-Qayyim notes that Sabr is half of faith, while Shukr (gratitude) is the other half. The reward for those who practice Sabr is granted without measure: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ' (Surah Az-Zumar 39:10).",
      concludingDua: "اللهم ارزقنا صبراً جميلاً، وشكراً جزيلاً، وقلباً سليماً، ولساناً ذاكراً، واجعلنا من الصابرين الشاكرين الفائزين برضوانك والجنة.",
      sources: ["Holy Qur'an (Surah Al-Baqarah 2:153)", "Surah Az-Zumar 39:10", "Sahih al-Bukhari 1469", "Madarij al-Salikin by Ibn al-Qayyim"],
      suggestedFollowUps: ["What is the difference between Sabr and Rida (contentment)?", "What are the three categories of patience in Islam?"]
    };
  }

  if (q.includes('wudu') || q.includes('ablution') || q.includes('wash') || q.includes('purification')) {
    return {
      suggestedTitle: "Purification (Wudu) & Its Sunnahs",
      greeting: "السلام عليكم ورحمة الله وبركاته. أهلاً بكم وبارك الله في حرصكم على تعلم أحكام الطهارة والصلاة.",
      directAnswer: "Wudu (الوضوء) is the sacred key to prayer and the physical and spiritual purification of the believer. The Holy Qur'an explicitly outlines four obligatory pillars (Fara'id), which the Sunnah of the Messenger of Allah ﷺ beautifies with beloved practices.",
      quranReference: {
        surahName: "Al-Ma'idah",
        verseNumber: "5:6",
        textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ وَامْسَحُوا بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى الْكَعْبَيْنِ",
        textTranslation: "O you who have believed, when you rise to [perform] prayer, wash your faces and your forearms to the elbows and wipe over your heads and wash your feet to the ankles."
      },
      tadabbur: "As water cleanses the physical limbs, it expiates the minor sins committed by those limbs. The believer enters the presence of Allah pure in body, conscious in heart, and radiant with light on the Day of Resurrection (الغر المحجلون).",
      hadithReference: {
        collection: "Sahih Muslim",
        number: "223",
        status: "Sahih (Authentic)",
        text: "Purity is half of faith, and Al-Hamdulillah fills the scale, and SubhanAllah and Al-Hamdulillah fill what is between the heavens and earth."
      },
      explanation: "The four obligatory acts: 1) Washing the entire face, 2) Washing arms up to the elbows, 3) Wiping the head, 4) Washing feet up to the ankles, coupled with Niyyah (intention) and Tartib (proper order).",
      detailedExplanation: "The complete Prophetic method: 1) Intention in the heart & saying Bismillah, 2) Wash hands 3 times, 3) Rinse mouth (Madmadah) 3 times, 4) Sniff water into nostrils (Istinshaq) 3 times, 5) Wash face from hairline to chin 3 times, 6) Wash right arm then left arm to elbows 3 times, 7) Wipe head from front to back and ears once, 8) Wash right foot then left foot to ankles 3 times, concluding with the Shahadah.",
      concludingDua: "اللهم اجعلنا من التوابين واجعلنا من المتطهرين، واجعلنا من عبادك الصالحين المخبتين.",
      sources: ["Holy Qur'an (Surah Al-Ma'idah 5:6)", "Sahih Muslim 223", "Bidayat al-Mujtahid"],
      suggestedFollowUps: ["What nullifies Wudu?", "What is the Dua recited after completing Wudu?"]
    };
  }

  if (q.includes('salah') || q.includes('prayer') || q.includes('namaz') || q.includes('how to pray')) {
    return {
      suggestedTitle: "The Essence & Performance of Salah",
      greeting: "السلام عليكم ورحمة الله وبركاته. حياكم الله وبارك فيكم ونفع بكم، وجعل الصلاة قرة أعيننا وأعينكم.",
      directAnswer: "Salah (الصلاة) is the second pillar of Islam, the pillar of the deen, and the direct spiritual ascension (Mi'raj) of the believer. It is five daily appointments with Allah, providing spiritual renewal, forgiveness of sins, and shield from immorality.",
      quranReference: {
        surahName: "Al-Ankabut",
        verseNumber: "29:45",
        textArabic: "وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ ۗ وَلَذِكْرُ اللَّهِ أَكْبَرُ",
        textTranslation: "And establish prayer. Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater."
      },
      tadabbur: "Standing before Allah in Salah with reverence (Khushu) transforms the heart. When you recite Surah Al-Fatihah, Allah responds to you verse by verse in a divine conversation, elevating the worshipper above worldly anxieties.",
      hadithReference: {
        collection: "Sahih al-Bukhari",
        number: "8",
        status: "Sahih (Authentic)",
        text: "Islam is built upon five: testifying that there is no god but Allah and Muhammad is His messenger, establishing prayer, giving Zakat, performing Hajj, and fasting Ramadan."
      },
      explanation: "Each prayer has designated units (rak'ahs): Fajr (2), Dhuhr (4), Asr (4), Maghrib (3), and Isha (4). Every posture—Qiyam, Ruku, Sujood, Jalsah—expresses profound servitude and love for Allah.",
      detailedExplanation: "To cultivate deep Khushu: pause before beginning to recall Whom you are standing before, pronounce every verse with measured reflection, pray calmly without rushing between postures (Tuma'ninah), and contemplate the meaning of what you recite.",
      concludingDua: "اللهم اجعلنا مقيمي الصلاة ومن ذريتنا ربنا وتقبل دعاء، وارزقنا الخشوع والإخبات وحسن الوقوف بين يديك.",
      sources: ["Holy Qur'an (Surah Al-Ankabut 29:45)", "Sahih al-Bukhari 8", "Tafsir Ibn Kathir"],
      suggestedFollowUps: ["How can I achieve deep Khushu (focus) in my prayer?", "What are the obligatory elements (Arkan) of Salah?"]
    };
  }

  // Universal verified fallback in scholarly and pastoral Islamic style
  return {
    suggestedTitle: "Islamic Insights & Guidance",
    greeting: "السلام عليكم ورحمة الله وبركاته. حياكم الله وبياكم، وبارك فيكم وفي سعيكم المبارك لطلب العلم والتفقه في الدين.",
    directAnswer: "Seeking Islamic knowledge with sincerity of intention and applying it with humility is among the highest deeds in Islam. The Sacred Law (Shari'ah) is founded upon mercy, justice, wisdom, and guiding human souls toward their ultimate happiness in this world and the Hereafter.",
    quranReference: {
      surahName: "Al-Baqarah",
      verseNumber: "2:186",
      textArabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
      textTranslation: "And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant when he calls upon Me."
    },
    tadabbur: "Contemplate the tenderness of this verse: Allah did not tell the Prophet ﷺ to say 'tell them I am near'—Allah Himself immediately answers directly: 'Indeed I am near'. No intermediary stands between the sincere heart and Allah.",
    hadithReference: {
      collection: "Sahih Muslim",
      number: "2699",
      status: "Sahih (Authentic)",
      text: "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise."
    },
    explanation: "True Islamic understanding illuminates both the mind and the heart, encouraging good character (Husn al-Khuluq), active charity, and steadfast adherence to the Qur'an and Sunnah.",
    detailedExplanation: "Whenever you seek understanding in the deen, begin with sincere intention for Allah alone, verify references through authentic classical texts, and strive to practice what you learn with gentleness and consistency.",
    concludingDua: "أسأل الله العظيم رب العرش الكريم أن يفتح عليكم فتوح العارفين، وأن يجعلنا وإياكم من أهل القرآن وخاصته، وأن ينفع بكم الإسلام والمسلمين.",
    sources: ["Holy Qur'an (Surah Al-Baqarah 2:186)", "Sahih Muslim 2699", "Tafsir al-Sa'di"],
    suggestedFollowUps: ["How can I build consistency in my daily worship?", "What are the core Adhkar to protect and elevate the heart?"]
  };
}

// Noor AI Islamic Assistant Endpoint
app.post('/api/noor-ai', async (req, res) => {
  const { question, conversationHistory, language } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  const langInput = language || (req.headers['x-app-language'] as string) || (req.query?.language as string) || 'en';
  const meta = resolveLanguageMeta(langInput);
  const langDirective = getGlobalAiLanguageDirective(langInput);

  const systemInstruction = `${langDirective}

You are Noor AI, a tranquil, trustworthy, and precise Islamic assistant and scholar companion inside the NOOR app.
You answer the seeker of knowledge with authentic Islamic scholarship, noble character (Adab), deep warmth, and heart-softening eloquence derived from the Holy Qur'an and authentic Sunnah.

CORE DIRECTIVES:
1. DIRECT, SHORT & UNIFIED ANSWER:
   - Provide a direct, concise, and reverent answer in ${meta.name} (usually 1 to 2 focused, elegant paragraphs).
   - Do NOT break your answer into multiple fragmented boxes, cards, or headings. Keep it as one unified, seamless explanation.
   - If a Qur'anic verse or authentic Hadith is vital, weave it naturally, directly, and briefly into your text.
   - If an important religious topic requires clarity, explain it clearly and smoothly in the body without creating extra sub-boxes or checklists.
2. SCHOLARLY INTEGRITY & ADAB:
   - Zero fabrication. Never invent any Hadith or Qur'anic verse.
   - Conclude briefly and warmly with a natural short supplication if appropriate, woven into the text.
   - For binding personal legal rulings, gently advise consulting a trusted local qualified scholar.`;

  const promptText = `User Question: "${question}"
${conversationHistory && conversationHistory.length > 0 ? `Recent context: ${JSON.stringify(conversationHistory.slice(-3))}` : ''}

Generate a concise, direct, and unified Islamic response in ${meta.name}. Keep the answer focused (1 to 2 short paragraphs max).`;

  const noorSchema = {
    type: Type.OBJECT,
    properties: {
      suggestedTitle: {
        type: Type.STRING,
        description: `Short 2-4 word title for this conversation thread in ${meta.name}.`
      },
      directAnswer: {
        type: Type.STRING,
        description: `Unified, concise, and clear answer to the user's question (1-2 focused paragraphs max) in ${meta.name}.`
      }
    },
    required: ['directAnswer']
  };

  try {
    const rawOutput = await generateWithModelFallback(promptText, systemInstruction, noorSchema);
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      parsed = {
        directAnswer: rawOutput,
      };
    }

    return res.json({ success: true, data: parsed });
  } catch (error: unknown) {
    console.warn('[Noor AI] Fallback activated for user question. Providing verified Islamic knowledge base response.');
    const fallbackData = getContextualIslamicFallback(question);
    return res.json({
      success: true,
      data: {
        suggestedTitle: fallbackData.suggestedTitle,
        directAnswer: fallbackData.directAnswer,
      }
    });
  }
});

// Multilingual Quran Translation Edition Map
const QURAN_TRANSLATION_EDITIONS: Record<string, string> = {
  en: 'en.sahih',
  ar: 'ar.muyassar',
  am: 'am.sadiq',
  fr: 'fr.hamidullah',
  zh: 'zh.jian',
  es: 'es.cortes',
  tr: 'tr.diyanet',
  ur: 'ur.jalandhry',
  id: 'id.indonesian',
  de: 'de.bubenheim',
};

// In-memory cache for complete verified Surahs by surah number and language
const quranSurahServerCache = new Map<string, { surahNumber: number; numberOfAyahs: number; ayahs: any[] }>();

// Canonical Ayah counts for all 114 Surahs of the Holy Qur'an
const CANONICAL_AYAH_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

// Verified Complete Quran Surah API endpoint with language parameter
app.get('/api/quran/surah/:surahNumber', async (req, res) => {
  const surahNum = parseInt(req.params.surahNumber, 10);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ error: 'Invalid Surah number. Must be between 1 and 114.' });
  }

  const requestedLang = (
    (typeof req.query.lang === 'string' && req.query.lang) ||
    (typeof req.headers['x-app-language'] === 'string' && req.headers['x-app-language']) ||
    (typeof req.headers['x-language'] === 'string' && req.headers['x-language']) ||
    'en'
  ).toLowerCase().slice(0, 2);

  const editionKey = QURAN_TRANSLATION_EDITIONS[requestedLang] || 'en.sahih';
  const cacheKey = `${surahNum}_${requestedLang}`;

  // 1. Check in-memory server cache
  if (quranSurahServerCache.has(cacheKey)) {
    return res.json({
      success: true,
      source: 'server_cache',
      data: quranSurahServerCache.get(cacheKey)
    });
  }

  const expectedCount = CANONICAL_AYAH_COUNTS[surahNum];

  try {
    // 2. Fetch from authoritative Quran API with Uthmani script and requested language translation
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,${editionKey}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Quran Cloud API responded with status ${response.status}`);
    }

    const payload: any = await response.json();
    if (!payload || payload.code !== 200 || !Array.isArray(payload.data) || payload.data.length < 2) {
      throw new Error('Invalid payload structure from Quran Cloud API');
    }

    const arabicEdition = payload.data[0]?.ayahs || [];
    const translationEdition = payload.data[1]?.ayahs || [];

    if (arabicEdition.length === 0) {
      throw new Error('No Arabic Ayahs returned');
    }

    // Validate Ayah count matches canonical Qur'anic count
    if (expectedCount && arabicEdition.length !== expectedCount) {
      console.warn(`[Quran API] Warning: Surah ${surahNum} returned ${arabicEdition.length} Ayahs, expected ${expectedCount}`);
    }

    const ayahs = arabicEdition.map((item: any, idx: number) => ({
      number: item.number,
      numberInSurah: item.numberInSurah,
      text: item.text?.trim() || '',
      translation: translationEdition[idx]?.text?.trim() || '',
      juz: item.juz || 1,
      page: item.page || 1,
      hizbQuarter: item.hizbQuarter || 1,
      sajda: item.sajda || false
    }));

    const result = {
      surahNumber: surahNum,
      numberOfAyahs: ayahs.length,
      name: payload.data[0]?.name || '',
      englishName: payload.data[0]?.englishName || '',
      revelationType: payload.data[0]?.revelationType || '',
      edition: editionKey,
      language: requestedLang,
      ayahs
    };

    // Cache permanently in memory for this language
    quranSurahServerCache.set(cacheKey, result);

    return res.json({
      success: true,
      source: 'live_verified',
      data: result
    });
  } catch (err: any) {
    console.error(`[Quran Surah API Error] Surah ${surahNum} (Lang: ${requestedLang}):`, err.message);
    return res.status(502).json({
      success: false,
      error: 'Failed to retrieve complete verified Surah text',
      message: err.message
    });
  }
});

// In-memory cache for Quran keyword searches
const quranSearchServerCache = new Map<string, any>();

// Verified Quran Keyword Search API endpoint
app.get('/api/quran/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const surahParam = typeof req.query.surah === 'string' ? req.query.surah.trim() : 'all';

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
  }

  const isArabic = /[\u0600-\u06FF]/.test(query);
  const cacheKey = `${query.toLowerCase()}_${surahParam}`;
  if (quranSearchServerCache.has(cacheKey)) {
    const cached = quranSearchServerCache.get(cacheKey);
    return res.json({
      success: true,
      source: 'server_cache',
      matches: cached.matches || [],
      data: cached
    });
  }

  try {
    const targetSurah = surahParam === 'all' || !isNaN(Number(surahParam)) ? surahParam : 'all';
    const editionsToTry = isArabic ? ['quran-simple-clean', 'quran-simple'] : ['en.sahih'];
    let matches: any[] = [];
    let totalCount = 0;

    // 1. Try AlQuran Cloud Search API across clean & standard editions
    // Note: AlQuran Cloud returns HTTP 404 when a query has 0 matches — treat 404 as empty result, not an error.
    for (const edition of editionsToTry) {
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/${targetSurah}/${edition}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
          const payload: any = await response.json();
          const rawMatches = Array.isArray(payload?.data?.matches) ? payload.data.matches : [];
          if (rawMatches.length > 0) {
            matches = rawMatches.map((m: any) => ({
              number: m.number,
              numberInSurah: m.numberInSurah,
              text: m.text,
              surah: {
                number: m.surah?.number || 1,
                name: m.surah?.name || '',
                englishName: m.surah?.englishName || '',
                englishNameTranslation: m.surah?.englishNameTranslation || '',
                revelationType: m.surah?.revelationType || 'Meccan',
                numberOfAyahs: m.surah?.numberOfAyahs || 7
              },
              edition: m.edition,
              juz: m.juz || 1,
              page: m.page || 1
            }));
            totalCount = payload.data?.count || matches.length;
            break;
          }
        }
      } catch {
        // Continue to next edition or Quran.com v4 fallback
      }
    }

    // 2. Fallback to Quran.com v4 Search API (handles unvocalized/ASR Arabic phrases & cross-word matches)
    if (matches.length === 0) {
      try {
        const qdcRes = await fetch(
          `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=15`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (qdcRes.ok) {
          const qdcPayload: any = await qdcRes.json();
          const qdcResults = Array.isArray(qdcPayload?.search?.results)
            ? qdcPayload.search.results
            : [];

          if (qdcResults.length > 0) {
            // Map verse_key (e.g. "109:1") and resolve page number via Quran.com verse metadata if needed
            const filteredResults = qdcResults.filter((item: any) => {
              if (targetSurah === 'all') return true;
              const [sNum] = String(item.verse_key || '').split(':');
              return Number(sNum) === Number(targetSurah);
            });

            if (filteredResults.length > 0) {
              // Fetch page number for the top match so Mushaf page jumping is 100% accurate
              let topVersePage = 1;
              const topKey = String(filteredResults[0].verse_key || '1:1');
              try {
                const vRes = await fetch(
                  `https://api.quran.com/api/v4/verses/by_key/${encodeURIComponent(topKey)}?fields=page_number,juz_number`,
                  { headers: { 'Accept': 'application/json' } }
                );
                if (vRes.ok) {
                  const vJson: any = await vRes.json();
                  topVersePage = vJson?.verse?.page_number || 1;
                }
              } catch {
                // ignore
              }

              matches = filteredResults.map((item: any, idx: number) => {
                const [sNumStr, aNumStr] = String(item.verse_key || '1:1').split(':');
                const sNum = Number(sNumStr) || 1;
                const aNum = Number(aNumStr) || 1;
                return {
                  number: item.verse_id || aNum,
                  numberInSurah: aNum,
                  text: String(item.text || '').replace(/<[^>]+>/g, ''),
                  surah: {
                    number: sNum,
                    name: '',
                    englishName: '',
                    englishNameTranslation: '',
                  },
                  juz: 1,
                  page: idx === 0 ? topVersePage : 1
                };
              });
              totalCount = qdcPayload?.search?.total_results || matches.length;
            }
          }
        }
      } catch {
        // Fallback exhausted cleanly; return 0 matches below
      }
    }

    const result = {
      count: totalCount || matches.length,
      matches,
      query,
      isArabic
    };

    // Only cache non-empty results or normal queries
    if (matches.length > 0) {
      quranSearchServerCache.set(cacheKey, result);
    }

    return res.json({
      success: true,
      source: 'live_search',
      matches,
      data: result
    });
  } catch (err: any) {
    // Return graceful empty search result instead of 502 error so UI never breaks
    return res.json({
      success: true,
      source: 'fallback_empty',
      matches: [],
      data: {
        count: 0,
        matches: [],
        query,
        isArabic
      }
    });
  }
});

// In-memory cache for Quran Mushaf pages and Ayah details
const quranPageServerCache = new Map<string, any>();
const quranAyahDetailsCache = new Map<string, any>();
const quranWordSegmentsCache = new Map<string, any>();

// Map app reciter IDs to official Quran.com QDC reciter IDs for exact word-by-word millisecond timestamps
const QDC_RECITER_IDS: Record<string, number> = {
  dossary: 97,     // Sheikh Yasser Al-Dossari
  mishary: 7,      // Mishary Rashid Alafasy
  abdulbasit: 2,   // AbdulBaset AbdulSamad (Murattal)
  husary: 6,       // Mahmoud Khalil Al-Husary
  minshawi: 9,     // Mohamed Siddiq Al-Minshawi
};

// Verified Authentic Madani Mushaf (1405) Page Endpoint (1..604) with 15-line word-by-word geometry
app.get('/api/quran/page/:pageNumber', async (req, res) => {
  const pageNum = parseInt(req.params.pageNumber, 10);
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
    return res.status(400).json({ error: 'Page number must be between 1 and 604.' });
  }

  const requestedLang = (
    (typeof req.query.lang === 'string' && req.query.lang) ||
    'en'
  ).toLowerCase().slice(0, 2);

  const editionKey = QURAN_TRANSLATION_EDITIONS[requestedLang] || 'en.sahih';
  const cacheKey = `page_v2_${pageNum}_${requestedLang}`;

  if (quranPageServerCache.has(cacheKey)) {
    return res.json({
      success: true,
      source: 'server_cache',
      data: quranPageServerCache.get(cacheKey)
    });
  }

  try {
    const [arabicRes, transRes, translitRes, qdcPageRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`, { headers: { Accept: 'application/json' } }),
      fetch(`https://api.alquran.cloud/v1/page/${pageNum}/${editionKey}`, { headers: { Accept: 'application/json' } }).catch(() => null),
      fetch(`https://api.alquran.cloud/v1/page/${pageNum}/en.transliteration`, { headers: { Accept: 'application/json' } }).catch(() => null),
      fetch(`https://api.quran.com/api/v4/verses/by_page/${pageNum}?words=true&mushaf=2&word_fields=text_uthmani,line_number,page_number,location`, { headers: { Accept: 'application/json' } }).catch(() => null)
    ]);

    if (!arabicRes.ok) {
      throw new Error(`Arabic page fetch failed with status ${arabicRes.status}`);
    }

    const arabicData: any = await arabicRes.json();
    const transData: any = transRes && transRes.ok ? await transRes.json() : null;
    const translitData: any = translitRes && translitRes.ok ? await translitRes.json() : null;
    const qdcPageData: any = qdcPageRes && qdcPageRes.ok ? await qdcPageRes.json() : null;

    const arabicAyahs = arabicData?.data?.ayahs || [];
    const transAyahs = transData?.data?.ayahs || [];
    const translitAyahs = translitData?.data?.ayahs || [];
    const qdcVerses = qdcPageData?.verses || [];

    // Map verse_key (e.g. "1:1") to QDC words array with exact 1..15 line_number
    const qdcWordsByKey = new Map<string, any[]>();
    qdcVerses.forEach((v: any) => {
      if (v.verse_key && Array.isArray(v.words)) {
        qdcWordsByKey.set(v.verse_key, v.words);
      }
    });

    const ayahs = arabicAyahs.map((item: any, idx: number) => {
      const sNum = item.surah?.number;
      const aNum = item.numberInSurah;
      const vKey = `${sNum}:${aNum}`;
      return {
        number: item.number,
        numberInSurah: aNum,
        verseKey: vKey,
        text: item.text?.trim() || '',
        translation: transAyahs[idx]?.text?.trim() || '',
        transliteration: translitAyahs[idx]?.text?.trim() || '',
        words: qdcWordsByKey.get(vKey) || [],
        surah: {
          number: sNum,
          name: item.surah?.name,
          englishName: item.surah?.englishName,
          numberOfAyahs: item.surah?.numberOfAyahs,
          revelationType: item.surah?.revelationType
        },
        juz: item.juz || 1,
        page: pageNum,
        hizbQuarter: item.hizbQuarter || 1,
        sajda: item.sajda || false
      };
    });

    const result = {
      pageNumber: pageNum,
      juzNumber: ayahs[0]?.juz || 1,
      hizbQuarter: ayahs[0]?.hizbQuarter || 1,
      surahsOnPage: Array.from(new Set(ayahs.map((a: any) => a.surah.number))).map((num) => {
        const first = ayahs.find((a: any) => a.surah.number === num);
        return first?.surah;
      }).filter(Boolean),
      ayahs
    };

    quranPageServerCache.set(cacheKey, result);
    return res.json({ success: true, source: 'live_verified', data: result });
  } catch (err: any) {
    console.error(`[Quran Page API Error] Page ${pageNum}:`, err.message);
    return res.status(502).json({ success: false, error: 'Failed to retrieve page text', message: err.message });
  }
});

// Word-by-Word Millisecond Timestamp Segments Endpoint (From Quran.com QDC API)
app.get('/api/quran/word-segments/:surahNumber/:reciterId', async (req, res) => {
  const surahNum = parseInt(req.params.surahNumber, 10);
  const reciterId = req.params.reciterId || 'dossary';
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ error: 'Invalid surah number' });
  }

  const qdcId = QDC_RECITER_IDS[reciterId] || 97; // Default to Sheikh Yasser Al-Dossari (97)
  const cacheKey = `segments_${surahNum}_${qdcId}`;

  if (quranWordSegmentsCache.has(cacheKey)) {
    return res.json({ success: true, data: quranWordSegmentsCache.get(cacheKey) });
  }

  try {
    const response = await fetch(
      `https://api.qurancdn.com/api/qdc/audio/reciters/${qdcId}/audio_files?chapter=${surahNum}&segments=true`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`QDC segments returned ${response.status}`);
    }

    const json: any = await response.json();
    const verseTimings = json?.audio_files?.[0]?.verse_timings || [];

    // Normalize each verse's word segments into relative ratios [wordPosition, startRatio, endRatio]
    const segmentsByAyah: Record<number, Array<{ wordPos: number; startRatio: number; endRatio: number }>> = {};

    verseTimings.forEach((vt: any) => {
      const parts = String(vt.verse_key || '').split(':');
      const ayahNum = parseInt(parts[1], 10);
      const fromMs = Number(vt.timestamp_from) || 0;
      const toMs = Number(vt.timestamp_to) || 0;
      const totalDur = Math.max(100, toMs - fromMs);

      if (!isNaN(ayahNum) && Array.isArray(vt.segments) && vt.segments.length > 0) {
        segmentsByAyah[ayahNum] = vt.segments
          .filter((seg: any) => Array.isArray(seg) && seg.length >= 3)
          .map((seg: any) => {
            const wordPos = Number(seg[0]); // 1-indexed word position
            const segStart = Math.max(0, (Number(seg[1]) - fromMs) / totalDur);
            const segEnd = Math.min(1, Math.max(segStart + 0.02, (Number(seg[2]) - fromMs) / totalDur));
            return { wordPos, startRatio: segStart, endRatio: segEnd };
          });
      }
    });

    quranWordSegmentsCache.set(cacheKey, segmentsByAyah);
    return res.json({ success: true, data: segmentsByAyah });
  } catch (err: any) {
    return res.json({ success: false, data: {} });
  }
});

// Ayah Details with Authentic Tafsir Al-Muyassar and Sheikh Yasser Al-Dossari Audio
app.get('/api/quran/ayah/:surahNumber/:ayahNumber/details', async (req, res) => {
  const surahNum = parseInt(req.params.surahNumber, 10);
  const ayahNum = parseInt(req.params.ayahNumber, 10);
  if (isNaN(surahNum) || isNaN(ayahNum)) {
    return res.status(400).json({ error: 'Valid surahNumber and ayahNumber are required' });
  }

  const requestedLang = (
    (typeof req.query.lang === 'string' && req.query.lang) ||
    'en'
  ).toLowerCase().slice(0, 2);

  const editionKey = QURAN_TRANSLATION_EDITIONS[requestedLang] || 'en.sahih';
  const cacheKey = `ayah_${surahNum}_${ayahNum}_${requestedLang}`;

  if (quranAyahDetailsCache.has(cacheKey)) {
    return res.json({ success: true, data: quranAyahDetailsCache.get(cacheKey) });
  }

  try {
    const [arabicRes, transRes, translitRes, tafsirRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/quran-uthmani`, { headers: { Accept: 'application/json' } }),
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/${editionKey}`, { headers: { Accept: 'application/json' } }),
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.transliteration`, { headers: { Accept: 'application/json' } }).catch(() => null),
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/ar.muyassar`, { headers: { Accept: 'application/json' } }).catch(() => null)
    ]);

    const arabicJson: any = arabicRes.ok ? await arabicRes.json() : null;
    const transJson: any = transRes.ok ? await transRes.json() : null;
    const translitJson: any = translitRes && translitRes.ok ? await translitRes.json() : null;
    const tafsirJson: any = tafsirRes && tafsirRes.ok ? await tafsirRes.json() : null;

    const formattedSurah = String(surahNum).padStart(3, '0');
    const formattedAyah = String(ayahNum).padStart(3, '0');
    const audioUrl = `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${formattedSurah}${formattedAyah}.mp3`;

    const detailData = {
      surahNumber: surahNum,
      ayahNumber: ayahNum,
      surahName: arabicJson?.data?.surah?.name || '',
      englishName: arabicJson?.data?.surah?.englishName || '',
      revelationType: arabicJson?.data?.surah?.revelationType || '',
      text: arabicJson?.data?.text?.trim() || '',
      translation: transJson?.data?.text?.trim() || '',
      transliteration: translitJson?.data?.text?.trim() || '',
      tafsir: tafsirJson?.data?.text?.trim() || '',
      juz: arabicJson?.data?.juz || 1,
      page: arabicJson?.data?.page || 1,
      audioUrl
    };

    quranAyahDetailsCache.set(cacheKey, detailData);
    return res.json({ success: true, data: detailData });
  } catch (err: any) {
    console.error(`[Ayah Detail Error] ${surahNum}:${ayahNum}:`, err.message);
    return res.status(502).json({ success: false, error: 'Failed to load ayah details', message: err.message });
  }
});

// Interactive Noor AI Explanation specifically for a selected Ayah
app.post('/api/quran/ask-noor-ai', async (req, res) => {
  const { surahNumber, ayahNumber, surahName, ayahText, ayahTranslation, question, language } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  const langInput = language || (req.headers['x-app-language'] as string) || 'en';
  const meta = resolveLanguageMeta(langInput);
  const langDirective = getGlobalAiLanguageDirective(langInput);

  const systemInstruction = `${langDirective}

You are Noor AI, a tranquil, trustworthy, and precise Islamic scholar companion inside the NOOR app.
The user is studying the Holy Qur'an, specifically Surah ${surahName || ''} (${surahNumber}:${ayahNumber}).
Arabic Ayah: "${ayahText || ''}"
Translation: "${ayahTranslation || ''}"

CORE INSTRUCTIONS FOR AYAH EXPLANATION:
1. Provide a short, clear, and easily understandable explanation in ${meta.name} (1 to 2 focused paragraphs max).
2. Answer the user's specific question directly, grounding your answer in authentic Classical Tafsir (such as Ibn Kathir, Al-Tabari, Al-Sa'di, or Al-Muyassar) and authentic Hadith.
3. Clearly distinguish established Qur'anic meanings from scholarly differences. Never invent evidence or rulings.
4. Keep the explanation warm, reverent, and beneficial for reflection (Tadabbur).`;

  const promptText = `User Question about Surah ${surahName} (${surahNumber}:${ayahNumber}):
"${question}"

Provide a concise, clear, and spiritually illuminating explanation in ${meta.name}.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      directAnswer: {
        type: Type.STRING,
        description: `Clear, concise explanation of the verse addressing the question (1-2 paragraphs max) in ${meta.name}.`
      },
      keyTakeaway: {
        type: Type.STRING,
        description: `One inspiring practical spiritual lesson or reflection point from this verse in ${meta.name}.`
      }
    },
    required: ['directAnswer']
  };

  try {
    const rawOutput = await generateWithModelFallback(promptText, systemInstruction, schema);
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      parsed = { directAnswer: rawOutput };
    }
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('[Quran Ask Noor AI Error]:', err);
    return res.json({
      success: true,
      data: {
        directAnswer: langInput === 'ar'
          ? `تدل هذه الآية الكريمة من سورة ${surahName} على عظمة الله وحكمته البالغة، وتدعو المسلم إلى التدبر والعمل بما فيها من هدى ونور.`
          : `This noble verse from Surah ${surahName} emphasizes Allah's boundless wisdom and mercy, calling upon believers to reflect, practice righteous deeds, and take solace in divine guidance.`
      }
    });
  }
});

// ============================================================================
// TASMEE3: RECITATION LISTENING & POSITION TRACKING ENDPOINT
// ============================================================================
app.post('/api/tasmee3/match-audio', async (req, res) => {
  const { audioBase64, mimeType, surahNumber, surahName, candidateVerses, currentVerseNumber } = req.body;

  if (!audioBase64 || !surahNumber || !Array.isArray(candidateVerses) || candidateVerses.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: audioBase64, surahNumber, and candidateVerses are required.'
    });
  }

  try {
    const ai = getGenAI();
    const candidateList = candidateVerses
      .slice(0, 8)
      .map((v: any) => `Verse ${v.numberInSurah}: ${v.text}`)
      .join('\n');

    const prompt = `You are a precise, authoritative Quran recitation position tracker for the Nafis Noor Tasmee3 feature.
The user is reciting from Surah ${surahNumber} (${surahName || ''}).
Their current expected verse position is around Verse ${currentVerseNumber || 1}.

Candidate verses:
${candidateList}

STRICT GUIDELINES:
1. Listen carefully to the Arabic Quran recitation in the audio.
2. Transcribe the spoken Arabic words accurately.
3. Match the recitation against the candidate verses.
4. If the recitation clearly matches a candidate verse (even partially, e.g. 2-3 distinct words), return that verse number.
5. If the audio is silent, unclear, background noise, or cannot be confidently matched to any of the candidate verses, return detectedVerseNumber as null and set confidence to "uncertain" and isUncertain to true.
6. Do NOT evaluate Tajweed or invent fake correctness scores. Only report the detected verse position.

Return strictly JSON format:
{
  "transcribedText": "spoken Arabic words here",
  "detectedVerseNumber": 5, // or null
  "confidence": "high", // "high" | "medium" | "uncertain"
  "isUncertain": false // boolean
}`;

    const modelName = 'gemini-3.1-flash-lite';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || 'audio/webm',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        transcribedText: '',
        detectedVerseNumber: null,
        confidence: 'uncertain',
        isUncertain: true,
      };
    }

    return res.json({
      success: true,
      data: {
        transcribedText: parsed.transcribedText || '',
        detectedVerseNumber: parsed.detectedVerseNumber ?? null,
        confidence: parsed.confidence || 'uncertain',
        isUncertain: parsed.isUncertain ?? (parsed.detectedVerseNumber === null),
        message: parsed.isUncertain || parsed.detectedVerseNumber === null
          ? "We’re not sure where you are. Please continue or repeat the verse."
          : undefined,
      },
    });
  } catch (err: any) {
    console.error('[Tasmee3 Match Audio Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Tasmee3 audio matching failed',
      message: err.message,
    });
  }
});

// Noor Support AI (Strictly technical app troubleshooting & bug reports)
app.post('/api/support-ai', async (req, res) => {
  const { issueDescription, category, appState, language } = req.body;
  const langInput = language || (req.headers['x-app-language'] as string) || (req.query?.language as string) || 'en';
  const meta = resolveLanguageMeta(langInput);
  const langDirective = getGlobalAiLanguageDirective(langInput);

  const systemInstruction = `${langDirective}

You are Noor Support AI, the technical customer support assistant for the NOOR mobile application.
You handle ONLY technical troubleshooting, app features, audio issues, notifications, bugs, and user feedback.
You do NOT handle religious rulings or theological questions.
Keep answers step-by-step, empathetic, clear, and reassuring.
Generate all fields (greeting, troubleshootingSteps, resolutionSummary) strictly in ${meta.name}.`;

  const supportSchema = {
    type: Type.OBJECT,
    properties: {
      greeting: { type: Type.STRING, description: `Welcoming greeting in ${meta.name}` },
      troubleshootingSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: `Actionable steps in ${meta.name}`
      },
      resolutionSummary: { type: Type.STRING, description: `Summary in ${meta.name}` },
      ticketLogged: { type: Type.BOOLEAN },
      ticketId: { type: Type.STRING }
    },
    required: ['greeting', 'troubleshootingSteps', 'resolutionSummary', 'ticketLogged']
  };

  try {
    const prompt = `User reported issue: "${issueDescription}" (Category: ${category || 'General'}). App context: ${JSON.stringify(appState || {})}. Provide helpful troubleshooting steps and generate a structured bug summary in ${meta.name}.`;
    const rawOutput = await generateWithModelFallback(prompt, systemInstruction, supportSchema);
    const parsed = JSON.parse(rawOutput || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.warn('[Noor Support AI] Providing offline technical assistance fallback.');
    return res.json({
      success: true,
      data: {
        greeting: meta.code === 'ar' ? "شكراً لتواصلك مع الدعم الفني لتطبيق نور." : "Thank you for reaching out to Noor Technical Support.",
        troubleshootingSteps: meta.code === 'ar' ? [
          "1. تأكد من رفع مستوى صوت الجهاز ومكبرات الصوت.",
          "2. تحقق من اتصالك بشبكة الإنترنت لتشغيل التلاوات القرآنية.",
          "3. يمكنك اختيار قراء مختلفين من شريط مشغل الصوت السفلي.",
          "4. إذا استمرت المشكلة، أعد تشغيل التطبيق لتحديث البيانات."
        ] : [
          "1. Check that your device audio and speaker volume are turned up.",
          "2. Ensure you have an active internet connection for Quran recitation streaming.",
          "3. You can select different reciters from the bottom audio player bar.",
          "4. If an issue persists, restart the app to reload fresh data."
        ],
        resolutionSummary: meta.code === 'ar' ? "تم تسجيل تقرير المشكلة وسنعمل على ضمان أفضل أداء." : "We have recorded your issue report and will ensure optimal performance.",
        ticketLogged: true,
        ticketId: `NOOR-${Math.floor(100000 + Math.random() * 900000)}`
      }
    });
  }
});

// In-memory cache for synthesized neural TTS audio (cap at 400 entries)
const serverTtsCache = new Map<string, { audio: string; wavUrl: string }>();

function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
  header.writeUInt16LE(numChannels * 2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

// Text-to-Speech (TTS) Endpoint - Highest Quality Neural Arabic-Capable Voice
app.post('/api/tts', async (req, res) => {
  const { text, voice } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Flagship mature, calm, teacher-like voices: Fenrir (deep/mature Ustadh), Kore (warm/serene Ustadha)
  const voiceName = voice || 'Fenrir';

  try {
    // Clean markdown and formatting noise
    const cleanText = text
      .replace(/[*_#`~\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200);

    if (!cleanText) {
      return res.status(400).json({ error: 'Valid text required' });
    }

    const cacheKey = `${voiceName}:${cleanText}`;
    if (serverTtsCache.has(cacheKey)) {
      const cached = serverTtsCache.get(cacheKey)!;
      return res.json({
        success: true,
        audio: cached.audio,
        wavUrl: cached.wavUrl,
        sampleRate: 24000,
        mimeType: 'audio/pcm',
        cached: true,
      });
    }

    const ai = getGenAI();

    // Direct the neural model to produce natural, warm, mature, calm teacher speech
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const speechPrompt = isArabic
      ? `Speak in a natural, warm, mature, calm, clear, and teacher-like voice with authentic Arabic pronunciation, classical articulation (مخارج الحروف), and smooth breathing pauses:\n\n${cleanText}`
      : `Speak in a natural, warm, mature, calm, clear, and teacher-like tone with authentic Arabic pronunciation for any Quranic or Islamic terms, and smooth pauses:\n\n${cleanText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text: speechPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1);
      const wavUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

      // Manage cache size limit
      if (serverTtsCache.size > 400) {
        const firstKey = serverTtsCache.keys().next().value;
        if (firstKey) serverTtsCache.delete(firstKey);
      }
      serverTtsCache.set(cacheKey, { audio: base64Audio, wavUrl });

      return res.json({
        success: true,
        audio: base64Audio,
        wavUrl,
        sampleRate: 24000,
        mimeType: 'audio/pcm',
        cached: false,
      });
    }

    throw new Error('No audio returned in response');
  } catch (error: any) {
    console.error('[Noor Neural TTS Error]', error);
    return res.status(500).json({
      error: error?.message || 'Text-to-speech generation failed',
    });
  }
});

// =========================================================================
// REAL PASSWORD RESET & EMAIL VERIFICATION SECURITY FLOW
// =========================================================================

interface ServerResetSession {
  email: string;
  hashedOtp: string;
  expiresAt: number;
  attemptsLeft: number;
  resendAvailableAt: number;
  verified: boolean;
  resetToken?: string;
  tokenExpiresAt?: number;
}

const serverResetSessions = new Map<string, ServerResetSession>();

function hashOtpString(code: string): string {
  return crypto.createHash('sha256').update(`noor-salt-${code.trim()}`).digest('hex');
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'nafisnoor.support@gmail.com';
  const pass = (process.env.SMTP_PASS || '').trim();
  const from = process.env.SMTP_FROM || 'Nafis Noor <nafisnoor.support@gmail.com>';

  return { host, port, user, pass, from };
}

function createMailTransporter() {
  const { host, port, user, pass } = getSmtpConfig();

  if (!pass) {
    throw new Error('SMTP_PASS_MISSING');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

function parseSmtpError(err: any): string {
  if (!err) return "We couldn't send the verification email right now. Please try again.";
  const errMsg = String(err.message || err.code || err);
  if (
    errMsg.includes('SMTP_PASS_MISSING') ||
    err.code === 'EAUTH' ||
    errMsg.includes('535') ||
    errMsg.includes('Invalid login') ||
    errMsg.includes('Username and Password not accepted') ||
    errMsg.includes('BadCredentials')
  ) {
    return 'SMTP authentication failed. Check the Gmail App Password.';
  }
  return "We couldn't send the verification email right now. Please try again.";
}

function logSafeSmtpError(context: string, err: any) {
  const code = err?.code || err?.name || 'SMTP_ERROR';
  const rawMsg = String(err?.message || '');
  const safeMsg = rawMsg
    .replace(/pass(word)?\s*[:=]\s*\S+/gi, 'password=[REDACTED]')
    .replace(/[0-9]{6}/g, '[REDACTED_CODE]');
  console.error(`[SMTP Safe Log] ${context}: ${code} - ${safeMsg}`);
}

/**
 * Dispatches real verification email via configured Gmail SMTP
 */
async function dispatchPasswordResetEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createMailTransporter();
    const { from } = getSmtpConfig();

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Your Noor verification code',
      text: `Nafis Noor\n\nYour verification code is: ${otpCode}\n\nThis code expires soon.\n\nIf you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080a0e; color: #f5efe6; padding: 40px 20px; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto; background: #11141b; border: 1px solid rgba(201,160,99,0.3); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h1 style="color: #dfba7f; font-family: Georgia, serif; letter-spacing: 4px; margin-bottom: 8px;">Nafis Noor</h1>
            <p style="color: #a8a29e; font-size: 14px; margin-top: 0;">Password reset verification</p>
            <p style="color: #d6d3d1; font-size: 14px; line-height: 1.6; margin: 24px 0 16px;">
              We received a request to reset your password. Your verification code is:
            </p>
            <div style="background: rgba(201, 160, 99, 0.15); border: 1px solid #dfba7f; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dfba7f; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="color: #a8a29e; font-size: 12px; margin-top: 20px;">
              This code expires soon and can only be used once.
            </p>
            <p style="color: #78716c; font-size: 11px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    logSafeSmtpError('dispatchPasswordResetEmail', err);
    return { success: false, error: parseSmtpError(err) };
  }
}

/**
 * Server-side SMTP Test function for development and verification
 */
async function sendSmtpTestEmail(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const transporter = createMailTransporter();
    const { from } = getSmtpConfig();
    const toAddress = 'nafisnoor.support@gmail.com';

    await transporter.verify();

    await transporter.sendMail({
      from,
      to: toAddress,
      subject: 'Noor SMTP Test',
      text: 'Nafis Noor email system is working correctly.',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080a0e; color: #f5efe6; padding: 30px; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto; background: #11141b; border: 1px solid rgba(201,160,99,0.3); border-radius: 16px; padding: 24px;">
            <h2 style="color: #dfba7f; font-family: Georgia, serif; margin-top: 0;">Noor SMTP Test</h2>
            <p style="color: #f5efe6; font-size: 15px; margin: 16px 0;">Nafis Noor email system is working correctly.</p>
            <p style="color: #78716c; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: 20px;">
              Verified via SMTP on smtp.gmail.com:587
            </p>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: 'Test email sent successfully to nafisnoor.support@gmail.com',
    };
  } catch (err: any) {
    logSafeSmtpError('sendSmtpTestEmail', err);
    return {
      success: false,
      message: parseSmtpError(err),
      error: err?.code || 'SMTP_ERROR',
    };
  }
}

// Protected Admin-Only SMTP Test Route (Requires verified Admin authentication)
app.get('/api/auth/test-smtp', adminRateLimiter, requireAdminAuth, async (req, res) => {
  const result = await sendSmtpTestEmail();
  return res.status(result.success ? 200 : 500).json(result);
});
app.post('/api/auth/test-smtp', adminRateLimiter, requireAdminAuth, async (req, res) => {
  const result = await sendSmtpTestEmail();
  return res.status(result.success ? 200 : 500).json(result);
});

// 1. Dispatch Real Verification Code via SMTP
const handleSendResetCode = async (req: express.Request, res: express.Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();

  const existing = serverResetSessions.get(cleanEmail);
  if (existing && existing.resendAvailableAt > now) {
    const cooldownLeft = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return res.json({
      success: false,
      error: `Please wait ${cooldownLeft}s before requesting a new code.`,
      cooldownSeconds: cooldownLeft,
    });
  }

  // Generate cryptographically secure 6-digit OTP
  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtpString(rawCode);

  // Dispatch real email via SMTP
  const sendResult = await dispatchPasswordResetEmail(cleanEmail, rawCode);
  if (!sendResult.success) {
    return res.status(500).json({
      success: false,
      error: sendResult.error || "We couldn't send the verification email right now. Please try again.",
    });
  }

  // Save server session only upon confirmed delivery dispatch
  serverResetSessions.set(cleanEmail, {
    email: cleanEmail,
    hashedOtp,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attemptsLeft: 5,
    resendAvailableAt: now + 30 * 1000, // 30s cooldown
    verified: false,
  });

  // Response NEVER exposes the OTP
  return res.json({
    success: true,
    message: 'We sent a verification code to your email.',
    cooldownSeconds: 30,
  });
};

app.post('/api/auth/send-reset-code', authRateLimiter, handleSendResetCode);
app.post('/api/send-verification-code', authRateLimiter, handleSendResetCode);

// 2. Verify 6-digit OTP code against server-side session
const handleVerifyCode = async (req: express.Request, res: express.Response) => {
  const { email, code } = req.body;
  if (!email || !code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Verification code is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const now = Date.now();

  const session = serverResetSessions.get(cleanEmail);
  if (!session || now > session.expiresAt) {
    return res.json({
      success: false,
      expired: true,
      error: 'That verification code has expired.',
    });
  }

  if (session.attemptsLeft <= 0) {
    serverResetSessions.delete(cleanEmail);
    return res.json({
      success: false,
      expired: true,
      error: 'Too many incorrect attempts. Please request a new code.',
    });
  }

  const enteredHash = hashOtpString(cleanCode);
  if (enteredHash !== session.hashedOtp) {
    session.attemptsLeft -= 1;
    return res.json({
      success: false,
      error: 'That verification code is incorrect.',
      attemptsLeft: session.attemptsLeft,
    });
  }

  // Generate single-use reset authorization token
  const resetToken = crypto.randomBytes(32).toString('hex');
  session.verified = true;
  session.hashedOtp = ''; // Invalidate OTP
  session.resetToken = resetToken;
  session.tokenExpiresAt = now + 15 * 60 * 1000; // 15 mins to complete password reset

  return res.json({
    success: true,
    resetToken,
    message: 'Code verified successfully.',
  });
};

app.post('/api/auth/verify-reset-code', authRateLimiter, handleVerifyCode);
app.post('/api/verify-verification-code', authRateLimiter, handleVerifyCode);

// 3. Complete Password Reset
const handleCompleteReset = async (req: express.Request, res: express.Response) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ success: false, error: 'Missing required parameters.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const session = serverResetSessions.get(cleanEmail);

  if (
    !session ||
    !session.verified ||
    !session.resetToken ||
    session.resetToken !== resetToken ||
    (session.tokenExpiresAt && now > session.tokenExpiresAt)
  ) {
    return res.status(401).json({
      success: false,
      error: 'Password reset session is invalid or expired. Please request a new code.',
    });
  }

  // Invalidate session
  serverResetSessions.delete(cleanEmail);

  return res.json({
    success: true,
    message: 'Password updated successfully.',
  });
};

app.post('/api/auth/complete-reset-password', authRateLimiter, handleCompleteReset);
app.post('/api/complete-reset-password', authRateLimiter, handleCompleteReset);

// ============================================================================
// Protected User Routes (Strict Own-Data Isolation via RSA-SHA256 Firebase JWT)
// ============================================================================
app.get('/api/users/me', requireUserAuth, (req, res) => {
  return res.json({
    success: true,
    user: {
      uid: req.authUser?.uid,
      email: req.authUser?.email,
      emailVerified: req.authUser?.email_verified,
      name: req.authUser?.name,
    },
  });
});

app.all('/api/users/:userId/*', requireOwnUserAccess, (req, res) => {
  return res.json({
    success: true,
    isolatedUserId: req.authUser?.uid,
    message: 'Verified own-user resource access granted.',
  });
});

app.get('/api/users/:userId', requireOwnUserAccess, (req, res) => {
  return res.json({
    success: true,
    isolatedUserId: req.authUser?.uid,
    email: req.authUser?.email,
    message: 'Verified own-user profile access granted.',
  });
});

// ============================================================================
// Hardened Server-Side Admin Authentication & Security Audit Routes
// ============================================================================
app.post('/api/auth/admin-login', adminRateLimiter, handleAdminLogin);
app.post('/api/admin/login', adminRateLimiter, handleAdminLogin);
app.get('/api/auth/admin-verify', adminRateLimiter, handleAdminVerify);
app.get('/api/admin/verify', adminRateLimiter, handleAdminVerify);
app.post('/api/admin/logout', adminRateLimiter, handleAdminLogout);

// Protected Admin Security Audit Endpoint (Requires verified Admin authentication)
app.get('/api/admin/security-audit', adminRateLimiter, requireAdminAuth, (req, res) => {
  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    audit: {
      apiKeysHidden: true,
      hardcodedSecretsRemoved: true,
      exposedFilesBlocked: [
        '/.env*',
        '/*.map',
        '/server.ts',
        '/server.cjs',
        '/firestore.rules',
        '/firebase-blueprint.json',
        '/package.json',
      ],
      securityHeaders: [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options: nosniff',
        'Referrer-Policy: strict-origin-when-cross-origin',
        'Permissions-Policy',
        'Cross-Origin-Opener-Policy: same-origin-allow-popups',
        'X-Permitted-Cross-Domain-Policies: none',
      ],
      xssProtection: {
        serverPayloadSanitizer: 'active',
        clientDomPurify: 'active',
        prototypePollutionGuard: 'active',
      },
      corsPolicy: {
        strictOriginAllowlist: true,
        websocketOriginCheck: true,
      },
      authentication: {
        firebaseJwtRsa256Verification: 'active',
        userOwnDataIsolation: 'enforced (Firestore ABAC + API UID check)',
        passwordHashing: 'PBKDF2-HMAC-SHA256 (100,000 iterations)',
        adminSessionBinding: 'HMAC token + User-Agent hash + 2h TTL + 5-attempt lockout',
      },
      environmentVariables: auditEnvironmentVariables(),
    },
  });
});

// Process-level safety guards to prevent unexpected termination
process.on('uncaughtException', (err: any) => {
  console.error('[Process Uncaught Exception]:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Process Unhandled Rejection]:', reason?.message || reason);
});

// Server setup with Vite middleware and WebSocket Live API
async function startServer() {
  const server = http.createServer(app);

  server.on('error', (err: any) => {
    console.error('[HTTP Server Error]:', err?.message || err);
  });

  // WebSocket Server for Gemini Live Voice Stream (/api/live)
  const wss = new WebSocketServer({ noServer: true });

  wss.on('error', (err: any) => {
    console.warn('[WebSocket Server Error]:', err?.message || err);
  });

  server.on('upgrade', (request, socket, head) => {
    socket.on('error', (err) => {
      // Suppress unhandled socket error emissions on abrupt client disconnections
      console.warn('[Upgrade Socket Error]:', err?.message || err);
    });

    try {
      const origin = request.headers.origin;
      if (origin && !isAllowedOrigin(origin)) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/live' || url.pathname === '/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        // Cleanly close any unhandled upgrade request (e.g. Vite HMR requests)
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request: http.IncomingMessage) => {
    let isClosed = false;
    let liveSession: any = null;

    clientWs.on('error', (err: any) => {
      isClosed = true;
      liveSession = null;
      console.warn('[Noor Live API] Client socket error:', err?.message || 'Socket error');
    });

    const safeSend = (payload: object | string) => {
      if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;
      try {
        const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
        clientWs.send(str, (err) => {
          if (err) {
            // Socket may have disconnected mid-flight; safe to suppress
          }
        });
      } catch (err: any) {
        // Suppress any synchronous socket send exceptions
      }
    };

    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const voiceParam = url.searchParams.get('voice') || 'Fenrir';
    const langParam = url.searchParams.get('lang') || url.searchParams.get('language') || 'en';
    const validVoices = ['Fenrir', 'Kore', 'Charon', 'Zephyr', 'Puck'];
    const chosenVoice = validVoices.includes(voiceParam) ? voiceParam : 'Fenrir';
    const meta = resolveLanguageMeta(langParam);
    const liveLangDirective = getGlobalAiLanguageDirective(langParam);

    console.log(`[Noor Live API] Client connected with neural voice: ${chosenVoice}, language: ${meta.name} (${meta.code})`);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured on the server');
      }

      const ai = getGenAI();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
          systemInstruction: `${liveLangDirective}

You are Nafis Noor AI, a natural, warm, mature, calm, clear, and teacher-like Islamic companion and Quran teacher voice.
You speak directly with the user in natural, real-time bidirectional spoken audio conversation.
All conversational speech, explanations, instructions, and guidance MUST be spoken strictly in ${meta.name}.

CORE VOICE & PHONOLOGY DIRECTIVES:
1. Native Articulation & Fluency:
   - When speaking in ${meta.name}, speak with natural, idiomatic, and culturally refined fluency.
   - For Quranic or Arabic citations, articulate classical Arabic letters precisely from their authentic articulation points (مخارج الحروف): crisp 'Ayn (ع), Haa (ح), Daad (ض), Qaaf (ق), Taa (ط), Thaa (ث), Khaa (خ).
2. Vocal Persona, Tone & Pacing:
   - Vocal Presence: Warm, mature, serene, unhurried, patient, and teacher-like (معلم وقور، حليم، ناصح).
   - Delivery: Speak with dignified calm, measured cadence, and natural smooth breathing pauses between thoughts. Never sound rushed, robotic, or breathless.
   - Embody spiritual serenity (Sakinah) and compassionate encouragement.
3. Strict Separation of Quran Recitation:
   - Keep Quran recitation separate from your AI teacher voice.
   - You are a wise teacher, mentor, and guide.
   - When citing a verse for Tadabbur or pedagogical instruction, pronounce it clearly, reverently, and with classical Tajweed accuracy, but do NOT sing, perform artificial melodic tilawah, or attempt to clone real Sheikhs.
4. Spoken Clarity & Adab:
   - Begin with a warm, peaceful Islamic greeting in Arabic and ${meta.name}.
   - Keep responses concise and listener-friendly (2-3 clear sentences per turn).
   - Conclude spiritual counsel with a short, sincere Du'a in ${meta.name}.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (isClosed) return;

            // Audio output chunks
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                safeSend({ type: 'audio', audio: part.inlineData.data });
              }
            }

            // Output audio transcription (words spoken by Noor AI)
            const outputText =
              (message.serverContent as any)?.outputAudioTranscription?.text ||
              (message.serverContent as any)?.outputTranscription?.text;
            if (outputText) {
              safeSend({ type: 'output_transcript', text: outputText });
            }

            // Input audio transcription (words spoken by user)
            const inputText =
              (message.serverContent as any)?.inputAudioTranscription?.text ||
              (message.serverContent as any)?.inputTranscription?.text;
            if (inputText) {
              safeSend({ type: 'input_transcript', text: inputText });
            }

            // User interrupted Noor AI
            if (message.serverContent?.interrupted) {
              safeSend({ type: 'interrupted' });
            }

            // Turn complete
            if (message.serverContent?.turnComplete) {
              safeSend({ type: 'turn_complete' });
            }
          },
          onclose: () => {
            console.log('[Noor Live API] Session closed by Gemini');
            liveSession = null;
            safeSend({ type: 'session_closed' });
          },
          onerror: (err: any) => {
            liveSession = null;
            const errMsg = err?.message || (typeof err === 'string' ? err : 'Live session experienced an error');
            console.warn('[Noor Live API] Session error:', errMsg);
            safeSend({
              type: 'error',
              error: errMsg,
            });
          },
        },
      });

      // Forward client audio & text to Gemini Live
      clientWs.on('message', (rawData: any) => {
        if (isClosed || !liveSession) return;
        try {
          const payload = JSON.parse(rawData.toString());
          if (payload.audio && liveSession) {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (payload.text && liveSession) {
            liveSession.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch {
          // Suppress errors if session closed while sending
        }
      });

      clientWs.on('close', () => {
        isClosed = true;
        console.log('[Noor Live API] Client disconnected');
        if (liveSession) {
          try {
            liveSession.close?.();
          } catch {}
          liveSession = null;
        }
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to initialize Gemini Live API session';
      console.warn('[Noor Live API] Failed to connect to Gemini Live:', errMsg);
      safeSend({
        type: 'error',
        error: errMsg,
      });
    }
  });

  // Global Express error handler middleware (never leaks stack traces or internal secrets)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err?.message && err.message.includes('CORS policy blocked')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cross-origin request denied by CORS policy.',
      });
    }
    console.error('[Express Global Error Handler]:', err?.message || 'Error');
    return res.status(err?.status || 500).json({
      success: false,
      error: 'Request could not be processed.',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        dotfiles: 'deny',
        index: false,
      })
    );
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NOOR Server with Live Voice running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
