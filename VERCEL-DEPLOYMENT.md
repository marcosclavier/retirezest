# Vercel Deployment Guide

Complete guide to deploying the Canadian Retirement Planning App to Vercel with Postgres.

## Prerequisites

- GitHub account with repository: `marcosclavier/retirezest`
- Vercel account (sign up at https://vercel.com)

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `marcosclavier/retirezest`
4. **IMPORTANT**: Configure build settings:
   - **Root Directory**: `webapp`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 2. Add Vercel Postgres Database

**Before deploying**, set up the database:

1. In your Vercel project dashboard, click **"Storage"** tab
2. Click **"Create Database"** or **"Connect Store"**
3. Select **"Postgres"**
4. Configure:
   - **Database Name**: `retirezest-db` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., `US East`, `US West`, `EU`)
5. Click **"Create"**

Vercel will automatically add these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` ← **This is what you need for DATABASE_URL**
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. Configure Environment Variables

Go to your project **Settings** → **Environment Variables** and verify/add:

#### Required Variables:

**DATABASE_URL** (automatically set by Vercel Postgres)
```
Use the value from: POSTGRES_PRISMA_URL
```

**JWT_SECRET** (you must add this manually)
```bash
# Generate a secure secret:
openssl rand -hex 32
# Example output: a3f9d8e2b1c4f5a6e8d9c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6e7d8f9a0b1c2d3
```
Add this as: `JWT_SECRET=your-generated-secret-here`

**NEXT_PUBLIC_APP_URL** (set to your Vercel URL)
```
https://your-app-name.vercel.app
```
You'll get this URL after first deployment, then update this variable.

#### Optional Variables (defaults will work):

```
NODE_ENV=production
```

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Generate Prisma Client
   - Build Next.js app
   - Deploy to production

### 5. Run Database Migrations

**After first deployment**, you need to initialize the database:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run migrations
cd webapp
npx prisma migrate deploy
```

#### Option B: From Local Machine

1. Copy the `POSTGRES_PRISMA_URL` value from Vercel environment variables
2. Run locally:
```bash
cd webapp
DATABASE_URL="your-postgres-url-here" npx prisma migrate deploy
```

#### Option C: Using Vercel Project Settings

1. Go to your Vercel project
2. Click **Settings** → **Functions**
3. Add a custom build command (one-time):
```bash
cd webapp && npx prisma migrate deploy && npm run build
```

### 6. Verify Deployment

1. Visit your deployed app: `https://your-app.vercel.app`
2. Test user registration
3. Test login
4. Create a retirement scenario
5. Generate a projection

### 7. Update Production URL

After deployment, update the environment variable:
1. Go to **Settings** → **Environment Variables**
2. Edit `NEXT_PUBLIC_APP_URL`
3. Set to your actual Vercel URL: `https://your-app-name.vercel.app`
4. Redeploy for changes to take effect

## Troubleshooting

### Build Fails

**Error: "Prisma schema not found"**
- Ensure Root Directory is set to `webapp`

**Error: "Cannot find module '@prisma/client'"**
- Vercel should auto-generate Prisma client
- Check that `postinstall` script exists in package.json:
```json
"postinstall": "prisma generate"
```

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify `DATABASE_URL` is set to `POSTGRES_PRISMA_URL` value
- Check database region matches your deployment region

**Error: "Relation does not exist"**
- Migrations haven't been run
- Follow "Step 5: Run Database Migrations"

### Runtime Errors

**Error: "JWT_SECRET not set"**
- Add JWT_SECRET environment variable
- Redeploy

**Error: "NEXT_PUBLIC_APP_URL not set"**
- Add or update NEXT_PUBLIC_APP_URL
- Redeploy

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

### Monitoring

- **Analytics**: Vercel provides built-in analytics
- **Logs**: View in **Deployments** → **Functions** → **Logs**
- **Database**: Monitor in **Storage** tab

### Database Backups

Vercel Postgres automatic backups:
- **Free tier**: Limited backups
- **Pro tier**: Daily automated backups
- **Enterprise**: Custom backup schedules

## Environment Variable Reference

| Variable | Required | Source | Example |
|----------|----------|--------|---------|
| `DATABASE_URL` | Yes | Vercel Postgres (POSTGRES_PRISMA_URL) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Yes | Manual (generate with openssl) | `a3f9d8e2b1c4f5a6...` |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL | `https://app.vercel.app` |
| `NODE_ENV` | No | Auto-set | `production` |

## Useful Commands

```bash
# View logs
vercel logs

# List deployments
vercel ls

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# Redeploy latest commit
vercel --prod

# Access Prisma Studio with production database
DATABASE_URL="your-postgres-url" npx prisma studio
```

## Cost Considerations

### Vercel Free Tier Limits:
- 100 GB bandwidth/month
- Unlimited deployments
- 100 GB-hours serverless function execution
- 1 member

### Postgres Costs:
- **Hobby**: Free tier available (limited resources)
- **Pro**: Starts at $20/month (more storage, compute)

For a retirement planning app with moderate usage, the free tier should be sufficient for initial launch and testing.

## Next Steps After Deployment

1. Test all features thoroughly
2. Monitor error logs and fix any issues
3. Set up custom domain (optional)
4. Configure monitoring/analytics
5. Plan for scaling (upgrade database if needed)

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Prisma Docs: https://www.prisma.io/docs

---

**Deployment Status**: Ready for Production ✅
