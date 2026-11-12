import { Surah, Reciter } from '../types';

export const RECITERS: Reciter[] = [
  {
    id: 'dossary',
    name: 'Yasser Al-Dossary',
    arabicName: 'ياسر الدوسري',
    style: 'Murattal',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'mishary',
    name: 'Mishary Rashid Alafasy',
    arabicName: 'مشاري راشد العفاسي',
    style: 'Murattal',
    subfolder: 'Alafasy_128kbps',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus-Samad',
    arabicName: 'عبد الباسط عبد الصمد',
    style: 'Murattal',
    subfolder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    style: 'Murattal',
    subfolder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    arabicName: 'محمد صديق المنشاوي',
    style: 'Murattal',
    subfolder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'muaiqly',
    name: 'Maher Al-Muaiqly',
    arabicName: 'ماهر المعيقلي',
    style: 'Murattal',
    subfolder: 'Maher_AlMuaiqly_64kbps',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    arabicName: 'سعد الغامدي',
    style: 'Murattal',
    subfolder: 'Ghamadi_40kbps',
  },
  {
    id: 'qatami',
    name: 'Nasser Al-Qatami',
    arabicName: 'ناصر القطامي',
    style: 'Murattal',
    subfolder: 'Nasser_Alqatami_128kbps',
  },
];

