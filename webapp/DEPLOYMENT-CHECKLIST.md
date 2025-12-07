# 🚀 Vercel Deployment Checklist

**Date:** 2025-12-06
**Status:** Ready to Deploy

---

## ✅ Pre-Deployment (COMPLETED)

- [x] Production build tested and verified
- [x] Security secrets generated
- [x] Deployment configuration files created
- [x] All changes committed locally

---

## 📋 Deployment Steps

### Step 1: Sign In to Vercel

1. Go to: **https://vercel.com/dashboard**
2. Sign in with your GitHub account (`juanclavierb`)

---

### Step 2: Import Repository

Two options:

**Option A - Import from GitHub (Requires push access):**
1. Click "Add New Project"
2. Select repository: `marcosclavier/retirezest`
3. Set **Root Directory**: `webapp`
4. Framework: Next.js (auto-detected)

**Option B - Deploy from Local (Use this if no GitHub access):**
1. Run in terminal: `npx vercel`
2. Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `retirezest` (or your choice)
   - Directory? `./` (current directory is webapp)
   - Override settings? **N**

---

### Step 3: Configure Environment Variables

Before deploying, add these in Vercel:

#### Go to: Project Settings → Environment Variables

**Required Variables:**

```
Variable Name: NODE_ENV
Value: production
Environment: Production
```

```
Variable Name: JWT_SECRET
Value: +c3uKI5qC0x89/n8duVhbhnCnIncCRDuGS1HrsPBnb8=
Environment: Production
```

```
Variable Name: NEXTAUTH_SECRET
Value: c08A/ieD/wwxGS2RXzX1RkiQV+GavSkITCOLwfb8BYU=
Environment: Production
```

**⚠️ Leave blank for now (will update after deployment):**
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

**⚠️ Will be added in next step:**
- `DATABASE_URL`

---

### Step 4: Set Up PostgreSQL Database

#### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard → **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Database name: `retirement-app-db`
5. Region: Choose closest to users (e.g., `iad1` for US East)
6. Click **"Create"**

✅ Vercel automatically adds `DATABASE_URL` to your environment variables!

#### Option B: Neon (Good free tier)

1. Go to: **https://neon.tech**
2. Sign up and create a project
3. Create a database named `retirement_app`
4. Copy connection string
5. In Vercel → Environment Variables:
   ```
   Variable Name: DATABASE_URL
   Value: <your-neon-connection-string>?sslmode=require
   Environment: Production
   ```

---

### Step 5: Deploy!

**If using GitHub import:**
- Click **"Deploy"** button
- Wait 2-3 minutes for build

**If using CLI:**
- Run: `npx vercel --prod`
- Wait for deployment

---

### Step 6: Get Your Deployment URL

After deployment completes:

1. Vercel will show your URL: `https://retirezest.vercel.app` (or similar)
2. **Copy this URL**

---

### Step 7: Update URL Environment Variables

1. Go back to: Project Settings → Environment Variables
2. Add these new variables:

```
Variable Name: NEXTAUTH_URL
Value: https://your-actual-vercel-url.vercel.app
Environment: Production
```

```
Variable Name: NEXT_PUBLIC_APP_URL
Value: https://your-actual-vercel-url.vercel.app
Environment: Production
```

3. **Redeploy:**
   - Go to Deployments tab
   - Click latest deployment
   - Click "..." menu → **"Redeploy"**

---

### Step 8: Run Database Migrations

**Open terminal and run:**

```bash
# Pull production environment variables
npx vercel env pull .env.production

# Run migrations (use the DATABASE_URL from Vercel)
source .env.production
npx prisma migrate deploy
```

**Or manually:**
```bash
DATABASE_URL="<your-production-database-url>" npx prisma migrate deploy
```

---

### Step 9: Verify Deployment

#### Test Health Endpoints:

```bash
# Basic health check
curl https://your-app.vercel.app/api/health

# Database connectivity check
curl https://your-app.vercel.app/api/health/ready
```

#### Test in Browser:

1. Visit: `https://your-app.vercel.app`
2. Click **"Register"** → Create a test account
3. Click **"Login"** → Sign in
4. Go to **Profile** → Add test data
5. Run a **Simulation**

---

### Step 10: Optional - Configure Custom Domain

1. Go to: Project Settings → Domains
2. Click **"Add"**
3. Enter your domain (e.g., `retirezest.com`)
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to custom domain

---

### Step 11: Optional - Set Up Sentry (Error Tracking)

1. Go to: **https://sentry.io**
2. Create account and project
3. Get your DSN, Org, and Project name
4. Add to Vercel Environment Variables:
   ```
   SENTRY_DSN=<your-sentry-dsn>
   SENTRY_ORG=<your-org>
   SENTRY_PROJECT=<your-project>
   SENTRY_AUTH_TOKEN=<your-token>
   ```
5. Redeploy

---

## ✅ Post-Deployment Checklist

Verify these are working:

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Profile page displays
- [ ] Can add income/expenses/assets/debts
- [ ] Can create scenarios
- [ ] Can run simulations
- [ ] Simulation results display charts
- [ ] Database persists data (refresh page, data still there)
- [ ] Health endpoints return 200
- [ ] No console errors in browser

---

## 📊 Monitor Your Deployment

### Vercel Analytics
- Go to: **Analytics** tab
- View traffic, Web Vitals, performance

### Vercel Logs
- Go to: **Deployments** tab → Select deployment
- View: **"Functions"** tab for runtime logs
- View: **"Build Logs"** tab for build output

### Sentry (if configured)
- Go to: **https://sentry.io/organizations/your-org/issues/**
- View errors and performance metrics

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Prisma Client not generated"**
- Check `vercel.json` has `buildCommand: "prisma generate && next build"`

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`, not just `devDependencies`

### Runtime Errors

**Database connection fails:**
```bash
# Verify DATABASE_URL is set
npx vercel env ls

# Check database is accessible
npx vercel env pull .env.production
source .env.production
npx prisma db pull
```

**JWT/Auth errors:**
- Verify `JWT_SECRET` is at least 32 characters
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL exactly

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** support@vercel.com
- **Project Docs:** See `docs/VERCEL-DEPLOYMENT.md`

---

## 📝 Generated Secrets (Reference)

**⚠️ These are stored in `.env.production.secrets` (gitignored)**

```
JWT_SECRET=+c3uKI5qC0x89/n8duVhbhnCnIncCRDuGS1HrsPBnb8=
NEXTAUTH_SECRET=c08A/ieD/wwxGS2RXzX1RkiQV+GavSkITCOLwfb8BYU=
```

---

**Good luck with your deployment! 🚀**
