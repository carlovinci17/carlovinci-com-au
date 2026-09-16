#!/usr/bin/env bash
# Measure real text contrast on the rendered page, per WCAG 2.1 1.4.3.
#
#   .claude/skills/contrast-check/contrast.sh            # both themes
#   .claude/skills/contrast-check/contrast.sh dark       # one theme
#   .claude/skills/contrast-check/contrast.sh light 900  # theme + viewport width
#
# Colours here are oklch() and color-mix(), which no string parser should be
# trusted to evaluate. So we don't parse: Chrome resolves every colour and a
# canvas does the alpha compositing. What comes back is the pixel a person
# actually sees.
#
# Same theme-pinning trick as shots.sh — main.js picks the theme from
# localStorage / prefers-color-scheme, neither reachable from the Chrome CLI.
#
# Exit 0 = everything at or above the floor, 1 = at least one failure.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../../.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME"; exit 2; }

TMP=".contrast-tmp.html"
trap 'rm -f "$TMP"' EXIT

THEMES=("${1:-}")
[ -z "${THEMES[0]}" ] && THEMES=(light dark)
WIDTH="${2:-1440}"

FAILED=0
for theme in "${THEMES[@]}"; do
  python3 "$HERE/inject.py" "$theme" "$HERE/audit.js" "$TMP"

  echo "── $theme @ ${WIDTH}px ─────────────────────────────────"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size="${WIDTH},1400" \
    --virtual-time-budget=6000 \
    --dump-dom "file://$PWD/$TMP" 2>/dev/null |
    python3 "$HERE/report.py" || FAILED=1
  echo
done

exit $FAILED
