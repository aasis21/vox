# Halo

**A hands-free voice panel for any GitHub Copilot session — talk to the agent out loud and hear it reply.**

Halo is a Copilot CLI extension. Run `/halo` and a single fixed UI comes up on
port `4321` with a reactive listening orb: speak your turn, the active session
hears it, and the reply is read back to you. Voice in, voice out.

> Sibling project to [`aasis21/engram`](https://github.com/aasis21/engram) and
> [`aasis21/anya`](https://github.com/aasis21/anya).

---

## Quick start

Requires **Node.js** and **git** on PATH. Run from any shell:

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/aasis21/halo/main/install.ps1 | iex
```

**macOS / Linux (bash):**

```bash
curl -fsSL https://raw.githubusercontent.com/aasis21/halo/main/install.sh | bash
```

That will:
1. Clone the repo to `~/halo` (or update it if already there).
2. Copy the extension into `~/.copilot/extensions/halo`, where Copilot CLI auto-discovers it.

Then start a Copilot session and run `/halo`.

## Commands

| Command | What it does |
|---------|--------------|
| `/halo` | Start Halo voice mode and make this session the active voice target. Opens `http://localhost:4321` — tap the orb. |
| `/halo-stop` | Stop Halo for this session and release its voice server. |
| `/halo-who` | List live Halo sessions and show which one is active. |

## Manual install / dev

From a local clone:

```powershell
.\setup.ps1            # Windows: copy into ~/.copilot/extensions/halo
```

```bash
./setup.sh             # macOS/Linux: copy into ~/.copilot/extensions/halo
```

## Uninstall

```powershell
.\uninstall.ps1        # Windows
```

```bash
./uninstall.sh         # macOS/Linux
```

## How it works

A `/halo` command spins up a small local server on port `4321` and registers the
session in `registry.json`. The browser canvas streams microphone audio in and
plays synthesized replies out, routing spoken turns to the active session. Many
sessions can be live at once; `/halo-who` shows which one is active.

## License

MIT
