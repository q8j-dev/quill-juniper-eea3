const home = new URL('./', self.location).href;
const BOOT = home + 'boot.svg';
const PAYLOAD = home + '__payload__';
const STORE = 'webblox-boot';
let ready = null;

const load = () => ready ??= caches.open(STORE)
  .then(cache => cache.match(PAYLOAD))
  .then(res => {
    if (!res) throw new Error('WebBlox has nothing to run here yet. Open webblox.html again.');
    return res.json();
  })
  .then(payload => new Function('home', 'payload', payload.sw)(home, payload))
  .catch(err => {
    ready = null;
    throw err;
  });

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(STORE).then(cache => cache.add(BOOT)).catch(() => {}));
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'webblox-payload-changed') return;
  ready = null;
  event.ports[0]?.postMessage('ok');
});
self.addEventListener('fetch', event => {
  if (event.request.url.replace(/[?#].*$/, '') === BOOT) {
    event.respondWith(caches.open(STORE).then(cache => cache.match(BOOT)).then(hit => hit || fetch(event.request)));
    return;
  }
  event.respondWith(load().then(handle => handle(event)).catch(err => new Response(String(err?.message || err), {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })));
});
