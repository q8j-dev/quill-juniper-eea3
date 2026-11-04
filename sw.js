const home = new URL('./', self.location).href;
const MIRRORS = ['cdn.jsdelivr.net', 'fastly.jsdelivr.net', 'gcore.jsdelivr.net'];
let ready = null;

async function fetchPage() {
  let failure = null;
  for (let round = 0; round < 2; round++) {
    for (const host of MIRRORS) {
      const url = (home + 'webblox.html').replace('://cdn.jsdelivr.net/', `://${host}/`);
      try {
        const res = await fetch(url, { cache: round ? 'reload' : 'no-cache' });
        if (res.ok) return res.text();
        failure = new Error(`webblox.html returned ${res.status}`);
      } catch (err) {
        failure = err;
      }
    }
  }
  throw failure;
}

const load = () => ready ??= fetchPage()
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
