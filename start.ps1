# Starts both the FastAPI backend (port 8020) and the Vite frontend (port 5199)
# Usage: right-click > Run with PowerShell, or:  ./start.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Starting Vaahan Saarthi..." -ForegroundColor Magenta

# Backend
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd `"$root\backend`"; if (!(Test-Path .venv)) { python -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r requirements.txt }; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8020"
)

# Frontend
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd `"$root\frontend`"; if (!(Test-Path node_modules)) { npm install }; npm run dev"
)

Write-Host "Backend:  http://127.0.0.1:8020" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5199" -ForegroundColor Cyan
