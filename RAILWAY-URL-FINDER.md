# How to Find or Generate Your Railway Public URL

## If You Can't Find the URL in Dashboard

### Option 1: Generate a Public Domain in Railway

1. Go to your Railway project dashboard
2. Click on the **service** (the one showing Python/uvicorn logs)
3. Click the **Settings** tab
4. Scroll down to **Networking** section
5. Look for **"Generate Domain"** or **"Public Networking"**
6. If you see a button like **"Generate Domain"**, click it
7. Railway will create a URL like: `https://your-app-production-xxxxx.up.railway.app`
8. Copy that URL

### Option 2: Check Railway Service Settings

The URL might already exist. In Railway:

1. Click on your service (the Python API one)
2. Look at the top of the page - sometimes the URL is shown there
3. Or check **Settings** → **Domains** or **Networking**
4. You should see either:
   - A generated Railway URL: `https://xyz.up.railway.app`
   - Or an option to "Generate Domain"

### Option 3: Check Deployment Logs

Sometimes the URL appears in the deployment logs:

1. Click **"Deployments"** tab (if available)
2. Click on the latest successful deployment
3. Look for lines mentioning "domain" or "URL"

## What the URL Should Look Like

✅ Correct formats:
- `https://retirezest-production-a1b2c3.up.railway.app`
- `https://juan-retirement-app-production-xyz.up.railway.app`
- `https://web-production-1234.up.railway.app`

❌ Wrong (localhost):
- `http://localhost:8000`
- `http://localhost:8080`
- `http://0.0.0.0:8080`

## Once You Have the URL

### Test it:
```bash
curl https://YOUR-RAILWAY-URL/api/health
```

Should return:
```json
{"status":"ok","service":"Retirement Simulation API","ready":true}
```

### Add to Vercel:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `PYTHON_API_URL`
   - Value: `https://YOUR-RAILWAY-URL` (no trailing slash)
   - Environment: ✓ Production
3. Save
4. Go to Deployments → Redeploy latest deployment
5. Wait 2-3 minutes
6. Test: https://retirezest.com/simulation

## If Railway Doesn't Have Public Networking Enabled

If you don't see any option to generate a domain, Railway might need it enabled:

1. In Service Settings
2. Look for "Public Networking" toggle
3. Enable it
4. A domain should be automatically generated

## Alternative: Use Railway CLI to Get URL

If you have Railway CLI installed:

```bash
railway status
# Shows service URL
```

Or:
```bash
railway domain
# Shows the public domain
```
