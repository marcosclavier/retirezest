# Fix Vercel Build Error - Complete Guide

## Problem
Vercel build fails with: `Command "npm run build" exited with 1`

## Root Causes
1. **Root Directory not set** - Vercel can't find package.json
2. **Missing DATABASE_URL** - Prisma client generation fails without it

## Solution (Follow ALL steps)

### Step 1: Fix Root Directory (2 minutes)

1. Go to: https://vercel.com
2. Click on your **webapp** project
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)
5. Scroll to **"Build & Development Settings"**
6. Click **Edit** button
7. In **Root Directory**, enter: `webapp`
8. Click **Save**

### Step 2: Set Required Environment Variables (5 minutes)

1. Still in **Settings**, click **Environment Variables** (left sidebar)
2. Add these variables for **Production** environment:

#### DATABASE_URL (Required for build)
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_KEgfJlvIM27u@ep-muddy-band-adte7s70.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview
```

#### JWT_SECRET (Required for auth)
```
Name: JWT_SECRET
Value: development-secret-key-please-change-in-production-min-32-chars
Environment: Production
```

#### RESEND_API_KEY (Required for emails)
```
Name: RESEND_API_KEY
Value: re_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A
Environment: Production
```

#### EMAIL_FROM
```
Name: EMAIL_FROM
Value: noreply@retirezest.com
Environment: Production
```

#### PYTHON_API_URL (Will update after deploying API)
```
Name: PYTHON_API_URL
Value: http://localhost:8000
Environment: Production
```
⚠️ **Note:** We'll update this to the Render URL after deploying the Python API

#### NEXT_PUBLIC_PYTHON_API_URL (Will update after deploying API)
```
Name: NEXT_PUBLIC_PYTHON_API_URL
Value: http://localhost:8000
Environment: Production
```
⚠️ **Note:** We'll update this to the Render URL after deploying the Python API

### Step 3: Redeploy (2 minutes)

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"..."** menu (top right)
4. Click **Redeploy**
5. Wait for deployment to complete (~2 minutes)

### Step 4: Verify Build Success

You should see:
```
✓ Compiled successfully
✓ Generating static pages
Build completed in X seconds
```

---

## After Vercel Build Succeeds

### Next: Deploy Python API to Render

Once Vercel builds successfully, follow these steps:

1. **Go to:** https://render.com
2. **Sign up / Log in** (can use GitHub)
3. Click **"New +"** → **"Web Service"**
4. **Connect GitHub repository:** `retirezest`
5. Configure:
   - **Name:** `retirezest-api`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `juan-retirement-app`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
6. Click **"Create Web Service"**
7. Wait for deployment (~5 minutes)
8. **Copy the deployment URL** (looks like: `https://retirezest-api.onrender.com`)

### Update Vercel Environment Variables

1. Go back to Vercel → Settings → Environment Variables
2. **Edit** `PYTHON_API_URL`:
   - Value: `https://retirezest-api.onrender.com` (your Render URL)
3. **Edit** `NEXT_PUBLIC_PYTHON_API_URL`:
   - Value: `https://retirezest-api.onrender.com` (your Render URL)
4. **Redeploy** Vercel one more time

### Test Production

1. Go to: https://retirezest.com
2. Log in
3. Click **Simulation**
4. Should load without errors!

---

## Troubleshooting

### Build still fails after Step 1-2
- Check Vercel deployment logs for specific error
- Ensure Root Directory is exactly: `webapp` (no leading/trailing slashes)
- Ensure DATABASE_URL is set correctly (check for typos)

### "Prisma Client generation failed"
- DATABASE_URL environment variable is missing or incorrect
- Go to Settings → Environment Variables → Add DATABASE_URL

### Deployment succeeds but simulation page shows error
- Python API not deployed yet → Follow "Deploy Python API to Render" steps
- PYTHON_API_URL not updated → Update environment variables with Render URL

---

## Quick Checklist

- [ ] Set Root Directory to `webapp` in Vercel
- [ ] Add DATABASE_URL environment variable
- [ ] Add JWT_SECRET environment variable
- [ ] Add RESEND_API_KEY environment variable
- [ ] Add EMAIL_FROM environment variable
- [ ] Redeploy on Vercel
- [ ] Verify build succeeds
- [ ] Deploy Python API to Render
- [ ] Update PYTHON_API_URL with Render URL
- [ ] Redeploy Vercel again
- [ ] Test on https://retirezest.com
