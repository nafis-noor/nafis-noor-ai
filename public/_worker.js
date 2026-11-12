/**
 * Cloudflare Pages _worker.js
 * Enables full-stack server-side processing for Nafis Noor on Cloudflare.
 * - Handles all /api/* AI and Quran endpoints securely at Cloudflare's edge
 * - Serves all static frontend assets (HTML, CSS, JS, images) via env.ASSETS
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Language, X-Language, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
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
async function callGemini(apiKey, prompt, systemInstruction, jsonFormat = false) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
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
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

/**
 * Contextual fallback when Gemini is unreachable
 */
function getContextualFallback(question, lang = 'ar') {
  const isArabic = lang === 'ar' || /[\u0600-\u06FF]/.test(question);
  if (isArabic) {
    return {
      suggestedTitle: 'إرشاد وتدبر',
      directAnswer:
        'الحمد لله والصلاة والسلام على رسول الله وعلى آله وصحبه ومن والاه. نسأل الله أن يبارك في مسعاك لطلب العلم والتفقه في الدين. لتدبر كتاب الله ومعرفة أحكامه يُرجى دائماً الرجوع إلى مصادر السنة النبوية والتفاسير المعتمدة كابن كثير والسعدي، وسؤال أهل العلم الموثوقين.',
    };
  }
  return {
    suggestedTitle: 'Islamic Guidance',
    directAnswer:
      'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the worlds. For authentic religious knowledge, Muslims are advised to refer directly to the Holy Quran, verified Sunnah, and classical commentaries such as Tafsir Ibn Kathir.',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Handle API endpoints
    if (pathname.startsWith('/api/')) {
      const apiKey = env.GEMINI_API_KEY || '';

      try {
        // A. /api/noor-ai
        if (pathname === '/api/noor-ai' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const question = body.question || body.message || '';
          const language = body.language || request.headers.get('x-app-language') || 'ar';

          if (!question || typeof question !== 'string') {
            return jsonResponse({ error: 'Question is required' }, 400);
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
          } catch (err) {
            const fallback = getContextualFallback(question, language);
            return jsonResponse({ success: true, data: fallback });
          }
        }

        // B. /api/quran/ask-noor-ai
        if (pathname === '/api/quran/ask-noor-ai' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const { question, surahNumber, ayahNumber, ayahText } = body;

          const prompt = `Ayah: [Surah ${surahNumber}, Ayah ${ayahNumber}]: "${ayahText || ''}"
Question: "${question || 'Explain the reflection and meaning of this Ayah'}"
Provide a brief, inspiring Islamic explanation (1-2 paragraphs) in Arabic or English according to the question.`;

          try {
            const responseText = await callGemini(apiKey, prompt);
            return jsonResponse({ success: true, answer: responseText });
          } catch {
            return jsonResponse({
              success: true,
              answer: 'تأمل وتدبر في هذه الآية المباركة من كتاب الله العزيز، واستشعر رحمات الله ونوره في كل حرف.',
            });
          }
        }

        // C. /api/study/*
        if (pathname.startsWith('/api/study') && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const prompt = JSON.stringify(body);
          const systemInstruction = 'You are a warm, knowledgeable Islamic and Arabic studies tutor. Provide helpful, encouraging explanations.';

          try {
            const resText = await callGemini(apiKey, prompt, systemInstruction);
            return jsonResponse({ success: true, data: { content: resText } });
          } catch {
            return jsonResponse({
              success: true,
              data: { content: 'مرحباً بك في مركز التعلم. استمر في مدارسة كتاب الله ولغته الكريمة بتفانٍ وصبر.' },
            });
          }
        }

        // D. /api/dream-interpretation
        if (pathname === '/api/dream-interpretation' && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const dream = body.dream || body.dreamText || '';
          const prompt = `Interpret this dream according to classical Islamic methodology (Ibn Sirin principles): "${dream}". Include reminders that dreams are subjective and ultimate knowledge is with Allah.`;

          try {
            const resText = await callGemini(apiKey, prompt);
            return jsonResponse({ success: true, interpretation: resText });
          } catch {
            return jsonResponse({
              success: true,
              interpretation: 'الرؤيا الصالحة من الله والحلم من الشيطان. يُستحب للمسلم إذا رأى ما يحب أن يحمد الله ويسأل خيرها.',
            });
          }
        }

        // E. /api/quran/surah/:number
        if (pathname.startsWith('/api/quran/surah/')) {
          const parts = pathname.split('/');
          const surahNum = parseInt(parts[parts.length - 1], 10);
          if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
            return jsonResponse({ error: 'Invalid Surah number' }, 400);
          }
          const alquranRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,ar.muyassar`);
          if (alquranRes.ok) {
            const alquranData = await alquranRes.json();
            return jsonResponse(alquranData);
          }
        }

        // F. /api/tts
        if (pathname === '/api/tts' && request.method === 'POST') {
          return jsonResponse({
            success: true,
            fallbackMode: true,
            message: 'Browser speech synthesis is active.',
          });
        }

        // G. /api/feedback
        if (pathname === '/api/feedback' && request.method === 'POST') {
          return jsonResponse({
            success: true,
            message: 'Feedback received with gratitude. JazakAllah Khair.',
          });
        }

        // Other /api fallback
        return jsonResponse({
          success: true,
          service: 'Nafis Noor Cloudflare Edge Worker',
          status: 'operational',
        });
      } catch (err) {
        return jsonResponse({ success: false, error: err?.message || 'API error' }, 500);
      }
    }

    // 3. For all non-API routes, serve static frontend assets from Vite build
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};
