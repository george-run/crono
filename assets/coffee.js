/* Crono — "Buy me a coffee" explainer modal (shared by app.html + index.html).
   Clicking any [data-coffee] link opens a short modal explaining the tip is a *voluntary*
   donation (not a payment for the app) before sending the user to Revolut. Progressive
   enhancement: the links keep their href, so without JS they still open the donation page.
   CSP-safe — no inline styles/scripts (styles live in coffee.css). */
(function () {
  "use strict";
  var links = document.querySelectorAll("[data-coffee]");
  if (!links.length) return;

  var t = (typeof CronoI18n !== "undefined") ? CronoI18n.t : function (k) { return k; };
  var DONATE_URL = "https://revolut.me/rungeorge";
  var CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M7.5 3c0 1-1 1.4-1 2.5M11 3c0 1-1 1.4-1 2.5"/></svg>';
  var overlay = null, goBtn = null, cancelBtn = null, lastFocus = null;

  function isOpen() { return overlay && overlay.classList.contains("show"); }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "coffee-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "coffeeTitle");

    var modal = document.createElement("div");
    modal.className = "coffee-modal";
    modal.tabIndex = -1;   // focus target on open (avoids a focus ring on the CTA)
    modal.innerHTML =
      '<h2 id="coffeeTitle"><span class="coffee-ic">' + CUP + '</span><span class="coffee-title"></span></h2>' +
      '<p class="coffee-p1"></p><p class="coffee-p2"></p>';

    var actions = document.createElement("div");
    actions.className = "coffee-actions";

    cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "coffee-cancel";

    goBtn = document.createElement("a");
    goBtn.className = "coffee-go";
    goBtn.href = DONATE_URL;
    goBtn.target = "_blank";
    goBtn.rel = "noopener";
    goBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M7.5 3c0 1-1 1.4-1 2.5M11 3c0 1-1 1.4-1 2.5"/></svg><span class="coffee-go-label"></span>';

    actions.appendChild(goBtn);      // primary on top
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", close);
    goBtn.addEventListener("click", function () { setTimeout(close, 60); });   // let the new tab open, then close
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") trapTab(e);
    });
    fillText();
  }

  // (Re)apply the translated strings — at build and whenever the language changes.
  function fillText() {
    if (!overlay) return;
    overlay.querySelector(".coffee-title").textContent = t("nav.coffee");
    overlay.querySelector(".coffee-p1").textContent = t("coffee.body1");
    overlay.querySelector(".coffee-p2").textContent = t("coffee.body2");
    cancelBtn.textContent = t("coffee.cancel");
    overlay.querySelector(".coffee-go-label").textContent = t("coffee.go");
  }
  document.addEventListener("crono:langchange", function () { if (overlay) fillText(); });

  function trapTab(e) {
    var first = goBtn, last = cancelBtn;
    if (!overlay.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    if (!overlay) build();
    lastFocus = document.activeElement;
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    overlay.firstChild.focus();   // focus the modal, not a button (no coloured ring)
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function (e) { e.preventDefault(); open(); });
  }
})();
