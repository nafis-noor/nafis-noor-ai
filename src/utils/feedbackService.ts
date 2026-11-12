import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { auth, db, getCurrentUserIdToken } from '../lib/firebase';
import { SupportedLanguageCode } from './i18n';

export type FeedbackCategory =
  | 'General Feedback'
  | 'Feature Request'
  | 'Bug Report'
  | 'Quran Experience'
  | 'Tasme3 Experience'
  | 'Other';

export type FeedbackStatus = 'Pending' | 'Under Review' | 'Answered';

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  'General Feedback',
  'Feature Request',
  'Bug Report',
  'Quran Experience',
  'Tasme3 Experience',
  'Other',
];

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  'Pending',
  'Under Review',
  'Answered',
];

export interface FeedbackSubmission {
  id: string;
  category: FeedbackCategory;
  title: string;
  message: string;
  email: string;
  userId: string;
  userName: string;
  status: FeedbackStatus;
  isResolved: boolean;
  adminReply: string;
  repliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  title: string;
  message: string;
  email?: string;
  userName?: string;
}

export interface SubmitFeedbackResult {
  submission: FeedbackSubmission;
  founderNotified: boolean;
  firestoreSaved: boolean;
  reviewUrl?: string;
}

export interface FeedbackTranslations {
  settingsLabel: string;
  settingsSubtitle: string;
  screenTitle: string;
  screenSubtitle: string;
  categoryLabel: string;
  titleLabel: string;
  titlePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHelper: string;
  submitBtn: string;
  submittingBtn: string;
  successTitle: string;
  successSubtitle: string;
  submissionIdLabel: string;
  statusLabel: string;
  submitAnotherBtn: string;
  mySubmissionsTitle: string;
  adminConsoleBtn: string;
  adminConsoleTitle: string;
  adminConsoleSubtitle: string;
  filterCategoryLabel: string;
  filterStatusLabel: string;
  allCategories: string;
  allStatuses: string;
  resolvedFilter: string;
  markResolved: string;
  resolvedBadge: string;
  replyPlaceholder: string;
  sendReplyBtn: string;
  SaveChangesBtn: string;
  founderReplyLabel: string;
  noFeedbackFound: string;
  categories: Record<FeedbackCategory, string>;
  statuses: Record<FeedbackStatus, string>;
}

