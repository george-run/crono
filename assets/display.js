/* Crono — live results display (read-only mirror for a second screen / projector).
   Reads the timer's data straight from localStorage (same origin), so it needs NO
   network: the browser fires a `storage` event in this tab whenever the app tab
   writes, and we re-render. A big "time since start" clock ticks, ranking tabs filter,
   and a long leaderboard auto-scrolls (only when motion is allowed). */
(function () {
  "use strict";

  var H = (typeof CronoH !== "undefined") ? CronoH : {};
  var formatElapsed = H.formatElapsed, formatClockElapsed = H.formatClockElapsed,
      formatPace = H.formatPace, computePlaces = H.computePlaces, categoryOf = H.category;
  var t = (typeof CronoI18n !== "undefined") ? CronoI18n.t : function (k) { return k; };

  var KEY_START = "crono.startEpoch", KEY_ENTRIES = "crono.entries",
      KEY_PARTICIPANTS = "crono.participants", KEY_DISTANCE = "crono.distanceKm";

  var $clock = document.getElementById("dispClock");
  var $tabs = document.getElementById("rankingTabs");
  var $body = document.getElementById("dispBody");
  var $empty = document.getElementById("dispEmpty");
  var $table = document.getElementById("dispTable");
  var $fs = document.getElementById("dispFs");

  var state = { startEpoch: null, entries: [], participants: {}, distanceKm: null };
  var currentFilter = "all";

  // ----- Read state from localStorage (defensive: never throw) ----------------
  function readState() {
    var s = { startEpoch: null, entries: [], participants: {}, distanceKm: null };
    try { var se = parseInt(localStorage.getItem(KEY_START), 10); if (!isNaN(se)) s.startEpoch = se; } catch (e) {}
    try { var en = JSON.parse(localStorage.getItem(KEY_ENTRIES) || "[]"); if (Array.isArray(en)) s.entries = en; } catch (e) {}
    try { var pp = JSON.parse(localStorage.getItem(KEY_PARTICIPANTS) || "{}"); if (pp && typeof pp === "object") s.participants = pp; } catch (e) {}
    try { var d = localStorage.getItem(KEY_DISTANCE); s.distanceKm = d ? parseFloat(d) : null; if (isNaN(s.distanceKm)) s.distanceKm = null; } catch (e) {}
    return s;
  }

  function raceYear() { return state.startEpoch ? new Date(state.startEpoch).getFullYear() : new Date().getFullYear(); }
  function participantName(num) { var p = state.participants[num]; return p ? (p.name || "") : ""; }
  function categoryForEntry(e) { return categoryOf(state.participants[e.runnerNumber], raceYear()); }
  function longCat(c) { return (c.sex === "M" ? t("tab.men") : t("tab.women")) + " " + c.range; }

  function matchesFilter(e, filter) {
    if (filter === "all") return true;
    var p = state.participants[e.runnerNumber];
    if (filter === "M" || filter === "F") return !!p && p.sex === filter;
    var c = categoryForEntry(e);
    return !!c && c.key === filter;
  }

  // ----- Tabs (All / Men / Women + categories present) ------------------------
  function buildTabs() {
    var opts = [
      { value: "all", label: t("tab.all") },
      { value: "M", label: t("tab.men") },
      { value: "F", label: t("tab.women") }
    ];
    var seen = {};
    Object.keys(state.participants).forEach(function (num) {
      var c = categoryOf(state.participants[num], raceYear());
      if (c && !seen[c.key]) seen[c.key] = longCat(c);
    });
    Object.keys(seen).sort().forEach(function (key) { opts.push({ value: key, label: seen[key] }); });
    if (!opts.some(function (o) { return o.value === currentFilter; })) currentFilter = "all";

    $tabs.innerHTML = "";
    opts.forEach(function (o) {
      var active = o.value === currentFilter;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (active ? " active" : "");
      b.setAttribute("data-value", o.value);
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", active ? "true" : "false");
      b.textContent = o.label;
      $tabs.appendChild(b);
    });
  }

  // ----- Escape helpers (we build rows as text, never raw HTML) ---------------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  // ----- Render the leaderboard -----------------------------------------------
  function render() {
    if (!$body) return;
    var filtered = state.entries.filter(function (e) { return matchesFilter(e, currentFilter); });
    var places = computePlaces(filtered);
    // Leaderboard order: fastest first (rank 1 on top).
    filtered.sort(function (a, b) { return a.finishEpoch - b.finishEpoch; });

    var showCat = (currentFilter === "all" || currentFilter === "M" || currentFilter === "F");
    var rows = filtered.map(function (e) {
      var elapsed = (state.startEpoch != null) ? (e.finishEpoch - state.startEpoch) : null;
      var name = participantName(e.runnerNumber);
      var catTag = "";
      if (showCat) { var c = categoryForEntry(e); if (c) catTag = '<span class="dt-cat">' + esc(c.shortLabel) + "</span>"; }
      var nameCell = esc(name);
      if (catTag) nameCell += (name ? " " : "") + catTag;
      if (!nameCell) nameCell = '<span class="dt-dash">—</span>';
      var pace = formatPace(elapsed, state.distanceKm);
      return "<tr>" +
        '<td class="dt-place">' + places[e.id] + "</td>" +
        '<td class="dt-num">' + esc(e.runnerNumber) + "</td>" +
        '<td class="dt-name">' + nameCell + "</td>" +
        '<td class="dt-time">' + formatElapsed(elapsed) + "</td>" +
        '<td class="dt-pace">' + (pace || '<span class="dt-dash">—</span>') + "</td>" +
        "</tr>";
    }).join("");

    $body.innerHTML = rows;
    var has = filtered.length > 0;
    if ($empty) $empty.style.display = has ? "none" : "";
    if ($table) $table.style.display = has ? "" : "none";
    scheduleAutoScroll();
  }

  // ----- Live "time since start" clock ----------------------------------------
  function tickClock() {
    if (!$clock) return;
    $clock.textContent = (state.startEpoch != null)
      ? formatClockElapsed(Date.now() - state.startEpoch)
      : "--:--:--";
  }

  // ----- Auto-scroll a long leaderboard (gentle, pauses at the ends) ----------
  var scrollRaf = null, scrollDir = 1, pausedUntil = 0;
  function stopAutoScroll() { if (scrollRaf) cancelAnimationFrame(scrollRaf); scrollRaf = null; }
  function scheduleAutoScroll() {
    stopAutoScroll();
    if (!document.documentElement.classList.contains("js-anim")) return;
    pausedUntil = Date.now() + 2500;
    scrollDir = 1;
    function step() {
      var overflow = document.body.scrollHeight - window.innerHeight;
      if (overflow > 40 && Date.now() >= pausedUntil) {
        var y = window.scrollY + scrollDir * 0.4;
        if (y <= 0) { y = 0; scrollDir = 1; pausedUntil = Date.now() + 2500; }
        else if (y >= overflow) { y = overflow; scrollDir = -1; pausedUntil = Date.now() + 2500; }
        window.scrollTo(0, y);
      }
      scrollRaf = requestAnimationFrame(step);
    }
    scrollRaf = requestAnimationFrame(step);
  }

  // ----- Refresh everything from storage --------------------------------------
  function refresh() { state = readState(); buildTabs(); render(); tickClock(); }

  // ----- Wire up --------------------------------------------------------------
  $tabs.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest(".tab") : null;
    if (!b) return;
    currentFilter = b.getAttribute("data-value");
    buildTabs(); render();
  });

  // Live updates: the app tab writes localStorage → the browser fires this here.
  window.addEventListener("storage", function (ev) {
    if (!ev.key || ev.key.indexOf("crono.") === 0) refresh();
  });
  // Safety net: re-read on refocus and a slow poll (storage events only fire cross-tab).
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(); });
  setInterval(refresh, 4000);
  setInterval(tickClock, 200);
  window.addEventListener("resize", scheduleAutoScroll);
  window.addEventListener("crono:langchange", function () { buildTabs(); render(); });

  if ($fs) {
    $fs.addEventListener("click", function () {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      } catch (e) {}
    });
  }

  refresh();
})();
