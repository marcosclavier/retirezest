# Deployment Steps for marcosclavier/retirezest

## Current Status
✅ Changes have been committed locally with commit hash: c96bed8
❌ Need to push to GitHub (permission issue)
⏳ Waiting for Vercel deployment

## Step 1: Fix GitHub Authentication

You have two options:

### Option A: Add juanclavierb as a collaborator
1. Go to https://github.com/marcosclavier/retirezest
2. Click on Settings → Manage access → Add people
3. Add `juanclavierb` as a collaborator
4. Accept the invitation from juanclavierb's email
5. Then run: `git push origin main`

### Option B: Use marcosclavier credentials
1. Update git credentials:
```bash
git config user.name "marcosclavier"
git config user.email "marcosclavier@gmail.com"
```

2. Push with marcosclavier's GitHub token:
```bash
# Create a personal access token at https://github.com/settings/tokens
# Then push using:
git push https://marcosclavier:<TOKEN>@github.com/marcosclavier/retirezest.git main
```

## Step 2: Push to GitHub

Once authentication is fixed, the changes will be pushed. The commit includes:
- Simulation API bug fixes
- Beta notices on UI
- Data format transformation for Python API

## Step 3: Vercel Deployment

### Automatic Deployment (if configured)
If Vercel is connected to the GitHub repository, it will automatically deploy when you push to main branch.

1. Check deployment status at: https://vercel.com/marcosclavier/retirezest
2. Monitor the build logs for any errors
3. Deployment usually takes 2-5 minutes

### Manual Deployment (if needed)
If automatic deployment is not set up:

1. Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```

2. Deploy from command line:
```bash
vercel --prod
```

## Step 4: Verify Production Deployment

### Check these endpoints:
1. **Home Page**: https://retirezest.com
   - Verify beta notice appears in hero section
   - Check beta badge in navigation

2. **Dashboard**: https://retirezest.com/dashboard
   - Verify beta badge appears next to logo

3. **Simulation**: https://retirezest.com/simulation
   - Test running a simulation
   - Verify it completes without "SIMULATION FAILED" error

### Environment Variables to Verify in Vercel:
- `DATABASE_URL` - Should point to production PostgreSQL
- `JWT_SECRET` - Keep existing secret
- `PYTHON_API_URL` - Should point to production Python API
- `NEXT_PUBLIC_APP_URL` - Should be https://retirezest.com
- `NODE_ENV` - Should be "production"
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Production Cloudflare key
- `TURNSTILE_SECRET_KEY` - Production Cloudflare secret
- `RESEND_API_KEY` - Production email API key

## Step 5: Monitor After Deployment

### Check for:
1. No console errors in browser
2. Successful simulation runs
3. Python API stability (watch for BrokenPipeError)
4. User feedback on beta notices

## Rollback Plan (if needed)

If issues occur:

1. **Via Vercel Dashboard**:
   - Go to Vercel dashboard
   - Click on the deployment
   - Use "Instant Rollback" to previous version

2. **Via Git**:
```bash
# Revert the commit
git revert c96bed8
git push origin main
# This will trigger a new deployment with the reverted code
```

## Files Changed in This Deployment

### Modified:
- `app/api/simulation/run/route.ts` - Fixed data format for main simulation
- `app/api/simulation/quick-start/route.ts` - Fixed data format for quick simulation
- `components/landing/HeroSection.tsx` - Added beta notice
- `components/landing/LandingNav.tsx` - Added beta badge
- `app/(dashboard)/layout.tsx` - Added beta badge to dashboard

## Support Contacts

- GitHub Repository: https://github.com/marcosclavier/retirezest
- Vercel Dashboard: https://vercel.com/marcosclavier
- Production Site: https://retirezest.com

## Notes
- The Python API must be running and accessible from production
- Database schema is already up to date (no migrations needed)
- Changes are backwards compatible