const FEEDBACK_I18N: Record<SupportedLanguageCode, FeedbackTranslations> = {
  en: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    categoryLabel: 'Feedback Category',
    titleLabel: 'Feedback Title',
    titlePlaceholder: 'Brief summary of your suggestion or issue...',
    messageLabel: 'Detailed Message',
    messagePlaceholder: 'Tell us more about your experience, suggestion, or what we can improve...',
    emailLabel: 'Email Address (Optional)',
    emailPlaceholder: 'your.email@example.com (for receiving replies)',
    emailHelper: 'Protected & private. Used only if the Nafis Noor team replies to your submission.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Saving Feedback...',
    successTitle: 'JazakAllahu Khayran — Feedback Saved',
    successSubtitle: 'Your submission has been permanently recorded and sent to the Nafis Noor founder.',
    submissionIdLabel: 'Submission ID',
    statusLabel: 'Status',
    submitAnotherBtn: 'Submit Another Feedback',
    mySubmissionsTitle: 'Your Recent Feedback Submissions',
    adminConsoleBtn: 'Founder Feedback Management',
    adminConsoleTitle: 'Private Founder Feedback Management',
    adminConsoleSubtitle: 'Review user submissions, filter by category & status, reply to users, and resolve issues.',
    filterCategoryLabel: 'Category',
    filterStatusLabel: 'Status',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    resolvedFilter: 'Resolved Only',
    markResolved: 'Mark as Resolved',
    resolvedBadge: 'Resolved',
    replyPlaceholder: 'Write a direct response to the user...',
    sendReplyBtn: 'Send Reply & Mark Answered',
    SaveChangesBtn: 'Update Status',
    founderReplyLabel: 'Founder Response',
    noFeedbackFound: 'No feedback submissions match the selected filters.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  ar: {
    settingsLabel: 'Feedback & Suggestions · الملاحظات والاقتراحات',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor · شاركنا أفكارك وساعدنا في تطوير نفيس نور.',
    screenTitle: 'الملاحظات والاقتراحات (Feedback & Suggestions)',
    screenSubtitle: 'شاركنا أفكارك ومقترحاتك وساعدنا في الارتقاء بتجربة نفيس نور.',
    categoryLabel: 'تصنيف الملاحظة',
    titleLabel: 'عنوان الملاحظة أو الاقتراح',
    titlePlaceholder: 'ملخص موجز لفكرتك أو المشكلة التي واجهتك...',
    messageLabel: 'التفاصيل الكاملة',
    messagePlaceholder: 'اكتب تفاصيل تجربتك أو اقتراحك بكل وضوح لنتمكن من دراسته بعناية...',
    emailLabel: 'البريد الإلكتروني (اختياري لاستلام الرد)',
    emailPlaceholder: 'your.email@example.com',
    emailHelper: 'بريدك محمي بالكامل ولا يُستخدم إلا لإرسال رد إدارة نفيس نور على رسالتك.',
    submitBtn: 'إرسال الملاحظات (Submit Feedback)',
    submittingBtn: 'جارٍ الحفظ والإرسال...',
    successTitle: 'جزاكم الله خيراً — تم حفظ ملاحظتك بنجاح',
    successSubtitle: 'تم تسجيل رسالتك بشكل دائم في قاعدة البيانات وإشعار مؤسس نفيس نور مباشرة.',
    submissionIdLabel: 'رقم المرجع',
    statusLabel: 'الحالة',
    submitAnotherBtn: 'إرسال ملاحظة أخرى',
    mySubmissionsTitle: 'ملاحظاتك المرسلة مؤخراً',
    adminConsoleBtn: 'إدارة الملاحظات (خاص بالمؤسس)',
    adminConsoleTitle: 'لوحة المؤسس الخاصة لإدارة الملاحظات والاقتراحات',
    adminConsoleSubtitle: 'مراجعة رسائل المستخدمين، التصفية حسب التصنيف والحالة، الرد المباشر، وإغلاق البلاغات.',
    filterCategoryLabel: 'التصنيف',
    filterStatusLabel: 'الحالة',
    allCategories: 'جميع التصنيفات',
    allStatuses: 'جميع الحالات',
    resolvedFilter: 'المكتملة فقط',
    markResolved: 'تحديد كـ تم الحل',
    resolvedBadge: 'تم الحل',
    replyPlaceholder: 'اكتب رداً مباشراً للمستخدم...',
    sendReplyBtn: 'إرسال الرد وتحديث الحالة إلى تم الرد',
    SaveChangesBtn: 'حفظ الحالة',
    founderReplyLabel: 'رد مؤسس نفيس نور',
    noFeedbackFound: 'لا توجد ملاحظات مطابقة لمعايير التصفية المحددة.',
    categories: {
      'General Feedback': 'ملاحظات عامة (General Feedback)',
      'Feature Request': 'طلب ميزة جديدة (Feature Request)',
      'Bug Report': 'الإبلاغ عن خلل (Bug Report)',
      'Quran Experience': 'تجربة المصحف والقرآن (Quran Experience)',
      'Tasme3 Experience': 'تجربة التسميع الذكي (Tasme3 Experience)',
      Other: 'أخرى (Other)',
    },
    statuses: {
      Pending: 'قيد الانتظار (Pending)',
      'Under Review': 'قيد المراجعة (Under Review)',
      Answered: 'تم الرد (Answered)',
    },
  },
  fr: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Partagez vos idées et aidez-nous à améliorer Nafis Noor.',
    categoryLabel: 'Catégorie',
    titleLabel: 'Titre du retour',
    titlePlaceholder: 'Résumé de votre suggestion ou problème...',
    messageLabel: 'Message détaillé',
    messagePlaceholder: 'Décrivez votre expérience ou suggestion en détail...',
    emailLabel: 'Adresse e-mail (Optionnel)',
    emailPlaceholder: 'votre.email@example.com (pour recevoir une réponse)',
    emailHelper: 'Confidentiel et protégé. Utilisé uniquement pour vous répondre.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Envoi en cours...',
    successTitle: 'JazakAllahu Khayran — Retour enregistré',
    successSubtitle: 'Votre message a été sauvegardé et transmis au fondateur de Nafis Noor.',
    submissionIdLabel: 'ID de soumission',
    statusLabel: 'Statut',
    submitAnotherBtn: 'Envoyer un autre retour',
    mySubmissionsTitle: 'Vos retours récents',
    adminConsoleBtn: 'Gestion des retours (Fondateur)',
    adminConsoleTitle: 'Gestion privée des retours (Fondateur)',
    adminConsoleSubtitle: 'Consultez les retours, filtrez par catégorie et statut, et répondez aux utilisateurs.',
    filterCategoryLabel: 'Catégorie',
    filterStatusLabel: 'Statut',
    allCategories: 'Toutes les catégories',
    allStatuses: 'Tous les statuts',
    resolvedFilter: 'Résolus uniquement',
    markResolved: 'Marquer comme résolu',
    resolvedBadge: 'Résolu',
    replyPlaceholder: 'Écrire une réponse à l’utilisateur...',
    sendReplyBtn: 'Envoyer la réponse',
    SaveChangesBtn: 'Mettre à jour',
    founderReplyLabel: 'Réponse du fondateur',
    noFeedbackFound: 'Aucun retour trouvé.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  tr: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Fikirlerinizi paylaşın ve Nafis Noor’u geliştirmemize yardımcı olun.',
    categoryLabel: 'Geri Bildirim Kategorisi',
    titleLabel: 'Geri Bildirim Başlığı',
    titlePlaceholder: 'Önerinizin veya sorununuzun kısa özeti...',
    messageLabel: 'Detaylı Mesaj',
    messagePlaceholder: 'Deneyiminizi veya önerinizi detaylıca yazın...',
    emailLabel: 'E-posta Adresi (İsteğe Bağlı)',
    emailPlaceholder: 'ornek@email.com (yanıt almak için)',
    emailHelper: 'Gizli ve korumalıdır. Yalnızca size yanıt vermek için kullanılır.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Kaydediliyor...',
    successTitle: 'JazakAllahu Khayran — Geri Bildirim Kaydedildi',
    successSubtitle: 'Mesajınız kalıcı olarak kaydedildi ve Nafis Noor kurucusuna iletildi.',
    submissionIdLabel: 'Gönderim No',
    statusLabel: 'Durum',
    submitAnotherBtn: 'Başka Bir Geri Bildirim Gönder',
    mySubmissionsTitle: 'Son Geri Bildirimleriniz',
    adminConsoleBtn: 'Kurucu Geri Bildirim Yönetimi',
    adminConsoleTitle: 'Özel Kurucu Geri Bildirim Yönetimi',
    adminConsoleSubtitle: 'Tüm geri bildirimleri inceleyin, filtreleyin ve kullanıcılara yanıt verin.',
    filterCategoryLabel: 'Kategori',
    filterStatusLabel: 'Durum',
    allCategories: 'Tüm Kategoriler',
    allStatuses: 'Tüm Durumlar',
    resolvedFilter: 'Sadece Çözülenler',
    markResolved: 'Çözüldü Olarak İşaretle',
    resolvedBadge: 'Çözüldü',
    replyPlaceholder: 'Kullanıcıya yanıt yazın...',
    sendReplyBtn: 'Yanıtı Gönder',
    SaveChangesBtn: 'Durumu Güncelle',
    founderReplyLabel: 'Kurucu Yanıtı',
    noFeedbackFound: 'Seçilen filtrelere uygun geri bildirim bulunamadı.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  ur: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions · آراء اور تجاویز',
    screenSubtitle: 'اپنے خیالات شیئر کریں اور نفیس نور کو بہتر بنانے میں ہماری مدد کریں۔',
    categoryLabel: 'زمرہ منتخب کریں',
    titleLabel: 'عنوان',
    titlePlaceholder: 'اپنی تجویز یا مسئلے کا مختصر عنوان...',
    messageLabel: 'تفصیلی پیغام',
    messagePlaceholder: 'اپنے تجربے یا تجویز کی مکمل تفصیل یہاں درج کریں...',
    emailLabel: 'ای میل ایڈریس (اختیاری - جواب حاصل کرنے کے لیے)',
    emailPlaceholder: 'your.email@example.com',
    emailHelper: 'آپ کا ای میل مکمل طور پر محفوظ ہے اور صرف جواب دینے کے لیے استعمال ہوگا۔',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'محفوظ کیا جا رہا ہے...',
    successTitle: 'جزاک اللہ خیراً — آپ کی رائے محفوظ ہو گئی ہے',
    successSubtitle: 'آپ کا پیغام ڈیٹا بیس میں محفوظ کر لیا گیا ہے اور بانی کو مطلع کر دیا گیا ہے۔',
    submissionIdLabel: 'حوالہ نمبر',
    statusLabel: 'سٹیٹس',
    submitAnotherBtn: 'ایک اور رائے بھیجیں',
    mySubmissionsTitle: 'آپ کی حالیہ آراء',
    adminConsoleBtn: 'بانی فیڈ بیک مینجمنٹ',
    adminConsoleTitle: 'پرائیویٹ بانی فیڈ بیک مینجمنٹ',
    adminConsoleSubtitle: 'موصول شدہ فیڈ بیک دیکھیں، فلٹر کریں، جواب دیں اور مسائل حل کریں۔',
    filterCategoryLabel: 'زمرہ',
    filterStatusLabel: 'سٹیٹس',
    allCategories: 'تمام زمرے',
    allStatuses: 'تمام سٹیٹس',
    resolvedFilter: 'حل شدہ',
    markResolved: 'حل شدہ نشان زد کریں',
    resolvedBadge: 'حل شدہ',
    replyPlaceholder: 'صارف کے لیے جواب لکھیں...',
    sendReplyBtn: 'جواب بھیجیں',
    SaveChangesBtn: 'سٹیٹس اپ ڈیٹ کریں',
    founderReplyLabel: 'بانی کا جواب',
    noFeedbackFound: 'کوئی فیڈ بیک نہیں ملا۔',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  id: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Bagikan ide Anda dan bantu kami meningkatkan Nafis Noor.',
    categoryLabel: 'Kategori Masukan',
    titleLabel: 'Judul Masukan',
    titlePlaceholder: 'Ringkasan singkat saran atau kendala Anda...',
    messageLabel: 'Pesan Lengkap',
    messagePlaceholder: 'Ceritakan pengalaman, saran, atau hal yang dapat kami tingkatkan...',
    emailLabel: 'Alamat Email (Opsional)',
    emailPlaceholder: 'email.anda@example.com (untuk menerima balasan)',
    emailHelper: 'Aman & terlindungi. Hanya digunakan untuk membalas masukan Anda.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Menyimpan...',
    successTitle: 'JazakAllahu Khayran — Masukan Tersimpan',
    successSubtitle: 'Masukan Anda telah disimpan secara permanen dan dikirim ke pendiri Nafis Noor.',
    submissionIdLabel: 'ID Pengiriman',
    statusLabel: 'Status',
    submitAnotherBtn: 'Kirim Masukan Lainnya',
    mySubmissionsTitle: 'Masukan Terbaru Anda',
    adminConsoleBtn: 'Manajemen Masukan (Founder)',
    adminConsoleTitle: 'Manajemen Masukan Khusus Founder',
    adminConsoleSubtitle: 'Tinjau semua masukan, filter kategori & status, dan balas pengguna.',
    filterCategoryLabel: 'Kategori',
    filterStatusLabel: 'Status',
    allCategories: 'Semua Kategori',
    allStatuses: 'Semua Status',
    resolvedFilter: 'Selesai Saja',
    markResolved: 'Tandai Selesai',
    resolvedBadge: 'Selesai',
    replyPlaceholder: 'Tulis balasan langsung ke pengguna...',
    sendReplyBtn: 'Kirim Balasan',
    SaveChangesBtn: 'Perbarui Status',
    founderReplyLabel: 'Balasan Founder',
    noFeedbackFound: 'Tidak ada masukan yang sesuai filter.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  es: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Comparte tus ideas y ayúdanos a mejorar Nafis Noor.',
    categoryLabel: 'Categoría',
    titleLabel: 'Título del comentario',
    titlePlaceholder: 'Resumen breve de tu sugerencia o problema...',
    messageLabel: 'Mensaje detallado',
    messagePlaceholder: 'Cuéntanos más sobre tu experiencia o sugerencia...',
    emailLabel: 'Correo electrónico (Opcional)',
    emailPlaceholder: 'tu.correo@example.com (para recibir respuestas)',
    emailHelper: 'Privado y protegido. Solo se usa para responder a tu mensaje.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Guardando...',
    successTitle: 'JazakAllahu Khayran — Comentario guardado',
    successSubtitle: 'Tu envío se ha guardado permanentemente y notificado al fundador.',
    submissionIdLabel: 'ID de envío',
    statusLabel: 'Estado',
    submitAnotherBtn: 'Enviar otro comentario',
    mySubmissionsTitle: 'Tus comentarios recientes',
    adminConsoleBtn: 'Gestión de Comentarios (Fundador)',
    adminConsoleTitle: 'Gestión Privada de Comentarios del Fundador',
    adminConsoleSubtitle: 'Revisa los comentarios enviados, filtra por categoría y estado, y responde.',
    filterCategoryLabel: 'Categoría',
    filterStatusLabel: 'Estado',
    allCategories: 'Todas las categorías',
    allStatuses: 'Todos los estados',
    resolvedFilter: 'Solo resueltos',
    markResolved: 'Marcar como resuelto',
    resolvedBadge: 'Resuelto',
    replyPlaceholder: 'Escribe una respuesta al usuario...',
    sendReplyBtn: 'Enviar respuesta',
    SaveChangesBtn: 'Actualizar estado',
    founderReplyLabel: 'Respuesta del Fundador',
    noFeedbackFound: 'No se encontraron comentarios.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  de: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'Teilen Sie Ihre Ideen und helfen Sie uns, Nafis Noor zu verbessern.',
    categoryLabel: 'Feedback-Kategorie',
    titleLabel: 'Feedback-Titel',
    titlePlaceholder: 'Kurze Zusammenfassung Ihres Vorschlags oder Problems...',
    messageLabel: 'Detaillierte Nachricht',
    messagePlaceholder: 'Erzählen Sie uns mehr über Ihre Erfahrung oder Ihren Vorschlag...',
    emailLabel: 'E-Mail-Adresse (Optional)',
    emailPlaceholder: 'ihre.email@example.com (für Antworten)',
    emailHelper: 'Geschützt & privat. Wird nur für Antworten auf Ihr Feedback verwendet.',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'Wird gespeichert...',
    successTitle: 'JazakAllahu Khayran — Feedback gespeichert',
    successSubtitle: 'Ihr Feedback wurde dauerhaft gespeichert und an den Gründer gesendet.',
    submissionIdLabel: 'Referenz-ID',
    statusLabel: 'Status',
    submitAnotherBtn: 'Weiteres Feedback senden',
    mySubmissionsTitle: 'Ihre letzten Einsendungen',
    adminConsoleBtn: 'Gründer-Feedback-Verwaltung',
    adminConsoleTitle: 'Private Gründer-Feedback-Verwaltung',
    adminConsoleSubtitle: 'Feedback prüfen, nach Kategorie und Status filtern und Benutzern antworten.',
    filterCategoryLabel: 'Kategorie',
    filterStatusLabel: 'Status',
    allCategories: 'Alle Kategorien',
    allStatuses: 'Alle Status',
    resolvedFilter: 'Nur gelöste',
    markResolved: 'Als gelöst markieren',
    resolvedBadge: 'Gelöst',
    replyPlaceholder: 'Antwort an den Benutzer schreiben...',
    sendReplyBtn: 'Antwort senden',
    SaveChangesBtn: 'Status aktualisieren',
    founderReplyLabel: 'Antwort des Gründers',
    noFeedbackFound: 'Kein Feedback gefunden.',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  am: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: 'ሀሳবዎን ያጋሩን እና Nafis Noorን እንድናሻሽል ያግዙን።',
    categoryLabel: 'የአስተያየት ምድብ',
    titleLabel: 'የአስተያየት ርዕስ',
    titlePlaceholder: 'የሀሳብዎ ወይም የችግሩ አጭር ማጠቃለያ...',
    messageLabel: 'ዝርዝር መልእክት',
    messagePlaceholder: 'ስለ ልምድዎ ወይም ሀሳብዎ በዝርዝር ይጻፉልን...',
    emailLabel: 'ኢሜይል አድራሻ (አማራጭ - ምላሽ ለማግኘት)',
    emailPlaceholder: 'your.email@example.com',
    emailHelper: 'የተጠበቀ እና ሚስጥራዊ። ምላሽ ለመስጠት ብቻ ጥቅም ላይ ይውላል።',
    submitBtn: 'Submit Feedback',
    submittingBtn: 'በማስቀመጥ ላይ...',
    successTitle: 'ጀزاከላሁ ኸይረን — አስተያየትዎ ተቀምጧል',
    successSubtitle: 'መልእክትዎ በቋሚነት ተመዝግቧል እና ለመስራቹ ተልኳል።',
    submissionIdLabel: 'መለያ ቁጥር',
    statusLabel: 'ሁኔታ',
    submitAnotherBtn: 'ሌላ አስተያየት ይላኩ',
    mySubmissionsTitle: 'የቅርብ ጊዜ አስተያየቶችዎ',
    adminConsoleBtn: 'የመስራች አስተያየት አስተዳደር',
    adminConsoleTitle: 'የግል መስራች አስተያየት አስተዳደር',
    adminConsoleSubtitle: 'ሁሉንም አስተያየቶች ይመልከቱ፣ ያጣሩ እና ምላሽ ይስጡ።',
    filterCategoryLabel: 'ምድብ',
    filterStatusLabel: 'ሁኔታ',
    allCategories: 'ሁሉም ምድቦች',
    allStatuses: 'ሁሉም ሁኔታዎች',
    resolvedFilter: 'የተፈቱ ብቻ',
    markResolved: 'እንደተፈታ ምልክት ያድርጉ',
    resolvedBadge: 'ተፈትቷል',
    replyPlaceholder: 'ለተጠቃሚው ምላሽ ይጻፉ...',
    sendReplyBtn: 'ምላሽ ይላኩ',
    SaveChangesBtn: 'ሁኔታ አዘምን',
    founderReplyLabel: 'የመስራቹ ምላሽ',
    noFeedbackFound: 'ምንም አስተያየት አልተገኘም።',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
  zh: {
    settingsLabel: 'Feedback & Suggestions',
    settingsSubtitle: 'Share your ideas and help us improve Nafis Noor.',
    screenTitle: 'Feedback & Suggestions',
    screenSubtitle: '分享您的想法，帮助我们不断完善 Nafis Noor。',
    categoryLabel: '反馈类别',
    titleLabel: '反馈标题',
    titlePlaceholder: '简要概括您的建议或遇到的问题...',
    messageLabel: '详细内容',
    messagePlaceholder: '请详细描述您的使用体验、功能建议或需要改进的地方...',
    emailLabel: '电子邮箱（选填，用于接收回复）',
    emailPlaceholder: 'your.email@example.com',
    emailHelper: '严格保密，仅在 Nafis Noor 团队回复您的反馈时使用。',
    submitBtn: 'Submit Feedback',
    submittingBtn: '正在保存...',
    successTitle: 'JazakAllahu Khayran — 反馈已保存',
    successSubtitle: '您的反馈已永久保存在数据库中，并已通知 Nafis Noor 创始人。',
    submissionIdLabel: '提交编号',
    statusLabel: '状态',
    submitAnotherBtn: '提交另一条反馈',
    mySubmissionsTitle: '您最近提交的反馈',
    adminConsoleBtn: '创始人反馈管理后台',
    adminConsoleTitle: '创始人专属反馈管理中心',
    adminConsoleSubtitle: '查看所有用户反馈、按类别与状态筛选、回复用户并标记已解决。',
    filterCategoryLabel: '类别',
    filterStatusLabel: '状态',
    allCategories: '所有类别',
    allStatuses: '所有状态',
    resolvedFilter: '仅显示已解决',
    markResolved: '标记为已解决',
    resolvedBadge: '已解决',
    replyPlaceholder: '撰写给用户的回复...',
    sendReplyBtn: '发送回复并标记已回复',
    SaveChangesBtn: '更新状态',
    founderReplyLabel: '创始人回复',
    noFeedbackFound: '没有符合筛选条件的反馈记录。',
    categories: {
      'General Feedback': 'General Feedback',
      'Feature Request': 'Feature Request',
      'Bug Report': 'Bug Report',
      'Quran Experience': 'Quran Experience',
      'Tasme3 Experience': 'Tasme3 Experience',
      Other: 'Other',
    },
    statuses: {
      Pending: 'Pending',
      'Under Review': 'Under Review',
      Answered: 'Answered',
    },
  },
};

