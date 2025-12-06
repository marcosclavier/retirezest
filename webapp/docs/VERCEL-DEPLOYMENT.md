# Vercel Deployment Guide

## Prerequisites

- GitHub account connected to Vercel
- PostgreSQL database (Vercel Postgres or external provider)

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `marcosclavier/retirezest`
4. Select the `webapp` directory as the root directory
5. Framework Preset: Next.js (auto-detected)

### 2. Configure Environment Variables

In Vercel project settings, add these environment variables:

#### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
JWT_SECRET=<generate-a-secure-random-string-at-least-32-chars>
NEXTAUTH_SECRET=<generate-another-secure-random-string-32-chars>
NEXTAUTH_URL=https://your-app.vercel.app

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Environment Variables

```bash
# Sentry (Error Tracking) - Optional
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ORG=<your-sentry-org>
SENTRY_PROJECT=<your-sentry-project>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>

# Logging
LOG_LEVEL=info
```

### 3. Set Up PostgreSQL Database

#### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard, go to Storage tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name: `retirement-app-db`
5. Region: Select closest to your users
6. Vercel will automatically add `DATABASE_URL` to your environment variables

#### Option B: External PostgreSQL (Neon, Supabase, AWS RDS)

1. Create a PostgreSQL database on your preferred provider
2. Copy the connection string
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Ensure SSL mode is enabled: `?sslmode=require`

### 4. Generate Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32

# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32
```

### 5. Deploy

#### First Deployment

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Vercel will run:
   - `npm install`
   - `prisma generate`
   - `next build`

#### Run Database Migrations

After first deployment, run migrations:

```bash
# Using Vercel CLI (from local machine)
npx vercel env pull .env.production
DATABASE_URL="<your-production-db-url>" npx prisma migrate deploy

# Or use Vercel's terminal in project settings
```

### 6. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

### 7. Enable Automatic Deployments

✓ Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a PR

### 8. Post-Deployment Checklist

- [ ] Visit deployed URL and verify homepage loads
- [ ] Test user registration
- [ ] Test user login
- [ ] Verify database connection (create test data)
- [ ] Check API endpoints: `/api/health`, `/api/health/ready`
- [ ] Test a full retirement simulation
- [ ] Verify all environment variables are set
- [ ] Check Vercel logs for any errors

## Useful Vercel CLI Commands

```bash
# Login to Vercel
npx vercel login

# Link project to Vercel
npx vercel link

# Pull environment variables
npx vercel env pull .env.production

# Deploy to production
npx vercel --prod

# View deployment logs
npx vercel logs <deployment-url>
```

## Environment Variable Management

### Add Environment Variable
```bash
npx vercel env add <NAME>
```

### Remove Environment Variable
```bash
npx vercel env rm <NAME>
```

### List All Environment Variables
```bash
npx vercel env ls
```

## Troubleshooting

### Build Failures

**Error: Prisma Client not generated**
- Ensure `buildCommand` in `vercel.json` includes `prisma generate`

**Error: Database connection failed**
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Vercel's IP ranges
- Ensure `?sslmode=require` is in connection string

**Error: Module not found**
- Check all dependencies are in `package.json`, not just `devDependencies`
- Prisma should be in regular `dependencies`

### Runtime Errors

**JWT errors**
- Verify `JWT_SECRET` is set and at least 32 characters
- Verify `NEXTAUTH_SECRET` is set

**Database migration errors**
- Run `npx prisma migrate deploy` manually
- Check Vercel logs for specific error messages

**CORS errors**
- Verify `NEXT_PUBLIC_APP_URL` matches your deployment URL
- Check middleware.ts CORS configuration

## Monitoring

### Vercel Analytics
- Go to Analytics tab in Vercel Dashboard
- View real-time traffic, Web Vitals, and user metrics

### Vercel Logs
- Go to Deployments tab
- Click on a deployment
- View "Functions" tab for serverless function logs
- View "Build Logs" for build-time logs

### Sentry Integration (if configured)
- Errors automatically sent to Sentry
- View in Sentry dashboard
- Set up alerts for critical errors

## Rollback Procedure

If deployment has issues:

1. Go to Deployments tab in Vercel
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"

## Production Best Practices

1. **Use Preview Deployments**: Test changes in preview before merging to main
2. **Environment Parity**: Keep staging and production environments similar
3. **Database Backups**: Enable automatic backups on your PostgreSQL provider
4. **Monitor Logs**: Regularly check Vercel logs and Sentry for errors
5. **Security Headers**: Verified in middleware.ts and vercel.json
6. **SSL/HTTPS**: Automatic with Vercel, ensure all URLs use https://

## Cost Estimation

### Vercel Free Tier (Hobby)
- ✓ Unlimited deployments
- ✓ 100GB bandwidth/month
- ✓ Serverless function execution
- ✓ Automatic SSL
- ⚠ Not for commercial use

### Vercel Pro ($20/month)
- ✓ Commercial use allowed
- ✓ 1TB bandwidth/month
- ✓ Advanced analytics
- ✓ Team collaboration
- ✓ Custom domains

### Vercel Postgres
- Free tier: 256MB storage, 60 hours compute
- Paid: Starting at $24/month for production workloads

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: support@vercel.com
- Community: https://github.com/vercel/vercel/discussions
