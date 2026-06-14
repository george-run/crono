"use strict";
/* Architecture / consistency guards. These turn "remember to update CLAUDE.md and keep the
   project's invariants" into tests that fail loudly. Zero-dep (node:test + node:fs). Run: npm test. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const HTML = ["index.html", "app.html", "bibs.html", "terms.html", "privacy.html"];
const exists = (p) => fs.existsSync(path.join(ROOT, p));

test("sw.js CACHE version is mirrored in CLAUDE.md Status", () => {
  const m = read("sw.js").match(/CACHE\s*=\s*"(crono-v\d+)"/);
  assert.ok(m, "could not find CACHE = \"crono-vN\" in sw.js");
  assert.ok(read("CLAUDE.md").includes(m[1]),
    `CLAUDE.md Status must mention the current cache (${m[1]}) — bump it on deploy`);
});

test("every file in sw.js ASSETS exists on disk", () => {
  const block = read("sw.js").match(/ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(block, "could not find the ASSETS array in sw.js");
  (block[1].match(/"([^"]+)"/g) || []).map((s) => s.replace(/"/g, "")).forEach((rel) => {
    if (rel === "./") return;
    assert.ok(exists(rel), `sw.js precaches "${rel}" but the file is missing`);
  });
});

test("every assets/* file is documented in CLAUDE.md Structure", () => {
  const claude = read("CLAUDE.md");
  fs.readdirSync(path.join(ROOT, "assets")).forEach((f) => {
    assert.ok(claude.includes(f), `assets/${f} is not mentioned in CLAUDE.md — document it in Structure`);
  });
});

test("no inline <style> or inline <script> in any page (CSP / rule #5)", () => {
  HTML.forEach((p) => {
    const html = read(p);
    assert.ok(!/<style[\s>]/i.test(html), `${p} has an inline <style> — move it to a CSS file`);
    // <script> without a src= attribute = inline script.
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${p} has an inline <script> — move it to assets/`);
  });
});

test("assets are referenced with relative paths only (served under /crono/)", () => {
  HTML.concat(["assets/app.css", "assets/site.css", "assets/legal.css", "assets/theme.css"]).forEach((p) => {
    const txt = read(p);
    assert.ok(!txt.includes('"/assets/') && !txt.includes("(/assets/") && !/(href|src)="\/(?!\/)/.test(txt),
      `${p} uses an absolute /asset path — must be relative (e.g. assets/…)`);
  });
});

test("every assets/*.js is loaded by at least one page", () => {
  const pages = HTML.map(read).join("\n");
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => f.endsWith(".js")).forEach((js) => {
    assert.ok(pages.includes("assets/" + js), `assets/${js} is never referenced by a page (orphan?)`);
  });
});

test("i18n: every language has the exact same key set as English", () => {
  const i18n = require("../assets/i18n.js");
  const enKeys = Object.keys(i18n.STR.en).sort();
  i18n.LANGS.forEach((lang) => {
    assert.ok(i18n.STR[lang], `missing string table for language "${lang}"`);
    const keys = Object.keys(i18n.STR[lang]).sort();
    const missing = enKeys.filter((k) => !(k in i18n.STR[lang]));
    const extra = keys.filter((k) => !(k in i18n.STR.en));
    assert.deepEqual(missing, [], `"${lang}" is missing keys: ${missing.join(", ")}`);
    assert.deepEqual(extra, [], `"${lang}" has unknown keys: ${extra.join(", ")}`);
  });
});

test("i18n: every translation value is a non-empty string in every language", () => {
  const i18n = require("../assets/i18n.js");
  i18n.LANGS.forEach((lang) => {
    Object.keys(i18n.STR[lang]).forEach((k) => {
      const v = i18n.STR[lang][k];
      assert.ok(typeof v === "string" && v.trim().length > 0, `${lang}."${k}" is empty/blank — every language must have real text`);
    });
  });
});

test("i18n: every data-i18n* key used in HTML exists in the EN table", () => {
  const en = require("../assets/i18n.js").STR.en;
  const used = new Set();
  HTML.forEach((p) => {
    const html = read(p);
    let m;
    const re = /data-i18n(?:-html)?="([^"]+)"/g;
    while ((m = re.exec(html))) used.add(m[1]);
    const reAttr = /data-i18n-attr="([^"]+)"/g;
    while ((m = reAttr.exec(html))) {
      m[1].split(",").forEach((pair) => { const k = (pair.split(":")[1] || "").trim(); if (k) used.add(k); });
    }
  });
  used.forEach((k) => assert.ok(en[k] != null, `HTML references data-i18n key "${k}" but it's missing from the EN table in i18n.js`));
});

// ----- More guards (added to keep future changes safe) -----

test("i18n: {placeholders} match across all languages", () => {
  const i18n = require("../assets/i18n.js");
  const ph = (s) => (String(s).match(/\{\w+\}/g) || []).slice().sort().join(",");
  Object.keys(i18n.STR.en).forEach((k) => {
    const want = ph(i18n.STR.en[k]);
    i18n.LANGS.forEach((lang) => {
      const got = ph(i18n.STR[lang][k]);
      assert.equal(got, want, `${lang}."${k}" placeholders [${got}] differ from EN [${want}] — interpolation would break`);
    });
  });
});

test("i18n: every t()/tn() key used in JS exists in the EN table", () => {
  const en = require("../assets/i18n.js").STR.en;
  ["assets/app.js", "assets/bibs.js", "assets/coffee.js", "assets/sw-register.js"].forEach((p) => {
    const js = read(p);
    let m;
    const re = /\b(?:tn|t)\(\s*"([^"]+)"/g;
    while ((m = re.exec(js))) {
      assert.ok(en[m[1]] != null, `${p} calls t("${m[1]}") but that key is missing from the EN table`);
    }
  });
});

test("every assets/*.css is loaded by at least one page", () => {
  const pages = HTML.map(read).join("\n");
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => f.endsWith(".css")).forEach((css) => {
    assert.ok(pages.includes("assets/" + css), `assets/${css} is never <link>ed by a page (orphan?)`);
  });
});

test("every assets/*.{js,css} is precached in sw.js ASSETS", () => {
  const block = read("sw.js").match(/ASSETS\s*=\s*\[([\s\S]*?)\]/)[1];
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => /\.(js|css)$/.test(f)).forEach((f) => {
    assert.ok(block.includes('"assets/' + f + '"'), `assets/${f} is missing from sw.js ASSETS — it won't be precached for offline`);
  });
});

test("pages load the scripts/styles their markup needs", () => {
  HTML.forEach((p) => {
    const html = read(p);
    const needs = (cond, asset, why) => { if (cond) assert.ok(html.includes(asset), `${p} ${why} but doesn't load ${asset}`); };
    needs(/data-i18n/.test(html), "assets/i18n.js", "uses data-i18n");
    needs(/data-coffee/.test(html), "assets/coffee.js", "has a [data-coffee] link");
    needs(/data-coffee/.test(html), "assets/coffee.css", "has a [data-coffee] link");
    needs(/id="toasts"|assets\/sw-register\.js/.test(html), "assets/toast.css", "shows toasts");
  });
});

test("no hardcoded primary lime outside theme.css (use the tokens)", () => {
  fs.readdirSync(path.join(ROOT, "assets")).filter((f) => f.endsWith(".css") && f !== "theme.css").forEach((css) => {
    const txt = read("assets/" + css);
    assert.ok(!/#a3e635/i.test(txt), `assets/${css} hardcodes the lime hex #a3e635 — use var(--primary)`);
    assert.ok(!/rgba\(\s*163\s*,\s*230\s*,\s*53/i.test(txt), `assets/${css} hardcodes rgba(163,230,53…) — use rgba(var(--primary-rgb), …)`);
  });
});

test("no duplicate id attributes within a page", () => {
  HTML.forEach((p) => {
    const ids = (read(p).match(/\sid="([^"]+)"/g) || []).map((s) => s.replace(/.*id="([^"]+)".*/, "$1"));
    const seen = {}, dup = [];
    ids.forEach((id) => { if (seen[id]) dup.push(id); seen[id] = 1; });
    assert.deepEqual(dup, [], `${p} has duplicate id(s): ${dup.join(", ")}`);
  });
});

test("every page sets a Content-Security-Policy meta", () => {
  HTML.forEach((p) => {
    assert.ok(/http-equiv="Content-Security-Policy"/i.test(read(p)), `${p} is missing the CSP <meta>`);
  });
});
