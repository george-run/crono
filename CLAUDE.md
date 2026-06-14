# Crono — project rules for AI assistants

Read this first. **If any rule here changes, update this file in the same commit.**
New session? Skim **Status** below for where things stand, then the rules.

## TL;DR
Static, zero-build, offline-first race chronometer on **GitHub Pages** at the custom domain **`crono.run`** (served from root `/`; the old `george-run.github.io/crono/` redirects there).
Landing = `index.html`; app = `app.html`; logic = `assets/app.js` (vanilla JS, IIFE).
Edit → commit to the dev branch → merge to `master` → sync `gh-pages` → bump `sw.js` cache if
assets changed. There is **no network, no image tooling and no browser/render tool** here.

## Status (handoff — update on every deploy)
_So a new session knows where things stand. Keep this block + `CHANGELOG.md [Unreleased]` current; bump the date/cache below whenever you deploy._
- **Live & in sync** as of **2026-06-14**: `master` == `gh-pages` (Pages serves `gh-pages`), last `git diff --stat origin/master origin/gh-pages` empty. Now on the **custom domain `crono.run`** (DNS via Cloudflare, `CNAME` file in repo); all absolute URLs (OG/canonical/sitemap/robots) point at `https://crono.run/`.
- **Service worker cache:** `CACHE = "crono-v124"` in `sw.js` — bump it next time any cached asset changes.
- **Dev branch:** `claude/landing-page-review-1l8irx`.
- **In-flight / recent changes:** `CHANGELOG.md → [Unreleased]` is the source of truth for *what* changed; this block only tracks deploy state + cache version.
- **Recent UI direction (don't undo without asking):** header is consistent on every page — **logo (30px) + Oswald wordmark (1.5rem)**, same size/treatment everywhere (no chip); the **language picker (short codes EN/RO/…) · theme toggle · donation** actions are grouped into a **pill toolbar** on the right (`.header-actions` containing `.lang-wrap`/`.hbtn-theme` + `.hbtn-coffee` amber) — **icon + label** on desktop, collapsing to **icon-only** under 720px (`.hbtn-label` hidden); there is **no Demo entry** anywhere (the old in-app demo modal + landing auto-play mock were removed; the landing's **"How it works" mini-demo** `.hiw` replaces them); **no** "Works offline" badge in the header (offline message stays on landing/FAQ); **Record** = lime **rounded-rect** (not pill), full-width on its own row, **label dead-centred with the stopwatch icon pinned left** (absolute); all `.actions` buttons have centred labels. On mobile the landing hero CTAs stack **full-width/equal** and the background route (`#heroRoute` in `.bg-motif`) is **dimmed** so it doesn't cross them. The landing shows the **same blocking consent gate as the app** (`#consent` "Welcome to Crono" modal: checkbox + Terms/Privacy links opening the standalone pages + "Accept & continue") — it shares the app's `crono.consent` key, so accepting in either place satisfies both. The **app logo/wordmark links back to the landing** (`index.html`); the existing `beforeunload` guard warns when results would be lost.

## Keeping this file honest (run the audit)
Prose drifts when it relies on memory, so the invariants are now **tests**. `npm test`
(= `node --test`) runs `test/architecture.test.js` alongside the helper unit tests and fails loudly on:
- the `sw.js` `CACHE` version not mirrored in the **Status** block,
- a `sw.js` `ASSETS` path that doesn't exist, or an `assets/*` file missing from **Structure**,
- an `assets/*.js` no page loads, an inline `<style>`/`<script>`, or an absolute `/assets/…` path,
- **i18n:** languages with different key sets, an empty value, a `data-i18n*` key in HTML or a `t()`/`tn()` key in JS missing from the tables, or `{placeholder}` tokens that differ across languages,
- an `assets/*.css` no page loads, or any `assets/*.{js,css}` missing from the `ASSETS` precache list,
- a page whose markup needs a script/style it doesn't load (`data-i18n`→i18n.js, `data-coffee`→coffee.js/css, toasts→toast.css),
- hardcoded primary lime (`#a3e635`/`rgba(163,230,53…)`) outside `theme.css`, a duplicate `id` within a page, or a page missing its CSP `<meta>`.

