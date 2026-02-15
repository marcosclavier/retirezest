# Deployment Guide

Complete guide for deploying RetireZest to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Rollback Procedure](#rollback-procedure)

## Prerequisites

### Required Tools
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- npm or yarn

### Required Accounts
- PostgreSQL database (Neon, Supabase, Railway, or self-hosted)
- Vercel account (recommended) or Docker host
- Sentry account (optional, for error tracking)
- GitHub account (for CI/CD)

## Environment Setup

### 1. Create Environment File

Create `.env.production` from the template:

```bash
cp .env.production.example .env.production
```

### 2. Configure Required Variables

Edit `.env.production` and set:

```bash
# Database - Use your production PostgreSQL URL
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# API URL - Your production domain
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 3. Configure Optional Variables

```bash
# Sentry Error Tracking (Recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Python API (if applicable)
PYTHON_API_URL=https://your-python-api.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

### 4. Validate Environment

```bash
# Ensure all required variables are set
npm run build
```

## Database Setup

### 1. Create Production Database

**Option A: Neon (Recommended)**
```bash
# Sign up at https://neon.tech
# Create new project
# Copy connection string to DATABASE_URL
```

**Option B: Supabase**
```bash
# Sign up at https://supabase.com
# Create new project
# Go to Settings > Database
# Copy connection string to DATABASE_URL
```

**Option C: Railway**
```bash
# Sign up at https://railway.app
# Create PostgreSQL database
# Copy connection string to DATABASE_URL
```

### 2. Run Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 3. Create Backup

```bash
# Create initial backup before going live
./scripts/backup.sh
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the best Next.js deployment experience with zero configuration.

#### Setup Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

4. **Configure Environment Variables**
   ```bash
   # Add environment variables via Vercel dashboard or CLI
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add NEXT_PUBLIC_API_URL production
   ```

5. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

#### GitHub Integration

1. **Connect Repository**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required variables from `.env.production.example`

4. **Enable Automatic Deployments**
   - Push to `main` branch triggers production deployment
   - Pull requests create preview deployments

### Option 2: Docker Deployment

Deploy using Docker containers to any platform (AWS, GCP, DigitalOcean, etc.)

#### Build Docker Image

```bash
# Build production image
docker build -t retirezest-web:latest .

# Test locally
docker run -p 3000:3000 --env-file .env.production retirezest-web:latest
```

#### Deploy with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

#### Deploy to Cloud Platforms

**AWS ECS/Fargate**
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag retirezest-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/retirezest:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/retirezest:latest

# Deploy to ECS (configure task definition and service)
```

**Google Cloud Run**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/retirezest

# Deploy to Cloud Run
gcloud run deploy retirezest \
  --image gcr.io/PROJECT-ID/retirezest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**DigitalOcean App Platform**
```bash
# Use DigitalOcean web interface
# 1. Create new app from Docker Hub or GitHub
# 2. Configure environment variables
# 3. Deploy
```

### Option 3: Railway

Simple deployment with PostgreSQL included.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

## Deployment Steps

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] Secrets securely stored
- [ ] Backup created
- [ ] Rollback plan documented

### Deployment Process

1. **Create Backup**
   ```bash
   ./scripts/backup.sh
   ```

2. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Deploy to Platform**
   ```bash
   # Vercel
   vercel --prod

   # Or Docker
   docker-compose -f docker-compose.prod.yml up -d

   # Or Railway
   railway up
   ```

5. **Verify Deployment**
   ```bash
   # Check health endpoint
   curl https://your-domain.com/api/health

   # Expected response:
   # {"status":"healthy","checks":{...}}
   ```

## Post-Deployment

### 1. Verify Application

```bash
# Health check
curl https://your-domain.com/api/health/live
# Expected: {"status":"alive",...}

curl https://your-domain.com/api/health/ready
# Expected: {"status":"ready"}

curl https://your-domain.com/api/health
# Expected: {"status":"healthy",...}
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] Profile creation
- [ ] Scenario creation
- [ ] Projection calculation

### 3. Monitor Metrics

**Check Vercel Dashboard:**
- Response times
- Error rates
- Function invocations

**Check Sentry Dashboard:**
- Error tracking
- Performance monitoring
- User sessions

### 4. Enable Monitoring

```bash
# Set up alerts for:
# - Error rate > 1%
# - Response time p95 > 500ms
# - Database connection failures
# - Health check failures
```

## Rollback Procedure

### Database Rollback

```bash
# Restore from backup
./scripts/restore.sh

# Select backup file when prompted
# Confirm restoration
```

### Application Rollback

**Vercel:**
```bash
# Via Dashboard: Deployments > Previous deployment > Promote to Production
# Or via CLI:
vercel rollback
```

**Docker:**
```bash
# Pull previous image
docker pull retirezest-web:previous-tag

# Restart with previous image
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

**Railway:**
```bash
# Via Dashboard: Deployments > Previous deployment > Redeploy
```

### Verify Rollback

```bash
# Check health
curl https://your-domain.com/api/health

# Test critical flows
# Monitor error rates
```

## Troubleshooting

### Deployment Fails

**Build Errors:**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check for missing dependencies
npm ci

# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

**Database Connection Errors:**
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db push --preview-feature

# Check database is accessible
psql $DATABASE_URL -c "SELECT 1"
```

### Application Not Responding

```bash
# Check health endpoint
curl https://your-domain.com/api/health/live

# Check logs
# Vercel: vercel logs
# Docker: docker-compose logs -f
# Railway: railway logs
```

### High Error Rates

```bash
# Check Sentry dashboard for errors
# Check database connection pool usage
# Check memory usage
# Review recent code changes
# Consider rollback
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Secrets not exposed in code
- [ ] Database uses SSL
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Dependencies scanned for vulnerabilities

## Performance Optimization

### Enable CDN

**Vercel:** Automatic

**Docker:** Configure CloudFlare or similar CDN

### Database Connection Pooling

Already configured in `lib/prisma.ts`. Adjust pool size if needed:

```bash
# In DATABASE_URL, add:
?connection_limit=10
```

### Monitor Performance

```bash
# Use Sentry Performance Monitoring
# Track:
# - API response times
# - Database query times
# - Page load times
```

## Next Steps

1. Set up staging environment
2. Configure automated backups
3. Set up monitoring alerts
4. Document incident response procedures
5. Plan regular security updates

## Related Documentation

- [Database Documentation](./DATABASE.md)
- [Migrations Guide](./MIGRATIONS.md)
- [Monitoring Guide](./MONITORING.md)
- [Incident Response](./INCIDENT-RESPONSE.md)
- [Runbook](./RUNBOOK.md)

---

*Last Updated*: 2025-12-06
*Updated By*: Claude Code
