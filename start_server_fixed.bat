@echo off
echo ========================================
echo    POS System Server Startup Script
echo ========================================
echo.

echo Checking project directories...
echo.

REM Check if we're in the right directory
if exist "package.json" (
    echo ✓ Found package.json in current directory
    echo Current directory: %CD%
    goto :start_server
)

REM Try pos directory
echo Checking pos directory...
if exist "pos\package.json" (
    echo ✓ Found project in pos directory
    cd pos
    echo Changed to: %CD%
    goto :start_server
)

REM Try pos_system_modern_ui directory
echo Checking pos_system_modern_ui directory...
if exist "pos_system_modern_ui\package.json" (
    echo ✓ Found project in pos_system_modern_ui directory
    cd pos_system_modern_ui
    echo Changed to: %CD%
    goto :start_server
)

REM Try full path to pos
echo Checking full path to pos...
if exist "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos\package.json" (
    echo ✓ Found project in full path to pos
    cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos"
    echo Changed to: %CD%
    goto :start_server
)

REM Try full path to pos_system_modern_ui
echo Checking full path to pos_system_modern_ui...
if exist "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos_system_modern_ui\package.json" (
    echo ✓ Found project in full path to pos_system_modern_ui
    cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos_system_modern_ui"
    echo Changed to: %CD%
    goto :start_server
)

echo ❌ Could not find package.json in any expected location
echo.
echo Please make sure you're running this script from the correct directory
echo or that the project files exist in the expected locations.
echo.
pause
exit /b 1

:start_server
echo.
echo ========================================
echo    Installing Dependencies
echo ========================================
echo.
call npm install

echo.
echo ========================================
echo    Starting Development Server
echo ========================================
echo.
call npm run dev

echo.
echo Server stopped.
pause
