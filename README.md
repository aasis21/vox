# Vox

**A hands-free voice panel for any GitHub Copilot session — talk to the agent out loud and hear it reply.**

Vox is a Copilot CLI extension. Run `/vox` and a single fixed UI comes up on
port `4321` with a reactive listening orb: speak your turn, the active session
hears it, and the reply is read back to you. Voice in, voice out.

> Sibling project to [`aasis21/engram`](https://github.com/aasis21/engram) and
> [`aasis21/anya`](https://github.com/aasis21/anya).

---

## Features

- **Reactive listening orb** — a living orb that pulses with your mic level, with state-coded colors for ready, listening, thinking, and speaking.
- **Hands-free flow** — if mic permission is already granted, Vox opens straight into listening. Speak your turn and it sends automatically after a short pause, or tap the orb / press `Space` to send now.
- **Interrupt to talk** — tap the orb, press `Esc`, or hit Interrupt while the agent is speaking to cut it off and drop straight back into listening — no re-clicking the mic.
- **Live captions** — your speech streams in as interim text and commits as you go.
- **Speaks your typed replies too** — type directly into the Copilot CLI (not just voice) and Vox reads the assistant's reply aloud in the panel.
- **Transcript panel** — open the 📜 panel to read the full back-and-forth; close or clear it anytime.
- **Session routing** — the centered dropdown shows each live session as *name — id*; many sessions can be live at once and Vox follows the active one.
- **Keyboard shortcuts** — `Space` to talk / send, `Esc` to interrupt or stop.

---

## Quick start

Requires **Node.js** and **git** on PATH. Run from any shell:

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/aasis21/vox/main/install.ps1 | iex
```

**macOS / Linux (bash):**

```bash
curl -fsSL https://raw.githubusercontent.com/aasis21/vox/main/install.sh | bash
```

That will:
1. Clone the repo to `~/vox` (or update it if already there).
2. Copy the extension into `~/.copilot/extensions/vox`, where Copilot CLI auto-discovers it.

Then start a Copilot session and run `/vox`.

## Commands

| Command | What it does |
|---------|--------------|
| `/vox` | Start Vox voice mode and make this session the active voice target. Opens `http://localhost:4321` — tap the orb. |
| `/vox-stop` | Stop Vox for this session and release its voice server. |
| `/vox-who` | List live Vox sessions and show which one is active. |

## Manual install / dev

From a local clone:

```powershell
.\setup.ps1            # Windows: copy into ~/.copilot/extensions/vox
```

```bash
./setup.sh             # macOS/Linux: copy into ~/.copilot/extensions/vox
```

## Uninstall

```powershell
.\uninstall.ps1        # Windows
```

```bash
./uninstall.sh         # macOS/Linux
```

## How it works

A `/vox` command spins up a small local server on port `4321` and registers the
session in `registry.json`. The browser canvas streams microphone audio in and
plays synthesized replies out, routing spoken turns to the active session. A
persistent `/listen` channel also streams replies from **typed** CLI turns to the
panel so they're spoken too. Many sessions can be live at once; `/vox-who` shows
which one is active.

## License

MIT
