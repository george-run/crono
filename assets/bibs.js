/* Crono — race bib-number generator (standalone page).
   Zero-dependency; uses CronoH.bibRange. Prints 2 bibs per A4 page via
   #printArea + @media print (see bibs.css). Logo can be an uploaded file
   (kept on-device as a data URL) OR an https link (loaded from the web). */
(function () {
  "use strict";

  var H = (typeof window !== "undefined" && window.CronoH) || {};
  var MAX = 2000;                         // guard against a runaway print job
  var ORANGE = "#ea580c";

  var $ = function (id) { return document.getElementById(id); };
  var elEvent = $("bibEvent"), elRace = $("bibRace"), elDate = $("bibDate"),
      elFrom = $("bibFrom"), elTo = $("bibTo"),
      elColor = $("bibColor"), elPresets = $("bibPresets"),
      elLogo = $("bibLogo"), elLogoUrl = $("bibLogoUrl"), elLogoClear = $("bibLogoClear"),
      elCount = $("bibCount"), elGen = $("bibGenerate"), printArea = $("printArea");
  var pv = $("bibPreview"), pvHead = $("bibPvHead"), pvLogo = $("bibPvLogo"),
      pvName = $("bibPvName"), pvRace = $("bibPvRace"), pvDate = $("bibPvDate"), pvNo = $("bibPvNo");

  if (!elGen || !pv) return;

  var color = ORANGE;          // current bib colour (preset or custom)
  var logoData = "";           // uploaded logo as a data URL (kept on-device)

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // Pick black or white text for legibility on a given background colour.
  function textOn(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "#ffffff";
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#111111" : "#ffffff";
  }
  function currentRange() {
    return H.bibRange ? H.bibRange(elFrom.value.trim(), elTo.value.trim(), MAX) : null;
  }
  // An https logo link wins over an uploaded file.
  function logoSrc() {
    var u = elLogoUrl ? elLogoUrl.value.trim() : "";
    if (u && /^https:\/\//i.test(u)) return u;
    return logoData;
  }

  function updateCount() {
    var nums = currentRange();
    if (!nums) {
      elCount.textContent = "Enter a valid range — whole numbers, from ≤ to, up to " + MAX + " bibs.";
      elCount.classList.add("err"); elGen.disabled = true; return;
    }
    var pages = Math.ceil(nums.length / 2);
    elCount.textContent = nums.length + " bib" + (nums.length === 1 ? "" : "s") +
      " · " + pages + " page" + (pages === 1 ? "" : "s") + " (2 per A4).";
    elCount.classList.remove("err"); elGen.disabled = false;
  }

  function setColor(c, fromPicker) {
    color = c;
    if (elColor && !fromPicker) elColor.value = c;
    if (elPresets) Array.prototype.forEach.call(elPresets.querySelectorAll(".bib-sw"), function (b) {
      var on = (b.getAttribute("data-color") || "").toLowerCase() === c.toLowerCase();
      b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderPreview();
  }

  function renderPreview() {
    pv.style.setProperty("--bibc", color);
    pv.style.setProperty("--bibtext", textOn(color));
    var name = elEvent.value.trim(), race = elRace.value.trim(), date = elDate.value.trim(), src = logoSrc();
    if (pvHead) pvHead.hidden = !(name || race || date || src);
    if (pvName) { pvName.textContent = name; pvName.hidden = !name; }
    if (pvRace) { pvRace.textContent = race; pvRace.hidden = !race; }
    if (pvDate) { pvDate.textContent = date; pvDate.hidden = !date; }
    if (pvLogo) { if (src) { pvLogo.src = src; pvLogo.hidden = false; } else { pvLogo.removeAttribute("src"); pvLogo.hidden = true; } }
    var from = parseInt(elFrom.value, 10);
    if (pvNo) pvNo.textContent = (from >= 0 && from < 1e7) ? String(from) : "1";
  }

  function readLogo(file) {
    if (!file || !/^image\//.test(file.type)) { logoData = ""; elLogoClear.hidden = true; renderPreview(); return; }
    var fr = new FileReader();
    fr.onload = function () { logoData = String(fr.result || ""); elLogoClear.hidden = !logoData; if (elLogoUrl) elLogoUrl.value = ""; renderPreview(); };
    fr.onerror = function () { logoData = ""; elLogoClear.hidden = true; renderPreview(); };
    fr.readAsDataURL(file);
  }
  function clearLogo() { logoData = ""; if (elLogo) elLogo.value = ""; elLogoClear.hidden = true; renderPreview(); }

  function buildAndPrint(src) {
    var nums = currentRange(); if (!nums) { updateCount(); return; }
    var name = elEvent.value.trim(), race = elRace.value.trim(), date = elDate.value.trim();
    var hasHead = name || race || date || src;
    var head = !hasHead ? "" :
      '<div class="bib-head">' +
        (src ? '<img class="bib-logo" src="' + esc(src) + '" alt="">' : "") +
        '<div class="bib-ev">' +
          (name ? '<span class="bib-name">' + esc(name) + "</span>" : "") +
          (race ? '<span class="bib-race">' + esc(race) + "</span>" : "") +
          (date ? '<span class="bib-date">' + esc(date) + "</span>" : "") +
        "</div></div>";
    var cards = nums.map(function (n) {
      return '<div class="bib-card">' + head + '<div class="bib-no">' + n + "</div></div>";
    }).join("");
    printArea.style.setProperty("--bibc", color);
    printArea.style.setProperty("--bibtext", textOn(color));
    printArea.innerHTML = cards;
    // Let layout settle (and a data-URL logo decode) before opening the print dialog.
    setTimeout(function () { window.print(); }, 120);
  }

  function generate() {
    var nums = currentRange(); if (!nums) { updateCount(); return; }
    var src = logoSrc();
    if (src && /^https:\/\//i.test(src)) {
      // Preload the remote logo so it's actually present in the printout.
      var img = new Image();
      img.onload = function () { buildAndPrint(src); };
      img.onerror = function () { buildAndPrint(""); };  // skip a logo that failed to load
      img.src = src;
    } else {
      buildAndPrint(src);
    }
  }

  // ----- wire up -----
  elEvent.addEventListener("input", renderPreview);
  elRace.addEventListener("input", renderPreview);
  elDate.addEventListener("input", renderPreview);
  elFrom.addEventListener("input", function () { updateCount(); renderPreview(); });
  elTo.addEventListener("input", updateCount);
  if (elPresets) elPresets.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".bib-sw");
    if (b) setColor(b.getAttribute("data-color"), false);
  });
  if (elColor) elColor.addEventListener("input", function () { setColor(this.value, true); });
  if (elLogo) elLogo.addEventListener("change", function () { readLogo(elLogo.files && elLogo.files[0]); });
  if (elLogoUrl) elLogoUrl.addEventListener("input", function () {
    if (this.value.trim()) { logoData = ""; if (elLogo) elLogo.value = ""; elLogoClear.hidden = true; }
    renderPreview();
  });
  if (elLogoClear) elLogoClear.addEventListener("click", clearLogo);
  elGen.addEventListener("click", generate);

  // ----- init -----
  setColor(ORANGE, false);
  updateCount();
  renderPreview();
})();
