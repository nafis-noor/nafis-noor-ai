import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  PanelRightClose,
  Copy,
  Check,
  Eye,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Palette,
} from 'lucide-react';
import { Ayah, Surah } from '../types';
import { ALL_SURAHS } from '../data/quranData';
import {
  MadaniAyahOrnament,
  toEasternArabicNumerals,
  getActiveSpokenWordIndex,
  WordSegmentTiming,
} from './MadaniAyahOrnament';
import {
  renderWordWithTajweed,
  TAJWEED_LEGEND_ITEMS,
} from '../utils/tajweedHighlighter';

interface MadaniMushafBookViewProps {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onDetectSurahChange?: (surah: Surah, ayahNumber?: number) => void;
  isDark: boolean;
  isArabic: boolean;
  onAyahTextClick: (ayah: Ayah, surah: Surah) => void;
  onAyahNumberClick: (ayah: Ayah, surah: Surah) => void;
  playingAyahNumber?: number | null;
  playingSurahNumber?: number | null;
  isPlaying?: boolean;
  playbackProgress?: number;
  wordSegmentsByAyah?: Record<number, WordSegmentTiming[]>;
  enableTajweedColors?: boolean;
  onToggleTajweedColors?: (enabled: boolean) => void;
}

interface MushafLineItem {
  type: 'word' | 'end';
  id: string;
  text: string;
  wordPosition: number;      // 1-indexed position inside the Ayah
  totalWordsInAyah: number;
  pageWordIndex: number;     // 0-indexed word position across the entire Mushaf page (-1 for 'end')
  ayah: Ayah;
  surah: Surah;
  lineNumber: number;
}

/**
 * Normalizes Uthmani or standard Arabic word for Tarteel-style recitation matching.
 */
function normalizeArabicWordForRevision(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    // Strip Quranic stop marks, rub el hizb, small high/low letters, sajdah, dagger alif
    .replace(/[\u06D6-\u06ED\u06DD\u06DE\u06E9\u0600-\u0605\uFD3E\uFD3F\u0670]/g, '')
    // Strip Tashkeel / Harakat / Maddah
    .replace(/[\u064B-\u065F\u0653-\u0655\u08F0-\u08F3]/g, '')
    // Strip Tatweel
    .replace(/\u0640/g, '')
    // Unify Alif variants (أ إ آ ٱ -> ا)
    .replace(/[أإآٱ\u0671]/g, 'ا')
    // Unify Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Unify Alif Maqsurah (ى -> ي)
    .replace(/ى/g, 'ي')
    // Unify Hamza carriers (ؤ ئ -> ء)
    .replace(/[ؤئ]/g, 'ء')
    // Keep only Arabic letters
    .replace(/[^\u0621-\u063A\u0641-\u064A]/g, '')
    .trim();

  // Unify joined vocatives so Uthmani (يَـٰٓأَيُّهَا) and Imla'i/ASR (ياايها) match identically
  return cleaned
    .replace(/^ياايها$/, 'يايها')
    .replace(/^ياايتها$/, 'يايتها')
    .replace(/^وياايها$/, 'ويايها')
    .replace(/^هاانتم$/, 'هانتم')
    .replace(/^يااهل$/, 'ياهل')
    .replace(/^يابني$/, 'يابني')
    .replace(/^ياقوم$/, 'ياقوم')
    .replace(/^ياادم$/, 'ياادم')
    .replace(/^ياعبادي$/, 'ياعبادي');
}

/**
 * Compacts split two-word Arabic vocative particles (e.g. ["يا", "ايها"] -> ["يايها"])
 * so that 1-word Uthmani tokens and 2-word Imla'i/ASR tokens align 1-to-1.
 */
function compactVocativeTokens(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    if (curr === 'يا' && next) {
      if (next === 'ايها') {
        result.push('يايها');
        i++;
        continue;
      }
      if (next === 'ايتها') {
        result.push('يايتها');
        i++;
        continue;
      }
      if (next === 'اهل') {
        result.push('ياهل');
        i++;
        continue;
      }
      if (next === 'بني') {
        result.push('يابني');
        i++;
        continue;
      }
      if (next === 'قوم') {
        result.push('ياقوم');
        i++;
        continue;
      }
      if (next === 'ادم') {
        result.push('ياادم');
        i++;
        continue;
      }
      if (next === 'عبادي') {
        result.push('ياعبادي');
        i++;
        continue;
      }
    }
    if (curr === 'ها' && next === 'انتم') {
      result.push('هانتم');
      i++;
      continue;
    }
    result.push(curr);
  }
  return result;
}

/**
 * Strictly strips ONLY Isti'adhah ("أعوذ بالله من الشيطان الرجيم") and Basmalah ("بسم الله الرحمن الرحيم")
 * from the spoken token stream while preserving Quranic verses that contain words like "أعوذ" (Al-Falaq/An-Nas)
 * or "الله" / "الرحمن" / "الرحيم".
 */
function stripIstiAdhahAndBasmalah(rawWords: string[], isLockedOn: boolean): string[] {
  const normTokens = compactVocativeTokens(
    rawWords.map(normalizeArabicWordForRevision).filter(Boolean)
  );
  const filtered: string[] = [];

  let i = 0;
  while (i < normTokens.length) {
    const w = normTokens[i];
    const prev = i > 0 ? normTokens[i - 1] : '';
    const next = i + 1 < normTokens.length ? normTokens[i + 1] : '';

    // 1. Check for Isti'adhah ("أعوذ بالله من الشيطان الرجيم")
    // Do NOT strip "أعوذ" if preceded by "قل" / "اني" or followed by "برب" / "بربك" (e.g. Surah Al-Falaq & An-Nas!)
    if (w === 'اعوذ') {
      const isQuranicAyahUse =
        prev === 'قل' ||
        prev === 'اني' ||
        prev === 'واني' ||
        prev === 'فاني' ||
        next === 'برب' ||
        next === 'بربك';

      if (!isQuranicAyahUse) {
        i++;
        const istiTail = ['بالله', 'من', 'الشيطان', 'الرجيم'];
        while (i < normTokens.length && istiTail.includes(normTokens[i])) {
          i++;
        }
        continue;
      }
    }

    // Strip trailing fragments of Isti'adhah if ASR started mid-phrase
    if (
      (w === 'بالله' && next === 'من' && normTokens[i + 2] === 'الشيطان') ||
      (w === 'من' && next === 'الشيطان' && normTokens[i + 2] === 'الرجيم') ||
      (w === 'الشيطان' && next === 'الرجيم') ||
      (w === 'الرجيم' && (prev === 'الشيطان' || filtered.length === 0)) ||
      (w === 'الشيطان' && filtered.length === 0 && (next === '' || next === 'الرجيم'))
    ) {
      i++;
      const istiTail = ['من', 'الشيطان', 'الرجيم'];
      while (i < normTokens.length && istiTail.includes(normTokens[i])) {
        i++;
      }
      continue;
    }

    // 2. Check for Basmalah ("بسم الله الرحمن الرحيم")
    // Do NOT strip "بسم" if followed by "ربك" (e.g. "اقرأ باسم ربك" or "فسبح باسم ربك")
    if (w === 'بسم' && next !== 'ربك') {
      i++;
      const basmalahTail = ['الله', 'الرحمن', 'الرحيم'];
      while (i < normTokens.length && basmalahTail.includes(normTokens[i])) {
        i++;
      }
      continue;
    }

    // Strip partial Basmalah if ASR clipped "بسم" at the start ("الله الرحمن الرحيم" or "الرحمن الرحيم" before lock-on)
    if (w === 'الله' && next === 'الرحمن' && normTokens[i + 2] === 'الرحيم') {
      i += 3;
      continue;
    }
    if (!isLockedOn && filtered.length === 0 && w === 'الرحمن' && next === 'الرحيم') {
      i += 2;
      continue;
    }

    filtered.push(w);
    i++;
  }

  return filtered;
}

/**
 * Computes the consonantal skeleton of a normalized Arabic word so Uthmani orthography
 * (e.g. ٱلْعَـٰلَمِينَ / العلمين vs العالمين, ٱلصَّلَوٰةَ / الصلوه vs الصلاه, ٱلرَّحْمَـٰنِ vs الرحمان)
 * matches spoken ASR output with zero wild guessing.
 */
function getConsonantalSkeleton(normWord: string): string {
  if (!normWord) return '';
  if (normWord.length <= 2) return normWord;
  const prefix = normWord.startsWith('ال') ? 'ال' : normWord[0];
  const rest = normWord.slice(prefix.length).replace(/[اويء]/g, '');
  return prefix + rest;
}

