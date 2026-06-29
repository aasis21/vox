<#
.SYNOPSIS
    Uninstall Vox: remove the extension from the Copilot CLI extensions dir.

.PARAMETER ExtensionsDir
    Copilot CLI extensions root. Default: ~/.copilot/extensions
#>
[CmdletBinding()]
param(
    [string]$ExtensionsDir = (Join-Path $env:USERPROFILE '.copilot\extensions')
)

$ErrorActionPreference = 'Stop'
$dest = Join-Path $ExtensionsDir 'vox'

Write-Host "== Vox uninstaller ==" -ForegroundColor Cyan
if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
    Write-Host "Removed: $dest"
} else {
    Write-Host "Not installed: $dest"
}
Write-Host "== Done ==" -ForegroundColor Green
