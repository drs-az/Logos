
// Basic service worker for offline caching
const CACHE = 'wordlish-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const url of ASSETS) {
      if (url.endsWith('index.html')) {
        await c.add(new Request(url, {cache: 'reload'}));
      } else {
        await c.add(url);
      }
    }
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if (k !== CACHE) return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Network-first for html, cache-first for others
  if (url.pathname.endsWith('.html') || url.pathname === '/' ) {
    e.respondWith((async () => {
      try { return await fetch(e.request, {cache: 'reload'}); }
      catch { return caches.match('./index.html'); }
    })());
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
