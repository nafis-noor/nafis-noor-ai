/**
 * Cloudflare Pages Serverless Edge API for Nafis Noor
 * Runs natively on Cloudflare Pages without requiring any external Node.js server.
 * Handles AI queries, Quran features, Study Hub, and fallback knowledge responses.
 */

interface CloudflareEnv {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

interface EventContext {
  request: Request;
  env: CloudflareEnv;
  params: {
    catchall?: string[];
  };
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Language, X-Language, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/**
 * Calls Google Gemini REST API using standard fetch
 */
async function callGemini(
  apiKey: string,
  prompt: string,
  systemInstruction?: string,
  jsonFormat = false
): Promise<string> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      if (jsonFormat) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

/**
 * Contextual fallback for Noor AI when GEMINI_API_KEY is not yet configured in Cloudflare
 */
function getContextualFallback(question: string, lang = 'ar') {
  const isArabic = lang === 'ar' || /[\u0600-\u06FF]/.test(question);

  if (isArabic) {
    return {
      suggestedTitle: 'إرشاد وتدبر',
      directAnswer:
        'الحمد لله والصلاة والسلام على رسول الله وعلى آله وصحبه ومن والاه. نسأل الله أن يبارك في مسعاك لطلب العلم والتفقه في الدين. لتدبر كتاب الله ومعرفة أحكامه يُرجى دائماً الرجوع إلى مصادر السنة النبوية والتفاسير المعتمدة كابن كثير والسعدي، وسؤال أهل العلم الموثوقين. يمكنك تفعيل مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) في لوحة Cloudflare لمزيد من التفاصيل التفاعلية.',
    };
  }

  return {
    suggestedTitle: 'Islamic Guidance',
    directAnswer:
      'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the worlds. For authentic religious knowledge, Muslims are advised to refer directly to the Holy Quran, verified Sunnah, and classical commentaries such as Tafsir Ibn Kathir. For detailed interactive responses, configure your GEMINI_API_KEY in Cloudflare Pages Dashboard settings.',
  };
}

export async function onRequest(context: EventContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const apiKey = env.GEMINI_API_KEY || '';

  try {
    // 1. ROUTE: /api/noor-ai
    if (pathname === '/api/noor-ai' && request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const question = body.question || body.message || '';
      const language = body.language || request.headers.get('x-app-language') || 'ar';

      if (!question || typeof question !== 'string') {
        return jsonResponse({ error: 'Question is required' }, 400);
      }

      if (!apiKey) {
        const fallback = getContextualFallback(question, language);
        return jsonResponse({ success: true, data: fallback });
      }

      const systemInstruction = `You are Noor, a serene, peaceful, and authentic Islamic scholar companion inside the NOOR app.
Answer concisely in ${language === 'ar' ? 'Arabic' : 'English'} (1-2 focused, heart-softening paragraphs).
Ground your reflections in the Holy Quran and authentic Sunnah with adab, warmth, and accuracy.
Output in JSON with 'directAnswer' (string) and 'suggestedTitle' (short 2-4 word string).`;

      try {
        const rawJson = await callGemini(
          apiKey,
          `Question: "${question}"`,
          systemInstruction,
          true
        );
        const parsed = JSON.parse(rawJson);
        return jsonResponse({ success: true, data: parsed });
      } catch (err: any) {
        const fallback = getContextualFallback(question, language);
        return jsonResponse({ success: true, data: fallback });
      }
    }

    // 2. ROUTE: /api/quran/ask-noor-ai
    if (pathname === '/api/quran/ask-noor-ai' && request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { question, surahNumber, ayahNumber, ayahText } = body;

      if (!apiKey) {
        return jsonResponse({
          success: true,
          answer: 'تأمل وتدبر في هذه الآية المباركة من كتاب الله العزيز، واستشعر رحمات الله ونوره في كل حرف.',
        });
      }

      const prompt = `Ayah: [Surah ${surahNumber}, Ayah ${ayahNumber}]: "${ayahText || ''}"
Question: "${question || 'Explain the reflection and meaning of this Ayah'}"
Provide a brief, inspiring Islamic explanation (1-2 paragraphs) in Arabic or English according to the question.`;

      const responseText = await callGemini(apiKey, prompt);
      return jsonResponse({
        success: true,
        answer: responseText,
      });
    }

    // 3. ROUTE: /api/study/* (Study Hub endpoints)
    if (pathname.startsWith('/api/study') && request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));

      if (!apiKey) {
        return jsonResponse({
          success: true,
          data: {
            content: 'مرحباً بك في مركز التعلم. يرجى إضافة GEMINI_API_KEY في إعدادات Cloudflare لتفعيل كافة الدروس التفاعلية.',
          },
        });
      }

      const prompt = JSON.stringify(body);
      const systemInstruction = 'You are a warm, knowledgeable Islamic and Arabic studies tutor. Provide helpful, encouraging explanations.';
      const resText = await callGemini(apiKey, prompt, systemInstruction);

      return jsonResponse({
        success: true,
        data: { content: resText },
      });
    }

    // 4. ROUTE: /api/dream-interpretation
    if (pathname === '/api/dream-interpretation' && request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const dream = body.dream || body.dreamText || '';

      if (!apiKey) {
        return jsonResponse({
          success: true,
          interpretation: 'الرؤيا الصالحة من الله والحلم من الشيطان. يُستحب للمسلم إذا رأى ما يحب أن يحمد الله ويسأل خيرها.',
        });
      }

      const prompt = `Interpret this dream according to classical Islamic methodology (Ibn Sirin principles): "${dream}". Include reminders that dreams are subjective and ultimate knowledge is with Allah.`;
      const resText = await callGemini(apiKey, prompt);

      return jsonResponse({
        success: true,
        interpretation: resText,
      });
    }

    // 5. ROUTE: /api/quran/surah/:number
    if (pathname.startsWith('/api/quran/surah/')) {
      const parts = pathname.split('/');
      const surahNum = parseInt(parts[parts.length - 1], 10);
      if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
        return jsonResponse({ error: 'Invalid Surah number' }, 400);
      }

      const alquranRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,ar.muyassar`);
      if (alquranRes.ok) {
        const alquranData: any = await alquranRes.json();
        return jsonResponse(alquranData);
      }
    }

    // 6. ROUTE: /api/tts
    if (pathname === '/api/tts' && request.method === 'POST') {
      return jsonResponse({
        success: true,
        fallbackMode: true,
        message: 'Browser speech synthesis is active.',
      });
    }

    // 7. ROUTE: /api/feedback
    if (pathname === '/api/feedback' && request.method === 'POST') {
      return jsonResponse({
        success: true,
        message: 'Feedback received with gratitude. JazakAllah Khair.',
      });
    }

    // Default route response
    return jsonResponse({
      success: true,
      service: 'Nafis Noor Cloudflare Edge API',
      status: 'operational',
    });
  } catch (error: any) {
    return jsonResponse(
      {
        success: false,
        error: error?.message || 'Internal API Error',
      },
      500
    );
  }
}
