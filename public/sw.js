const CACHE_NAME = 'blockriser-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/index.css',
    '/toy-box.css',
    '/adventure.css',
    '/boosters.css',
    '/mobile-fixes.css',
    '/world-backgrounds.css',
    '/button-fix.css',
    '/bg_1.png',
    '/bg_2.png',
    '/bg_3.png',
    '/bg_4.png',
    '/bg_5.png',
    '/bg_6.png',
    '/bg_robot.svg',
    '/bg_jungle.svg',
    '/bg_hero.svg',
    '/bg_master.svg',
    '/icon_hammer.svg',
    '/icon_tnt.svg',
    '/icon_reroll.svg',
    '/icon_undo.svg'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
