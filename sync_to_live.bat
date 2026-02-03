@echo off
:: This batch file bypasses the execution policy just for this script run
Powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0sync_to_live.ps1'"
