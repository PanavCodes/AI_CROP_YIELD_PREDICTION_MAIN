# Start both backend and frontend servers
Write-Host "Starting Crop Prediction App..." -ForegroundColor Green

# Start backend server in a new PowerShell window
Write-Host "Starting backend server on port 5000..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

# Give backend a moment to start
Start-Sleep -Seconds 2

# Start frontend in current window
Write-Host "Starting frontend on port 5173..." -ForegroundColor Cyan
npm run dev