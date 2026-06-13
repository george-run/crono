/* Crono service worker.
   - HTML pages: network-first (deploys show immediately when online; cache is the offline fallback).
   - Static assets: stale-while-revalidate (instant + offline, and the cache self-heals on the next
     load even if CACHE wasn't bumped).
   - Updates WAIT: a freshly-installed worker does not skipWaiting on its own. The page's
     "new version" toast posts SKIP_WAITING when the user clicks Reload, so the running
     version is never swapped out mid-race. Bump CACHE to drop the old cache + force a
     fresh precache. Keep ASSETS in sync. */
var CACHE = "crono-v85";
var ASSETS = [
  "./",
  "index.html",
  "app.html",
  "bibs.html",
  "terms.html",
  "privacy.html",
  "favicon.svg",
  "manifest.webmanifest",
  "assets/theme.css",
  "assets/app.css",
  "assets/site.css",
  "assets/bibs.css",
  "assets/legal.css",
  "assets/toolbar.css",
  "assets/app.js",
  "assets/helpers.js",
  "assets/i18n.js",
  "assets/head.js",
  "assets/site.js",
  "assets/bibs.js",
  "assets/coffee.css",
  "assets/coffee.js",
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

  if (isPage) {
    // Network-first for HTML so deploys show up immediately when online. Revalidate
    // against the server ("no-cache") so GitHub Pages' max-age=600 can't hand back a
    // stale page right after a deploy.
    e.respondWith(
      fetch(req, { cache: "no-cache" }).then(function (res) {
        if (res && res.ok) { var c = res.clone(); caches.open(CACHE).then(function (cc) { cc.put(req, c); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("app.html") || caches.match("index.html"); });
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate — serve cache instantly, refresh it in the background.
  // The revalidation MUST bypass the HTTP cache ("no-cache"): otherwise GitHub Pages'
  // max-age=600 returns the OLD asset, we re-store that stale copy, and a deploy never
  // propagates to returning users (the new code only arrives via the precache, i.e. only
  // once a new worker activates). Validating with the server (304 when unchanged) fixes that.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req, { cache: "no-cache" }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
