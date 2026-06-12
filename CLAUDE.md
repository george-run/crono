# Crono — project rules for AI assistants

Read this first. **If any rule here changes, update this file in the same commit.**

## TL;DR
Static, zero-build, offline-first race chronometer on **GitHub Pages** under `/crono/`.
Landing = `index.html`; app = `app.html`; logic = `assets/app.js` (vanilla JS, IIFE).
Edit → commit to the dev branch → merge to `master` → sync `gh-pages` → bump `sw.js` cache if
assets changed. There is **no network, no image tooling and no browser/render tool** here.

## This sandbox's constraints (important)
- **No outbound network**: cannot fetch fonts/images/CDNs or `npm install`. (Google Fonts works
  for end users in the browser, but you cannot download them here.)
- **No image tooling** (`cwebp`/`convert`/`magick`/`pngquant`/`sharp` absent): cannot resize or
  recompress images. Ask the user to provide optimized assets (PNG/WebP/SVG); they commit them.
- **No browser/render tool**: you cannot run the page or take screenshots → cannot visually
  verify. Rely on `node --check` + small Node logic tests, and ask the user to eyeball the result.
- Dev branch in use: `claude/rungeorge-crono-access-8k39na` (or whatever the task specifies).

## Structure
```
index.html        Landing page            → /crono/
app.html          The chronometer app     → /crono/app.html
terms.html        Standalone Terms page    privacy.html  Standalone Privacy page
favicon.svg       Logo mark
manifest.webmanifest, sw.js   PWA (installable + offline)
assets/
  theme.css   Shared design tokens (:root) — single source of truth
  app.css     App styles            app.js   App logic (IIFE)
  site.css    Landing styles        site.js  Landing animations + SW register
  helpers.js  Pure helpers (UMD: window.CronoH + Node require) — unit-tested
  head.js     reduced-motion → adds .js-anim (runs in <head> before paint)
test/helpers.test.js   Node tests (`npm test` → node --test). package.json (no deps).
```

## Hard rules (don't break)
1. **Zero-build, no dependencies / frameworks / bundlers.** Only vanilla HTML/CSS/JS. The one
   allowed external request is **Google Fonts** (Inter + Space Grotesk), disclosed in Privacy.
2. **Offline-first** (PWA + localStorage). No server calls.
3. **Relative paths only** (served under `/crono/`): `assets/...`, `app.html`, never `/assets/...`.
4. **Don't rename IDs/classes read by JS** when refactoring.
5. **JS style:** ES5-ish, `"use strict"`, `var`, small helpers, `// ----- Section -----` comments,
   no leaked globals. CSS/JS live in `assets/`. **No inline `<style>`/`<script>`** in the pages
   (a strict CSP `script-src 'self'` enforces this): the reduced-motion toggle is `head.js`,
   SW registration lives at the end of `app.js`/`site.js`. Pure helpers go in `helpers.js` (tested).
   A `<meta>` CSP is set on every page — if you add an external host, update it.
6. **Design tokens once** in `theme.css`; reuse `var(--…)`. Dark theme, lime accent `--primary:#a3e635`.
7. **No native confirm/alert for confirmations** — use `confirmModal()` (a single `prompt()` for one
   value is tolerated). Keep modern in-app UI.
8. **Accessibility/motion:** gate animations behind `prefers-reduced-motion` (landing uses a
   `.js-anim` class added only when motion is allowed); keep focus-visible states and big tap targets.
9. **Browser target:** modern evergreen + iOS/Safari. No transpiling.

## Data model (localStorage)
Keys: `crono.startEpoch`, `crono.entries`, `crono.participants`, `crono.distanceKm`,
`crono.sound`, `crono.cards`, `crono.consent`.
```
entry        = { id, runnerNumber: string, finishEpoch: ms, details: string }
participants = { "<number>": { name: string, sex: "M"|"F"|"", birthYear: number|null } }
startEpoch   = absolute ms; elapsed = finishEpoch - startEpoch (handles midnight)
backup JSON  = { app:"crono", v:1, exportedAt, startEpoch, distanceKm, entries, participants }
```
`consent` = `{ v: CONSENT_VERSION, at }`. Backups do NOT include consent.

