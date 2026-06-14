/* Crono service worker.
   - HTML pages AND static assets: network-first (deploys show immediately when online; the cache
     is the offline fallback). Both validate against the server ("no-cache") so GitHub Pages'
     max-age=600 can't hand back stale bytes. This keeps a returning user's HTML and its CSS/JS
     CONSISTENT in the same load — no "one load behind" mismatch (e.g. new page + old styles).
   - Offline: every response falls back to the cache, so the whole app still works with no network.
   - Updates WAIT: a freshly-installed worker does not skipWaiting on its own. The page's
     "new version" toast posts SKIP_WAITING when the user clicks Reload, so the running
     version is never swapped out mid-race. Bump CACHE to drop the old cache + force a
     fresh precache. Keep ASSETS in sync. */
var CACHE = "crono-v113";
var ASSETS = [
  "./",
  "index.html",
  "app.html",
  "bibs.html",
  "display.html",
  "terms.html",
  "privacy.html",
  "favicon.svg",
  "manifest.webmanifest",
  "assets/theme.css",
  "assets/app.css",
  "assets/site.css",
  "assets/bibs.css",
  "assets/display.css",
  "assets/legal.css",
  "assets/toolbar.css",
  "assets/toast.css",
  "assets/app.js",
  "assets/display.js",
  "assets/helpers.js",
  "assets/i18n.js",
  "assets/head.js",
  "assets/site.js",
  "assets/bibs.js",
  "assets/coffee.css",
  "assets/coffee.js",
  "assets/qr-crono.svg",
  "assets/icon-180.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/sw-register.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Precache bypassing the HTTP cache so a fresh deploy never stores stale files
    // (GitHub Pages serves assets with Cache-Control: max-age=600). Don't fail the whole
    // install if one asset 404s.
    return Promise.all(ASSETS.map(function (u) {
      return fetch(new Request(u, { cache: "reload" }))
        .then(function (res) { if (res && res.ok) return c.put(u, res); })
        .catch(function () {});
    }));
  }));
  // No skipWaiting() here: the new worker waits until the page's "Reload" asks it
  // to take over (SKIP_WAITING below), so a deploy never disrupts a live race.
});

// The page (sw-register.js) posts these:
//  - SKIP_WAITING when the user clicks "Reload" on the update toast.
//  - GET_VERSION to learn this worker's CACHE, so the page can remember a dismissed
//    version and not re-nag with the same toast on every navigation.
self.addEventListener("message", function (e) {
  if (!e.data) return;
  if (e.data.type === "SKIP_WAITING") self.skipWaiting();
  else if (e.data.type === "GET_VERSION" && e.ports && e.ports[0]) e.ports[0].postMessage(CACHE);
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // Don't intercept cross-origin (e.g. Google Fonts) — let the network handle it.
  if (new URL(req.url).origin !== self.location.origin) return;

  var isPage = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") > -1;

  // Network-first for EVERYTHING (HTML + static assets). Validate against the server
  // ("no-cache") so GitHub Pages' max-age=600 can't hand back stale bytes, and update the
  // cache on every successful load. When online a returning user always gets the current
  // page AND its current CSS/JS together (no one-load-behind mismatch); offline falls back
  // to the cache so the whole app keeps working with no network.
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) {
        if (m) return m;
        // Navigations that miss the cache fall back to a shell page.
        if (isPage) return caches.match("app.html") || caches.match("index.html");
        return m;
      });
    })
  );
});
