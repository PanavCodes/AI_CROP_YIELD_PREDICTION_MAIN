@echo off
REM ================================================
REM Crop Prediction App - Quick Start Script
REM Starts all three services in separate windows
REM ================================================

echo 🚀 Quick Start - Crop Prediction App
echo =====================================

echo.
echo Starting services in separate windows...

echo 🐍 Starting FastAPI Backend (Port 8000)...
start "FastAPI Backend" cmd /k "cd fastapi-backend && start-fastapi.bat"

echo.
timeout /t 3 /nobreak > nul

echo 🟢 Starting Node.js Backend (Port 5000)...  
start "Node.js Backend" cmd /k "cd server && node enhanced-server.js"

echo.
timeout /t 3 /nobreak > nul

echo ⚛️ Starting React Frontend (Port 3000)...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ✅ All services starting in separate windows!
echo.
echo 📋 Service URLs:
echo   🐍 FastAPI Backend: http://localhost:8000
echo   📚 API Docs: http://localhost:8000/docs
echo   🟢 Node.js Backend: http://localhost:5000  
echo   ⚛️ React Frontend: http://localhost:3000
echo.
echo 🧪 To test FastAPI:
echo   cd fastapi-backend
echo   python test_api.py
echo.
pause