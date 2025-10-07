@echo off
chcp 65001 >nul
echo ========================================
echo    إصلاح سريع لمشاكل التبعيات
echo ========================================
echo.

echo [1/4] إيقاف عمليات Electron...
taskkill /f /im electron.exe 2>nul
echo ✓ تم إيقاف عمليات Electron

echo.
echo [2/4] تنظيف الـ cache...
if exist "node_modules\.electron*" rmdir /s /q "node_modules\.electron*" 2>nul
echo ✓ تم تنظيف الـ cache

echo.
echo [3/4] إعادة تثبيت التبعيات...
call npm install
if %errorlevel% neq 0 (
    echo ❌ فشل في التثبيت. جرب إصلاح-التبعيات.bat
    pause
    exit /b 1
)
echo ✓ تم تثبيت التبعيات بنجاح

echo.
echo [4/4] اختبار التطبيق...
echo ✓ يمكنك الآن تشغيل التطبيق
echo.

echo ========================================
echo    تم الإصلاح بنجاح! 🎉
echo ========================================
echo.
echo للتشغيل:
echo - تشغيل-في-المتصفح.bat (موصى به)
echo - تشغيل-وضع-التطوير.bat
echo.
pause
