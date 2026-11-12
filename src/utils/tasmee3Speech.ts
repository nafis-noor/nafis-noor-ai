import { Ayah, Surah } from '../types';
import {
  matchRecitationToVerses,
  detectSpokenSurahAcrossQuran,
  Tasmee3MatchResult,
} from './tasmee3Matcher';
import { generateRangeReview, Tasmee3RangeResult } from './tasmee3Analysis';

export type Tasmee3Status =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'unsupported'
  | 'listening'
  | 'paused'
  | 'stopped'
  | 'finished';

export interface Tasmee3SessionSummary {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  startingVerse: number;
  finalVerse: number;
  totalVersesCovered: number;
  durationSeconds: number;
  rangeResult?: Tasmee3RangeResult;
}

export interface Tasmee3Callbacks {
  onStatusChange: (status: Tasmee3Status) => void;
  onPositionUpdate: (verseNumber: number, result: Tasmee3MatchResult) => void;
  onSurahDetected?: (surah: Surah, ayahNumber: number) => void;
  onUncertain: (message: string) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: string) => void;
  onSpokenText?: (text: string) => void;
  onSilenceWaiting?: (isWaiting: boolean) => void;
  onRangeFinished?: (result: Tasmee3RangeResult) => void;
}

export class Tasmee3Controller {
  private status: Tasmee3Status = 'idle';
  private surahNumber = 1;
  private surahName = '';
  private surahEnglishName = '';
  private startingVerse = 1;
  private toVerse = 1;
  private currentVerse = 1;
  private verses: Ayah[] = [];
  private callbacks: Tasmee3Callbacks;

  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // Speech Recognition
  private recognition: any = null;
  private isSpeechSupported = false;
  private shouldBeListening = false;
  private recentSpokenAccumulator = '';

  // Accumulate spoken transcript chunks by ayah number for deep analysis
  private spokenByAyah: Map<number, string[]> = new Map();

  // Silence tolerance tracking (waiting state, not aborting)
  private lastSpeechTimestamp = 0;
  private silenceCheckInterval: any = null;
  private isWaitingForUser = false;

  // Fallback MediaRecorder for environments without Web Speech API
  private mediaRecorder: MediaRecorder | null = null;
  private recorderIntervalId: any = null;

  // Timing
  private startTime = 0;
  private totalElapsedSeconds = 0;
  private lastResumeTime = 0;

  constructor(callbacks: Tasmee3Callbacks) {
    this.callbacks = callbacks;
    this.checkBrowserSupport();
  }

  private checkBrowserSupport(): boolean {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.isSpeechSupported = !!SpeechRec;
    return this.isSpeechSupported;
  }

  public getStatus(): Tasmee3Status {
    return this.status;
  }

