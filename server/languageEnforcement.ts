export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  isRtl: boolean;
}

export const SUPPORTED_LANGUAGES_MAP: Record<string, LanguageMeta> = {
  en: { code: 'en', name: 'English', nativeName: 'English', isRtl: false },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true },
  am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', isRtl: false },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', isRtl: false },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', isRtl: false },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', isRtl: false },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRtl: false },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRtl: true },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isRtl: false },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', isRtl: false },
};

export function resolveLanguageMeta(langInput?: string): LanguageMeta {
  if (!langInput) return SUPPORTED_LANGUAGES_MAP.en;
  const lower = String(langInput).toLowerCase().trim();
  if (lower === 'ar' || lower.includes('arab') || lower.includes('عرب')) return SUPPORTED_LANGUAGES_MAP.ar;
  if (lower === 'am' || lower.includes('amhar') || lower.includes('አማር')) return SUPPORTED_LANGUAGES_MAP.am;
  if (lower === 'fr' || lower.includes('french') || lower.includes('franç')) return SUPPORTED_LANGUAGES_MAP.fr;
  if (lower === 'zh' || lower.includes('chin') || lower.includes('中文')) return SUPPORTED_LANGUAGES_MAP.zh;
  if (lower === 'es' || lower.includes('span') || lower.includes('españ')) return SUPPORTED_LANGUAGES_MAP.es;
  if (lower === 'tr' || lower.includes('turk') || lower.includes('türk')) return SUPPORTED_LANGUAGES_MAP.tr;
  if (lower === 'ur' || lower.includes('urdu') || lower.includes('اردو')) return SUPPORTED_LANGUAGES_MAP.ur;
  if (lower === 'id' || lower.includes('indo') || lower.includes('bahasa')) return SUPPORTED_LANGUAGES_MAP.id;
  if (lower === 'de' || lower.includes('germ') || lower.includes('deutsch')) return SUPPORTED_LANGUAGES_MAP.de;
  return SUPPORTED_LANGUAGES_MAP.en;
}

export function getGlobalAiLanguageDirective(langInput?: string): string {
  const meta = resolveLanguageMeta(langInput);

  return `
==================================================
CRITICAL GLOBAL AI LANGUAGE ENFORCEMENT DIRECTIVE
==================================================
You are operating inside the Nafis Noor Islamic & Educational Application.
The user's selected application language is: ${meta.name} (${meta.nativeName}, ISO code: '${meta.code}').

MANDATORY RULES:
1. Respond ENTIRELY and EXCLUSIVELY in ${meta.name} (${meta.nativeName}).
2. Do NOT switch to English automatically under ANY circumstance.
3. Do NOT mix languages. There must be ZERO accidental English or other mixed language in your response.
4. Do NOT provide bilingual or dual-language responses unless the user explicitly requests a translation in another language.
5. Keep ${meta.name} for ALL user-facing text: explanations, step titles, questions, options, feedback, suggestions, greetings, reflections, and generated study content.
6. USER INPUT VS RESPONSE LANGUAGE: Even if the user types their prompt or question in English, Arabic, or another language, your response language MUST STILL BE ${meta.name} (${meta.nativeName}), because the application language is set to ${meta.name}.
7. PRESERVATION EXCEPTION: Only preserve text that naturally cannot or should not be translated:
   - Original Arabic Qur'an verses (ayat with accurate Tashkeel) and authentic Hadith Arabic matn when quoting sacred sources.
   - URLs, email addresses, computer code, or specific proper nouns that have no standard translation.
   Everything else (including descriptions, translations of verses, tadabbur, notes, analysis) MUST BE IN ${meta.name} (${meta.nativeName}).
==================================================
`;
}
