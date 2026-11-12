import {
  QuranTeacherState,
  QuranTeacherMode,
  RecitationEvaluationResult,
  QuranTeacherVoiceId,
  QuranTeacherLanguage,
} from '../types/quranTeacher';
import { Ayah } from '../types';
import { evaluateRecitationAgainstAyah } from './quranTeacherEngine';
import { getApiUrl } from './apiConfig';
import {
  filterNoiseAndAccidentalWords,
  CaringTeacherPhraseEngine,
  CaringFeedbackType,
} from './quranTeacherCaringPhrases';

// Global cache for teacher speech clips to guarantee zero-latency response
const teacherAudioCache = new Map<string, string>();

export interface QuranTeacherCallbacks {
  onStateChange: (state: QuranTeacherState) => void;
  onAudioLevel: (level: number, frequencyData: Uint8Array) => void;
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onTeacherSpeech: (message: string) => void;
  onAyahEvaluated: (result: RecitationEvaluationResult) => void;
  onAyahAdvanced: (nextAyahIndex: number) => void;
  onLessonCompleted: () => void;
  onError: (errorMessage: string) => void;
}

export class QuranTeacherController {
  private state: QuranTeacherState = 'idle';
  private callbacks: QuranTeacherCallbacks;
  
  // Audio Input & Analyser
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private frequencyDataBuffer: Uint8Array | null = null;

  // Speech Recognition
  private recognition: any = null;
  private isRecognitionRunning = false;
  private currentTranscript = '';
  private lastSpeechTimestamp = 0;
  private silenceCheckTimer: any = null;
  private isUserSpeaking = false;
  private isMuted = false;

  // Lesson Context
  private surahNumber: number = 1;
  private surahName: string = '';
  private ayahs: Ayah[] = [];
  private currentAyahIndex: number = 0;
  private mode: QuranTeacherMode = 'learn';
  private teacherVoice: QuranTeacherVoiceId = 'Fenrir';
  private teacherLanguage: QuranTeacherLanguage = 'ar';
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private lastSpokenInstruction: string = '';
  private phraseEngine = new CaringTeacherPhraseEngine();

  constructor(
    callbacks: QuranTeacherCallbacks,
    options?: { voice?: QuranTeacherVoiceId; language?: QuranTeacherLanguage }
  ) {
    this.callbacks = callbacks;
    if (options?.voice) this.teacherVoice = options.voice;
    if (options?.language) this.teacherLanguage = options.language;
  }

  public getState(): QuranTeacherState {
    return this.state;
  }

  public setVoice(voice: QuranTeacherVoiceId) {
    this.teacherVoice = voice;
  }

  public setLanguage(lang: QuranTeacherLanguage) {
    this.teacherLanguage = lang;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public isAiMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Initializes the session with the selected Ayahs and mode
   */
  public async startLesson(
    surahNumber: number,
    surahName: string,
    ayahs: Ayah[],
    mode: QuranTeacherMode = 'learn',
    voice: QuranTeacherVoiceId = 'Fenrir',
    language: QuranTeacherLanguage = 'ar'
  ): Promise<boolean> {
    if (!ayahs || ayahs.length === 0) {
      this.callbacks.onError('No ayahs provided for lesson.');
      return false;
    }

    this.surahNumber = surahNumber;
    this.surahName = surahName;
    this.ayahs = ayahs;
    this.currentAyahIndex = 0;
    this.mode = mode;
    this.teacherVoice = voice;
    this.teacherLanguage = language;
    this.currentTranscript = '';

    // Initialize microphone & AudioContext
    const micReady = await this.initMicrophone();
    if (!micReady) return false;

    // Initialize Speech Recognition
    this.initSpeechRecognition();

    // Start teacher opening
    this.startOpeningGreeting();
    return true;
  }

  /**
   * Initializes real microphone input with AudioContext for genuine reactive waveform & VAD
   */
  private async initMicrophone(): Promise<boolean> {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      this.frequencyDataBuffer = new Uint8Array(this.analyser.frequencyBinCount);
      this.startAudioMeterLoop();
      return true;
    } catch (err: any) {
      console.error('[QuranTeacherVoice] Microphone error:', err);
      this.callbacks.onError(
        'Microphone access was denied or unavailable. Please enable microphone permissions in your browser to interact with Quran Teacher AI.'
      );
      this.transitionState('idle');
      return false;
    }
  }

