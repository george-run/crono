/* Crono — pure helpers (no DOM, no app state). UMD so it works in the browser
   (window.CronoH) and in Node tests (require). Keep these side-effect free. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CronoH = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Elapsed ms → HH:MM:SS.cc (cc = centiseconds).
  function formatElapsed(ms) {
    if (ms == null || isNaN(ms)) return "--:--:--.--";
    if (ms < 0) ms = 0;
    var totalCs = Math.floor(ms / 10), cs = totalCs % 100,
        totalSec = Math.floor(totalCs / 100), s = totalSec % 60,
        m = Math.floor(totalSec / 60) % 60, h = Math.floor(totalSec / 3600);
    return pad(h) + ":" + pad(m) + ":" + pad(s) + "." + pad(cs);
  }

  // Pace as M:SS /km, or "" when distance/time is unusable.
  function formatPace(elapsedMs, km) {
    if (!km || km <= 0 || !(elapsedMs > 0)) return "";
    var secPerKm = (elapsedMs / 1000) / km;
    var m = Math.floor(secPerKm / 60), s = Math.round(secPerKm % 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ":" + pad(s) + " /km";
  }

  // "H:MM:SS(.cc)" / "MM:SS(.cc)" / "SS(.cc)" → ms, or null.
  function parseElapsedToMs(str) {
    str = String(str).trim();
    var m = str.match(/^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:[.,](\d{1,2}))?$/);
    if (!m) return null;
    var h = m[1] ? +m[1] : 0, mi = m[2] ? +m[2] : 0, s = +m[3];
    var cs = m[4] ? +(m[4].length === 1 ? m[4] + "0" : m[4]) : 0;
    if (mi > 59 || s > 59) return null;
    return ((h * 3600 + mi * 60 + s) * 1000) + cs * 10;
  }

  // Free-form sex → "M" / "F" / "".
  function normalizeSex(v) {
    v = String(v || "").trim().toLowerCase();
    if (!v) return "";
    if (v[0] === "m" || v[0] === "b") return "M";
    if (v[0] === "f" || v[0] === "w") return "F";
    return "";
  }

  // Athletics 10-year brackets; lower bound doubles as the id.
  var AGE_BRACKETS = [0, 20, 30, 40, 50, 60];
  function bracketRange(lo) {
    var idx = AGE_BRACKETS.indexOf(lo);
    if (idx === AGE_BRACKETS.length - 1) return lo + "+";
    return lo + "–" + (AGE_BRACKETS[idx + 1] - 1);
  }

  // CSV cell: neutralise spreadsheet formula injection (=,+,-,@,tab,CR lead),
  // then quote/escape as needed.
  function csvCell(v) {
    v = String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    if (/[",\r\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }

  return {
    pad: pad,
    formatElapsed: formatElapsed,
    formatPace: formatPace,
    parseElapsedToMs: parseElapsedToMs,
    normalizeSex: normalizeSex,
    AGE_BRACKETS: AGE_BRACKETS,
    bracketRange: bracketRange,
    csvCell: csvCell
  };
});
