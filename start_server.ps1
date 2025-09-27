# POS System Server Startup Script
Write-Host "Starting POS System Server..." -ForegroundColor Green
Write-Host ""

# Set the project directory
$projectPath = "C:\Users\Hassa\OneDrive\سطح المكتب\pos_system_modern_ui\pos"

# Check if directory exists
if (Test-Path $projectPath) {
    Write-Host "Project directory found: $projectPath" -ForegroundColor Yellow
    Set-Location $projectPath
    
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    
    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host ""
    
    # Start development server
    Write-Host "Starting development server..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "Error: Project directory not found at: $projectPath" -ForegroundColor Red
    Write-Host "Please check the path and try again." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
