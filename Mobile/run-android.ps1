$ErrorActionPreference = 'Stop'

$mobileRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$adb = 'C:\Users\ASUS\AppData\Local\Android\Sdk\platform-tools\adb.exe'
$javaHome = 'C:\Program Files\Android\Android Studio\jbr'
$androidHome = 'C:\Users\ASUS\AppData\Local\Android\Sdk'

if (-not (Test-Path -LiteralPath $adb)) {
  throw 'Không tìm thấy adb.exe. Hãy mở Android Studio và cài Android SDK Platform-Tools.'
}

$proxyRunning = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'backend-proxy\.cjs' }
if (-not $proxyRunning) {
  Start-Process -FilePath 'node.exe' -ArgumentList '.\backend-proxy.cjs' -WorkingDirectory $mobileRoot -WindowStyle Hidden
  Start-Sleep -Seconds 1
}

& $adb start-server | Out-Host
$deviceLines = @(& $adb devices)
if (-not ($deviceLines | Select-String '\tdevice$')) {
  throw 'Chưa có Android Emulator/thiết bị ADB. Hãy mở emulator rồi chạy lại.'
}

# Ghi đè mapping hiện tại nếu có; không xóa mapping trước vì ADB sẽ báo lỗi
# khi cổng chưa từng được reverse và làm script dừng giữa chừng.
& $adb reverse tcp:5001 tcp:5001
& $adb reverse tcp:8083 tcp:8083

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:Path = "$javaHome\bin;$env:Path"
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:5001/api'

Set-Location -LiteralPath $mobileRoot
npx.cmd expo run:android --port 8083
