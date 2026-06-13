# Changelog

All notable changes to Crono are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
### Added
- **Consistent header toolbar on every page.** Language, theme (sun/moon) and Support now live in one shared toolbar (`assets/toolbar.css`) on the landing, the app and the bib generator — the same controls are always one tap away, with **Open app** kept as the prominent primary action. The bib generator previously had neither the language picker nor these controls; it now does, and **its form is fully translated** too. (Demo lives in the app header only, where it opens the in-app demo; it was removed from the landing/bib toolbars.)
- **Multi-language.** Crono can now run in **English, Romanian, Spanish, German, French, Japanese, Chinese and Hindi**. A language picker (in the app header and the landing nav) switches instantly and remembers the choice (`crono.lang`); with no choice it follows the device language. Built zero-dependency and offline-first (`assets/i18n.js`), with system fonts covering Japanese/Chinese/Hindi. **The whole app and the landing page are translated** — including ranking tabs/categories, toasts, confirm dialogs, the participants/edit/demo modals, the empty states (all re-render live on switch) and the full marketing copy, FAQ and consent gate. CSV/PDF export headers stay English for data portability, and the legal pages (Terms/Privacy) stay English by design.
- **Light theme.** Crono now has a light mode alongside the dark default. A sun/moon toggle in the app header switches it and remembers your choice (`crono.theme`); with no choice it follows your device's setting. The theme is applied before first paint (via `head.js`) so there's no flash, and it carries across every page (app, landing, bibs, legal).
- **"Buy me a coffee" now opens a short explainer first.** Every donation button (app header, app footer, landing footer) opens a small modal that makes clear the tip is **voluntary** and **not a payment for the app** before sending you to Revolut (which still opens in a new tab). Shared, CSP-safe modal in `assets/coffee.js` + `assets/coffee.css`; links keep their `href` so they still work without JS.
- **"Updated to the latest version" confirmation.** Clicking **Reload** on the update toast now shows a brief confirmation after the page reloads, so the action gives visible feedback (the app looks identical between versions, so it otherwise felt like nothing happened).
- **Immediate feedback on Reload.** The button now shows **"Updating…"** and disables itself the moment it's clicked, since activating the new worker and reloading can take a second or two (it previously looked like nothing was happening).
- **"Install Crono" button now does something on iPhone/iPad.** iOS Safari can't install a PWA programmatically (no `beforeinstallprompt`), so the button used to stay hidden / inert there; it's now shown on iOS and, when a one-tap install isn't possible, scrolls to and highlights the iPhone "Add to Home Screen" steps.

### Changed
- **Update prompt is now amber and shown near the top.** The "New version available" toast moved from the bottom-lime style to **amber, anchored at the top** of the screen so it's easier to notice (other toasts stay at the bottom).
- **App header redesign.** The "View demo" and donation buttons are now grouped into a single rounded **toolbar** (panel background, soft border/shadow) instead of two loose icon circles — "Demo" reads teal, "Support" amber, each shown as **icon + label** on desktop and collapsing to **icon-only** on small screens. The logo mark sits in a subtle lime chip so the brand reads stronger. The demo icon is now a monitor-with-play (clearer than the bare triangle), and the toolbar aligns to the logo row on mobile instead of drifting down beside the tagline.
- **The app no longer auto-focuses the runner-number field on entry.** On mobile this popped the numeric keyboard up immediately, covering the page; focus still moves there after you record a finish (or clear results), where typing the next number is expected.
- **`og:image:type` on every page** (plus `og:image` width/height on the Terms/Privacy pages) so link unfurlers that need it — notably WhatsApp — recognise the share image.

- **Note on WhatsApp previews:** the custom share image (`assets/og-image.png`, ~762 KB) unfurls on Facebook but **not** on WhatsApp, which silently drops over-sized OG images (~300 KB ceiling). Adding `og:image:type` doesn't change that — a re-optimised image under ~300 KB (1200×630) is needed for WhatsApp to show it. (`tools/make-og.cjs` can generate a ~54 KB brand fallback if wanted.)

