Write-Host "Starting Car Telemetry Test Generator..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\Users\pouee\Docker task\DockerizedTelemetryStack-assignment"
wsl bash -c "cd '/mnt/c/Users/pouee/Docker task/DockerizedTelemetryStack-assignment' && node scripts/test-telemetry.js"

