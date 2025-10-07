@echo off
chcp 65001 >nul
echo ========================================
echo    تشغيل نظام إدارة المبيعات (نهائي)
echo ========================================
echo.

echo [1/5] تنظيف شامل للـ cache...
if exist "%TEMP%\electron*" rmdir /s /q "%TEMP%\electron*" 2>nul
if exist "%LOCALAPPDATA%\electron*" rmdir /s /q "%LOCALAPPDATA%\electron*" 2>nul
if exist "%APPDATA%\electron*" rmdir /s /q "%APPDATA%\electron*" 2>nul
echo ✓ تم تنظيف الـ cache

echo.
echo [2/5] التحقق من وجود التطبيق المبني...
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

echo [3/5] التحقق من التبعيات...
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

echo [4/5] إعداد متغيرات البيئة...
set ELECTRON_DISABLE_SECURITY_WARNINGS=1
set ELECTRON_IS_DEV=0
set ELECTRON_DISABLE_GPU=0
echo ✓ تم إعداد متغيرات البيئة

echo.
echo [5/5] تشغيل التطبيق...
echo ✓ بدء تشغيل نظام إدارة المبيعات...
echo.
echo ========================================
echo    التطبيق يعمل الآن! 🎉
echo ========================================
echo.
echo ملاحظات مهمة:
echo - إذا ظهرت نافذة فارغة، انتظر قليلاً حتى يتم تحميل المحتوى
echo - يمكنك إغلاق هذه النافذة لإيقاف التطبيق
echo - في حالة وجود مشاكل، جرب إعادة تشغيل الكمبيوتر
echo.

call npm run electron
if %errorlevel% neq 0 (
    echo ❌ فشل في تشغيل التطبيق
    echo.
    echo جرب الحلول التالية:
    echo 1. تأكد من تثبيت Node.js
    echo 2. امسح مجلد node_modules وأعد التثبيت
    echo 3. تحقق من مساحة القرص المتاحة
    echo 4. أعد تشغيل الكمبيوتر
    echo 5. تشغيل كمدير (Run as Administrator)
    echo.
    pause
    exit /b 1
)

echo.
echo تم إغلاق التطبيق بنجاح
pause
