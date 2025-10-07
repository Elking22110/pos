@echo off
chcp 65001 >nul
echo ========================================
echo    تشغيل نظام إدارة المبيعات (محسن)
echo ========================================
echo.

echo [1/4] تنظيف الـ cache...
if exist "%TEMP%\electron*" rmdir /s /q "%TEMP%\electron*" 2>nul
if exist "%LOCALAPPDATA%\electron*" rmdir /s /q "%LOCALAPPDATA%\electron*" 2>nul
echo ✓ تم تنظيف الـ cache

echo.
echo [2/4] التحقق من وجود التطبيق المبني...
if not exist "dist\index.html" (
    echo ⚠️  التطبيق غير مبني. سيتم البناء الآن...
    echo.
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ فشل في بناء التطبيق
        pause
        exit /b 1
    )
    echo ✓ تم بناء التطبيق بنجاح
    echo.
) else (
    echo ✓ التطبيق جاهز للتشغيل
    echo.
)

echo [3/4] التحقق من التبعيات...
if not exist "node_modules" (
    echo ⚠️  التبعيات غير مثبتة. سيتم التثبيت الآن...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت التبعيات
        pause
        exit /b 1
    )
    echo ✓ تم تثبيت التبعيات بنجاح
    echo.
) else (
    echo ✓ التبعيات جاهزة
    echo.
)

echo [4/4] تشغيل التطبيق مع معالجة الأخطاء...
echo ✓ بدء تشغيل نظام إدارة المبيعات...
echo.
echo ملاحظة: إذا ظهرت نافذة فارغة، انتظر قليلاً حتى يتم تحميل المحتوى
echo يمكنك إغلاق هذه النافذة لإيقاف التطبيق
echo.

set ELECTRON_DISABLE_SECURITY_WARNINGS=1
set ELECTRON_IS_DEV=0
call npm run electron
if %errorlevel% neq 0 (
    echo ❌ فشل في تشغيل التطبيق
    echo.
    echo جرب الحلول التالية:
    echo 1. تأكد من تثبيت Node.js
    echo 2. امسح مجلد node_modules وأعد التثبيت
    echo 3. تحقق من مساحة القرص المتاحة
    echo 4. أعد تشغيل الكمبيوتر
    echo.
    pause
    exit /b 1
)

echo.
echo تم إغلاق التطبيق
pause
