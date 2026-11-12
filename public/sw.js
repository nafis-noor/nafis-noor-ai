/**
 * NOOR PWA Service Worker (v4)
 * Provides offline capabilities, asset caching, and instantaneous updates
 */

const CACHE_NAME = 'noor-pwa-v4';
const IMMUTABLE_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(IMMUTABLE_ASSETS).catch((err) => {
        console.warn('PWA precache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API routes, Chrome extensions, and Vite dynamic development modules
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Navigation requests: Network-first, caching successful response, with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nafis Noor - Offline</title><style>body{font-family:sans-serif;background:#090B0E;color:#E5E7EB;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}h1{color:#DFBA7F;margin-bottom:8px}p{color:#A8A29E;font-size:14px;max-width:320px;line-height:1.5}button{background:#DFBA7F;color:#090B0E;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:20px;font-size:14px}</style></head><body><div><h1>Nafis Noor</h1><p>You appear to be offline. Reconnect to the internet and tap retry to continue.</p><button onclick="window.location.reload()">Retry Connection</button></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Static assets (images, fonts, manifest)
  const isStaticMedia =
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.json');

  if (isStaticMedia) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
