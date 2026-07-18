# ============================================================
#  BizConnect - One-Command Startup Script
#  Usage: Right-click -> "Run with PowerShell"
#  OR run in terminal: powershell -ExecutionPolicy Bypass -File start.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BizConnect Dev Server Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Node.js ──
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed. Download from https://nodejs.org" -ForegroundColor Red
    pause; exit 1
}
$nodeVer = node --version
Write-Host "[OK] Node.js $nodeVer found" -ForegroundColor Green

# ── Check MongoDB ──
Write-Host "[...] Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoCheck = node -e "
        const net = require('net');
        const s = net.createConnection(27017, 'localhost');
        s.on('connect', () => { console.log('OK'); s.destroy(); process.exit(0); });
        s.on('error', () => { console.log('FAIL'); process.exit(1); });
        setTimeout(() => { console.log('FAIL'); process.exit(1); }, 2000);
    " 2>&1
    if ($mongoCheck -like "*OK*") {
        Write-Host "[OK] MongoDB is running on port 27017" -ForegroundColor Green
    } else {
        throw "MongoDB not reachable"
    }
} catch {
    Write-Host ""
    Write-Host "[WARNING] MongoDB is NOT running!" -ForegroundColor Red
    Write-Host "  Attempting to start MongoDB service..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "[OK] MongoDB service started" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not start MongoDB. Please start it manually." -ForegroundColor Red
        Write-Host "  Run: net start MongoDB" -ForegroundColor Gray
        pause; exit 1
    }
}

# ── Install Backend Dependencies ──
$backendPath = Join-Path $ROOT "backend"
if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host ""
    Write-Host "[...] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backendPath
    npm install --silent
    Pop-Location
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
}

# ── Install Frontend Dependencies ──
$frontendPath = Join-Path $ROOT "frontend"
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host ""
    Write-Host "[...] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install --silent
    Pop-Location
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
}

# ── Launch Backend in new window ──
Write-Host ""
Write-Host "[...] Starting Backend on http://localhost:5000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; Write-Host '=== BizConnect BACKEND ===' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# ── Launch Frontend in new window ──
Write-Host "[...] Starting Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; Write-Host '=== BizConnect FRONTEND ===' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 4

# ── Open browser ──
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All servers started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  ->  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend   ->  http://localhost:5000" -ForegroundColor White
Write-Host "  API Docs  ->  http://localhost:5000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press any key to close this launcher (servers keep running in their windows)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
