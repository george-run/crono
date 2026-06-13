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
