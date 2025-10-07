@echo off
chcp 65001 >nul
echo ========================================
echo    تشغيل نظام إدارة المبيعات
echo ========================================
echo.

echo [1/3] التحقق من وجود التطبيق المبني...
if not exist "dist\index.html" (
    echo ⚠️  التطبيق غير مبني. سيتم البناء الآن...
    echo.
    echo [1/4] بناء التطبيق...
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

echo [2/3] التحقق من التبعيات...
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

echo [3/3] تشغيل التطبيق...
echo ✓ بدء تشغيل نظام إدارة المبيعات...
echo.
echo ملاحظة: سيتم فتح التطبيق في نافذة منفصلة
echo يمكنك إغلاق هذه النافذة لإيقاف التطبيق
echo.

call npm run electron
if %errorlevel% neq 0 (
    echo ❌ فشل في تشغيل التطبيق
    echo.
    echo جرب الحلول التالية:
    echo 1. تأكد من تثبيت Node.js
    echo 2. امسح مجلد node_modules وأعد التثبيت
    echo 3. تحقق من مساحة القرص المتاحة
    echo.
    pause
    exit /b 1
)

echo.
echo تم إغلاق التطبيق
pause
