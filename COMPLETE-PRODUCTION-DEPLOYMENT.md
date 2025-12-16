# Complete Production Deployment Guide for RetireZest

## Overview

RetireZest has a **two-service architecture**:
1. **Frontend (Next.js)** → Deploy to **Vercel**
2. **Backend (Python API)** → Deploy to **Render.com**

This guide walks through the complete setup from scratch.

---

## Part 1: Fix Vercel Build (5 minutes)

### Step 1.1: Set Root Directory

1. Go to: https://vercel.com
2. Click on your **webapp** project
3. Click **Settings** (top menu)
4. Click **General** (left sidebar)
5. Scroll to **"Build & Development Settings"**
6. Click **Edit**
7. Set **Root Directory** to: `webapp`
8. Click **Save**

### Step 1.2: Add Required Environment Variables

Still in Settings, click **Environment Variables** (left sidebar).

Add these variables for **Production** environment:

#### DATABASE_URL (Required for build + runtime)
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_KEgfJlvIM27u@ep-muddy-band-adte7s70.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development
```

#### JWT_SECRET (Required for authentication)
```
Name: JWT_SECRET
Value: development-secret-key-please-change-in-production-min-32-chars
Environment: Production
```

#### RESEND_API_KEY (Required for password reset emails)
```
Name: RESEND_API_KEY
Value: re_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A
Environment: Production
```

#### EMAIL_FROM (Email sender address)
```
Name: EMAIL_FROM
Value: noreply@retirezest.com
Environment: Production
```

#### PYTHON_API_URL (Will update after Render deployment)
```
Name: PYTHON_API_URL
Value: http://localhost:8000
Environment: Production
```
**Note:** We'll update this to the Render URL in Part 3

#### NEXT_PUBLIC_PYTHON_API_URL (Will update after Render deployment)
```
Name: NEXT_PUBLIC_PYTHON_API_URL
Value: http://localhost:8000
Environment: Production
```
**Note:** We'll update this to the Render URL in Part 3

### Step 1.3: Verify Build Succeeds

1. Go to **Deployments** tab
2. Check the latest deployment status
3. Should see: ✅ **"Building... Completed"**

If build fails, check the logs and verify:
- Root Directory is set to `webapp`
- All environment variables are added
- The latest code (with Resend fix) has been pushed to GitHub

---

## Part 2: Deploy Python API to Render.com (10 minutes)

### Step 2.1: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"** (recommended)
4. Authorize Render to access your GitHub account

### Step 2.2: Create New Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. If your repository isn't listed:
   - Click **"Configure account"**
   - Grant access to the `retirezest` repository
   - Go back and click **"New +"** → **"Web Service"** again
5. Find **retirezest** in the list
6. Click **"Connect"**

### Step 2.3: Configure Web Service

Fill in the following settings:

**Basic Settings:**
- **Name:** `retirezest-api` (or any name you prefer)
- **Region:** Select **Oregon (US West)** (free tier available)
- **Branch:** `main`
- **Root Directory:** `juan-retirement-app` ⚠️ **CRITICAL - Must be exact**

**Build & Deploy:**
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

**Plan:**
- Select **"Free"** ($0/month)
- Note: Free tier spins down after 15 minutes of inactivity

**Advanced Settings (Optional):**
- **Health Check Path:** `/api/health`
- **Python Version:** 3.11 (should auto-detect)

### Step 2.4: Deploy

1. Scroll to the bottom
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes for first deploy)
4. Watch the logs for any errors

### Step 2.5: Get Your API URL

1. Once deployment succeeds, you'll see: ✅ **"Live"**
2. Copy your API URL (top of the page)
   - Format: `https://retirezest-api.onrender.com` or similar
   - This is your **RENDER_API_URL**

### Step 2.6: Test the API

Open in browser:
```
https://YOUR-RENDER-URL.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

---

## Part 3: Connect Frontend to Backend (5 minutes)

### Step 3.1: Update Vercel Environment Variables

1. Go back to: https://vercel.com → Your Project → **Settings** → **Environment Variables**

2. **Edit** `PYTHON_API_URL`:
   - Click the **"..."** menu next to `PYTHON_API_URL`
   - Click **"Edit"**
   - Change value to: `https://YOUR-RENDER-URL.onrender.com`
   - Click **"Save"**

3. **Edit** `NEXT_PUBLIC_PYTHON_API_URL`:
   - Click the **"..."** menu next to `NEXT_PUBLIC_PYTHON_API_URL`
   - Click **"Edit"**
   - Change value to: `https://YOUR-RENDER-URL.onrender.com`
   - Click **"Save"**

### Step 3.2: Redeploy Frontend

