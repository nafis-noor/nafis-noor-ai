import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { resolveLanguageMeta, getGlobalAiLanguageDirective } from './languageEnforcement';

const router = Router();

// Fallback models - verified active models
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// Classical verified fallback interpretations based on Ibn Sirin and Al-Nabulsi
function generateClassicalFallback(dreamText: string, emotion: string = 'peaceful', language: string = 'en') {
  const lower = dreamText.toLowerCase();

  // Water / Swimming
  if (lower.includes('water') || lower.includes('swim') || lower.includes('sea') || lower.includes('river') || lower.includes('ماء') || lower.includes('سباحة') || lower.includes('بحر')) {
    return {
      topic: "Nature & Elements (Water & Cleansing)",
      symbolsDetected: ["Pure Water", "Submersion / Swimming", "Current / Flow"],
      keyElements: "Clear water signifies knowledge, life, pure livelihood (Rizq Halal), and spiritual renewal.",
      emotionalContext: {
        emotion: emotion || "Peace & Calm",
        impact: "A sense of tranquility in water confirms divine blessing, clarity of faith, and relief from worldly sorrows.",
        psychologicalLayer: "Reflects a heart seeking purification, emotional solace, and unclouded certainty."
      },
      primaryInterpretation: {
        text: "According to Muhammad Ibn Sirin (رحمه الله), seeing oneself immersed in or swimming peacefully through clear water signifies obtaining lawful knowledge, purification from sins, and relief from distress. Water is the primordial source of life in the Quran.",
        why: "Ibn Sirin stated that pure, clear water represents Islam, life, and abundance based on Surah Al-Anbiya (21:30): 'And We made from water every living thing.' When coupled with peace, it indicates good tidings (بشرى).",
        supportingEvidence: "Qur'an 21:30 ('وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ') and Hadith on purity and life."
      },
      alternativeInterpretations: [
        {
          title: "Acquisition of Vast Knowledge",
          why: "The sea or deep water often symbolizes a king, sovereign, or a vast ocean of scholarship. Swimming effortlessly indicates mastering a science.",
          mostLikelyIf: "The dreamer is a student of Islamic knowledge or engaged in sincere study."
        },
        {
          title: "Spiritual Repentance (Tawbah Nasuhah)",
          why: "Entering clear water symbolizes being washed clean of minor burdens and past lapses.",
          mostLikelyIf: "The dreamer has recently made sincere Istighfar and sought closer communion with Allah."
        },
        {
          title: "Expansiveness in Lawful Sustenance",
          why: "Drinking or swimming in fresh water represents sweet lawful sustenance entering one's household.",
          mostLikelyIf: "The dreamer is currently navigating financial decisions or seeking new opportunities."
        }
      ],
      scholarlyReferences: [
        "Ibn Sirin, Kitab Tafsir al-Ahlam al-Kabir (Bab al-Miyah wal-Bihar / Chapter on Waters and Seas)",
        "Abd al-Ghani al-Nabulsi, Ta'tir al-Anam fi Tafsir al-Manam",
        "Sahih al-Bukhari 6983 (Prophet ﷺ on good dreams being from Allah: 'الرؤيا الصالحة من الله')"
      ],
      importantNotes: [
        "True dreams (رؤيا صادقة) bring peaceful certainty and are a portion of prophetic glad tidings.",
        "Share favorable dreams only with those who sincerely love and wish well for you.",
        "Dream interpretation is an art of wisdom and conjecture (Zann), not definitive divine decree."
      ],
      fullFormattedText: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🌙 TAFSIR AL-AHLAM\nDream Interpretation Analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔍 TOPIC IDENTIFIED: Nature & Elements (Water & Cleansing)\n   Symbols detected: Pure Water, Swimming, Clarity, Depth\n   Key elements: Living water, spiritual revival, lawful sustenance\n\n💭 EMOTIONAL CONTEXT: ${emotion || 'Peaceful'}\n   Impact on interpretation: A state of peace confirms this dream carries glad tidings (بشرى) rather than warning.\n   Psychological layer: The soul seeks untroubled clarity and spiritual elevation.\n\n📖 PRIMARY INTERPRETATION:\n   According to Muhammad Ibn Sirin (رحمه الله), moving through clear water symbolizes obtaining pure knowledge, divine mercy, and deliverance from anxieties. Water is the primordial source of life in the Holy Quran.\n   \n   WHY: Ibn Sirin grounded water interpretation in Surah Al-Anbiya (21:30): 'And We made from water every living thing.' When unpolluted and calm, water reflects wholesome religion (Deen) and honorable livelihood.\n   \n   Supporting evidence: Qur'an 21:30 and Sahih al-Bukhari.\n\n🔄 ALTERNATIVE INTERPRETATIONS:\n\n   1️⃣ Attaining Vast Knowledge & Mastery\n      WHY: A deep body of water represents scholarship; swimming with ease represents comprehension.\n      Most likely if: The dreamer is actively studying or seeking Islamic wisdom.\n\n   2️⃣ Spiritual Renewal & Clean Slate\n      WHY: Submersion washes away the fatigue of the mundane world.\n      Most likely if: The dreamer has been making sincere Tawbah and Tahajjud prayers.\n\n   3️⃣ Expansion of Lawful Provision (Rizq)\n      WHY: Fresh water arriving at one's hands signifies sweet sustenance.\n      Most likely if: The dreamer is launching a lawful enterprise.\n\n📚 SCHOLARLY REFERENCES:\n   • Ibn Sirin, Tafsir al-Ahlam (Chapter on Water, Seas, and Springs)\n   • Al-Nabulsi, Ta'tir al-Anam fi Ta'bir al-Manam\n   • Sahih al-Bukhari (Book of Dreams, Hadith 6983)\n\n⚠️ IMPORTANT NOTES:\n   • Praise Allah for righteous visions and keep them between yourself and those who love you.\n   • Remember that dream interpretation is speculative insight, not binding Islamic law.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPowered by Noor AI · Powered by ALNOOR GROUP\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    };
  }

  // Flying
  if (lower.includes('fly') || lower.includes('flying') || lower.includes('flight') || lower.includes('طيران') || lower.includes('يطير')) {
    return {
      topic: "Actions & Movements (Flying & Ascension)",
      symbolsDetected: ["Flight", "Sky / High Elevation", "Leaving the Ground"],
      keyElements: "Ascending without wings represents travel, rise in worldly or spiritual stature, or elevation of ambition.",
      emotionalContext: {
        emotion: emotion || "Awe / Wonder",
        impact: "Flying with joy and ease indicates fulfillment of hopes and rising above petty grievances.",
        psychologicalLayer: "A longing for transcendence, liberation from earthly constraints, and higher spiritual aspiration."
      },
      primaryInterpretation: {
        text: "Imam Ibn Sirin mentions that flying in a dream symbolizes a journey (Safar), an elevation in status or rank among peers, or the realization of a cherished aspiration. If the dreamer flies steadily toward the heavens, it indicates spiritual elevation.",
        why: "Classical interpreters note that humans do not naturally fly; therefore, doing so in a dream symbolizes achieving something beyond ordinary expectations by the grace of Allah.",
        supportingEvidence: "Classical Arabic proverbs and Ibn Sirin's chapter on aerial movement."
      },
      alternativeInterpretations: [
        {
          title: "Physical or Spiritual Journey (Safar)",
          why: "Moving through the air swiftly is the classical metaphor for traversing vast distances in short time.",
          mostLikelyIf: "The dreamer is preparing for travel, Umrah, or relocation."
        },
        {
          title: "Elevation of Honor & Dignity",
          why: "Looking down from above signifies being raised in nobility and respect.",
          mostLikelyIf: "The dreamer is entering a new role, marriage, or communal leadership."
        }
      ],
      scholarlyReferences: [
        "Ibn Sirin, Kitab Tafsir al-Ahlam (Bab al-Tayaran / Chapter on Flying)",
        "Ibn Shaheen, Al-Isharat fi 'Ilm al-'Ibarat",
        "Sunan Ibn Majah (Hadith on righteous dreams)"
      ],
      importantNotes: [
        "If you woke up feeling refreshed, thank Allah for glad tidings.",
        "Maintain humble gratitude (Shukr) to preserve blessings."
      ],
      fullFormattedText: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🌙 TAFSIR AL-AHLAM\nDream Interpretation Analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔍 TOPIC IDENTIFIED: Actions & Movements (Flying & Ascension)\n   Symbols detected: Flight, Sky, Floating, Elevation\n   Key elements: Rising above the ground, freedom of movement\n\n💭 EMOTIONAL CONTEXT: ${emotion || 'Peace & Awe'}\n   Impact on interpretation: Moving upwards without fear signifies reaching noble milestones.\n   Psychological layer: Aspiration for spiritual heights and noble deeds.\n\n📖 PRIMARY INTERPRETATION:\n   In Ibn Sirin's methodology, flying without distress reflects an elevation in status, fulfillment of a noble ambition, or undertaking an honorable journey.\n   \n   WHY: Flying represents rising above earthbound obstacles. When smooth, it signifies success without hardship.\n   \n   Supporting evidence: Classical traditions on travel and elevation of rank.\n\n🔄 ALTERNATIVE INTERPRETATIONS:\n\n   1️⃣ Travel for Good (Safar / Umrah)\n      WHY: Crossing air corresponds to journeys of virtue.\n      Most likely if: Contemplating travel or religious pilgrimage.\n\n   2️⃣ Overcoming a Lingering Hardship\n      WHY: Rising above the ground symbolizes being lifted above difficulties.\n      Most likely if: Facing recent stress or workplace trials.\n\n📚 SCHOLARLY REFERENCES:\n   • Ibn Sirin, Tafsir al-Ahlam (Chapter on Flying)\n   • Ibn Shaheen, Al-Isharat fi 'Ilm al-'Ibarat\n\n⚠️ IMPORTANT NOTES:\n   • Thank Allah for uplifting visions.\n   • True dreams are from Allah; do not let interpretations distract from obligatory duties.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPowered by Noor AI · Powered by ALNOOR GROUP\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    };
  }

  // Universal classical response
  return {
    topic: "Spiritual & Personal Reflections",
    symbolsDetected: ["Personal Sights", "Unfolding Event", "Specific Setting"],
    keyElements: "A symbolic reflection of inner thoughts, divine counsel, or daily life.",
    emotionalContext: {
      emotion: emotion || "Reflective",
      impact: "The emotional tenor of the dream guides whether it serves as glad tidings (بشرى) or a prompt for introspection and protection.",
      psychologicalLayer: "The mind processes spiritual yearnings, subconscious hopes, and worldly preoccupations."
    },
    primaryInterpretation: {
      text: `Imam Muhammad Ibn Sirin (رحمه الله) observed that dreams are divided into three categories: a true vision from Allah (رؤيا صادقة), a troubling insinuation from Shaytan (حلم من الشيطان), or the subconscious wanderings of the self (حديث النفس). Reflecting on this dream encourages turning to prayer, seeking beneficial knowledge, and placing full trust (Tawakkul) in Allah.`,
      why: "Classical dream hermeneutics look at the holistic moral state of the dreamer and the symbols perceived. Symbols aligned with goodness and light denote positive developments in life.",
      supportingEvidence: "Sahih al-Bukhari 6988: 'الرؤيا ثلاث: فرؤيا حق، ورؤيا يحدث بها الرجل نفسه، ورؤيا تحزين من الشيطان'."
    },
    alternativeInterpretations: [
      {
        title: "Prompt for Increased Dhikr & Vigilance",
        why: "Dreams that leave uncertainty are often an invitation from Allah to anchor oneself in morning and evening Adhkar.",
        mostLikelyIf: "The dreamer has felt spiritually distracted or busy with mundane cares."
      },
      {
        title: "Glad Tidings of Relief after Hardship",
        why: "Any element of relief seen during sleep often mirrors upcoming ease.",
        mostLikelyIf: "The dreamer has been praying for an answer to a personal matter."
      }
    ],
    scholarlyReferences: [
      "Ibn Sirin, Muntakhab al-Kalam fi Tafsir al-Ahlam",
      "Al-Nabulsi, Ta'tir al-Anam",
      "Sahih Muslim (Book of Dreams, Hadith 2263)"
    ],
    importantNotes: [
      "Always seek refuge in Allah from bad dreams and do not narrate distressing nightmares.",
      "If the dream brings joy, praise Allah and share it only with someone who loves you and gives sincere advice (Naseehah).",
      "Do not base major legal or financial decisions solely on dream interpretation."
    ],
    fullFormattedText: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🌙 TAFSIR AL-AHLAM\nDream Interpretation Analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔍 TOPIC IDENTIFIED: Spiritual & Personal Reflections\n   Symbols detected: Key figures, Environment, Actions\n   Key elements: Symbolic journey of the heart\n\n💭 EMOTIONAL CONTEXT: ${emotion || 'Reflective'}\n   Impact on interpretation: Emotion determines whether the vision brings glad tidings or calls for cautious contemplation.\n   Psychological layer: The subconscious mirrors the spiritual yearnings of the soul.\n\n📖 PRIMARY INTERPRETATION:\n   Imam Muhammad Ibn Sirin taught that righteous dreams are glad tidings from Allah. Reflecting on this vision encourages renewed devotion, consistent Dhikr, and reliance upon Allah's wisdom.\n   \n   WHY: Islamic classical hermeneutics balance outward symbols with internal state. When approached with Adab, dreams remind believers of the unseen realm and Allah's constant care.\n   \n   Supporting evidence: Sahih al-Bukhari 6988 and Sahih Muslim 2263.\n\n🔄 ALTERNATIVE INTERPRETATIONS:\n\n   1️⃣ An Invitation to Sincere Du'a\n      WHY: Dreams frequently stir the heart to make supplication for loved ones.\n      Most likely if: You woke up with a specific person or task in mind.\n\n   2️⃣ Relief Approaching\n      WHY: In classical Tafsir, enduring tension followed by waking often heralds ease.\n      Most likely if: Navigating an ongoing decision.\n\n📚 SCHOLARLY REFERENCES:\n   • Muhammad Ibn Sirin, Kitab Tafsir al-Ahlam\n   • Abd al-Ghani al-Nabulsi, Ta'tir al-Anam\n   • Sahih al-Bukhari, Hadith 6988\n\n⚠️ IMPORTANT NOTES:\n   • Praise Allah for good dreams; seek refuge in Allah from distressing dreams.\n   • Remember that dreams are not sources of religious legislation (Shari'ah).\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPowered by Noor AI · Powered by ALNOOR GROUP\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  };
}

// POST /api/dream-interpretation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { dreamDescription, emotionalContext = 'peaceful', timing = 'unknown', language = 'en' } = req.body;

    if (!dreamDescription || typeof dreamDescription !== 'string' || dreamDescription.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Please describe your dream in detail to receive an interpretation.'
      });
    }

    const langMeta = resolveLanguageMeta(language);
    const langDirective = getGlobalAiLanguageDirective(language);
    const ai = getAiClient();

    // If AI client is unavailable, use classical verified knowledge base
    if (!ai) {
      const fallback = generateClassicalFallback(dreamDescription, emotionalContext, language);
      return res.json({
        success: true,
        source: 'classical_scholarship_engine',
        data: fallback
      });
    }

    const systemInstruction = `${langDirective}

You are an expert Islamic dream interpreter operating within the methodology of Muhammad Ibn Sirin (رحمه الله) and classical Islamic scholarship on Tafsir al-Ahlam (تفسير الأحلام). You are integrated into "Nafis Noor" — a free Islamic companion app by ALNOOR GROUP (مجموعة نور), developed by young Saudi developers.

═══════════════════════════════════════════
YOUR ROLE & METHODOLOGY
═══════════════════════════════════════════

When a user describes a dream, follow this EXACT analytical process:

STEP 1 — SYMBOL EXTRACTION:
Identify ALL symbols, objects, people, actions, places, colors, and emotions present in the dream. List them clearly. Note any unusual or contradictory elements.

STEP 2 — TOPIC CLASSIFICATION:
Classify the primary theme of the dream into one or more categories:
• Animals & Creatures
• Nature & Elements (water, fire, earth, sky)
• Buildings & Places (mosque, house, market, sea, desert)
• Actions & Movements (flying, falling, swimming, running, fighting)
• People & Relationships (Prophet ﷺ, parents, strangers, children, deceased)
• Objects & Items (keys, doors, mirrors, clothes, food, money)
• Colors & Light (white, black, green, red, darkness, brightness)
• Body & Health (illness, healing, missing limbs, growth)
• Spiritual & Religious (prayer, Quran, pilgrimage, fasting)

STEP 3 — EMOTIONAL CONTEXT ANALYSIS:
Analyze the user's stated emotional state during the dream. Consider how emotion modifies interpretation:
• Fear/Anxiety → May indicate warning or hidden threat
• Joy/Happiness → Often indicates good tidings (بشرى)
• Confusion/Uncertainty → May suggest multiple meanings
• Peace/Calm → Often indicates divine blessing
• Sadness/Grief → May relate to loss or spiritual reflection
Explain WHY the emotional context matters for this specific interpretation.

STEP 4 — PRIMARY INTERPRETATION:
Provide the most likely interpretation based on Ibn Sirin's framework. Include:
• The interpretation itself
• WHY it applies (the reasoning/logic behind it)
• How the symbol + emotion combination leads to this conclusion
• Any relevant Quranic verse or Hadith that supports this reading

STEP 5 — ALTERNATIVE INTERPRETATIONS:
Present ALL other possible interpretations with clear reasoning for each. Consider:
• How the dreamer's personal circumstances change meaning (married/single, young/old, healthy/sick)
• How the size/state of the symbol changes meaning (large snake vs small snake, flowing water vs stagnant water)
• How the action performed changes meaning (killing a snake vs being bitten by one)
• Cultural and contextual factors
Each alternative must include: the interpretation + WHY it could apply + what conditions would make it more likely.

STEP 6 — SCHOLARLY REFERENCES:
Cite sources where applicable:
• Ibn Sirin, Kitab Tafsir al-Ahlam (specify chapter/topic if known)
• Al-Nabulsi, Tabyin al-Amanī (تبين المنامات)
• Ibn Shaheen, Tafsir al-Ahlam
• Relevant Hadith from Sahih Bukhari/Muslim about dreams
• Quranic verses related to dream themes

STEP 7 — IMPORTANT NOTES & DISCLAIMER:
Always include:
• Reminder that dream interpretation is not an exact science
• Distinction between true dreams (رؤيا صادقة - from Allah), bad dreams (حلم سيء - from Shaytan), and random thoughts (هواجس النفس - from the self)
• Recommendation to consult a knowledgeable scholar for personal guidance
• Advice on what to do after a good dream (share only with those who love you) vs bad dream (seek refuge in Allah, don't share, spit lightly to left three times)

RULES & GUARDRAILS:
1. NEVER claim absolute certainty about dream meanings — always use language like "typically means," "may indicate," "could suggest"
2. ALWAYS ground interpretations in classical Islamic scholarship (Ibn Sirin, Al-Nabulsi, Ibn Shaheen)
3. NEVER provide medical, legal, or financial advice disguised as dream interpretation
4. ALWAYS distinguish between true dreams (from Allah), bad dreams (from Shaytan), and random thoughts
5. If the dream involves the Prophet Muhammad ﷺ, handle with utmost reverence and refer to authentic Hadith about seeing the Prophet in dreams
6. Always maintain a respectful, compassionate tone in ${langMeta.name}.

STRICT FORMAT REQUIREMENT:
You must provide BOTH a structured JSON object with all fields AND the 'fullFormattedText' field formatted EXACTLY according to the ASCII box layout requested:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌙 TAFSIR AL-AHLAM
Dream Interpretation Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 TOPIC IDENTIFIED: [Primary category]
   Symbols detected: [List all symbols found]
   Key elements: [Highlight the most significant ones]

💭 EMOTIONAL CONTEXT: [User's emotion]
   Impact on interpretation: [Explain why this emotion matters for these specific symbols]
   Psychological layer: [Brief note on how the emotion shapes meaning]

📖 PRIMARY INTERPRETATION:
   [Clear, direct interpretation]
   
   WHY: [Detailed reasoning explaining the logic behind this interpretation, referencing Ibn Sirin's methodology]
   
   Supporting evidence: [Quranic verse or Hadith if applicable]

🔄 ALTERNATIVE INTERPRETATIONS:

   1️⃣ [Interpretation A]
      WHY: [Reasoning]
      Most likely if: [Condition that makes this interpretation more probable]

   2️⃣ [Interpretation B]
      WHY: [Reasoning]
      Most likely if: [Condition]

   3️⃣ [Interpretation C]
      WHY: [Reasoning]
      Most likely if: [Condition]

📚 SCHOLARLY REFERENCES:
   • [Source 1 with specific reference]
   • [Source 2 with specific reference]
   • [Relevant Hadith or verse]

⚠️ IMPORTANT NOTES:
   • [Applicable advice based on dream type]
   • [Reminder about consulting scholars]
   • [Guidance on sharing/not sharing the dream]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by Noor AI · Powered by ALNOOR GROUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const promptText = `User Dream: "${dreamDescription}"
Stated Emotional Feeling: "${emotionalContext}"
Timing of Dream: "${timing}"
Language: ${langMeta.name}`;

    const dreamSchema = {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'Primary classification category' },
        symbolsDetected: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of all extracted dream symbols'
        },
        keyElements: { type: Type.STRING, description: 'Crucial highlights of the dream' },
        emotionalContext: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            impact: { type: Type.STRING },
            psychologicalLayer: { type: Type.STRING }
          },
          required: ['emotion', 'impact', 'psychologicalLayer']
        },
        primaryInterpretation: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            why: { type: Type.STRING },
            supportingEvidence: { type: Type.STRING }
          },
          required: ['text', 'why', 'supportingEvidence']
        },
        alternativeInterpretations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              why: { type: Type.STRING },
              mostLikelyIf: { type: Type.STRING }
            },
            required: ['title', 'why', 'mostLikelyIf']
          }
        },
        scholarlyReferences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Citations of Ibn Sirin, Al-Nabulsi, Ibn Shaheen, Hadith, Quran'
        },
        importantNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Prophetic advice on dreams, seeking refuge, consulting scholars'
        },
        fullFormattedText: {
          type: Type.STRING,
          description: 'The complete verbatim formatted response matching the ASCII box template exactly'
        }
      },
      required: [
        'topic',
        'symbolsDetected',
        'keyElements',
        'emotionalContext',
        'primaryInterpretation',
        'alternativeInterpretations',
        'scholarlyReferences',
        'importantNotes',
        'fullFormattedText'
      ]
    };

    let resultText = '';
    let lastError: unknown = null;

    // Timeout helper for resilient response (5.5 seconds max before instant fallback)
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5500));

    for (const model of CANDIDATE_MODELS) {
      try {
        const generatePromise = ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: dreamSchema
          }
        });

        const raceResult = await Promise.race([generatePromise, timeoutPromise]);
        if (raceResult && 'text' in raceResult && raceResult.text) {
          resultText = raceResult.text;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!resultText) {
      console.warn('[Dream API] Model generation timed out or failed, using classical verified fallback.', lastError);
      const fallback = generateClassicalFallback(dreamDescription, emotionalContext, language);
      return res.json({
        success: true,
        source: 'classical_scholarship_fallback',
        data: fallback
      });
    }

    try {
      let cleaned = resultText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const parsedData = JSON.parse(cleaned);
      return res.json({
        success: true,
        source: 'gemini_ibn_sirin_engine',
        data: parsedData
      });
    } catch (parseErr) {
      console.warn('[Dream API] JSON parse error, returning fallback:', parseErr);
      const fallback = generateClassicalFallback(dreamDescription, emotionalContext, language);
      return res.json({
        success: true,
        source: 'classical_scholarship_fallback',
        data: fallback
      });
    }
  } catch (err: any) {
    console.error('[Dream API Error]:', err.message);
    const fallback = generateClassicalFallback(req.body?.dreamDescription || '', req.body?.emotionalContext, req.body?.language);
    return res.json({
      success: true,
      source: 'error_fallback_scholarship',
      data: fallback
    });
  }
});

export default router;
