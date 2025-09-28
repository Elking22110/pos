# تشغيل خادم نظام نقاط البيع
Write-Host "تشغيل خادم نظام نقاط البيع..." -ForegroundColor Green
Write-Host ""

# الانتقال إلى مجلد المشروع
Set-Location -Path "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos"

# التحقق من وجود Node.js
try {
    $nodeVersion = node --version
    Write-Host "إصدار Node.js: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "خطأ: Node.js غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    exit 1
}

# التحقق من وجود npm
try {
    $npmVersion = npm --version
    Write-Host "إصدار npm: $npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "خطأ: npm غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    exit 1
}

# تشغيل الخادم
Write-Host "تشغيل خادم التطوير..." -ForegroundColor Yellow
npm run dev

