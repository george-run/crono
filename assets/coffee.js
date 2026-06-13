/* Crono — "Buy me a coffee" explainer modal (shared by app.html + index.html).
   Clicking any [data-coffee] link opens a short modal explaining the tip is a *voluntary*
   donation (not a payment for the app) before sending the user to Revolut. Progressive
   enhancement: the links keep their href, so without JS they still open the donation page.
   CSP-safe — no inline styles/scripts (styles live in coffee.css). */
(function () {
  "use strict";
  var links = document.querySelectorAll("[data-coffee]");
  if (!links.length) return;

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
    modal.innerHTML =
      '<h2 id="coffeeTitle"><span class="coffee-ic">' + CUP + '</span>Buy me a coffee</h2>' +
      '<p>Crono is completely free — no accounts, no ads, no tracking, and every feature works offline. There’s nothing to pay for.</p>' +
      '<p>If it saved you time at a race and you’d like to say thanks, you can leave a small <strong>voluntary tip</strong>. It’s entirely optional and is <strong>not a payment for the app</strong> — it just helps cover the time spent building and maintaining it. The link opens Revolut in a new tab.</p>';

    var actions = document.createElement("div");
    actions.className = "coffee-actions";

    cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "coffee-cancel";
    cancelBtn.textContent = "Maybe later";

    goBtn = document.createElement("a");
    goBtn.className = "coffee-go";
    goBtn.href = DONATE_URL;
    goBtn.target = "_blank";
    goBtn.rel = "noopener";
    goBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M7.5 3c0 1-1 1.4-1 2.5M11 3c0 1-1 1.4-1 2.5"/></svg>Open Revolut';

    actions.appendChild(cancelBtn);
    actions.appendChild(goBtn);
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
  }

  function trapTab(e) {
    var first = cancelBtn, last = goBtn;
    if (!overlay.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    if (!overlay) build();
    lastFocus = document.activeElement;
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    goBtn.focus();
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
