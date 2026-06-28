#!/usr/bin/env bash
# Install the Halo voice extension from a local checkout into Copilot CLI.
# Copies *.mjs into ~/.copilot/extensions/halo where the CLI auto-discovers it.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="${COPILOT_EXTENSIONS_DIR:-$HOME/.copilot/extensions}"
DEST="$EXT_DIR/halo"

echo "== Halo installer =="

if ! command -v node >/dev/null 2>&1; then
    echo "WARN: node not found on PATH. Halo needs Node.js; install from https://nodejs.org." >&2
fi

mkdir -p "$DEST"
rm -f "$DEST/registry.json"   # drop stale runtime state
cp "$HERE"/*.mjs "$DEST"/
echo "Copied   : *.mjs -> $DEST"

echo
echo "== Done =="
echo "Start a Copilot session and run:"
echo "    /halo        # start voice mode (open http://localhost:4321)"
echo "    /halo-stop   # stop for this session"
echo "    /halo-who    # list live Halo sessions"
