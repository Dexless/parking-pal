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
  echo [ERROR] Could not find venv Python at "%VENV_PY%"
  echo Create it with: python -m venv "%API_DIR%\.venv"
  exit /b 1
)

start "FastAPI Dev" /D "%API_DIR%" cmd /k ""%VENV_PY%" -m fastapi dev main.py"
start "Expo Dev" /D "%FRONTEND_DIR%" cmd /k "npx expo start"

endlocal
