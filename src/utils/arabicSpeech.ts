/**
 * Arabic Speech Engine for Noor AI Learning
 * Intelligent dual-pipeline:
 * 1. Hardened browser Web Speech Synthesis with prioritized Arabic voice matching & Chrome GC protection.
 * 2. Studio Gemini TTS fallback (/api/study/tts) with 24kHz HD Arabic pronunciation when device voice is absent or fails.
 * 3. Automatic pedagogical sanitization for isolated letters, Sukoon, Shaddah, and diacritics.
 */

export interface SpeechCapability {
  hasSynthesis: boolean;
  hasArabicVoice: boolean;
  arabicVoiceName: string | null;
  hasRecognition: boolean;
  hasStudioFallback: boolean;
}

// Canonical phonetic mapping for single Arabic characters
export const ARABIC_LETTER_NAMES: Record<string, string> = {
  'ا': 'أَلِف',
  'أ': 'أَلِف',
  'إ': 'أَلِف',
  'آ': 'أَلِف مَدَّة',
  'ء': 'هَمْزَة',
  'ب': 'بَاء',
  'ت': 'تَاء',
  'ث': 'ثَاء',
  'ج': 'جِيم',
  'ح': 'حَاء',
  'خ': 'خَاء',
  'د': 'دَال',
  'ذ': 'ذَال',
  'ر': 'رَاء',
  'ز': 'زَاي',
  'س': 'سِين',
  'ش': 'شِين',
  'ص': 'صَاد',
  'ض': 'ضَاد',
  'ط': 'طَاء',
  'ظ': 'ظَاء',
  'ع': 'عَيْن',
  'غ': 'غَيْن',
  'ف': 'فَاء',
  'ق': 'قَاف',
  'ك': 'كَاف',
  'ل': 'لَام',
  'م': 'مِيم',
  'ن': 'نُون',
  'ه': 'هَاء',
  'هـ': 'هَاء',
  'و': 'وَاو',
  'ي': 'يَاء',
  'ى': 'أَلِف مَقْصُورَة',
  'ة': 'تَاء مَرْبُوطَة',
};

/**
 * Pedagogical audio sanitizer for Arabic text.
 * Prevents TTS engine crashes and silent failures:
 * - Translates lone unvocalized consonants to their authentic letter name
 * - Articulates isolated Sukoon letters with supportive initial Hamza (e.g. 'بْ' -> 'أَبْ')
 * - Articulates isolated Shaddah letters with supportive initial Hamza (e.g. 'بَّ' -> 'أَبَّ')
 * - Replaces ellipsis dots with pauses
 * - Strips English translations in parentheses and Markdown noise
 */
export function cleanArabicForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // 1. Remove Markdown formatting (*, _, `, #, bullet dashes, numbered lists)
  text = text.replace(/[*_`#]/g, '');
  text = text.replace(/^[\s\d.-]+\s+/gm, '');

  // 2. Remove English text inside parentheses or brackets, e.g. "(Hello)"
  text = text.replace(/\([a-zA-Z\s.,'?!-]+\)/g, ' ');
  text = text.replace(/\[[a-zA-Z\s.,'?!-]+\]/g, ' ');

  // 3. Replace ellipses (...) with Arabic pause comma (،)
  text = text.replace(/\.{2,}/g, '، ');

  // 4. Check if text is a single Arabic character without Tashkeel
  const trimmed = text.trim();
  if (ARABIC_LETTER_NAMES[trimmed]) {
    return ARABIC_LETTER_NAMES[trimmed];
  }

  // 5. Check if text is an isolated letter with Sukoon (e.g. 'بْ', 'تْ', etc.)
  // In classical Tajweed & Noorani Qaida, Sukoon cannot be articulated in isolation without Hamza:
  const sukoonMatch = trimmed.match(/^([\u0621-\u064A])\u0652$/);
  if (sukoonMatch) {
    const letter = sukoonMatch[1];
    return letter === 'ا' || letter === 'أ' ? 'أَأْ' : `أَ${letter}ْ`;
  }

  // 6. Check if text is an isolated letter with Shaddah (e.g. 'بَّ')
  const shaddaMatch = trimmed.match(/^([\u0621-\u064A])\u0651([\u064E\u064F\u0650]?)$/);
  if (shaddaMatch) {
    const letter = shaddaMatch[1];
    const vowel = shaddaMatch[2] || '\u064E';
    return `أَ${letter}\u0651${vowel}`;
  }

  return text.trim();
}

let cachedArabicVoice: SpeechSynthesisVoice | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
const clientAudioCache = new Map<string, string>();
let isAudioCurrentlyPlaying = false;

// Initialize voice listener for browsers loading voices asynchronously
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedArabicVoice = null; // force re-detect
    getArabicVoice();
  };
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

export function getArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedArabicVoice) return cachedArabicVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Prioritized voice search:
  // 1. Exact Saudi Arabian locale
  // 2. Any Arabic locale
  // 3. Any voice containing Arabic or عربي in its name
  const arVoice =
    voices.find(v => v.lang === 'ar-SA' || v.lang === 'ar_SA') ||
    voices.find(v => v.lang.toLowerCase().startsWith('ar-')) ||
    voices.find(v => v.lang.toLowerCase() === 'ar') ||
    voices.find(v => v.name.toLowerCase().includes('arabic')) ||
    voices.find(v => v.name.includes('عربي'));

  if (arVoice) {
    cachedArabicVoice = arVoice;
  }
  return arVoice || null;
}

export function checkSpeechCapabilities(): SpeechCapability {
  const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voice = getArabicVoice();

  const hasRecognition =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return {
    hasSynthesis,
    hasArabicVoice: Boolean(voice),
    arabicVoiceName: voice ? voice.name : null,
    hasRecognition,
    hasStudioFallback: true, // Server-side Gemini TTS fallback is always available
  };
}

export interface ArabicSpeechOptions {
  rate?: number; // 0.5 (slow) to 1.0 (normal)
  pitch?: number;
  preferStudio?: boolean; // Default to true for neural studio-grade Arabic teacher voice
  voice?: string; // 'Fenrir' (Ustadh), 'Kore' (Ustadha), 'Charon'
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Play audio via studio-grade Gemini TTS endpoint
 */
async function playStudioTts(
  text: string,
  options: ArabicSpeechOptions
): Promise<boolean> {
  try {
    const cleanText = cleanArabicForSpeech(text);
    if (!cleanText) return false;

    const chosenVoice = options.voice || 'Fenrir';
    const cacheKey = `${chosenVoice}:${cleanText}`;
    let audioUrl = clientAudioCache.get(cacheKey);

    if (!audioUrl) {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: chosenVoice }),
      });

      if (!response.ok) {
        throw new Error(`Studio TTS failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.wavUrl && !data.audio) {
        throw new Error(data.error || 'No audio received from studio TTS');
      }

      audioUrl = data.wavUrl || `data:audio/wav;base64,${data.audio}`;
      clientAudioCache.set(cacheKey, audioUrl);
    }

    if (currentHtmlAudio) {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
      currentHtmlAudio = null;
    }

    const audio = new Audio(audioUrl);
    currentHtmlAudio = audio;
    if (options.rate) {
      audio.playbackRate = Math.max(0.5, Math.min(2.0, options.rate));
    }

    isAudioCurrentlyPlaying = true;
    options.onStart?.();

    audio.onended = () => {
      isAudioCurrentlyPlaying = false;
      currentHtmlAudio = null;
      options.onEnd?.();
    };

    audio.onerror = (e) => {
      isAudioCurrentlyPlaying = false;
      currentHtmlAudio = null;
      console.warn('HTML5 Audio playback error:', e);
      options.onError?.(e);
    };

    await audio.play();
    return true;
  } catch (err) {
    isAudioCurrentlyPlaying = false;
    currentHtmlAudio = null;
    console.warn('Studio TTS playback error:', err);
    options.onError?.(err);
    return false;
  }
}

