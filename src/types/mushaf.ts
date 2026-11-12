import { Ayah, Surah } from '../types';

export type MushafLayout = 'book' | 'text' | 'translation';

export type MushafEdition = 'madani-1405';

export interface MushafPageData {
  pageNumber: number;
  juzNumber: number;
  hizbQuarter: number;
  surahsOnPage: {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    revelationType: string;
  }[];
  ayahs: Ayah[];
}

export interface AyahDetails {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  englishName: string;
  revelationType: string;
  text: string;
  translation: string;
  transliteration?: string;
  tafsir?: string;
  juz: number;
  page: number;
  audioUrl: string;
}

export interface MushafPreferences {
  layout: MushafLayout;
  edition: MushafEdition;
  showTransliteration: boolean;
  enableTajweedColors: boolean;
  showTranslation: boolean;
  arabicFontSize: number;
}
