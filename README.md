[![Crono banner](https://rungeorge.github.io/crono/images/preview.png)](https://rungeorge.github.io/crono/)

# Crono — Mini Web App

A simple, **offline** chronometer for small and in-house sport competitions
(running and beyond). No server, no build step, no dependencies — a single
`index.html` you can open anywhere or host on GitHub Pages.

👉 **Live:** https://rungeorge.github.io/crono/

## Features
- Set and edit the start time (handles races that cross midnight)
- Record finishes instantly: type a runner number and press **Enter**
- Centisecond precision (`HH:MM:SS.cc`)
- Import a participant list from CSV (`number,name`) to show names in results
- Automatic placing and duplicate detection
- Add a note/observation to any result
- Remove a single result or clear everything
- Export all results to CSV
- Data is stored locally in your browser — works fully offline

## Importing participants
Provide a CSV file with one participant per line. The first column is the
runner number, the second is the name. A header row (e.g. `number,name`) is
detected and skipped automatically. Comma, semicolon and tab separators are
all supported.

```
number,name
12,Ana Popescu
13,Mihai Ionescu
```

## Tech
Plain HTML, CSS and vanilla JavaScript — no frameworks, no build tooling.
