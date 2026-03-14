$ErrorActionPreference = "SilentlyContinue"

$port = 3001

# Kill stale backend dev/watch processes from previous terminals.
$backendProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object {
  $cmd = $_.CommandLine
  $cmd -and $cmd -like "*clinic-crm\\apps\\backend*" -and (
    $cmd -like "*npm-cli.js run start:dev*" -or
    $cmd -like "*nest.js*start --watch*" -or
    $cmd -like "*apps\\backend\\dist\\main*"
  )
}
foreach ($proc in $backendProcesses) {
  if ($proc.ProcessId) {
    Write-Host "Killing stale backend process $($proc.ProcessId)..."
    taskkill /PID $proc.ProcessId /T /F | Out-Null
  }
}

# Also free listener on port if anything still owns it.
$netstatLines = netstat -ano | Select-String ":$port"
$pids = @()

foreach ($line in $netstatLines) {
  if ($line.Line -match "LISTENING\s+(\d+)$") {
    $pids += $matches[1]
  }
}

$uniquePids = $pids | Sort-Object -Unique

foreach ($pid in $uniquePids) {
  if ($pid -and $pid -ne "0") {
    Write-Host "Killing process $pid on port $port..."
    taskkill /PID $pid /T /F | Out-Null
  }
}

Write-Host "Starting Nest in watch mode on port $port..."
npm run start:dev
