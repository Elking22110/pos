# فحص المنافذ المستخدمة
Write-Host "========================================" -ForegroundColor Green
Write-Host "    فحص المنافذ المستخدمة" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# فحص المنفذ 5173
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "✅ المنفذ 5173 مستخدم" -ForegroundColor Green
    Write-Host "   العملية: $($port5173.OwningProcess)" -ForegroundColor Cyan
} else {
    Write-Host "❌ المنفذ 5173 غير مستخدم" -ForegroundColor Red
}

# فحص المنفذ 5174
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
if ($port5174) {
    Write-Host "✅ المنفذ 5174 مستخدم" -ForegroundColor Green
    Write-Host "   العملية: $($port5174.OwningProcess)" -ForegroundColor Cyan
} else {
    Write-Host "❌ المنفذ 5174 غير مستخدم" -ForegroundColor Red
}

# فحص المنفذ 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "✅ المنفذ 3000 مستخدم" -ForegroundColor Green
    Write-Host "   العملية: $($port3000.OwningProcess)" -ForegroundColor Cyan
} else {
    Write-Host "❌ المنفذ 3000 غير مستخدم" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    جميع المنافذ المستخدمة (51xx)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$ports = Get-NetTCPConnection | Where-Object { $_.LocalPort -ge 5100 -and $_.LocalPort -le 5199 -and $_.State -eq "Listen" }
foreach ($port in $ports) {
    Write-Host "المنفذ $($port.LocalPort) - العملية: $($port.OwningProcess)" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "اضغط Enter للخروج"

