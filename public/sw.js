const CACHE_NAME = 'blockriser-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/index.css',
    '/background.png',
    '/index.tsx',
    '/src/main.ts',
    '/src/game.ts',
    '/src/render.ts',
    '/src/input.ts',
    '/src/ai.ts'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => response);
                return response || fetchPromise;
            });
        })
    );
});
