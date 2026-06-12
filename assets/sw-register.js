/* Crono — service worker registration + "new version" update toast.
   Shared by app.html and the landing (no inline script → strict CSP). On update it shows a
   dismissible toast; it NEVER auto-reloads (that could interrupt a live race). */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      reg.addEventListener("updatefound", function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", function () {
          // "installed" + an existing controller = an update, not the first install.
          if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateToast();
        });
      });
    }).catch(function () {});
  });

  function showUpdateToast() {
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
    span.textContent = "New version available";

    var reload = document.createElement("button");
    reload.type = "button";
    reload.className = "toast-reload";
    reload.textContent = "Reload";
    reload.addEventListener("click", function () { location.reload(); });

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
