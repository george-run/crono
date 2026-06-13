#!/bin/bash
# Crono SessionStart hook (web sessions). The project is zero-dependency, so there's nothing to
# install — instead we run the syntax checks + unit/architecture tests so any drift (stale CLAUDE.md,
# missing precache asset, inline CSS/JS, failing helper) is surfaced at the start of the session.
# Never aborts startup: it reports and exits 0.
set -uo pipefail

# Web-only; locally you run `npm test` yourself.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}" || exit 0

if ! command -v node >/dev/null 2>&1; then
  echo "node not found — skipping Crono checks."
  exit 0
fi

echo "Crono: syntax check (npm run check)…"
npm run --silent check || echo "‼️  Syntax check reported issues above."

echo "Crono: unit + architecture tests (npm test)…"
npm test --silent || echo "‼️  Tests reported issues above — fix before deploying (see test/architecture.test.js)."

echo "Crono checks done."
exit 0
