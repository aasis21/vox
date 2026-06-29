<#
.SYNOPSIS
    Install the Vox voice extension from a local checkout into Copilot CLI.

.DESCRIPTION
    Run from a cloned copy of the repo. Copies Vox's extension files to the
    Copilot CLI extensions directory (~/.copilot/extensions/vox) where the CLI
    auto-discovers it. Then run `/vox` in any session to talk hands-free.

    For a one-line install without a manual clone, use install.ps1 instead:
        irm https://raw.githubusercontent.com/aasis21/vox/main/install.ps1 | iex

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

Write-Host "== Vox installer ==" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning "node was not found on PATH. Vox needs Node.js to run; install it from https://nodejs.org."
}

$dest = Join-Path $ExtensionsDir 'vox'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# Wipe stale runtime registry so sessions re-register cleanly.
$staleReg = Join-Path $dest 'registry.json'
if (Test-Path $staleReg) { Remove-Item -Force $staleReg }

Copy-Item -Path (Join-Path $here '*.mjs') -Destination $dest -Force
Write-Host "Copied   : *.mjs -> $dest"

Write-Host "`n== Done ==" -ForegroundColor Green
Write-Host "Start a Copilot session and run:" -ForegroundColor Cyan
Write-Host "    /vox        # start voice mode (open http://localhost:4321)"
Write-Host "    /vox-stop   # stop for this session"
Write-Host "    /vox-who    # list live Vox sessions"