**Ritual (the "periodic check"):** run `npm test` at the **start** of a session and again **before every
deploy**. When you add/rename/remove a file, bump the cache, or add a token, fix the matching prose
**in the same commit** — the audit will catch you if you forget. Add a new guard to
`test/architecture.test.js` whenever a fresh invariant is worth protecting.

## This sandbox's constraints (important)
- **No outbound network**: cannot fetch fonts/images/CDNs or `npm install`. (Google Fonts works
  for end users in the browser, but you cannot download them here.)
- **No image tooling** (`cwebp`/`convert`/`magick`/`pngquant`/`sharp` absent): cannot resize or
  recompress images. Ask the user to provide optimized assets (PNG/WebP/SVG); they commit them.
- **No browser/render tool**: you cannot run the page or take screenshots → cannot visually
  verify. Rely on `node --check` + small Node logic tests, and ask the user to eyeball the result.
- Develop on the dev branch named in **Status** above — never push straight to `master`/`gh-pages`.

## Structure
```
index.html        Landing page            → crono.run/
app.html          The chronometer app     → crono.run/app.html
bibs.html         Bib-number generator     → crono.run/bibs.html (separate page; preview + colour picker/presets + logo upload-or-link)
display.html      Live results display     → crono.run/display.html (read-only leaderboard for a 2nd screen/projector; mirrors the timer LIVE via the cross-tab `storage` event — no network)
CNAME             Custom domain for GitHub Pages (contains: crono.run) — must persist across deploys
terms.html        Standalone Terms page    privacy.html  Standalone Privacy page
favicon.svg       Logo mark
manifest.webmanifest, sw.js   PWA (installable + offline)
robots.txt, sitemap.xml       SEO (absolute URLs; update them on the custom-domain move)
assets/
  theme.css   Shared design tokens (:root) — single source of truth
  app.css     App styles            app.js   App logic (IIFE)
  site.css    Landing styles        site.js  Landing animations (reveal, hero scene, the "How it works" mini-demo `.hiw`) + consent gate (separate IIFEs; both run even under reduced-motion)
  bibs.css    Bib-generator page styles + print sheet   bibs.js  Bib-number generator logic (loaded by bibs.html)
  display.css Live-results display styles   display.js  Live-results logic — reads crono.* from localStorage, re-renders on the `storage` event, ticks the clock, ranking tabs, auto-scroll (loaded by display.html). Pure compute (`computePlaces`, `category`) is shared from helpers.js.
  legal.css   Styles for the standalone terms.html / privacy.html pages
  toolbar.css Shared header toolbar (language · theme · support) — `.header-actions`/`.hbtn*`/`.lang-wrap`; loaded by app.html, index.html AND bibs.html (single source, reused on every page)
  toast.css   Shared toast styles (`.toasts`/`.toast*`, update prompt + "Updated" confirmation, `.toasts-top`, `.toast-amber`) — loaded by app.html, index.html AND bibs.html. App-only `.toast-action`/`.toast-btn` (Undo) stay in app.css.
  helpers.js  Pure helpers (UMD: window.CronoH + Node require) — unit-tested; loaded by app.html, index.html AND bibs.html (bibs uses `bibRange`; landing uses the shared `consentAccepted`/`CONSENT_VERSION`/`CONSENT_KEY`)
  i18n.js     Multilanguage engine + string tables (UMD; en/ro/es/de/fr/ja/zh/hi). data-i18n / data-i18n-attr in HTML; CronoI18n.t() in JS; lang in `crono.lang`. Legal text stays EN. Key parity across langs is tested. (Full app UI, the landing AND the bib generator are translated; consent uses data-i18n-html. Legal pages + CSV/PDF headers stay EN.)
  head.js     runs in <head> before paint: applies the light/dark theme (data-theme on <html>, from `crono.theme` or OS) + wires any [data-theme-toggle]; adds .js-anim unless reduced-motion. Loaded by every page.
  sw-register.js  SW registration + "new version" update toast (shared by app + landing)
  coffee.css  "Buy me a coffee" explainer modal styles (shared; loaded by app.html + index.html)
  coffee.js   "Buy me a coffee" explainer modal — intercepts [data-coffee] links, explains the voluntary tip, then opens Revolut (shared by app + landing)
  tour.js     First-run quick tour (app.html only) — a small in-house coachmark overlay (built in JS, CSP-safe; styles `.tour-*` live in app.css). Spotlights start → record → ranking tabs → Options → live display. Shows once (`crono.tour`), re-runnable via any `[data-tour-start]` control (the "Quick start guide" button in Options); i18n (`tour.*`) + reduced-motion aware; auto-starts only after the consent gate.
  og-image.png   1200x630 social-share image (og:image / twitter:image) — generated by tools/make-og.cjs
  qr-crono.svg   Fixed QR → https://crono.run, printed on each race bib (promo) — generated by tools/make-qr.cjs
  icon-180.png / icon-192.png / icon-512.png   PWA / home-screen icons (PNG; iOS apple-touch-icon = 180, manifest = 192/512 any+maskable) — generated by tools/make-icon.cjs (favicon.svg stays the browser-tab icon)
tools/make-og.cjs           One-off generator for assets/og-image.png (zero-dep, Node zlib). Not part of the build.
tools/make-qr.cjs           One-off generator for assets/qr-crono.svg (zero-dep byte-mode QR encoder). Re-run if the URL changes. Not part of the build/runtime.
tools/make-icon.cjs         One-off generator for assets/icon-*.png (zero-dep, Node zlib). Re-run if the logo changes. Not part of the build/runtime.
test/helpers.test.js        Node unit tests for pure helpers
test/architecture.test.js   Guards (cache↔Status, ASSETS exist, no inline CSS/JS, …) — `npm test` runs both. package.json (no deps).
```

