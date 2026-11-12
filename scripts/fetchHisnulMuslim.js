// Script to fetch and build the comprehensive, authentic Hisnul Muslim dataset
// Source: Fortress of the Muslim (Hisn al-Muslim) - Global standard across the Muslim World
import fs from 'fs';
import path from 'path';

// Scholarly verified primary citations for Chapter 27 (Morning & Evening)
const SPECIFIC_C27_SOURCES = {
  75: 'Surah Al-Baqarah 2:255 • Al-Hakim (1/562), graded Sahih by Al-Albani in Sahih At-Targhib 1/273',
  76: 'Surah Al-Ikhlas, Al-Falaq, An-Nas • Sunan Abi Dawud 5082, Jami` at-Tirmidhi 3575 (Hasan Sahih)',
  77: 'Sahih Muslim 2723 (Book of Remembrance, Hadith 74)',
  78: 'Jami` at-Tirmidhi 3391 (Sahih), Sunan Abi Dawud 5068',
  79: 'Sayyid al-Istighfar (Chief of Prayers for Forgiveness) • Sahih al-Bukhari 6306',
  80: 'Sunan Abi Dawud 5069, Al-Adab Al-Mufrad 1201, graded Hasan by Ibn Baz',
  81: 'Sunan Abi Dawud 5073, An-Nasa`i in `Amal al-Yawm wal-Laylah 7',
  82: 'Sunan Abi Dawud 5090, Musnad Ahmad 5/42, graded Hasan by Al-Albani',
  83: 'Ibn as-Sunni (71), Sunan Abi Dawud 5081 (Sahih Mawquf)',
  84: 'Sunan Abi Dawud 5074, Sunan Ibn Majah 3871, graded Sahih by Al-Albani',
  85: 'Jami` at-Tirmidhi 3392, Sunan Abi Dawud 5067 (Sahih)',
  86: 'Sunan Abi Dawud 5088, Jami` at-Tirmidhi 3388 (Hasan Sahih)',
  87: 'Musnad Ahmad 4/337, Sunan Abi Dawud 5072, Jami` at-Tirmidhi 3389',
  88: 'Mustadrak al-Hakim 1/545 (Sahih), Sahih at-Targhib wat-Tarhib 1/273',
  89: 'Musnad Ahmad 3/406, 407, Sahih al-Jami` 4674',
  90: 'Sahih Muslim 2726 (Book of Dhikr, Supplication, and Repentance)',
  91: 'Sunan Ibn Majah 925, graded Sahih by Al-Albani in Sahih Ibn Majah 1/152',
  92: 'Sahih al-Bukhari 6307, Sahih Muslim 2702',
  93: 'Sahih Muslim 2709, Jami` at-Tirmidhi 3604',
  94: 'At-Tabarani, graded Jayyid; Sahih at-Targhib wat-Tarhib 1/273',
  95: 'Sahih al-Bukhari 3293, Sahih Muslim 2691',
  96: 'Sahih Muslim 2692, Sahih al-Bukhari 6405',
  97: 'Sahih Muslim 2723',
  98: 'Sunan Abi Dawud 5068',
};