export function getFeedbackTranslations(lang: SupportedLanguageCode): FeedbackTranslations {
  return FEEDBACK_I18N[lang] || FEEDBACK_I18N.en;
}

function generateClientFeedbackId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomBytes = new Uint8Array(3);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 3; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `FB-${datePart}-${hex}`;
}

export function validateFeedbackInput(input: SubmitFeedbackInput): string | null {
  if (!FEEDBACK_CATEGORIES.includes(input.category)) {
    return 'Please select a valid feedback category.';
  }
  const title = (input.title || '').trim();
  if (title.length < 2 || title.length > 200) {
    return 'Please enter a feedback title between 2 and 200 characters.';
  }
  const message = (input.message || '').trim();
  if (message.length < 5 || message.length > 5000) {
    return 'Please enter a detailed message between 5 and 5000 characters.';
  }
  const email = (input.email || '').trim();
  if (email.length > 0) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address or leave the email field empty.';
    }
  }
  return null;
}

/**
 * Permanently saves a feedback submission to both Firestore (/feedback/{id})
 * and the backend server (/api/feedback), triggering the Founder email notification.
 * Throws an error if saving fails so the UI never displays a fake success message.
 */
export async function submitUserFeedback(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResult> {
  const validationError = validateFeedbackInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const nowIso = new Date().toISOString();
  const id = generateClientFeedbackId();
  const firebaseUid = auth?.currentUser?.uid || 'guest';
  const cleanTitle = input.title.trim();
  const cleanMessage = input.message.trim();
  const cleanEmail = (input.email || '').trim();
  const cleanUserName = (input.userName || auth?.currentUser?.displayName || 'Guest User')
    .trim()
    .slice(0, 120) || 'Guest User';

  const firestoreRecord: FeedbackSubmission = {
    id,
    category: input.category,
    title: cleanTitle,
    message: cleanMessage,
    email: cleanEmail,
    userId: firebaseUid,
    userName: cleanUserName,
    status: 'Pending',
    isResolved: false,
    adminReply: '',
    repliedAt: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  let clientFirestoreSaved = false;
  if (db) {
    try {
      await setDoc(doc(db, 'feedback', id), firestoreRecord);
      clientFirestoreSaved = true;
    } catch (err) {
      console.warn('[FeedbackService] Client Firestore write warning (will persist via backend):', err);
    }
  }

  // Send to backend /api/feedback for permanent server storage, Firestore REST sync & Founder email notification
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      category: input.category,
      title: cleanTitle,
      message: cleanMessage,
      email: cleanEmail,
      userId: firebaseUid,
      userName: cleanUserName,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    // Only fail if backend save failed AND client Firestore also failed
    if (!clientFirestoreSaved) {
      throw new Error(
        data.error || 'Failed to save your feedback submission. Please check your connection and try again.'
      );
    }
    return {
      submission: firestoreRecord,
      founderNotified: false,
      firestoreSaved: true,
    };
  }

  return {
    submission: (data.submission as FeedbackSubmission) || firestoreRecord,
    founderNotified: Boolean(data.founderNotified),
    firestoreSaved: Boolean(clientFirestoreSaved || data.firestoreSaved),
    reviewUrl: data.reviewUrl,
  };
}

/**
 * Fetches the currently signed-in user's own feedback submissions from Firestore.
 */
export async function fetchMyFeedbackSubmissions(): Promise<FeedbackSubmission[]> {
  if (!db || !auth?.currentUser?.uid) {
    return [];
  }
  try {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    const items: FeedbackSubmission[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as FeedbackSubmission;
      if (data && data.id) {
        items.push(data);
      }
    });
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

async function getAdminBearerToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const storedAdminToken = sessionStorage.getItem('noor_admin_token');
    if (storedAdminToken) return storedAdminToken;
  }
  const firebaseToken = await getCurrentUserIdToken().catch(() => null);
  return firebaseToken;
}

