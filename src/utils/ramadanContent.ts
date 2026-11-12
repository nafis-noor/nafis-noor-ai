import {
  RamadanActivity,
  DailyInspirationItem,
  GoalMotivationItem,
  RamadanGoalCategory,
} from '../types/ramadan';

export const SUGGESTED_RAMADAN_GOALS: Array<{
  id: string;
  label: string;
  arabicLabel: string;
  category: RamadanGoalCategory;
  desc: string;
}> = [
  {
    id: 'fast_30',
    label: 'Fast all 30 days',
    arabicLabel: 'صيام رمضان كاملاً إيماناً واحتساباً',
    category: 'fasting',
    desc: 'Complete all 30 days of fasting with sincerity, guarding the heart and tongue.',
  },
  {
    id: 'khatm_quran',
    label: 'Read the full Quran once',
    arabicLabel: 'ختم القرآن الكريم كاملاً تلاوةً وتدبراً',
    category: 'quran',
    desc: 'Recite one Juz daily (20 pages) to complete the entire Book of Allah in 30 days.',
  },
  {
    id: 'taraweeh_nightly',
    label: 'Pray Taraweeh every night',
    arabicLabel: 'قيام صلاة التراويح كل ليلة',
    category: 'prayer',
    desc: 'Stand in worship every night, seeking the forgiveness of all past sins.',
  },
  {
    id: 'charity_daily',
    label: 'Give charity daily',
    arabicLabel: 'الصدقة والإحسان كل يوم',
    category: 'charity',
    desc: 'Even $1, feeding a fasting soul, or a warm smile to illuminate your scale.',
  },
  {
    id: 'memorize_surahs',
    label: 'Memorize Surahs',
    arabicLabel: 'حفظ سور جديدة من كتاب الله',
    category: 'memorization',
    desc: 'Commit new portions of the Quran to heart and recite them in night prayers.',
  },
  {
    id: 'stop_bad_habit',
    label: 'Stop a bad habit',
    arabicLabel: 'الإقلاع التام عن ذنب أو عادة سيئة',
    category: 'habits',
    desc: 'Harness the divine shield of Ramadan to break free from sins and distractions.',
  },
  {
    id: 'be_more_patient',
    label: 'Be more patient',
    arabicLabel: 'التحلي بالصبر وحسن الخلق وسعة الصدر',
    category: 'character',
    desc: 'Subdue anger, forgive grudges, and embody the gentle character of the Prophet ﷺ.',
  },
];

/**
 * Generates the pre-built recommended Al-Noor Plan
 * Can adapt based on user's actual prayer times (e.g. Fajr, Maghrib, Isha)
 */
