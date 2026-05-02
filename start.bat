@echo off
echo.
echo  =============================================
echo   Skin Cancer DWM -- Starting Server
echo  =============================================
echo.

if not exist venv (
    echo [ERROR] Virtual environment not found.
    echo    Please run setup.bat first.
    pause
    exit /b 1
)

if not exist .env (
    echo [WARNING] No .env file found. Copying from .env.example...
    copy .env.example .env
    echo    Please edit .env with your MySQL credentials, then rerun start.bat.
    notepad .env
    pause
    exit /b 1
)

echo  Starting Flask server...
echo  Open your browser at: http://localhost:8080
echo  Press Ctrl+C to stop the server.
echo.

.\venv\Scripts\python.exe server.py
pause
