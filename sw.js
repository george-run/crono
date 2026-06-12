/* Crono service worker — offline cache (cache-first). Bump CACHE to invalidate. */
var CACHE = "crono-v25";
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
  "assets/app.js",
  "assets/helpers.js",
  "assets/head.js",
  "assets/site.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // Don't fail the whole install if one asset 404s.
    return Promise.all(ASSETS.map(function (u) {
      return c.add(u).catch(function () {});
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

  // Cache-first for static assets (css/js/img).
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
    })
  );
});
