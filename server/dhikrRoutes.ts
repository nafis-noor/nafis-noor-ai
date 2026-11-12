import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Load the compiled Hisnul Muslim dataset
let adhkarData: any[] = [];
try {
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'hisnulMuslimComplete.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    adhkarData = JSON.parse(raw);
    console.log(`[Dhikr API] Loaded ${adhkarData.length} authentic Hisnul Muslim records.`);
  } else {
    console.warn(`[Dhikr API] Dataset file not found at ${jsonPath}`);
  }
} catch (err) {
  console.error('[Dhikr API] Failed to load Hisnul Muslim dataset', err);
}

// Categories definitions
const CATEGORIES_SUMMARY = [
  { id: 'All', label: 'All Adhkar', labelAr: 'جميع الأذكار', count: adhkarData.length },
  { id: 'Morning', label: 'Morning', labelAr: 'أذكار الصباح', count: adhkarData.filter(d => d.category === 'Morning').length },
  { id: 'Evening', label: 'Evening', labelAr: 'أذكار المساء', count: adhkarData.filter(d => d.category === 'Evening').length },
  { id: 'After Prayer', label: 'After Prayer', labelAr: 'أذكار بعد الصلاة', count: adhkarData.filter(d => d.category === 'After Prayer').length },
  { id: 'Sleep', label: 'Sleep & Waking', labelAr: 'أذكار النوم والاستيقاظ', count: adhkarData.filter(d => d.category === 'Sleep').length },
  { id: 'Protection', label: 'Protection & Ruqyah', labelAr: 'الحفظ والوقاية', count: adhkarData.filter(d => d.category === 'Protection').length },
  { id: 'Forgiveness', label: 'Forgiveness & Tawbah', labelAr: 'الاستغفار والتوبة', count: adhkarData.filter(d => d.category === 'Forgiveness').length },
  { id: 'Gratitude', label: 'Gratitude & Praise', labelAr: 'الحمد والشكر', count: adhkarData.filter(d => d.category === 'Gratitude').length },
  { id: 'Daily Dhikr', label: 'Daily Dhikr & Life', labelAr: 'أذكار اليوم والليلة', count: adhkarData.filter(d => d.category === 'Daily Dhikr' || d.category === 'Daily Duas').length },
];

/**
 * GET /api/dhikr/categories
 * Returns category list with real counts
 */
router.get('/categories', (req: Request, res: Response) => {
  res.json({
    source: 'Hisn al-Muslim min Adhkar al-Kitab was-Sunnah (حصن المسلم من أذكار الكتاب والسنة)',
    author: "Sheikh Sa'id bin Ali bin Wahf Al-Qahtani",
    totalItems: adhkarData.length,
    categories: CATEGORIES_SUMMARY,
  });
});

/**
 * GET /api/dhikr/random
 * Returns random authentic dhikr, optionally within a category
 */
router.get('/random', (req: Request, res: Response) => {
  const { category } = req.query;
  let pool = adhkarData;

  if (category && typeof category === 'string' && category !== 'All') {
    pool = adhkarData.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  if (pool.length === 0) pool = adhkarData;
  const randomIndex = Math.floor(Math.random() * pool.length);
  res.json({
    data: pool[randomIndex],
    source: 'Hisn al-Muslim',
  });
});

/**
 * GET /api/dhikr/:id
 * Returns single dhikr by ID
 */
router.get('/item/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = adhkarData.find(d => d.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Dhikr item not found in authentic Hisn al-Muslim collection' });
  }
  res.json({ data: item });
});

/**
 * GET /api/dhikr
 * Returns list with search, category filtering, and pagination
 */
router.get('/', (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '50' } = req.query;

  let results = [...adhkarData];

  // Category filter
  if (category && typeof category === 'string' && category !== 'All') {
    const catLower = category.toLowerCase();
    if (catLower === 'daily dhikr' || catLower === 'daily duas') {
      results = results.filter(d => d.category === 'Daily Dhikr' || d.category === 'Daily Duas');
    } else {
      results = results.filter(d => d.category.toLowerCase() === catLower);
    }
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(d => {
      return (
        d.title?.toLowerCase().includes(q) ||
        d.titleAr?.includes(q) ||
        d.translation?.toLowerCase().includes(q) ||
        d.transliteration?.toLowerCase().includes(q) ||
        d.arabic?.includes(q) ||
        d.source?.toLowerCase().includes(q) ||
        d.chapterTitle?.toLowerCase().includes(q)
      );
    });
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(300, Math.max(1, parseInt(limit as string, 10) || 50));
  const total = results.length;
  const startIndex = (pageNum - 1) * limitNum;
  const items = results.slice(startIndex, startIndex + limitNum);

  res.json({
    source: 'Hisn al-Muslim min Adhkar al-Kitab was-Sunnah (Official Muslim World Source)',
    verified: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    items,
  });
});

export default router;
