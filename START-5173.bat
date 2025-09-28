@echo off
chcp 65001 > nul
title نظام نقاط البيع - المنفذ 5173
color 0A

echo.
echo ========================================
echo    نظام نقاط البيع - المنفذ 5173
echo ========================================
echo.

echo التحقق من المنفذ 5173...
netstat -an | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo ⚠️  المنفذ 5173 مستخدم بالفعل
    echo.
    echo جاري إيقاف العمليات التي تستخدم المنفذ 5173...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    echo تم إيقاف العمليات
    timeout /t 2 >nul
) else (
    echo ✅ المنفذ 5173 متاح
)

echo.
echo تشغيل الخادم على المنفذ 5173...
echo.
echo الخادم سيعمل على:
echo - المحلي: http://localhost:5173
echo - الشبكة المحلية: http://192.168.1.5:5173
echo.
echo اضغط Ctrl+C لإيقاف الخادم
echo.

cd /d "%~dp0"
npm run dev

pause

