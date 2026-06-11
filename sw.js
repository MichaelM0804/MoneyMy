const CACHE = 'monefy-v23';
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

  // Redirect bare domain root to /MoneyMy/
  if (url.pathname === '/' || url.pathname === '') {
    e.respondWith(Response.redirect('/MoneyMy/', 302));
    return;
  }

  const isNav = e.request.mode === 'navigate' ||
    url.pathname === BASE + '/' ||
    url.pathname === BASE + '/index.html';

  if (isNav) {
    // Network first для навигации — всегда грузим свежую версию
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE).then(cache => cache.put(e.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).catch(() => null)
      )
    );
  }
});
