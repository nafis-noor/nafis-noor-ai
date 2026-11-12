/**
 * API and WebSocket Endpoint Configuration
 * Seamlessly resolves API endpoints across Web, PWA, and native Android Studio / Capacitor environments.
 */

// Production live deployment URL for Nafis Noor backend
export const DEFAULT_LIVE_BACKEND_URL = 'https://nafisnoor.site';

/**
 * Returns true if running inside a native mobile container (Capacitor / Android WebView / local file)
 */
export function isNativeMobileContainer(): boolean {
  if (typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Capacitor or Cordova local scheme
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') {
    return true;
  }

  // Localhost running in an embedded Android WebView without dev port 3000
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '3000' && port !== '5173') {
    return true;
  }

  return false;
}

/**
 * Resolves full API URL for any path e.g. '/api/noor-ai'
 */
export function getApiUrl(endpointPath: string): string {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  // If in native mobile container and not dev server, point to hosted cloud backend
  if (isNativeMobileContainer()) {
    return `${DEFAULT_LIVE_BACKEND_URL}${cleanPath}`;
  }

  // In web/PWA/dev server, relative path is always preferred and same-origin
  return cleanPath;
}

/**
 * Resolves full WebSocket URL for streaming live endpoints e.g. '/api/live'
 */
export function getWebSocketUrl(endpointPath: string): string {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  if (isNativeMobileContainer()) {
    const wsBase = DEFAULT_LIVE_BACKEND_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return `${wsBase}${cleanPath}`;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  const fallbackWs = DEFAULT_LIVE_BACKEND_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return `${fallbackWs}${cleanPath}`;
}
