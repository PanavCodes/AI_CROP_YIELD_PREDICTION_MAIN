@echo off
title Crop Prediction App - Startup

echo.
echo 🌾 Crop Prediction App - Quick Starter
echo ======================================

echo.
echo Choose startup option:
echo 1. Start ALL services (FastAPI + Node.js + React)
echo 2. Start FastAPI backend only
echo 3. Start Node.js backend only  
echo 4. Start React frontend only
echo 5. Test mode (start all + test)

echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting all services...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
) else if "%choice%"=="2" (
    echo.
    echo 🐍 Starting FastAPI only...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" -FastAPIOnly
) else if "%choice%"=="3" (
    echo.
    echo 🟢 Starting Node.js only...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" -NodeOnly
) else if "%choice%"=="4" (
    echo.
    echo ⚛️ Starting React frontend only...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" -FrontendOnly
) else if "%choice%"=="5" (
    echo.
    echo 🧪 Starting all services in test mode...
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" -TestMode
) else (
    echo.
    echo ❌ Invalid choice. Exiting...
    pause
    exit /b 1
)

echo.
echo ✅ Startup script completed!
pause