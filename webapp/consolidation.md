# Consolidation: juan-retirement-app into webapp

**Status: COMPLETED** (2026-02-11)

## Overview

This document details the consolidation of the Python FastAPI backend (`juan-retirement-app`) into the Next.js webapp, creating a unified monorepo structure.

## Before Consolidation

```
retirezest/
├── juan-retirement-app/          # Python FastAPI backend
│   ├── api/                      # FastAPI routes & models
│   ├── modules/                  # Core calculation engine
│   ├── utils/                    # Helper utilities
│   ├── requirements-api.txt
│   ├── requirements.txt
│   ├── tax_config_canada_2025.json
│   ├── Procfile
│   ├── railway.json
│   ├── render.yaml
│   └── ...
│
└── webapp/                       # Next.js frontend
    ├── app/                      # Next.js pages & API routes
    ├── components/               # React components
    ├── lib/                      # TypeScript utilities
    ├── prisma/                   # Database schema
    └── ...
```

## After Consolidation

```
retirezest/
└── webapp/                       # Unified monorepo
    ├── app/                      # Next.js pages & API routes
    ├── components/               # React components
    ├── lib/                      # TypeScript utilities
    ├── prisma/                   # Database schema
    │
    ├── python-api/               # Python FastAPI backend (NEW)
    │   ├── api/                  # FastAPI routes & models
    │   │   ├── main.py
    │   │   ├── models/
    │   │   ├── routes/
    │   │   └── utils/
    │   ├── modules/              # Core calculation engine
    │   └── utils/                # Python helper utilities
    │
    ├── requirements-api.txt      # Python dependencies
    ├── requirements.txt          # Python dependencies (full)
    ├── tax_config_canada_2025.json
    ├── Procfile                  # Updated for monorepo
    └── ...
```

## Consolidation Steps

### Step 1: Create python-api directory structure

Create the `python-api/` directory inside webapp to house all Python backend code.

```bash
mkdir webapp/python-api
```

### Step 2: Move Python modules

Move the core Python directories:

| Source | Destination |
|--------|-------------|
| `juan-retirement-app/api/` | `webapp/python-api/api/` |
| `juan-retirement-app/modules/` | `webapp/python-api/modules/` |
| `juan-retirement-app/utils/` | `webapp/python-api/utils/` |

### Step 3: Move configuration files

Move configuration files to webapp root:

| Source | Destination |
|--------|-------------|
| `juan-retirement-app/requirements-api.txt` | `webapp/requirements-api.txt` |
| `juan-retirement-app/requirements.txt` | `webapp/requirements.txt` |
| `juan-retirement-app/tax_config_canada_2025.json` | `webapp/tax_config_canada_2025.json` |
| `juan-retirement-app/Procfile` | `webapp/Procfile` |
| `juan-retirement-app/render.yaml` | `webapp/render.yaml` |
| `juan-retirement-app/API-README.md` | `webapp/API-README.md` |

Note: `railway.json` already exists in webapp, will be updated if needed.

### Step 4: Update Python import paths

Update `api/main.py` to reference the new module locations:

**Before:**
```python
from modules.config import load_tax_config
```

**After:**
```python
from modules.config import load_tax_config
# Path adjustment handled via PYTHONPATH or sys.path
```

### Step 5: Update Procfile

Update the Procfile to run from the correct directory:

**Before:**
```
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

**After:**
```
web: cd python-api && uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### Step 6: Update tax_config path in api/main.py

The tax config path needs to reference the webapp root:

**Before:**
```python
tax_config_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "tax_config_canada_2025.json"
)
```

**After:**
```python
tax_config_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "tax_config_canada_2025.json"
)
```

### Step 7: Remove juan-retirement-app

After verifying the consolidation works:

```bash
rm -rf juan-retirement-app/
```

## Files NOT Moved (Intentionally Excluded)

These files from juan-retirement-app were not moved:

| File | Reason |
|------|--------|
| `app.py` | Deleted (Streamlit removal) |
| `app_min.py` | Deleted (Streamlit removal) |
| `baselines/` | Deleted (Streamlit test data) |
| `modules/retirement_graphs.py` | Deleted (Streamlit charts) |
| `actuals_tracker_calculations.py` | Analysis script, not needed for API |
| `advanced_regression_test.py` | Test script, can be recreated |
| `analyze_rrif_withdrawal_strategy.py` | Analysis script |
| `check_user_assets.py` | Debug script |
| `detailed_credits_noneligible.py` | Analysis script |
| `parse_optimization_result.py` | Debug script |
| `rrif_tax_insights.py` | Analysis script |
| `pytest.ini` | Can be recreated if needed |
| `.env.example` | Webapp has its own env examples |
| `scripts/` | Validation scripts |

## Verification Steps

After consolidation, verify the API works:

```bash
cd webapp/python-api
python -m uvicorn api.main:app --port 8000
```

Test endpoints:
```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok","tax_config_loaded":true,"ready":true}
```

## Running in Development

### Option 1: Separate terminals

```bash
# Terminal 1: Next.js frontend
cd webapp
npm run dev

# Terminal 2: Python API
cd webapp/python-api
uvicorn api.main:app --port 8000 --reload
```

### Option 2: Using concurrently (add to package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:api": "cd python-api && uvicorn api.main:app --port 8000 --reload",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:api\""
  }
}
```

## Environment Variables

Ensure these are set for the Python API:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default: 8000) |
| `CORS_ORIGINS` | Allowed CORS origins |

## Deployment Notes

For Railway/Render deployment, ensure:
1. Python buildpack is configured
2. `PYTHONPATH` includes `python-api/`
3. Start command references correct path
