@echo off
chcp 65001 > nul
title إصلاح الفواتير غير المكتملة
color 0A

echo.
echo ========================================
echo    إصلاح الفواتير غير المكتملة
echo ========================================
echo.

echo جاري فتح أداة الإصلاح...
echo.

REM فتح ملف HTML في المتصفح الافتراضي
start "" "diagnose-invoices.html"

echo تم فتح أداة التشخيص في المتصفح
echo.
echo يمكنك أيضاً:
echo 1. فتح ملف fix-invoices.js في وحدة تحكم المتصفح
echo 2. أو استخدام أداة التشخيص المفتوحة
echo.

pause

