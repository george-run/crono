/* Crono service worker.
   - HTML pages: network-first (deploys show immediately when online; cache is the offline fallback).
   - Static assets: stale-while-revalidate (instant + offline, and the cache self-heals on the next
     load even if CACHE wasn't bumped).
   Bump CACHE to drop the old cache and force a fresh precache. Keep ASSETS in sync. */
var CACHE = "crono-v42";
var ASSETS = [
  "./",
  "index.html",
  "app.html",
  "terms.html",
  "privacy.html",
  "favicon.svg",
  "manifest.webmanifest",
  "assets/theme.css",
  "assets/app.css",
  "assets/site.css",
  "assets/legal.css",
  "assets/app.js",
  "assets/helpers.js",
  "assets/head.js",
  "assets/site.js",
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
  }).then(function () { return self.skipWaiting(); }));
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
    // Network-first for HTML so deploys show up immediately when online.
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var c = res.clone(); caches.open(CACHE).then(function (cc) { cc.put(req, c); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("app.html") || caches.match("index.html"); });
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate — serve cache instantly, refresh it in the background.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
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
