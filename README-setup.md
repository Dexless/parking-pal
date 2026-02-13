# Parking Pal Setup

- Python 3.11 or newer 
- Node.js 20 or newer

Check versions:

Create or update the root `.env` file:
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` (required for map rendering)
- Database variables used by the API (`DB_PASS`)

Use `.env.example` as a template.

## 1. First-Time Setup (Installs Dependencies)

Run:

```powershell
.\setup-dev.bat
```

This script:
- Creates `api/.venv` if missing
- Installs API dependencies from `api/requirements.txt`
- Installs frontend dependencies in `frontend/` (`npm ci`, with `npm install` fallback)

## 2. Start Development Servers

Run:

```powershell
.\start-dev.bat
```

This script only launches:
- FastAPI in `api/`
- Expo in `frontend/`
No dependency installation happens in `start-dev.bat`.

## Optional: Setup + Start in One Command

Run:

```powershell
.\start-dev.bat --setup
```

This runs `setup-dev.bat` first, then launches both dev servers.