## Code map — `assets/app.js` (section comments in this order)
Storage keys · State · Elements · Inline SVG icons (`ICONS`, `svgIcon`) · Time helpers
(`formatElapsed`, `formatClock`, `formatPace`, `parseElapsedToMs`, `clockStringToEpoch`, `pad`) ·
Persistence (`save`, `load`) · Sound (`beep`, `updateSoundToggle`) · Participants & categories
(`participantName`, `normalizeSex`, `ageCategory`, `buildFilterOptions`, `matchesFilter`,
`computePlaces`, cat editor) · Rendering (`render`, `escapeHtml/Attr`) · Actions (`setStartNow`,
`recordFinish`, `clearResults`, `updateStartPreview`) · CSV/PDF (`exportCSV`, `exportPDF`,
`download`) · `importCSV`/`parseCsvLine` · Backup/Restore (`exportBackup`, `importBackup`) ·
Participants modal (`openParticipants`, `renderParticipants`, `addParticipant`) · Wire up ·
Consent gate · Doc modal (`openDoc`) · Confirm modal (`confirmModal`) · Init.

## Patterns to follow (reuse these)
- **Edit a result:** rows are click-to-edit → `openRowEdit(id)` opens `#rowModal` (number/time/sex/
  year/note/delete). `editingRowId` holds the open entry; `saveRowEdit()` commits → `save()`, `render()`.
- **`render()` rebuilds `#resultBody` from scratch** → (re)attach row listeners inside the loop.
- **Modals are focus-trapped** (see the Tab handler) and close on ESC/backdrop.
- **Modal recipe:** `.X-overlay` + `.show` class; on open set `document.body.style.overflow="hidden"`;
  on close restore it only if no other modal is open; support ESC + backdrop click. `confirmModal()`
  returns a `Promise<boolean>`. Stacking z-index: doc/participants 1100, confirm 1200.
- **Icons:** `svgIcon(name)` for JS-built markup; inline `<svg class="icon">` for static HTML buttons.
- After changing categories/numbers, call `buildFilterOptions()` then `render()`.

## Service worker / cache (IMPORTANT)
- `sw.js`: **network-first for HTML pages** (so deploys show immediately when online),
  **cache-first for static assets** (css/js/images). Versioned name `CACHE = "crono-vN"`.
- **Bump `CACHE` whenever any cached asset changes**, and keep the `ASSETS` precache list in sync.
- SW runs only over http(s) (GitHub Pages), not `file://`. Returning users may still need one
  reload for a new SW to activate.

## Privacy / legal
- Operator = **the Crono project**; contact via the GitHub repo. Governing law generic.
- Legal text exists twice: standalone `terms.html`/`privacy.html` AND in-app templates
  `#tpl-terms`/`#tpl-privacy` in `app.html` — **keep both in sync**.
- Bump `CONSENT_VERSION` in `app.js` if the terms change materially. Texts are templates, not legal advice.

## Deploy (run every change)
```sh
# 1) commit on the dev branch
git add -A && git commit -m "…" && git push -u origin <dev-branch>
# 2) master = source of truth
git checkout -B master origin/master && git merge <dev-branch> && git push origin master
# 3) gh-pages = what Pages serves
git checkout -B gh-pages origin/gh-pages && git merge -X theirs master && git push origin gh-pages
git checkout <dev-branch>
# 4) verify they match (must be empty) and bump sw.js cache if assets changed
git diff --stat origin/master origin/gh-pages
```

## Verify before deploy
- `node --check assets/app.js assets/site.js`
- Add a tiny Node test for new pure helpers (e.g. `parseElapsedToMs`, `formatPace`).
- Confirm no inline `<style>`/IIFE crept back into `app.html`; relative paths only.
- **Update `CHANGELOG.md`** (under `[Unreleased]`) for any notable user-facing change.

## Current features (don't re-implement)
Start time (+confirm), record on Enter/Record with **beep** (toggle), centiseconds, midnight-safe,
duplicates, per-row notes, **inline edit of number & time**, sex/age-category rankings via **tabs**,
**pace** (distance), **results search**, **participant manager** (add/edit/delete/search/CSV import),
**CSV + PDF (print) export**, **backup/restore JSON**, consent + Terms/Privacy (modal in app,
standalone pages from landing), **PWA** (installable/offline), animated landing.

## Known constraints / TODO ideas
- `addParticipant()` uses a `prompt()` for the new number (could become an inline row).
- iOS PWA icon is SVG; add a 512×512 PNG if the user provides one.
- Possible next: waves/net time, splits/laps, multiple events, team scoring, i18n (RO/EN).
