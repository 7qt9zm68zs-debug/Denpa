@echo off
setlocal EnableExtensions
chcp 65001 >nul

rem Always run from the folder that contains this file.
cd /d "%~dp0"

set "DENPA_PORT=4321"
set "DENPA_URL=http://127.0.0.1:%DENPA_PORT%/"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "BUNDLED_NODE_DIR=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "BUNDLED_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
set "BUNDLED_PNPM_DIR=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback"

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
echo [1/3] Closing old Astro servers on port %DENPA_PORT%...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$connections = Get-NetTCPConnection -LocalPort %DENPA_PORT% -State Listen -ErrorAction SilentlyContinue;" ^
  "foreach ($connection in $connections) {" ^
  "  $process = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $connection.OwningProcess) -ErrorAction SilentlyContinue;" ^
  "  if ($process -and $process.Name -eq 'node.exe' -and $process.CommandLine -match 'astro') {" ^
  "    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue;" ^
  "  }" ^
  "}"

timeout /t 1 /nobreak >nul

for /f %%P in ('powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %DENPA_PORT% -State Listen -ErrorAction SilentlyContinue; if ($c) { 1 } else { 0 }"') do set "DENPA_PORT_BUSY=%%P"

if "%DENPA_PORT_BUSY%"=="1" goto port_busy

echo [2/3] Checking project dependencies...

if not exist "node_modules\astro\astro.js" (
  if exist "%BUNDLED_PNPM%" (
    call "%BUNDLED_PNPM%" install
  ) else (
    where pnpm >nul 2>nul
    if errorlevel 1 goto dependencies_missing
    call pnpm install
  )

  if errorlevel 1 goto install_failed
)

echo [3/3] Starting the latest local version...
echo.
echo Website: %DENPA_URL%
echo Keep this window open while viewing the website.
echo Press Ctrl+C in this window to stop it.
echo.

if /i not "%DENPA_NO_BROWSER%"=="1" (
  start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
    "Start-Sleep -Seconds 2; Start-Process '%DENPA_URL%?refresh=%RANDOM%'"
)

"%NODE_EXE%" "node_modules\astro\astro.js" dev --host 127.0.0.1 --port %DENPA_PORT% --force

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
echo Close that program, then run this file again.
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

:install_failed
echo.
echo [ERROR] Dependency installation failed.
echo Check the messages above, then try again.
echo.
pause
exit /b 1
