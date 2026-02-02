$ErrorActionPreference = "Stop"

$livePath = Resolve-Path "..\Flogent-Live"
$backupPath = Resolve-Path "..\Flogent-Live - Copy"
$devPath = Resolve-Path "$PSScriptRoot\.." # Correctly identify project root

Write-Host "STARTING RECOVERY..."
Write-Host "1. Backup Path: $backupPath"
Write-Host "2. Live Path (Corrupted): $livePath"

# Step 1: Remove Corrupted Live Folder
Write-Host "Removing corrupted folder..." -ForegroundColor Yellow
if (Test-Path $livePath) {
    Remove-Item -Path $livePath -Recurse -Force
}

# Step 2: Restore from Backup
Write-Host "Restoring from backup..." -ForegroundColor Yellow
Copy-Item -Path $backupPath -Destination $livePath -Recurse

# Step 3: Safe Sync
Write-Host "Syncing new features (SAFE MODE)..." -ForegroundColor Yellow
$dest = $livePath

# Robocopy 
# /MIR : Mirror directory tree
# /XD .git : CRITICAL - Exclude .git folder
# /XF : Exclude specific files
robocopy $devPath $dest /MIR `
  /XD .git .next .vercel node_modules .idea .vscode `
  /XF .env .env.local .DS_Store sync_to_live.bat sync_to_live.ps1

Write-Host "RECOVERY COMPLETE." -ForegroundColor Green
Write-Host "You can now go to Flogent-Live and commit your changes."
