@echo off
setlocal
cd /d "%~dp0"

set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%CODEX_NODE%" (
  set "NODE_EXE=%CODEX_NODE%"
  goto start
)

where node >nul 2>nul
if %errorlevel% equ 0 (
  set "NODE_EXE=node"
  goto start
)

echo.
echo [ERROR] Node.js was not found.
echo Install Node.js 20 or later, then run this file again.
echo https://nodejs.org/
echo.
pause
exit /b 1

:start
if not exist "node_modules\astro\astro.js" (
  echo.
  echo [ERROR] Project dependencies are missing.
  echo Open this project in Codex and ask it to install the dependencies.
  echo.
  pause
  exit /b 1
)

echo.
echo Denpa Portfolio is starting...
echo Open http://127.0.0.1:4321 in your browser.
echo Press Ctrl+C to stop the local website.
echo.

"%NODE_EXE%" "node_modules\astro\astro.js" dev --host 127.0.0.1 --port 4321

echo.
echo The local website has stopped.
pause
