#!/usr/bin/env bash
# Uninstall Vox: remove the extension from the Copilot CLI extensions dir.
set -euo pipefail
EXT_DIR="${COPILOT_EXTENSIONS_DIR:-$HOME/.copilot/extensions}"
DEST="$EXT_DIR/vox"
echo "== Vox uninstaller =="
if [ -d "$DEST" ]; then rm -rf "$DEST"; echo "Removed: $DEST"; else echo "Not installed: $DEST"; fi
echo "== Done =="