## Hard rules (don't break)
1. **Zero-build, no dependencies / frameworks / bundlers.** Only vanilla HTML/CSS/JS. The one
   allowed external request is **Google Fonts** (Inter + Oswald), disclosed in Privacy.
2. **Offline-first is the whole point.** Open once online, then the entire app works with **no
   connection**; all data lives in `localStorage` on the device. No servers, no accounts, no
   analytics/tracking calls. **Never** add a feature that *requires* the network at race time, and
   never make data loss possible on reload/offline (Backup/Restore is the only cross-device path).
3. **Relative paths only** (served from the domain root at `crono.run`): `assets/...`, `app.html`, never `/assets/...`.
4. **Don't rename IDs/classes read by JS** when refactoring.
5. **JS style:** ES5-ish, `"use strict"`, `var`, small helpers, `// ----- Section -----` comments,
   no leaked globals. CSS/JS live in `assets/`. **No inline `<style>`/`<script>`** in the pages
   (a strict CSP `script-src 'self'` enforces this): the reduced-motion toggle is `head.js`,
   SW registration + update toast live in `sw-register.js` (shared). Pure helpers go in `helpers.js` (tested).
   A `<meta>` CSP is set on every page — if you add an external host, update it.
6. **Design tokens once** in `theme.css`; reuse `var(--…)`. Dark theme, lime accent `--primary:#a3e635`.
   For translucent tints use the rgb tokens: `rgba(var(--primary-rgb), .1)` (also `--accent-2-rgb` teal,
   `--accent-3-rgb` amber) — **don't** hardcode `rgba(163,230,53,…)`. Modal/scrim backdrops use `var(--overlay)`.
7. **No native confirm/alert for confirmations** — use `confirmModal()` (a single `prompt()` for one
   value is tolerated). Keep modern in-app UI.
8. **Accessibility/motion:** gate animations behind `prefers-reduced-motion` (landing uses a
   `.js-anim` class added only when motion is allowed); keep focus-visible states and big tap targets.
9. **Browser target:** modern evergreen + iOS/Safari. No transpiling.
10. **i18n — never hardcode user-facing text.** Every visible string lives in `assets/i18n.js`
    for **all 8 languages** (en/ro/es/de/fr/ja/zh/hi) and is shown via `data-i18n`/`data-i18n-attr`/
    `data-i18n-html` in HTML or `CronoI18n.t()`/`tn()` in JS — **never** a bare English literal in
    markup or `textContent`. When you add/change a string, update **all 8** tables in the same commit.
    `npm test` enforces this: identical key sets across languages, no empty values, and every
    `data-i18n*` key used in HTML must exist in the EN table. Pluralised counts use `tn(key, n)`
    with a `key.one` form per language. **Exceptions (English by design):** the standalone legal
    pages (`terms.html`/`privacy.html` + the in-app `#tpl-*` templates) and CSV/PDF export headers.

