@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

cd /d "%~dp0"

set "DENPA_PORT=4321"
set "DENPA_URL=http://127.0.0.1:%DENPA_PORT%/"
set "DENPA_PROJECT_ROOT=%CD%"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "BUNDLED_NODE_DIR=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "BUNDLED_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
set "BUNDLED_PNPM_DIR=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback"
set "ASTRO_ENTRY=%CD%\node_modules\astro\astro.js"

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
  set "PATH=%BUNDLED_NODE_DIR%;%BUNDLED_PNPM_DIR%;%PATH%"
) else (
  where node >nul 2>nul
  if errorlevel 1 goto node_missing
  set "NODE_EXE=node"
)

echo.
echo ============================================================
echo   DENPA Portfolio - Local Preview
echo ============================================================
echo.
echo Project: %DENPA_PROJECT_ROOT%
echo.
echo [1/4] Closing the previous local preview...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$project = [IO.Path]::GetFullPath($env:DENPA_PROJECT_ROOT);" ^
  "$connections = Get-NetTCPConnection -LocalPort %DENPA_PORT% -State Listen -ErrorAction SilentlyContinue;" ^
  "foreach ($connection in $connections) {" ^
  "  $process = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $connection.OwningProcess) -ErrorAction SilentlyContinue;" ^
  "  $command = [string]$process.CommandLine;" ^
  "  if ($process -and $process.Name -eq 'node.exe' -and ($command -match 'astro' -or $command.Contains($project))) {" ^
  "    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue;" ^
  "  }" ^
  "}"

for /l %%I in (1,1,15) do (
  for /f %%P in ('powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %DENPA_PORT% -State Listen -ErrorAction SilentlyContinue; if ($c) { 1 } else { 0 }"') do set "DENPA_PORT_BUSY=%%P"
  if not "!DENPA_PORT_BUSY!"=="1" goto port_ready
  >nul ping 127.0.0.1 -n 2
)

goto port_busy

:port_ready
echo [2/4] Clearing Astro and Vite development caches...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$project = [IO.Path]::GetFullPath($env:DENPA_PROJECT_ROOT);" ^
  "$targets = @((Join-Path $project '.astro'), (Join-Path $project 'node_modules\.vite'));" ^
  "foreach ($target in $targets) {" ^
  "  $full = [IO.Path]::GetFullPath($target);" ^
  "  if ($full.StartsWith($project, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full)) {" ^
  "    Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction Stop;" ^
  "  }" ^
  "}"

if errorlevel 1 goto cache_failed

echo [3/4] Checking project dependencies...

if not exist "%ASTRO_ENTRY%" (
  if exist "%BUNDLED_PNPM%" (
    call "%BUNDLED_PNPM%" install
  ) else (
    where pnpm >nul 2>nul
    if errorlevel 1 goto dependencies_missing
    call pnpm install
  )

  if errorlevel 1 goto install_failed
)

if not exist "%ASTRO_ENTRY%" goto dependencies_missing

echo [4/4] Starting a clean copy of the latest website...
echo.
echo Website: %DENPA_URL%
echo Keep this window open while viewing the website.
echo Press Ctrl+C in this window to stop it.
echo.

if /i not "%DENPA_NO_BROWSER%"=="1" (
  set "DENPA_BROWSER_URL=%DENPA_URL%?v=%RANDOM%%RANDOM%"
  start "" powershell -NoProfile -WindowStyle Hidden -Command ^
    "$url = $env:DENPA_BROWSER_URL;" ^
    "for ($attempt = 0; $attempt -lt 40; $attempt++) {" ^
    "  try {" ^
    "    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1;" ^
    "    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { Start-Process $url; exit }" ^
    "  } catch {}" ^
    "  Start-Sleep -Milliseconds 250;" ^
    "}"
)

"%NODE_EXE%" "%ASTRO_ENTRY%" dev --host 127.0.0.1 --port %DENPA_PORT% --force

echo.
echo The local website has stopped.
pause
exit /b 0

:node_missing
echo.
echo [ERROR] Node.js was not found.
echo Install Node.js 20 or later, then run this file again:
echo https://nodejs.org/
echo.
pause
exit /b 1

:port_busy
echo.
echo [ERROR] Port %DENPA_PORT% is occupied by another program.
echo Close the program using that port, then double-click run-local.bat again.
echo.
pause
exit /b 1

:dependencies_missing
echo.
echo [ERROR] Project dependencies are missing and pnpm was not found.
echo Open this project in Codex and ask it to install dependencies.
echo.
pause
exit /b 1

:cache_failed
echo.
echo [ERROR] The old Astro cache could not be cleared.
echo Close editors or terminals that may be locking the project, then try again.
echo.
pause
exit /b 1

:install_failed
echo.
echo [ERROR] Dependency installation failed.
echo Check the messages above, then try again.
echo.
pause
exit /b 1
