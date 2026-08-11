// Service Worker do FORJA — cache do "app shell" para uso offline e instalação como PWA.
const CACHE_NAME = 'forja-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // App shell: cache-first, com atualização em segundo plano (stale-while-revalidate)
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone()));
            return networkRes;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  } else {
    // Recursos externos (Tailwind CDN, Google Fonts, API da Groq): direto na rede.
    // Não interceptamos para não quebrar chamadas à API ou fontes.
    return;
  }
});
