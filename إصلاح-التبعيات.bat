@echo off
chcp 65001 >nul
echo ========================================
echo    إصلاح مشاكل تثبيت التبعيات
echo ========================================
echo.

echo [1/6] إيقاف جميع عمليات Electron...
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul
echo ✓ تم إيقاف جميع العمليات

echo.
echo [2/6] تنظيف مجلدات الـ cache...
if exist "%TEMP%\electron*" rmdir /s /q "%TEMP%\electron*" 2>nul
if exist "%LOCALAPPDATA%\electron*" rmdir /s /q "%LOCALAPPDATA%\electron*" 2>nul
if exist "%APPDATA%\electron*" rmdir /s /q "%APPDATA%\electron*" 2>nul
if exist "node_modules\.electron*" rmdir /s /q "node_modules\.electron*" 2>nul
echo ✓ تم تنظيف الـ cache

echo.
echo [3/6] حذف مجلد node_modules...
if exist "node_modules" (
    echo ⚠️  حذف مجلد node_modules...
    rmdir /s /q "node_modules" 2>nul
    if exist "node_modules" (
        echo ❌ فشل في حذف node_modules. جرب تشغيل كمدير
        pause
        exit /b 1
    )
    echo ✓ تم حذف node_modules
) else (
    echo ✓ مجلد node_modules غير موجود
)

echo.
echo [4/6] حذف package-lock.json...
if exist "package-lock.json" (
    del "package-lock.json" 2>nul
    echo ✓ تم حذف package-lock.json
) else (
    echo ✓ package-lock.json غير موجود
)

echo.
echo [5/6] تنظيف npm cache...
call npm cache clean --force
if %errorlevel% neq 0 (
    echo ⚠️  فشل في تنظيف npm cache
) else (
    echo ✓ تم تنظيف npm cache
)

echo.
echo [6/6] إعادة تثبيت التبعيات...
echo ⚠️  هذا قد يستغرق بضع دقائق...
call npm install
if %errorlevel% neq 0 (
    echo ❌ فشل في تثبيت التبعيات
    echo.
    echo جرب الحلول التالية:
    echo 1. تشغيل كمدير (Run as Administrator)
    echo 2. إعادة تشغيل الكمبيوتر
    echo 3. تحقق من مساحة القرص المتاحة
    echo.
    pause
    exit /b 1
)
echo ✓ تم تثبيت التبعيات بنجاح

echo.
echo ========================================
echo    تم إصلاح التبعيات بنجاح! 🎉
echo ========================================
echo.
echo يمكنك الآن تشغيل التطبيق باستخدام:
echo - تشغيل-في-المتصفح.bat
echo - تشغيل-وضع-التطوير.bat
echo - تشغيل-نهائي.bat
echo.
pause
