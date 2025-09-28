@echo off
chcp 65001 > nul
title نظام نقاط البيع - خادم التطوير
color 0A

echo.
echo ========================================
echo    نظام نقاط البيع - خادم التطوير
echo ========================================
echo.

echo التحقق من Node.js...
node --version
if %errorlevel% neq 0 (
    echo خطأ: Node.js غير مثبت أو غير موجود في PATH
    echo يرجى تثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo التحقق من npm...
npm --version
if %errorlevel% neq 0 (
    echo خطأ: npm غير مثبت أو غير موجود في PATH
    pause
    exit /b 1
)

echo.
echo تثبيت التبعيات...
npm install

echo.
echo تشغيل خادم التطوير...
echo الخادم سيعمل على: http://localhost:5173
echo.
npm run dev

pause