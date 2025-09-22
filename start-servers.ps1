# Set the Gemini API key
$env:GEMINI_API_KEY="AIzaSyBYrz7BaZEaO7Waj7_8bAyMqXVxFiRjaN0"

# Function to start backend server
$backendJob = Start-Job -ScriptBlock {
    param($projectPath, $apiKey)
    $env:GEMINI_API_KEY = $apiKey
    Set-Location "$projectPath\server"
    npm start
} -ArgumentList $PSScriptRoot, "AIzaSyBYrz7BaZEaO7Waj7_8bAyMqXVxFiRjaN0"

# Function to start frontend server  
$frontendJob = Start-Job -ScriptBlock {
    param($projectPath)
    Set-Location $projectPath
    npm start
} -ArgumentList $PSScriptRoot

Write-Host "🚀 Starting servers..."
Write-Host "📡 Backend job: $($backendJob.Id)"
Write-Host "🌐 Frontend job: $($frontendJob.Id)"

# Wait a moment for servers to start
Start-Sleep -Seconds 5

Write-Host "✅ Servers should be starting..."
Write-Host "📡 Backend: http://localhost:5000"
Write-Host "🌐 Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers"

# Monitor jobs
try {
    while ($true) {
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "❌ One or more servers failed"
            break
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "🛑 Stopping servers..."
    $backendJob | Stop-Job
    $frontendJob | Stop-Job
    $backendJob | Remove-Job
    $frontendJob | Remove-Job
}