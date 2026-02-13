@echo off
setlocal

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "API_DIR=%ROOT_DIR%\api"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "VENV_PY=%API_DIR%\.venv\Scripts\python.exe"

if not exist "%API_DIR%\main.py" (
  echo [ERROR] Could not find "%API_DIR%\main.py"
  exit /b 1
)

if not exist "%FRONTEND_DIR%" (
  echo [ERROR] Could not find "%FRONTEND_DIR%"
  exit /b 1
)

if not exist "%VENV_PY%" (
  echo [INFO] No virtual environment found. Creating "%API_DIR%\.venv"...
  python -m venv "%API_DIR%\.venv"
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    exit /b 1
  )

  if not exist "%VENV_PY%" (
    echo [ERROR] Could not find venv Python at "%VENV_PY%" after creation.
    exit /b 1
  )

  if not exist "%API_DIR%\requirements.txt" (
    echo [ERROR] Could not find "%API_DIR%\requirements.txt"
    exit /b 1
  )

  echo [INFO] Installing API dependencies from requirements.txt...
  "%VENV_PY%" -m pip install -r "%API_DIR%\requirements.txt"
  if errorlevel 1 (
    echo [ERROR] Failed to install dependencies from requirements.txt.
    exit /b 1
  )
)

start "FastAPI Dev" /D "%API_DIR%" cmd /k ""%VENV_PY%" -m fastapi dev main.py"
start "Expo Dev" /D "%FRONTEND_DIR%" cmd /k "npx expo start"

endlocal
