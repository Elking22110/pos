@echo off
chcp 65001 >nul
echo ========================================
echo    بناء نظام إدارة المبيعات
echo ========================================
echo.

echo [1/3] تنظيف الملفات السابقة...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
echo ✓ تم تنظيف الملفات السابقة

echo.
echo [2/3] التحقق من التبعيات...
if not exist "node_modules" (
    echo تثبيت التبعيات...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت التبعيات
        pause
        exit /b 1
    )
)
echo ✓ التبعيات جاهزة

echo.
echo [3/3] بناء التطبيق...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ فشل في بناء التطبيق
    pause
    exit /b 1
)
echo ✓ تم بناء التطبيق بنجاح

echo.
echo ========================================
echo    تم البناء بنجاح! 🎉
echo ========================================
echo.
echo يمكنك الآن تشغيل التطبيق باستخدام:
echo - تشغيل-التطبيق.bat
echo - أو npm run electron
echo.
echo حجم التطبيق:
for %%f in (dist\*.html) do echo %%~nxf: %%~zf bytes
echo.
pause