## Data model (localStorage)
Keys: `crono.startEpoch`, `crono.entries`, `crono.participants`, `crono.distanceKm`,
`crono.sound`, `crono.cards`, `crono.consent`, `crono.webhook` (optional results-push URL; `""`/absent = off — see below), `crono.theme` (`"light"`/`"dark"`; absent = follow OS — managed by `head.js`), `crono.lang` (UI language; absent = follow `navigator.language`, fallback EN — managed by `i18n.js`).
```
entry        = { id, runnerNumber: string, finishEpoch: ms, details: string }
participants = { "<number>": { name: string, sex: "M"|"F"|"", birthYear: number|null } }
startEpoch   = absolute ms; elapsed = finishEpoch - startEpoch (handles midnight)
backup JSON  = { app:"crono", v:1, exportedAt, startEpoch, distanceKm, entries, participants }
results push = { app:"crono", type:"results", v:1, exportedAt, startEpoch, distanceKm,
                 results:[{ place, categoryPlace, runnerNumber, name, sex, category, finishEpoch, elapsedMs, time, pace, note, duplicate }] }
```
**Live display + optional webhook (`app.js`):** `display.html` is a read-only mirror — a 2nd
tab/projector reads the same `localStorage` and re-renders on the cross-tab `storage` event
(zero network, offline). **Optional** results push: if the operator sets `crono.webhook` (a URL,
off by default), `save()` debounces a fire-and-forget `fetch` POST of the **results push** JSON
above — it never blocks recording and fails silently offline. A 5s heartbeat also re-sends when the
data changed since the last *successful* send (signature-guarded, so no spam), keeping the target
live and self-healing after a brief disconnect. This is the **only** outbound call,
so **`app.html` alone** relaxes its CSP to `connect-src 'self' https:` (the endpoint is a
user-typed arbitrary https host); `display.html` keeps strict `connect-src 'self'`. Disclosed in
Privacy; `CONSENT_VERSION` is **not** bumped (nothing leaves the device unless configured).
`consent` = `{ v: CONSENT_VERSION, at }`. Backups do NOT include consent.

## Code map — `assets/app.js` (section comments in this order)
Storage keys · State · Elements · Inline SVG icons (`ICONS`, `svgIcon`) · Time helpers in app
(`formatClock`, `clockStringToEpoch`, `escapeHtml/Attr`; the **pure** ones — `formatElapsed`,
`formatClockElapsed`, `formatPace`, `parseElapsedToMs`, `pad` — live in `helpers.js` and are aliased
at the top) · Persistence (`save`, `load`) · Sound (`beep`, `updateSoundToggle`) · Participants &
categories (`participantName`, `normalizeSex`, `ageCategory`, `buildFilterOptions`, `matchesFilter`,
`computePlaces`, cat editor) · Rendering (`render` — rows carry `data-id`, events delegated) · Actions
(`setStartNow`, `recordFinish`, `clearResults`, `updateStartPreview`, `updateElapsed` = live stopwatch) ·
CSV/PDF (`exportCSV`, `exportPDF`, `download`) · `importCSV`/`parseCsvLine` · Backup/Restore
(`exportBackup`, `importBackup`) · Participants modal (`openParticipants`, `renderParticipants`,
`addParticipant`) · Wire up (incl. delegated row listener + debounced search) · Consent gate ·
Doc modal (`openDoc`) · Row edit modal (`openRowEdit`/`saveRowEdit`/`deleteRowEdit`, `#rowModal`) ·
Toasts (`toast`) · Optional results webhook (`buildResultsPayload`/`pushWebhook`/`scheduleWebhook`) · Confirm modal (`confirmModal`) · Init.
SW registration + update toast are **not** here — they live in `assets/sw-register.js`.

## Patterns to follow (reuse these)
- **Edit a result:** rows are click-to-edit → `openRowEdit(id)` opens `#rowModal` (number/time/sex/
  year/note/delete). `editingRowId` holds the open entry; `saveRowEdit()` commits → `save()`, `render()`.
