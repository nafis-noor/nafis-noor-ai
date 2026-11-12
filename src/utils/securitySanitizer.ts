import DOMPurify from 'dompurify';
import { UserStats } from '../types';

/**
 * Strips all HTML tags, script payloads, inline event handlers, and dangerous URI schemes
 * while preserving Arabic diacritics, Quranic symbols, and standard Unicode text.
 */
export function sanitizeUserText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  const stripped = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  return stripped
    .replace(/\0/g, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes Markdown text before rendering to block injected <script>, <iframe>, or javascript: links
 */
export function sanitizeMarkdownContent(input: unknown, maxLength = 25000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|applet|meta|link|style|form|base)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .slice(0, maxLength);
}

/**
 * Validates that a URL is safe (https:, http:, mailto:, or relative path) and blocks javascript:/data: URIs
 */
export function sanitizeSafeUrl(url: unknown): string {
  if (typeof url !== 'string' || !url.trim()) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
  } catch {
    return '#';
  }
  return '#';
}

/**
 * Enforces firebase-blueprint.json volumetric boundaries and XSS sanitization on UserStats
 * prior to saving to Firestore or localStorage.
 */
export function sanitizeUserStatsPayload(stats: UserStats): UserStats {
  return {
    ...stats,
    userName: sanitizeUserText(stats.userName || 'Servant of Allah', 100) || 'Servant of Allah',
    userLocation: sanitizeUserText(stats.userLocation || 'Makkah', 100) || 'Makkah',
    language: sanitizeUserText(stats.language || 'English', 40) || 'English',
    currentDhikrText: sanitizeUserText(stats.currentDhikrText || 'SubhanAllah', 200) || 'SubhanAllah',
    accountId: stats.accountId ? sanitizeUserText(stats.accountId, 128) : undefined,
    accountEmail: stats.accountEmail ? sanitizeUserText(stats.accountEmail, 254) : undefined,
    bookmarks: Array.isArray(stats.bookmarks) ? stats.bookmarks.slice(0, 500) : [],
    savedDuas: Array.isArray(stats.savedDuas)
      ? stats.savedDuas.slice(0, 500).map((id) => sanitizeUserText(id, 64))
      : [],
    completedLessonIds: Array.isArray(stats.completedLessonIds)
      ? stats.completedLessonIds.slice(0, 500).map((id) => sanitizeUserText(id, 64))
      : [],
    prayerHistory: Array.isArray(stats.prayerHistory) ? stats.prayerHistory.slice(-120) : [],
    activityHistory: Array.isArray(stats.activityHistory) ? stats.activityHistory.slice(-120) : [],
    noorAiConversation: Array.isArray(stats.noorAiConversation)
      ? stats.noorAiConversation.slice(-100).map((msg) => ({
          ...msg,
          text: sanitizeMarkdownContent(msg.text, 8000),
        }))
      : [],
  };
}
