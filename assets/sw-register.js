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

  function doReload() {
    if (reloading) return;
    reloading = true;
    location.reload();
  }

  // The new worker takes control only after we post SKIP_WAITING (below). Reload
  // once when that happens — but never for a first-ever install or a background
  // activation in another tab (guarded by userAskedToReload).
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (userAskedToReload) doReload();
  });

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      // An update may have finished installing on a previous visit and be waiting.
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg);

      reg.addEventListener("updatefound", function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", function () {
          // "installed" + an existing controller = an update, not the first install.
          if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateToast(reg);
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

  function showUpdateToast(reg) {
    if (document.getElementById("swUpdateToast")) return;
    var host = document.getElementById("toasts");
    if (!host) { // landing/legal pages have no toast host — create one
      host = document.createElement("div");
      host.id = "toasts";
      host.className = "toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
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
      el.classList.remove("in");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    });

    el.appendChild(span);
    el.appendChild(reload);
    el.appendChild(dismiss);
    host.appendChild(el);
  }
})();
