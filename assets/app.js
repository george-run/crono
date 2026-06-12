(function () {
  "use strict";

  // ----- Storage keys -------------------------------------------------------
  var KEY_START = "crono.startEpoch";
  var KEY_ENTRIES = "crono.entries";
  var KEY_PARTICIPANTS = "crono.participants";
  var KEY_DISTANCE = "crono.distanceKm";
  var KEY_SOUND = "crono.sound";
  var KEY_CONSENT = "crono.consent";
  var CONSENT_VERSION = 1;        // bump to re-prompt if the terms change

  // ----- State --------------------------------------------------------------
  var startEpoch = null;          // absolute ms timestamp of the race start
  var entries = [];               // [{ id, runnerNumber, finishEpoch, details }]
  var participants = {};          // { "<number>": { name, sex, birthYear } }
  var distanceKm = null;          // optional race distance for pace
  var soundOn = true;             // beep on record
  var currentFilter = "all";      // active ranking filter: all | M | F | "M|30" ...
  var searchQuery = "";           // results search text
  var editingNum = null;          // bib number whose sex/year is being edited inline
  var editingNumberId = null;     // entry id whose bib number is being edited inline
  var editingTimeId = null;       // entry id whose finish time is being edited inline

  // ----- Elements -----------------------------------------------------------
  var $start = document.getElementById("startTime");
  var $startPreview = document.getElementById("startPreview");
  var $distance = document.getElementById("distanceKm");
  var $runner = document.getElementById("runnerNumber");
  var $body = document.getElementById("resultBody");
  var $empty = document.getElementById("emptyState");
  var $emptyMsg = document.getElementById("emptyMsg");
  var $statCount = document.getElementById("statCount");
  var $statParticipants = document.getElementById("statParticipants");
  var $statDup = document.getElementById("statDup");
  var $importFile = document.getElementById("importFile");
  var $restoreFile = document.getElementById("restoreFile");
  var $tabs = document.getElementById("rankingTabs");
  var $resultSearch = document.getElementById("resultSearch");
  var $soundToggle = document.getElementById("soundToggle");
  var $partModal = document.getElementById("partModal");
  var $partBody = document.getElementById("partBody");
  var $partSearch = document.getElementById("partSearch");
  var $printArea = document.getElementById("printArea");
  var $consent = document.getElementById("consent");
  var $consentCheck = document.getElementById("consentCheck");
  var $consentAccept = document.getElementById("consentAccept");
  var $docModal = document.getElementById("docModal");
  var $docTitle = document.getElementById("docTitle");
  var $docBody = document.getElementById("docBody");
  var $confirmModal = document.getElementById("confirmModal");
  var $confirmTitle = document.getElementById("confirmTitle");
  var $confirmMsg = document.getElementById("confirmMsg");
  var $confirmOk = document.getElementById("confirmOk");
  var $confirmCancel = document.getElementById("confirmCancel");

  // ----- Inline SVG icons (stroke-based, scale with text) -------------------
  var ICONS = {
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    plus: '<path d="M12 6v12"/><path d="M6 12h12"/>',
    pencil: '<path d="M14.5 5.5l4 4"/><path d="M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19z"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'
  };
  function svgIcon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  // ----- Time helpers -------------------------------------------------------

  // Format an elapsed duration in ms as HH:MM:SS.cc (cc = centiseconds).
  function formatElapsed(ms) {
    if (ms == null || isNaN(ms)) return "--:--:--.--";
    if (ms < 0) ms = 0;
    var totalCs = Math.floor(ms / 10);          // centiseconds
    var cs = totalCs % 100;
    var totalSec = Math.floor(totalCs / 100);
    var s = totalSec % 60;
    var m = Math.floor(totalSec / 60) % 60;
    var h = Math.floor(totalSec / 3600);
    return pad(h) + ":" + pad(m) + ":" + pad(s) + "." + pad(cs);
  }

  // Format an absolute epoch as a HH:MM:SS clock string.
  function formatClock(epoch) {
    var d = new Date(epoch);
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  // Pace as M:SS per km, or "" when there is no usable distance/time.
  function formatPace(elapsedMs, km) {
    if (!km || km <= 0 || !(elapsedMs > 0)) return "";
    var secPerKm = (elapsedMs / 1000) / km;
    var m = Math.floor(secPerKm / 60);
    var s = Math.round(secPerKm % 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ":" + pad(s) + " /km";
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Parse a "HH:MM:SS" (optionally ".cc") clock string into an absolute epoch.
  // Interpreted as today; if that lands in the future (e.g. a race started
  // before midnight while recording happens after), it is treated as yesterday.
  function clockStringToEpoch(str) {
    var m = String(str).trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:[.,](\d{1,2}))?$/);
    if (!m) return null;
    var h = +m[1], mi = +m[2], s = m[3] ? +m[3] : 0;
    if (h > 23 || mi > 59 || s > 59) return null;
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, s, 0);
    if (d.getTime() > now.getTime() + 1000) {
      d.setDate(d.getDate() - 1); // start was yesterday (race crossed midnight)
    }
    return d.getTime();
  }

  // ----- Persistence --------------------------------------------------------
  function save() {
    try {
      localStorage.setItem(KEY_START, String(startEpoch));
      localStorage.setItem(KEY_ENTRIES, JSON.stringify(entries));
      localStorage.setItem(KEY_PARTICIPANTS, JSON.stringify(participants));
      localStorage.setItem(KEY_DISTANCE, distanceKm == null ? "" : String(distanceKm));
      localStorage.setItem(KEY_SOUND, soundOn ? "1" : "0");
    } catch (e) {
      console.warn("Could not persist data:", e);
    }
  }

  function load() {
    if (typeof Storage === "undefined") {
      alert("Sorry — your browser has no Web Storage support, so results cannot be saved.");
      return;
    }
    var s = localStorage.getItem(KEY_START);
    startEpoch = s != null && s !== "null" ? parseInt(s, 10) : Date.now();

    try { entries = JSON.parse(localStorage.getItem(KEY_ENTRIES)) || []; }
    catch (e) { entries = []; }
    if (!Array.isArray(entries)) entries = [];

    try { participants = JSON.parse(localStorage.getItem(KEY_PARTICIPANTS)) || {}; }
    catch (e) { participants = {}; }
    if (typeof participants !== "object" || participants === null) participants = {};

    // Migrate the older "number -> name string" shape to the object shape.
    Object.keys(participants).forEach(function (num) {
      var p = participants[num];
      if (typeof p === "string") {
        participants[num] = { name: p, sex: "", birthYear: null };
      } else if (!p || typeof p !== "object") {
        participants[num] = { name: "", sex: "", birthYear: null };
      }
    });

    var d = parseFloat(localStorage.getItem(KEY_DISTANCE));
    distanceKm = (d > 0) ? d : null;

    soundOn = localStorage.getItem(KEY_SOUND) !== "0"; // default on
  }

  // ----- Sound (Web Audio beep, no file) ------------------------------------
  var audioCtx = null;
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = 1180;
      var t = audioCtx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.13);
    } catch (e) { /* ignore */ }
  }
  function updateSoundToggle() {
    $soundToggle.innerHTML = svgIcon(soundOn ? "volume" : "mute");
    $soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
    $soundToggle.title = soundOn ? "Beep on record: on" : "Beep on record: off";
    $soundToggle.classList.toggle("off", !soundOn);
  }

  // Parse an elapsed string (H:MM:SS(.cc) / MM:SS(.cc) / SS(.cc)) into ms, or null.
  function parseElapsedToMs(str) {
    str = String(str).trim();
    var m = str.match(/^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:[.,](\d{1,2}))?$/);
    if (!m) return null;
    var h = m[1] ? +m[1] : 0, mi = m[2] ? +m[2] : 0, s = +m[3];
    var cs = m[4] ? +(m[4].length === 1 ? m[4] + "0" : m[4]) : 0;
    if (mi > 59 || s > 59) return null;
    return ((h * 3600 + mi * 60 + s) * 1000) + cs * 10;
  }

  // ----- Participants & categories -----------------------------------------

  function participantName(num) { var p = participants[num]; return p ? (p.name || "") : ""; }

  // Normalize a free-form sex value to "M" / "F" / "".
  function normalizeSex(v) {
    v = String(v || "").trim().toLowerCase();
    if (!v) return "";
    if (v[0] === "m" || v[0] === "b") return "M"; // m / male / masculin / b (bărbat)
    if (v[0] === "f" || v[0] === "w") return "F"; // f / female / feminin / w
    return "";
  }

  // Athletics 10-year brackets. The bracket's lower bound doubles as its id.
  // The upper bound is one below the next bracket; the last one is open-ended.
  var AGE_BRACKETS = [0, 20, 30, 40, 50, 60];
  function bracketRange(lo) {
    var idx = AGE_BRACKETS.indexOf(lo);
    if (idx === AGE_BRACKETS.length - 1) return lo + "+";
    return lo + "–" + (AGE_BRACKETS[idx + 1] - 1);
  }

  // Compute the sex+age category for a participant, or null when data is missing.
  function ageCategory(p) {
    if (!p || !p.sex || !p.birthYear) return null;
    var raceYear = new Date(startEpoch).getFullYear();
    var age = raceYear - p.birthYear;
    if (age < 0) return null;
    var lo = AGE_BRACKETS[0];
    for (var i = 0; i < AGE_BRACKETS.length; i++) {
      if (age >= AGE_BRACKETS[i]) lo = AGE_BRACKETS[i];
    }
    var range = bracketRange(lo);
    var sexWord = p.sex === "M" ? "Men" : "Women";
    return {
      key: p.sex + "|" + lo,
      shortLabel: p.sex + range,          // e.g. "M30–39"
      longLabel: sexWord + " " + range    // e.g. "Men 30–39"
    };
  }

  // Category for a recorded entry (looks up its participant), or null.
  function entryCategory(e) { return ageCategory(participants[e.runnerNumber]); }

  // Build the ranking tabs: All / Men / Women + every category present.
  function buildFilterOptions() {
    var opts = [
      { value: "all", label: "All" },
      { value: "M", label: "Men" },
      { value: "F", label: "Women" }
    ];
    var seen = {};
    Object.keys(participants).forEach(function (num) {
      var c = ageCategory(participants[num]);
      if (c && !seen[c.key]) { seen[c.key] = c.longLabel; }
    });
    Object.keys(seen).sort().forEach(function (key) {
      opts.push({ value: key, label: seen[key] });
    });

    if (!opts.some(function (o) { return o.value === currentFilter; })) currentFilter = "all";

    $tabs.innerHTML = "";
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (o.value === currentFilter ? " active" : "");
      b.setAttribute("data-value", o.value);
      b.setAttribute("role", "tab");
      b.textContent = o.label;
      $tabs.appendChild(b);
    });
  }

  // Predicate deciding whether an entry belongs to the active filter.
  function matchesFilter(e, filter) {
    if (filter === "all") return true;
    var p = participants[e.runnerNumber];
    if (filter === "M" || filter === "F") return !!p && p.sex === filter;
    var c = ageCategory(p);
    return !!c && c.key === filter;
  }

  // Map of entry id -> 1-based place within `list`, ranked by finish time.
  function computePlaces(list) {
    var places = {};
    list.slice()
      .sort(function (a, b) { return a.finishEpoch - b.finishEpoch; })
      .forEach(function (e, i) { places[e.id] = i + 1; });
    return places;
  }

  // Inline editor (in the Name cell) to add/fix sex & birth year for a bib.
  function catEditorHtml(p) {
    var sex = p ? (p.sex || "") : "";
    var year = p && p.birthYear ? p.birthYear : "";
    return '<span class="cat-editor">' +
      '<select class="ed-sex" aria-label="Sex">' +
        '<option value=""' + (sex === "" ? " selected" : "") + '>—</option>' +
        '<option value="M"' + (sex === "M" ? " selected" : "") + ">M</option>" +
        '<option value="F"' + (sex === "F" ? " selected" : "") + ">F</option>" +
      "</select>" +
      '<input class="ed-year" type="text" inputmode="numeric" maxlength="4" placeholder="year" value="' +
        escapeAttr(String(year)) + '" aria-label="Birth year">' +
      '<button type="button" class="ed-save" title="Save">' + svgIcon("check") + "</button>" +
      '<button type="button" class="ed-cancel" title="Cancel">' + svgIcon("x") + "</button>" +
      "</span>";
  }

  function openCatEditor(num) {
    editingNum = num;
    render();
    var sel = $body.querySelector(".cat-editor .ed-sex");
    if (sel) sel.focus();
  }

  function commitCatEditor(num, editorEl) {
    var sex = normalizeSex(editorEl.querySelector(".ed-sex").value);
    var yr = parseInt(editorEl.querySelector(".ed-year").value, 10);
    var thisYear = new Date().getFullYear();
    var birthYear = (yr >= 1900 && yr <= thisYear) ? yr : null;
    var prev = participants[num] || { name: "", sex: "", birthYear: null };
    participants[num] = { name: prev.name || "", sex: sex, birthYear: birthYear };
    editingNum = null;
    save();
    buildFilterOptions();
    render();
  }

  // ----- Rendering ----------------------------------------------------------

  // Duplicate = same runner number recorded more than once.
  function duplicateNumbers() {
    var counts = {}, dups = {};
    entries.forEach(function (e) {
      counts[e.runnerNumber] = (counts[e.runnerNumber] || 0) + 1;
    });
    Object.keys(counts).forEach(function (n) { if (counts[n] > 1) dups[n] = true; });
    return dups;
  }

  function render(newId) {
    var dups = duplicateNumbers();

    // Entries shown depend on the active ranking filter…
    var visible = entries.filter(function (e) { return matchesFilter(e, currentFilter); });
    var places = computePlaces(visible); // place within the current ranking (unaffected by search)

    // …then narrowed by the search box (number or name), without renumbering places.
    var q = searchQuery.trim().toLowerCase();
    var shown = q ? visible.filter(function (e) {
      return e.runnerNumber.toLowerCase().indexOf(q) > -1 ||
             participantName(e.runnerNumber).toLowerCase().indexOf(q) > -1;
    }) : visible;

    // "All" keeps the most-recent finisher on top (handy during live timing);
    // any specific ranking is sorted by time so it reads 1, 2, 3…
    var ordered = shown.slice().sort(function (a, b) {
      return currentFilter === "all" ? b.finishEpoch - a.finishEpoch
                                     : a.finishEpoch - b.finishEpoch;
    });

    $body.innerHTML = "";
    ordered.forEach(function (e) {
      var isDup = !!dups[e.runnerNumber];

      var tr = document.createElement("tr");
      if (e.id === newId) tr.className = "new";

      var name = participantName(e.runnerNumber);
      var cat = entryCategory(e);
      var catHtml;
      if (editingNum === e.runnerNumber) {
        catHtml = catEditorHtml(participants[e.runnerNumber]);
      } else if (cat) {
        catHtml = '<button type="button" class="cat-chip" title="Edit sex / birth year">' +
                  escapeHtml(cat.shortLabel) + "</button>";
      } else {
        catHtml = '<button type="button" class="cat-chip add" title="Add sex / birth year">' +
                  svgIcon("plus") + "cat</button>";
      }

      var place = places[e.id] || "";
      var elapsed = e.finishEpoch - startEpoch;
      var paceStr = formatPace(elapsed, distanceKm);
      var numHtml;
      if (editingNumberId === e.id) {
        numHtml =
          '<span class="num-editor">' +
            '<input class="num-input" type="text" inputmode="numeric" value="' + escapeAttr(e.runnerNumber) + '" aria-label="Runner number">' +
            '<button type="button" class="num-save" title="Save">' + svgIcon("check") + "</button>" +
            '<button type="button" class="num-cancel" title="Cancel">' + svgIcon("x") + "</button>" +
          "</span>";
      } else {
        numHtml = escapeHtml(e.runnerNumber) +
          (isDup ? '<span class="tag dup">dup</span>' : "") +
          '<button type="button" class="num-edit" title="Edit number">' + svgIcon("pencil") + "</button>";
      }
      var timeHtml;
      if (editingTimeId === e.id) {
        timeHtml =
          '<span class="time-editor">' +
            '<input class="time-input" type="text" inputmode="numeric" value="' + escapeAttr(formatElapsed(elapsed)) + '" aria-label="Finish time">' +
            '<button type="button" class="time-save" title="Save">' + svgIcon("check") + "</button>" +
            '<button type="button" class="time-cancel" title="Cancel">' + svgIcon("x") + "</button>" +
          "</span>";
      } else {
        timeHtml = formatElapsed(elapsed) +
          '<button type="button" class="time-edit" title="Edit time">' + svgIcon("pencil") + "</button>" +
          (paceStr ? '<span class="pace">' + paceStr + "</span>" : "");
      }
      tr.innerHTML =
        '<td class="place' + (place === 1 ? " first" : "") + '" data-label="Place">' + place + "</td>" +
        '<td class="num" data-label="Number">' + numHtml + "</td>" +
        '<td class="name" data-label="Name">' +
          (name ? escapeHtml(name) + " " : "") + catHtml + "</td>" +
        '<td data-label="Obs."><input class="obs" type="text" value="' + escapeAttr(e.details || "") +
          '" placeholder="add note…"></td>' +
        '<td class="time" data-label="Time">' + timeHtml + "</td>" +
        '<td class="remove-cell"><button class="row-remove" title="Remove this result">' + svgIcon("x") + "</button></td>";

      tr.querySelector(".obs").addEventListener("input", function () {
        e.details = this.value;
        save();
      });

      var numEdit = tr.querySelector(".num-edit");
      if (numEdit) numEdit.addEventListener("click", function () {
        editingNumberId = e.id; editingNum = null; render();
        var inp = $body.querySelector(".num-editor .num-input");
        if (inp) { inp.focus(); inp.select(); }
      });
      var numEditor = tr.querySelector(".num-editor");
      if (numEditor) {
        var commitNum = function () {
          var val = numEditor.querySelector(".num-input").value.trim();
          if (val) e.runnerNumber = val;     // ignore empty; keep previous
          editingNumberId = null;
          save();
          buildFilterOptions();              // category may change with the number
          render();
        };
        numEditor.querySelector(".num-save").addEventListener("click", commitNum);
        numEditor.querySelector(".num-cancel").addEventListener("click", function () {
          editingNumberId = null; render();
        });
        numEditor.querySelector(".num-input").addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") { ev.preventDefault(); commitNum(); }
          else if (ev.key === "Escape") { ev.preventDefault(); editingNumberId = null; render(); }
        });
      }

      var timeEdit = tr.querySelector(".time-edit");
      if (timeEdit) timeEdit.addEventListener("click", function () {
        editingTimeId = e.id; render();
        var inp = $body.querySelector(".time-editor .time-input");
        if (inp) { inp.focus(); inp.select(); }
      });
      var timeEditor = tr.querySelector(".time-editor");
      if (timeEditor) {
        var commitTime = function () {
          var ms = parseElapsedToMs(timeEditor.querySelector(".time-input").value);
          if (ms != null) e.finishEpoch = startEpoch + ms;
          else alert("Enter the time as H:MM:SS, MM:SS or with .cc (e.g. 24:31.50).");
          editingTimeId = null;
          save();
          render();
        };
        timeEditor.querySelector(".time-save").addEventListener("click", commitTime);
        timeEditor.querySelector(".time-cancel").addEventListener("click", function () {
          editingTimeId = null; render();
        });
        timeEditor.querySelector(".time-input").addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") { ev.preventDefault(); commitTime(); }
          else if (ev.key === "Escape") { ev.preventDefault(); editingTimeId = null; render(); }
        });
      }

      var chip = tr.querySelector(".cat-chip");
      if (chip) chip.addEventListener("click", function () { openCatEditor(e.runnerNumber); });

      var editor = tr.querySelector(".cat-editor");
      if (editor) {
        editor.querySelector(".ed-save").addEventListener("click", function () {
          commitCatEditor(e.runnerNumber, editor);
        });
        editor.querySelector(".ed-cancel").addEventListener("click", function () {
          editingNum = null; render();
        });
        editor.querySelector(".ed-year").addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") { ev.preventDefault(); commitCatEditor(e.runnerNumber, editor); }
        });
      }
      tr.querySelector(".row-remove").addEventListener("click", function () {
        confirmModal({
          title: "Remove result",
          message: "Remove runner " + e.runnerNumber + " from the results?",
          confirmLabel: "Remove", danger: true
        }).then(function (ok) {
          if (!ok) return;
          entries = entries.filter(function (x) { return x.id !== e.id; });
          save();
          render();
        });
      });

      $body.appendChild(tr);
    });

    // Empty state: distinguish "nothing recorded" / "nothing in ranking" / "no search match".
    if (shown.length) {
      $empty.style.display = "none";
    } else {
      $empty.style.display = "flex";
      $emptyMsg.textContent = q
        ? "No results match your search."
        : (entries.length
            ? "No finishers in this ranking yet."
            : "No results yet. Enter a runner number above and press Record as each finishes.");
    }

    $statCount.textContent = entries.length;
    $statParticipants.textContent = Object.keys(participants).length;
    $statDup.textContent = entries.filter(function (e) { return !!dups[e.runnerNumber]; }).length;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  // ----- Actions ------------------------------------------------------------

  function applyStartNow() {
    startEpoch = Date.now();
    $start.value = formatClock(startEpoch);
    updateStartPreview();
    save();
    render();
  }

  function setStartNow() {
    // Resetting the start recalculates every recorded time — confirm first
    // once there are results, so an accidental tap can't wreck the rankings.
    if (!entries.length) { applyStartNow(); return; }
    confirmModal({
      title: "Set start to now?",
      message: "This recalculates the time of all " + entries.length + " recorded finisher(s).",
      confirmLabel: "Set start", danger: true
    }).then(function (ok) { if (ok) applyStartNow(); });
  }

  function updateStartPreview() {
    $startPreview.textContent = formatClock(startEpoch);
  }

  function recordFinish(number) {
    number = String(number).trim();
    if (number === "") return;
    entries.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      runnerNumber: number,
      finishEpoch: Date.now(),
      details: ""
    });
    if (soundOn) beep();
    save();
    render(entries[entries.length - 1].id);
  }

  function clearResults() {
    if (!entries.length) return;
    confirmModal({
      title: "Clear all results?",
      message: "All " + entries.length + " recorded result(s) will be permanently deleted.",
      confirmLabel: "Clear results", danger: true
    }).then(function (ok) {
      if (!ok) return;
      entries = [];
      save();
      render();
      $runner.focus();
    });
  }

  // ----- CSV ----------------------------------------------------------------

  function exportCSV() {
    var rows = [["Place", "Category place", "Runner number", "Name", "Sex", "Category", "Obs.", "Time", "Pace", "Duplicate"]];
    var dups = duplicateNumbers();

    // Per-category places, keyed by category id.
    var byCat = {};
    entries.forEach(function (e) {
      var c = entryCategory(e);
      if (c) { (byCat[c.key] = byCat[c.key] || []).push(e); }
    });
    var catPlaces = {};
    Object.keys(byCat).forEach(function (key) {
      var pl = computePlaces(byCat[key]);
      Object.keys(pl).forEach(function (id) { catPlaces[id] = pl[id]; });
    });

    var ordered = entries.slice().sort(function (a, b) { return a.finishEpoch - b.finishEpoch; });
    ordered.forEach(function (e, i) {
      var p = participants[e.runnerNumber];
      var c = entryCategory(e);
      rows.push([
        i + 1,
        catPlaces[e.id] || "",
        e.runnerNumber,
        participantName(e.runnerNumber),
        p ? (p.sex || "") : "",
        c ? c.shortLabel : "",
        e.details || "",
        formatElapsed(e.finishEpoch - startEpoch),
        formatPace(e.finishEpoch - startEpoch, distanceKm),
        dups[e.runnerNumber] ? "yes" : ""
      ]);
    });
    var csv = rows.map(function (r) {
      return r.map(csvCell).join(",");
    }).join("\r\n");

    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download("crono-results-" + stamp + ".csv", "﻿" + csv, "text/csv");
  }

  // Build a clean printable layout for the current ranking and open the print
  // dialog (where the user can "Save as PDF") — no external libraries needed.
  function exportPDF() {
    var visible = entries.filter(function (e) { return matchesFilter(e, currentFilter); });
    var ordered = visible.slice().sort(function (a, b) { return a.finishEpoch - b.finishEpoch; });
    var places = computePlaces(visible);
    var activeTab = $tabs.querySelector(".tab.active");
    var rankLabel = activeTab ? activeTab.textContent : "All";

    var body = ordered.map(function (e) {
      var c = entryCategory(e);
      var pace = formatPace(e.finishEpoch - startEpoch, distanceKm);
      return "<tr>" +
        "<td>" + (places[e.id] || "") + "</td>" +
        "<td>" + escapeHtml(e.runnerNumber) + "</td>" +
        "<td>" + escapeHtml(participantName(e.runnerNumber)) + "</td>" +
        "<td>" + (c ? escapeHtml(c.shortLabel) : "") + "</td>" +
        '<td class="r">' + formatElapsed(e.finishEpoch - startEpoch) + "</td>" +
        '<td class="r">' + (pace || "") + "</td>" +
        "</tr>";
    }).join("");

    var meta = "Ranking: " + escapeHtml(rankLabel) +
      " · " + ordered.length + " finisher(s)" +
      (distanceKm ? " · " + distanceKm + " km" : "") +
      " · " + new Date().toLocaleString();

    $printArea.innerHTML =
      '<div class="print-head"><h1>Crono — Results</h1>' +
      '<div class="print-meta">' + meta + "</div></div>" +
      '<table><thead><tr><th>Place</th><th>Number</th><th>Name</th><th>Cat.</th>' +
      '<th class="r">Time</th><th class="r">Pace</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="6">No results.</td></tr>') + "</tbody></table>";

    window.print();
  }

  function csvCell(v) {
    v = String(v);
    if (/[",\r\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Parse a participant CSV. Accepts comma/semicolon/tab separators.
  // Columns: number, name, sex, birth year. A header row is auto-skipped.
  function importCSV(text) {
    var added = 0;
    text.replace(/\r\n?/g, "\n").split("\n").forEach(function (line, idx) {
      if (!line.trim()) return;
      var sep = line.indexOf(";") > -1 ? ";" : (line.indexOf("\t") > -1 ? "\t" : ",");
      var cells = parseCsvLine(line, sep);
      var num = (cells[0] || "").trim();
      var name = (cells[1] || "").trim();
      // Skip a header row like "number,name,sex,birth_year".
      if (idx === 0 && num && !/^\d+$/.test(num)) return;
      if (!num) return;

      var sex = normalizeSex(cells[2]);
      var year = parseInt((cells[3] || "").trim(), 10);
      var thisYear = new Date().getFullYear();
      var birthYear = (year >= 1900 && year <= thisYear) ? year : null;

      participants[num] = { name: name, sex: sex, birthYear: birthYear };
      added++;
    });
    save();
    buildFilterOptions();
    render();
    if ($partModal.classList.contains("show")) renderParticipants();
    alert(added
      ? added + " participant(s) loaded."
      : "No valid rows found. Expected columns: number, name, sex, birth_year");
  }

  function parseCsvLine(line, sep) {
    var out = [], cur = "", inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === sep) { out.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  // ----- Backup / Restore (full JSON) ---------------------------------------

  function exportBackup() {
    var data = {
      app: "crono", v: 1, exportedAt: new Date().toISOString(),
      startEpoch: startEpoch, distanceKm: distanceKm,
      entries: entries, participants: participants
    };
    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    download("crono-backup-" + stamp + ".json", JSON.stringify(data, null, 2), "application/json");
  }

  function importBackup(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { alert("That file isn't valid JSON."); return; }
    if (!data || data.app !== "crono" || !Array.isArray(data.entries) || typeof data.participants !== "object") {
      alert("That doesn't look like a Crono backup file.");
      return;
    }
    confirmModal({
      title: "Restore backup?",
      message: "This replaces the current start time, " + entries.length +
               " result(s) and the participant list with the backup's contents.",
      confirmLabel: "Restore", danger: true
    }).then(function (ok) {
      if (!ok) return;
      startEpoch = parseInt(data.startEpoch, 10) || Date.now();
      distanceKm = (data.distanceKm > 0) ? data.distanceKm : null;
      entries = data.entries.filter(function (e) { return e && e.id && e.runnerNumber != null; });
      participants = {};
      Object.keys(data.participants || {}).forEach(function (num) {
        var p = data.participants[num] || {};
        participants[num] = { name: p.name || "", sex: normalizeSex(p.sex), birthYear: (p.birthYear > 0 ? p.birthYear : null) };
      });
      save();
      $start.value = formatClock(startEpoch);
      $distance.value = distanceKm == null ? "" : String(distanceKm);
      updateStartPreview();
      buildFilterOptions();
      render();
    });
  }

  // ----- Participants management modal --------------------------------------

  function openParticipants() {
    $partSearch.value = "";
    renderParticipants();
    $partModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeParticipants() {
    $partModal.classList.remove("show");
    if (!$consent.classList.contains("show")) document.body.style.overflow = "";
  }

  function renderParticipants() {
    var q = $partSearch.value.trim().toLowerCase();
    var nums = Object.keys(participants).sort(function (a, b) {
      var na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    if (q) nums = nums.filter(function (n) {
      return n.toLowerCase().indexOf(q) > -1 || (participants[n].name || "").toLowerCase().indexOf(q) > -1;
    });

    var head = '<div class="part-row part-head"><span>Number</span><span>Name</span><span>Sex</span><span>Year</span><span></span></div>';
    var rows = nums.map(function (n) {
      var p = participants[n];
      return '<div class="part-row" data-num="' + escapeAttr(n) + '">' +
        '<input class="p-num" value="' + escapeAttr(n) + '" inputmode="numeric" aria-label="Number">' +
        '<input class="p-name" value="' + escapeAttr(p.name || "") + '" placeholder="name" aria-label="Name">' +
        '<select class="p-sex" aria-label="Sex">' +
          '<option value=""' + (!p.sex ? " selected" : "") + '>—</option>' +
          '<option value="M"' + (p.sex === "M" ? " selected" : "") + ">M</option>" +
          '<option value="F"' + (p.sex === "F" ? " selected" : "") + ">F</option>" +
        "</select>" +
        '<input class="p-year" value="' + escapeAttr(p.birthYear ? String(p.birthYear) : "") + '" inputmode="numeric" maxlength="4" placeholder="year" aria-label="Birth year">' +
        '<button type="button" class="p-del" title="Delete participant">' + svgIcon("x") + "</button>" +
      "</div>";
    }).join("");

    var count = Object.keys(participants).length;
    $partBody.innerHTML =
      '<div class="part-count">' + count + " participant(s)" + (q ? " · showing " + nums.length : "") + "</div>" +
      head + (rows || '<div class="part-empty">No participants yet. Add one or import a CSV.</div>');

    // Wire each row.
    Array.prototype.forEach.call($partBody.querySelectorAll(".part-row[data-num]"), function (row) {
      var orig = row.getAttribute("data-num");
      row.querySelector(".p-name").addEventListener("input", function () {
        participants[orig].name = this.value; save(); render();
      });
      row.querySelector(".p-sex").addEventListener("change", function () {
        participants[orig].sex = normalizeSex(this.value); save(); buildFilterOptions(); render();
      });
      row.querySelector(".p-year").addEventListener("change", function () {
        var y = parseInt(this.value, 10);
        participants[orig].birthYear = (y >= 1900 && y <= new Date().getFullYear()) ? y : null;
        save(); buildFilterOptions(); render();
      });
      row.querySelector(".p-num").addEventListener("change", function () {
        var nn = this.value.trim();
        if (!nn || nn === orig) { this.value = orig; return; }
        participants[nn] = participants[orig];
        delete participants[orig];
        save(); buildFilterOptions(); render(); renderParticipants();
      });
      row.querySelector(".p-del").addEventListener("click", function () {
        confirmModal({ title: "Delete participant", message: "Remove participant " + orig + " from the roster?", confirmLabel: "Delete", danger: true })
          .then(function (ok) { if (!ok) return; delete participants[orig]; save(); buildFilterOptions(); render(); renderParticipants(); });
      });
    });
  }

  function addParticipant() {
    var n = prompt("New participant number:");
    if (n == null) return;
    n = String(n).trim();
    if (!n) return;
    if (!participants[n]) participants[n] = { name: "", sex: "", birthYear: null };
    save(); buildFilterOptions(); render();
    $partSearch.value = "";
    renderParticipants();
    var inp = $partBody.querySelector('.part-row[data-num="' + (window.CSS && CSS.escape ? CSS.escape(n) : n) + '"] .p-name');
    if (inp) inp.focus();
  }

  // ----- Wire up ------------------------------------------------------------

  document.getElementById("setStartNow").addEventListener("click", setStartNow);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
  document.getElementById("pdfBtn").addEventListener("click", exportPDF);
  document.getElementById("clearBtn").addEventListener("click", clearResults);
  document.getElementById("backupBtn").addEventListener("click", exportBackup);
  document.getElementById("restoreBtn").addEventListener("click", function () { $restoreFile.click(); });

  // Participants modal
  document.getElementById("partBtn").addEventListener("click", openParticipants);
  document.getElementById("partClose").addEventListener("click", closeParticipants);
  document.getElementById("partImport").addEventListener("click", function () { $importFile.click(); });
  document.getElementById("partAdd").addEventListener("click", addParticipant);
  $partSearch.addEventListener("input", renderParticipants);
  $partModal.addEventListener("click", function (e) { if (e.target === $partModal) closeParticipants(); });

  // Sound toggle
  $soundToggle.addEventListener("click", function () {
    soundOn = !soundOn; save(); updateSoundToggle();
    if (soundOn) beep();
  });

  // Results search
  $resultSearch.addEventListener("input", function () { searchQuery = this.value; render(); });

  $importFile.addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { importCSV(String(reader.result)); };
    reader.readAsText(file);
    this.value = ""; // allow re-importing the same file
  });

  $restoreFile.addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { importBackup(String(reader.result)); };
    reader.readAsText(file);
    this.value = "";
  });

  $tabs.addEventListener("click", function (e) {
    var t = e.target.closest(".tab");
    if (!t) return;
    currentFilter = t.getAttribute("data-value");
    Array.prototype.forEach.call($tabs.children, function (c) {
      c.classList.toggle("active", c.getAttribute("data-value") === currentFilter);
    });
    render();
  });

  // ----- Consent / Terms gate ----------------------------------------------
  function consentAccepted() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY_CONSENT) || "null");
      return !!c && c.v >= CONSENT_VERSION;
    } catch (e) { return false; }
  }
  function initConsent() {
    if (consentAccepted()) return;
    $consentCheck.checked = false;
    $consentAccept.disabled = true;
    $consent.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  $consentCheck.addEventListener("change", function () {
    $consentAccept.disabled = !this.checked;
  });
  $consentAccept.addEventListener("click", function () {
    if (!$consentCheck.checked) return;
    try { localStorage.setItem(KEY_CONSENT, JSON.stringify({ v: CONSENT_VERSION, at: Date.now() })); } catch (e) {}
    $consent.classList.remove("show");
    if (!$docModal.classList.contains("show")) document.body.style.overflow = "";
    $runner.focus();
  });

  // ----- Legal document modal ----------------------------------------------
  var DOC_TITLES = { terms: "Terms & Conditions", privacy: "Privacy Policy" };
  function openDoc(which) {
    var tpl = document.getElementById("tpl-" + which);
    if (!tpl) return;
    $docTitle.textContent = DOC_TITLES[which] || "";
    $docBody.innerHTML = "";
    $docBody.appendChild(tpl.content.cloneNode(true));
    $docBody.scrollTop = 0;
    $docModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeDoc() {
    $docModal.classList.remove("show");
    // keep scroll locked if the consent gate is still up underneath
    if (!$consent.classList.contains("show")) document.body.style.overflow = "";
  }
  // Any link/element with data-doc opens the matching document in the modal.
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-doc]");
    if (t) { e.preventDefault(); openDoc(t.getAttribute("data-doc")); }
  });
  document.getElementById("docClose").addEventListener("click", closeDoc);
  $docModal.addEventListener("click", function (e) { if (e.target === $docModal) closeDoc(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($docModal.classList.contains("show")) closeDoc();
    else if ($partModal.classList.contains("show")) closeParticipants();
  });

  // ----- Confirm modal ------------------------------------------------------
  var confirmResolve = null;
  function confirmModal(opts) {
    opts = opts || {};
    $confirmTitle.textContent = opts.title || "Confirm";
    $confirmMsg.textContent = opts.message || "";
    $confirmOk.textContent = opts.confirmLabel || "Confirm";
    $confirmOk.className = opts.danger ? "danger" : "primary";
    $confirmModal.classList.add("show");
    document.body.style.overflow = "hidden";
    $confirmOk.focus();
    return new Promise(function (resolve) { confirmResolve = resolve; });
  }
  function closeConfirm(result) {
    $confirmModal.classList.remove("show");
    if (!$consent.classList.contains("show") && !$docModal.classList.contains("show")) {
      document.body.style.overflow = "";
    }
    var r = confirmResolve; confirmResolve = null;
    if (r) r(result);
  }
  $confirmOk.addEventListener("click", function () { closeConfirm(true); });
  $confirmCancel.addEventListener("click", function () { closeConfirm(false); });
  $confirmModal.addEventListener("click", function (e) { if (e.target === $confirmModal) closeConfirm(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $confirmModal.classList.contains("show")) closeConfirm(false);
  });

  $start.addEventListener("change", function () {
    var epoch = clockStringToEpoch(this.value);
    if (epoch == null) {
      alert("Please enter the start time as HH:MM:SS.");
      this.value = formatClock(startEpoch);
      return;
    }
    startEpoch = epoch;
    this.value = formatClock(startEpoch);
    updateStartPreview();
    save();
    buildFilterOptions(); // race year may shift age categories
    render();
  });

  $distance.addEventListener("change", function () {
    var v = parseFloat(String(this.value).replace(",", "."));
    distanceKm = (v > 0) ? v : null;
    this.value = distanceKm == null ? "" : String(distanceKm);
    save();
    render();
  });

  // Submitting the form covers both the Record button and the keyboard's
  // Enter / "Go" / "Done" key — the latter matters on mobile, where the
  // numeric keypad often has no real Enter key.
  document.getElementById("captureForm").addEventListener("submit", function (e) {
    e.preventDefault();
    recordFinish($runner.value);
    $runner.value = "";
    $runner.focus();
  });

  window.addEventListener("beforeunload", function (e) {
    if (entries.length) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // ----- Init ---------------------------------------------------------------
  load();
  $start.value = formatClock(startEpoch);
  $distance.value = distanceKm == null ? "" : String(distanceKm);
  updateStartPreview();
  updateSoundToggle();
  buildFilterOptions();
  render();
  initConsent();
  var hash = (location.hash || "").replace("#", "");
  if (hash === "terms" || hash === "privacy") openDoc(hash);
  if (!$consent.classList.contains("show") && !$docModal.classList.contains("show")) $runner.focus();
})();
