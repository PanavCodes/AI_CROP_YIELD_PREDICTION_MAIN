# 🌾 Crop Prediction App - Complete Startup Script
# Starts FastAPI backend, Node.js backend, and React frontend simultaneously
# Usage: .\start-all.ps1 [-SkipMongo] [-FastAPIOnly] [-NodeOnly] [-FrontendOnly] [-TestMode]

param(
    [switch]$SkipMongo,       # Skip MongoDB connectivity check
    [switch]$FastAPIOnly,     # Start only FastAPI ML backend
    [switch]$NodeOnly,        # Start only Node.js backend
    [switch]$FrontendOnly,    # Start only React frontend
    [switch]$TestMode         # Run service health checks after startup
)

Write-Host "🚀 Starting Complete Crop Prediction App..." -ForegroundColor Green
Write-Host "=" -repeat 60 -ForegroundColor Yellow

$rootPath = $PSScriptRoot
$jobs = @()

# Function to test URL availability
function Test-ServiceUrl {
    param([string]$Url, [string]$ServiceName)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $ServiceName is responding" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⏳ $ServiceName not ready yet..." -ForegroundColor Yellow
        return $false
    }
}

# Check MongoDB unless skipped
if (-not $SkipMongo) {
    Write-Host "🔍 Checking MongoDB..." -ForegroundColor Cyan
    try {
        $mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
        if ($mongoProcess) {
            Write-Host "✅ MongoDB is running (PID: $($mongoProcess.Id))" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Starting MongoDB service..." -ForegroundColor Yellow
            try {
                Start-Service MongoDB -ErrorAction Stop
                Start-Sleep 3
                Write-Host "✅ MongoDB service started" -ForegroundColor Green
            } catch {
                Write-Host "❌ MongoDB service failed. Run manually or use -SkipMongo" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "⚠️ MongoDB check failed. Continuing..." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Start FastAPI Backend
if (-not $NodeOnly -and -not $FrontendOnly) {
    Write-Host "🐍 Starting FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
    $fastApiPath = Join-Path $rootPath "fastapi-backend"
    
    if (Test-Path $fastApiPath) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", 
            "cd '$fastApiPath'; .\venv\Scripts\Activate.ps1; python main.py" -WindowStyle Normal
        Write-Host "✅ FastAPI backend starting in new window..." -ForegroundColor Green
        Start-Sleep 3
    } else {
        Write-Host "❌ FastAPI directory not found!" -ForegroundColor Red
    }
}

# Start Node.js Backend
if (-not $FastAPIOnly -and -not $FrontendOnly) {
    Write-Host "🟢 Starting Node.js Backend (Port 5000)..." -ForegroundColor Green
    $serverPath = Join-Path $rootPath "server"
    
    if (Test-Path $serverPath) {
        $serverFile = if (Test-Path (Join-Path $serverPath "enhanced-server.js")) { "enhanced-server.js" } else { "app.js" }
        Start-Process powershell -ArgumentList "-NoExit", "-Command", 
            "cd '$serverPath'; node $serverFile" -WindowStyle Normal
        Write-Host "✅ Node.js backend starting in new window..." -ForegroundColor Green
        Start-Sleep 3
    } else {
        Write-Host "❌ Server directory not found!" -ForegroundColor Red
    }
}

# Start React Frontend
if (-not $FastAPIOnly -and -not $NodeOnly) {
    Write-Host "⚛️ Starting React Frontend (Port 3000)..." -ForegroundColor Blue
    
    if ($FrontendOnly) {
        # Start in current window if only frontend
        Set-Location $rootPath
        npm run dev
    } else {
        # Start in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", 
            "cd '$rootPath'; npm run dev" -WindowStyle Normal
        Write-Host "✅ React frontend starting in new window..." -ForegroundColor Green
        Start-Sleep 2
    }
}

# If not running frontend-only, show status and URLs
if (-not $FrontendOnly) {
    Write-Host ""
    Write-Host "🎉 Startup Complete!" -ForegroundColor Green
    Write-Host "=" -repeat 60 -ForegroundColor Yellow
    
    if (-not $NodeOnly) {
        Write-Host "🐍 FastAPI Backend: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "   📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Gray
        Write-Host "   📖 ReDoc Documentation: http://localhost:8000/redoc" -ForegroundColor Gray
    }
    
    if (-not $FastAPIOnly) {
        Write-Host "🟢 Node.js Backend: http://localhost:5000" -ForegroundColor Green
        Write-Host "   🔍 Health Check: http://localhost:5000/api/health" -ForegroundColor Gray
    }
    
    Write-Host "⚛️ React Frontend: http://localhost:3000" -ForegroundColor Blue
    
    Write-Host ""
    Write-Host "🧪 Test Commands:" -ForegroundColor Yellow
    Write-Host "   FastAPI Tests: cd fastapi-backend && python test_api.py" -ForegroundColor Gray
    Write-Host "   Quick Health: curl http://localhost:8000/health" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "💡 Usage Examples:" -ForegroundColor Magenta
    Write-Host "   .\start-all.ps1                  # Start all services" -ForegroundColor Gray
    Write-Host "   .\start-all.ps1 -FastAPIOnly      # Only FastAPI" -ForegroundColor Gray
    Write-Host "   .\start-all.ps1 -NodeOnly         # Only Node.js" -ForegroundColor Gray
    Write-Host "   .\start-all.ps1 -FrontendOnly     # Only React" -ForegroundColor Gray
    Write-Host "   .\start-all.ps1 -SkipMongo        # Skip MongoDB check" -ForegroundColor Gray
    
    # Test mode - wait and test services
    if ($TestMode) {
        Write-Host ""
        Write-Host "🧪 Testing Services..." -ForegroundColor Yellow
        Start-Sleep 10
        
        if (-not $NodeOnly) {
            Test-ServiceUrl "http://localhost:8000/health" "FastAPI Backend"
        }
        if (-not $FastAPIOnly) {
            Test-ServiceUrl "http://localhost:5000/api/health" "Node.js Backend"
        }
    }
    
    Write-Host ""
    Write-Host "🎯 All services started! Check the new windows." -ForegroundColor Green
    Write-Host "Press any key to exit this script..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
