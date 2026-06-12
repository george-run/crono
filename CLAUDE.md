# Crono — project rules for AI assistants

Read this before making changes. **If any rule here changes, update this file in the same commit.**

## What this is
Crono is a free, offline chronometer for small/in-house running competitions.
Pure static site (no build step, no framework) hosted on **GitHub Pages** under the
**`/crono/`** subpath. Live: https://rungeorge.github.io/crono/

## Structure
```
index.html        Landing / presentation page  → /crono/
app.html          The chronometer app          → /crono/app.html
terms.html        Standalone Terms page
privacy.html      Standalone Privacy page
favicon.svg       Logo mark
manifest.webmanifest, sw.js   PWA (installable + offline)
assets/
  theme.css       Shared design tokens (palette, fonts, radii) — single source of truth
  app.css         App styles
  app.js          App logic (vanilla JS, IIFE)
  site.css        Landing styles
  site.js         Landing behaviour/animations
images/runner.png Hero illustration
```

## Hard rules (do not break)
1. **Zero-build, no dependencies.** No bundler, no npm, no frameworks. Only vanilla
   HTML/CSS/JS. The single allowed external request is **Google Fonts** (Inter + Space
   Grotesk) — disclosed in the Privacy Policy. Do not add other third-party scripts/CDNs.
2. **Offline-first.** The app must keep working offline (PWA + localStorage). No server calls.
3. **Relative paths only.** The site is served under `/crono/`, so always use relative URLs
   (`assets/...`, `app.html`, `sw.js`), never absolute (`/assets/...`).
4. **Don't rename IDs/classes used by JS** when refactoring CSS/markup. JS reads many IDs.
5. **JS style:** vanilla ES5-ish inside an IIFE in `assets/app.js`, `"use strict"`, `var`,
   small helpers, section comments (`// ----- X -----`). No globals leaked.
6. **Design tokens live once** in `assets/theme.css` (`:root`). Reuse `var(--...)`; don't
   redefine the palette per file. Dark theme + lime accent (`--primary: #a3e635`).
7. **Modern UI, no native dialogs for confirms.** Use the in-app `confirmModal()` (a one-off
   `prompt()` for a single value is tolerated, but prefer in-app UI).

## Service worker / cache (IMPORTANT)
- `sw.js` uses a cache-first strategy with a versioned cache name (`CACHE = "crono-vN"`).
- **Every time you change any cached asset (html/css/js/images), bump `CACHE`** (e.g.
  `crono-v2` → `crono-v3`) so returning users get the new version. The `activate` handler
  deletes old caches.
- Keep the `ASSETS` precache list in `sw.js` in sync when adding/removing files.
- SW only runs over http(s) (works on GitHub Pages; not on `file://`).

## Privacy / legal
- Operator shown as **the Crono project**; contact via the GitHub repo (no public email).
- Governing law kept generic. Legal text lives in standalone `terms.html`/`privacy.html`
  AND as in-app modal templates (`#tpl-terms`, `#tpl-privacy`) in `app.html` — keep both in sync.
- Consent gate stores acceptance with `CONSENT_VERSION` in `app.js`; bump it if the terms change materially.
- Texts are general templates, not legal advice.

## Deployment workflow (every change)
Branches: develop on `claude/...` (or the active dev branch), then publish.
1. Commit to the dev branch and push.
2. `master` is the source of truth: merge the dev branch into `master`, push.
3. `gh-pages` is what GitHub Pages serves: `git merge -X theirs master` into `gh-pages`, push.
4. Verify `git diff --stat origin/master origin/gh-pages` is **empty** (they must match).
5. Remember to **bump the `sw.js` cache version** if assets changed.

## Verification before deploy
- Syntax-check JS: `node --check assets/app.js` (and `assets/site.js`).
- For HTML edits, confirm no inline `<style>`/`<script>` crept back into `app.html`
  (styles/logic live in `assets/`).
- Sanity: there is no image-processing or browser tool in this environment, and **no network
  egress** (cannot download fonts/images). Raster assets must be provided by the user.

## Notes / known constraints
- Can't recompress images here (no tooling/network); ask the user for optimized files.
- PWA icon is `favicon.svg`; iOS prefers a PNG (512×512) — add if the user provides one.
