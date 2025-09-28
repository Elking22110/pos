@echo off
chcp 65001 > nul
title الحصول على عنوان IP للشبكة المحلية
color 0A

echo.
echo ========================================
echo    عناوين IP للشبكة المحلية
echo ========================================
echo.

echo عناوين IP المتاحة:
ipconfig | findstr "IPv4"

echo.
echo ========================================
echo    للوصول من الشبكة المحلية:
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo http://%%b:5173
    )
)

echo.
echo اضغط أي مفتاح للخروج...
pause > nul

