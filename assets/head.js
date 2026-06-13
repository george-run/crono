/* Runs in <head> before first paint:
   1) Theme — apply the saved light/dark choice (or the OS preference) by setting
      data-theme on <html>, so there's no flash of the wrong theme. Any element with
      [data-theme-toggle] flips + persists the choice (wired on DOMContentLoaded).
   2) Motion — enable animations only when the user hasn't requested reduced motion. */
(function () {
  "use strict";
  var root = document.documentElement;
  var THEME_KEY = "crono.theme";

  function osTheme() {
    try { return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
    catch (e) { return "dark"; }
  }
  function saved() {
    var v; try { v = localStorage.getItem(THEME_KEY); } catch (e) {}
    return (v === "light" || v === "dark") ? v : null;
  }
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", theme === "light" ? "#f6f8fa" : "#0b0f14");
  }

  apply(saved() || osTheme());   // before paint → no flash

  function label(theme) { return theme === "light" ? "Switch to dark theme" : "Switch to light theme"; }
  function syncButtons(theme) {
    var btns = document.querySelectorAll("[data-theme-toggle]"), i;
    for (i = 0; i < btns.length; i++) { btns[i].setAttribute("aria-label", label(theme)); btns[i].setAttribute("title", label(theme)); }
  }
  function onReady() {
    syncButtons(root.getAttribute("data-theme"));
    var btns = document.querySelectorAll("[data-theme-toggle]"), i;
    for (i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        apply(next); syncButtons(next);
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();

  // Follow the OS live only while the user hasn't made an explicit choice.
  try {
    matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
      if (!saved()) { var t = e.matches ? "light" : "dark"; apply(t); syncButtons(t); }
    });
  } catch (e) {}

  // ----- Reduced motion -----
  try {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) root.classList.add("js-anim");
  } catch (e) {}
})();