### Fixed
- **Update toast no longer loops on iOS when "Reload" can't swap the worker.** On iOS Safari (especially with many tabs holding the old worker) `skipWaiting` may not hand over control, so the worker stayed *waiting* and the toast reappeared after every reload. Clicking **Reload** now also remembers the version as accepted (like ×), breaking the loop; a genuinely newer deploy still prompts.
- **Update toast layout fixed on narrow screens.** The message used to wrap one word per line next to the buttons; it now flexes properly within a sensible width, and the text was shortened to "New version available" so the toast stays compact on phones.
- **Deploys now actually reach returning users (root cause of the update-toast loop).** The service worker's stale-while-revalidate refresh fetched assets with the *default* HTTP cache, so GitHub Pages' `max-age=600` handed back the **old** file and the worker re-stored that stale copy — meaning a fresh deploy never propagated to people who already had the app cached (only a brand-new worker's precache, which bypasses the HTTP cache, ever got fresh files). The background revalidation and the network-first HTML fetch now use `cache: "no-cache"` (validate with the server, 304 when unchanged), matching the precache, so new code lands on the next load.
- **"A new version is available" toast no longer nags on every page.** If you dismissed it with **×** (instead of clicking **Reload**), the new service worker stayed in its *waiting* state forever, so every navigation between pages (landing ↔ app ↔ bibs ↔ legal) re-detected it and popped the toast again. The toast now remembers the exact version you dismissed (the worker reports its cache version on request) and stays quiet until a genuinely newer deploy arrives — **Reload** still updates immediately as before.

### Changed
- Updated the "Buy me a coffee" donation link to the current Revolut handle (`revolut.me/rungeorge`).
- **Social-share (OG) image.** Now custom artwork, optimised with a zero-dependency Node PNG pipeline: re-encoded to the exact **1200×630** OG size (was 1424×752, mismatching the meta), alpha flattened onto the brand background, adaptive per-row PNG filtering — roughly halving the file (**1.4 MB → ~760 KB**). (The built-in `tools/make-og.cjs` generator was also sharpened — 4× AA, fixed an inverted glyph — but the live image is the custom art.)
- **App UX & accessibility pass.** Destructive confirmations now focus **Cancel** instead of the destructive button, so a stray Enter can't wipe results or restore a backup by accident. Recording a finisher now shows a brief **"Recorded #N"** toast with an **Undo** button (a safety net for a mis-tap; only the latest one is kept). The big runner-number field shows a faint **#** hint instead of a literal **0** that looked like a value. The separate three-box stats panel became a **compact summary line inside the results card** — the participant and duplicate counts appear only when non-zero — so the finisher list sits higher on the page. Result rows now expose `role="button"` and a descriptive `aria-label`, and the ranking tabs set `aria-selected`. Tidied two hard-coded colours into design tokens and unified focus-outline offsets.
- **Landing hero leads with one clear action.** The hero now shows a single primary CTA ("Launch the timer") plus "See features"; the donation button moved out of the hero and stays in the footer.
- **"New version" update flow is now honest and non-disruptive.** Previously the freshly-deployed service worker activated itself immediately (`skipWaiting`), so the "Reload to update" toast appeared *after* the new version had already taken over. Now the new worker **waits**: the running version is left untouched until you click **Reload**, which tells the worker to take over and reloads the page exactly once (it still never reloads on its own, so it can't interrupt a live race). It also catches an update that finished installing on an earlier visit, and re-checks for updates when a long-open tab regains focus. Fixed the toast on the landing page so it fades in/out like the app's (it was popping in abruptly).
- Moved to the custom domain **crono.run**: added a `CNAME` file (so it survives deploys) and pointed all absolute URLs (canonical, Open Graph, sitemap, robots) at `https://crono.run/`. Paths stay relative, so the app still works from any base.

### Added
- **Bib-number generator is now its own page (`bibs.html`).** Moved out of the landing modal into a dedicated page (linked from the nav + the orange band) with a **live WYSIWYG preview** that updates as you type. New: a **race/event** field (in addition to event name + date); **any colour** via a colour picker alongside the four presets (header text auto-switches black/white for legibility); and a **logo by upload _or_ https link** (link loads from the web — the page's CSP allows `https:` images; uploads stay on-device). Still prints 2 bibs per A4. Generator logic + styles now live in `bibs.js` / `bibs.css`.
- **Consent / Terms gate on the landing page**: the landing now shows the same blocking "Welcome to Crono" modal as the app (review + accept the Terms and Privacy Policy before continuing — checkbox enables the "Accept & continue" button; the gate is focus-trapped and can't be dismissed without accepting). It shares the app's `crono.consent` storage, so accepting on the landing also satisfies the in-app gate (and vice-versa). The consent key + version are now single-sourced in `helpers.js` (new tested `consentAccepted` helper) so the app and landing can't drift.
- **Click the app logo to return to the landing**: the logo/"Crono" wordmark in the app header is now a link to the home page. The existing "you have unsaved results" prompt (`beforeunload`) still warns before leaving when there are recorded finishers, so nothing is lost by accident.

### Added
- SEO & social sharing: Open Graph + Twitter Card meta on every page, per-page canonical URLs and unique titles/descriptions, a branded 1200×630 share image (`assets/og-image.png`, generated by `tools/make-og.cjs`), plus `robots.txt` and `sitemap.xml`. (Absolute URLs point at the current GitHub Pages address — find-replace them when moving to a custom domain.)
- **Bib number generator** on the landing page (separate from timing, for use before race day): an orange, animated section + a header button open a modal where you set the event name, date, a number range and a colour theme (orange / lime / blue / black & white), and optionally upload a logo. It builds a clean, print-ready sheet (2 bibs per A4 page — big number, event name/date and logo) and opens the browser's print/"Save as PDF" dialog. Runs fully offline; the logo stays in memory and is never uploaded. New tested `bibRange` helper backs the range validation.
- A dismissible "New version available — Reload" toast when a fresh deploy is detected (never auto-reloads, so it can't interrupt a live race) — on both the app and the landing; SW registration is now a single shared `sw-register.js`.
- Live "time since start" stopwatch in the Start card — shows how long the race has been running (ticks every second, updates instantly when you change the start time). Also shown compactly (with a stopwatch icon) in the card's summary line when it's collapsed.

### Added
- Landing "Install it like an app" section + an FAQ entry: step-by-step PWA install guides for iPhone/iPad (Safari → Share → Add to Home Screen), Android (Chrome menu → Install app) and desktop (address-bar install icon). A one-click **Install Crono** button appears in that section when the browser supports it (Android/desktop Chromium); iOS falls back to the on-page steps.

### Fixed
- Landing housekeeping: the footer "How it works" link pointed at `#` (dead) — it now jumps to the steps section (and a new "Install" link was added). Reworded the hero/closing copy that said "no install needed" since the app is now installable (it's optional).

### Changed
- Landing review pass: copy now makes clear Crono is **for race organisers** and **runs in any browser — installing the PWA is optional** (hero, install section, closing CTA, meta/title). Moved the "Print bib numbers" section below "How it works" so the core timing story comes first; made "Open app" the primary nav action; trimmed duplicated demo wording.
- Hero animation: the floating result card no longer bobs in place — it now trails the moving pin along the route (driven in JS off the same path), so it reads as a live result following the runner.
- Typography: display font (headings + big race/bib numbers) switched from Space Grotesk to **Oswald** — a condensed, athletic face that suits race numbers; body stays Inter. The landing "how it works" demo now also shows the start time and distance being filled in before the timing starts, so the full flow is clear.
- Landing demo no longer makes the page jump: the finisher list now reserves space for its full set, so filling/resetting the auto-play loop doesn't grow/shrink the layout. Also fixed the orange "Generate bib numbers" button showing no label and the bib modal's logo field overflowing on iOS.
- Standalone Terms/Privacy pages now load a shared `assets/legal.css` instead of an inline `<style>` (their CSP was tightened to drop `'unsafe-inline'`), bringing them in line with the no-inline-CSS rule.
- Added `test/architecture.test.js` — automated guards (cache↔docs sync, precache list, no inline CSS/JS, relative paths) so the rules in CLAUDE.md can't silently drift.
- Results performance: row clicks now use one delegated listener (instead of re-binding handlers on every row each render), and the results search is debounced — smoother with large fields. New tested `formatClockElapsed` helper backs the live stopwatch.
- Service worker: static assets now use stale-while-revalidate (instant load + the cache self-heals on the next visit), and the precache bypasses GitHub Pages' HTTP cache so a fresh deploy never stores stale files — fewer "hard refresh to see the update" moments.
- CSS housekeeping (no visual change): lime/teal/amber tints now route through rgb tokens (`--primary-rgb`, etc.) and modal backdrops through `--overlay`, so the accent is truly single-source; the five modal overlays share one base rule; removed dead/duplicate rules and a print-selector typo. Extended the token set to cover form-field radius, button padding, transitions and shadows so app/landing stay in sync from one place.
- "Record" now sits on its own full-width row with the label truly centred (the stopwatch icon is pinned to the left), so it reads as centred at every width.
- Landing on mobile: hero CTAs now stack as equal full-width buttons (instead of ragged widths), the decorative background route is softened so it no longer cuts across them, and "Launch the timer" uses the same stopwatch icon as the app.
- All action-button labels are now centred (Record + the Options actions), on desktop and mobile.
- Refreshed icons: the "Record" button now uses a stopwatch (and its label is centred), "Export PDF" a clean document icon, and "Participants" the standard people icon.
- Toned down the "Record" button: rounded-rectangle corners (matching the rest of the UI) instead of a full pill, and slightly less tall.
- Decluttered the app header: logo on the left, the "View demo" and donation links are now compact icon-only buttons on the right, and the "Works offline" badge was removed from the header (the offline message still lives on the landing/FAQ).
- The demo mocks (landing + in-app) use a grey palette and show a small "DEMO" watermark so they read clearly as illustrations, not live UI.

### Added
- In-app "View demo" button (header) opens an auto-playing usage demo modal.

### Added
- Animated "how it works" demo on the landing: shows setting start+distance, then bibs being entered and finishers appearing live (respects reduced-motion).

### Changed
- Copy: emphasise offline use (open once online, then works with no connection) and that data is saved on the device and not lost; new "Will I lose my data?" FAQ.

### Changed
- Spacing fixes: the sound toggle no longer overlaps the capture label (now inline); more breathing room between stacked setup fields on mobile.
- Remember each collapsible card (Start time / Options) open-or-closed state in localStorage.
- Move data actions (Participants, Export CSV/PDF, Backup, Restore, Clear) into a separate collapsed “Options” card; the “Start time” card now holds only start + distance (with inline explanations).
- Replaced the hero photo with an animated SVG map scene: a faint street grid + a self-drawing route + a map pin moving start→finish; live-clock card moved to the right. Same map+pin animation added to the app empty state. Removed images/runner.png.

### Added
- `CHANGELOG.md` and a richer `CLAUDE.md` (data model, code map, env constraints, deploy commands).
- Landing animations (scroll-reveal, self-drawing route, live demo clock) — respects reduced-motion.
- **Sticky capture bar** — the number input + Record stay reachable while scrolling results.
- **Toast notifications** replacing blocking `alert()`s (import, restore, errors, saves).
- "Buy me a coffee" donation link (Revolut) in landing hero + footer and the app header + footer.

### Changed
- Result rows are now click-to-edit: tapping a row opens a single **Edit result** modal
  (number, finish time, sex, birth year, note, delete), replacing the inline per-cell editors.

## [0.1.0] — 2026-06-12
First modernized release — a full rewrite from the original jQuery/Bootstrap template into a
zero-build, offline, vanilla web app.

### Added
- Modern dark UI with lime accent; Inter + Space Grotesk typography; logo mark + favicon.
- Landing page (`index.html`) with hero, features, "how it works", FAQ and animations
  (scroll-reveal, self-drawing route, live demo clock, floating result card) — respects
  `prefers-reduced-motion`. App lives at `app.html`.
- Timing: set/edit start (with confirm), record on Enter/Record, centisecond precision,
  midnight-safe elapsed, duplicate detection, per-row notes.
- **Beep** on record (Web Audio, toggle, on by default).
- Inline editing of a runner's **number** and **finish time**.
- **Rankings** by sex and standard 10-year age categories via a tab switcher.
- **Pace** (min/km) when a distance is set; shown in results and exports.
- **Results search** by number/name.
- **Participant manager** modal: add/edit/delete/search + CSV import (`number,name,sex,birth_year`).
- **Export**: CSV and PDF (via print). **Backup/Restore** the whole event as JSON.
- **PWA**: installable, offline service worker.
- Consent gate + Terms & Privacy (in-app modal in the app; standalone pages from the landing).

### Changed
- Refactored into separate static files: `assets/{theme,app,site}.css`, `assets/{app,site}.js`.
- Removed Google Analytics / Hotjar; only Google Fonts is loaded externally (disclosed in Privacy).

### Removed
- Legacy jQuery, Bootstrap and ~hundreds of unused plugin files; old `table-to-csv.js`.
