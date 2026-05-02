@echo off
echo.
echo  =============================================
echo   Skin Cancer DWM -- Project Setup
echo  =============================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Python not found. Install from https://python.org
        pause
        exit /b 1
    )
    set PYTHON=py
) else (
    set PYTHON=python
)

echo [1/4] Creating virtual environment...
%PYTHON% -m venv venv
if %errorlevel% neq 0 ( echo [ERROR] Failed to create venv. & pause & exit /b 1 )

echo [2/4] Installing dependencies from requirements.txt...
.\venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 ( echo [ERROR] pip install failed. & pause & exit /b 1 )

echo [3/4] Checking for .env file...
if not exist .env (
    copy .env.example .env
    echo.
    echo [ACTION REQUIRED] A .env file has been created from .env.example
    echo    Please open .env and set your MySQL credentials before continuing.
    echo    File location: %cd%\.env
    echo.
    notepad .env
) else (
    echo    .env already exists, skipping.
)

echo [4/4] Setup complete!
echo.
echo  Next steps:
echo    1. Make sure MySQL is running and .env credentials are correct
echo    2. Run the ETL pipeline once:  .\venv\Scripts\python.exe warehouse_etl.py
echo    3. Start the server:           start.bat  (or run start.bat now)
echo.
pause
