// MiC Scene Editor offline cache. The page and its code: network first (always the newest when online, the saved
// copy when offline). Fonts, paper and icons: from the cache (they never change). VERSION is set by editor/build.sh.
const VERSION = '20261121134736';
const CACHE = `mic-editor-${VERSION}`;
const SHELL = ['./', 'index.html', 'app.js', 'paper.jpg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'fonts/Inter-Regular.woff', 'fonts/Inter-SemiBold.woff', 'fonts/Inter-Bold.woff', 'fonts/Inter-ExtraBold.woff',
  'fonts/Lora-Variable.woff', 'fonts/LMRoman10-Regular.woff', 'fonts/LMRoman10-Italic.woff', 'fonts/LatinModernMath.woff'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mic-editor-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // GitHub API etc. go straight to the network
  const fresh = /\/(index\.html|app\.js)?$/.test(u.pathname) || u.pathname.endsWith('.webmanifest');
  if (fresh) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return res; })));
  }
});
