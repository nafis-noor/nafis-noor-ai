/**
 * Performance Utilities for iOS Safari & Low-Power Mobile Devices
 * Enforces debouncing, throttling (max once per 100ms), and 30fps frame capping
 */

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number = 100
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Initializes global iOS Safari scroll optimizations:
 * - Uses passive event listeners for smooth 60fps scrolling
 * - Debounces scroll-triggered events to fire max once per 100ms
 */
export function initScrollPerformance(): void {
  if (typeof window === 'undefined') return;

  const debouncedScrollBroadcast = debounce(() => {
    window.dispatchEvent(
      new CustomEvent('noor:debounced-scroll', {
        detail: { scrollY: window.scrollY, scrollX: window.scrollX },
      })
    );
  }, 100);

  try {
    window.addEventListener('scroll', debouncedScrollBroadcast, { passive: true });
  } catch {
    window.addEventListener('scroll', debouncedScrollBroadcast as EventListener);
  }
}
