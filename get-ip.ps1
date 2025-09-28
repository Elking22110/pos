# الحصول على عنوان IP للشبكة المحلية
Write-Host "عناوين IP للشبكة المحلية:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# الحصول على جميع عناوين IPv4
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like "192.168.*" -or 
    $_.IPAddress -like "10.*" -or 
    $_.IPAddress -like "172.*"
}

foreach ($ip in $ipAddresses) {
    Write-Host "IP: $($ip.IPAddress) - Interface: $($ip.InterfaceAlias)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "للاستخدام في الشبكة المحلية، استخدم:" -ForegroundColor Yellow
foreach ($ip in $ipAddresses) {
    Write-Host "http://$($ip.IPAddress):5173" -ForegroundColor White
}

