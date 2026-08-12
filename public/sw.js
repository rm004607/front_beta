// Service worker mínimo para que Dameldato sea instalable (PWA) + shell offline básico.
const CACHE = 'dameldato-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Solo interceptamos navegaciones (para poder mostrar el shell si no hay red).
// El resto (API, assets) pasa directo a la red.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/'))
  );
});
