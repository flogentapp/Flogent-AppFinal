$ErrorActionPreference = "Stop"

$source = Resolve-Path "$PSScriptRoot\.."
# We assume the user has cloned the repo to Flogent-Live
$dest = "$PSScriptRoot\..\..\Flogent-Live" 
# Resolve-Path throws if it doesn't exist, so we use string path for safety check
if (-not (Test-Path $dest)) {
    Write-Error "Could not find Flogent-Live folder. Did you clone it?"
    exit 1
}
$dest = Resolve-Path $dest

Write-Host "Syncing Dev ($source) -> Live ($dest)..." -ForegroundColor Yellow

# Robocopy /MIR ensures the Live folder matches Dev exactly
# CRITICAL: /XD .git ensures we keep the fresh git history from the clone
robocopy $source $dest /MIR `
  /XD .git .next .vercel node_modules .idea .vscode `
  /XF .env .env.local .DS_Store sync_to_live.bat sync_to_live.ps1

Write-Host "SYNC COMPLETE. You are ready to push." -ForegroundColor Green