/**
 * Strict, high-precision check whether a spoken Arabic word matches the target Uthmani word.
 * Never guesses unrelated words.
 */
function isQuranWordMatch(uthmaniWord: string, spokenWord: string): boolean {
  const normUthmani = normalizeArabicWordForRevision(uthmaniWord);
  const normSpoken = normalizeArabicWordForRevision(spokenWord);
  if (!normUthmani || !normSpoken) return false;

  if (normUthmani === normSpoken) return true;

  // Handle Uthmani waw/yaa before taa marbuta (الصلوة -> الصلوه vs الصلاه, الزكوة -> الزكوه vs الزكاه)
  const unifyUthmaniWawTaa = (w: string) => w.replace(/وه$/, 'اه').replace(/يه$/, 'اه');
  if (unifyUthmaniWawTaa(normUthmani) === unifyUthmaniWawTaa(normSpoken)) return true;

  // Handle optional leading conjunction 'و' or 'ف' only on longer words (length >= 4)
  const stripLeadingConj = (w: string) =>
    w.length >= 4 && (w.startsWith('و') || w.startsWith('ف')) ? w.slice(1) : w;
  if (stripLeadingConj(normUthmani) === stripLeadingConj(normSpoken)) return true;

  // Consonantal skeleton match (handles Uthmani omitted medial Alif like العلمين vs العالمين, الكفرون vs الكافرون, ملك vs مالك)
  const skelU = getConsonantalSkeleton(normUthmani);
  const skelS = getConsonantalSkeleton(normSpoken);
  if (skelU.length >= 2 && skelU === skelS) return true;
  if (
    skelU.length >= 3 &&
    stripLeadingConj(skelU) === stripLeadingConj(skelS)
  ) {
    return true;
  }

  return false;
}

/**
 * Finds a Surah across all 114 Surahs ONLY when 3 consecutive spoken words match
 * (or when the user explicitly says "سورة <Name>"). Never guesses on 1 or 2 words!
 */
function findMatchingSurahByThreeWords(spokenNormTokens: string[]): {
  surah: Surah;
  ayahNumber: number;
} | null {
  if (!spokenNormTokens.length) return null;

  // 1. Explicit Surah name command (e.g. "سورة الكافرون" or "سورة المسد")
  const joinedSpoken = spokenNormTokens.join(' ');
  for (const s of ALL_SURAHS) {
    const normSurahName = normalizeArabicWordForRevision(s.name);
    if (!normSurahName) continue;
    if (joinedSpoken.includes(`سوره ${normSurahName}`)) {
      return { surah: s, ayahNumber: 1 };
    }
  }

  // 2. Require at least 3 consecutive spoken words to detect and switch Surahs
  if (spokenNormTokens.length < 3) return null;

  const threeWordPhrase = spokenNormTokens.slice(-3);
  let bestMatch: { surah: Surah; ayahNumber: number; score: number } | null = null;

  for (const s of ALL_SURAHS) {
    if (!s.sampleAyahs || s.sampleAyahs.length === 0) continue;

    // Build continuous word stream across sampleAyahs of this Surah so short 1-2 word Ayahs also match 3-word phrases
    const streamWords: { word: string; ayahNumber: number; isFirstWordOfAyah1: boolean }[] = [];
    for (const ayah of s.sampleAyahs) {
      const ayahTokens = compactVocativeTokens(
        String(ayah.text || '')
          .split(/\s+/)
          .map(normalizeArabicWordForRevision)
          .filter(Boolean)
      );
      ayahTokens.forEach((tok, idx) => {
        streamWords.push({
          word: tok,
          ayahNumber: ayah.numberInSurah,
          isFirstWordOfAyah1: ayah.numberInSurah === 1 && idx === 0,
        });
      });
    }

    if (streamWords.length < 3) continue;

    for (let i = 0; i <= streamWords.length - 3; i++) {
      if (
        isQuranWordMatch(streamWords[i].word, threeWordPhrase[0]) &&
        isQuranWordMatch(streamWords[i + 1].word, threeWordPhrase[1]) &&
        isQuranWordMatch(streamWords[i + 2].word, threeWordPhrase[2])
      ) {
        const bonus = streamWords[i].isFirstWordOfAyah1 ? 0.5 : 0;
        const score = 3 + bonus;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            surah: s,
            ayahNumber: streamWords[i].ayahNumber,
            score,
          };
        }
      }
    }
  }

  return bestMatch ? { surah: bestMatch.surah, ayahNumber: bestMatch.ayahNumber } : null;
}

