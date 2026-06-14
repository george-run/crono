# Changelog

All notable changes to Crono are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
_Everything since 0.1.0 — the big modernization cycle._

### Added
- **Multi-language (8 languages).** English, Romanian, Spanish, German, French, Japanese, Chinese, Hindi — a picker switches instantly and remembers the choice (`crono.lang`), zero-dependency and offline. The whole app, landing and bib generator are translated (legal pages + CSV/PDF headers stay English).
- **Light theme** alongside the dark default — a sun/moon toggle, follows the device by default, applied before first paint (no flash), on every page.
- **Bib-number generator on its own page (`bibs.html`).** Live WYSIWYG preview, event/race/date fields, any colour (presets + picker, auto black/white header text), logo by upload or https link, prints 2 per A4 — with a small QR to crono.run on each bib.
- **Live results display (`display.html`)** for a second screen / projector — a big, auto-updating leaderboard (Place · # · Name · Time · Pace) with ranking tabs and a live clock. Mirrors the timer **live with zero network** (cross-tab storage), read-only, offline. Opened from the "Live display" button in the results header.
- **Optional results webhook.** Paste a URL in Options and Crono POSTs the results as JSON — instantly on change and re-synced every 5s. Opt-in, off by default, fire-and-forget (never blocks recording, fails silently offline); disclosed in Privacy.
- **Install as an app (PWA).** Install guides for iPhone/Android/desktop + a one-click Install button where supported, and crisp PNG home-screen icons.
- **Consent/Terms gate on the landing** (shared with the app's gate), and the app logo links back to the landing.
- **SEO & social sharing** — Open Graph + Twitter cards, canonical URLs, `sitemap.xml`/`robots.txt`, a branded share image.
- **Live "time since start" stopwatch** in the Start card, and a shared, dismissible "new version" update toast (never auto-reloads).

### Changed
- **Moved to the custom domain `crono.run`.**
- **Consistent header toolbar** (language · theme · support) on every page; the brand mark renders the same size/font everywhere.
- **Landing overhaul.** Clear "for organisers" messaging; hero with one primary CTA + three value-prop chips; an animated **"How it works"** mini-demo (a runner reaches the finish, a volunteer types the bib on a laptop, a ranked board fills with time & pace); feature cards for the new live display and webhook. Headings/numbers use the Oswald display font; animated SVG hero scene.
- **Service worker is network-first when online** (HTML *and* assets), so a returning user always gets the current page with its current styles — no "one load behind" stale UI after a deploy; the cache stays the offline fallback. The "new version" flow **waits for Reload** and never interrupts a live race.
- **App UX & accessibility pass.** Destructive confirmations focus Cancel; "Undo" on record; compact results summary line; click-to-edit rows via one delegated listener; debounced search; colours routed through design tokens.
- **Donation button** opens a short "voluntary tip, not a payment" explainer before Revolut.

### Fixed
- **Deploys now reliably reach returning users**, and the update toast no longer loops on iOS or nags on every page navigation.
- **Layout fixes for longer languages** — the Start time input + "Set now" button wrap instead of overflowing, and collapsible section labels no longer break mid-word in Japanese/Chinese.
- Standalone Terms/Privacy use a shared `legal.css` (no inline `<style>`).

### Removed
- The legacy in-app demo modal and the landing's old auto-play demo mock (superseded by the "How it works" mini-demo), plus their now-unused i18n keys.


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