// Descriptive English and Arabic titles for Chapter 27 items
const C27_TITLES = {
  75: { en: 'Ayat al-Kursi (The Verse of the Throne)', ar: 'آية الكرسي', benefit: 'Whoever recites this in the morning is shielded until evening, and in the evening until morning.' },
  76: { en: 'The Three Surahs of Refuge (Al-Mu`awwidhat)', ar: 'المعوذات الثلاث', benefit: 'Recited 3 times morning and evening; suffices the believer against all harm.' },
  77: { en: 'Affirmation of Sovereignty and Seeking Good', ar: 'أصبحنا وأصبح الملك لله', benefit: 'Sunnah supplication declaring total sovereignty belongs to Allah and seeking the good of the day.' },
  78: { en: 'Entrusting Day and Night to Allah', ar: 'اللهم بك أصبحنا وبك أمسينا', benefit: 'Remembrance that living, dying, and resurrecting are all in the Hand of Allah.' },
  79: { en: 'Sayyid al-Istighfar (The Master Supplication for Forgiveness)', ar: 'سيد الاستغفار', benefit: 'Whoever says it with conviction and dies that day or night enters Paradise.' },
  80: { en: 'Bearing Witness to the Creator and His Angels', ar: 'اللهم إني أصبحت أشهدك', benefit: 'Recited 4 times in the morning and evening; Allah frees the reciter from the Fire.' },
  81: { en: 'Daily Gratitude for Blessings Received', ar: 'اللهم ما أصبح بي من نعمة', benefit: 'Whoever says it in the morning fulfills gratitude for the day, and in the evening for the night.' },
  82: { en: 'Supplication for Bodily Health and Protection from Kufr and Debt', ar: 'اللهم عافني في بدني', benefit: 'Recited 3 times for sound physical health, hearing, eyesight, and refuge from the grave.' },
  83: { en: 'Sufficiency of Allah', ar: 'حسبي الله لا إله إلا هو', benefit: 'Recited 7 times; Allah suffices the servant in whatever worries them in this life and the next.' },
  84: { en: 'Asking for Pardon, Well-being and Comprehensive Protection', ar: 'اللهم إني أسألك العفو والعافية', benefit: 'The Prophet ﷺ never omitted this comprehensive du`a for family, faith, wealth, and safety from all sides.' },
  85: { en: 'Knower of the Unseen and Refuge from Satan', ar: 'اللهم عالم الغيب والشهادة', benefit: 'Seeking refuge in the Creator of heavens and earth from one`s own ego and Satan`s traps.' },
  86: { en: 'In the Name of Allah with Whose Name Nothing Can Harm', ar: 'بسم الله الذي لا يضر مع اسمه شيء', benefit: 'Recited 3 times; nothing in the heavens or earth can harm the believer.' },
  87: { en: 'Satisfaction with Allah as Lord, Islam as Religion, and Muhammad as Prophet', ar: 'رضيت بالله رباً', benefit: 'Recited 3 times; it becomes an obligation upon Allah to please the servant on Judgment Day.' },
  88: { en: 'O Ever-Living, O Self-Subsisting (Ya Hayyu Ya Qayyum)', ar: 'يا حي يا قيوم برحمتك أستغيث', benefit: 'Beseeching Allah through His Greatest Names to rectify all affairs without leaving us to ourselves.' },
  89: { en: 'Morning upon the Natural State of Islam', ar: 'أصبحنا على فطرة الإسلام', benefit: 'Reaffirming pure Tawhid, the religion of Muhammad ﷺ, and the upright creed of Ibrahim.' },
  90: { en: 'Immense Dhikr Equaling Hours of Praise', ar: 'سبحان الله وبحمده عدد خلقه', benefit: 'Recited 3 times; outweighs hours of continuous glorification.' },
  91: { en: 'Asking for Beneficial Knowledge, Pure Sustenance, and Accepted Deeds', ar: 'اللهم إني أسألك علماً نافعاً', benefit: 'Prophetic morning du`a establishing true spiritual priorities for the entire day.' },
  92: { en: 'Daily Repentance and Seeking Forgiveness', ar: 'أستغفر الله وأتوب إليه', benefit: 'Sunnah of the Prophet ﷺ who sought Allah`s forgiveness over 100 times daily.' },
  93: { en: 'Refuge in the Perfect Words of Allah from the Evil of Creation', ar: 'أعوذ بكلمات الله التامات', benefit: 'Recited 3 times in the evening; no poisonous insect, reptile, or harm shall touch the reciter.' },
  94: { en: 'Sending Blessings upon the Prophet Muhammad ﷺ', ar: 'الصلاة والسلام على نبينا محمد', benefit: 'Recited 10 times in morning and evening; earns the Prophet`s intercession on the Day of Resurrection.' },
  95: { en: 'The Greatest Formula of Tawhid 100 Times', ar: 'لا إله إلا الله وحده لا شريك له', benefit: 'Reward of freeing 10 slaves, 100 good deeds written, 100 sins erased, and sanctuary from Satan.' },
  96: { en: 'SubhanAllahi wa bihamdihi 100 Times', ar: 'سبحان الله وبحمده', benefit: 'Sins are forgiven even if they are like the foam of the sea, and none will bring better on Judgment Day.' },
};

