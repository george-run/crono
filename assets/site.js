/* Crono landing — light interactions: year, scroll-reveal, live demo clock.
   All motion is gated by prefers-reduced-motion (see the <head> js-anim toggle). */
(function () {
  "use strict";

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  var reduce = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (reduce) return; // js-anim wasn't added; leave everything static & visible

  // Reveal blocks as they scroll into view.
  var targets = document.querySelectorAll(
    ".hero-copy,.hero-art,.section-head,.features,.steps-grid,.faq-list,.cta-band"
  );
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  } else {
    Array.prototype.forEach.call(targets, function (t) { t.classList.add("is-in"); });
  }

  // Hero scene: the pin rides the route and the result card trails just behind it
  // (instead of bobbing in place), so the card reads as "following the runner".
  // We drive both in JS off the same path so they stay in sync; the SVG uses the
  // default preserveAspectRatio (xMidYMid meet) and height:auto, so the scale is
  // uniform and an SVG point maps cleanly to a pixel offset inside .hero-art.
  var scene = document.getElementById("heroScene");
  var heroPath = document.getElementById("heroPath");
  var pinG = scene && scene.querySelector(".map-pin");
  var card = document.querySelector(".float-card");
  var heroArt = document.querySelector(".hero-art");
  if (scene && heroPath && pinG && card && heroArt && heroPath.getTotalLength) {
    // The pin used a SMIL animateMotion; drop it so JS drives the pin in lock-step with the card.
    var smil = pinG.querySelector("animateMotion");
    if (smil && smil.parentNode) smil.parentNode.removeChild(smil);

    var PATH_LEN = heroPath.getTotalLength();
    var LOOP = 6200, TRAIL = 0.16;          // card sits 16% of the loop behind the pin
    var bb = heroPath.getBBox();            // route bounds, in viewBox units
    var bcx = bb.x + bb.width / 2, bcy = bb.y + bb.height / 2;
    var ampX = bb.width / 2, ampY = bb.height / 2;
    var scale, sceneX, sceneY, sceneW, sceneH, cardW, cardH;

    function measureHero() {
      var s = scene.getBoundingClientRect(), a = heroArt.getBoundingClientRect();
      sceneX = s.left - a.left; sceneY = s.top - a.top; sceneW = s.width; sceneH = s.height;
      // uniform scale (default preserveAspectRatio + height:auto), so one factor maps both axes
      scale = s.width / 460;
      cardW = card.offsetWidth; cardH = card.offsetHeight;
    }
    card.classList.add("chasing");          // compacts the card (smaller on mobile) — see site.css
    measureHero();
    window.addEventListener("resize", measureHero);

    var heroStart = null;
    function heroTick(ts) {
      if (heroStart == null) heroStart = ts;
      var t = ((ts - heroStart) % LOOP) / LOOP;
      var ct = (t - TRAIL + 1) % 1;
      var pPin = heroPath.getPointAtLength(t * PATH_LEN);
      var pCard = heroPath.getPointAtLength(ct * PATH_LEN);
      // Pin rides the actual route; the card drifts from the scene centre toward the (trailing)
      // pin position, amplitude damped so the card always stays in frame on any screen size.
      pinG.setAttribute("transform", "translate(" + pPin.x.toFixed(1) + "," + pPin.y.toFixed(1) + ")");
      var halfX = Math.max(0, (sceneW - cardW) / 2), halfY = Math.max(0, (sceneH - cardH) / 2);
      var kX = ampX > 0 ? Math.min(1, halfX / (ampX * scale)) : 0;
      var kY = ampY > 0 ? Math.min(1, halfY / (ampY * scale)) : 0;
      var ccx = sceneX + sceneW / 2 + (pCard.x - bcx) * scale * kX;
      var ccy = sceneY + sceneH / 2 + (pCard.y - bcy) * scale * kY;
      card.style.right = "auto"; card.style.bottom = "auto"; card.style.left = "0"; card.style.top = "0";
      card.style.transform = "translate(" + (ccx - cardW / 2).toFixed(1) + "px," + (ccy - cardH / 2).toFixed(1) + "px)";
      requestAnimationFrame(heroTick);
    }
    requestAnimationFrame(heroTick);
  }

  // Live stopwatch in the hero result card — conveys "live timing".
  var clock = document.getElementById("demoClock");
  if (clock) {
    var t0 = Date.now();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    setInterval(function () {
      var ms = (Date.now() - t0) % (60 * 60 * 1000);
      var cs = Math.floor(ms / 10) % 100;
      var s = Math.floor(ms / 1000) % 60;
      var m = Math.floor(ms / 60000);
      clock.textContent = pad(m) + ":" + pad(s) + "." + pad(cs);
    }, 70);
  }

  // "How it works" demo: fill the start time + distance, then type a bib, hit
  // Record and a finisher appears — on loop.
  var demoNum = document.getElementById("demoNum");
  var demoList = document.getElementById("demoList");
  var demoRec = document.querySelector(".demo-rec");
  var demoStart = document.getElementById("demoStart");
  var demoDist = document.getElementById("demoDist");
  var demoStartField = document.getElementById("demoStartField");
  var demoDistField = document.getElementById("demoDistField");
  if (demoNum && demoList && demoRec) {
    var DEMO = [
      { n: "247", t: "24:31" }, { n: "183", t: "25:08" },
      { n: "92", t: "25:46" }, { n: "311", t: "26:20" }
    ];
    var di, recorded;

    function demoReset() {
      demoList.innerHTML = ""; demoNum.textContent = "0";
      di = 0; recorded = 0;
      fillSetup();
    }
    // Show the start time then the distance being entered before the timing starts.
    function fillSetup() {
      if (demoStart) demoStart.textContent = "--:--:--";
      if (demoDist) demoDist.textContent = "—";
      if (demoStartField) demoStartField.classList.remove("set");
      if (demoDistField) demoDistField.classList.remove("set");
      setTimeout(function () {
        if (demoStart) demoStart.textContent = "10:00:00";
        if (demoStartField) demoStartField.classList.add("set", "just-set");
        setTimeout(function () {
          if (demoStartField) demoStartField.classList.remove("just-set");
          if (demoDist) demoDist.textContent = "5 km";
          if (demoDistField) demoDistField.classList.add("set", "just-set");
          setTimeout(function () {
            if (demoDistField) demoDistField.classList.remove("just-set");
            setTimeout(demoType, 600);
          }, 650);
        }, 750);
      }, 650);
    }
    function demoType() {
      if (di >= DEMO.length) { setTimeout(demoReset, 2400); return; }
      var num = DEMO[di].n;
      (function typeDigit(k) {
        if (k > num.length) { setTimeout(demoRecord, 480); return; }
        demoNum.textContent = num.slice(0, k);
        setTimeout(function () { typeDigit(k + 1); }, 240);
      })(1);
    }
    function demoRecord() {
      demoRec.classList.add("on");
      setTimeout(function () { demoRec.classList.remove("on"); }, 260);
      recorded += 1;
      var d = DEMO[di];
      var li = document.createElement("li");
      li.className = "demo-li in0";
      li.innerHTML = '<span class="demo-pl">' + recorded + '</span>' +
        '<span class="demo-bib">#' + d.n + '</span>' +
        '<span class="demo-t">' + d.t + '</span>';
      demoList.insertBefore(li, demoList.firstChild);
      requestAnimationFrame(function () { li.classList.remove("in0"); });
      demoNum.textContent = "0";
      di += 1;
      setTimeout(demoType, 1100);
    }
    demoReset();
  }
})();

