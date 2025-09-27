@echo off
echo Starting POS System Server...
echo.

cd /d "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos"

echo Current directory: %CD%
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
call npm run dev

pause
