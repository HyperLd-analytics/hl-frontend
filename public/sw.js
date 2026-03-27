const CACHE_NAME = "hl-lens-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline",
];

// Navigation routes to pre-cache
const NAV_ROUTES = [
  "/",
  "/dashboard",
  "/dashboard/leaderboard",
  "/dashboard/community",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...STATIC_ASSETS, ...NAV_ROUTES]).catch(() => {
        // Ignore errors during initial cache
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, stale-while-revalidate for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (!url.origin.startsWith(self.location.origin)) return;

  // API: network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, clone)
            );
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Next.js App Router: stale-while-revalidate
  // Cache page shell, update in background
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return res;
          })
          .catch(() => {
            if (!cached) return caches.match("/offline");
            return cached;
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => new Response("Offline", { status: 503 }));
    })
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
