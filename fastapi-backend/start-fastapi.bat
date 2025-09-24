@echo off
echo Starting FastAPI backend...
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    echo Starting FastAPI server on http://localhost:8000
    python main.py
) else (
    echo Virtual environment not found, using global Python...
    echo Starting FastAPI server on http://localhost:8000
    python main.py
)