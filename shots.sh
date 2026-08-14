#!/usr/bin/env bash
# Capture the site in both themes at three widths, for design review.
#
#   ./shots.sh              # all themes + widths -> .shots/
#   ./shots.sh 1440 dark    # just one
#
# The theme is normally chosen by main.js from localStorage / prefers-color-scheme,
# neither of which is reachable from the Chrome CLI. So we render a throwaway copy
# of index.html with the theme pinned, and delete it on exit.

set -euo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME"; exit 1; }

OUT=".shots"
TMP=".shot-tmp.html"
mkdir -p "$OUT"
trap 'rm -f "$TMP"' EXIT

WIDTHS=("${1:-}")
[ -z "${WIDTHS[0]}" ] && WIDTHS=(500 900 1440)
THEMES=("${2:-}")
[ -z "${THEMES[0]}" ] && THEMES=(light dark)

for theme in "${THEMES[@]}"; do
  # pin the theme after main.js has run, so its own init can't override us
  python3 - "$theme" <<'PY'
import sys
theme = sys.argv[1]
src = open("index.html").read()
tag = '<script src="main.js"></script>'
src = src.replace(tag, tag + f'\n<script>document.documentElement.setAttribute("data-theme","{theme}");</script>')
open(".shot-tmp.html", "w").write(src)
PY

  for w in "${WIDTHS[@]}"; do
    # height is generous; Chrome captures the viewport, not the full page
    "$CHROME" --headless --disable-gpu --hide-scrollbars \
      --window-size="${w},1400" \
      --virtual-time-budget=6000 \
      --screenshot="$OUT/${theme}-${w}.png" \
      "file://$PWD/$TMP" 2>/dev/null
    echo "  $OUT/${theme}-${w}.png"
  done
done

echo
echo "Note: Chrome enforces a minimum window width around 485px on macOS,"
echo "so a request below that renders wider than asked and the capture clips."
