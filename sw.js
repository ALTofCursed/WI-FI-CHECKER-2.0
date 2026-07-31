// Wi-Fi Checker 2.0 — service worker
// Caches only the app shell (this page + icons) so the app opens instantly
// and works offline. Speed-test requests always go straight to the network —
// they must never be served from cache, or the results would be meaningless.

const CACHE_NAME = 'wifi-checker-shell-v1';
const APP_SHELL = [
    './index.htm',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // never intercept speed-test traffic or cross-origin requests —
    // they must always hit the real network to give real measurements
    if (
        event.request.method !== 'GET' ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    // app shell: cache-first, falling back to network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return (
                cached ||
                fetch(event.request).then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return resp;
                })
            );
        })
    );
});