export function generateAlNoorPlan(
  fajrTime: string = '05:00',
  maghribTime: string = '18:00',
  ishaTime: string = '19:30'
): RamadanActivity[] {
  // Compute suhoor ~1 hour before Fajr
  const [fH, fM] = fajrTime.split(':').map(Number);
  const suhoorHour = (fH - 1 + 24) % 24;
  const suhoorTime = `${String(suhoorHour).padStart(2, '0')}:${String(fM).padStart(2, '0')}`;

  // Quran reading 30 min after Fajr
  const quranM = (fM + 30) % 60;
  const quranH = (fH + Math.floor((fM + 30) / 60)) % 24;
  const quranTime = `${String(quranH).padStart(2, '0')}:${String(quranM).padStart(2, '0')}`;

  // Taraweeh ~30 mins after Isha
  const [iH, iM] = ishaTime.split(':').map(Number);
  const taraweehM = (iM + 30) % 60;
  const taraweehH = (iH + Math.floor((iM + 30) / 60)) % 24;
  const taraweehTime = `${String(taraweehH).padStart(2, '0')}:${String(taraweehM).padStart(2, '0')}`;

  return [
    {
      id: 'alnoor_suhoor',
      activityName: 'Suhoor & Intention (سحور النور)',
      arabicName: 'السحور وبركة الوقت',
      scheduledTime: suhoorTime,
      duration: 30,
      isActive: true,
      category: 'suhoor',
    },
    {
      id: 'alnoor_fajr',
      activityName: 'Fajr on Time in Sanctuary',
      arabicName: 'صلاة الفجر في وقتها',
      scheduledTime: fajrTime,
      duration: 20,
      isActive: true,
      category: 'fajr',
    },
    {
      id: 'alnoor_quran_morning',
      activityName: 'Post-Fajr Quran Recitation (1 Juz)',
      arabicName: 'تلاوة جزء القرآن الكريم بعد الفجر',
      scheduledTime: quranTime,
      duration: 45,
      isActive: true,
      category: 'quran',
    },
    {
      id: 'alnoor_dhikr_morning',
      activityName: 'Morning Adhkar (أذكار الصباح)',
      arabicName: 'أذكار الصباح والتحصين',
      scheduledTime: '06:45',
      duration: 15,
      isActive: true,
      category: 'dhikr',
    },
    {
      id: 'alnoor_dhuhr',
      activityName: 'Dhuhr Prayer with Sunnah',
      arabicName: 'صلاة الظهر والسنن الرواتب',
      scheduledTime: '12:15',
      duration: 20,
      isActive: true,
      category: 'dhuhr',
    },
    {
      id: 'alnoor_asr',
      activityName: 'Asr Prayer on Time',
      arabicName: 'صلاة العصر في وقتها',
      scheduledTime: '15:35',
      duration: 20,
      isActive: true,
      category: 'asr',
    },
    {
      id: 'alnoor_dhikr_evening',
      activityName: 'Evening Adhkar & Pre-Iftar Du’a',
      arabicName: 'أذكار المساء والدعاء المستجاب قبل الإفطار',
      scheduledTime: '17:30',
      duration: 25,
      isActive: true,
      category: 'dhikr',
    },
    {
      id: 'alnoor_iftar',
      activityName: 'Iftar at Sunset & Gratitude',
      arabicName: 'الإفطار على التمر ودعاء الصائم',
      scheduledTime: maghribTime,
      duration: 30,
      isActive: true,
      category: 'iftar',
    },
    {
      id: 'alnoor_maghrib',
      activityName: 'Maghrib Prayer & Family Reflection',
      arabicName: 'صلاة المغرب وأذكار ما بعد الصلاة',
      scheduledTime: maghribTime,
      duration: 20,
      isActive: true,
      category: 'maghrib',
    },
    {
      id: 'alnoor_taraweeh',
      activityName: 'Taraweeh Night Prayers',
      arabicName: 'صلاة التراويح وقيام الليل',
      scheduledTime: taraweehTime,
      duration: 60,
      isActive: true,
      category: 'taraweeh',
    },
    {
      id: 'alnoor_charity',
      activityName: 'Daily Sadaqah & Kindness Check',
      arabicName: 'صدقة اليوم وبذل الإحسان',
      scheduledTime: '21:30',
      duration: 10,
      isActive: true,
      category: 'charity',
    },
    {
      id: 'alnoor_tahajjud',
      activityName: 'Tahajjud & Istighfar (Last Third of Night)',
      arabicName: 'صلاة التهجد والاستغفار بالأسحار',
      scheduledTime: '03:30',
      duration: 30,
      isActive: true,
      category: 'tahajjud',
    },
  ];
}

/**
 * Motivation Boost items categorized by goal
 * Rotates every 5 days or on demand
 */
