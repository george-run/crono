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