// ----- Bib number generator (standalone; runs regardless of reduced-motion) -----
(function () {
  "use strict";

  var modal = document.getElementById("bibModal");
  var openBtns = document.querySelectorAll("[data-bib-open]");
  if (!modal || !openBtns.length) return;

  var H = (typeof window !== "undefined" && window.CronoH) || {};
  var MAX = 2000;                 // guard against a runaway print job
  var logoData = "";              // data URL of the uploaded logo (kept in memory only)
  var lastFocus = null;

  var $ = function (id) { return document.getElementById(id); };
  var elEvent = $("bibEvent"), elDate = $("bibDate"),
      elFrom = $("bibFrom"), elTo = $("bibTo"), elTheme = $("bibTheme"),
      elLogo = $("bibLogo"), elLogoClear = $("bibLogoClear"),
      elCount = $("bibCount"), elGen = $("bibGenerate"),
      elClose = $("bibClose"), elCancel = $("bibCancel"),
      printArea = $("printArea");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Validate the current range and reflect it in the count line + Generate button.
  function currentRange() {
    return H.bibRange ? H.bibRange(elFrom.value.trim(), elTo.value.trim(), MAX) : null;
  }
  function updateCount() {
    var nums = currentRange();
    if (!nums) {
      elCount.textContent = "Enter a valid range — whole numbers, from ≤ to, up to " + MAX + " bibs.";
      elCount.classList.add("err");
      elGen.disabled = true;
      return;
    }
    var pages = Math.ceil(nums.length / 2);
    elCount.textContent = nums.length + " bib" + (nums.length === 1 ? "" : "s") +
      " · " + pages + " page" + (pages === 1 ? "" : "s") + " (2 per A4).";
    elCount.classList.remove("err");
    elGen.disabled = false;
  }

  function readLogo(file) {
    if (!file || !/^image\//.test(file.type)) { logoData = ""; elLogoClear.hidden = true; return; }
    var fr = new FileReader();
    fr.onload = function () { logoData = String(fr.result || ""); elLogoClear.hidden = !logoData; };
    fr.onerror = function () { logoData = ""; elLogoClear.hidden = true; };
    fr.readAsDataURL(file);
  }
  function clearLogo() { logoData = ""; elLogo.value = ""; elLogoClear.hidden = true; }

  function focusables() {
    return modal.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }
  function onKeydown(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    lastFocus = document.activeElement;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    updateCount();
    setTimeout(function () { elEvent.focus(); }, 0);
  }
  function close() {
    modal.classList.remove("show");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function generate() {
    var nums = currentRange();
    if (!nums) { updateCount(); return; }
    var name = elEvent.value.trim(), date = elDate.value.trim();
    var hasHead = name || date || logoData;

    var head = !hasHead ? "" :
      '<div class="bib-head">' +
        (logoData ? '<img class="bib-logo" src="' + logoData + '" alt="">' : "") +
        '<div class="bib-ev">' +
          (name ? '<span class="bib-name">' + esc(name) + "</span>" : "") +
          (date ? '<span class="bib-date">' + esc(date) + "</span>" : "") +
        "</div>" +
      "</div>";

    var cards = nums.map(function (n) {
      return '<div class="bib-card">' + head + '<div class="bib-no">' + n + "</div></div>";
    }).join("");

    printArea.className = "bib theme-" + elTheme.value;
    printArea.innerHTML = cards;
    close();
    // Let layout settle (and the logo data URL decode) before opening the print dialog.
    setTimeout(function () { window.print(); }, 120);
  }

  Array.prototype.forEach.call(openBtns, function (b) { b.addEventListener("click", open); });
  elClose.addEventListener("click", close);
  elCancel.addEventListener("click", close);
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  elFrom.addEventListener("input", updateCount);
  elTo.addEventListener("input", updateCount);
  elLogo.addEventListener("change", function () { readLogo(elLogo.files && elLogo.files[0]); });
  elLogoClear.addEventListener("click", clearLogo);
  elGen.addEventListener("click", generate);
})();

// ----- One-click PWA install (Android / desktop Chromium); iOS uses the on-page steps -----
(function () {
  "use strict";
  var btn = document.getElementById("installBtn");
  if (!btn) return;
  var deferred = null;

  function isStandalone() {
    try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
    catch (e) { return false; }
  }

  // Chromium fires this when the app is installable; stash it and reveal the button.
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    if (!isStandalone()) btn.hidden = false;
  });

  btn.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
  });

  // Once installed, drop the prompt and hide the button.
  window.addEventListener("appinstalled", function () { deferred = null; btn.hidden = true; });
})();

// ----- Cookie / privacy consent banner (non-blocking; shares state with the app gate) -----
(function () {
  "use strict";
  var H = (typeof window !== "undefined" && window.CronoH) || {};
  var banner = document.getElementById("cookieBanner");
  var accept = document.getElementById("cookieAccept");
  if (!banner || !accept) return;
  var KEY = H.CONSENT_KEY || "crono.consent";
  var VERSION = H.CONSENT_VERSION || 1;

  function accepted() {
    try { return H.consentAccepted(localStorage.getItem(KEY), VERSION); }
    catch (e) { return false; }
  }
  // Show only if consent hasn't been recorded yet (here or in the app — same key).
  if (!accepted()) banner.classList.add("show");

  accept.addEventListener("click", function () {
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, at: Date.now() })); } catch (e) {}
    banner.classList.remove("show");
  });
})();

// Service worker registration + update toast live in assets/sw-register.js (shared with the app).

