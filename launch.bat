@echo off
title POS System Development Server
color 0A

echo.
echo ========================================
echo    POS System Development Server
echo ========================================
echo.

echo Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%

echo.
echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
npm install

echo.
echo Starting development server...
echo Server will run on: http://localhost:5173
echo.
npm run dev

pause