export const MadaniMushafBookView: React.FC<MadaniMushafBookViewProps> = ({
  currentPage,
  onPageChange,
  onDetectSurahChange,
  isDark,
  isArabic,
  onAyahTextClick,
  onAyahNumberClick,
  playingAyahNumber,
  playingSurahNumber,
  isPlaying,
  playbackProgress = 0,
  wordSegmentsByAyah = {},
  enableTajweedColors: externalTajweedColors,
  onToggleTajweedColors,
}) => {
  const [pageData, setPageData] = useState<{
    pageNumber: number;
    juzNumber: number;
    hizbQuarter: number;
    surahsOnPage: any[];
    ayahs: any[];
  } | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [jumperInput, setJumperInput] = useState(String(currentPage));
  const [copiedPage, setCopiedPage] = useState(false);

  // Internal fallback if parent doesn't control enableTajweedColors
  const [internalTajweed, setInternalTajweed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('noor_tajweed_colors') === 'true';
    } catch {
      return false;
    }
  });

  const isTajweedEnabled =
    externalTajweedColors !== undefined ? externalTajweedColors : internalTajweed;

  const handleToggleTajweed = () => {
    const nextVal = !isTajweedEnabled;
    setInternalTajweed(nextVal);
    try {
      localStorage.setItem('noor_tajweed_colors', String(nextVal));
    } catch {
      // ignore
    }
    onToggleTajweedColors?.(nextVal);
  };

  // View mode: 'text' (15-line Madani Mushaf reading) or 'revision' (Tarteel-style memorization revision on the exact same 15-line Mushaf)
  const [viewMode, setViewMode] = useState<'text' | 'revision'>('text');

  // Revision Mode (Tarteel) state
  const [revealedWordIndices, setRevealedWordIndices] = useState<Set<number>>(new Set());
  const [activeCursorIndex, setActiveCursorIndex] = useState<number>(0);
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number>(-1);
  const [detectedSurahBadge, setDetectedSurahBadge] = useState<string>('');
  const [isListeningRevision, setIsListeningRevision] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [lastSpokenPreview, setLastSpokenPreview] = useState<string>('');
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const revealedSetRef = useRef<Set<number>>(new Set());
  const cursorRef = useRef<number>(0);
  const isLockedOnRef = useRef<boolean>(false);
  const unmatchedSpokenBufferRef = useRef<string[]>([]);
  const allPageWordsRef = useRef<MushafLineItem[]>([]);
  const pendingSpokenWordsRef = useRef<string[]>([]);
  const pendingTargetSurahRef = useRef<number | null>(null);
  const lastGlobalSearchTimeRef = useRef<number>(0);

  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const processedTokensByResultRef = useRef<Map<number, number>>(new Map());

  // Fetch 15-line Madani Mushaf (1405 AH) page data
  useEffect(() => {
    setIsLoadingPage(true);
    setJumperInput(String(currentPage));

    // Reset page-level revealed indices when changing page (pendingSpokenWordsRef will be applied once loaded)
    revealedSetRef.current = new Set();
    setRevealedWordIndices(new Set());
    cursorRef.current = 0;
    setActiveCursorIndex(0);
    setLastRevealedIndex(-1);
    isLockedOnRef.current = false;
    unmatchedSpokenBufferRef.current = [];
    processedTokensByResultRef.current.clear();

    let isMounted = true;

    fetch(`/api/quran/page/${currentPage}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.data) {
          setPageData(data.data);
        } else {
          // Direct fallback to Quran.com v4 15-line Madani 1405 API
          fetch(
            `https://api.quran.com/api/v4/verses/by_page/${currentPage}?words=true&mushaf=2&word_fields=text_uthmani,line_number,page_number,location`
          )
            .then((r) => r.json())
            .then((qdc) => {
              if (!isMounted || !qdc?.verses) return;
              const ayahs = qdc.verses.map((v: any) => {
                const [sNumStr, aNumStr] = String(v.verse_key || '1:1').split(':');
                const sNum = Number(sNumStr) || 1;
                const aNum = Number(aNumStr) || 1;
                const surahObj = ALL_SURAHS.find((s) => s.number === sNum) || ALL_SURAHS[0];
                const wordsOnly = (v.words || []).filter((w: any) => w.char_type_name === 'word');
                return {
                  number: v.id || aNum,
                  numberInSurah: aNum,
                  verseKey: v.verse_key,
                  text: wordsOnly.map((w: any) => w.text_uthmani || w.text).join(' '),
                  translation: '',
                  juz: v.juz_number || 1,
                  hizbQuarter: v.rub_el_hizb_number || 1,
                  page: currentPage,
                  words: v.words || [],
                  surah: surahObj,
                };
              });

              const surahsOnPage = Array.from(new Set(ayahs.map((a: any) => a.surah?.number)))
                .map((num) => ALL_SURAHS.find((s) => s.number === num))
                .filter(Boolean);

              setPageData({
                pageNumber: currentPage,
                juzNumber: ayahs[0]?.juz || 1,
                hizbQuarter: ayahs[0]?.hizbQuarter || 1,
                surahsOnPage,
                ayahs,
              });
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.error('Error loading Mushaf page:', err))
      .finally(() => {
        if (isMounted) setIsLoadingPage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const currentSurahOnPage = pageData?.surahsOnPage?.[0] || ALL_SURAHS[0];
  const hizbNumber = Math.ceil((pageData?.hizbQuarter || 1) / 4);

  // Build exact 15-line Madani Mushaf structure (Lines 1..15) + ordered page words for Revision Mode
  const mushafLinesData = useMemo(() => {
    if (!pageData || !pageData.ayahs || pageData.ayahs.length === 0) return null;

    const linesMap = new Map<number, MushafLineItem[]>();
    for (let l = 1; l <= 15; l++) {
      linesMap.set(l, []);
    }

    const surahStartByLine = new Map<number, { surah: Surah; showBismillah: boolean }>();
    const flatWords: MushafLineItem[] = [];
    let hasQdcLineData = false;
    let globalPageWordIdx = 0;

    pageData.ayahs.forEach((ayah: any) => {
      const surahObj =
        ALL_SURAHS.find((s) => s.number === ayah.surah?.number) ||
        ayah.surah ||
        currentSurahOnPage;

      if (Array.isArray(ayah.words) && ayah.words.length > 0) {
        hasQdcLineData = true;
        const wordTokens = ayah.words.filter((w: any) => w.char_type_name !== 'end');
        const totalWords = Math.max(1, wordTokens.length);

        if (ayah.numberInSurah === 1) {
          const firstLine = Number(ayah.words[0]?.line_number) || 1;
          surahStartByLine.set(firstLine, {
            surah: surahObj,
            showBismillah: surahObj.number !== 1 && surahObj.number !== 9,
          });
        }

        let currentWordCounter = 0;
        ayah.words.forEach((w: any, idx: number) => {
          const lineNum = Math.max(1, Math.min(15, Number(w.line_number) || 1));
          const isEndMarker = w.char_type_name === 'end';
          let assignedPageWordIdx = -1;
          if (!isEndMarker) {
            currentWordCounter++;
            assignedPageWordIdx = globalPageWordIdx++;
          }
          const itemObj: MushafLineItem = {
            type: isEndMarker ? 'end' : 'word',
            id: `${surahObj.number}:${ayah.numberInSurah}:${idx}`,
            text: w.text_uthmani || w.text || '',
            wordPosition: currentWordCounter,
            totalWordsInAyah: totalWords,
            pageWordIndex: assignedPageWordIdx,
            ayah,
            surah: surahObj,
            lineNumber: lineNum,
          };
          if (!isEndMarker) {
            flatWords.push(itemObj);
          }
          const bucket = linesMap.get(lineNum) || [];
          bucket.push(itemObj);
          linesMap.set(lineNum, bucket);
        });
      }
    });

    // Offline fallback distribution across 15 lines
    if (!hasQdcLineData) {
      const allItems: Omit<MushafLineItem, 'lineNumber'>[] = [];
      pageData.ayahs.forEach((ayah: any) => {
        const surahObj =
          ALL_SURAHS.find((s) => s.number === ayah.surah?.number) ||
          ayah.surah ||
          currentSurahOnPage;
        const rawWords = String(ayah.text || '').split(/\s+/).filter(Boolean);
        rawWords.forEach((wordText, wIdx) => {
          const assignedIdx = globalPageWordIdx++;
          allItems.push({
            type: 'word',
            id: `${surahObj.number}:${ayah.numberInSurah}:w${wIdx}`,
            text: wordText,
            wordPosition: wIdx + 1,
            totalWordsInAyah: rawWords.length,
            pageWordIndex: assignedIdx,
            ayah,
            surah: surahObj,
          });
        });
        allItems.push({
          type: 'end',
          id: `${surahObj.number}:${ayah.numberInSurah}:end`,
          text: String(ayah.numberInSurah),
          wordPosition: rawWords.length,
          totalWordsInAyah: rawWords.length,
          pageWordIndex: -1,
          ayah,
          surah: surahObj,
        });
      });

      const targetLines = currentPage <= 2 ? 7 : 15;
      const itemsPerLine = Math.max(1, Math.ceil(allItems.length / targetLines));
      allItems.forEach((it, idx) => {
        const lNum = Math.min(targetLines, Math.floor(idx / itemsPerLine) + 1);
        if (it.ayah.numberInSurah === 1 && it.wordPosition === 1 && it.type === 'word') {
          surahStartByLine.set(lNum, {
            surah: it.surah,
            showBismillah: it.surah.number !== 1 && it.surah.number !== 9,
          });
        }
        const fullItem: MushafLineItem = { ...it, lineNumber: lNum };
        if (fullItem.type === 'word') {
          flatWords.push(fullItem);
        }
        const bucket = linesMap.get(lNum) || [];
        bucket.push(fullItem);
        linesMap.set(lNum, bucket);
      });
    }

    return { linesMap, surahStartByLine, flatWords, totalWords: flatWords.length };
  }, [pageData, currentPage, currentSurahOnPage]);

  /**
   * Focused 3-Word Lock-On & Real-Sheikh Tarteel Recitation Engine:
   * 1. Strictly skips ONLY "أعوذ بالله من الشيطان الرجيم" and "بسم الله الرحمن الرحيم".
   * 2. Does NOT guess or record random words in the currently open Surah if the user is reading another Surah.
   * 3. Waits to hear 3 consecutive words from the user to detect the exact Surah & Ayah (on the current page
   *    or across all 114 Surahs), jumps to that place, reveals those 3 words (and any preceding words in that
   *    Surah/Ayah on the page), and then continues revealing word-by-word in real time like Tarteel!
   */
  const processSpokenTokens = useCallback(
    (spokenWords: string[]) => {
      const pageWords = allPageWordsRef.current;
      if (!spokenWords.length) return;

      // Strip ONLY Isti'adhah and Basmalah phrases & compact vocative particles ("يا أيها" -> "يايها")
      const cleanedSpoken = stripIstiAdhahAndBasmalah(spokenWords, isLockedOnRef.current);
      if (cleanedSpoken.length === 0) return;
      if (!pageWords.length) return;

      let cursor = cursorRef.current;
      let latestRevealed = -1;
      let didRevealOnPage = false;
      const newRevealedSet = new Set(revealedSetRef.current);

      // Helper to reveal words on the current page from the start of the matched Surah/Ayah up to endIdx
      const lockAndRevealOnCurrentPage = (
        matchStartIdx: number,
        matchLen: number,
        revealPrecedingInSurah: boolean
      ) => {
        const matchedItem = pageWords[matchStartIdx];
        if (!matchedItem) return;

        let revealFrom = matchStartIdx;
        if (revealPrecedingInSurah) {
          // Reveal preceding words of this same Surah on the page (e.g. if user skipped Bismillah on Page 1
          // or started at Ayah 2 of that Surah) while leaving other Surahs on the page hidden!
          const targetSurahNum = matchedItem.surah.number;
          while (
            revealFrom > 0 &&
            pageWords[revealFrom - 1].surah.number === targetSurahNum
          ) {
            revealFrom--;
          }
        }

        const endIdx = Math.min(pageWords.length, matchStartIdx + matchLen);
        for (let k = revealFrom; k < endIdx; k++) {
          newRevealedSet.add(k);
          latestRevealed = k;
        }
        cursor = endIdx;
        isLockedOnRef.current = true;
        didRevealOnPage = true;

        const currentAyahItem = pageWords[Math.max(0, endIdx - 1)] || matchedItem;
        if (currentAyahItem?.surah) {
          setDetectedSurahBadge(
            `سورة ${currentAyahItem.surah.name} • آية ${toEasternArabicNumerals(
              currentAyahItem.ayah.numberInSurah
            )}`
          );
          onDetectSurahChange?.(
            currentAyahItem.surah,
            currentAyahItem.ayah.numberInSurah
          );
        }
      };

      // Process incoming tokens
      for (let tIdx = 0; tIdx < cleanedSpoken.length; tIdx++) {
        const normSpoken = cleanedSpoken[tIdx];

        // ---------------------------------------------------------------------
        // CASE A: Already locked onto a verse on this page -> Follow word-by-word like Tarteel!
        // ---------------------------------------------------------------------
        if (isLockedOnRef.current && cursor < pageWords.length) {
          const activeSurahNum = pageWords[cursor].surah.number;
          let matchedOffset = -1;

          // Check exact next word at cursor, or 1 word ahead in the SAME Surah
          if (isQuranWordMatch(pageWords[cursor].text, normSpoken)) {
            matchedOffset = 0;
          } else if (
            cursor + 1 < pageWords.length &&
            pageWords[cursor + 1].surah.number === activeSurahNum &&
            isQuranWordMatch(pageWords[cursor + 1].text, normSpoken)
          ) {
            matchedOffset = 1;
          }

          if (matchedOffset !== -1) {
            unmatchedSpokenBufferRef.current = [];
            lockAndRevealOnCurrentPage(cursor, matchedOffset + 1, false);
            continue;
          }
        }

        // ---------------------------------------------------------------------
        // CASE B: Not yet locked on (or user switched to a different place/Surah)
        // Accumulate spoken words until we have 3 consecutive words — NEVER guess on 1-2 words!
        // ---------------------------------------------------------------------
        unmatchedSpokenBufferRef.current = [
          ...unmatchedSpokenBufferRef.current,
          normSpoken,
        ].slice(-8);

        // Check if user explicitly said "سورة <Name>"
        const explicitSurah = findMatchingSurahByThreeWords(
          unmatchedSpokenBufferRef.current
        );
        if (
          explicitSurah &&
          unmatchedSpokenBufferRef.current.includes('سوره')
        ) {
          unmatchedSpokenBufferRef.current = [];
          const idxOnPage = pageWords.findIndex(
            (w) => w.surah.number === explicitSurah.surah.number
          );
          if (idxOnPage !== -1) {
            cursor = idxOnPage;
            cursorRef.current = idxOnPage;
            setActiveCursorIndex(idxOnPage);
            isLockedOnRef.current = true;
            setDetectedSurahBadge(`سورة ${explicitSurah.surah.name}`);
            onDetectSurahChange?.(explicitSurah.surah, 1);
            continue;
          } else if (explicitSurah.surah.pageNumber !== currentPage) {
            pendingTargetSurahRef.current = explicitSurah.surah.number;
            setDetectedSurahBadge(`سورة ${explicitSurah.surah.name}`);
            onDetectSurahChange?.(explicitSurah.surah, 1);
            onPageChange(explicitSurah.surah.pageNumber);
            return;
          }
        }

        // Wait until we have at least 3 spoken words before locking onto a verse or switching Surahs
        if (unmatchedSpokenBufferRef.current.length < 3) {
          continue;
        }

        const threeWords = unmatchedSpokenBufferRef.current.slice(-3);

        // 1. Check if these 3 consecutive words exist anywhere on the CURRENT Mushaf page
        let foundPageIdx = -1;
        for (let idx = 0; idx <= pageWords.length - 3; idx++) {
          if (
            isQuranWordMatch(pageWords[idx].text, threeWords[0]) &&
            isQuranWordMatch(pageWords[idx + 1].text, threeWords[1]) &&
            isQuranWordMatch(pageWords[idx + 2].text, threeWords[2])
          ) {
            foundPageIdx = idx;
            break;
          }
        }

        if (foundPageIdx !== -1) {
          // Found exact 3-word match on current page!
          // Reveal preceding words in that Surah on this page + these 3 words, and lock on!
          unmatchedSpokenBufferRef.current = [];
          lockAndRevealOnCurrentPage(foundPageIdx, 3, true);
          continue;
        }

        // 2. Not on current page -> Check across all 114 Surahs for this 3-word phrase!
        const globalMatch = findMatchingSurahByThreeWords(threeWords);
        if (globalMatch && globalMatch.surah.pageNumber !== currentPage) {
          // Include the 3 matched words + any remaining words spoken in this batch so the target page reveals them all!
          const remainingAfterThis = cleanedSpoken.slice(tIdx + 1);
          pendingSpokenWordsRef.current = [...threeWords, ...remainingAfterThis];
          pendingTargetSurahRef.current = globalMatch.surah.number;
          unmatchedSpokenBufferRef.current = [];
          setDetectedSurahBadge(
            `سورة ${globalMatch.surah.name} • آية ${toEasternArabicNumerals(
              globalMatch.ayahNumber
            )}`
          );
          onDetectSurahChange?.(globalMatch.surah, globalMatch.ayahNumber);
          onPageChange(globalMatch.surah.pageNumber);
          return;
        }

        // 3. Fallback API search across all 6,236 Quran verses if the 3 words are from a verse not in local sampleAyahs
        const now = Date.now();
        if (now - lastGlobalSearchTimeRef.current > 2000) {
          lastGlobalSearchTimeRef.current = now;
          const queryPhrase = threeWords.join(' ');
          const remainingAfterThis = cleanedSpoken.slice(tIdx + 1);
          fetch(`/api/quran/search?q=${encodeURIComponent(queryPhrase)}&lang=ar`)
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
              const firstMatch = res?.data?.matches?.[0] || res?.matches?.[0];
              if (firstMatch && firstMatch.page && firstMatch.page !== currentPage) {
                const matchedSurah =
                  ALL_SURAHS.find((s) => s.number === firstMatch.surah?.number) ||
                  firstMatch.surah;
                pendingSpokenWordsRef.current = [...threeWords, ...remainingAfterThis];
                unmatchedSpokenBufferRef.current = [];
                if (matchedSurah) {
                  pendingTargetSurahRef.current = matchedSurah.number;
                  setDetectedSurahBadge(
                    `سورة ${matchedSurah.name} • آية ${toEasternArabicNumerals(
                      firstMatch.numberInSurah || 1
                    )}`
                  );
                  onDetectSurahChange?.(matchedSurah, firstMatch.numberInSurah || 1);
                }
                onPageChange(firstMatch.page);
              }
            })
            .catch(() => {});
        }
      }

      if (didRevealOnPage) {
        revealedSetRef.current = newRevealedSet;
        setRevealedWordIndices(new Set(newRevealedSet));
        cursorRef.current = cursor;
        setActiveCursorIndex(cursor);
        if (latestRevealed !== -1) {
          setLastRevealedIndex(latestRevealed);
        }
      }
    },
    [currentPage, onPageChange, onDetectSurahChange]
  );

  // When mushafLinesData finishes loading for a page, apply any pending spoken words or target Surah
  useEffect(() => {
    const words = mushafLinesData?.flatWords || [];
    allPageWordsRef.current = words;
    if (!words.length) return;

    if (pendingTargetSurahRef.current !== null) {
      const targetSNum = pendingTargetSurahRef.current;
      pendingTargetSurahRef.current = null;
      const startIdx = words.findIndex((it) => it.surah.number === targetSNum);
      if (startIdx !== -1) {
        cursorRef.current = startIdx;
        setActiveCursorIndex(startIdx);
      }
    }

    if (pendingSpokenWordsRef.current.length > 0) {
      const toProcess = [...pendingSpokenWordsRef.current];
      pendingSpokenWordsRef.current = [];
      processSpokenTokens(toProcess);
    }
  }, [mushafLinesData, processSpokenTokens]);

  // Stop Revision microphone & audio level analyzer
  const stopRevisionListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    setIsListeningRevision(false);
    setMicLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  // Start Revision microphone & continuous Arabic SpeechRecognition
  const startRevisionListening = useCallback(async () => {
    setRevisionError(null);
    processedTokensByResultRef.current.clear();

    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setRevisionError(
        isArabic
          ? 'المتصفح لا يدعم التعرف الصوتي المباشر؛ يمكنك الضغط على الكلمات أو زر التلميح لإظهارها.'
          : 'Speech recognition is unavailable in this browser; tap any hidden word or Hint to reveal.'
      );
      return;
    }

    try {
      // Optional audio level meter for visual microphone feedback
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateMeter = () => {
            if (!shouldKeepListeningRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 90) * 100)));
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          shouldKeepListeningRef.current = true;
          updateMeter();
        }
      }
    } catch {
      // Even if getUserMedia meter fails, still start SpeechRecognition
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListeningRevision(true);
      };

      recognition.onresult = (event: any) => {
        const newTokens: string[] = [];
        let latestSnippet = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = String(res[0]?.transcript || '').trim();
          if (!transcript) continue;
          latestSnippet = transcript;

          // Compact vocative particles first so token count doesn't shift when ASR merges "يا أيها" -> "ياايها"
          const cleanedWords = stripIstiAdhahAndBasmalah(
            transcript.split(/\s+/).filter(Boolean),
            isLockedOnRef.current
          );
          const alreadyProcessed = processedTokensByResultRef.current.get(i) || 0;

          if (cleanedWords.length > alreadyProcessed) {
            const freshSlice = cleanedWords.slice(alreadyProcessed);
            newTokens.push(...freshSlice);
            processedTokensByResultRef.current.set(i, cleanedWords.length);
          }
        }

        if (latestSnippet) {
          setLastSpokenPreview(latestSnippet.split(/\s+/).slice(-5).join(' '));
        }

        if (newTokens.length > 0) {
          processSpokenTokens(newTokens);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          shouldKeepListeningRef.current = false;
          setIsListeningRevision(false);
          setRevisionError(
            isArabic
              ? 'يرجى السماح بصلاحية الميكروفون للتسميع الصوتي.'
              : 'Please allow microphone access for voice revision.'
          );
        }
      };

      recognition.onend = () => {
        // Automatically restart continuous recognition while in Revision Mode
        if (shouldKeepListeningRef.current) {
          processedTokensByResultRef.current.clear();
          try {
            recognition.start();
          } catch {
            setIsListeningRevision(false);
          }
        } else {
          setIsListeningRevision(false);
        }
      };

      recognitionRef.current = recognition;
      shouldKeepListeningRef.current = true;
      setIsListeningRevision(true);
      recognition.start();
    } catch {
      setIsListeningRevision(false);
    }
  }, [isArabic, processSpokenTokens]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRevisionListening();
    };
  }, [stopRevisionListening]);

  // Toggle between normal 15-Line Reading Mode and Tarteel Revision Mode
  const handleToggleRevisionMode = () => {
    if (viewMode === 'text') {
      setViewMode('revision');
      revealedSetRef.current = new Set();
      setRevealedWordIndices(new Set());
      cursorRef.current = 0;
      setActiveCursorIndex(0);
      setLastRevealedIndex(-1);
      isLockedOnRef.current = false;
      unmatchedSpokenBufferRef.current = [];
      setDetectedSurahBadge('');
      setLastSpokenPreview('');
      startRevisionListening();
    } else {
      stopRevisionListening();
      setViewMode('text');
    }
  };

  // Reveal next single word at activeCursorIndex (Hint / Peek)
  const handleHintNextWord = () => {
    const total = mushafLinesData?.totalWords || 0;
    if (cursorRef.current < total) {
      const targetIdx = cursorRef.current;
      const nextSet = new Set(revealedSetRef.current);
      nextSet.add(targetIdx);
      revealedSetRef.current = nextSet;
      setRevealedWordIndices(nextSet);
      setLastRevealedIndex(targetIdx);
      isLockedOnRef.current = true;
      const nextCursor = Math.min(total, targetIdx + 1);
      cursorRef.current = nextCursor;
      setActiveCursorIndex(nextCursor);
    }
  };

  // Reset all words on the page to hidden for another revision pass
  const handleResetRevisionPage = () => {
    revealedSetRef.current = new Set();
    setRevealedWordIndices(new Set());
    cursorRef.current = 0;
    setActiveCursorIndex(0);
    setLastRevealedIndex(-1);
    isLockedOnRef.current = false;
    unmatchedSpokenBufferRef.current = [];
    setDetectedSurahBadge('');
    setLastSpokenPreview('');
    processedTokensByResultRef.current.clear();
  };

  const handleNextPage = () => {
    if (currentPage < 604) onPageChange(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleCopyPageText = () => {
    if (!pageData || !pageData.ayahs.length) return;
    const pageText = pageData.ayahs
      .map((a) => `${a.text} ﴿${toEasternArabicNumerals(a.numberInSurah)}﴾`)
      .join(' ');
    const header = `مصحف المدينة النبوية (١٤٠٥ هـ) — صفحة ${toEasternArabicNumerals(currentPage)} (الجزء ${toEasternArabicNumerals(pageData.juzNumber)})\n\n`;
    navigator.clipboard.writeText(header + pageText);
    setCopiedPage(true);
    setTimeout(() => setCopiedPage(false), 2000);
  };

  // High-contrast colors requested by user:
  // Dark mode = Crisp Pure White (#FFFFFF)
  // Light mode = Deep Pure Black (#0A0D13)
  const textColorClass = isDark ? 'text-white' : 'text-stone-950 font-semibold';
  const pageBgClass = isDark
    ? 'bg-[#090C11] border-[#DFBA7F]/55 shadow-[0_20px_60px_rgba(0,0,0,0.92)]'
    : 'bg-[#FFFDF7] border-[#C9A063]/70 shadow-[0_14px_40px_rgba(140,107,50,0.18)]';

  // Pages 1 and 2 (Al-Fatihah and start of Al-Baqarah) are centered royal pages in Madani Mushaf
  const isCenteredRoyalPage = currentPage === 1 || currentPage === 2;
  const totalWordsOnPage = mushafLinesData?.totalWords || 0;

  return (
    <div className="relative w-full max-w-[680px] mx-auto">
      {/* ========================================================================= */}
      {/* TOP-RIGHT FLOATING SIDE TAB (SLIM, ELEGANT HANDLE WITH CHEVRON ICON)      */}
      {/* ========================================================================= */}
      <motion.button
        type="button"
        id="mushaf-side-tab-handle"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsSidePanelOpen((prev) => !prev)}
        className="fixed top-20 right-0 z-40 h-10 px-2.5 rounded-l-2xl bg-black/85 backdrop-blur-xl border border-r-0 border-[#DFBA7F]/60 text-[#DFBA7F] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-1.5 cursor-pointer group transition-all"
        aria-label={isSidePanelOpen ? 'Hide Quran Index' : 'Reveal Quran Index'}
        title={isSidePanelOpen ? 'Hide Index' : 'Surah & Juz Index'}
      >
        <span className="text-[10px] font-cinzel font-bold hidden sm:inline text-[#DFBA7F]">
          {isArabic ? 'الفهرس' : 'Index'}
        </span>
        {isSidePanelOpen ? (
          <ChevronRight className="w-4 h-4 text-[#DFBA7F] transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#DFBA7F] transition-transform group-hover:-translate-x-0.5" />
        )}
      </motion.button>

      {/* Slide-out Quran Side Index Panel */}
      <AnimatePresence>
        {isSidePanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs"
              onClick={() => setIsSidePanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 z-[95] w-72 sm:w-80 p-5 flex flex-col border-l shadow-2xl ${
                isDark ? 'bg-[#0A0D13]/98 border-[#DFBA7F]/30 text-stone-100' : 'bg-white/98 border-[#C9A063]/30 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#C9A063]/20 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#DFBA7F]" />
                  <h3 className="font-serif-heading font-bold text-sm text-[#DFBA7F]">
                    {isArabic ? 'فهرس مصحف المدينة (١٤٠٥ هـ)' : 'Madani Mushaf (1405) Index'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidePanelOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Page Jumper */}
              <div className="mb-3 p-3 rounded-xl border border-[#C9A063]/25 bg-[#C9A063]/10">
                <div className="text-[11px] font-semibold text-[#DFBA7F] mb-1.5">
                  {isArabic ? 'الانتقال السريع للصفحة (١ - ٦٠٤)' : 'Jump to Page (1 - 604)'}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={jumperInput}
                    onChange={(e) => setJumperInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const p = Number(jumperInput);
                        if (p >= 1 && p <= 604) {
                          onPageChange(p);
                          setIsSidePanelOpen(false);
                        }
                      }
                    }}
                    className="w-20 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border border-[#C9A063]/40 bg-stone-900 text-[#DFBA7F]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const p = Number(jumperInput);
                      if (p >= 1 && p <= 604) {
                        onPageChange(p);
                        setIsSidePanelOpen(false);
                      }
                    }}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-[#C9A063] text-[#090B0E] font-bold text-xs"
                  >
                    {isArabic ? 'انتقال' : 'Go'}
                  </button>
                </div>
              </div>

              {/* Surahs List in Side Panel */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 no-scrollbar text-xs">
                {ALL_SURAHS.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => {
                      onPageChange(s.pageNumber);
                      setIsSidePanelOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left rtl:text-right flex items-center justify-between transition-colors ${
                      currentPage === s.pageNumber
                        ? 'bg-[#C9A063]/25 text-[#DFBA7F] font-bold border border-[#C9A063]/40'
                        : 'hover:bg-white/5 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-arabic font-bold text-xs text-[#DFBA7F] w-6">
                        {toEasternArabicNumerals(s.number)}
                      </span>
                      <span>{s.englishName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400 font-arabic">
                        ص {toEasternArabicNumerals(s.pageNumber)}
                      </span>
                      <span className="font-arabic font-bold text-[#DFBA7F]">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Utility Bar: Madani 1405 Edition Badge, Revision (Tarteel) Switch & Controls */}
      <div className="flex items-center justify-between mb-2 px-1 select-none flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-lg bg-[#C9A063]/15 border border-[#DFBA7F]/35 text-[11px] font-arabic font-bold text-[#DFBA7F]">
            {isArabic ? 'مصحف المدينة النبوية (١٤٠٥ هـ • ١٥ سطراً)' : 'Madani Mushaf (1405 AH • 15-Line)'}
          </span>

          {/* Selected Focus Mode Button: Toggles Tarteel-Style Revision Mode on the 15-line Mushaf */}
          <button
            type="button"
            onClick={handleToggleRevisionMode}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs ${
              viewMode === 'revision'
                ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300 ring-1 ring-emerald-400/40'
                : 'bg-[#C9A063]/25 border-[#DFBA7F]/50 text-[#DFBA7F] hover:bg-[#C9A063]/35'
            }`}
            title={
              isArabic
                ? 'وضع المراجعة والتسميع (ترتيل): يستمع لـ ٣ كلمات ويتعرف على السورة والآية التي تقرؤها ويظهر ما قبلها ويكمل معك'
                : 'Revision Mode (Tarteel): Listens for 3 words to lock onto your Surah & Ayah, reveals preceding words on the page, and follows your recitation'
            }
          >
            {viewMode === 'revision' ? (
              <>
                <span className="relative flex h-2 w-2">
                  {isListeningRevision && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isListeningRevision ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </span>
                <span>{isArabic ? 'المراجعة (ترتيل نشط)' : 'Revision (Active)'}</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#DFBA7F]" />
                <span>{isArabic ? 'مراجعة الحفظ (Revision)' : 'Revision'}</span>
              </>
            )}
          </button>

          {/* Zero-Mistake Tajweed Colors Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTajweed}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isTajweedEnabled
                ? 'bg-gradient-to-r from-rose-500/20 via-emerald-500/20 to-sky-500/20 border-[#DFBA7F]/80 text-[#DFBA7F] ring-1 ring-[#DFBA7F]/50'
                : 'bg-[#C9A063]/15 border-[#DFBA7F]/35 text-stone-300 hover:text-[#DFBA7F] hover:bg-[#C9A063]/25'
            }`}
            title={
              isArabic
                ? 'تفعيل / إيقاف مصحف التجويد الملون (أحكام المدود والغنة والإخفاء والإقلاب والقلقلة بدقة تامة)'
                : 'Toggle Tajweed Colors (Accurate Madd, Ghunnah/Ikhfa, Iqlab, and Qalqalah color coding)'
            }
          >
            <span className="flex items-center -space-x-0.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            </span>
            <span>{isArabic ? 'ألوان التجويد' : 'Tajweed Colors'}</span>
          </button>

          {/* Inline Tarteel Revision Controls when Revision Mode is active */}
          {viewMode === 'revision' && (
            <div className="flex items-center gap-1 flex-wrap">
              {/* Mic Pause/Resume button */}
              <button
                type="button"
                onClick={() =>
                  isListeningRevision ? stopRevisionListening() : startRevisionListening()
                }
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  isListeningRevision
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                }`}
                title={isArabic ? 'تشغيل / إيقاف الميكروفون' : 'Toggle Microphone'}
              >
                {isListeningRevision ? (
                  <>
                    <Mic className="w-3 h-3 animate-pulse text-emerald-300" />
                    <span>{isArabic ? 'يستمع ويفهم تلاوتك...' : 'Listening...'}</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3 h-3 text-amber-300" />
                    <span>{isArabic ? 'تشغيل الميكروفون' : 'Resume Mic'}</span>
                  </>
                )}
              </button>

              {/* Hint / Reveal Next Word */}
              <button
                type="button"
                onClick={handleHintNextWord}
                disabled={activeCursorIndex >= totalWordsOnPage}
                className="px-2 py-0.5 rounded-lg border border-[#C9A063]/40 bg-[#C9A063]/15 text-[#DFBA7F] hover:bg-[#C9A063]/25 disabled:opacity-30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title={isArabic ? 'إظهار الكلمة التالية (تلميح)' : 'Reveal next word (Hint)'}
              >
                <Eye className="w-3 h-3" />
                <span>{isArabic ? 'تلميح' : 'Hint'}</span>
              </button>

              {/* Reset Page Revision */}
              <button
                type="button"
                onClick={handleResetRevisionPage}
                className="px-2 py-0.5 rounded-lg border border-white/10 text-stone-300 hover:text-white hover:bg-white/5 text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title={isArabic ? 'إعادة إخفاء الكلمات للمراجعة من جديد' : 'Hide all words again'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isArabic ? 'إعادة' : 'Reset'}</span>
              </button>

              {/* Word Progress Counter */}
              <span className="px-2 py-0.5 rounded-lg bg-black/30 border border-[#C9A063]/25 text-[10px] font-mono text-[#DFBA7F]">
                {revealedWordIndices.size}/{totalWordsOnPage}
              </span>

              {/* Detected Surah & Ayah Badge (Shows which Surah the user is reciting!) */}
              {detectedSurahBadge && (
                <span
                  dir="rtl"
                  className="px-2 py-0.5 rounded-lg bg-[#C9A063]/20 border border-[#DFBA7F]/45 text-[11px] font-arabic font-bold text-[#DFBA7F] flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-[#DFBA7F]" />
                  <span>{detectedSurahBadge}</span>
                </span>
              )}

              {/* Live Audio Level Bars (Inline so Mushaf position never shifts when speaking) */}
              {isListeningRevision && (
                <div className="flex items-center gap-0.5 h-3.5 px-1.5" aria-hidden="true">
                  {[0.5, 1, 0.7, 0.9].map((mult, idx) => (
                    <span
                      key={idx}
                      className="w-0.5 rounded-full bg-emerald-400 transition-all duration-75"
                      style={{
                        height: `${Math.max(3, Math.min(12, (micLevel || 25) * 0.12 * mult))}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Inline Spoken Word Indicator (Fixed height, zero layout shift) */}
              {lastSpokenPreview && !revisionError && (
                <span
                  dir="rtl"
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-arabic text-emerald-300 font-bold max-w-[140px] sm:max-w-[200px] truncate"
                >
                  {lastSpokenPreview}
                </span>
              )}

              {revisionError && (
                <span className="text-[10px] text-amber-300 truncate max-w-[220px]">
                  {revisionError}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyPageText}
          className="px-2.5 py-0.5 rounded-lg border border-white/10 text-stone-400 hover:text-[#DFBA7F] hover:bg-white/5 text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
        >
          {copiedPage ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">{isArabic ? 'تم النسخ' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>{isArabic ? 'نسخ الصفحة' : 'Copy Page'}</span>
            </>
          )}
        </button>
      </div>

      {/* Zero-Mistake Tajweed Color Legend Bar (Shown when Tajweed Colors are active) */}
      {isTajweedEnabled && (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className={`mb-2 px-2.5 py-1.5 rounded-xl border flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-[11px] select-none ${
            isDark
              ? 'bg-[#0B0F16]/90 border-[#DFBA7F]/30 text-stone-200'
              : 'bg-[#FFFDF9] border-[#C9A063]/40 text-stone-800'
          }`}
        >
          <span className="font-bold text-[#DFBA7F]">
            {isArabic ? 'دليل ألوان التجويد:' : 'Tajweed Key:'}
          </span>
          {TAJWEED_LEGEND_ITEMS.map((item) => (
            <span key={item.rule} className="inline-flex items-center gap-1 font-medium" title={item.descAr}>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotClass}`} />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </span>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTHENTIC 15-LINE MADANI MUSHAF (1405 AH) BOOK PAGE                       */}
      {/* Used identically for both 'text' & 'revision' so NO positions ever move!  */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl sm:rounded-3xl border-2 p-1.5 sm:p-3 transition-all duration-300 relative ${pageBgClass}`}>
        {/* Inner Traditional Double-Ruled Mushaf Margin Frame */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-2.5 sm:p-5 relative ${
            isDark ? 'border-[#DFBA7F]/40 bg-[#0B0F16]' : 'border-[#C9A063]/55 bg-[#FFFDF9]'
          }`}
        >
          {/* Top Margin Header: Juz & Hizb (Right), Page Number (Center), Surah Name & Number (Left) */}
          <div
            dir="rtl"
            className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#C9A063]/35 text-xs text-[#DFBA7F] font-arabic font-bold select-none px-1"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm">
                الجزء ﴿{toEasternArabicNumerals(pageData?.juzNumber || 1)}﴾
              </span>
              <span className="opacity-40">•</span>
              <span className="text-[11px] sm:text-xs opacity-85">
                الحزب ﴿{toEasternArabicNumerals(hizbNumber)}﴾
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSidePanelOpen(true)}
              className="px-2.5 py-0.2 rounded-full border border-[#DFBA7F]/45 bg-[#C9A063]/15 hover:bg-[#C9A063]/30 transition-all cursor-pointer text-xs sm:text-sm font-bold text-[#DFBA7F]"
              title={isArabic ? 'اضغط للانتقال إلى صفحة أخرى' : 'Tap to jump to page'}
            >
              ﴿ {toEasternArabicNumerals(currentPage)} ﴾
            </button>

            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <span>سُورَةُ {currentSurahOnPage?.name || ''}</span>
              {currentSurahOnPage?.number && (
                <span className="text-[11px] opacity-85">
                  ﴿{toEasternArabicNumerals(currentSurahOnPage.number)}﴾
                </span>
              )}
            </div>
          </div>

          {/* High-Fidelity 15-Line Madani Mushaf Skeleton Loading Screen */}
          <AnimatePresence>
            {isLoadingPage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                dir="rtl"
                aria-busy="true"
                aria-label={isArabic ? 'جاري تحميل صفحة المصحف...' : 'Loading Mushaf page...'}
                className="py-3 px-2 sm:px-4 space-y-3 select-none"
              >
                {/* Illuminated Surah Banner Skeleton with Shimmer */}
                <div
                  className={`h-11 w-full rounded-2xl border flex items-center justify-between px-5 ${
                    isDark
                      ? 'bg-[#C9A063]/10 border-[#DFBA7F]/30 shadow-[0_4px_20px_rgba(201,160,99,0.15)]'
                      : 'bg-amber-50/80 border-[#C9A063]/40 shadow-sm'
                  }`}
                >
                  <div className={`h-3 w-16 rounded-md ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                  <div className={`h-4 w-36 rounded-lg ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                  <div className={`h-3 w-16 rounded-md ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`} />
                </div>

                {/* 15 Madani Mushaf Lines Skeleton with Ayah Medallion Placeholders */}
                <div className={`p-4 sm:p-6 rounded-3xl border space-y-3 ${
                  isDark
                    ? 'bg-[#0E1218]/90 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]'
                    : 'bg-white/90 border-[#C9A063]/30 shadow-md'
                }`}>
                  {Array.from({ length: 15 }, (_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.4, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.3 }}
                      className={`w-full flex items-center justify-between gap-3 py-2 border-b ${
                        isDark ? 'border-white/[0.04]' : 'border-stone-900/[0.04]'
                      }`}
                    >
                      {/* Left Word Group Skeleton */}
                      <div
                        className={`h-5 rounded-lg ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`}
                        style={{ width: `${20 + ((idx * 7) % 22)}%` }}
                      />
                      
                      {/* Center-Left Word Group Skeleton */}
                      <div
                        className={`h-5 rounded-lg ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`}
                        style={{ width: `${26 + ((idx * 11) % 24)}%` }}
                      />

                      {/* Ornate Skeleton Ayah Medallion Circle */}
                      <div className="w-7 h-7 rounded-full border border-[#C9A063]/50 bg-[#C9A063]/15 shrink-0 flex items-center justify-center shadow-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#DFBA7F]/60 animate-pulse" />
                      </div>

                      {/* Right Word Group Skeleton */}
                      <div
                        className={`h-5 rounded-lg ${isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'}`}
                        style={{ width: `${22 + ((idx * 5) % 20)}%` }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* EXACT 15-LINE QURAN.COM MADANI MUSHAF (1405 AH) PAGE RENDERER             */}
          {/* In Revision Mode: Surah headers & Ayah numbers stay visible in exact      */}
          {/* spots; unrecited words use transparent text inside fixed-width spans!     */}
          {/* ========================================================================= */}
          {!isLoadingPage && mushafLinesData && (
            <div
              dir="rtl"
              className={`select-text font-arabic ${
                isCenteredRoyalPage ? 'py-4 sm:py-8 px-2 sm:px-8' : 'px-0.5 sm:px-2'
              }`}
            >
              {Array.from({ length: 15 }, (_, idx) => idx + 1).map((lineNum) => {
                const itemsOnLine = mushafLinesData.linesMap.get(lineNum) || [];
                const surahHeaderInfo = mushafLinesData.surahStartByLine.get(lineNum);

                if (itemsOnLine.length === 0 && !surahHeaderInfo) {
                  return null;
                }

                // Check if this is the final line of a Surah (usually centered in Mushaf if short)
                const isShortCenteredLine =
                  isCenteredRoyalPage ||
                  (itemsOnLine.length <= 4 && itemsOnLine.some((it) => it.type === 'end'));

                return (
                  <React.Fragment key={lineNum}>
                    {/* Illuminated Surah Banner & Bismillah when a new Surah begins on this line (ALWAYS VISIBLE) */}
                    {surahHeaderInfo && (
                      <div className="my-2 select-none">
                        <div
                          className={`rounded-xl py-1.5 px-3 border-2 border-double flex items-center justify-between shadow-xs ${
                            isDark
                              ? 'bg-gradient-to-r from-[#DFBA7F]/15 via-[#C9A063]/25 to-[#DFBA7F]/15 border-[#DFBA7F]/65'
                              : 'bg-gradient-to-r from-[#C9A063]/15 via-[#DFBA7F]/25 to-[#C9A063]/15 border-[#C9A063]/75'
                          }`}
                        >
                          <span className="text-[11px] sm:text-xs font-arabic font-bold text-[#DFBA7F]">
                            رقمها ﴿{toEasternArabicNumerals(surahHeaderInfo.surah.number)}﴾
                          </span>
                          <span className="text-base sm:text-xl font-arabic font-bold text-[#DFBA7F]">
                            سُورَةُ {surahHeaderInfo.surah.name}
                          </span>
                          <span className="text-[11px] sm:text-xs font-arabic font-bold text-[#DFBA7F]">
                            آياتها ﴿{toEasternArabicNumerals(surahHeaderInfo.surah.numberOfAyahs)}﴾
                          </span>
                        </div>

                        {surahHeaderInfo.showBismillah && (
                          <div
                            className={`text-center font-arabic py-1.5 text-lg sm:text-2xl font-bold tracking-normal ${textColorClass}`}
                          >
                            {isTajweedEnabled
                              ? ['بِسْمِ', 'ٱللَّهِ', 'ٱلرَّحْمَـٰنِ', 'ٱلرَّحِيمِ'].map((bWord, bIdx, bArr) => (
                                  <React.Fragment key={bIdx}>
                                    {renderWordWithTajweed(
                                      bWord,
                                      isDark,
                                      bArr[bIdx + 1],
                                      bIdx === bArr.length - 1
                                    )}
                                    {bIdx < bArr.length - 1 ? ' ' : ''}
                                  </React.Fragment>
                                ))
                              : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Single Mushaf Line (1 of 15): Compact, edge-to-edge without wide gaps */}
                    {itemsOnLine.length > 0 && (
                      <div
                        className={`w-full flex items-center flex-wrap sm:flex-nowrap py-[3px] sm:py-[4px] border-b transition-colors ${
                          isDark ? 'border-white/[0.04]' : 'border-stone-900/[0.05]'
                        } ${
                          isShortCenteredLine
                            ? 'justify-center gap-x-2 sm:gap-x-3'
                            : 'justify-between gap-x-1 sm:gap-x-1.5'
                        }`}
                        style={{
                          fontSize: isCenteredRoyalPage
                            ? 'clamp(1.35rem, 3.6vw, 1.85rem)'
                            : 'clamp(1.18rem, 3.3vw, 1.65rem)',
                          lineHeight: '1.75',
                        }}
                      >
                        {itemsOnLine.map((item) => {
                          const isPlayingThisAyah =
                            Boolean(isPlaying) &&
                            playingAyahNumber === item.ayah.numberInSurah &&
                            (!playingSurahNumber || item.surah.number === playingSurahNumber);

                          // Ayah Number Symbol (MadaniAyahOrnament) is ALWAYS visible in its exact place!
                          if (item.type === 'end') {
                            return (
                              <MadaniAyahOrnament
                                key={item.id}
                                ayahNumber={item.ayah.numberInSurah}
                                surahNumber={item.surah.number}
                                isPlaying={isPlayingThisAyah}
                                isDark={isDark}
                                compact={true}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAyahNumberClick(item.ayah, item.surah);
                                }}
                                title={
                                  isArabic
                                    ? `آية ﴿${toEasternArabicNumerals(item.ayah.numberInSurah)}﴾ من سورة ${item.surah.name} — اضغط للاستماع بصوت الشيخ ياسر الدوسري`
                                    : `Verse ${item.ayah.numberInSurah} (${item.surah.englishName} ${item.surah.number}:${item.ayah.numberInSurah}) — Tap to play Sheikh Yasser Al-Dossari`
                                }
                              />
                            );
                          }

                          // Determine if this specific word is the active spoken word by the Sheikh
                          let isCurrentSpokenWord = false;
                          let isAlreadySpokenWord = false;

                          if (isPlayingThisAyah) {
                            const rawWords = String(item.ayah.text || '')
                              .split(/\s+/)
                              .filter(Boolean);
                            const wordsArray =
                              rawWords.length === item.totalWordsInAyah
                                ? rawWords
                                : Array.from({ length: item.totalWordsInAyah }, () => 'كلم');
                            const segments = wordSegmentsByAyah[item.ayah.numberInSurah];
                            const activeZeroIdx = getActiveSpokenWordIndex(
                              wordsArray,
                              playbackProgress,
                              segments
                            );
                            const currentOneIdx = activeZeroIdx + 1;
                            isCurrentSpokenWord = item.wordPosition === currentOneIdx;
                            isAlreadySpokenWord = item.wordPosition < currentOneIdx;
                          }

                          // Revision Mode (Tarteel) per-word visibility check:
                          // Only words actually recited (or tapped) by the user are revealed in their exact place!
                          // Unrecited Surahs/Ayahs above or below remain hidden with zero layout shift.
                          const isRevisionHidden =
                            viewMode === 'revision' &&
                            !revealedWordIndices.has(item.pageWordIndex);

                          const isCurrentRevisionTarget =
                            viewMode === 'revision' &&
                            item.pageWordIndex === activeCursorIndex;

                          const isJustRevealedInRevision =
                            viewMode === 'revision' &&
                            item.pageWordIndex === lastRevealedIndex;

                          // Next word in the same Ayah (for cross-word Idgham/Ikhfa/Iqlab check)
                          const nextWordEntry = mushafLinesData.flatWords[item.pageWordIndex + 1];
                          const nextWordInSameAyah =
                            nextWordEntry &&
                            nextWordEntry.surah.number === item.surah.number &&
                            nextWordEntry.ayah.numberInSurah === item.ayah.numberInSurah
                              ? nextWordEntry.text
                              : undefined;
                          const isEndOfAyahWord = item.wordPosition === item.totalWordsInAyah;

                          return (
                            <span
                              key={item.id}
                              id={
                                item.wordPosition === 1
                                  ? `mushaf-ayah-${item.ayah.numberInSurah}`
                                  : undefined
                              }
                              onClick={() => {
                                if (viewMode === 'revision' && isRevisionHidden) {
                                  // Tapping a hidden word reveals that specific word and locks the active cursor onto this Surah/Ayah!
                                  const nextSet = new Set(revealedSetRef.current);
                                  // Also reveal any preceding words in the same Surah on this page
                                  for (let p = 0; p <= item.pageWordIndex; p++) {
                                    if (mushafLinesData.flatWords[p]?.surah.number === item.surah.number) {
                                      nextSet.add(p);
                                    }
                                  }
                                  revealedSetRef.current = nextSet;
                                  setRevealedWordIndices(nextSet);
                                  setLastRevealedIndex(item.pageWordIndex);
                                  const nextCursor = Math.min(totalWordsOnPage, item.pageWordIndex + 1);
                                  cursorRef.current = nextCursor;
                                  setActiveCursorIndex(nextCursor);
                                  isLockedOnRef.current = true;
                                  unmatchedSpokenBufferRef.current = [];
                                  setDetectedSurahBadge(
                                    `سورة ${item.surah.name} • آية ${toEasternArabicNumerals(
                                      item.ayah.numberInSurah
                                    )}`
                                  );
                                  onDetectSurahChange?.(item.surah, item.ayah.numberInSurah);
                                } else {
                                  onAyahTextClick(item.ayah, item.surah);
                                }
                              }}
                              className={`cursor-pointer inline-block rounded px-0.5 transition-colors duration-150 ${
                                isRevisionHidden
                                  ? isCurrentRevisionTarget
                                    ? 'text-transparent select-none border-b-2 border-emerald-400/75 bg-emerald-500/[0.08]'
                                    : isDark
                                    ? 'text-transparent select-none border-b border-dashed border-white/[0.12]'
                                    : 'text-transparent select-none border-b border-dashed border-stone-900/[0.15]'
                                  : isJustRevealedInRevision
                                  ? isDark
                                    ? 'text-emerald-300 font-bold bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.45)] select-text'
                                    : 'text-emerald-800 font-bold bg-emerald-200/60 select-text'
                                  : isCurrentSpokenWord
                                  ? isDark
                                    ? 'text-emerald-300 font-bold scale-110 -translate-y-0.5 bg-emerald-500/35 shadow-[0_0_18px_rgba(16,185,129,0.85)] ring-1 ring-emerald-300 select-text'
                                    : 'text-emerald-950 font-extrabold scale-110 -translate-y-0.5 bg-emerald-300/85 shadow-[0_0_14px_rgba(16,185,129,0.55)] ring-1 ring-emerald-600 select-text'
                                  : isAlreadySpokenWord
                                  ? isDark
                                    ? 'text-[#DFBA7F] select-text'
                                    : 'text-amber-800 select-text'
                                  : isPlayingThisAyah
                                  ? isDark
                                    ? 'text-white bg-emerald-500/10 select-text'
                                    : 'text-stone-950 bg-emerald-100/60 select-text'
                                  : `${textColorClass} hover:text-[#DFBA7F] select-text`
                              }`}
                              title={
                                viewMode === 'revision' && isRevisionHidden
                                  ? isArabic
                                    ? 'اتلُ ٣ كلمات بصوتك أو اضغط لإظهار الكلمة'
                                    : 'Recite 3 words aloud or tap to reveal word'
                                  : isArabic
                                  ? `سورة ${item.surah.name} ﴿${toEasternArabicNumerals(item.surah.number)}:${toEasternArabicNumerals(item.ayah.numberInSurah)}﴾`
                                  : `${item.surah.englishName} (${item.surah.number}:${item.ayah.numberInSurah})`
                              }
                            >
                              {!isRevisionHidden && isTajweedEnabled && !isCurrentSpokenWord
                                ? renderWordWithTajweed(
                                    item.text,
                                    isDark,
                                    nextWordInSameAyah,
                                    isEndOfAyahWord
                                  )
                                : item.text}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Bottom Page Margin Footer: Prev Page, Centered Arabic Page Number, Next Page */}
          <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-[#C9A063]/35 text-xs select-none">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#C9A063]/40 bg-[#C9A063]/15 text-[#DFBA7F] hover:bg-[#C9A063]/25 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer font-bold"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isArabic ? 'السابقة' : 'Prev'}</span>
            </button>

            <div className="flex items-center gap-2 font-arabic font-bold text-sm text-[#DFBA7F]">
              <span>صفحة ﴿{toEasternArabicNumerals(currentPage)}﴾ من ﴿٦٠٤﴾</span>
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= 604}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#C9A063]/40 bg-[#C9A063]/15 text-[#DFBA7F] hover:bg-[#C9A063]/25 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer font-bold"
            >
              <span>{isArabic ? 'التالية' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

