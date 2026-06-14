"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../assets/helpers.js");

test("parseElapsedToMs", () => {
  assert.equal(H.parseElapsedToMs("00:24:31.50"), 1471500);
  assert.equal(H.parseElapsedToMs("4:32"), 272000);
  assert.equal(H.parseElapsedToMs("59.9"), 59900);
  assert.equal(H.parseElapsedToMs("1:02:03"), 3723000);
  assert.equal(H.parseElapsedToMs("90"), null);   // seconds must be <= 59
  assert.equal(H.parseElapsedToMs("aa"), null);
  assert.equal(H.parseElapsedToMs("12:75"), null); // minutes/seconds out of range
});

test("formatElapsed", () => {
  assert.equal(H.formatElapsed(1471500), "00:24:31.50");
  assert.equal(H.formatElapsed(0), "00:00:00.00");
  assert.equal(H.formatElapsed(null), "--:--:--.--");
});

test("formatClockElapsed", () => {
  assert.equal(H.formatClockElapsed(1471500), "00:24:31");   // truncates centiseconds
  assert.equal(H.formatClockElapsed(0), "00:00:00");
  assert.equal(H.formatClockElapsed(-5000), "00:00:00");     // negative clamps to zero
  assert.equal(H.formatClockElapsed(3723000), "01:02:03");
  assert.equal(H.formatClockElapsed(null), "--:--:--");
});

test("formatPace", () => {
  assert.equal(H.formatPace(1500000, 5), "5:00 /km");
  assert.equal(H.formatPace(0, 5), "");
  assert.equal(H.formatPace(600000, 0), "");
});

test("normalizeSex", () => {
  assert.equal(H.normalizeSex("masculin"), "M");
  assert.equal(H.normalizeSex("female"), "F");
  assert.equal(H.normalizeSex("x"), "");
});

test("bracketRange", () => {
  assert.equal(H.bracketRange(0), "0–19");
  assert.equal(H.bracketRange(30), "30–39");
  assert.equal(H.bracketRange(60), "60+");
});

test("category", () => {
  // age in 2026: 1990 -> 36 (M30–39), 1970 -> 56 (F50–59), 2010 -> 16 (M0–19), 1960 -> 66 (F60+)
  assert.deepEqual(H.category({ sex: "M", birthYear: 1990 }, 2026),
    { key: "M|30", sex: "M", lo: 30, range: "30–39", shortLabel: "M30–39" });
  assert.equal(H.category({ sex: "F", birthYear: 1970 }, 2026).shortLabel, "F50–59");
  assert.equal(H.category({ sex: "M", birthYear: 2010 }, 2026).shortLabel, "M0–19");
  assert.equal(H.category({ sex: "F", birthYear: 1960 }, 2026).shortLabel, "F60+");
  assert.equal(H.category({ sex: "", birthYear: 1990 }, 2026), null);   // missing sex
  assert.equal(H.category({ sex: "M", birthYear: null }, 2026), null);  // missing year
  assert.equal(H.category({ sex: "M", birthYear: 2030 }, 2026), null);  // negative age
  assert.equal(H.category(null, 2026), null);
});

test("computePlaces", () => {
  var places = H.computePlaces([
    { id: "a", finishEpoch: 300 },
    { id: "b", finishEpoch: 100 },
    { id: "c", finishEpoch: 200 }
  ]);
  assert.deepEqual(places, { b: 1, c: 2, a: 3 });
  assert.deepEqual(H.computePlaces([]), {});
});

test("bibRange", () => {
  assert.deepEqual(H.bibRange(1, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(H.bibRange(10, 10), [10]);
  assert.equal(H.bibRange(5, 1), null);        // from > to
  assert.equal(H.bibRange(-1, 5), null);       // negative
  assert.equal(H.bibRange(1.5, 5), null);      // non-integer
  assert.equal(H.bibRange("a", 5), null);      // non-numeric
  assert.equal(H.bibRange(1, 100, 50), null);  // exceeds max count
  assert.deepEqual(H.bibRange(1, 3, 50), [1, 2, 3]); // within max
});

test("csvCell escapes and guards formula injection", () => {
  assert.equal(H.csvCell("Ana"), "Ana");
  assert.equal(H.csvCell("Popescu, Ana"), '"Popescu, Ana"');
  assert.equal(H.csvCell('he said "hi"'), '"he said ""hi"""');
  assert.equal(H.csvCell("=1+1"), "'=1+1");
  assert.equal(H.csvCell("@cmd"), "'@cmd");
});

test("consentAccepted (shared by the app gate and the landing banner)", () => {
  const V = H.CONSENT_VERSION;
  assert.equal(H.consentAccepted(null, V), false);
  assert.equal(H.consentAccepted("", V), false);
  assert.equal(H.consentAccepted("not json", V), false);   // malformed → not accepted
  assert.equal(H.consentAccepted("{}", V), false);          // no version
  assert.equal(H.consentAccepted(JSON.stringify({ v: V, at: 1 }), V), true);
  assert.equal(H.consentAccepted(JSON.stringify({ v: V - 1, at: 1 }), V), false); // stale version
  assert.equal(H.consentAccepted(JSON.stringify({ v: V + 1, at: 1 }), V), true);  // newer is fine
  assert.equal(H.consentAccepted({ v: V }, V), true);       // accepts a parsed object too
});
