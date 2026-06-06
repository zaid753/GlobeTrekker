const CACHE_NAME = 'travel-planner-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                // Caching basic HTML; the Vite assets will have hashes, so it's best to cache on navigate or fetch
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    // Do not cache external API requests if they are meant to be fresh, but for offline viewing, maybe we try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If valid response, clone and cache it
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Return cached version if network fails (offline)
                return caches.match(event.request, { ignoreSearch: true }).then((response) => {
                    if (response) return response;
                    // If it's a navigation request and we are offline, fallback to index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html', { ignoreSearch: true });
                    }
                    return null;
                });
            })
    );
});