- **`render()` rebuilds `#resultBody` from scratch**; each `<tr>` carries `data-id`. Row open/edit is handled by **one delegated click/keydown listener on `$body`** (no per-row handlers) → `openRowEdit(id)`. Results search is **debounced** (~120ms).
- **Modals are focus-trapped** (see the Tab handler) and close on ESC/backdrop.
- **Modal recipe:** `.X-overlay` + `.show` class (all five overlays share one base rule in `app.css`;
  only `z-index` differs); on open set `document.body.style.overflow="hidden"`; on close restore it
  only if no other modal is open; support ESC + backdrop click. `confirmModal()` returns a
  `Promise<boolean>`. Stacking z-index: consent 1000, doc/participants/row 1100, confirm 1200, toasts 1300.
- **Icons:** `svgIcon(name)` for JS-built markup; inline `<svg class="icon">` for static HTML buttons.
- After changing categories/numbers, call `buildFilterOptions()` then `render()`.

## CSS — architecture & rules
**Files (load order):** `theme.css` (tokens — shared, loaded on every page) → the page file
(`app.css`, `site.css`, `bibs.css` or `legal.css`). `app.html` loads theme + app; `index.html`/`terms`/`privacy`
load theme + site (legal pages load legal.css); `bibs.html` loads theme + bibs. Splitting page CSS means each
page ships only what it needs **and** an edit touches one small file (cheaper to read/modify).

**Golden rule — tokens are the contract, not shared rule-blocks.** The app and landing deliberately
use different selectors (`button` vs `.btn`, `.icon` vs `.btn .icon`, …), so you usually *can't*
share a rule. Prevent drift by putting every **shared design decision** in `theme.css` as a token
and having both files consume it. If a value should look the same on both pages (a colour, the
accent, a radius, a shadow, a spacing step) it lives as `var(--…)` — **never** copy a literal into
both files. Even when selectors differ, both referencing the same token keeps them from diverging.

- Colours/tints: use the tokens — `--primary`, `rgba(var(--primary-rgb), …)` (also `--accent-2-rgb`,
  `--accent-3-rgb`), `--overlay`. Never hardcode `rgba(163,230,53,…)` or a hex that duplicates a token.
- Radii: `--radius` (cards/panels), `--radius-sm` (small), `--radius-input` (form fields). Buttons/pills stay `999px`.
- Also tokenised: `--btn-pad` (base button/`.btn` padding), `--transition` (hover/state), `--shadow-soft` / `--shadow-pop` (elevation). Reuse these instead of literals.
- The moment you're about to write the same literal in both `app.css` and `site.css`, stop and add a token instead.
- A genuinely-identical primitive needed on both pages (reset, base element)? Put it in the shared layer,
  not in both page files. Today only `theme.css` is shared; if that set grows, add a small `base.css`
  loaded before the page file — and update **Structure** above.

