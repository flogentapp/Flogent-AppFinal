$source = Join-Path $PSScriptRoot "..\Flogent-Live"
$dest = $PSScriptRoot
$source = [System.IO.Path]::GetFullPath($source)

Write-Host "Syncing FROM $source TO $dest (Dev now matches Live)"

# Robocopy /MIR mirrors the directory tree
# /XD excludes directories
# /XF excludes files
# /R:0 /W:0 prevents retries/waiting on locked files

robocopy $source $dest /MIR `
  /XD .git .next .vercel node_modules .idea .vscode Flogent-Live `
  /XF .env .env.local .DS_Store sync_to_live.bat sync_to_live.ps1 sync_from_live.ps1 sync_from_live.bat

if ($LASTEXITCODE -lt 8) {
    Write-Host "Sync Complete! Dev now matches Live." -ForegroundColor Green
} else {
    Write-Host "Sync Failed with code $LASTEXITCODE" -ForegroundColor Red
}

Pause
