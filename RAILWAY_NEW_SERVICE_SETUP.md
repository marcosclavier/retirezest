# Railway New Service Setup - Complete Guide

## Quick Start - What You Need to Do

1. **Create New Railway Service**
   - Go to: https://railway.app/
   - Click "New Project" or "+" button
   - Select "Deploy from GitHub repo"
   - Choose your repository: `RetireZest/retirezest`
   - **CRITICAL**: Set Root Directory to `webapp/python-api`

2. **Add Environment Variables**
   Copy these from your existing service or add new:
   ```
   DATABASE_URL=postgresql://[your-connection-string]
   JWT_SECRET=[your-jwt-secret]
   STRIPE_SECRET_KEY=[your-stripe-secret-key]
   PORT=8000
   ```

3. **Deploy and Update Frontend**
   - Once deployed, get the new Railway URL
   - Update Vercel environment variable: `NEXT_PUBLIC_PYTHON_API_URL`

## Step-by-Step Instructions

### Step 1: Create New Railway Project

1. Login to Railway: https://railway.app/
2. Click "New Project" (+ button in top right)
3. Select "Deploy from GitHub repo"
4. Authenticate with GitHub if needed
5. Select repository: `RetireZest/retirezest`

### Step 2: Configure Service Settings (CRITICAL)

Before the first deployment:

1. **Set Root Directory**
   - Go to Settings tab
   - Find "Root Directory"
   - Enter: `webapp/python-api`
   - This ensures Railway only sees Python files

2. **Set Build Command** (Optional - Railway should auto-detect)
   - Build command: `pip install -r ../requirements.txt`
   - Start command: `python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Add Environment Variables

Go to Variables tab and add:

```bash
# Database (copy from existing service)
DATABASE_URL=postgresql://[your-postgres-connection-string]

# Authentication
JWT_SECRET=[your-jwt-secret-from-existing-service]

# Stripe
STRIPE_SECRET_KEY=[your-stripe-secret-key]

# Port (Railway provides $PORT automatically, but we can set default)
PORT=8000

# Optional: Python version
PYTHON_VERSION=3.11
```

### Step 4: Verify Correct Build

After triggering deployment, check build logs for:

✅ **Correct Signs:**
```
Installing Python dependencies...
Collecting fastapi
Collecting uvicorn
Collecting psycopg2-binary
```

❌ **Wrong Signs (means it's building frontend):**
```
npm install
npm run build
Installing Node.js
```

### Step 5: Get New Service URL

Once deployed successfully:
1. Go to Settings tab
2. Find "Domains" section
3. Copy the Railway-provided URL (e.g., `your-app.up.railway.app`)

### Step 6: Update Frontend Environment

In Vercel:
1. Go to your RetireZest project
2. Settings → Environment Variables
3. Update: `NEXT_PUBLIC_PYTHON_API_URL`
4. Set to: `https://your-new-railway-url.up.railway.app`
5. Redeploy frontend

## Configuration Files Needed

### Option 1: Minimal Setup (Recommended)
Let Railway auto-detect Python from folder structure.

### Option 2: With railway.toml
Create `webapp/python-api/railway.toml`:
```toml
[deploy]
startCommand = "python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Option 3: With Procfile
Create `webapp/python-api/Procfile`:
```
web: python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

## Troubleshooting

### If Railway Still Builds Node.js

1. **Double-check Root Directory**
   - Must be exactly: `webapp/python-api`
   - Not: `/webapp/python-api` or `python-api`

2. **Clear and Reconnect**
   - Disconnect GitHub repo
   - Reconnect and set root directory before first build

3. **Use railway.toml Override**
   Create `webapp/python-api/railway.toml` with:
   ```toml
   [build]
   builder = "NIXPACKS"
   buildCommand = "pip install -r ../requirements.txt && pip install -r ../requirements-api.txt"

   [deploy]
   startCommand = "python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT"
   ```

### Common Issues and Fixes

| Issue | Solution |
|-------|----------|
| "npm not found" | Wrong root directory - set to `webapp/python-api` |
| "Module api not found" | Remove `cd python-api` from commands (already in that directory) |
| "Connection refused" | Check DATABASE_URL is set correctly |
| "Stripe error" | Add STRIPE_SECRET_KEY to environment variables |

## Verification Checklist

After deployment:

- [ ] Railway shows Python build logs (pip install, not npm)
- [ ] Service status shows "Active"
- [ ] Logs show: "Uvicorn running on http://0.0.0.0:8000"
- [ ] Railway provides a URL (e.g., xxx.up.railway.app)
- [ ] Test endpoint: `https://[your-url]/health` returns OK
- [ ] Update Vercel with new API URL
- [ ] Test production: Rafael scenario shows ~100/100 health score

## Clean Up Old Service

Once new service is working:
1. Keep old service for reference (1-2 days)
2. Export any logs you need
3. Delete old misconfigured service
4. Remove old Railway webhook from GitHub if exists

## Expected Timeline

1. Create service: 2 minutes
2. First build: 3-5 minutes
3. Verify deployment: 1 minute
4. Update Vercel: 2 minutes
5. Test production: 2 minutes

**Total: ~10-15 minutes**

## Success Criteria

You'll know it's working when:
1. Railway builds Python (not Node.js)
2. Logs show Uvicorn server starting
3. Health endpoint responds
4. Production Rafael scenario shows correct health score (~100/100)
5. Pension calculations work correctly

---
Generated: February 16, 2026
Purpose: Create new Railway service to replace misconfigured one