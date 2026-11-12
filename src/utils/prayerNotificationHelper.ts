import { PrayerName } from '../types/prayerCheck';
import { PRAYER_ARABIC_NAMES } from './aladhanService';

/**
 * Triggers a browser or push notification for prayer check
 */
export async function sendPrayerCheckNotification(
  prayerName: PrayerName,
  timeStr: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const title = `Time for ${prayerName} Prayer Check (صلاة ${PRAYER_ARABIC_NAMES[prayerName]})`;
  const body = `It is now time for ${prayerName} prayer (${timeStr}). Confirm your prayer under oath within the 10-minute on-time grace period.`;
  const icon = '/icon-192.png';
  const tag = `prayer-check-${prayerName.toLowerCase()}`;

  // 1. Try Service Worker Notification (works in background & PWA)
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon,
            badge: '/favicon.svg',
            tag,
            data: { url: '/prayer-check', prayerName },
          });
          return true;
        }
      } catch (err) {
        console.warn('SW notification fallback:', err);
      }
    }
  }

  // 2. Fallback to standard window Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon,
        tag,
      });
      n.onclick = () => {
        window.focus();
        window.location.hash = '#prayer-check';
        n.close();
      };
      return true;
    } catch (err) {
      console.warn('Window notification note:', err);
    }
  }

  return false;
}

/**
 * Request notification permissions
 */
export async function requestPrayerNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}