**Hygiene:** one rule per selector (merge, don't re-declare it elsewhere); one `@media` block per
breakpoint (don't scatter several `560px` blocks); no inline `<style>` (CSP); no dead/duplicate rules.
Any change to a **cached** CSS file → bump `sw.js` `CACHE` and refresh the **Status** block.

## Service worker / cache (IMPORTANT)
- `sw.js`: **network-first for everything — HTML pages AND static assets** (css/js/images). When online
  the server is asked first and the cache is updated; the cache is the **offline fallback**. This keeps a
  returning user's page and its CSS/JS **consistent in the same load** (no "one load behind" mismatch like
  new HTML + old styles). Versioned `CACHE = "crono-vN"`. (History: assets were stale-while-revalidate,
  which served a returning user the *previous* asset for the current load — that one-load gap is why the
  app could show new markup with old styling right after a deploy.)
- **All SW fetches bypass/validate the HTTP cache** so GitHub Pages' `max-age=600` can't serve stale
  bytes: precache uses `fetch(…, {cache:"reload"})`; the network-first fetch (HTML **and** assets) uses
  `fetch(…, {cache:"no-cache"})` (validate with the server, 304 when unchanged — cheap when nothing
  changed). Without this, GitHub Pages would hand back the *old* file and we'd re-store that stale copy.
  The SW main script is fetched from network by default (`updateViaCache:"imported"`), so a `CACHE` bump
  propagates on the next navigation.
- **Bump `CACHE` whenever any cached asset changes**, and keep the `ASSETS` precache list in sync.
  (Bumping drops the old cache + forces a fresh precache; network-first means returning online users are
  already current even before the new worker activates.)
- **Visible app version:** the app footer shows the running build in any `[data-app-version]` element —
  `sw-register.js` asks the active worker for its `CACHE` (via `GET_VERSION`) and fills it (e.g. `v120`).
  Single source = `sw.js` `CACHE`; since you bump it every deploy, the shown version updates automatically
  (and correctly shows the *current* build until the user clicks Reload). **No separate version constant to
  maintain** — just keep bumping `CACHE`.
- SW runs only over http(s) (GitHub Pages), not `file://`. Online, every load is current; offline serves
  the last-cached copy of each file.
- **Update lifecycle (never auto-reload — bad mid-race):** a freshly-installed worker does **not**
  `skipWaiting()` on its own — it stays in *waiting* and the running version is untouched. `sw-register.js`
  shows a dismissible **"new version" toast**; clicking **Reload** posts `{type:"SKIP_WAITING"}` to the
  waiting worker, which then activates + `clients.claim()`s, and the page reloads **once** on
  `controllerchange` (guarded so a first install / other-tab activation never triggers a reload). The
  toast also fires for a worker already `waiting` at load, and the tab re-checks `reg.update()` on refocus
  (throttled ~60s). If you ever change this, keep "no autonomous reload" intact.

## Privacy / legal
- Operator = **the Crono project**; contact via the GitHub repo. Governing law generic.
- Legal text exists twice: standalone `terms.html`/`privacy.html` AND in-app templates
  `#tpl-terms`/`#tpl-privacy` in `app.html` — **keep both in sync**.
- Bump `CONSENT_VERSION` in `helpers.js` if the terms change materially (it's the single source shared by the in-app gate and the landing consent gate — both read it via `CronoH`). Texts are templates, not legal advice.

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
- `node --check assets/app.js assets/site.js assets/sw-register.js sw.js`
- `node --test` (all green). Add a tiny test for any new **pure** helper in `helpers.js`.
- Confirm no inline `<style>`/`<script>` crept back into the pages; relative paths only.
- **Update `CHANGELOG.md`** (under `[Unreleased]`) for any notable user-facing change.
- **Refresh the `Status` block** (date + `CACHE` version) so the next session has an accurate handoff.

## Current features (don't re-implement)
Start time (+confirm) with a **live "time since start" stopwatch** in the Start card,
record on Enter/Record with **beep** (toggle), centiseconds, midnight-safe,
duplicates, per-row notes, **inline edit of number & time**, sex/age-category rankings via **tabs**,
**pace** (distance), **results search**, **participant manager** (add/edit/delete/search/CSV import),
**CSV + PDF (print) export**, **backup/restore JSON**, a **live results display** (`display.html`, opened
from the results header — read-only leaderboard for a 2nd screen/projector, mirrors the timer via the
cross-tab `storage` event), an **optional results webhook** (`crono.webhook`, off by default — POSTs
results JSON, re-syncs every 5s), consent + Terms/Privacy (the **same blocking
welcome gate on the app AND the landing** — both share `crono.consent`; standalone Terms/Privacy
pages too), **clicking the app logo returns to the landing**, **PWA**
(installable/offline) with a dismissible **"new version"
update toast** (never auto-reloads), animated landing, **bib-number generator** on its **own page** (`bibs.html`,
linked from the landing nav + orange band). Fields: event name, **race/proba**, date, number range, colour
(4 **presets** `--bib-orange/lime/blue/mono` **+ a `<input type=color>` for any colour**, with auto black/white
header text by luminance), and a logo by **upload (data URL, on-device) OR an https link** (the page's CSP relaxes
`img-src` to allow `https:`; a link needs a connection). Shows a **live WYSIWYG preview** of a sample bib and
prints **2 per A4** via `#printArea` + `@media print` (all in `bibs.css`); logic in `bibs.js`. The colour drives
`--bibc`/`--bibtext` set inline by JS.

## Known constraints / TODO ideas
- `addParticipant()` uses a `prompt()` for the new number (could become an inline row).
- PWA/home-screen icons are crisp PNGs (`assets/icon-180/192/512.png`, generated by `tools/make-icon.cjs`); favicon.svg stays the browser-tab icon.
- Perf bonus (not done): pause `updateElapsed` interval + the landing hero clock / `.hiw` mini-demo on `visibilitychange`
  (save battery when the tab is hidden).
- Possible next: waves/net time, splits/laps, multiple events, team scoring, i18n (RO/EN).
