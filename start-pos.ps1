# نظام نقاط البيع - تشغيل الخادم
Write-Host "========================================" -ForegroundColor Green
Write-Host "    نظام نقاط البيع - تشغيل الخادم" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# الانتقال إلى مجلد السكريبت
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $scriptPath

Write-Host "المجلد الحالي: $PWD" -ForegroundColor Cyan

# التحقق من وجود package.json
if (-not (Test-Path "package.json")) {
    Write-Host "خطأ: ملف package.json غير موجود!" -ForegroundColor Red
    Write-Host "تأكد من أنك في المجلد الصحيح" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# التحقق من Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "خطأ: Node.js غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    Write-Host "يرجى تثبيت Node.js من: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# التحقق من npm
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "خطأ: npm غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host ""
Write-Host "تثبيت التبعيات..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    تشغيل خادم التطوير..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "الخادم سيعمل على:" -ForegroundColor Cyan
Write-Host "- المحلي: http://localhost:5173" -ForegroundColor White
Write-Host "- الشبكة المحلية: http://192.168.1.5:5173" -ForegroundColor White
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف الخادم" -ForegroundColor Yellow
Write-Host ""

npm run dev

