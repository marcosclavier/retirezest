# Railway Python Backend Deployment Instructions

## Critical: Pension Fix Deployment Required

The Python backend on Railway is currently running code from **2 days ago** and does not include the critical pension calculation fixes. The latest commits that need to be deployed are:

- **fb3f986**: Fix critical pension calculation bug - Rafael scenario
- **93f069b**: Remove invalid rootDirectory from vercel.json

## Current Status

✅ **Frontend (Vercel)**: Successfully deployed with latest code
✅ **Local Environment**: Working perfectly (health score 100/100)
❌ **Python Backend (Railway)**: Running old code from 2 days ago without pension fixes

## Manual Deployment Steps

### Option 1: Via Railway Dashboard (Recommended)

1. **Login to Railway**
   - Go to https://railway.app/
   - Login with your credentials

2. **Navigate to Python API Service**
   - Find the RetireZest Python API service
   - It should show the last deployment from "2 days ago"

3. **Trigger New Deployment**
   - Look for a "Deploy" or "Redeploy" button
   - Or check if there's a "GitHub" tab showing pending commits
   - Deploy the latest commit from the main branch (fb3f986 or newer)

4. **Monitor Deployment**
   - Watch the deployment logs
   - Ensure it completes successfully
   - The deployment should include the python-api folder with updated files

### Option 2: Via Railway CLI (If Available)

If you have Railway CLI installed elsewhere:

```bash
# Navigate to the project directory
cd /path/to/retirezest/webapp

# Login to Railway
railway login

# Link to your project
railway link

# Deploy the Python API
railway up

# Check deployment status
railway status
```

### Option 3: Via GitHub Integration

1. **Check Railway GitHub Settings**
   - In Railway dashboard, go to Settings → GitHub
   - Ensure auto-deploy from main branch is enabled
   - If not syncing, try disconnecting and reconnecting the repo

2. **Force Sync**
   - Make a small change to trigger deployment
   - Or use Railway's "Deploy from GitHub" option
   - Select the main branch and latest commit

## Files Changed in Python Backend

The critical fixes are in these files:

1. **python-api/modules/simulation.py** (lines 3338-3348)
   - Added pension_income_total to total_available_after_tax calculation

2. **python-api/api/utils/converters.py** (lines 221-232)
   - Fixed DataFrame iteration to include pension columns

## Verification Steps

After deployment:

1. **Check Railway Logs**
   - Ensure the service started successfully
   - Look for: "Uvicorn running on http://0.0.0.0:8000"

2. **Test Production**
   - Go to https://retirezest.com
   - Login with test account
   - Run Rafael scenario simulation
   - Health score should be ~100/100 (not 37/100)

3. **API Health Check**
   - The production API URL should return the updated code
   - Check that pension calculations are working

## Troubleshooting

If deployment fails:

1. **Check Build Logs**
   - Look for Python dependency issues
   - Ensure requirements.txt is being used

2. **Environment Variables**
   - Verify PORT is set to 8000
   - Check other required env vars are present

3. **Rollback if Needed**
   - If issues occur, rollback to previous deployment
   - Debug locally first before redeploying

## Contact

If you need assistance with Railway deployment:
- Check Railway documentation: https://docs.railway.app/
- Railway support: https://railway.app/help

## Summary

The pension calculation fix is complete and working locally. The only remaining step is to deploy the Python backend to Railway so production users get the corrected calculations. The fix changes how pension income is included in the total available cash calculation, which is critical for accurate retirement projections.

---
Generated: February 15, 2026
Priority: **CRITICAL** - Production users are getting incorrect calculations