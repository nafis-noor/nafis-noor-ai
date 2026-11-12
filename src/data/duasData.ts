import { Dua, DhikrDuaCategory } from '../types';
import rawHisnAdhkar from './hisnulMuslimComplete.json';

// Strongly typed list of all authentic Adhkar from Fortress of the Muslim (Hisn al-Muslim)
export const DUAS_LIST: Dua[] = (rawHisnAdhkar as unknown as Dua[]).map((d) => ({
  ...d,
  isSaved: false,
}));

export const DHIKR_CATEGORIES: {
  id: DhikrDuaCategory;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
  count: number;
}[] = [
  {
    id: 'All',
    label: 'All Adhkar',
    labelAr: 'جميع الأذكار',
    icon: '✨',
    description: 'Complete authentic fortress of remembrance from Hisn al-Muslim',
    count: DUAS_LIST.length,
  },
  {
    id: 'Morning',
    label: 'Morning',
    labelAr: 'أذكار الصباح',
    icon: '🌅',
    description: 'Prophetic morning remembrances for divine light and preservation',
    count: DUAS_LIST.filter((d) => d.category === 'Morning').length,
  },
  {
    id: 'Evening',
    label: 'Evening',
    labelAr: 'أذكار المساء',
    icon: '🌙',
    description: 'Serene evening adhkar for sanctuary and tranquility until dawn',
    count: DUAS_LIST.filter((d) => d.category === 'Evening').length,
  },
  {
    id: 'After Prayer',
    label: 'After Prayer',
    labelAr: 'أذكار بعد الصلاة',
    icon: '🕌',
    description: 'Sunnah adhkar and tasbeeh immediately following the obligatory prayers',
    count: DUAS_LIST.filter((d) => d.category === 'After Prayer').length,
  },
  {
    id: 'Sleep',
    label: 'Sleep & Waking',
    labelAr: 'أذكار النوم والاستيقاظ',
    icon: '🛌',
    description: 'Duas before sleeping, night disturbances, and upon waking up',
    count: DUAS_LIST.filter((d) => d.category === 'Sleep').length,
  },
  {
    id: 'Protection',
    label: 'Protection & Ruqyah',
    labelAr: 'الحفظ والوقاية',
    icon: '🛡️',
    description: 'Divine refuge against worry, grief, adversary, evil eye, and illness',
    count: DUAS_LIST.filter((d) => d.category === 'Protection').length,
  },
  {
    id: 'Forgiveness',
    label: 'Forgiveness & Tawbah',
    labelAr: 'الاستغفار والتوبة',
    icon: '🤲',
    description: 'Sayyid al-Istighfar, repentance, and expiation of assemblies',
    count: DUAS_LIST.filter((d) => d.category === 'Forgiveness').length,
  },
  {
    id: 'Gratitude',
    label: 'Gratitude & Praise',
    labelAr: 'الحمد والشكر',
    icon: '🌿',
    description: 'Praises after meals, joy, blessing others, and Salawat on the Prophet ﷺ',
    count: DUAS_LIST.filter((d) => d.category === 'Gratitude').length,
  },
  {
    id: 'Daily Dhikr',
    label: 'Daily Dhikr',
    labelAr: 'أذكار اليوم والليلة',
    icon: '☀️',
    description: 'Home, masjid, ablution, adhan, travel, market, weather, and life occasions',
    count: DUAS_LIST.filter((d) => d.category === 'Daily Dhikr' || d.category === 'Daily Duas').length,
  },
];

// Helper functions for easy consumption across the app
export function getDuasByCategory(category: DhikrDuaCategory): Dua[] {
  if (category === 'All') return DUAS_LIST;
  if (category === 'Daily Dhikr' || category === 'Daily Duas') {
    return DUAS_LIST.filter((d) => d.category === 'Daily Dhikr' || d.category === 'Daily Duas');
  }
  return DUAS_LIST.filter((d) => d.category === category);
}

export function searchDuas(query: string, category?: DhikrDuaCategory): Dua[] {
  const q = query.trim().toLowerCase();
  const list = category ? getDuasByCategory(category) : DUAS_LIST;
  if (!q) return list;

  return list.filter((dua) => {
    return (
      dua.title.toLowerCase().includes(q) ||
      (dua.titleAr && dua.titleAr.includes(q)) ||
      dua.translation.toLowerCase().includes(q) ||
      (dua.transliteration && dua.transliteration.toLowerCase().includes(q)) ||
      dua.arabic.includes(q) ||
      dua.source.toLowerCase().includes(q) ||
      (dua.chapterTitle && dua.chapterTitle.toLowerCase().includes(q))
    );
  });
}

export function getDuaById(id: string): Dua | undefined {
  return DUAS_LIST.find((d) => d.id === id);
}

export function getRandomDua(category?: DhikrDuaCategory): Dua {
  const list = category ? getDuasByCategory(category) : DUAS_LIST;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex] || DUAS_LIST[0];
}

export function getMorningAdhkar(): Dua[] {
  return getDuasByCategory('Morning');
}

export function getEveningAdhkar(): Dua[] {
  return getDuasByCategory('Evening');
}
