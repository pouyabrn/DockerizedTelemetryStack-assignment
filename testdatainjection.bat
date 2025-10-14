@echo off
echo Starting Car Telemetry Test Generator...
echo Press Ctrl+C to stop
echo.
wsl bash -c "cd '/mnt/c/Users/pouee/Docker task/DockerizedTelemetryStack-assignment' && node scripts/test-telemetry.js"