// Helper to construct ayah audio URL using EveryAyah (authorized public audio)
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciterId = 'dossary'): string {
  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  const formattedSurah = String(surahNumber).padStart(3, '0');
  const formattedAyah = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter.subfolder}/${formattedSurah}${formattedAyah}.mp3`;
}

// Canonical 1–114 Qur'an Surahs in standard Qur'anic order (strictly never randomized or alphabetically sorted)
export const ALL_SURAHS: Surah[] = [
  {
    number: 1,
    name: 'الفاتحة',
    englishName: 'Al-Fatihah',
    englishNameTranslation: 'The Opening',
    numberOfAyahs: 7,
    revelationType: 'Meccan',
    revelationOrder: 5,
    pageNumber: 1,
    juzNumber: 1,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
      { number: 2, numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds -' },
      { number: 3, numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful,' },
      { number: 4, numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.' },
      { number: 5, numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.' },
      { number: 6, numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path -' },
      { number: 7, numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.' }
    ]
  },
  {
    number: 2,
    name: 'البقرة',
    englishName: 'Al-Baqarah',
    englishNameTranslation: 'The Cow',
    numberOfAyahs: 286,
    revelationType: 'Medinan',
    revelationOrder: 87,
    pageNumber: 2,
    juzNumber: 1,
    sampleAyahs: [
      { number: 8, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' },
      { number: 9, numberInSurah: 2, text: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ', translation: 'This is the Book about which there is no doubt, a guidance for those conscious of Allah -' },
      { number: 10, numberInSurah: 3, text: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ', translation: 'Who believe in the unseen, establish prayer, and spend out of what We have provided for them,' },
      { number: 255, numberInSurah: 255, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ', translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great. (Ayat al-Kursi)' },
      { number: 285, numberInSurah: 285, text: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ', translation: 'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers.' },
      { number: 286, numberInSurah: 286, text: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا', translation: 'Allah does not charge a soul except with that within its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. "Our Lord, do not impose blame upon us if we have forgotten or erred..."' }
    ]
  },
  {
    number: 3,
    name: 'آل عمران',
    englishName: 'Ali \'Imran',
    englishNameTranslation: 'Family of Imran',
    numberOfAyahs: 200,
    revelationType: 'Medinan',
    revelationOrder: 89,
    pageNumber: 50,
    juzNumber: 3,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' },
      { number: 2, numberInSurah: 2, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.' },
      { number: 18, numberInSurah: 18, text: 'شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ قَائِمًا بِالْقِسْطِ ۚ لَا إِلَٰهَ إِلَّا هُوَ الْعَزِيزُ الْحَكِيمُ', translation: 'Allah witnesses that there is no deity except Him, and [so do] the angels and those of knowledge - [that He is] maintaining [creation] in justice. There is no deity except Him, the Exalted in Might, the Wise.' }
    ]
  },
  { number: 4, name: 'النساء', englishName: 'An-Nisa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan', revelationOrder: 92, pageNumber: 77, juzNumber: 4, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ', translation: 'O mankind, fear your Lord, who created you from one soul and created from it its mate and dispersed from both of them many men and women.' }] },
  { number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', englishNameTranslation: 'The Table Spread', numberOfAyahs: 120, revelationType: 'Medinan', revelationOrder: 112, pageNumber: 106, juzNumber: 6, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ', translation: 'O you who have believed, fulfill [all] contracts.' }] },
  { number: 6, name: 'الأنعام', englishName: 'Al-An\'am', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan', revelationOrder: 55, pageNumber: 128, juzNumber: 7, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ وَجَعَلَ الظُّلُمَاتِ وَالنُّورَ', translation: '[All] praise is [due] to Allah, who created the heavens and the earth and made the darkness and the light.' }] },
  { number: 7, name: 'الأعراف', englishName: 'Al-A\'raf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan', revelationOrder: 39, pageNumber: 151, juzNumber: 8, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'المص', translation: 'Alif, Lam, Meem, Sad.' }] },
  { number: 8, name: 'الأنفال', englishName: 'Al-Anfal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan', revelationOrder: 88, pageNumber: 177, juzNumber: 9, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَسْأَلُونَكَ عَنِ الْأَنفَالِ ۖ قُلِ الْأَنفَالُ لِلَّهِ وَالرَّسُولِ', translation: 'They ask you, [O Muhammad], about the bounties [of war]. Say, "The [decision concerning] bounties is for Allah and the Messenger."' }] },
  { number: 9, name: 'التوبة', englishName: 'At-Tawbah', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan', revelationOrder: 113, pageNumber: 187, juzNumber: 10, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'بَرَاءَةٌ مِّنَ اللَّهِ وَرَسُولِهِ إِلَى الَّذِينَ عَاهَدتُّم مِّنَ الْمُشْرِكِينَ', translation: '[This is a declaration of] disassociation, from Allah and His Messenger, to those with whom you had made a treaty among the polytheists.' }] },
  { number: 10, name: 'يونس', englishName: 'Yunus', englishNameTranslation: 'Jonah', numberOfAyahs: 109, revelationType: 'Meccan', revelationOrder: 51, pageNumber: 208, juzNumber: 11, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الر ۚ تِلْكَ آيَاتُ الْكِتَابِ الْحَكِيمِ', translation: 'Alif, Lam, Ra. These are the verses of the wise Book.' }] },
  { number: 11, name: 'هود', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan', revelationOrder: 52, pageNumber: 221, juzNumber: 11, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الر ۚ كِتَابٌ أُحْكِمَتْ آيَاتُهُ ثُمَّ فُصِّلَتْ مِن لَّدُنْ حَكِيمٍ خَبِيرٍ', translation: 'Alif, Lam, Ra. [This is] a Book whose verses are perfected and then presented in detail from [one who is] Wise and Acquainted.' }] },
  { number: 12, name: 'يوسف', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan', revelationOrder: 53, pageNumber: 235, juzNumber: 12, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الر ۚ تِلْكَ آيَاتُ الْكِتَابِ الْمُبِينِ', translation: 'Alif, Lam, Ra. These are the verses of the clear Book.' }] },
  { number: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan', revelationOrder: 96, pageNumber: 249, juzNumber: 13, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'المر ۚ تِلْكَ آيَاتُ الْكِتَابِ ۗ وَالَّذِي أُنزِلَ إِلَيْكَ مِن رَّبِّكَ الْحَقُّ', translation: 'Alif, Lam, Meem, Ra. These are the verses of the Book; and what has been revealed to you from your Lord is the truth.' }] },
  { number: 14, name: 'إبراهيم', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan', revelationOrder: 72, pageNumber: 255, juzNumber: 13, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الر ۚ كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ لِتُخْرِجَ النَّاسَ مِنَ الظُّلُمَاتِ إِلَى النُّورِ', translation: 'Alif, Lam, Ra. [This is] a Book which We have revealed to you, [O Muhammad], that you might bring mankind out of darknesses into the light.' }] },
  { number: 15, name: 'الحجر', englishName: 'Al-Hijr', englishNameTranslation: 'The Rocky Tract', numberOfAyahs: 99, revelationType: 'Meccan', revelationOrder: 54, pageNumber: 262, juzNumber: 14, sampleAyahs: [{ number: 9, numberInSurah: 9, text: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ', translation: 'Indeed, it is We who sent down the Qur\'an and indeed, We will be its guardian.' }] },
  { number: 16, name: 'النحل', englishName: 'An-Nahl', englishNameTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan', revelationOrder: 70, pageNumber: 267, juzNumber: 14, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'أَتَىٰ أَمْرُ اللَّهِ فَلَا تَسْتَعْجِلُوهُ ۚ سُبْحَانَهُ وَتَعَالَىٰ عَمَّا يُشْرِكُونَ', translation: 'The command of Allah is coming, so be not impatient for it. Exalted is He and high above what they associate with Him.' }] },
  { number: 17, name: 'الإسراء', englishName: 'Al-Isra', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan', revelationOrder: 50, pageNumber: 282, juzNumber: 15, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى', translation: 'Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed.' }] },
  {
    number: 18,
    name: 'الكهف',
    englishName: 'Al-Kahf',
    englishNameTranslation: 'The Cave',
    numberOfAyahs: 110,
    revelationType: 'Meccan',
    revelationOrder: 69,
    pageNumber: 293,
    juzNumber: 15,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنْزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَلْ لَهُ عِوَجًا', translation: '[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.' },
      { number: 2, numberInSurah: 2, text: 'قَيِّمًا لِيُنْذِرَ بَأْسًا شَدِيدًا مِنْ لَدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا', translation: '[He has made it] straight, to warn of severe punishment from Him and to give good tidings to the believers who do righteous deeds that they will have a good reward.' },
      { number: 10, numberInSurah: 10, text: 'إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا', translation: 'When the youths retreated to the cave and said, "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance."' }
    ]
  },
  { number: 19, name: 'مريم', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan', revelationOrder: 44, pageNumber: 305, juzNumber: 16, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'كهيعص', translation: 'Kaf, Ha, Ya, \'Ayn, Sad.' }] },
  { number: 20, name: 'طه', englishName: 'Ta-Ha', englishNameTranslation: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan', revelationOrder: 45, pageNumber: 312, juzNumber: 16, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'طه', translation: 'Ta, Ha.' }, { number: 2, numberInSurah: 2, text: 'مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ', translation: 'We have not sent down to you the Qur\'an that you be distressed.' }] },
  { number: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan', revelationOrder: 73, pageNumber: 322, juzNumber: 17, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ مُّعْرِضُونَ', translation: '[The time of] their account has approached for the people, while they are in heedlessness turning away.' }] },
  { number: 22, name: 'الحج', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan', revelationOrder: 103, pageNumber: 332, juzNumber: 17, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمْ ۚ إِنَّ زَلْزَلَةَ السَّاعَةِ شَيْءٌ عَظِيمٌ', translation: 'O mankind, fear your Lord. Indeed, the convulsion of the [final] Hour is a terrible thing.' }] },
  { number: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan', revelationOrder: 74, pageNumber: 342, juzNumber: 18, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ', translation: 'Certainly will the believers have succeeded:' }, { number: 2, numberInSurah: 2, text: 'الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ', translation: 'They who are during their prayer humbly submissive' }] },
  { number: 24, name: 'النور', englishName: 'An-Nur', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan', revelationOrder: 102, pageNumber: 350, juzNumber: 18, sampleAyahs: [{ number: 35, numberInSurah: 35, text: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ', translation: 'Allah is the Light of the heavens and the earth. The example of His light is like a niche within which is a lamp (Ayat an-Nur).' }] },
  { number: 25, name: 'الفرقان', englishName: 'Al-Furqan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan', revelationOrder: 42, pageNumber: 359, juzNumber: 18, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ عَلَىٰ عَبْدِهِ لِيَكُونَ لِلْعَالَمِينَ نَذِيرًا', translation: 'Blessed is He who sent down the Criterion upon His Servant that he may be to the worlds a warner.' }] },
  { number: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan', revelationOrder: 47, pageNumber: 367, juzNumber: 19, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'طسم', translation: 'Ta, Seen, Meem.' }] },
  { number: 27, name: 'النمل', englishName: 'An-Naml', englishNameTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan', revelationOrder: 48, pageNumber: 377, juzNumber: 19, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'طس ۚ تِلْكَ آيَاتُ الْقُرْآنِ وَكِتَابٍ مُّبِينٍ', translation: 'Ta, Seen. These are the verses of the Qur\'an and a clear Book.' }] },
  { number: 28, name: 'القصص', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan', revelationOrder: 49, pageNumber: 385, juzNumber: 20, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'طسم', translation: 'Ta, Seen, Meem.' }] },
  { number: 29, name: 'العنكبوت', englishName: 'Al-\'Ankabut', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan', revelationOrder: 85, pageNumber: 396, juzNumber: 20, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' }] },
  { number: 30, name: 'الروم', englishName: 'Ar-Rum', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan', revelationOrder: 84, pageNumber: 404, juzNumber: 21, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' }] },
  { number: 31, name: 'لقمان', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan', revelationOrder: 57, pageNumber: 411, juzNumber: 21, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' }] },
  { number: 32, name: 'السجدة', englishName: 'As-Sajdah', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan', revelationOrder: 75, pageNumber: 415, juzNumber: 21, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الم', translation: 'Alif, Lam, Meem.' }] },
  { number: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', englishNameTranslation: 'The Combined Forces', numberOfAyahs: 73, revelationType: 'Medinan', revelationOrder: 90, pageNumber: 418, juzNumber: 21, sampleAyahs: [{ number: 56, numberInSurah: 56, text: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا', translation: 'Indeed, Allah confers blessing upon the Prophet, and His angels [ask Him to do so]. O you who have believed, ask [Allah to confer] blessing upon him and ask [Allah to grant him] peace.' }] },
  { number: 34, name: 'سبأ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan', revelationOrder: 58, pageNumber: 428, juzNumber: 22, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', translation: '[All] praise is [due] to Allah, to whom belongs whatever is in the heavens and whatever is in the earth.' }] },
  { number: 35, name: 'فاطر', englishName: 'Fatir', englishNameTranslation: 'Originator', numberOfAyahs: 45, revelationType: 'Meccan', revelationOrder: 43, pageNumber: 434, juzNumber: 22, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الْحَمْدُ لِلَّهِ فَاطِرِ السَّمَاوَاتِ وَالْأَرْضِ جَاعِلِ الْمَلَائِكَةِ رُسُلًا', translation: '[All] praise is [due] to Allah, Creator of the heavens and the earth, [who] made the angels messengers.' }] },
  {
    number: 36,
    name: 'يس',
    englishName: 'Ya-Sin',
    englishNameTranslation: 'Ya Sin',
    numberOfAyahs: 83,
    revelationType: 'Meccan',
    revelationOrder: 41,
    pageNumber: 440,
    juzNumber: 22,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'يس', translation: 'Ya, Seen.' },
      { number: 2, numberInSurah: 2, text: 'وَالْقُرْآنِ الْحَكِيمِ', translation: 'By the wise Qur\'an.' },
      { number: 3, numberInSurah: 3, text: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ', translation: 'Indeed you, [O Muhammad], are from among the messengers,' },
      { number: 4, numberInSurah: 4, text: 'عَلَىٰ صِرَاطٍ مُسْتَقِيمٍ', translation: 'On a straight path.' }
    ]
  },
  { number: 37, name: 'الصافات', englishName: 'As-Saffat', englishNameTranslation: 'Those Who Set The Ranks', numberOfAyahs: 182, revelationType: 'Meccan', revelationOrder: 56, pageNumber: 446, juzNumber: 23, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالصَّافَّاتِ صَفًّا', translation: 'By those [angels] lined up in rows' }] },
  { number: 38, name: 'ص', englishName: 'Sad', englishNameTranslation: 'The Letter Sad', numberOfAyahs: 88, revelationType: 'Meccan', revelationOrder: 38, pageNumber: 453, juzNumber: 23, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'ص ۚ وَالْقُرْآنِ ذِي الذِّكْرِ', translation: 'Sad. By the Qur\'an containing reminder.' }] },
  { number: 39, name: 'الزمر', englishName: 'Az-Zumar', englishNameTranslation: 'The Troops', numberOfAyahs: 75, revelationType: 'Meccan', revelationOrder: 59, pageNumber: 458, juzNumber: 23, sampleAyahs: [{ number: 53, numberInSurah: 53, text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا', translation: 'Say, "O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."' }] },
  { number: 40, name: 'غافر', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan', revelationOrder: 60, pageNumber: 467, juzNumber: 24, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 41, name: 'فصلت', englishName: 'Fussilat', englishNameTranslation: 'Explained in Detail', numberOfAyahs: 54, revelationType: 'Meccan', revelationOrder: 61, pageNumber: 477, juzNumber: 24, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 42, name: 'الشورى', englishName: 'Ash-Shuraa', englishNameTranslation: 'The Consultation', numberOfAyahs: 53, revelationType: 'Meccan', revelationOrder: 62, pageNumber: 483, juzNumber: 25, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', englishNameTranslation: 'The Ornaments of Gold', numberOfAyahs: 89, revelationType: 'Meccan', revelationOrder: 63, pageNumber: 489, juzNumber: 25, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 44, name: 'الدخان', englishName: 'Ad-Dukhan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan', revelationOrder: 64, pageNumber: 496, juzNumber: 25, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', englishNameTranslation: 'The Crouching', numberOfAyahs: 37, revelationType: 'Meccan', revelationOrder: 65, pageNumber: 499, juzNumber: 25, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', englishNameTranslation: 'The Wind-Curved Sandhills', numberOfAyahs: 35, revelationType: 'Meccan', revelationOrder: 66, pageNumber: 502, juzNumber: 26, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'حم', translation: 'Ha, Meem.' }] },
  { number: 47, name: 'محمد', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan', revelationOrder: 95, pageNumber: 507, juzNumber: 26, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الَّذِينَ كَفَرُوا وَصَدُّوا عَن سَبِيلِ اللَّهِ أَضَلَّ أَعْمَالَهُمْ', translation: 'Those who disbelieve and avert [people] from the way of Allah - He will cause their deeds to be in vain.' }] },
  { number: 48, name: 'الفتح', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan', revelationOrder: 111, pageNumber: 511, juzNumber: 26, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا', translation: 'Indeed, We have given you, [O Muhammad], a clear conquest' }] },
  { number: 49, name: 'الحجرات', englishName: 'Al-Hujurat', englishNameTranslation: 'The Rooms', numberOfAyahs: 18, revelationType: 'Medinan', revelationOrder: 106, pageNumber: 515, juzNumber: 26, sampleAyahs: [{ number: 13, numberInSurah: 13, text: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا', translation: 'O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another. Indeed, the most noble of you in the sight of Allah is the most righteous of you.' }] },
  { number: 50, name: 'ق', englishName: 'Qaf', englishNameTranslation: 'The Letter Qaf', numberOfAyahs: 45, revelationType: 'Meccan', revelationOrder: 34, pageNumber: 518, juzNumber: 26, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'ق ۚ وَالْقُرْآنِ الْمَجِيدِ', translation: 'Qaf. By the honored Qur\'an...' }] },
  { number: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan', revelationOrder: 67, pageNumber: 520, juzNumber: 26, sampleAyahs: [{ number: 56, numberInSurah: 56, text: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ', translation: 'And I did not create the jinn and mankind except to worship Me.' }] },
  { number: 52, name: 'الطور', englishName: 'At-Tur', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan', revelationOrder: 76, pageNumber: 523, juzNumber: 27, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالطُّورِ', translation: 'By the mount' }] },
  { number: 53, name: 'النجم', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan', revelationOrder: 23, pageNumber: 526, juzNumber: 27, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالنَّجْمِ إِذَا هَوَىٰ', translation: 'By the star when it descends' }] },
  { number: 54, name: 'القمر', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan', revelationOrder: 37, pageNumber: 528, juzNumber: 27, sampleAyahs: [{ number: 17, numberInSurah: 17, text: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ', translation: 'And We have certainly made the Qur\'an easy for remembrance, so is there any who will remember?' }] },
  {
    number: 55,
    name: 'الرحمن',
    englishName: 'Ar-Rahman',
    englishNameTranslation: 'The Beneficent',
    numberOfAyahs: 78,
    revelationType: 'Medinan',
    revelationOrder: 97,
    pageNumber: 531,
    juzNumber: 27,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'الرَّحْمَٰنُ', translation: 'The Most Merciful' },
      { number: 2, numberInSurah: 2, text: 'عَلَّمَ الْقُرْآنَ', translation: 'Taught the Qur\'an,' },
      { number: 3, numberInSurah: 3, text: 'خَلَقَ الْإِنْسَانَ', translation: 'Created man,' },
      { number: 4, numberInSurah: 4, text: 'عَلَّمَهُ الْبَيَانَ', translation: '[And] taught him eloquence.' },
      { number: 13, numberInSurah: 13, text: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', translation: 'So which of the favors of your Lord would you deny?' }
    ]
  },
  {
    number: 56,
    name: 'الواقعة',
    englishName: 'Al-Waqi\'ah',
    englishNameTranslation: 'The Inevitable',
    numberOfAyahs: 96,
    revelationType: 'Meccan',
    revelationOrder: 46,
    pageNumber: 534,
    juzNumber: 27,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'إِذَا وَقَعَتِ الْوَاقِعَةُ', translation: 'When the Occurrence occurs,' },
      { number: 2, numberInSurah: 2, text: 'لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ', translation: 'There is, at its occurrence, no denial.' }
    ]
  },
  { number: 57, name: 'الحديد', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan', revelationOrder: 94, pageNumber: 537, juzNumber: 27, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ', translation: 'Whatever is in the heavens and earth exalts Allah, and He is the Exalted in Might, the Wise.' }] },
  { number: 58, name: 'المجادلة', englishName: 'Al-Mujadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan', revelationOrder: 105, pageNumber: 542, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا', translation: 'Certainly has Allah heard the speech of the one who argues with you, [O Muhammad], concerning her husband.' }] },
  { number: 59, name: 'الحشر', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan', revelationOrder: 101, pageNumber: 545, juzNumber: 28, sampleAyahs: [{ number: 22, numberInSurah: 22, text: 'هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ الرَّحْمَٰنُ الرَّحِيمُ', translation: 'He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed. He is the Entirely Merciful, the Especially Merciful.' }] },
  { number: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', englishNameTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan', revelationOrder: 91, pageNumber: 549, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَتَّخِذُوا عَدُوِّي وَعَدُوَّكُمْ أَوْلِيَاءَ', translation: 'O you who have believed, do not take My enemies and your enemies as allies.' }] },
  { number: 61, name: 'الصف', englishName: 'As-Saf', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan', revelationOrder: 109, pageNumber: 551, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ', translation: 'Whatever is in the heavens and whatever is on the earth exalts Allah, and He is the Exalted in Might, the Wise.' }] },
  { number: 62, name: 'الجمعة', englishName: 'Al-Jumu\'ah', englishNameTranslation: 'Friday', numberOfAyahs: 11, revelationType: 'Medinan', revelationOrder: 110, pageNumber: 553, juzNumber: 28, sampleAyahs: [{ number: 9, numberInSurah: 9, text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ', translation: 'O you who have believed, when [the adhan] is called for the prayer on the day of Jumu\'ah [Friday], then proceed to the remembrance of Allah and leave business.' }] },
  { number: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan', revelationOrder: 104, pageNumber: 554, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِذَا جَاءَكَ الْمُنَافِقُونَ قَالُوا نَشْهَدُ إِنَّكَ لَرَسُولُ اللَّهِ', translation: 'When the hypocrites come to you, [O Muhammad], they say, "We testify that you are the Messenger of Allah."' }] },
  { number: 64, name: 'التغابن', englishName: 'At-Taghabun', englishNameTranslation: 'Mutual Loss and Gain', numberOfAyahs: 18, revelationType: 'Medinan', revelationOrder: 108, pageNumber: 556, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۖ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ', translation: 'Whatever is in the heavens and whatever is on the earth exalts Allah. To Him belongs dominion, and to Him belongs [all] praise.' }] },
  { number: 65, name: 'الطلاق', englishName: 'At-Talaq', englishNameTranslation: 'The Divorce', numberOfAyahs: 12, revelationType: 'Medinan', revelationOrder: 99, pageNumber: 558, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا النَّبِيُّ إِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ', translation: 'O Prophet, when you [Muslims] divorce women, divorce them for [the commencement of] their waiting period.' }] },
  { number: 66, name: 'التحريم', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan', revelationOrder: 107, pageNumber: 560, juzNumber: 28, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا النَّبِيُّ لِمَ تُحَرِّمُ مَا أَحَلَّ اللَّهُ لَكَ', translation: 'O Prophet, why do you prohibit [yourself from] what Allah has made lawful for you?' }] },
  {
    number: 67,
    name: 'الملك',
    englishName: 'Al-Mulk',
    englishNameTranslation: 'The Sovereignty',
    numberOfAyahs: 30,
    revelationType: 'Meccan',
    revelationOrder: 77,
    pageNumber: 562,
    juzNumber: 29,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translation: 'Blessed is He in whose hand is dominion, and He is over all things competent -' },
      { number: 2, numberInSurah: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ', translation: '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -' },
      { number: 3, numberInSurah: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِنْ تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِنْ فُطُورٍ', translation: '[And] who created seven heavens in layers. You see no disparity in the creation of the Most Merciful. So return [your] vision; do you see any breaks?' }
    ]
  },
  { number: 68, name: 'القلم', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan', revelationOrder: 2, pageNumber: 564, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'ن ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ', translation: 'Nun. By the pen and what they inscribe' }] },
  { number: 69, name: 'الحاقة', englishName: 'Al-Haqqah', englishNameTranslation: 'The Inevitable Reality', numberOfAyahs: 52, revelationType: 'Meccan', revelationOrder: 78, pageNumber: 566, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الْحَاقَّةُ', translation: 'The Inevitable Reality' }, { number: 2, numberInSurah: 2, text: 'مَا الْحَاقَّةُ', translation: 'What is the Inevitable Reality?' }, { number: 3, numberInSurah: 3, text: 'وَمَا أَدْرَاكَ مَا الْحَاقَّةُ', translation: 'And what can make you know what is the Inevitable Reality?' }] },
  { number: 70, name: 'المعارج', englishName: 'Al-Ma\'arij', englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan', revelationOrder: 79, pageNumber: 568, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'سَأَلَ سَائِلٌ بِعَذَابٍ وَاقِعٍ', translation: 'A questioner asked about a penalty bound to happen' }] },
  { number: 71, name: 'نوح', englishName: 'Nuh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan', revelationOrder: 71, pageNumber: 570, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِنَّا أَرْسَلْنَا نُوحًا إِلَىٰ قَوْمِهِ أَنْ أَنذِرْ قَوْمَكَ', translation: 'Indeed, We sent Noah to his people, [saying], "Warn your people before there comes to them a painful punishment."' }] },
  { number: 72, name: 'الجن', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan', revelationOrder: 40, pageNumber: 572, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'قُلْ أُوحِيَ إِلَيَّ أَنَّهُ اسْتَمَعَ نَفَرٌ مِّنَ الْجِنِّ', translation: 'Say, [O Muhammad], "It has been revealed to me that a group of the jinn listened and said, \'Indeed, we have heard an amazing Qur\'an.\'"' }] },
  { number: 73, name: 'المزمل', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan', revelationOrder: 3, pageNumber: 574, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا الْمُزَّمِّلُ', translation: 'O you who wraps himself [in clothing],' }, { number: 2, numberInSurah: 2, text: 'قُمِ اللَّيْلَ إِلَّا قَلِيلًا', translation: 'Arise [to pray] the night, except for a little -' }, { number: 4, numberInSurah: 4, text: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', translation: 'And recite the Qur\'an with measured recitation.' }] },
  { number: 74, name: 'المدثر', englishName: 'Al-Muddaththir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan', revelationOrder: 4, pageNumber: 575, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'يَا أَيُّهَا الْمُدَّثِّرُ', translation: 'O you who covers himself [with a garment],' }, { number: 2, numberInSurah: 2, text: 'قُمْ فَأَنذِرْ', translation: 'Arise and warn' }, { number: 3, numberInSurah: 3, text: 'وَرَبَّكَ فَكَبِّرْ', translation: 'And your Lord glorify' }] },
  { number: 75, name: 'القيامة', englishName: 'Al-Qiyamah', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan', revelationOrder: 31, pageNumber: 577, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'لَا أُقْسِمُ بِيَوْمِ الْقِيَامَةِ', translation: 'I swear by the Day of Resurrection' }] },
  { number: 76, name: 'الإنسان', englishName: 'Al-Insan', englishNameTranslation: 'The Man', numberOfAyahs: 31, revelationType: 'Medinan', revelationOrder: 98, pageNumber: 578, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'هَلْ أَتَىٰ عَلَى الْإِنسَانِ حِينٌ مِّنَ الدَّهْرِ لَمْ يَكُن شَيْئًا مَّذْكُورًا', translation: 'Has there [not] come upon man a period of time when he was not a thing [even] mentioned?' }] },
  { number: 77, name: 'المرسلات', englishName: 'Al-Mursalat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan', revelationOrder: 33, pageNumber: 580, juzNumber: 29, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالْمُرْسَلَاتِ عُرْفًا', translation: 'By those [winds] sent forth in gusts' }] },
  { number: 78, name: 'النبأ', englishName: 'An-Naba', englishNameTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan', revelationOrder: 80, pageNumber: 582, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'عَمَّ يَتَسَاءَلُونَ', translation: 'About what are they asking one another?' }, { number: 2, numberInSurah: 2, text: 'عَنِ النَّبَإِ الْعَظِيمِ', translation: 'About the great news -' }] },
  { number: 79, name: 'النازعات', englishName: 'An-Nazi\'at', englishNameTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan', revelationOrder: 81, pageNumber: 583, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالنَّازِعَاتِ غَرْقًا', translation: 'By those [angels] who extract with violence' }] },
  { number: 80, name: 'عبس', englishName: '\'Abasa', englishNameTranslation: 'He Frowned', numberOfAyahs: 42, revelationType: 'Meccan', revelationOrder: 24, pageNumber: 585, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'عَبَسَ وَتَوَلَّىٰ', translation: 'The Prophet frowned and turned away' }, { number: 2, numberInSurah: 2, text: 'أَن جَاءَهُ الْأَعْمَىٰ', translation: 'Because there came to him the blind man,' }] },
  { number: 81, name: 'التكوير', englishName: 'At-Takwir', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan', revelationOrder: 7, pageNumber: 586, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِذَا الشَّمْسُ كُوِّرَتْ', translation: 'When the sun is wrapped up [in darkness]' }] },
  { number: 82, name: 'الانفطار', englishName: 'Al-Infitar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan', revelationOrder: 82, pageNumber: 587, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِذَا السَّمَاءُ انفَطَرَتْ', translation: 'When the sky breaks apart' }] },
  { number: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', englishNameTranslation: 'The Defrauding', numberOfAyahs: 36, revelationType: 'Meccan', revelationOrder: 86, pageNumber: 587, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَيْلٌ لِّلْمُطَفِّفِينَ', translation: 'Woe to those who give less [than due]' }, { number: 2, numberInSurah: 2, text: 'الَّذِينَ إِذَا اكْتَالُوا عَلَى النَّاسِ يَسْتَوْفُونَ', translation: 'Who, when they take a measure from people, take in full.' }] },
  { number: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', englishNameTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan', revelationOrder: 83, pageNumber: 589, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِذَا السَّمَاءُ انشَقَّتْ', translation: 'When the sky has split open' }] },
  { number: 85, name: 'البروج', englishName: 'Al-Buruj', englishNameTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan', revelationOrder: 27, pageNumber: 590, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالسَّمَاءِ ذَاتِ الْبُرُوجِ', translation: 'By the sky containing great stars' }] },
  { number: 86, name: 'الطارق', englishName: 'At-Tariq', englishNameTranslation: 'The Nightcomer', numberOfAyahs: 17, revelationType: 'Meccan', revelationOrder: 36, pageNumber: 591, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالسَّمَاءِ وَالطَّارِقِ', translation: 'By the sky and the night comer' }, { number: 2, numberInSurah: 2, text: 'وَمَا أَدْرَاكَ مَا الطَّارِقُ', translation: 'And what can make you know what is the night comer?' }] },
  { number: 87, name: 'الأعلى', englishName: 'Al-A\'la', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan', revelationOrder: 8, pageNumber: 591, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى', translation: 'Exalt the name of your Lord, the Most High' }, { number: 2, numberInSurah: 2, text: 'الَّذِي خَلَقَ فَسَوَّىٰ', translation: 'Who created and proportioned' }] },
  { number: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan', revelationOrder: 68, pageNumber: 592, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ', translation: 'Has there reached you the report of the Overwhelming [event]?' }] },
  { number: 89, name: 'الفجر', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan', revelationOrder: 10, pageNumber: 593, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالْفَجْرِ', translation: 'By the dawn' }, { number: 2, numberInSurah: 2, text: 'وَلَيَالٍ عَشْرٍ', translation: 'And [by] ten nights' }, { number: 3, numberInSurah: 3, text: 'وَالشَّفْعِ وَالْوَتْرِ', translation: 'And [by] the even and the odd' }] },
  { number: 90, name: 'البلد', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan', revelationOrder: 35, pageNumber: 594, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'لَا أُقْسِمُ بِهَٰذَا الْبَلَدِ', translation: 'I swear by this city, [Makkah]' }] },
  { number: 91, name: 'الشمس', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan', revelationOrder: 26, pageNumber: 595, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالشَّمْسِ وَضُحَاهَا', translation: 'By the sun and its brightness' }, { number: 2, numberInSurah: 2, text: 'وَالْقَمَرِ إِذَا تَلَاهَا', translation: 'And [by] the moon when it follows it' }] },
  { number: 92, name: 'الليل', englishName: 'Al-Layl', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan', revelationOrder: 9, pageNumber: 595, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَاللَّيْلِ إِذَا يَغْشَىٰ', translation: 'By the night when it covers' }, { number: 2, numberInSurah: 2, text: 'وَالنَّهَارِ إِذَا تَجَلَّىٰ', translation: 'And [by] the day when it appears' }] },
  {
    number: 93,
    name: 'الضحى',
    englishName: 'Ad-Duhaa',
    englishNameTranslation: 'The Morning Hours',
    numberOfAyahs: 11,
    revelationType: 'Meccan',
    revelationOrder: 11,
    pageNumber: 596,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'وَالضُّحَىٰ', translation: 'By the morning brightness' },
      { number: 2, numberInSurah: 2, text: 'وَاللَّيْلِ إِذَا سَجَىٰ', translation: 'And [by] the night when it covers with darkness,' },
      { number: 3, numberInSurah: 3, text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ', translation: 'Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you].' },
      { number: 4, numberInSurah: 4, text: 'وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ', translation: 'And the Hereafter is better for you than the first [life].' },
      { number: 5, numberInSurah: 5, text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ', translation: 'And your Lord is going to give you, and you will be satisfied.' }
    ]
  },
  {
    number: 94,
    name: 'الشرح',
    englishName: 'Ash-Sharh',
    englishNameTranslation: 'The Relief',
    numberOfAyahs: 8,
    revelationType: 'Meccan',
    revelationOrder: 12,
    pageNumber: 596,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', translation: 'Did We not expand for you, [O Muhammad], your breast?' },
      { number: 2, numberInSurah: 2, text: 'وَوَضَعْنَا عَنْكَ وِزْرَكَ', translation: 'And We removed from you your burden' },
      { number: 3, numberInSurah: 3, text: 'الَّذِي أَنْقَضَ ظَهْرَكَ', translation: 'Which had weighed upon your back' },
      { number: 4, numberInSurah: 4, text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ', translation: 'And raised high for you your repute.' },
      { number: 5, numberInSurah: 5, text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship [will be] ease.' },
      { number: 6, numberInSurah: 6, text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship [will be] ease.' },
      { number: 7, numberInSurah: 7, text: 'فَإِذَا فَرَغْتَ فَانْصَبْ', translation: 'So when you have finished [your duties], then stand up [for worship].' },
      { number: 8, numberInSurah: 8, text: 'وَإِلَىٰ رَبِّكَ فَارْغَبْ', translation: 'And to your Lord direct [your] longing.' }
    ]
  },
  { number: 95, name: 'التين', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan', revelationOrder: 28, pageNumber: 597, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالتِّينِ وَالزَّيْتُونِ', translation: 'By the fig and the olive' }, { number: 2, numberInSurah: 2, text: 'وَطُورِ سِينِينَ', translation: 'And [by] Mount Sinai' }, { number: 3, numberInSurah: 3, text: 'وَهَٰذَا الْبَلَدِ الْأَمِينِ', translation: 'And [by] this secure city [Makkah]' }, { number: 4, numberInSurah: 4, text: 'لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ', translation: 'We have certainly created man in the best of stature' }] },
  { number: 96, name: 'العلق', englishName: 'Al-\'Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan', revelationOrder: 1, pageNumber: 597, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', translation: 'Recite in the name of your Lord who created' }, { number: 2, numberInSurah: 2, text: 'خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ', translation: 'Created man from a clinging substance.' }, { number: 3, numberInSurah: 3, text: 'اقْرَأْ وَرَبُّكَ الْأَكْرَمُ', translation: 'Recite, and your Lord is the most Generous -' }] },
  { number: 97, name: 'القدر', englishName: 'Al-Qadr', englishNameTranslation: 'The Power', numberOfAyahs: 5, revelationType: 'Meccan', revelationOrder: 25, pageNumber: 598, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', translation: 'Indeed, We sent the Qur\'an down during the Night of Decree.' }, { number: 2, numberInSurah: 2, text: 'وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ', translation: 'And what can make you know what is the Night of Decree?' }, { number: 3, numberInSurah: 3, text: 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', translation: 'The Night of Decree is better than a thousand months.' }] },
  { number: 98, name: 'البينة', englishName: 'Al-Bayyinah', englishNameTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan', revelationOrder: 100, pageNumber: 598, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'لَمْ يَكُنِ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ مُنفَكِّينَ', translation: 'Those who disbelieved among the People of the Scripture and the polytheists were not to be parted [from misbelief] until there came to them clear evidence -' }] },
  { number: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan', revelationOrder: 93, pageNumber: 599, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا', translation: 'When the earth is shaken with its [final] earthquake' }, { number: 2, numberInSurah: 2, text: 'وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا', translation: 'And the earth discharges its burdens' }] },
  { number: 100, name: 'العاديات', englishName: 'Al-\'Adiyat', englishNameTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan', revelationOrder: 14, pageNumber: 599, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَالْعَادِيَاتِ ضَبْحًا', translation: 'By the racers, panting' }, { number: 2, numberInSurah: 2, text: 'فَالْمُورِيَاتِ قَدْحًا', translation: 'And the producers of sparks [when] striking' }] },
  { number: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan', revelationOrder: 30, pageNumber: 600, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'الْقَارِعَةُ', translation: 'The Striking Calamity' }, { number: 2, numberInSurah: 2, text: 'مَا الْقَارِعَةُ', translation: 'What is the Striking Calamity?' }, { number: 3, numberInSurah: 3, text: 'وَمَا أَدْرَاكَ مَا الْقَارِعَةُ', translation: 'And what can make you know what is the Striking Calamity?' }] },
  { number: 102, name: 'التكاثر', englishName: 'At-Takathur', englishNameTranslation: 'The Rivalry in World Increase', numberOfAyahs: 8, revelationType: 'Meccan', revelationOrder: 16, pageNumber: 600, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'أَلْهَاكُمُ التَّكَاثُرُ', translation: 'Competition in [worldly] increase diverts you' }, { number: 2, numberInSurah: 2, text: 'حَتَّىٰ زُرْتُمُ الْمَقَابِرَ', translation: 'Until you visit the graveyards.' }, { number: 3, numberInSurah: 3, text: 'كَلَّا سَوْفَ تَعْلَمُونَ', translation: 'No! You are going to know.' }] },
  {
    number: 103,
    name: 'العصر',
    englishName: 'Al-\'Asr',
    englishNameTranslation: 'The Declining Day',
    numberOfAyahs: 3,
    revelationType: 'Meccan',
    revelationOrder: 13,
    pageNumber: 601,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'وَالْعَصْرِ', translation: 'By time,' },
      { number: 2, numberInSurah: 2, text: 'إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ', translation: 'Indeed, mankind is in loss,' },
      { number: 3, numberInSurah: 3, text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', translation: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.' }
    ]
  },
  { number: 104, name: 'الهمزة', englishName: 'Al-Humazah', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan', revelationOrder: 32, pageNumber: 601, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ', translation: 'Woe to every scorner and mocker' }, { number: 2, numberInSurah: 2, text: 'الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ', translation: 'Who collects wealth and [continuously] counts it.' }] },
  { number: 105, name: 'الفيل', englishName: 'Al-Fil', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan', revelationOrder: 19, pageNumber: 601, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ', translation: 'Have you not considered, [O Muhammad], how your Lord dealt with the companions of the elephant?' }, { number: 2, numberInSurah: 2, text: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ', translation: 'Did He not make their plan into misguidance?' }] },
  { number: 106, name: 'قريش', englishName: 'Quraysh', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan', revelationOrder: 29, pageNumber: 602, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'لِإِيلَافِ قُرَيْشٍ', translation: 'For the accustomed security of the Quraysh -' }, { number: 2, numberInSurah: 2, text: 'إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ', translation: 'Their accustomed security [in] the caravan of winter and summer -' }, { number: 3, numberInSurah: 3, text: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ', translation: 'Let them worship the Lord of this House,' }] },
  { number: 107, name: 'الماعون', englishName: 'Al-Ma\'un', englishNameTranslation: 'The Small Kindness', numberOfAyahs: 7, revelationType: 'Meccan', revelationOrder: 17, pageNumber: 602, juzNumber: 30, sampleAyahs: [{ number: 1, numberInSurah: 1, text: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ', translation: 'Have you seen the one who denies the Recompense?' }, { number: 2, numberInSurah: 2, text: 'فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ', translation: 'For that is the one who drives away the orphan' }, { number: 4, numberInSurah: 4, text: 'فَوَيْلٌ لِّلْمُصَلِّينَ', translation: 'So woe to those who pray' }] },
  {
    number: 108,
    name: 'الكوثر',
    englishName: 'Al-Kawthar',
    englishNameTranslation: 'The Abundance',
    numberOfAyahs: 3,
    revelationType: 'Meccan',
    revelationOrder: 15,
    pageNumber: 602,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', translation: 'Indeed, We have granted you, [O Muhammad], al-Kawthar.' },
      { number: 2, numberInSurah: 2, text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', translation: 'So pray to your Lord and sacrifice [to Him alone].' },
      { number: 3, numberInSurah: 3, text: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', translation: 'Indeed, your enemy is the one cut off.' }
    ]
  },
  {
    number: 109,
    name: 'الكافرون',
    englishName: 'Al-Kafirun',
    englishNameTranslation: 'The Disbelievers',
    numberOfAyahs: 6,
    revelationType: 'Meccan',
    revelationOrder: 18,
    pageNumber: 603,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ', translation: 'Say, "O disbelievers,' },
      { number: 2, numberInSurah: 2, text: 'لَا أَعْبُدُ مَا تَعْبُدُونَ', translation: 'I do not worship what you worship.' },
      { number: 3, numberInSurah: 3, text: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ', translation: 'Nor are you worshippers of what I worship.' },
      { number: 4, numberInSurah: 4, text: 'وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ', translation: 'Nor will I be a worshipper of what you worship.' },
      { number: 5, numberInSurah: 5, text: 'وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ', translation: 'Nor will you be worshippers of what I worship.' },
      { number: 6, numberInSurah: 6, text: 'لَكُمْ دِينُكُمْ وَلِيَ دِينِ', translation: 'For you is your religion, and for me is my religion."' }
    ]
  },
  {
    number: 110,
    name: 'النصر',
    englishName: 'An-Nasr',
    englishNameTranslation: 'The Divine Support',
    numberOfAyahs: 3,
    revelationType: 'Medinan',
    revelationOrder: 114,
    pageNumber: 603,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', translation: 'When the victory of Allah has come and the conquest,' },
      { number: 2, numberInSurah: 2, text: 'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا', translation: 'And you see the people entering into the religion of Allah in multitudes,' },
      { number: 3, numberInSurah: 3, text: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا', translation: 'Then exalt [Him] with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.' }
    ]
  },
  {
    number: 111,
    name: 'المسد',
    englishName: 'Al-Masad',
    englishNameTranslation: 'The Palm Fiber',
    numberOfAyahs: 5,
    revelationType: 'Meccan',
    revelationOrder: 6,
    pageNumber: 603,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ', translation: 'May the hands of Abu Lahab be ruined, and ruined is he.' },
      { number: 2, numberInSurah: 2, text: 'مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ', translation: 'His wealth will not avail him or that which he gained.' },
      { number: 3, numberInSurah: 3, text: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', translation: 'He will [enter to] burn in a Fire of [blazing] flame' },
      { number: 4, numberInSurah: 4, text: 'وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ', translation: 'And his wife [as well] - the carrier of firewood.' },
      { number: 5, numberInSurah: 5, text: 'فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ', translation: 'Around her neck is a rope of [twisted] fiber.' }
    ]
  },
  {
    number: 112,
    name: 'الإخلاص',
    englishName: 'Al-Ikhlas',
    englishNameTranslation: 'The Sincerity',
    numberOfAyahs: 4,
    revelationType: 'Meccan',
    revelationOrder: 22,
    pageNumber: 604,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [who is] One,' },
      { number: 2, numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.' },
      { number: 3, numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,' },
      { number: 4, numberInSurah: 4, text: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', translation: 'Nor is there to Him any equivalent."' }
    ]
  },
  {
    number: 113,
    name: 'الفلق',
    englishName: 'Al-Falaq',
    englishNameTranslation: 'The Daybreak',
    numberOfAyahs: 5,
    revelationType: 'Meccan',
    revelationOrder: 20,
    pageNumber: 604,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak' },
      { number: 2, numberInSurah: 2, text: 'مِنْ شَرِّ مَا خَلَقَ', translation: 'From the evil of that which He created' },
      { number: 3, numberInSurah: 3, text: 'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'And from the evil of darkness when it settles' },
      { number: 4, numberInSurah: 4, text: 'وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of the blowers in knots' },
      { number: 5, numberInSurah: 5, text: 'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies."' }
    ]
  },
  {
    number: 114,
    name: 'الناس',
    englishName: 'An-Nas',
    englishNameTranslation: 'Mankind',
    numberOfAyahs: 6,
    revelationType: 'Meccan',
    revelationOrder: 21,
    pageNumber: 604,
    juzNumber: 30,
    sampleAyahs: [
      { number: 1, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind,' },
      { number: 2, numberInSurah: 2, text: 'مَلِكِ النَّاسِ', translation: 'The Sovereign of mankind.' },
      { number: 3, numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind,' },
      { number: 4, numberInSurah: 4, text: 'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the retreating whisperer -' },
      { number: 5, numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers [evil] into the breasts of mankind -' },
      { number: 6, numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From among the jinn and mankind."' }
    ]
  }
];
