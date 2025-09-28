@echo off
chcp 65001 > nul
title نظام نقاط البيع - السكريبت الرئيسي
color 0A

echo.
echo ========================================
echo    نظام نقاط البيع - السكريبت الرئيسي
echo ========================================
echo.

echo التحقق من المجلد الحالي...
cd /d "%~dp0"
echo المجلد الحالي: %CD%

echo.
echo التحقق من وجود package.json...
if not exist "package.json" (
    echo خطأ: ملف package.json غير موجود!
    echo تأكد من أنك في المجلد الصحيح
    pause
    exit /b 1
)

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
echo ========================================
echo    فحص المنفذ الرئيسي 5173
echo ========================================
echo.

REM فحص المنفذ 5173
netstat -an | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo ⚠️  المنفذ 5173 مستخدم بالفعل
    echo.
    echo هل تريد:
    echo 1. إيقاف العملية التي تستخدم المنفذ 5173
    echo 2. استخدام منفذ آخر (5174)
    echo 3. إلغاء التشغيل
    echo.
    set /p choice="اختر رقم (1/2/3): "
    
    if "%choice%"=="1" (
        echo.
        echo جاري إيقاف العمليات التي تستخدم المنفذ 5173...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
            taskkill /PID %%a /F >nul 2>&1
        )
        echo تم إيقاف العمليات
        set PORT=5173
        set PORT_MESSAGE=سيتم تشغيل الخادم على المنفذ الرئيسي 5173
    ) else if "%choice%"=="2" (
        echo.
        echo جاري البحث عن منفذ متاح...
        netstat -an | findstr :5174 > nul
        if %errorlevel% neq 0 (
            echo ✅ المنفذ 5174 متاح
            set PORT=5174
            set PORT_MESSAGE=سيتم تشغيل الخادم على المنفذ 5174
        ) else (
            echo ❌ المنفذ 5174 أيضاً مستخدم
            echo يرجى إعادة تشغيل الكمبيوتر أو إغلاق التطبيقات الأخرى
            pause
            exit /b 1
        )
    ) else (
        echo تم إلغاء التشغيل
        pause
        exit /b 0
    )
) else (
    echo ✅ المنفذ الرئيسي 5173 متاح
    set PORT=5173
    set PORT_MESSAGE=سيتم تشغيل الخادم على المنفذ الرئيسي 5173
)

echo.
echo %PORT_MESSAGE%
echo.

echo تثبيت التبعيات...
npm install

echo.
echo ========================================
echo    تشغيل خادم التطوير
echo ========================================
echo.

REM الحصول على عنوان IP المحلي
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

echo الخادم سيعمل على:
echo.
echo 🖥️  المحلي: http://localhost:%PORT%
if defined LOCAL_IP (
    echo 🌐 الشبكة المحلية: http://%LOCAL_IP%:%PORT%
)
echo.
echo 📱 للوصول من الأجهزة الأخرى:
echo    استخدم عنوان الشبكة المحلية أعلاه
echo.
echo ⚠️  اضغط Ctrl+C لإيقاف الخادم
echo.

REM تشغيل الخادم مع المنفذ المحدد
set VITE_PORT=%PORT%
npm run dev

echo.
echo تم إيقاف الخادم
pause