/**
 * Fetches all feedback submissions for authorized administrators, combining
 * Firestore documents and backend records.
 */
export async function fetchAdminFeedbackList(
  categoryFilter: string = 'All',
  statusFilter: string = 'All'
): Promise<FeedbackSubmission[]> {
  const mergedMap = new Map<string, FeedbackSubmission>();

  // 1. Try Firestore admin read if signed in
  if (db && auth?.currentUser) {
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const item = docSnap.data() as FeedbackSubmission;
        if (item && item.id) {
          mergedMap.set(item.id, item);
        }
      });
    } catch {
      // May not have Firebase Auth admin token if using server Admin Password token
    }
  }

  // 2. Fetch from backend /api/feedback/admin
  const bearer = await getAdminBearerToken();
  if (bearer) {
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter !== 'All') params.set('category', categoryFilter);
    if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter);

    const res = await fetch(`/api/feedback/admin?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.submissions)) {
        for (const item of data.submissions as FeedbackSubmission[]) {
          const existing = mergedMap.get(item.id);
          if (
            !existing ||
            new Date(item.updatedAt || item.createdAt).getTime() >=
              new Date(existing.updatedAt || existing.createdAt).getTime()
          ) {
            mergedMap.set(item.id, item);
          }
        }
      }
    } else if (mergedMap.size === 0) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Administrator authorization required to view feedback.');
    }

    // Sync any Firestore-only items to backend
    if (mergedMap.size > 0) {
      fetch('/api/feedback/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({
          submissions: Array.from(mergedMap.values()),
        }),
      }).catch(() => {});
    }
  } else if (mergedMap.size === 0) {
    throw new Error('Administrator session token is required to view feedback.');
  }

  let results = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (categoryFilter && categoryFilter !== 'All') {
    results = results.filter((item) => item.category === categoryFilter);
  }
  if (statusFilter && statusFilter !== 'All') {
    if (statusFilter === 'Resolved') {
      results = results.filter((item) => item.isResolved);
    } else {
      results = results.filter((item) => item.status === statusFilter);
    }
  }

  return results;
}

/**
 * Updates a feedback submission's status, resolution flag, or admin reply
 * in both Firestore and the backend server (which also emails the user if a reply is added).
 */
export async function updateAdminFeedbackItem(
  id: string,
  updates: {
    status?: FeedbackStatus;
    isResolved?: boolean;
    adminReply?: string;
  },
  fallbackItem: FeedbackSubmission
): Promise<{
  submission: FeedbackSubmission;
  userReplyEmailed: boolean;
}> {
  const nowIso = new Date().toISOString();
  const nextStatus: FeedbackStatus =
    updates.status && FEEDBACK_STATUSES.includes(updates.status)
      ? updates.status
      : updates.adminReply && updates.adminReply.trim().length > 0
      ? 'Answered'
      : fallbackItem.status;

  const nextResolved =
    typeof updates.isResolved === 'boolean' ? updates.isResolved : fallbackItem.isResolved;

  const nextReply =
    typeof updates.adminReply === 'string'
      ? updates.adminReply.trim()
      : fallbackItem.adminReply || '';

  const nextRepliedAt =
    typeof updates.adminReply === 'string' && updates.adminReply.trim().length > 0
      ? nowIso
      : fallbackItem.repliedAt || '';

  const updatedDoc: FeedbackSubmission = {
    ...fallbackItem,
    status: nextStatus,
    isResolved: nextResolved,
    adminReply: nextReply,
    repliedAt: nextRepliedAt,
    updatedAt: nowIso,
  };

  let firestoreUpdated = false;
  if (db && auth?.currentUser) {
    try {
      await setDoc(doc(db, 'feedback', id), updatedDoc);
      firestoreUpdated = true;
    } catch {
      // Fall through to backend update
    }
  }

  const bearer = await getAdminBearerToken();
  if (!bearer && !firestoreUpdated) {
    throw new Error('Administrator authorization is required to update feedback.');
  }

  if (bearer) {
    const res = await fetch(`/api/feedback/admin/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({
        status: nextStatus,
        isResolved: nextResolved,
        adminReply: updates.adminReply,
        fallbackItem: updatedDoc,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      if (!firestoreUpdated) {
        throw new Error(data.error || 'Failed to update feedback submission.');
      }
      return {
        submission: updatedDoc,
        userReplyEmailed: false,
      };
    }

    return {
      submission: (data.submission as FeedbackSubmission) || updatedDoc,
      userReplyEmailed: Boolean(data.userReplyEmailed),
    };
  }

  return {
    submission: updatedDoc,
    userReplyEmailed: false,
  };
}

/**
 * Verifies a signed Founder review link (?reviewFeedback=<id>&reviewToken=<hmac>)
 * and establishes an authenticated Admin session token.
 */
export async function verifyFounderReviewLink(
  submissionId: string,
  reviewToken: string
): Promise<{
  adminToken: string;
  submission: FeedbackSubmission | null;
}> {
  const res = await fetch('/api/feedback/verify-review-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      submissionId,
      reviewToken,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid or expired founder review link.');
  }

  if (typeof window !== 'undefined' && data.adminToken) {
    sessionStorage.setItem('noor_admin_token', data.adminToken);
  }

  return {
    adminToken: data.adminToken,
    submission: data.submission || null,
  };
}
