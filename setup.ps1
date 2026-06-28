<#
.SYNOPSIS
    Install the Halo voice extension from a local checkout into Copilot CLI.

.DESCRIPTION
    Run from a cloned copy of the repo. Copies Halo's extension files to the
    Copilot CLI extensions directory (~/.copilot/extensions/halo) where the CLI
    auto-discovers it. Then run `/halo` in any session to talk hands-free.

    For a one-line install without a manual clone, use install.ps1 instead:
        irm https://raw.githubusercontent.com/aasis21/halo/main/install.ps1 | iex

.PARAMETER ExtensionsDir
    Copilot CLI extensions root. Default: ~/.copilot/extensions

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\setup.ps1
#>
[CmdletBinding()]
param(
    [string]$ExtensionsDir = (Join-Path $env:USERPROFILE '.copilot\extensions')
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "== Halo installer ==" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning "node was not found on PATH. Halo needs Node.js to run; install it from https://nodejs.org."
}

$dest = Join-Path $ExtensionsDir 'halo'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# Wipe stale runtime registry so sessions re-register cleanly.
$staleReg = Join-Path $dest 'registry.json'
if (Test-Path $staleReg) { Remove-Item -Force $staleReg }

Copy-Item -Path (Join-Path $here '*.mjs') -Destination $dest -Force
Write-Host "Copied   : *.mjs -> $dest"

Write-Host "`n== Done ==" -ForegroundColor Green
Write-Host "Start a Copilot session and run:" -ForegroundColor Cyan
Write-Host "    /halo        # start voice mode (open http://localhost:4321)"
Write-Host "    /halo-stop   # stop for this session"
Write-Host "    /halo-who    # list live Halo sessions"
