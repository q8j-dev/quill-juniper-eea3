const home = new URL('./', self.location).href;
const ready = fetch(home + 'webblox.html').then(r => r.text()).then(html => {
  const code = html.match(/<script type="text\/webblox-sw">([\s\S]*?)<\/script>/)[1];
  return new Function('home', 'html', code)(home, html);
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => e.respondWith(ready.then(h => h(e)).catch(err => new Response(String(err.stack || err), { status: 500 }))));
