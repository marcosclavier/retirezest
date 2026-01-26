# Deployment Guide for marcosclavier/retirezest

## Repository Information

**GitHub**: https://github.com/marcosclavier/retirezest
**Production Branch**: `main`
**Auto-Deploy**: Enabled (Vercel + Backend Platform)

---

## Deployment Architecture

### Frontend (Next.js → Vercel)
- **Directory**: `webapp/`
- **Platform**: Vercel
- **Project**: `webapp`
- **Auto-Deploy**: ✅ Push to `main` triggers build

### Backend (Python FastAPI → Railway/Render)
- **Directory**: `juan-retirement-app/`
- **Framework**: FastAPI
- **Auto-Deploy**: ✅ Platform-specific

---

## How to Deploy

### 1. Make Changes Locally

```bash
# Ensure you're on main branch
git checkout main

# Pull latest changes
git pull origin main

# Make your changes
# ... edit files ...

# Test locally
cd juan-retirement-app
python3 -m uvicorn api.main:app --reload  # Backend
cd ../webapp
npm run dev  # Frontend
```

### 2. Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: Add nonreg_distributions to API response"

# Push to GitHub (triggers auto-deploy)
git push origin main
```

### 3. Monitor Deployment

**Vercel (Frontend)**:
- Dashboard: https://vercel.com/dashboard
- Select project: `webapp`
- Check "Deployments" tab

**Backend**:
- Check your backend platform dashboard (Railway/Render/etc.)
- Verify logs show successful deployment

### 4. Verify Production

```bash
# Test frontend
curl https://[production-url]

# Test backend health
curl https://[api-url]/api/health

# Expected:
{
  "status": "ok",
  "ready": true
}
```

---

## Rollback Procedures

### Option 1: Git Revert (Recommended)

```bash
git revert HEAD
git push origin main
```

### Option 2: Vercel Instant Rollback

1. Go to https://vercel.com/dashboard
2. Select `webapp` project
3. Go to "Deployments"
4. Find previous working deployment
5. Click "Promote to Production"

### Option 3: Reset to Specific Commit

```bash
git log --oneline  # Find the good commit hash
git reset --hard <commit-hash>
git push origin main --force
```

---

## Environment Variables

### Vercel (Frontend)
Set in Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `PYTHON_API_URL`

### Backend Platform
Set in platform dashboard:
- `PORT` (usually 8000)
- `PYTHON_ENV` (production)
- `DATABASE_URL` (if needed)

---

## Production Testing Checklist

After every deployment:

- [ ] Frontend loads without errors
- [ ] Backend `/api/health` returns 200
- [ ] Run a test simulation (e.g., Rafael & Lucy)
- [ ] Verify RRIF-frontload strategy works
- [ ] Check non-registered distributions display
- [ ] No console errors in browser
- [ ] Charts render correctly

---

## Troubleshooting

### Frontend Build Fails
1. Check Vercel deployment logs
2. Look for TypeScript errors
3. Verify `package.json` dependencies
4. Test build locally: `npm run build`

### Backend Not Deploying
1. Check platform logs
2. Verify `requirements.txt` is valid
3. Check for Python syntax errors
4. Test locally: `uvicorn api.main:app`

### Changes Not Appearing
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear CDN cache in Vercel
3. Verify commit was pushed to `main`
4. Check deployment completed successfully

---

## Contacts

**Repository**: https://github.com/marcosclavier/retirezest
**Vercel Dashboard**: https://vercel.com/dashboard

For issues, create a GitHub issue or check deployment logs.
