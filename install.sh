#!/usr/bin/env bash
# One-line bootstrap installer for Vox (macOS / Linux):
#   curl -fsSL https://raw.githubusercontent.com/aasis21/vox/main/install.sh | bash
# Clones/updates the repo into ~/vox, then runs setup.sh.
set -euo pipefail

REPO="https://github.com/aasis21/vox.git"
CHECKOUT_DIR="${VOX_DIR:-$HOME/vox}"
BRANCH="${VOX_BRANCH:-main}"

command -v git >/dev/null 2>&1 || { echo "git not found on PATH. Install it first." >&2; exit 1; }

if [ -d "$CHECKOUT_DIR/.git" ]; then
    echo "=== Updating existing checkout at $CHECKOUT_DIR ==="
    git -C "$CHECKOUT_DIR" fetch --quiet origin
    git -C "$CHECKOUT_DIR" checkout --quiet "$BRANCH"
    git -C "$CHECKOUT_DIR" pull --ff-only --quiet origin "$BRANCH"
else
    echo "=== Cloning $REPO into $CHECKOUT_DIR ==="
    git clone --quiet --branch "$BRANCH" "$REPO" "$CHECKOUT_DIR"
fi

echo "=== Running setup.sh ==="
bash "$CHECKOUT_DIR/setup.sh"
