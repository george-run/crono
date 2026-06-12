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

  // Start the hero scene's moving runner (SMIL motion along the route).
  var scene = document.getElementById("heroScene");
  if (scene) {
    var motions = scene.querySelectorAll("animateMotion");
    Array.prototype.forEach.call(motions, function (m) { try { m.beginElement(); } catch (e) {} });
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

  // "How it works" demo: type a bib, hit Record, a finisher appears — on loop.
  var demoNum = document.getElementById("demoNum");
  var demoList = document.getElementById("demoList");
  var demoRec = document.querySelector(".demo-rec");
  if (demoNum && demoList && demoRec) {
    var DEMO = [
      { n: "247", t: "24:31" }, { n: "183", t: "25:08" },
      { n: "92", t: "25:46" }, { n: "311", t: "26:20" }
    ];
    var di, recorded;

    function demoReset() {
      demoList.innerHTML = ""; demoNum.textContent = "0";
      di = 0; recorded = 0;
      setTimeout(demoType, 900);
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

// Register the service worker (kept here so the page needs no inline script → strict CSP).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}

