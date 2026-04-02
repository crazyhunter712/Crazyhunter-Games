const CACHE_NAME = 'crazyhunter-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/script.js',
  '/src/index.css',
  '/src/games.json',
  '/src/comments.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
