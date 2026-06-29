<#
.SYNOPSIS
  One-line bootstrap installer for Vox (Windows).

.DESCRIPTION
  Clones (or updates) the Vox repo into $CheckoutDir, then runs setup.ps1 to
  copy the extension into ~/.copilot/extensions/vox.

  Designed to be run with:
    irm https://raw.githubusercontent.com/aasis21/vox/main/install.ps1 | iex
#>
[CmdletBinding()]
param(
    [string]$CheckoutDir = (Join-Path $env:USERPROFILE 'vox'),
    [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/aasis21/vox.git'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }

Step 'Checking prerequisites'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git not found on PATH. Install it first.' }
Ok 'git available'

if (Test-Path (Join-Path $CheckoutDir '.git')) {
    Step "Updating existing checkout at $CheckoutDir"
    Push-Location $CheckoutDir
    try {
        git fetch --quiet origin
        git checkout --quiet $Branch
        git pull --ff-only --quiet origin $Branch
        Ok "synced to origin/$Branch"
    } finally { Pop-Location }
} else {
    Step "Cloning $repo into $CheckoutDir"
    git clone --quiet --branch $Branch $repo $CheckoutDir
    Ok 'cloned'
}

Step 'Running setup.ps1'
Push-Location $CheckoutDir
try { & (Join-Path '.' 'setup.ps1') } finally { Pop-Location }