/**
 * Speaks Arabic text with comprehensive error recovery:
 * 1. Cleans text for pedagogical pronunciation.
 * 2. Uses high-fidelity Studio Gemini Neural Arabic TTS by default for natural, mature teacher cadence.
 * 3. Falls back to Web Speech Synthesis only if offline or explicitly requested.
 */
export function speakArabic(
  rawText: string,
  options: ArabicSpeechOptions = {}
): boolean {
  if (!rawText || !rawText.trim()) return false;

  const textToSpeak = cleanArabicForSpeech(rawText);

  // Stop previous audio
  stopArabicSpeech();

  // Default preferStudio to true unless explicitly disabled
  const preferStudio = options.preferStudio !== false;
  const voice = getArabicVoice();

  if (preferStudio || !voice) {
    playStudioTts(textToSpeak, options);
    return true;
  }

  // Attempt Web Speech Synthesis
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      playStudioTts(textToSpeak, options);
      return true;
    }

    // Chrome unpause safety check
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    activeUtterance = utterance; // Retain reference to prevent Chrome garbage-collection bug

    utterance.lang = voice.lang || 'ar-SA';
    utterance.voice = voice;
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1.0;

    utterance.onstart = () => {
      isAudioCurrentlyPlaying = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      isAudioCurrentlyPlaying = false;
      activeUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Web Speech Synthesis error, falling back to Studio TTS:', e);
      isAudioCurrentlyPlaying = false;
      activeUtterance = null;
      // Immediate fallback to Studio TTS
      playStudioTts(textToSpeak, options);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Web Speech throw, falling back to Studio TTS:', err);
    activeUtterance = null;
    playStudioTts(textToSpeak, options);
    return true;
  }
}

/**
 * Stops any currently playing Arabic audio (both Web Speech and Studio Audio).
 */
export function stopArabicSpeech(): void {
  isAudioCurrentlyPlaying = false;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }

  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentHtmlAudio = null;
  }

  activeUtterance = null;
}

export function isArabicAudioPlaying(): boolean {
  return isAudioCurrentlyPlaying;
}

/**
 * Gentle acoustic feedback chime using Web Audio API
 */
export function playChimeSound(type: 'success' | 'click' | 'hint' = 'success'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      // Warm peaceful ascending harmonic chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.22); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch (e) {
    // ignore
  }
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createArabicSpeechRecognition(callbacks: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}): SpeechRecognitionController | null {
  if (typeof window === 'undefined') return null;

  const SpeechRec =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRec) {
    callbacks.onError('Web Speech Recognition is not supported by this browser. You can type your response.');
    return null;
  }

  try {
    const recognition = new SpeechRec();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      callbacks.onResult(text, Boolean(finalTranscript));
    };

    recognition.onerror = (event: any) => {
      console.warn('Arabic speech recognition event error:', event.error);
      let message = 'Speech recognition error occurred.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        message = 'Microphone access was denied. Please allow microphone permissions to speak in Arabic.';
      } else if (event.error === 'no-speech') {
        message = 'No speech detected. Tap Speak and pronounce clearly.';
      } else if (event.error === 'network') {
        message = 'Network connection issue with speech recognition.';
      }
      callbacks.onError(message);
    };

    recognition.onend = () => {
      callbacks.onEnd?.();
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Speech recognition start failed or already active:', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
      },
      abort: () => {
        try {
          recognition.abort();
        } catch (e) {
          // ignore
        }
      },
    };
  } catch (err: any) {
    callbacks.onError(err?.message || 'Failed to initialize speech recognition.');
    return null;
  }
}