  public getCurrentVerse(): number {
    return this.currentVerse;
  }

  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Start or initialize a Tasmee3 recitation listening session
   */
  public async start(params: {
    surahNumber: number;
    surahName: string;
    surahEnglishName: string;
    startingVerse: number;
    toVerse?: number;
    verses: Ayah[];
  }): Promise<boolean> {
    this.surahNumber = params.surahNumber;
    this.surahName = params.surahName;
    this.surahEnglishName = params.surahEnglishName;
    this.startingVerse = Math.max(1, params.startingVerse);
    this.toVerse = params.toVerse || params.verses.length || this.startingVerse;
    this.currentVerse = this.startingVerse;
    this.verses = params.verses;
    this.recentSpokenAccumulator = '';
    this.spokenByAyah = new Map();
    this.totalElapsedSeconds = 0;
    this.lastSpeechTimestamp = Date.now();
    this.isWaitingForUser = false;

    // 1. Check microphone permission and request stream
    this.setStatus('requesting_permission');

    try {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        });
      } catch (e1) {
        // Fallback to basic audio constraint
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn('[Tasmee3] Microphone access denied or failed:', err);
      this.setStatus('permission_denied');
      if (this.callbacks.onError) {
        const isNotReadable = err?.name === 'NotReadableError' || (err?.message && err.message.includes('Could not start audio source'));
        this.callbacks.onError(
          isNotReadable
            ? 'Microphone is currently in use or unavailable. Please check your audio device or try again.'
            : 'Microphone permission was not granted. Please allow microphone access to use Tasmee3.'
        );
      }
      return false;
    }

    // 2. Setup Audio Visualizer
    this.setupAudioVisualizer();

    // 3. Start timing
    this.startTime = Date.now();
    this.lastResumeTime = this.startTime;
    this.shouldBeListening = true;

    // 4. Setup silence patience watcher (waits gracefully when user pauses)
    this.startSilenceWatcher();

    // 5. Start speech recognition engine
    if (this.checkBrowserSupport()) {
      this.initNativeSpeechRecognition();
    } else {
      // Fallback audio recorder chunk pipeline
      this.initMediaRecorderFallback();
    }

    this.setStatus('listening');
    return true;
  }

  /**
   * Watches for silence pauses: when the user pauses for a few seconds to breathe or recall,
   * it gently informs the UI to show "Listening... Take your time", NOT assuming finished.
   */
  private startSilenceWatcher() {
    if (this.silenceCheckInterval) clearInterval(this.silenceCheckInterval);
    this.silenceCheckInterval = setInterval(() => {
      if (this.status !== 'listening' || !this.shouldBeListening) return;
      const elapsedSinceSpeech = Date.now() - this.lastSpeechTimestamp;
      if (elapsedSinceSpeech > 3500 && !this.isWaitingForUser) {
        this.isWaitingForUser = true;
        if (this.callbacks.onSilenceWaiting) {
          this.callbacks.onSilenceWaiting(true);
        }
      }
    }, 1000);
  }

  private dataArray: Uint8Array | null = null;

  /**
   * Setup AudioContext & AnalyserNode for live visual feedback
   */
  private setupAudioVisualizer() {
    if (!this.mediaStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.7;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.startVisualizerLoop();
    } catch (err) {
      console.warn('[Tasmee3] Visualizer audio context setup failed:', err);
    }
  }

  /**
   * Runs the audio visualizer requestAnimationFrame loop
   */
  private startVisualizerLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const updateLevel = () => {
      if (!this.analyser || !this.dataArray || this.status !== 'listening' || !this.shouldBeListening) {
        if (this.callbacks.onAudioLevel) this.callbacks.onAudioLevel(0);
        return;
      }

      this.analyser.getByteFrequencyData(this.dataArray);
      const bufferLength = this.dataArray.length;
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / bufferLength;
      // Normalizing with responsive dynamic range
      const normalized = Math.min(1, Math.max(0, avg / 80));

      if (this.callbacks.onAudioLevel) {
        this.callbacks.onAudioLevel(normalized);
      }

      this.animFrameId = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  /**
   * Setup native Web Speech Recognition for Arabic (ar-SA)
   */
  private initNativeSpeechRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'ar-SA';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;

      this.recognition.onresult = (event: any) => {
        if (!this.shouldBeListening || this.status !== 'listening') return;

        this.lastSpeechTimestamp = Date.now();
        if (this.isWaitingForUser) {
          this.isWaitingForUser = false;
          if (this.callbacks.onSilenceWaiting) {
            this.callbacks.onSilenceWaiting(false);
          }
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += ' ' + transcript;
          } else {
            interimTranscript += ' ' + transcript;
          }
        }

        const currentSpoken = (finalTranscript || interimTranscript).trim();
        if (!currentSpoken) return;

        // Record spoken snippet for current verse
        const existingList = this.spokenByAyah.get(this.currentVerse) || [];
        existingList.push(currentSpoken);
        this.spokenByAyah.set(this.currentVerse, existingList);

        if (this.callbacks.onSpokenText) {
          this.callbacks.onSpokenText(currentSpoken);
        }

        this.recentSpokenAccumulator = `${this.recentSpokenAccumulator} ${currentSpoken}`.trim();
        // Keep accumulator within manageable bounds (last ~25 words)
        const words = this.recentSpokenAccumulator.split(' ');
        if (words.length > 25) {
          this.recentSpokenAccumulator = words.slice(-20).join(' ');
        }

        // Run matcher against current verse and candidate progression
        this.processSpokenText(currentSpoken);
      };

      this.recognition.onerror = (event: any) => {
        // Ignore normal abort / no-speech errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('[Tasmee3] Speech recognition notice:', event.error);
      };

      this.recognition.onend = () => {
        // Automatic restart if still in listening state (browser speech engines time out after silence)
        if (this.shouldBeListening && this.status === 'listening') {
          try {
            this.recognition?.start();
          } catch {
            // Already started or restarting
          }
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[Tasmee3] Failed to start native speech recognition:', err);
    }
  }

  /**
   * Process spoken text through the Quran matcher:
   * 1. First checks if the user is reciting in the current Surah.
   * 2. If not in the current Surah, detects which Surah across all 114 Surahs the user is reciting
   *    (e.g., opened Surah Al-Kafirun but recited Surah Al-Masad) and switches to it!
   */
  private processSpokenText(text: string) {
    if (!text) return;

    if (this.verses.length > 0) {
      const result = matchRecitationToVerses({
        spokenText: text,
        candidateVerses: this.verses,
        currentVerseNumber: this.currentVerse,
        windowBack: 1,
        windowForward: 4,
      });

      if (!result.isUncertain && result.matchedVerseNumber !== null) {
        const matched = result.matchedVerseNumber;
        this.currentVerse = matched;
        this.callbacks.onPositionUpdate(matched, result);

        if (this.toVerse && matched >= this.toVerse) {
          setTimeout(() => {
            if (this.shouldBeListening && this.status === 'listening') {
              const rangeResult = this.generateSessionRangeResult();
              if (this.callbacks.onRangeFinished) {
                this.callbacks.onRangeFinished(rangeResult);
              }
            }
          }, 2000);
        }
        return;
      }
    }

    // Check if the user is reciting a DIFFERENT Surah (e.g. opened Al-Kafirun, reciting Al-Masad!)
    const crossSurahMatch =
      detectSpokenSurahAcrossQuran(text, this.surahNumber) ||
      detectSpokenSurahAcrossQuran(this.recentSpokenAccumulator, this.surahNumber);

    if (crossSurahMatch) {
      const { surah, ayahNumber } = crossSurahMatch;
      this.surahNumber = surah.number;
      this.surahName = surah.name;
      this.surahEnglishName = surah.englishName;
      this.startingVerse = 1;
      this.toVerse = surah.numberOfAyahs;
      this.currentVerse = ayahNumber;
      if (surah.sampleAyahs && surah.sampleAyahs.length > 0) {
        this.verses = surah.sampleAyahs;
      }
      this.callbacks.onSurahDetected?.(surah, ayahNumber);
      this.callbacks.onPositionUpdate(ayahNumber, {
        matchedVerseNumber: ayahNumber,
        confidence: 'high',
        confidenceScore: 0.92,
        isUncertain: false,
        matchedWordsCount: 3,
      });
      return;
    }

    this.callbacks.onUncertain(
      "We’re not sure where you are. Please continue or repeat the verse."
    );
  }

  /**
   * Fallback for browsers lacking Web Speech API: Record 4s audio chunks and send to server
   */
  private initMediaRecorderFallback() {
    if (!this.mediaStream) return;
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '',
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && this.shouldBeListening && this.status === 'listening') {
          audioChunks.push(e.data);
          const blob = new Blob(audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          audioChunks.length = 0;
          await this.sendAudioChunkForMatching(blob);
        }
      };

      // Slice audio every 2.5 seconds for fast recitation tracking
      this.mediaRecorder.start(2500);
    } catch (err) {
      console.warn('[Tasmee3] MediaRecorder fallback initialization error:', err);
    }
  }

  /**
   * Send recorded audio slice to server endpoint
   */
  private async sendAudioChunkForMatching(blob: Blob) {
    if (!this.shouldBeListening || this.status !== 'listening') return;

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      if (!audioBase64) return;

      const candidateVerses = this.verses
        .filter(v => v.numberInSurah >= Math.max(1, this.currentVerse - 1) && v.numberInSurah <= this.currentVerse + 4)
        .map(v => ({ numberInSurah: v.numberInSurah, text: v.text }));

      const res = await fetch('/api/tasmee3/match-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          surahNumber: this.surahNumber,
          surahName: this.surahName,
          candidateVerses,
          currentVerseNumber: this.currentVerse,
        }),
      });

      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const { detectedVerseNumber, isUncertain, message, transcribedText } = json.data;

        if (transcribedText) {
          const existingList = this.spokenByAyah.get(this.currentVerse) || [];
          existingList.push(transcribedText);
          this.spokenByAyah.set(this.currentVerse, existingList);
          if (this.callbacks.onSpokenText) {
            this.callbacks.onSpokenText(transcribedText);
          }
        }

        if (isUncertain || detectedVerseNumber === null) {
          this.callbacks.onUncertain(
            message || "We’re not sure where you are. Please continue or repeat the verse."
          );
        } else if (detectedVerseNumber >= this.currentVerse) {
          this.currentVerse = detectedVerseNumber;
          this.callbacks.onPositionUpdate(detectedVerseNumber, {
            matchedVerseNumber: detectedVerseNumber,
            confidence: json.data.confidence || 'high',
            confidenceScore: 0.9,
            isUncertain: false,
            matchedWordsCount: 3,
          });

          if (this.toVerse && detectedVerseNumber >= this.toVerse) {
            setTimeout(() => {
              if (this.shouldBeListening && this.status === 'listening') {
                const rangeResult = this.generateSessionRangeResult();
                if (this.callbacks.onRangeFinished) {
                  this.callbacks.onRangeFinished(rangeResult);
                }
              }
            }, 2000);
          }
        }
      }
    } catch (err) {
      console.warn('[Tasmee3] Server chunk matching error:', err);
    }
  }

  /**
   * Pause listening
   */
  public pause() {
    if (this.status !== 'listening') return;
    this.shouldBeListening = false;
    this.totalElapsedSeconds += Math.floor((Date.now() - this.lastResumeTime) / 1000);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause();
      } catch {
        // ignore
      }
    }

    this.setStatus('paused');
  }

  /**
   * Resume listening
   */
  public resume() {
    if (this.status !== 'paused') return;
    this.shouldBeListening = true;
    this.lastResumeTime = Date.now();
    this.lastSpeechTimestamp = Date.now();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    this.startVisualizerLoop();

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {
        // ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      try {
        this.mediaRecorder.resume();
      } catch {
        // ignore
      }
    }

    this.setStatus('listening');
  }

  /**
   * Stop session completely and guarantee microphone hardware is released
   */
  public stop() {
    this.shouldBeListening = false;
    if (this.status === 'listening') {
      this.totalElapsedSeconds += Math.floor((Date.now() - this.lastResumeTime) / 1000);
    }

    this.cleanupMicrophone();
    this.setStatus('stopped');
  }

  /**
   * Generates comprehensive range analysis review
   */
  public generateSessionRangeResult(): Tasmee3RangeResult {
    return generateRangeReview({
      surahNumber: this.surahNumber,
      surahName: this.surahName,
      surahEnglishName: this.surahEnglishName,
      fromAyah: this.startingVerse,
      toAyah: this.toVerse,
      allAyahs: this.verses,
      spokenByAyah: this.spokenByAyah,
      finalReachedVerse: this.currentVerse,
      durationSeconds: Math.max(1, this.totalElapsedSeconds),
    });
  }

  /**
   * Finish session and return summary with deep range analysis
   */
  public finish(): Tasmee3SessionSummary {
    this.shouldBeListening = false;
    if (this.status === 'listening') {
      this.totalElapsedSeconds += Math.floor((Date.now() - this.lastResumeTime) / 1000);
    }

    const rangeResult = this.generateSessionRangeResult();

    this.cleanupMicrophone();
    this.setStatus('finished');

    const totalCovered = Math.max(1, this.currentVerse - this.startingVerse + 1);

    return {
      surahNumber: this.surahNumber,
      surahName: this.surahName,
      surahEnglishName: this.surahEnglishName,
      startingVerse: this.startingVerse,
      finalVerse: this.currentVerse,
      totalVersesCovered: totalCovered,
      durationSeconds: Math.max(1, this.totalElapsedSeconds),
      rangeResult,
    };
  }

  /**
   * Guaranteed release of microphone hardware
   */
  private cleanupMicrophone() {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    // 1. Stop SpeechRecognition
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    // 2. Stop MediaRecorder
    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch {
        // ignore
      }
      this.mediaRecorder = null;
    }

    // 3. Cancel animation frame
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // 4. Close AudioContext
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    // 5. STOP ALL MEDIA STREAM TRACKS (Hardware light turns off)
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('[Tasmee3] Error stopping tracks:', e);
      }
      this.mediaStream = null;
    }

    if (this.callbacks.onAudioLevel) {
      this.callbacks.onAudioLevel(0);
    }
  }

  private setStatus(newStatus: Tasmee3Status) {
    this.status = newStatus;
    this.callbacks.onStatusChange(newStatus);
  }
}

