const CACHE_NAME = 'klutchh-app-v2';
const FIRESTORE_CACHE = 'klutchh-firestore-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core application shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== FIRESTORE_CACHE) {
            console.log('[ServiceWorker] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch Event - Strategy: Network first with safe fallback for navigation only
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass dev tooling, vite, workers, and extensions completely
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('?worker') ||
    url.pathname.includes('?t=') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.task')
  ) {
    return;
  }

  // Firestore or External API requests
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(FIRESTORE_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ offline: true, message: 'Offline mode - serving cached Firestore reports' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Static Assets Strategy (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // ONLY return index.html fallback for navigation (HTML page load) requests!
          // NEVER return HTML for scripts, styles, or workers, which causes "Unexpected token '<'".
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/') || caches.match('/index.html');
          }
          return cachedResponse || new Response(null, { status: 404 });
        });

      return cachedResponse || fetchPromise;
    })
  );
});
