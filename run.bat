@echo off
title Adith Launcher
cls

echo =======================================================
echo        ADITH - AI Material Selection Tool
echo =======================================================
echo.

node -v >nul 2>&1
if errorlevel 1 goto NO_NODE
goto HAS_NODE

:NO_NODE
echo [ERROR] Node.js was not found in your PATH.
echo Please install Node.js (v18+) from https://nodejs.org
pause
exit /b 1

:HAS_NODE
python --version >nul 2>&1
if errorlevel 1 echo [WARNING] Python is not found. Required for running scraper.

if exist .env.local goto HAS_ENV
echo [INFO] Creating .env.local template...
echo GROQ_API_KEY=your_groq_api_key_here>.env.local
echo GEMINI_API_KEY=your_gemini_api_key_here>>.env.local
:HAS_ENV

if exist node_modules goto HAS_MODULES
echo [INFO] Installing Node.js dependencies...
call npm install
:HAS_MODULES

:MENU
cls
echo =======================================================
echo        ADITH - AI Material Selection Tool
echo =======================================================
echo.
echo  1. Start Next.js Development Server (npm run dev)
echo  2. Install Python Scraper Dependencies (pip install)
echo  3. Run MatWeb Offline Scraper (Python)
echo  4. Full Fresh Setup and Start Dev Server
echo  5. Exit
echo.
echo =======================================================

set choice=
set /p choice="Enter option (1-5): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto SETUP_PYTHON
if "%choice%"=="3" goto RUN_SCRAPER
if "%choice%"=="4" goto FULL_SETUP
if "%choice%"=="5" goto END

echo Invalid option. Please enter a number from 1 to 5.
pause
goto MENU

:START_DEV
echo.
echo [INFO] Starting Next.js Dev Server...
call npm run dev
pause
goto MENU

:SETUP_PYTHON
echo.
echo [INFO] Installing Python dependencies...
if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe -m pip install -r scraper/requirements.txt
) else (
    python -m pip install -r scraper/requirements.txt
)
pause
goto MENU

:RUN_SCRAPER
echo.
echo [INFO] Running MatWeb Scraper...
if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe scraper/build_json.py
) else (
    python scraper/build_json.py
)
pause
goto MENU

:FULL_SETUP
echo.
echo [INFO] Running Full Setup...
call npm install
if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe scraper/build_json.py
) else (
    python scraper/build_json.py
)
goto START_DEV

:END
echo Goodbye!
pause
