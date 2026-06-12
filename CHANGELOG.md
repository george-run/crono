# Changelog

All notable changes to Crono are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
### Added
- **Bib number generator** on the landing page (separate from timing, for use before race day): an orange, animated section + a header button open a modal where you set the event name, date, a number range and a colour theme (orange / lime / blue / black & white), and optionally upload a logo. It builds a clean, print-ready sheet (2 bibs per A4 page — big number, event name/date and logo) and opens the browser's print/"Save as PDF" dialog. Runs fully offline; the logo stays in memory and is never uploaded. New tested `bibRange` helper backs the range validation.
- A dismissible "New version available — Reload" toast when a fresh deploy is detected (never auto-reloads, so it can't interrupt a live race) — on both the app and the landing; SW registration is now a single shared `sw-register.js`.
- Live "time since start" stopwatch in the Start card — shows how long the race has been running (ticks every second, updates instantly when you change the start time). Also shown compactly (with a stopwatch icon) in the card's summary line when it's collapsed.

### Changed
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
