#!/usr/bin/env bash
# Uninstall Halo: remove the extension from the Copilot CLI extensions dir.
set -euo pipefail
EXT_DIR="${COPILOT_EXTENSIONS_DIR:-$HOME/.copilot/extensions}"
DEST="$EXT_DIR/halo"
echo "== Halo uninstaller =="
if [ -d "$DEST" ]; then rm -rf "$DEST"; echo "Removed: $DEST"; else echo "Not installed: $DEST"; fi
echo "== Done =="
