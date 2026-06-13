/* Crono — service worker registration + "new version" update toast.
   Shared by app.html and the landing (no inline script → strict CSP).
   The new worker WAITS until the user clicks "Reload"; only then do we tell it to
   take over (SKIP_WAITING) and reload the page once. It NEVER reloads on its own,
   so a deploy can't interrupt a live race. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;

  var reloading = false;          // guards against a double reload
  var userAskedToReload = false;  // only reload on controllerchange if the user asked
  var DISMISS_KEY = "crono.swDismissed";  // remembers a waiting version the user dismissed
  var UPDATED_KEY = "crono.justUpdated";  // set just before a user-asked reload → confirm after it

  function doReload() {
    if (reloading) return;
    reloading = true;
    // Leave a one-shot flag so the reloaded page can confirm the swap visibly (the app
    // looks identical between versions, so "Reload" otherwise feels like it did nothing).
    if (userAskedToReload) { try { sessionStorage.setItem(UPDATED_KEY, "1"); } catch (e) {} }
    location.reload();
  }

  // Shared toast host (landing/legal pages have none — create one on demand).
  function toastHost() {
    var host = document.getElementById("toasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "toasts";
      host.className = "toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    return host;
  }

  // A brief, auto-dismissing confirmation toast (no buttons).
  function showInfoToast(message) {
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    toastHost().appendChild(el);
    requestAnimationFrame(function () { el.classList.add("in"); });
    setTimeout(function () {
      el.classList.remove("in");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3500);
  }

  // After a user-asked reload, confirm the new version actually took over.
  function confirmUpdateIfJustReloaded() {
    var flag = null;
    try { flag = sessionStorage.getItem(UPDATED_KEY); sessionStorage.removeItem(UPDATED_KEY); } catch (e) {}
    if (flag) showInfoToast("Updated to the latest version");
  }

  // Ask a worker for its CACHE name (so we can tell one waiting version from another).
  // Resolves "" if it doesn't answer (e.g. an older worker without the handler).
  function workerVersion(worker) {
    return new Promise(function (resolve) {
      if (!worker || !("MessageChannel" in window)) { resolve(""); return; }
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v || ""); } }
      try {
        var ch = new MessageChannel();
        ch.port1.onmessage = function (ev) { finish(ev.data); };
        worker.postMessage({ type: "GET_VERSION" }, [ch.port2]);
      } catch (e) { finish(""); return; }
      setTimeout(function () { finish(""); }, 1500);
    });
  }

  function dismissedVersion() {
    try { return localStorage.getItem(DISMISS_KEY) || ""; } catch (e) { return ""; }
  }

  // Show the toast only for a waiting version the user hasn't already dismissed, so the
  // prompt doesn't reappear on every page navigation when "×" was clicked (not "Reload").
  function maybeShowToast(reg) {
    if (!reg.waiting || !navigator.serviceWorker.controller) return;
    workerVersion(reg.waiting).then(function (v) {
      if (v && v === dismissedVersion()) return;
      showUpdateToast(reg, v);
    });
  }

  // The new worker takes control only after we post SKIP_WAITING (below). Reload
  // once when that happens — but never for a first-ever install or a background
  // activation in another tab (guarded by userAskedToReload).
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (userAskedToReload) doReload();
  });

  window.addEventListener("load", function () {
    confirmUpdateIfJustReloaded();
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      // An update may have finished installing on a previous visit and be waiting.
      maybeShowToast(reg);

      reg.addEventListener("updatefound", function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", function () {
          // "installed" + an existing controller = an update, not the first install.
          if (nw.state === "installed" && navigator.serviceWorker.controller) maybeShowToast(reg);
        });
      });

      // Long-lived tab: re-check for an update when it regains focus (throttled to
      // once a minute). Surfaces the toast without a manual refresh; offline checks
      // fail quietly and it still never reloads on its own.
      var lastCheck = Date.now();
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible") return;
        var now = Date.now();
        if (now - lastCheck < 60000) return;
        lastCheck = now;
        reg.update().catch(function () {});
      });
    }).catch(function () {});
  });

  function showUpdateToast(reg, version) {
    if (document.getElementById("swUpdateToast")) return;
    var host = toastHost();
    var el = document.createElement("div");
    el.id = "swUpdateToast";
    el.className = "toast toast-update in";
    el.setAttribute("role", "status");

    var span = document.createElement("span");
    span.textContent = "A new version of Crono is available";

    var reload = document.createElement("button");
    reload.type = "button";
    reload.className = "toast-reload";
    reload.textContent = "Reload";
    reload.addEventListener("click", function () {
      userAskedToReload = true;
      var waiting = reg.waiting;
      if (waiting) {
        // Ask the waiting worker to activate; controllerchange then reloads us.
        waiting.postMessage({ type: "SKIP_WAITING" });
        setTimeout(doReload, 2000);   // fallback if controllerchange doesn't fire
      } else {
        doReload();
      }
    });

    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "toast-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", function () {
      // Remember this version so the toast doesn't reappear on every navigation; a
      // genuinely newer deploy (different CACHE) will still surface a fresh prompt.
      try { if (version) localStorage.setItem(DISMISS_KEY, version); } catch (e) {}
      el.classList.remove("in");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    });

    el.appendChild(span);
    el.appendChild(reload);
    el.appendChild(dismiss);
    host.appendChild(el);
  }
})();
