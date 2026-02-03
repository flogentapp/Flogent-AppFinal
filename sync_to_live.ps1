$source = $PSScriptRoot
$dest = Join-Path $PSScriptRoot "..\Flogent-Live"
$dest = [System.IO.Path]::GetFullPath($dest)

Write-Host "Syncing from $source to $dest"

# Robocopy /MIR mirrors the directory tree
# /XD excludes directories
# /XF excludes files
# /R:0 /W:0 prevents retries/waiting on locked files

robocopy $source $dest /MIR `
  /XD .git .next .vercel node_modules .idea .vscode `
  /XF .env .env.local .DS_Store sync_to_live.bat sync_to_live.ps1

if ($LASTEXITCODE -lt 8) {
    Write-Host "Sync Complete!" -ForegroundColor Green
} else {
    Write-Host "Sync Failed with code $LASTEXITCODE" -ForegroundColor Red
}

Pause
