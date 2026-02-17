# Setup Automatic Railway Deployment

## Current Problem
- Vercel (frontend) deploys automatically when pushing to GitHub
- Railway (Python backend) is NOT deploying automatically
- This causes production to have mismatched frontend/backend versions

## Solution: Enable GitHub Auto-Deploy in Railway

### Step 1: Railway Dashboard Configuration

1. **Go to Railway Dashboard**
   - Navigate to https://railway.app/
   - Open your project: `astonishing-learning`

2. **Go to Settings → Deploy**
   - Click on the Python API service
   - Navigate to Settings tab
   - Find the "Deploy" section

3. **Configure GitHub Triggers**
   - Look for "Automatic Deployments" or "Deploy Triggers"
   - Enable: **"Auto Deploy on Push"**
   - Set Branch: **main** (or master)
   - Check: **"Auto Deploy Enabled"**

4. **Configure Build Settings**
   - Root Directory: `/webapp` (if needed)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd python-api && python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Verify GitHub Integration

1. **Check GitHub Connection**
   - In Railway Settings → Integrations
   - Ensure GitHub is connected
   - Repository should be: `marcosclavier/retirezest`

2. **Check Deploy Hooks**
   - Railway should have created webhooks in your GitHub repo
   - Go to GitHub repo → Settings → Webhooks
   - You should see a Railway webhook

3. **If Missing, Re-connect:**
   - Disconnect GitHub in Railway
   - Reconnect and select the repository
   - Choose the main branch
   - Enable auto-deploy

### Step 3: Alternative - Railway Deploy Hook

If GitHub integration isn't working, use Railway's deploy webhook:

1. **Get Deploy Hook URL**
   - In Railway → Settings → Deploy
   - Look for "Deploy Hooks" or "Webhooks"
   - Create a new deploy hook
   - Copy the webhook URL

2. **Add to GitHub Actions**
   Create `.github/workflows/deploy-railway.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
    paths:
      - 'webapp/python-api/**'
      - 'webapp/requirements.txt'
      - 'webapp/railway.toml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Railway Deploy
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
```

3. **Add Secret to GitHub**
   - Go to GitHub repo → Settings → Secrets
   - Add new secret: `RAILWAY_WEBHOOK_URL`
   - Paste the Railway webhook URL

### Step 4: Manual Trigger via API

If you need to manually trigger deployment:

```bash
# Using Railway CLI (if installed)
railway up

# Using curl with deploy hook
curl -X POST https://your-deploy-hook-url.railway.app
```

### Step 5: Verify Auto-Deploy is Working

1. **Make a test commit:**
```bash
echo "# Test deployment" >> test.md
git add test.md
git commit -m "Test auto-deployment"
git push origin main
```

2. **Check Railway Dashboard:**
   - Should show "Building" or "Deploying" status
   - Watch the build logs
   - Verify deployment completes

3. **Remove test file:**
```bash
git rm test.md
git commit -m "Remove test file"
git push origin main
```

## Current Service Configuration

### Railway Service Details:
- **Service Name:** astonishing-learning-production
- **URL:** astonishing-learning-production.up.railway.app
- **Region:** us-west2
- **Last Deploy:** 6 hours ago (needs update)

### Required Environment Variables:
```
PORT=8000
PYTHON_VERSION=3.11
```

### Build Configuration (railway.toml):
```toml
[build]
builder = "NIXPACKS"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "cd python-api && python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Troubleshooting

### If auto-deploy still doesn't work:

1. **Check Railway Logs**
   - View logs for error messages
   - Check if webhook is being received

2. **Verify GitHub Permissions**
   - Railway needs read access to your repo
   - Check GitHub → Settings → Applications → Railway

3. **Check Branch Protection**
   - If main branch is protected, Railway needs proper permissions
   - May need to add Railway as an exception

4. **Railway Support**
   - Contact Railway support
   - Share your project ID
   - Ask them to check webhook configuration

## Summary

The goal is to have both services deploy automatically:
- **Vercel (Frontend):** ✅ Already auto-deploys on push to main
- **Railway (Backend):** ❌ Needs configuration (follow steps above)

Once configured, the deployment flow will be:
1. Push to GitHub main branch
2. Vercel automatically builds and deploys frontend
3. Railway automatically builds and deploys Python backend
4. Both services stay in sync

## Manual Deploy Command (Temporary)

Until auto-deploy is configured, manually deploy with:
1. Go to Railway dashboard
2. Click on the service
3. Click "Redeploy" or trigger from Settings
4. Select latest commit from main branch