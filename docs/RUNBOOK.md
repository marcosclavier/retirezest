# Operations Runbook

Quick reference guide for common operational tasks and incident response.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Common Tasks](#common-tasks)
3. [Incident Response](#incident-response)
4. [Database Operations](#database-operations)
5. [Deployment Operations](#deployment-operations)
6. [Monitoring and Alerts](#monitoring-and-alerts)

## Daily Operations

### Morning Checklist

```bash
# 1. Check application health
curl https://your-domain.com/api/health
# Expected: {"status":"healthy"}

# 2. Check error rates in Sentry
# Go to: https://sentry.io/organizations/your-org/issues/
# Look for: New errors, increased error rates

# 3. Check performance metrics
# Vercel Dashboard > Analytics
# Look for: Slow functions, high error rates

# 4. Review overnight backup
ls -lh backups/ | tail -1
# Verify: Recent backup exists and has reasonable size
```

### Weekly Checklist

- [ ] Review and address Sentry errors
- [ ] Check database size and growth
- [ ] Review slow query logs
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration
- [ ] Review security advisories

### Monthly Checklist

- [ ] Security audit (`npm audit`)
- [ ] Review and optimize database indexes
- [ ] Review and archive old data
- [ ] Update documentation
- [ ] Test disaster recovery procedures
- [ ] Review and update runbook

## Common Tasks

### Restart Application

**Vercel:**
```bash
# Redeploy current version
vercel --prod
```

**Docker:**
```bash
docker-compose -f docker-compose.prod.yml restart web
```

**Railway:**
```bash
railway restart
```

### Clear Cache

**Next.js Build Cache:**
```bash
rm -rf .next
npm run build
```

**Vercel Cache:**
```bash
vercel --force
```

### Update Environment Variables

**Vercel:**
```bash
# Via CLI
vercel env add VARIABLE_NAME production

# Or via Dashboard
# Settings > Environment Variables > Add
```

**Docker:**
```bash
# Edit .env.production
vim .env.production

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### View Logs

**Vercel:**
```bash
# Real-time logs
vercel logs --follow

# Last 100 lines
vercel logs -n 100
```

**Docker:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
```

**Railway:**
```bash
railway logs
```

### Scale Application

**Vercel:** Automatic scaling

**Docker:**
```bash
# Scale web service to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale web=3
```

## Incident Response

### High Error Rate

**1. Identify Issue**
```bash
# Check Sentry for error patterns
# Open: https://sentry.io/organizations/your-org/issues/

# Check health endpoint
curl https://your-domain.com/api/health
```

**2. Check Database**
```bash
# Test database connection
npx prisma db push --preview-feature

# Check connection pool
# Look for: "Error: Can't reach database server"
```

**3. Check Recent Deployments**
```bash
# Vercel: Check deployment history
vercel ls

# Look for: Recent deployments that might have introduced issues
```

**4. Rollback if Needed**
```bash
# See DEPLOYMENT.md > Rollback Procedure
```

### Application Not Responding

**1. Check Health**
```bash
# Liveness probe (basic health)
curl https://your-domain.com/api/health/live

# Readiness probe (database connection)
curl https://your-domain.com/api/health/ready

# Full health check
curl https://your-domain.com/api/health
```

**2. Check Logs**
```bash
# Recent errors
vercel logs -n 50

# Filter for errors
vercel logs | grep "ERROR"
```

**3. Restart if Needed**
```bash
# See "Restart Application" above
```

### Database Issues

**Connection Errors:**
```bash
# 1. Verify DATABASE_URL
echo $DATABASE_URL

# 2. Test connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Check connection pool
# In Sentry, look for "connection pool exhausted" errors

# 4. Increase pool size if needed
# Add to DATABASE_URL: ?connection_limit=20
```

**Slow Queries:**
```bash
# 1. Check slow query logs (development mode)
# Queries > 1000ms are logged

# 2. Review database indexes
# See DATABASE.md > Indexes

# 3. Analyze query patterns
# Use Prisma Studio or direct SQL
```

**Migration Failures:**
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Review migration files
ls -la prisma/migrations/

# 3. Manually fix if needed
# See MIGRATIONS.md > Troubleshooting

# 4. Restore from backup if critical
./scripts/restore.sh
```

### High Response Times

**1. Identify Slow Endpoints**
```bash
# Check Sentry Performance
# Go to: Performance > Transactions
# Sort by: p95 duration
```

**2. Check Database Performance**
```bash
# Look for N+1 queries
# Look for missing indexes
# Look for slow queries in logs
```

**3. Optimize Queries**
```bash
# Add indexes (see DATABASE.md)
# Use select/include wisely
# Implement caching
```

## Database Operations

### Create Backup

```bash
# Manual backup
./scripts/backup.sh

# Verify backup created
ls -lh backups/ | tail -1
```

### Restore from Backup

```bash
# Interactive restore
./scripts/restore.sh

# Follow prompts to select backup file
```

### Run Migrations

```bash
# Deploy pending migrations
npx prisma migrate deploy

# Check status
npx prisma migrate status
```

### Database Maintenance

```bash
# Connect to database
psql $DATABASE_URL

# Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

# Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Vacuum and analyze
VACUUM ANALYZE;
```

## Deployment Operations

### Deploy New Version

```bash
# 1. Run tests locally
npm test
npx tsc --noEmit

# 2. Create backup
./scripts/backup.sh

# 3. Deploy
vercel --prod

# 4. Verify deployment
curl https://your-domain.com/api/health

# 5. Monitor errors
# Watch Sentry for 15 minutes
```

### Rollback Deployment

```bash
# Vercel: Via dashboard or CLI
vercel rollback

# Docker: Use previous image
docker-compose -f docker-compose.prod.yml down
# Edit docker-compose.prod.yml to use previous image tag
docker-compose -f docker-compose.prod.yml up -d

# Verify rollback
curl https://your-domain.com/api/health
```

### Update Dependencies

```bash
# 1. Check for updates
npm outdated

# 2. Update dependencies
npm update

# 3. Test locally
npm test
npm run build

# 4. Deploy to staging first
vercel --env staging

# 5. Test on staging
# Run smoke tests

# 6. Deploy to production
vercel --prod
```

## Monitoring and Alerts

### Check Application Metrics

**Vercel Dashboard:**
- Response times
- Error rates
- Function invocations
- Bandwidth usage

**Sentry Dashboard:**
- Error rate
- Performance metrics
- User sessions
- Release health

### Set Up Alerts

**Sentry Alerts:**
1. Go to Alerts > Create Alert Rule
2. Configure:
   - Error rate > 1% for 5 minutes
   - Response time p95 > 1000ms for 5 minutes
   - New release has >10 errors in first 10 minutes

**Vercel Alerts:**
1. Go to Settings > Notifications
2. Configure:
   - Deployment failures
   - Domain configuration issues

### Monitor Database

```bash
# Check connection pool usage
# Look in logs for "connection pool exhausted"

# Check query performance
# Review Prisma slow query logs

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

## Emergency Contacts

### On-Call Rotation

- Primary: [Name, Contact]
- Secondary: [Name, Contact]
- Escalation: [Name, Contact]

### Service Providers

- **Hosting**: Vercel Support - support@vercel.com
- **Database**: Neon Support - support@neon.tech
- **Monitoring**: Sentry Support - support@sentry.io

### Escalation Procedure

1. **Severity 1** (Critical - App Down):
   - Notify: Primary on-call immediately
   - Response time: 15 minutes
   - Resolution target: 1 hour

2. **Severity 2** (High - Degraded Performance):
   - Notify: Primary on-call within 30 minutes
   - Response time: 1 hour
   - Resolution target: 4 hours

3. **Severity 3** (Medium - Minor Issues):
   - Notify: Via Slack/Email
   - Response time: Next business day
   - Resolution target: 1 week

## Quick Reference

### Health Check URLs

```bash
# Liveness (is app running?)
GET /api/health/live

# Readiness (can handle traffic?)
GET /api/health/ready

# Full health (all systems)
GET /api/health
```

### Common Error Codes

- `400` - Bad Request (client error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (CSRF or permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (database down)

### Environment Variables

```bash
# Required
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_API_URL

# Optional
SENTRY_DSN
PYTHON_API_URL
RATE_LIMIT_MAX
```

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Incident Response](./INCIDENT-RESPONSE.md)
- [Database Documentation](./DATABASE.md)
- [Monitoring Guide](./MONITORING.md)

---

*Last Updated*: 2025-12-06
*Updated By*: Claude Code