export const GOAL_MOTIVATION_COLLECTION: GoalMotivationItem[] = [
  // Fasting
  {
    id: 'mot_fast_1',
    category: 'fasting',
    arabicVerseOrHadith: 'كُلُّ عَمَلِ ابْنِ آدَمَ يُضَاعَفُ الْحَسَنَةُ عَشْرُ أَمْثَالِهَا إِلَى سَبْعِمِائَةِ ضِعْفٍ قَالَ اللَّهُ عَزَّ وَجَلَّ إِلَّا الصَّوْمَ فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ',
    translation: 'Every deed of the son of Adam is multiplied, from ten to seven hundred times, except fasting. Allah Almighty says: "It is for Me, and I shall reward for it."',
    reference: 'Sahih Muslim 1151',
    reflection: 'When hunger stirs, remember that the King of Kings Himself has singled out your fasting for an unmeasured, divine compensation.',
  },
  {
    id: 'mot_fast_2',
    category: 'fasting',
    arabicVerseOrHadith: 'إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ لَا يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ',
    translation: 'Verily in Paradise there is a gate called Ar-Rayyan, through which only those who fast will enter on the Day of Resurrection.',
    reference: 'Sahih al-Bukhari 1896',
    reflection: 'Picture the grand gates of Ar-Rayyan opening specifically for you. The thirst of this world will vanish the moment you step through.',
  },
  // Quran
  {
    id: 'mot_quran_1',
    category: 'quran',
    arabicVerseOrHadith: 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ',
    translation: 'The month of Ramadan in which was revealed the Quran, a guidance for the people and clear proofs of guidance and criterion.',
    reference: 'Surah Al-Baqarah 2:185',
    reflection: 'Ramadan is the cradle of the Quran. Every letter you recite echoes the descent of Jibril to the heart of Muhammad ﷺ.',
  },
  {
    id: 'mot_quran_2',
    category: 'quran',
    arabicVerseOrHadith: 'الصِّيَامُ وَالْقُرْآنُ يَشْفَعَانِ لِلْعَبْدِ يَوْمَ الْقِيَامَةِ، يَقُولُ الْقُرْآنُ: مَنَعْتُهُ النَّوْمَ بِاللَّيْلِ فَشَفِّعْنِي فِيهِ',
    translation: 'Fasting and the Quran will intercede for the servant on the Day of Resurrection. The Quran will say: "I kept him from sleep at night, so accept my intercession for him."',
    reference: 'Musnad Ahmad 6626 (Sahih)',
    reflection: 'When your eyes grow heavy, know that this very page of the Quran will stand before Allah as your passionate advocate.',
  },
  // Prayer
  {
    id: 'mot_prayer_1',
    category: 'prayer',
    arabicVerseOrHadith: 'مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
    translation: 'Whoever stands in prayer throughout Ramadan out of sincere faith and seeking reward, all his previous sins will be forgiven.',
    reference: 'Sahih al-Bukhari 2009',
    reflection: 'Every rakaah of Taraweeh sheds sins from your shoulders like withered leaves in autumn. Stand firm; forgiveness is within reach.',
  },
  // Charity
  {
    id: 'mot_charity_1',
    category: 'charity',
    arabicVerseOrHadith: 'كَانَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ أَجْوَدَ النَّاسِ، وَكَانَ أَجْوَدُ مَا يَكُونُ فِي رَمَضَانَ... فَلَرَسُولُ اللَّهِ حِينَ يَلْقَاهُ جِبْرِيلُ أَجْوَدُ بِالْخَيْرِ مِنَ الرِّيحِ الْمُرْسَلَةِ',
    translation: 'The Messenger of Allah ﷺ was the most generous of people, and he was at his most generous in Ramadan... faster in giving good than the blowing wind.',
    reference: 'Sahih al-Bukhari 1902',
    reflection: 'Do not withhold. Even a date given to break anothers fast grants you their entire reward without decreasing theirs in the slightest.',
  },
  // Memorization
  {
    id: 'mot_mem_1',
    category: 'memorization',
    arabicVerseOrHadith: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا',
    translation: 'It will be said to the companion of the Quran: "Recite and ascend! Recite rhythmically as you used to recite in the world, for your dwelling will be at the last verse you recite."',
    reference: 'Sunan Abi Dawud 1464',
    reflection: 'Every ayah you commit to memory this Ramadan is an entire heavenly rank you will ascend forever in Jannah.',
  },
  // Habits & Character
  {
    id: 'mot_habits_1',
    category: 'habits',
    arabicVerseOrHadith: 'مَنْ لَمْ يَدَعْ قَوْلَ الزُّورِ وَالْعَمَلَ بِهِ وَالْجَهْلَ فَلَيْسَ لِلَّهِ حَاجَةٌ أَنْ يَدَعَ طَعَامَهُ وَشَرَابَهُ',
    translation: 'Whoever does not leave false speech and acting upon it and ignorance, Allah has no need of him leaving his food and drink.',
    reference: 'Sahih al-Bukhari 6057',
    reflection: 'True fasting is fasting of the eyes, ears, and tongue. Starving the stomach while feeding bad habits wastes the sacred covenant.',
  },
  {
    id: 'mot_char_1',
    category: 'character',
    arabicVerseOrHadith: 'إِذَا كَانَ يَوْمُ صَوْمِ أَحَدِكُمْ فَلَا يَرْفُثْ يَوْمَئِذٍ وَلَا يَسْخَبْ، فَإِنْ سَابَّهُ أَحَدٌ أَوْ قَاتَلَهُ فَلْيَقُلْ: إِنِّي امْرُؤٌ صَائِمٌ',
    translation: 'When any of you is fasting on a day, let him not speak obscenity nor shout. If anyone insults him or fights him, let him say: "I am a person who is fasting."',
    reference: 'Sahih al-Bukhari 1904',
    reflection: 'Your patience under provocation is your highest act of worship today. Let every insult be met with dignified, radiant peace.',
  },
];

