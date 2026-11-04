const home = new URL('./', self.location).href;
let ready = null;
const load = () => ready ??= fetch(home + 'webblox.html', { cache: 'no-cache' })
  .then(res => {
    if (!res.ok) throw new Error(`webblox.html returned ${res.status}`);
    return res.text();
  })
  .then(html => {
    const code = html.match(/<script type="text\/webblox-sw">([\s\S]*?)<\/script>/)[1];
    return new Function('home', 'html', code)(home, html);
  })
  .catch(err => {
    ready = null;
    throw err;
  });

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(load());
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  event.respondWith(load().then(handle => handle(event)).catch(err => new Response(String(err?.stack || err), {
    status: 500,
    headers: { 'Content-Type': 'text/plain' },
  })));
});
