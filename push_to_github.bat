@echo off
REM push_to_github.bat — run this to push to GitHub
REM Git must be installed. If it was just installed, open a NEW terminal.

set GIT=git
where git >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set GIT="C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo [ERROR] Git not found. Please reopen your terminal after installing Git.
        pause & exit /b 1
    )
)

echo [1/6] Initialising git repository...
%GIT% init

echo [2/6] Setting identity...
%GIT% config user.name "Cancer Boys"
%GIT% config user.email "kaushal@cancerboys.dev"

echo [3/6] Staging files (.gitignore will exclude venv + images)...
%GIT% add .

echo [4/6] Creating initial commit...
%GIT% commit -m "Cancer Boys - Skin Cancer Detection DWM"

echo [5/6] Setting branch to main...
%GIT% branch -M main

echo [6/6] Pushing to GitHub...
%GIT% remote remove origin 2>nul
%GIT% remote add origin https://github.com/Kaushal-1925/Skin-Cancer-Detection.git
%GIT% push -u origin main

echo.
echo Done! Visit: https://github.com/Kaushal-1925/Skin-Cancer-Detection
pause
