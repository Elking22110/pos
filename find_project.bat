@echo off
echo Searching for POS System project...
echo.

echo Checking pos_system_modern_ui\pos...
if exist "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos\package.json" (
    echo ✓ Found project in: pos_system_modern_ui\pos
    echo Starting server from this location...
    cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos"
    call npm run dev
    goto :end
)

echo Checking pos_system_modern_ui\pos_system_modern_ui...
if exist "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos_system_modern_ui\package.json" (
    echo ✓ Found project in: pos_system_modern_ui\pos_system_modern_ui
    echo Starting server from this location...
    cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos_system_modern_ui"
    call npm run dev
    goto :end
)

echo ❌ No project found in expected locations
echo Please check the project directory structure

:end
pause
