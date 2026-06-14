/* Crono — first-run quick tour (in-house, zero-dep, CSP-safe).
   Spotlights a few key controls once (crono.tour), re-runnable from any [data-tour-start]
   control. i18n via CronoI18n, reduced-motion aware. No external plugin, no inline markup:
   the overlay is built in JS so the strict script-src 'self' CSP is respected. */
(function () {
  "use strict";

  var H = (typeof window !== "undefined" && window.CronoH) || {};
  var I = (typeof window !== "undefined" && window.CronoI18n) || null;
  function t(key, params) { return I && I.t ? I.t(key, params) : key; }

  var KEY = "crono.tour";
  var CONSENT_KEY = H.CONSENT_KEY || "crono.consent";
  var CONSENT_VERSION = H.CONSENT_VERSION || 1;

  // Each step targets a stable, always-visible control (summaries stay visible even when
  // their <details> is collapsed). Steps whose target is missing are skipped at runtime.
  var STEPS = [
    { sel: '.setup[data-card="start"]',                  t: "tour.s1t", d: "tour.s1d" },
    { sel: ".capture-panel",                             t: "tour.s2t", d: "tour.s2d" },
    { sel: "#rankingTabs",                               t: "tour.s3t", d: "tour.s3d" },
    { sel: '.setup[data-card="options"] .setup-summary', t: "tour.s4t", d: "tour.s4d" },
    { sel: "#displayBtn",                                t: "tour.s5t", d: "tour.s5d" }
  ];

  var reduce = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var els = null;     // built overlay nodes while the tour is open
  var introEls = null; // the first-run opt-in prompt, if showing
  var steps = [];     // resolved steps (only those with a visible target)
  var idx = 0;

  // ----- State -----
  function done() { try { return localStorage.getItem(KEY) === "done"; } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(KEY, "done"); } catch (e) {} }
  function consentAccepted() {
    try { return H.consentAccepted(localStorage.getItem(CONSENT_KEY), CONSENT_VERSION); }
    catch (e) { return false; }
  }

  // ----- Build the overlay (spotlight + tooltip) -----
  function btn(cls) { var b = document.createElement("button"); b.type = "button"; b.className = cls; return b; }
  function build() {
    var catch_ = document.createElement("div"); catch_.className = "tour-catch";
    var spot = document.createElement("div"); spot.className = "tour-spot";
    var pop = document.createElement("div");
    pop.className = "tour-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true");
    var title = document.createElement("h3"); title.className = "tour-title";
    var body = document.createElement("p"); body.className = "tour-body";
    var foot = document.createElement("div"); foot.className = "tour-foot";
    var counter = document.createElement("span"); counter.className = "tour-counter";
    var spacer = document.createElement("span"); spacer.className = "tour-spacer";
    var skip = btn("tour-skip"), back = btn("tour-back"), next = btn("tour-next primary");
    foot.appendChild(counter); foot.appendChild(spacer); foot.appendChild(skip); foot.appendChild(back); foot.appendChild(next);
    pop.appendChild(title); pop.appendChild(body); pop.appendChild(foot);
    document.body.appendChild(catch_); document.body.appendChild(spot); document.body.appendChild(pop);
    skip.addEventListener("click", finish);
    back.addEventListener("click", function () { go(idx - 1); });
    next.addEventListener("click", function () { if (idx + 1 >= steps.length) finish(); else go(idx + 1); });
    return { catch_: catch_, spot: spot, pop: pop, title: title, body: body, counter: counter, back: back, skip: skip, next: next };
  }

  // ----- Position the spotlight ring + tooltip around the current target -----
  function place() {
    if (!els) return;
    var r = steps[idx].el.getBoundingClientRect();
    var pad = 6;
    var top = Math.max(8, r.top - pad), left = Math.max(8, r.left - pad);
    var w = Math.min(window.innerWidth - 16, r.width + pad * 2), h = r.height + pad * 2;
    els.spot.style.top = top + "px"; els.spot.style.left = left + "px";
    els.spot.style.width = w + "px"; els.spot.style.height = h + "px";

    var pop = els.pop;
    var ph = pop.offsetHeight || 160, pw = pop.offsetWidth || 320;
    var below = r.bottom + 12, above = r.top - 12 - ph;
    var pTop = (below + ph <= window.innerHeight - 8) ? below
             : (above >= 8 ? above : Math.max(8, (window.innerHeight - ph) / 2));
    var pLeft = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8);
    pop.style.top = pTop + "px"; pop.style.left = pLeft + "px";
  }

  function go(n) {
    idx = Math.max(0, Math.min(steps.length - 1, n));
    var step = steps[idx];
    els.title.textContent = t(step.t);
    els.body.textContent = t(step.d);
    els.counter.textContent = t("tour.stepOf", { n: idx + 1, total: steps.length });
    els.back.textContent = t("tour.back");
    els.back.style.visibility = idx === 0 ? "hidden" : "visible";
    els.skip.textContent = t("tour.skip");
    els.next.textContent = (idx + 1 >= steps.length) ? t("tour.done") : t("tour.next");
    // Scroll INSTANTLY (not smooth): a fixed-position spotlight must be placed against the
    // target's final rect. Smooth scrolling left the ring stranded mid-animation on mobile/PWA.
    try { step.el.scrollIntoView({ behavior: "auto", block: "center" }); } catch (e) {}
    place();
    requestAnimationFrame(place);
    setTimeout(place, 80);
    try { els.next.focus(); } catch (e) {}
  }

  function onKey(e) {
    if (e.key === "Escape") { finish(); }
    else if (e.key === "ArrowRight") { if (idx + 1 >= steps.length) finish(); else go(idx + 1); }
    else if (e.key === "ArrowLeft") { if (idx > 0) go(idx - 1); }
    else if (e.key === "Tab") { e.preventDefault(); try { els.next.focus(); } catch (er) {} }
  }
  function onReflow() { place(); }

  function finish() {
    markDone();
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onReflow);
    window.removeEventListener("scroll", onReflow, true);
    if (els) {
      [els.catch_, els.spot, els.pop].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
      els = null;
    }
  }

  function start() {
    if (els) return;                         // already running
    steps = [];
    STEPS.forEach(function (s) {
      var el = document.querySelector(s.sel);
      if (el && el.getClientRects().length) steps.push({ el: el, t: s.t, d: s.d });
    });
    if (!steps.length) return;
    els = build();
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    go(0);
  }

  // ----- Triggers -----
  // Re-run from any [data-tour-start] control (e.g. the "Quick start guide" button in Options).
  document.addEventListener("click", function (e) {
    var trg = e.target && e.target.closest ? e.target.closest("[data-tour-start]") : null;
    if (trg) { e.preventDefault(); start(); }
  });

  // First-run opt-in: ask before launching the tour, rather than starting it unannounced.
  function showIntro() {
    if (introEls || els) return;
    var ov = document.createElement("div"); ov.className = "tour-intro-overlay";
    var card = document.createElement("div");
    card.className = "tour-pop tour-intro"; card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true");
    var title = document.createElement("h3"); title.className = "tour-title"; title.textContent = t("tour.introTitle");
    var body = document.createElement("p"); body.className = "tour-body"; body.textContent = t("tour.introBody");
    var foot = document.createElement("div"); foot.className = "tour-foot";
    var spacer = document.createElement("span"); spacer.className = "tour-spacer";
    var no = btn("tour-skip"); no.textContent = t("tour.introNo");
    var yes = btn("tour-next primary"); yes.textContent = t("tour.introStart");
    foot.appendChild(spacer); foot.appendChild(no); foot.appendChild(yes);
    card.appendChild(title); card.appendChild(body); card.appendChild(foot);
    ov.appendChild(card); document.body.appendChild(ov);
    introEls = ov;
    function closeIntro() {
      if (introEls && introEls.parentNode) introEls.parentNode.removeChild(introEls);
      introEls = null; document.removeEventListener("keydown", introKey, true);
    }
    function introKey(e) {
      if (e.key === "Escape") { closeIntro(); markDone(); }
      else if (e.key === "Tab") { e.preventDefault(); try { yes.focus(); } catch (er) {} }
    }
    no.addEventListener("click", function () { closeIntro(); markDone(); });   // declined → don't auto-ask again
    yes.addEventListener("click", function () { closeIntro(); start(); });
    document.addEventListener("keydown", introKey, true);
    try { yes.focus(); } catch (e) {}
  }

  // Auto first-run: ask once, and only after the consent gate is satisfied.
  function maybeAuto() {
    if (done()) return;
    if (consentAccepted()) { setTimeout(showIntro, 500); return; }
    var accept = document.getElementById("consentAccept");
    if (!accept) return;
    accept.addEventListener("click", function () {
      // app.js writes consent + hides the gate on this same click; ask just after.
      setTimeout(function () { if (consentAccepted() && !done()) showIntro(); }, 500);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", maybeAuto);
  else maybeAuto();
})();
