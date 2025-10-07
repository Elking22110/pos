@echo off
chcp 65001 >nul
echo ========================================
echo    تشغيل نظام إدارة المبيعات في المتصفح
echo ========================================
echo.

echo [1/4] التحقق من وجود التطبيق المبني...
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

echo [2/4] التحقق من التبعيات...
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

echo [3/4] بدء الخادم المحلي...
echo ✓ بدء تشغيل الخادم على http://localhost:4173
echo.
echo ========================================
echo    التطبيق يعمل الآن في المتصفح! 🎉
echo ========================================
echo.
echo ملاحظات مهمة:
echo - سيتم فتح التطبيق في المتصفح تلقائياً
echo - العنوان: http://localhost:4173
echo - يمكنك إغلاق هذه النافذة لإيقاف الخادم
echo - هذا الحل أكثر استقراراً من Electron
echo.

echo [4/4] تشغيل الخادم...
call npm run preview
if %errorlevel% neq 0 (
    echo ❌ فشل في تشغيل الخادم
    echo.
    echo جرب الحلول التالية:
    echo 1. تأكد من تثبيت Node.js
    echo 2. تحقق من أن المنفذ 4173 غير مستخدم
    echo 3. أعد تشغيل الكمبيوتر
    echo.
    pause
    exit /b 1
)

echo.
echo تم إيقاف الخادم
pause
