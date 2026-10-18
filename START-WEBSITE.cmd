@echo off
setlocal
title Nexora Automation - Local Website
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo Windows PowerShell is required to start the website automatically.
  echo Enable Windows PowerShell, then double-click this file again.
  if not "%NEXORA_NO_PAUSE%"=="1" pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" %*
set "NEXORA_EXIT_CODE=%ERRORLEVEL%"
if not "%NEXORA_EXIT_CODE%"=="0" (
  echo.
  echo The website could not start. Read the error above for the next step.
  if not "%NEXORA_NO_PAUSE%"=="1" pause
)
exit /b %NEXORA_EXIT_CODE%
