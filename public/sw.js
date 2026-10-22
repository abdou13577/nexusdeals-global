// NexusDeals service worker: instant app-shell + resilient API fallback
const VERSION = 'nexus-v4.0';
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const SHELL_URLS = ['/', '/styles.css?v=4.0', '/app.js?v=4.0', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => Promise.all(SHELL_URLS.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/out') || url.pathname.startsWith('/api/admin') || url.pathname.startsWith('/owner-admin') || url.pathname === '/admin') return;

  // API data: network first, fall back to last cached copy if server is slow/asleep
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      Promise.race([fetch(req), timeout(6000)])
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.open(DATA).then((c) => c.match(url.pathname)).then((hit) => hit || fetch(req)))
    );
    return;
  }

  // Pages: serve cached shell instantly, refresh in background
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL).then((c) =>
        c.match('/').then((hit) => {
          const refresh = fetch(req).then((res) => { if (res && res.ok) c.put('/', res.clone()); return res; }).catch(() => hit);
          return hit || refresh;
        })
      )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(SHELL).then((c) =>
      c.match(req).then((hit) => {
        const refresh = fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || refresh;
      })
    )
  );
});
