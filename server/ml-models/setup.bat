@echo off
echo Installing Python dependencies for ML model...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing ML dependencies...
pip install -r requirements.txt

if %errorlevel% equ 0 (
    echo.
    echo ✅ ML dependencies installed successfully!
    echo.
    echo Testing the ML model...
    echo {"crop": "Rice", "state": "Punjab", "year": 2024, "rainfall": 150, "temperature": 28, "pesticides_tonnes": 0.05} | python yield_predictor.py
    echo.
    echo If you see prediction results above, the ML model is working correctly!
) else (
    echo ❌ Failed to install dependencies
    echo Please check your internet connection and try again
)

pause