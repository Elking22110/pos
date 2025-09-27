# POS System Server Startup Script (Fixed Version)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   POS System Server Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check and start server
function Start-POSServer {
    param([string]$Path)
    
    if (Test-Path "$Path\package.json") {
        Write-Host "✓ Found project in: $Path" -ForegroundColor Green
        Set-Location $Path
        Write-Host "Changed to: $(Get-Location)" -ForegroundColor Yellow
        return $true
    }
    return $false
}

Write-Host "Checking project directories..." -ForegroundColor Yellow
Write-Host ""

# Check current directory
if (Test-Path "package.json") {
    Write-Host "✓ Found package.json in current directory" -ForegroundColor Green
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
} else {
    # Try different paths
    $paths = @(
        "pos",
        "pos_system_modern_ui", 
        "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos",
        "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos_system_modern_ui"
    )
    
    $found = $false
    foreach ($path in $paths) {
        Write-Host "Checking: $path" -ForegroundColor Gray
        if (Start-POSServer $path) {
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "❌ Could not find package.json in any expected location" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please make sure you're running this script from the correct directory" -ForegroundColor Red
        Write-Host "or that the project files exist in the expected locations." -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    npm install
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Starting Development Server" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npm run dev
} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
