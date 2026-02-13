@echo off
if /I not "%~1"=="--hold-open" (
  cmd /k ""%~f0" --hold-open %*"
  exit /b
)
shift

setlocal
set "EXIT_CODE=0"

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "API_DIR=%ROOT_DIR%\api"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "VENV_PY=%API_DIR%\.venv\Scripts\python.exe"
set "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN="

if /I "%~1"=="--setup" (
  call "%ROOT_DIR%\setup-dev.bat" --hold-open
  if errorlevel 1 (
    set "EXIT_CODE=1"
    goto END
  )
  shift
)

if not exist "%API_DIR%\main.py" (
  echo [ERROR] Could not find "%API_DIR%\main.py"
  set "EXIT_CODE=1"
  goto END
)

if not exist "%FRONTEND_DIR%" (
  echo [ERROR] Could not find "%FRONTEND_DIR%"
  set "EXIT_CODE=1"
  goto END
)

if not exist "%VENV_PY%" (
  echo [ERROR] Missing "%VENV_PY%". Run setup-dev.bat first.
  set "EXIT_CODE=1"
  goto END
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [WARN] frontend\node_modules is missing. Run setup-dev.bat before starting.
)

if exist "%ROOT_DIR%\.env" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT_DIR%\.env") do (
    if /I "%%A"=="EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN" set "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=%%B"
    if /I "%%A"=="EXPO_PUBLIC_MAPBOX_TOKEN" if not defined EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN set "EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=%%B"
  )
)

if defined EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN (
  echo [INFO] Loaded EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN from root .env for Expo.
) else (
  echo [WARN] Mapbox token not found in root .env. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in frontend/.env or shell env.
)

start "FastAPI Dev" /D "%API_DIR%" cmd /k ""%VENV_PY%" -m fastapi dev main.py"
start "Expo Dev" /D "%FRONTEND_DIR%" cmd /k "set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=%EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN% && npx expo start"

:END
if "%EXIT_CODE%"=="0" (
echo [INFO] Dev servers launched. Press any key to close this launcher window.
) else (
echo [INFO] Setup failed. Press any key to close this launcher window.
)
pause >nul

endlocal
exit /b %EXIT_CODE%
