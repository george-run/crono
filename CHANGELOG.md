# Changelog

All notable changes to Crono are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
### Changed
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
