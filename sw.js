const CACHE = 'monefy-v21';
const BASE = self.location.pathname.replace('/sw.js', '');

const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isNav = e.request.mode === 'navigate' ||
    url.pathname === BASE + '/' ||
    url.pathname === BASE + '/index.html';

  if (isNav) {
    // Stale-while-revalidate для index.html:
    // 1. Сразу отдаём из кеша (офлайн работает)
    // 2. Параллельно загружаем свежую версию и обновляем кеш
    // 3. При следующем открытии — уже новая версия
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const networkFetch = fetch(e.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(e.request, response.clone());
              }
              return response;
            })
            .catch(() => null);

          return cached || networkFetch;
        })
      )
    );
  } else {
    // Остальные файлы — cache-first
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).catch(() => null)
      )
    );
  }
});