/**
 * 30 Daily Inspiration Pulses: Deeply moving, shocking, or heart-stirring content
 * Designed to pierce apathy, awaken devotion, and provoke immediate noble action.
 */
export const DAILY_INSPIRATION_PULSE_COLLECTION: DailyInspirationItem[] = [
  {
    id: 'pulse_day_1',
    title: 'The Unopened Invitation of Your Life',
    arabicHeading: 'أَتَاكُمْ رَمَضَانُ شَهْرٌ مُبَارَكٌ',
    contentType: 'hadith',
    tag: 'Urgent Wake-Up',
    hook: 'Millions who fasted with us last Ramadan are now under six feet of silent earth. You are breathing right now. Why you?',
    previewText: 'A shocking realization: This is not guaranteed to ever happen again.',
    fullContent: `Think deeply: How many people in your phone contacts, your neighborhood, or your family were preparing for Ramadan last year, completely unaware it would be their absolute final one?

The Prophet Muhammad ﷺ ascended the Minbar and said: "Ameen! Ameen! Ameen!" When asked, he revealed: "Jibril came to me and said: Wretched is the one who witnesses Ramadan and is not forgiven! And I said: Ameen."

This is not a casual routine or a dietary calendar. It is a divine rescue rope thrown directly to you while you still have a beating heart. If you waste these 30 dawns on social media scrolling, binge-watching, and procrastination, what excuse will you offer when the parchment of your deeds is unfurled?

Make today the day you swear a holy truce with your soul. Turn off the noise. Recite your Juz. Fall into prostration.`,
    sourceOrCitation: 'Sahih Ibn Hibban 409 & Al-Adab Al-Mufrad',
    actionCall: 'Open your Quran right now and recite 5 verses with your tears before you close this app.',
    shareMessage: 'Millions under the earth would trade everything for one hour of Ramadan. We are alive today. Please read this and wake your heart up.',
  },
  {
    id: 'pulse_day_2',
    title: '828 Million People Sleep Hungry Without a Sunset Feast',
    arabicHeading: 'وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا',
    contentType: 'statistic',
    tag: 'Sadaqah Awakening',
    hook: 'You count down the minutes until Iftar with tables overflowing. Tonight, over 828,000,000 human beings will break their fast with muddy water or nothing at all.',
    previewText: 'Our hunger has an expiration time. Their hunger has no foreseeable tomorrow.',
    fullContent: `According to the United Nations World Food Programme, over 828 million people wake up in extreme hunger every single day. A mother in East Africa boils stones in water to convince her weeping children that food is cooking until they fall asleep from exhaustion.

When we fast, we taste a fraction of their daily torture—except our refrigerators are filled with chilled dates, warm soup, and roasted meats waiting at sunset.

The Prophet Muhammad ﷺ said: "Protect yourself from the Hellfire, even with half a date given in charity." (Sahih al-Bukhari).

If you have two meals today while a brother or sister in Gaza, Yemen, or the Sahel has none, what right do you have to withhold even $5? Let your hunger melt your heart into overflowing charity.`,
    sourceOrCitation: 'UN World Food Programme Report & Sahih al-Bukhari 1417',
    actionCall: 'Donate the cost of one takeout meal ($10–$20) to feed a fasting family tonight.',
    shareMessage: 'Our hunger ends at sunset; 828 million people have no sunset feast. Read this startling reminder and send Sadaqah today.',
  },
  {
    id: 'pulse_day_3',
    title: 'The Man Who Spent 40 Years in Sin and Wept at Suhoor',
    arabicHeading: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ',
    contentType: 'story',
    tag: 'True Transformation',
    hook: 'He thought Allah could never forgive him after forty years of alcohol, severed kinship, and missed prayers. Then came one night in Ramadan.',
    previewText: 'Can four decades of black stains be erased in a single sincere prostration?',
    fullContent: `Fudhayl ibn Iyad was once a dreaded highway robber who terrorized caravans in the desert. One night, while scaling a wall to commit a crime, he heard a pious man reciting through an open window:

"Has not the time come for those who believe that their hearts should be humbled at the remembrance of Allah?" (Surah Al-Hadid 57:16).

The ayah pierced his soul like a bolt of thunder. He froze on the wall, weeping uncontrollably, and cried out in the darkness: "Yes, my Lord! By Allah, the time has come!"

He abandoned everything, washed his limbs, sought out everyone he had wronged to return their wealth, and became known as the Worshipper of the Two Holy Sanctuaries (*Abid al-Haramayn*).

It does not matter if you haven't prayed in five years. It does not matter if you feel dirty and hypocritical entering the mosque. Allah says: "Do not despair of the mercy of Allah. Indeed, Allah forgives all sins."

Step onto the prayer mat right now. He has been waiting for your return.`,
    sourceOrCitation: 'Siyar Alam al-Nubala by Imam adh-Dhahabi',
    actionCall: 'Pray two rakahs of Tawbah (repentance) in secret with tears of raw honesty.',
    shareMessage: 'If Allah turned a desert highway robber into one of the greatest saints of Islam, He can certainly forgive and transform you this Ramadan. Read this.',
  },
  {
    id: 'pulse_day_4',
    title: 'The Terrifying Weight of the Wasted Second',
    arabicHeading: 'حَتَّىٰ إِذَا جَاءَ أَحَدَهُمُ الْمَوْتُ قَالَ رَبِّ ارْجِعُونِ',
    contentType: 'verse',
    tag: 'Eternity Stirs',
    hook: 'Every grain of sand slipping through your hourglass will either testify for you or condemn your carelessness on a Day 50,000 years long.',
    previewText: 'A moment lost in Ramadan is a jewel stolen from your eternal crown.',
    fullContent: `Imagine standing on the scorched plains of the Day of Judgment, beneath a sun brought close to the heads of mankind.

You will see people begging for a single SubhanAllah or a single half-page of recitation to tip the scale away from the abyss.

Allah warns in Surah Al-Muminun:
"Until, when death comes to one of them, he says: My Lord, send me back that I might do righteousness in that which I left behind! By no means! It is only a word he is saying; and behind them is a barrier until the Day they are resurrected." (23:99-100).

Why wait until the shroud is wrapped tightly around your face to wish for one more Ramadan? You have the morning breeze right now. You have your tongue. Say: SubhanAllah wa bihamdihi, SubhanAllah al-Azeem.`,
    sourceOrCitation: 'Surah Al-Muminun (23:99-100) & Ibn al-Qayyim (Madarij al-Salikin)',
    actionCall: 'Do not look at social media for the next two hours; spend that exact time in Quran recitation.',
    shareMessage: 'When death comes, every person will plead for one more minute in Ramadan. We have that minute right now. Read and awaken.',
  },
  {
    id: 'pulse_day_5',
    title: 'The Secret Prayer of the Syrian Grandfather in the Rubble',
    arabicHeading: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    contentType: 'news',
    tag: 'Unshakable Faith',
    hook: 'Rescuers found him beneath collapsed concrete after the earthquake. He did not ask for water or blankets. He asked: "Did the time for Fajr enter yet?"',
    previewText: 'When your world collapses, what is the first thing on your mind?',
    fullContent: `In the freezing winter aftermath of the catastrophic earthquakes in southern Turkey and northern Syria, rescue workers digging with bare hands found an elderly grandfather pinned beneath heavy concrete slabs.

When dust-covered paramedics finally reached his face and offered him a hydration tube, he shook his head gently and whispered through cracked lips: "Tell me first... has the adhan for Fajr been called? I must pray before the time leaves."

While people in comfortable climate-controlled bedrooms hit snooze three times on their alarms, a man whose children were martyred and whose home was flattened was worried about missing the dawn prayer to his Maker.

Let that shame your excuses. What makes you think your bed is too comfortable to leave for Fajr? Rise up.`,
    sourceOrCitation: 'Documented field report from White Helmets & TRT World (2023)',
    actionCall: 'Set two distinct alarms for Fajr and wake up at least one other family member.',
    shareMessage: 'Pinned under concrete rubble, he did not ask for food or water—he asked if Fajr had entered. Put your excuses to rest and read this.',
  },
  {
    id: 'pulse_day_6',
    title: 'The Silent Grave and the Light of Tahajjud',
    arabicHeading: 'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ',
    contentType: 'verse',
    tag: 'Night Vigil',
    hook: 'The grave is dark, narrow, and lonely. But there is a secret light that illuminates it before you ever arrive: Two rakahs in the dead of night.',
    previewText: 'When everyone is asleep, the Lord of the worlds descends.',
    fullContent: `Every single night, during the last third of the night, our Lord, the Blessed and Exalted, descends to the lowest heaven and calls out:

"Who is calling upon Me that I may answer him? Who is asking Me that I may give him? Who is seeking My forgiveness that I may forgive him?" (Sahih al-Bukhari).

Imagine: The Creator of billions of galaxies, who needs nothing from you, descends and asks to give to you. Yet millions remain fast asleep, snoring under duvets, ignoring the King.

Wake up 20 minutes before Suhoor. Close your door. Stand on your feet. Pour out the secret sorrows you cannot tell a human being. Allah is listening.`,
    sourceOrCitation: 'Sahih al-Bukhari 1145 & Sahih Muslim 758',
    actionCall: 'Set your alarm 20 minutes before your Suhoor time tonight for Tahajjud.',
    shareMessage: 'The Creator of the universe asks to forgive you every night in the last third. Will you sleep through His call? Read this.',
  },
  {
    id: 'pulse_day_7',
    title: 'A Single Tongue That Burned 30 Days of Fasting to Ashes',
    arabicHeading: 'وَلَا يَغْتَب بَّعْضُكُم بَعْضًا',
    contentType: 'hadith',
    tag: 'Solemn Warning',
    hook: 'He starved himself from dawn to sunset, endured migraines and dehydration, yet arrived on the Day of Judgment with a bankrupt balance.',
    previewText: 'How backbiting, gossip, and slander eat away Ramadan deeds like dry wood on fire.',
    fullContent: `The Prophet Muhammad ﷺ asked his companions: "Do you know who the bankrupt one (*Al-Muflis*) is?"

They said: "The bankrupt among us is one who has no money and no possessions."

He said: "The bankrupt of my Ummah is one who comes on the Day of Resurrection with prayers, fasting, and charity, but he has insulted this one, slandered that one, devoured the wealth of this one, shed the blood of this one, and beaten that one.

His good deeds will be given to this one and that one. If his good deeds run out before his debts are settled, their sins will be taken and cast upon him, and then he will be hurled into the Fire."

Do not waste your dry throat by chewing on the flesh of your brothers and sisters through WhatsApp gossip and backbiting. Guard your tongue like a razor.`,
    sourceOrCitation: 'Sahih Muslim 2581',
    actionCall: 'Fast with your tongue today: Make a solemn intention not to speak ill or comment on anyone.',
    shareMessage: 'You can fast 30 days and still arrive bankrupt on Judgment Day if your tongue is careless. Read this urgent warning.',
  },
];

/**
 * Returns the inspiration pulse for a given day (1 to 30)
 */
export function getInspirationPulseForDay(dayIndex: number): DailyInspirationItem {
  const collection = DAILY_INSPIRATION_PULSE_COLLECTION;
  const index = Math.max(0, (dayIndex - 1) % collection.length);
  return collection[index];
}

/**
 * Returns motivation item based on goal category
 */
export function getMotivationForCategory(category: RamadanGoalCategory): GoalMotivationItem {
  const matched = GOAL_MOTIVATION_COLLECTION.filter((m) => m.category === category);
  if (matched.length > 0) {
    const randomIdx = Math.floor(Math.random() * matched.length);
    return matched[randomIdx];
  }
  return GOAL_MOTIVATION_COLLECTION[0];
}
