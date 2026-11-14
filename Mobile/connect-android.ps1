$ErrorActionPreference = 'Stop'

$adbCandidates = @(
  (Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'),
  'C:\Users\ASUS\AppData\Local\Android\Sdk\platform-tools\adb.exe'
)
$adb = $adbCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $adb) {
  throw 'Không tìm thấy adb.exe. Hãy mở Android Studio và cài Android SDK Platform-Tools.'
}

& $adb start-server | Out-Host
$devices = @(& $adb devices)
$connected = $devices | Select-String '\tdevice$'
if (-not $connected) {
  throw 'Chưa có Android Emulator/thiết bị ADB. Hãy mở emulator rồi chạy lại script.'
}

& $adb reverse --remove tcp:5001 2>$null
& $adb reverse --remove tcp:8083 2>$null
& $adb reverse tcp:5001 tcp:5001
& $adb reverse tcp:8083 tcp:8083
$mappings = @(& $adb reverse --list)
if (-not (($mappings -match 'tcp:5001') -and ($mappings -match 'tcp:8083'))) {
  throw 'Không tạo được chuyển tiếp cổng 5001/8083.'
}

Write-Host 'Đã kết nối Android với proxy API cổng 5001 và Metro cổng 8083.' -ForegroundColor Green
Write-Host 'Mapping:' ($mappings -join ' | ')
Write-Host 'Giữ Backend và backend-proxy.cjs đang chạy, sau đó reload app.'