  /**
   * Audio processing loop feeding live audio amplitude & frequency data to UI
   */
  private startAudioMeterLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    const checkLevel = () => {
      if (!this.analyser || !this.frequencyDataBuffer) return;

      this.analyser.getByteFrequencyData(this.frequencyDataBuffer);
      let sum = 0;
      for (let i = 0; i < this.frequencyDataBuffer.length; i++) {
        sum += this.frequencyDataBuffer[i];
      }
      const average = sum / this.frequencyDataBuffer.length;
      const normalizedLevel = Math.min(1, average / 128);

      // Notify callback of live real audio
      this.callbacks.onAudioLevel(normalizedLevel, this.frequencyDataBuffer);

      // Voice Activity Detection (VAD)
      if (this.state === 'listening') {
        const threshold = 0.08;
        if (normalizedLevel > threshold) {
          this.isUserSpeaking = true;
          this.lastSpeechTimestamp = Date.now();
        }
      }

      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    this.animationFrameId = requestAnimationFrame(checkLevel);
  }

  /**
   * Web Speech Recognition initialization
   */
  private initSpeechRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[QuranTeacherVoice] SpeechRecognition API unavailable on this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ar-SA'; // Authentic Arabic Quran recognition
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isRecognitionRunning = true;
      };

      this.recognition.onresult = (event: any) => {
        if (this.state !== 'listening') return;

        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalStr += ' ' + trans;
          } else {
            interim += ' ' + trans;
          }
        }

        const rawCombined = (this.currentTranscript + finalStr + ' ' + interim).trim();

        // Filter out accidental noise words, vocal fillers, coughs, mic artifacts, isolated single letters
        const { cleaned, isNoiseOnly } = filterNoiseAndAccidentalWords(rawCombined, this.teacherLanguage === 'en');

        // If purely noise or non-Quranic acoustic artifacts, ignore and don't trigger false evaluations
        if (isNoiseOnly) {
          return;
        }

        this.lastSpeechTimestamp = Date.now();
        this.isUserSpeaking = true;
        this.callbacks.onTranscriptChange(cleaned, false);

        if (finalStr.trim()) {
          const { cleaned: cleanedFinal, isNoiseOnly: isFinalNoise } = filterNoiseAndAccidentalWords(
            finalStr,
            this.teacherLanguage === 'en'
          );
          if (!isFinalNoise && cleanedFinal) {
            this.currentTranscript = (this.currentTranscript + ' ' + cleanedFinal).trim();
          }
        }

        // Reset or schedule silence evaluation check with verified speech
        this.scheduleSilenceCheck(cleaned);
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal pause in recitation
          return;
        }
        if (event.error === 'not-allowed') {
          this.callbacks.onError('Microphone permission blocked. Please allow microphone access.');
          return;
        }
        console.warn('[QuranTeacherVoice] Recognition event:', event.error);
      };

      this.recognition.onend = () => {
        this.isRecognitionRunning = false;
        // Keep continuous listening if currently in listening state
        if (this.state === 'listening') {
          try {
            this.recognition.start();
          } catch {
            // ignore rapid restart
          }
        }
      };
    } catch (e) {
      console.warn('[QuranTeacherVoice] Recognition init error:', e);
    }
  }

  /**
   * Natural pause tolerance: Quran recitation contains pauses (waqf).
   * We do not interrupt immediately on brief pauses or accidental noises.
   * If silence persists after meaningful speech was heard, evaluate!
   */
  private scheduleSilenceCheck(accumulatedTranscript: string) {
    if (this.silenceCheckTimer) clearTimeout(this.silenceCheckTimer);

    const { cleaned, isNoiseOnly } = filterNoiseAndAccidentalWords(
      accumulatedTranscript,
      this.teacherLanguage === 'en'
    );
    if (isNoiseOnly || !cleaned) {
      // Noise only, do not evaluate
      return;
    }

    const currentAyah = this.ayahs[this.currentAyahIndex];
    if (!currentAyah) return;

    const approxWordCount = cleaned.trim().split(/\s+/).filter(Boolean).length;
    const expectedWordCount = currentAyah.text.trim().split(/\s+/).length;

    // If user has recited approximately the full length of the ayah, wait 1.8s of silence.
    // If they spoke only a portion, give generous 4.2s pause tolerance for Waqf/breaths.
    const silenceThresholdMs = approxWordCount >= expectedWordCount * 0.8 ? 1800 : 4200;

    this.silenceCheckTimer = setTimeout(() => {
      if (this.state === 'listening' && cleaned.trim().length > 0) {
        this.evaluateStudentRecitation(cleaned.trim());
      }
    }, silenceThresholdMs);
  }

  /**
   * Evaluates the student's spoken recitation and triggers caring, non-repeating teacher reaction
   */
  private async evaluateStudentRecitation(transcript: string) {
    if (this.state !== 'listening') return;

    const { cleaned, isNoiseOnly } = filterNoiseAndAccidentalWords(
      transcript,
      this.teacherLanguage === 'en'
    );
    if (isNoiseOnly || !cleaned) {
      // Ignore background noise and coughs
      this.currentTranscript = '';
      return;
    }

    this.transitionState('evaluating');
    if (this.silenceCheckTimer) clearTimeout(this.silenceCheckTimer);

    const currentAyah = this.ayahs[this.currentAyahIndex];
    if (!currentAyah) return;

    const evaluation = evaluateRecitationAgainstAyah(
      cleaned,
      currentAyah,
      this.surahNumber,
      { isFirstAyah: this.currentAyahIndex === 0 }
    );

    // Clear transcript accumulator for next turn
    this.currentTranscript = '';

    if (evaluation.isCorrect) {
      // Correct! Generate fresh, non-repeating caring praise
      const isLastAyah = this.currentAyahIndex >= this.ayahs.length - 1;
      const instruction = this.phraseEngine.getFeedback(
        isLastAyah ? 'last_ayah' : 'correct',
        {
          surahName: this.surahName,
          ayahNumber: currentAyah.numberInSurah,
        },
        this.teacherLanguage === 'ar' ? 'ar' : 'en'
      );

      evaluation.spokenFeedbackInstructionAr = instruction;
      evaluation.spokenFeedbackInstruction = instruction;
      this.callbacks.onAyahEvaluated(evaluation);

      await this.speakTeacher(instruction);

      if (isLastAyah) {
        this.transitionState('completed');
        this.callbacks.onLessonCompleted();
      } else {
        this.currentAyahIndex++;
        this.callbacks.onAyahAdvanced(this.currentAyahIndex);
        this.promptCurrentAyah();
      }
    } else {
      // Student struggled with part of the Ayah or stopped prematurely
      // Provide warm, encouraging, non-repeating feedback that teaches with care
      let feedbackType: CaringFeedbackType = 'general_retry';
      let wordContext: string | undefined = undefined;

      if (evaluation.isPrematureStop) {
        feedbackType = 'premature_stop';
      } else if (evaluation.missingWords.length > 0) {
        feedbackType = 'missing_words';
        wordContext = evaluation.missingWords.slice(0, 2).join(' ');
      } else if (evaluation.incorrectWords.length > 0) {
        feedbackType = 'incorrect_word';
        wordContext = evaluation.incorrectWords[0].expected;
      } else if (evaluation.extraWords.length > 0) {
        feedbackType = 'extra_words';
      }

      const instruction = this.phraseEngine.getFeedback(
        feedbackType,
        {
          surahName: this.surahName,
          ayahNumber: currentAyah.numberInSurah,
          word: wordContext,
        },
        this.teacherLanguage === 'ar' ? 'ar' : 'en'
      );

      evaluation.spokenFeedbackInstructionAr = instruction;
      evaluation.spokenFeedbackInstruction = instruction;
      this.callbacks.onAyahEvaluated(evaluation);

      await this.speakTeacher(instruction);

      // Return to listening for their retry
      this.resumeListening();
    }
  }

  /**
   * Teacher opening greeting at start of lesson
   */
  private async startOpeningGreeting() {
    const currentAyah = this.ayahs[this.currentAyahIndex];
    if (!currentAyah) return;

    let greetingText = '';
    if (this.teacherLanguage === 'ar') {
      if (this.mode === 'learn') {
        greetingText = `السَّلامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ. نَبْدَأُ سُورَةَ ${this.surahName}، مِنَ الآيَةِ ${currentAyah.numberInSurah}. تَفَضَّلْ بِالتِّلَاوَةِ حِينَ تَكُونُ مُسْتَعِدًّا.`;
      } else if (this.mode === 'practice') {
        greetingText = `السَّلامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ. جَلْسَةُ تَدْرِيبٍ لِسُورَةِ ${this.surahName}. ابْدَأْ تِلَاوَتَكَ بِهُدُوءٍ.`;
      } else {
        greetingText = `السَّلامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ. جَلْسَةُ مُرَاجَعَةٍ لِسُورَةِ ${this.surahName}. لِنُثَبِّتَ حِفْظَكَ بِإِتْقَانٍ. تَفَضَّلْ بِالتِّلَاوَةِ.`;
      }
    } else {
      if (this.mode === 'learn') {
        greetingText = `Assalamu alaikum. Let's begin Surah ${this.surahName}, Ayah ${currentAyah.numberInSurah}. Take your time, recite when ready.`;
      } else if (this.mode === 'practice') {
        greetingText = `Assalamu alaikum. Practice session for Surah ${this.surahName}, Ayahs ${this.ayahs[0].numberInSurah} to ${this.ayahs[this.ayahs.length - 1].numberInSurah}. Begin your recitation.`;
      } else {
        greetingText = `Assalamu alaikum. Revision session for Surah ${this.surahName}. Let's strengthen your recitation. Begin when ready.`;
      }
    }

    await this.speakTeacher(greetingText);
    this.resumeListening();
  }

  /**
   * Prompts the current Ayah when advancing
   */
  private async promptCurrentAyah() {
    const currentAyah = this.ayahs[this.currentAyahIndex];
    if (!currentAyah) return;

    // In learn mode, give a gentle cue for the next ayah using varied caring phrase
    if (this.mode === 'learn') {
      const cue = this.phraseEngine.getFeedback(
        'cue_next_ayah',
        {
          surahName: this.surahName,
          nextAyahNumber: currentAyah.numberInSurah,
        },
        this.teacherLanguage === 'ar' ? 'ar' : 'en'
      );
      await this.speakTeacher(cue);
    }
    this.resumeListening();
  }

  /**
   * Speaks teacher instruction using high quality neural studio speech (Gemini TTS with Fenrir/Kore)
   * with fallback to Web Speech API.
   */
  public async speakTeacher(text: string): Promise<void> {
    this.lastSpokenInstruction = text;
    this.callbacks.onTeacherSpeech(text);

    if (this.isMuted) {
      // Simulated speaking delay so user can read message comfortably
      this.transitionState('ai_speaking');
      await new Promise((r) => setTimeout(r, Math.min(2200, Math.max(900, text.length * 50))));
      return;
    }

    this.transitionState('ai_speaking');
    this.pauseListening();

    // 1. First attempt highest-quality Neural Studio TTS via /api/tts
    try {
      const cacheKey = `${this.teacherVoice}:${text.trim()}`;
      let audioUrl = teacherAudioCache.get(cacheKey);

      if (!audioUrl) {
        const response = await fetch(getApiUrl('/api/tts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: this.teacherVoice }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.wavUrl) {
            audioUrl = data.wavUrl;
            teacherAudioCache.set(cacheKey, audioUrl);
          } else if (data.audio) {
            audioUrl = `data:audio/wav;base64,${data.audio}`;
            teacherAudioCache.set(cacheKey, audioUrl);
          }
        }
      }

      if (audioUrl) {
        await new Promise<void>((resolve) => {
          this.stopSpeaking();
          const audio = new Audio(audioUrl);
          this.currentAudioElement = audio;

          audio.onended = () => {
            this.currentAudioElement = null;
            resolve();
          };

          audio.onerror = () => {
            this.currentAudioElement = null;
            resolve();
          };

          audio.play().catch(() => {
            this.currentAudioElement = null;
            resolve();
          });
        });
        return;
      }
    } catch (e) {
      console.warn('[QuranTeacherVoice] Neural TTS fetch failed, falling back to Web Speech:', e);
    }

    // 2. Fallback to browser Web Speech Synthesis if neural API was unreachable
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
        const englishCalmVoice = voices.find(
          (v) => v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en')
        );

        const isArabic = /[\u0600-\u06FF]/.test(text);
        if (isArabic && arabicVoice) {
          utterance.voice = arabicVoice;
          utterance.lang = 'ar-SA';
        } else if (englishCalmVoice) {
          utterance.voice = englishCalmVoice;
        }

        utterance.onend = () => {
          this.activeUtterance = null;
          resolve();
        };

        utterance.onerror = () => {
          this.activeUtterance = null;
          resolve();
        };

        this.activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(resolve, 1500);
      }
    });
  }

  /**
   * Stops current teacher speech
   */
  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    this.activeUtterance = null;
  }

  /**
   * Resumes listening to student recitation
   */
  private resumeListening() {
    this.transitionState('listening');
    this.currentTranscript = '';
    this.lastSpeechTimestamp = Date.now();
    this.isUserSpeaking = false;

    if (this.recognition && !this.isRecognitionRunning) {
      try {
        this.recognition.start();
      } catch {
        // ignore already started
      }
    }
  }

  /**
   * Pauses microphone listening during teacher speech or manual pause
   */
  private pauseListening() {
    if (this.recognition && this.isRecognitionRunning) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  /**
   * User manual repeat of teacher instruction
   */
  public async repeatTeacherInstruction() {
    if (this.lastSpokenInstruction) {
      await this.speakTeacher(this.lastSpokenInstruction);
      this.resumeListening();
    }
  }

  /**
   * User manual repeat of current Ayah
   */
  public async repeatCurrentAyah() {
    const currentAyah = this.ayahs[this.currentAyahIndex];
    if (!currentAyah) return;
    this.currentTranscript = '';
    const msg =
      this.teacherLanguage === 'ar'
        ? `لَا بَأْسَ يَا بُنَيّ؛ لِنُعِدِ الآيَةَ ${currentAyah.numberInSurah} بِرِفْقٍ وَتُؤَدَة، خُذْ نَفَسًا وَتَفَضَّلْ بِالتِّلَاوَة.`
        : `Let's repeat Ayah ${currentAyah.numberInSurah} with calm focus. Take a gentle breath and recite when ready.`;
    await this.speakTeacher(msg);
    this.resumeListening();
  }

  /**
   * Manual pause / resume lesson
   */
  public togglePauseLesson() {
    if (this.state === 'paused') {
      this.resumeListening();
    } else {
      this.stopSpeaking();
      this.pauseListening();
      this.transitionState('paused');
    }
  }

  /**
   * Transitions controller state and notifies callbacks
   */
  private transitionState(newState: QuranTeacherState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Clean termination of audio streams, recognition, and intervals
   */
  public destroy() {
    this.stopSpeaking();
    this.pauseListening();
    if (this.silenceCheckTimer) clearTimeout(this.silenceCheckTimer);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.recognition = null;
    this.transitionState('idle');
  }
}
