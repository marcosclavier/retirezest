# Production Deployment Fix - Python API Connection

**Issue**: retirezest.com/simulation shows "Python API is not responding"
**Root Cause**: Vercel deployment missing `PYTHON_API_URL` environment variable
**Status**: Requires immediate action

---

## Problem Summary

The production site has two components:
1. **Next.js Frontend** - Deployed on Vercel ✅ Working
2. **Python API Backend** - Should be deployed on Railway ❌ Not connected

The frontend is trying to connect to the Python API but doesn't know where to find it.

---

## Solution: Connect Vercel to Railway

### Step 1: Deploy Python API to Railway

**Option A: If Railway is NOT set up yet**

1. Go to [Railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `retirezest` repository
4. Railway will auto-detect the Python app in `juan-retirement-app/`
5. Railway will automatically use the configuration from `railway.json`
6. Wait for deployment to complete (~2-3 minutes)
7. Copy the Railway URL (something like `https://juan-retirement-app-production.up.railway.app`)

**Option B: If Railway is already set up**

1. Go to your Railway dashboard
2. Find the Python API service
3. Check if it's deployed and running (green checkmark)
4. Copy the public URL from the service settings
5. If it's not running, click "Deploy" to redeploy

### Step 2: Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `retirezest` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `PYTHON_API_URL`
   - **Value**: Your Railway URL (e.g., `https://juan-retirement-app-production.up.railway.app`)
   - **Environments**: Select "Production", "Preview", and "Development"
5. Click "Save"

### Step 3: Redeploy Vercel

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **3 dots** on the latest production deployment
3. Click **Redeploy**
4. Wait ~2-3 minutes for redeployment
5. Visit retirezest.com/simulation and test

---

## Verification Steps

### 1. Check Railway Deployment

Visit your Railway URL directly:
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Retirement Simulation API",
  "version": "1.0.0",
  "ready": true
}
```

### 2. Check Vercel Health Endpoint

```bash
curl https://retirezest.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up" },
    "pythonApi": { "status": "up" }
  }
}
```

### 3. Test Simulation Page

1. Go to https://retirezest.com/simulation
2. The "Python API is not responding" error should be gone
3. You should see the simulation form

---

## Alternative: Quick Check from Terminal

You can verify if Railway is set up with the Railway CLI:

```bash
# Install Railway CLI (if not already installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Check project status
railway status

# Get the Railway URL
railway open
```

---

## Environment Variables Needed on Vercel

Here's the complete list of production environment variables that should be configured on Vercel:

### Required
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `JWT_SECRET` - Authentication secret
- ✅ `NEXTAUTH_SECRET` - NextAuth secret
- ✅ `NEXTAUTH_URL` - Production URL (https://retirezest.com)
- ✅ `NEXT_PUBLIC_APP_URL` - Production URL (https://retirezest.com)
- ❌ `PYTHON_API_URL` - **MISSING** - Railway URL

### Optional
- `SENTRY_DSN` - Error tracking (if Sentry is set up)
- `LOG_LEVEL` - Logging level (default: info)
- `RESEND_API_KEY` - Email service (for password reset)

---

## Architecture Diagram

```
User Browser
     ↓
retirezest.com (Vercel - Next.js)
     ↓ (via PYTHON_API_URL)
Railway Python API
     ↓
PostgreSQL Database
```

**The Missing Link**: `PYTHON_API_URL` tells Vercel where Railway is!

---

## If Railway Deployment Fails

If you encounter issues deploying to Railway:

1. **Check Logs**:
   - Railway Dashboard → Your Service → Deployments → View Logs
   - Look for errors in the build or start phase

2. **Common Issues**:
   - **Port binding**: Railway sets `$PORT` automatically, our config handles this ✅
   - **Dependencies**: Make sure `requirements.txt` is up to date
   - **Start command**: Configured in `railway.json` ✅

3. **Manual Deploy**:
   ```bash
   # From project root
   cd juan-retirement-app
   railway up
   ```

---

## Quick Reference Commands

### Test Local Connection
```bash
# Terminal 1: Start Python API
cd juan-retirement-app
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Test health
curl http://localhost:8000/api/health
```

### Test Production Connection
```bash
# Check Python API directly
curl https://YOUR-RAILWAY-URL/api/health

# Check Vercel health (should report Python API status)
curl https://retirezest.com/api/health

# Check if Vercel can reach Python API
curl https://retirezest.com/api/simulation/run -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Timeline

1. **Deploy Python API to Railway**: ~5 minutes
2. **Add `PYTHON_API_URL` to Vercel**: ~2 minutes
3. **Redeploy Vercel**: ~3 minutes
4. **Test and verify**: ~2 minutes

**Total time**: ~12 minutes

---

## Need Help?

If you're not sure about your Railway status:
1. Check Railway dashboard: https://railway.app/dashboard
2. Look for a service named something like "juan-retirement-app" or "retirezest-api"
3. If you don't see it, you'll need to create a new deployment (Step 1, Option A above)

---

## Files Reference

- `juan-retirement-app/railway.json` - Railway configuration ✅
- `juan-retirement-app/Procfile` - Railway start command ✅
- `webapp/app/api/health/route.ts:12` - Where `PYTHON_API_URL` is used
- `webapp/.env.production.template` - Template (should include PYTHON_API_URL)

---

**Next Step**: Check your Railway dashboard to see if the Python API is deployed, then follow the steps above.
