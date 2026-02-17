# URGENT: Railway Configuration Fix Required

## The Problem
Railway is deploying the **WRONG SERVICE**. It's trying to deploy the Next.js frontend instead of the Python API because:
- Both services are in the same repository
- Railway finds `package.json` first and thinks it's a Node.js project
- All deployment configs (railway.json, Dockerfile, nixpacks.toml) were misconfigured for frontend

## The Solution - Set Root Directory in Railway

### Step 1: Go to Railway Settings
1. Login to Railway: https://railway.app/
2. Go to your project
3. Click on your service (the one showing build errors)
4. Go to **Settings** tab

### Step 2: Set Root Directory
1. Find the **Root Directory** setting
2. Change it from `/` (or empty) to: `python-api`
3. Save the changes

### Step 3: Trigger Rebuild
1. After changing the root directory
2. Either:
   - Click "Redeploy" to trigger a new deployment
   - Or push any small change to GitHub to trigger auto-deploy

## What This Does
By setting root directory to `python-api`, Railway will:
- Only see the Python code in python-api folder
- Ignore the package.json at root level
- Properly detect it as a Python project
- Use the Python dependencies and run the API

## Alternative Solution (If Root Directory Setting Doesn't Work)

### Create a `.railwayignore` file
If Railway doesn't have a root directory setting, create a `.railwayignore` file:

```
# Ignore frontend files
package.json
package-lock.json
node_modules/
.next/
app/
components/
public/
prisma/
*.tsx
*.ts
*.jsx
*.js
!python-api/**
```

This tells Railway to ignore all the Next.js files.

## Current Status of Services

| Service | Platform | Status | Issue |
|---------|----------|--------|-------|
| Frontend (Next.js) | Vercel | ✅ Working | Deployed successfully |
| Python API | Railway | ❌ Broken | Trying to deploy frontend instead of API |
| Local Dev | localhost | ✅ Working | Pension fixes work locally |

## The Commits Waiting to Deploy

Once Railway is properly configured, it will deploy these commits with pension fixes:
- **fb3f986**: Fix critical pension calculation bug
- **6c9a750**: Fix Railway configuration
- **f3134ec**: Simplify Railway configuration

## Verification After Fix

Once Railway deploys the Python API correctly:
1. Check Railway logs - should show Python/uvicorn starting
2. Test production at https://retirezest.com
3. Run Rafael scenario - should show health score ~100/100 (not 37/100)

## Why This Happened

Your project structure has both frontend and backend in the same repo:
```
/webapp
  ├── package.json (Next.js frontend) <- Railway sees this first!
  ├── python-api/  (Python backend)   <- This is what Railway should deploy
  │   ├── api/
  │   └── modules/
  ├── app/ (Next.js pages)
  └── components/ (React components)
```

Railway was configured to deploy from root, so it found package.json and tried to build Next.js instead of the Python API.

---
**Action Required**: Change Railway's Root Directory setting to `python-api`