1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **"..."** menu (top right)
4. Click **"Redeploy"**
5. Wait for deployment (~2 minutes)

---

## Part 4: Test Production Deployment (5 minutes)

### Test 1: Homepage

1. Go to: https://retirezest.com
2. Should load without errors

### Test 2: Login

1. Go to: https://retirezest.com/login
2. Try logging in with your credentials
3. Should successfully authenticate

### Test 3: Simulation (Most Important!)

1. Go to: https://retirezest.com/simulation
2. Page should load without errors
3. Try running a simulation
4. Should display results with withdrawal strategy working

### Test 4: Password Reset Email

1. Go to: https://retirezest.com/forgot-password
2. Enter: your email address
3. Click **"Send Reset Link"**
4. Check email (and spam folder)
5. Should receive password reset email from `noreply@retirezest.com`

---

## Troubleshooting

### Vercel Build Still Failing

**Check:**
1. Root Directory is exactly: `webapp` (no slashes)
2. DATABASE_URL is set in Environment Variables
3. Latest code is pushed to GitHub (with Resend fix)
4. Check build logs for specific error

**Fix:**
- Go to Deployments → Click failed deployment → View logs

### Render Deployment Failing

**Common Issues:**
1. **Root Directory wrong:** Must be exactly `juan-retirement-app`
2. **Python version:** Should be 3.11 or higher
3. **Missing dependencies:** Check requirements.txt is complete

**Check Logs:**
- Click on your service → **Logs** tab
- Look for error messages during build or startup

### Frontend Works, But Simulation Page Shows Error

**Possible Causes:**
1. PYTHON_API_URL not updated with Render URL
2. Render service is sleeping (free tier spins down)
3. CORS issues (check browser console)

**Fix:**
1. Verify environment variables are correct
2. Visit the Render API URL to wake it up: `https://YOUR-RENDER-URL.onrender.com/api/health`
3. Wait 30 seconds, then try simulation again

### CORS Errors in Browser Console

**Fix:** Add CORS middleware to Python API (should already be configured)

Check `juan-retirement-app/api/main.py` has:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Production Deployment Checklist

### Vercel (Frontend)
- [ ] Root Directory set to `webapp`
- [ ] DATABASE_URL added
- [ ] JWT_SECRET added
- [ ] RESEND_API_KEY added
- [ ] EMAIL_FROM set to `noreply@retirezest.com`
- [ ] PYTHON_API_URL updated with Render URL
- [ ] NEXT_PUBLIC_PYTHON_API_URL updated with Render URL
- [ ] Latest deployment shows ✅ "Completed"
- [ ] https://retirezest.com loads successfully

### Render (Backend)
- [ ] Repository connected
- [ ] Root Directory set to `juan-retirement-app`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
- [ ] Service shows ✅ "Live"
- [ ] Health check endpoint works: `/api/health`

### Testing
- [ ] Login works on production
- [ ] Simulation page loads
- [ ] Can run simulation successfully
- [ ] TFSA First withdrawal strategy works
- [ ] Password reset email sends successfully

---

## Important Notes

### Free Tier Limitations

**Render.com Free Tier:**
- Spins down after 15 minutes of inactivity
- First request after spindown takes ~30 seconds to wake up
- 750 hours/month free (enough for hobby projects)

**Vercel Hobby Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domain included

### Security Recommendations

1. **Change JWT_SECRET in production:**
   ```bash
   openssl rand -base64 32
   ```
   Use this value instead of `development-secret-key...`

2. **Use HTTPS only:** Both Vercel and Render provide automatic HTTPS

3. **Set proper CORS origins:** In production, change `allow_origins=["*"]` to specific domains

### Monitoring

**Render Dashboard:**
- Shows CPU/Memory usage
- Deployment history
- Logs in real-time

**Vercel Dashboard:**
- Shows deployment status
- Build logs
- Analytics (page views, etc.)

---

## Next Steps After Deployment

1. **Test all features** thoroughly on production
2. **Monitor logs** for the first few days
3. **Set up domain email** verification (if not done):
   - Follow: `VERCEL-DOMAIN-VERIFICATION.md`
4. **Consider upgrading** to paid tiers if needed:
   - Render: $7/month (no spindown, better performance)
   - Vercel: $20/month (more bandwidth, team features)

---

## Support

If you encounter issues not covered in this guide:

1. Check Vercel deployment logs
2. Check Render service logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

**Render URL Format:**
- Your API should be accessible at: `https://retirezest-api.onrender.com`
- Replace with your actual URL when configuring Vercel

---

**Once complete, your application will be live at https://retirezest.com with full functionality! 🎉**