async function buildDataset() {
  console.log('Fetching Hisn al-Muslim data from authentic Muslim World repository...');
  
  const enRes = await fetch('https://raw.githubusercontent.com/wafaaelmaandy/Hisn-Muslim-Json/master/husn_en.json');
  if (!enRes.ok) throw new Error('Failed to fetch English Hisnul Muslim dataset');
  const enData = await enRes.json();
  
  const arRes = await fetch('https://raw.githubusercontent.com/abdalrhmanreda/islamic-data-assets/main/hisn_almuslim.json');
  if (!arRes.ok) throw new Error('Failed to fetch Arabic Hisnul Muslim dataset');
  const arData = await arRes.json();
  const arKeys = Object.keys(arData);

  const chapters = enData.English;

  // Exact category mappings
  const categoryAssignments = {
    "After Prayer": [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 32, 33],
    "Sleep": [1, 28, 29, 30, 31],
    "Protection": [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 48, 82, 88, 92, 94, 124, 125, 126, 128],
    "Forgiveness": [44, 85, 86, 129],
    "Gratitude": [70, 71, 72, 87, 93, 106, 107, 123, 130, 131],
    "Daily Dhikr": [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
      61, 62, 63, 64, 65, 66, 67, 68, 69, 73, 74, 75, 76,
      77, 78, 79, 80, 81, 83, 84, 89, 90, 91, 95, 96, 97,
      98, 99, 100, 101, 102, 103, 104, 105, 108, 109, 110,
      111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
      122, 127, 132
    ]
  };

  const chapterCatMap = new Map();
  for (const [cat, chIds] of Object.entries(categoryAssignments)) {
    for (const id of chIds) {
      chapterCatMap.set(id, cat);
    }
  }

  const allItems = [];

  for (const ch of chapters) {
    const arKey = arKeys[ch.ID + 1] || '';
    const arChapter = arData[arKey] || {};
    
    // Clean footnotes for sources
    let footnoteSources = 'Hisn al-Muslim (Fortress of the Muslim)';
    if (Array.isArray(arChapter.footnote) && arChapter.footnote.length > 0) {
      footnoteSources = arChapter.footnote
        .filter(f => !f.startsWith('*'))
        .slice(0, 3)
        .join(' • ');
      if (!footnoteSources) footnoteSources = 'Hisn al-Muslim (Fortress of the Muslim)';
    }

    const textList = ch.TEXT || [];
    for (let i = 0; i < textList.length; i++) {
      const item = textList[i];
      const cat = chapterCatMap.get(ch.ID) || 'Daily Dhikr';

      let arabic = (item.ARABIC_TEXT || '').trim();
      let translation = (item.TRANSLATED_TEXT || '').trim();
      let transliteration = '';

      const rawNotes = (item.LANGUAGE_ARABIC_TRANSLATED_TEXT || '').trim();
      if (rawNotes) {
        if (rawNotes.startsWith('(') && rawNotes.endsWith(')')) {
          transliteration = rawNotes.slice(1, -1).trim();
        } else if (rawNotes.length < 350) {
          transliteration = rawNotes;
        } else {
          transliteration = rawNotes.slice(0, 300) + '...';
        }
      }

      let audioUrl = item.AUDIO || '';
      if (audioUrl.startsWith('http://')) {
        audioUrl = 'https://' + audioUrl.slice(7);
      }

      let repeat = item.REPEAT || 1;

      // Handle Chapter 27 (Morning & Evening Adhkar)
      if (ch.ID === 27) {
        const itemMeta = C27_TITLES[item.ID] || { en: ch.TITLE, ar: arKey, benefit: 'Authentic prophetic remembrance recorded in Hisn al-Muslim.' };
        const specificSrc = SPECIFIC_C27_SOURCES[item.ID] || 'Hisn al-Muslim Chapter 27';

        // Morning
        allItems.push({
          id: `hisn-${item.ID}-m`,
          title: itemMeta.en,
          titleAr: itemMeta.ar,
          category: 'Morning',
          arabic: arabic,
          transliteration: transliteration,
          translation: translation,
          source: specificSrc,
          benefit: itemMeta.benefit || 'Authentic Prophetic morning remembrance for divine light, peace, and protection throughout the day.',
          repetitions: repeat,
          audio: audioUrl,
          chapterId: ch.ID,
          chapterTitle: ch.TITLE,
          chapterTitleAr: arKey
        });

        // Evening (Exclude morning-only items like 89, 90, 91)
        if (item.ID !== 89 && item.ID !== 90 && item.ID !== 91) {
          let eveArabic = arabic
            .replace(/أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ/g, 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ')
            .replace(/اللَّهُمَّ بِكَ أَصْبَحْنَا/g, 'اللَّهُمَّ بِكَ أَمْسَيْنَا')
            .replace(/اللَّهُمَّ إِنِّي أَصْبَحْتُ/g, 'اللَّهُمَّ إِنِّي أَمْسَيْتُ')
            .replace(/اللَّهُمَّ مَا أَصْبَحَ بِي/g, 'اللَّهُمَّ مَا أَمْسَى بِي')
            .replace(/أَصْبَحْنَا عَلَى فِطْرَةِ/g, 'أَمْسَيْنَا عَلَى فِطْرَةِ');

          let eveTranslation = translation
            .replace(/\bmorning\b/gi, 'evening')
            .replace(/\bday\b/gi, 'night');

          let eveTitle = itemMeta.en.replace(/Morning/gi, 'Evening');
          let eveTitleAr = itemMeta.ar.replace(/أصبحنا/gi, 'أمسينا');

          allItems.push({
            id: `hisn-${item.ID}-e`,
            title: eveTitle,
            titleAr: eveTitleAr,
            category: 'Evening',
            arabic: eveArabic,
            transliteration: transliteration.replace(/asbah/gi, 'amsa'),
            translation: eveTranslation,
            source: specificSrc,
            benefit: itemMeta.benefit || 'Authentic Prophetic evening remembrance for sanctuary, serene heart, and protection until morning.',
            repetitions: repeat,
            audio: audioUrl,
            chapterId: ch.ID,
            chapterTitle: ch.TITLE,
            chapterTitleAr: arKey
          });
        }

        continue;
      }

      // Repetition count Sunnah rules
      if (ch.ID === 25 && arabic.includes('أَسْتَغْفِرُ اللَّهَ')) {
        repeat = 3;
      } else if (ch.ID === 25 && arabic.includes('سُبْحَانَ اللَّهِ')) {
        repeat = 33;
      } else if (ch.ID === 33) {
        repeat = 3;
      } else if (ch.ID === 129 && (arabic.includes('مِائَةَ') || translation.includes('100'))) {
        repeat = 100;
      }

      allItems.push({
        id: `hisn-${item.ID}`,
        title: `${ch.TITLE}${textList.length > 1 ? ` (#${i + 1})` : ''}`,
        titleAr: arKey,
        category: cat,
        arabic: arabic,
        transliteration: transliteration,
        translation: translation,
        source: footnoteSources,
        benefit: `Authentic supplication preserved in Hisn al-Muslim (Chapter: ${ch.TITLE})`,
        repetitions: repeat,
        audio: audioUrl,
        chapterId: ch.ID,
        chapterTitle: ch.TITLE,
        chapterTitleAr: arKey
      });
    }
  }

  console.log(`Successfully compiled ${allItems.length} authentic Hisnul Muslim supplications.`);
  const counts = {};
  allItems.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  console.log('Category breakdown:', counts);

  const outPath = path.join(process.cwd(), 'src', 'data', 'hisnulMuslimComplete.json');
  fs.writeFileSync(outPath, JSON.stringify(allItems, null, 2), 'utf8');
  console.log('Saved to', outPath);
}

buildDataset().catch(err => {
  console.error('Error generating dataset:', err);
  process.exit(1);
});
