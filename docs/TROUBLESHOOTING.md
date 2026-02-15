# Troubleshooting Guide

Quick reference for diagnosing and fixing common issues in RetireZest.

## Table of Contents

1. [General Debugging](#general-debugging)
2. [Application Won't Start](#application-wont-start)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [Simulation Issues](#simulation-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)
8. [Monitoring and Logging](#monitoring-and-logging)

## General Debugging

### Check Health Status

```bash
# Check overall health
curl http://localhost:3000/api/health

# Check readiness
curl http://localhost:3000/api/health/ready

# Check liveness
curl http://localhost:3000/api/health/live
```

### Check Logs

```bash
# Development
npm run dev

# Docker
docker logs retirezest-webapp

# Kubernetes
kubectl logs deployment/retirezest-webapp -f
```

### Check Environment Variables

```bash
# Verify .env.local exists
ls -la .env.local

# Check specific variable (never log secrets!)
echo $DATABASE_URL | sed 's/:.*@/:****@/'
```

### Enable Debug Mode

```bash
# Set in .env.local
NODE_ENV=development
DEBUG=*
```

## Application Won't Start

### Error: "Cannot find module"

**Cause**: Missing dependencies

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 is already in use"

**Cause**: Another process is using port 3000

**Solution**:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Error: "Prisma Client not found"

**Cause**: Prisma client not generated

**Solution**:
```bash
# Generate Prisma client
npx prisma generate

# If database schema changed
npx prisma db push
```

### TypeScript Compilation Errors

**Cause**: Type errors in code

**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# For quick fixes, you can temporarily skip type checking
# (NOT recommended for production)
SKIP_TYPE_CHECK=true npm run build
```

## Database Issues

### Error: "Can't reach database server"

**Cause**: Database not running or wrong connection string

**Solution**:
```bash
# Check if PostgreSQL is running
# Docker
docker ps | grep postgres

# Kubernetes
kubectl get pods | grep postgres

# Local PostgreSQL
pg_isready

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
echo $DATABASE_URL
```

### Error: "Database does not exist"

**Cause**: Database hasn't been created

**Solution**:
```bash
# Create database
createdb retirement_app

# Or use Prisma
npx prisma db push
```

### Error: "Column does not exist"

**Cause**: Database schema out of sync with Prisma schema

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Or apply migrations
npx prisma migrate dev
```

### Error: "Connection pool timeout"

**Cause**: Too many database connections

**Solution**:
```typescript
// In lib/db.ts, adjust connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Increase connection limit
  pool: {
    max: 20,
    min: 5,
    idle: 10000,
  },
});
```

Or restart the application:
```bash
# Restart to clear connection pool
docker-compose restart webapp
```

### Slow Database Queries

**Diagnosis**:
```bash
# Check Sentry Performance tab for slow queries
# Or enable Prisma query logging

# In lib/db.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Solution**:
- Add database indexes (see Phase 5)
- Optimize queries (use `select` to reduce data)
- Add query caching

## Authentication Issues

### Error: "Authentication failed"

**Cause**: Invalid credentials or session expired

**Diagnosis**:
```bash
# Check if user exists in database
psql $DATABASE_URL -c "SELECT id, email FROM users WHERE email='user@example.com'"

# Check JWT_SECRET is set
echo $JWT_SECRET | wc -c  # Should be >32 characters
```

**Solution**:
- Verify email/password are correct
- Check JWT_SECRET is set in .env.local
- Clear browser cookies and try again

### Error: "Session expired"

**Cause**: JWT token expired or invalid

**Solution**:
```typescript
// Check token expiration in lib/auth.ts
// Default is 7 days, adjust if needed
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '7d',  // Adjust as needed
});
```

### Error: "CSRF token mismatch"

**Cause**: CSRF token missing or invalid

**Solution**:
```bash
# Get new CSRF token
curl http://localhost:3000/api/csrf

# Ensure csrfToken cookie is being sent with requests
# Check browser DevTools > Network > Cookies
```

### Password Hash Errors

**Cause**: bcrypt issues

**Solution**:
```bash
# Reinstall bcrypt
npm uninstall bcrypt bcryptjs
npm install bcrypt

# If still failing, use bcryptjs (pure JS)
npm install bcryptjs
```

## Simulation Issues

### Error: "Python API is not responding"

**Cause**: Python backend not running

**Diagnosis**:
```bash
# Check Python API health
curl http://localhost:8000/health

# Check if Python API is running
# Docker
docker ps | grep python-api

# Kubernetes
kubectl get pods | grep python-api
```

**Solution**:
```bash
# Start Python API (if using Docker)
cd ../python-api
docker-compose up -d

# Or start locally
cd ../python-api
python -m uvicorn main:app --reload --port 8000
```

### Error: "Simulation failed" with no details

**Cause**: Error in Python API not being caught

**Diagnosis**:
```bash
# Check Python API logs
docker logs retirezest-python-api

# Or check logs directly
cd ../python-api
tail -f logs/app.log
```

**Solution**:
- Fix error in Python API
- Ensure Python API returns proper error responses
- Check input data is valid

### Slow Simulations

**Cause**: Complex calculations or under-resourced Python API

**Diagnosis**:
```bash
# Check Python API response time
curl -w "@curl-format.txt" -o /dev/null -s \
  -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d @test-simulation.json

# Where curl-format.txt contains:
# time_total: %{time_total}\n
```

**Solution**:
- Optimize Python calculation code
- Scale up Python API resources
- Add caching for common calculations
- Reduce simulation complexity

## Performance Issues

### Slow Page Load

**Diagnosis**:
```bash
# Check Sentry Performance tab
# Look for slow API calls

# Use Chrome DevTools
# Performance tab > Record > Analyze
```

**Solution**:
- Add database indexes
- Optimize slow queries
- Enable Next.js caching
- Reduce bundle size
- Add CDN for static assets

### High Memory Usage

**Diagnosis**:
```bash
# Check memory usage
docker stats retirezest-webapp

# Or Kubernetes
kubectl top pods

# Or locally
node --inspect npm run dev
# Then open chrome://inspect
```

**Solution**:
```typescript
// Add memory limit in docker-compose.yml
services:
  webapp:
    mem_limit: 512m
    mem_reservation: 256m
```

Or investigate and fix memory leaks using heap profiler.

### High CPU Usage

**Diagnosis**:
```bash
# Check CPU usage
docker stats retirezest-webapp

# Or use profiler
node --prof npm run dev
```

**Solution**:
- Identify slow operations
- Add caching
- Optimize algorithms
- Scale horizontally (add more instances)

## Deployment Issues

### Docker Build Fails

**Cause**: Usually dependency or configuration issues

**Common Errors**:

**1. "npm install failed"**
```bash
# Clear Docker cache and rebuild
docker buildx prune -f
docker build --no-cache -t retirezest/webapp .
```

**2. "Prisma generate failed"**
```bash
# Ensure DATABASE_URL is set during build
docker build \
  --build-arg DATABASE_URL="postgresql://..." \
  -t retirezest/webapp .
```

**3. "Out of memory during build"**
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory > 4GB+
```

### Kubernetes Deployment Fails

**Diagnosis**:
```bash
# Check pod status
kubectl get pods

# Check pod logs
kubectl logs <pod-name>

# Describe pod for events
kubectl describe pod <pod-name>
```

**Common Issues**:

**1. ImagePullBackOff**
```bash
# Image doesn't exist or can't be pulled
# Verify image exists
docker images | grep retirezest

# Check image registry credentials
kubectl get secrets
```

**2. CrashLoopBackOff**
```bash
# Application keeps crashing
# Check logs for errors
kubectl logs <pod-name> --previous
```

**3. Pending**
```bash
# Not enough resources
kubectl describe pod <pod-name>
# Look for "Insufficient cpu" or "Insufficient memory"

# Scale down or add nodes
```

### Environment Variables Not Working

**Diagnosis**:
```bash
# Check if .env.local is loaded
# (Only works in development)

# For production, check deployment config
kubectl get deployment retirezest-webapp -o yaml | grep env -A 20
```

**Solution**:
```bash
# Development - ensure .env.local exists
cp .env.example .env.local

# Production - set in deployment config
# Kubernetes
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..."
```

## Monitoring and Logging

### Sentry Not Capturing Errors

**Diagnosis**:
```bash
# Check if Sentry DSN is set
echo $SENTRY_DSN | cut -d@ -f2  # Should show sentry.io URL

# Check Sentry initialization
# Look for "Sentry initialized" in logs
```

**Solution**:
```bash
# Set SENTRY_DSN in .env.local
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Restart application
```

**Test Sentry**:
```typescript
// In any API route, trigger a test error
throw new Error('Sentry test error');
```

### Missing Logs

**Cause**: Logs not appearing where expected

**Solution**:
```bash
# Development - check console

# Docker - check container logs
docker logs retirezest-webapp -f

# Kubernetes - check pod logs
kubectl logs deployment/retirezest-webapp -f

# For persistent logs, configure log aggregation
# (e.g., Elasticsearch, CloudWatch, Datadog)
```

### Health Checks Failing

**Diagnosis**:
```bash
# Test health endpoint manually
curl -v http://localhost:3000/api/health

# Check response
curl http://localhost:3000/api/health | jq
```

**Common Issues**:

**1. Database check failing**
```bash
# Verify database is accessible
psql $DATABASE_URL -c "SELECT 1"
```

**2. Python API check failing**
```bash
# Verify Python API is accessible
curl http://localhost:8000/health
```

**3. Timeout**
```bash
# Increase timeout in health check
# See app/api/health/route.ts
# Adjust timeout from 5000ms to higher value
```

## Quick Diagnosis Checklist

When something is wrong, check these in order:

1. ✅ Is the application running?
   ```bash
   curl http://localhost:3000/api/health/live
   ```

2. ✅ Is the database accessible?
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. ✅ Is the Python API accessible?
   ```bash
   curl http://localhost:8000/health
   ```

4. ✅ Are environment variables set?
   ```bash
   # Check .env.local exists
   ls -la .env.local
   ```

5. ✅ Are there recent errors in Sentry?
   - Check Sentry dashboard

6. ✅ Are there errors in logs?
   ```bash
   # Check last 50 lines of logs
   docker logs retirezest-webapp --tail 50
   ```

7. ✅ Was there a recent deployment?
   - Consider rollback if issues started after deployment

8. ✅ Are resources sufficient?
   ```bash
   # Check CPU and memory
   docker stats retirezest-webapp
   ```

## Getting Help

If you can't resolve the issue:

1. **Check documentation**
   - [Monitoring Guide](./MONITORING.md)
   - [Error Codes](./ERROR_CODES.md)
   - [Incident Response](./INCIDENT-RESPONSE.md)

2. **Gather information**
   - Error messages
   - Stack traces
   - Recent changes
   - Steps to reproduce

3. **Create issue**
   - Include all gathered information
   - Tag with appropriate severity
   - Assign to appropriate team member

4. **Escalate if needed**
   - Follow escalation path in Incident Response guide

---

*Last Updated*: 2025-12-05
*Updated By*: Claude Code
