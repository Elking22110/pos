@echo off
title POS System Server

echo.
echo ========================================
echo    POS System Quick Start
echo ========================================
echo.

REM Go to the main project directory first
cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui"

echo Current location: %CD%
echo.

REM Check which subdirectory has package.json
if exist "pos\package.json" (
    echo Found project in: pos\
    cd pos
    echo Now in: %CD%
    echo.
    echo Starting server...
    npm run dev
) else if exist "pos_system_modern_ui\package.json" (
    echo Found project in: pos_system_modern_ui\
    cd pos_system_modern_ui
    echo Now in: %CD%
    echo.
    echo Starting server...
    npm run dev
) else (
    echo ERROR: No package.json found!
    echo.
    echo Available directories:
    dir /b
    echo.
    echo Please check the project structure.
)

echo.
pause
