@echo off
chcp 65001 > nul
title فحص المنافذ المستخدمة
color 0A

echo.
echo ========================================
echo    فحص المنافذ المستخدمة
echo ========================================
echo.

echo فحص المنفذ 5173...
netstat -an | findstr :5173
if %errorlevel% equ 0 (
    echo ✅ المنفذ 5173 مستخدم
) else (
    echo ❌ المنفذ 5173 غير مستخدم
)

echo.
echo فحص المنفذ 5174...
netstat -an | findstr :5174
if %errorlevel% equ 0 (
    echo ✅ المنفذ 5174 مستخدم
) else (
    echo ❌ المنفذ 5174 غير مستخدم
)

echo.
echo فحص المنفذ 3000...
netstat -an | findstr :3000
if %errorlevel% equ 0 (
    echo ✅ المنفذ 3000 مستخدم
) else (
    echo ❌ المنفذ 3000 غير مستخدم
)

echo.
echo ========================================
echo    جميع المنافذ المستخدمة
echo ========================================
echo.
netstat -an | findstr LISTENING | findstr ":51"

echo.
echo اضغط أي مفتاح للخروج...
pause > nul

