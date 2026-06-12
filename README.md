[![Crono banner](https://rungeorge.github.io/crono/images/preview.png)](https://rungeorge.github.io/crono/)

# Crono — Mini Web App

A simple, **offline** chronometer for small and in-house sport competitions
(running and beyond). No server, no build step, no dependencies — plain static
files you can open anywhere or host on GitHub Pages.

👉 **Live:** https://rungeorge.github.io/crono/ · **App:** https://rungeorge.github.io/crono/app.html

## Features
- Set and edit the start time (handles races that cross midnight)
- Record finishes instantly: type a runner number and press **Enter** / **Record**
- Centisecond precision (`HH:MM:SS.cc`)
- Import participants from CSV (`number, name, sex, birth year`); edit any of it inline
- Live rankings by **sex** and standard 10-year **age categories** (tab switcher)
- Optional **distance** → shows **pace** (min/km) per result
- Automatic placing, duplicate detection, per-row notes, inline edit of a bib number
- CSV export (place, category place, name, sex, category, time, pace)
- Consent / Terms gate; everything stays **local** in your browser, no tracking

## Project structure
```
index.html        Landing / presentation page  →  /crono
app.html          The chronometer app          →  /crono/app.html
terms.html        Redirect → app.html#terms
privacy.html      Redirect → app.html#privacy
favicon.svg       Logo mark
assets/
  theme.css       Shared design tokens (palette, fonts, radii)
  app.css         App styles
  app.js          App logic (vanilla JS, IIFE)
  site.css        Landing styles
images/           README/preview assets
```
Legal documents live as templates inside `app.html` and open in an in-app modal;
the `terms.html` / `privacy.html` pages just redirect there.

## Importing participants
CSV with one participant per line: `number, name, sex, birth_year`. A header row
is auto-detected and skipped; comma, semicolon and tab separators all work.
`sex` and `birth_year` are optional (without them a runner only appears in the
"All" ranking). Example:

```
number,name,sex,birth_year
12,Ana Popescu,F,1998
13,Mihai Ionescu,M,1986
```

## Tech
Plain HTML, CSS and vanilla JavaScript — no frameworks, no build tooling. Runs
fully offline; data is stored in `localStorage` on the device.
