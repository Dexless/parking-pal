@echo off
if /I not "%~1"=="--hold-open" (
  cmd /k ""%~f0" --hold-open"
  exit /b
)

setlocal
set "EXIT_CODE=0"

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "API_DIR=%ROOT_DIR%\api"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "VENV_PY=%API_DIR%\.venv\Scripts\python.exe"

if not exist "%API_DIR%\main.py" (
  echo [ERROR] Could not find "%API_DIR%\main.py"
  set "EXIT_CODE=1"
  goto END
)

if not exist "%API_DIR%\requirements.txt" (
  echo [ERROR] Could not find "%API_DIR%\requirements.txt"
  set "EXIT_CODE=1"
  goto END
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Could not find "%FRONTEND_DIR%\package.json"
  set "EXIT_CODE=1"
  goto END
)

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found in PATH. Install Python 3.11+ and rerun setup.
  set "EXIT_CODE=1"
  goto END
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH. Install Node.js 20+ and rerun setup.
  set "EXIT_CODE=1"
  goto END
)

if not exist "%VENV_PY%" (
  echo [INFO] Creating Python virtual environment at "%API_DIR%\.venv"...
  python -m venv "%API_DIR%\.venv"
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    set "EXIT_CODE=1"
    goto END
  )
)

if not exist "%VENV_PY%" (
  echo [ERROR] Could not find venv Python at "%VENV_PY%".
  set "EXIT_CODE=1"
  goto END
)

echo [INFO] Installing API dependencies...
"%VENV_PY%" -m pip install -r "%API_DIR%\requirements.txt"
if errorlevel 1 (
  echo [ERROR] Failed to install API dependencies.
  set "EXIT_CODE=1"
  goto END
)

echo [INFO] Installing frontend dependencies...
pushd "%FRONTEND_DIR%"
if exist package-lock.json (
  call npm.cmd ci
  if errorlevel 1 (
    echo [WARN] npm ci failed. Falling back to npm install...
    call npm.cmd install
  )
) else (
  call npm.cmd install
)
set "NPM_EXIT=%ERRORLEVEL%"
popd

if not "%NPM_EXIT%"=="0" (
  echo [ERROR] Failed to install frontend dependencies.
  set "EXIT_CODE=1"
  goto END
)

echo [INFO] Setup complete.

:END
if "%EXIT_CODE%"=="0" (
  echo [INFO] Setup succeeded. Press any key to close this window.
) else (
  echo [INFO] Setup failed. Press any key to close this window.
)
pause >nul

endlocal
exit /b %EXIT_CODE%
