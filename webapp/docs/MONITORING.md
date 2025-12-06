# Monitoring and Observability Guide

This document describes the monitoring, error tracking, and observability setup for RetireZest.

## Table of Contents

1. [Overview](#overview)
2. [Sentry Integration](#sentry-integration)
3. [Health Checks](#health-checks)
4. [Performance Monitoring](#performance-monitoring)
5. [Logging](#logging)
6. [Metrics and KPIs](#metrics-and-kpis)
7. [Alerts and Notifications](#alerts-and-notifications)
8. [Troubleshooting](#troubleshooting)

## Overview

RetireZest uses a comprehensive monitoring stack to ensure production reliability:

- **Error Tracking**: Sentry for capturing and analyzing errors
- **Performance Monitoring**: Sentry Performance for tracking slow operations
- **Health Checks**: Kubernetes-ready health endpoints
- **Structured Logging**: Production-safe logging with context
- **Metrics**: Custom business and technical metrics

## Sentry Integration

### Setup

1. **Create Sentry Project**
   - Sign up at [sentry.io](https://sentry.io)
   - Create a new Next.js project
   - Note your DSN (Data Source Name)

2. **Environment Variables**

Add to `.env.local` (development) and production environment:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# For source map uploads (production only)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

3. **Verify Installation**

Sentry is automatically initialized through:
- `sentry.client.config.ts` - Browser errors
- `sentry.server.config.ts` - Server-side errors
- `sentry.edge.config.ts` - Edge runtime errors

### Error Tracking

All errors are automatically captured and sent to Sentry:

```typescript
import { logger } from '@/lib/logger';

try {
  // Your code
} catch (error) {
  // Automatically sent to Sentry in production
  logger.error('Operation failed', error, {
    endpoint: '/api/endpoint',
    userId: session.userId
  });
}
```

### User Context

Set user context for better error tracking:

```typescript
import { logger } from '@/lib/logger';

logger.setUser({
  id: user.id,
  email: user.email
});
```

### Breadcrumbs

Add breadcrumbs to track user actions leading to errors:

```typescript
logger.addBreadcrumb('User started simulation', 'user.action', 'info');
```

### Performance Tracking

Track performance of critical operations:

```typescript
import { trackApiPerformance, trackDatabaseQuery, trackExternalApi } from '@/lib/monitoring';

// Track API endpoint
const result = await trackApiPerformance('/api/simulation/run', 'POST', async () => {
  return await runSimulation(data);
});

// Track database query
const users = await trackDatabaseQuery('findMany users', async () => {
  return await prisma.user.findMany();
});

// Track external API call
const pythonResult = await trackExternalApi('Python API', '/api/run-simulation', async () => {
  return await fetch(`${PYTHON_API_URL}/api/run-simulation`);
});
```

## Health Checks

### Endpoints

RetireZest provides three health check endpoints:

#### 1. `/api/health` - Overall Health Status

Returns detailed health information including all dependencies.

**Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "pythonApi": {
      "status": "up",
      "responseTime": 120
    }
  }
}
```

**Response (Degraded)**:
```json
{
  "status": "degraded",
  "timestamp": "2025-12-05T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "pythonApi": {
      "status": "down",
      "responseTime": 5000,
      "error": "Connection failed"
    }
  }
}
```

**Status Codes**:
- `200` - Healthy or degraded
- `503` - Unhealthy (database down)

#### 2. `/api/health/ready` - Readiness Probe

Used by Kubernetes to determine if the app can accept traffic.

**Response**:
```json
{
  "status": "ready"
}
```

**Status Codes**:
- `200` - Ready to accept traffic
- `503` - Not ready (dependencies unavailable)

#### 3. `/api/health/live` - Liveness Probe

Used by Kubernetes to determine if the app should be restarted.

**Response**:
```json
{
  "status": "alive",
  "uptime": 3600,
  "timestamp": "2025-12-05T10:30:00Z"
}
```

**Status Codes**:
- `200` - Always (unless app is completely broken)

### Kubernetes Configuration

Example Kubernetes deployment with health checks:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: retirezest-webapp
spec:
  template:
    spec:
      containers:
      - name: webapp
        image: retirezest/webapp:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

## Performance Monitoring

### Automatic Performance Tracking

Performance is automatically tracked for:
- API endpoint response times
- Database query duration
- External API calls (Python backend)

### Performance Budgets

Set performance expectations:

```typescript
import { checkPerformanceBudget } from '@/lib/monitoring';

// Expect operation to complete within 2 seconds
await checkPerformanceBudget('heavy-calculation', 2000, async () => {
  return await performHeavyCalculation();
});
```

Exceeded budgets are logged as warnings and sent to Sentry.

### Slow Operation Thresholds

- **API Requests**: > 2 seconds
- **Database Queries**: > 1 second
- **External API Calls**: > 5 seconds

### Memory Tracking

Track memory usage:

```typescript
import { trackMemoryUsage } from '@/lib/monitoring';

const memoryStats = trackMemoryUsage();
// { heapUsed: 150, heapTotal: 200, external: 10, rss: 250 } (MB)
```

Warnings triggered if heap usage > 500MB.

## Logging

### Log Levels

- **debug**: Development only, detailed debugging info
- **info**: General informational messages
- **warn**: Warning messages for degraded conditions
- **error**: Error messages (automatically sent to Sentry)

### Structured Logging

All logs use structured JSON format:

```typescript
logger.info('User action', {
  action: 'create_simulation',
  userId: user.id,
  timestamp: Date.now()
});
```

Output:
```
[2025-12-05T10:30:00Z] [INFO] User action | {"action":"create_simulation","userId":"123","timestamp":1733399400000}
```

### Request Logging

Automatic request/response logging in middleware:

```typescript
logger.logRequest('POST', '/api/simulation/run', request.ip);
logger.logResponse('POST', '/api/simulation/run', 200, 1250);
```

### Production Safety

In production:
- Sensitive data is automatically filtered
- Stack traces are sent to Sentry, not console
- Personal information is redacted
- Authentication tokens are removed

## Metrics and KPIs

### Custom Metrics

Record custom business metrics:

```typescript
import { recordMetric } from '@/lib/monitoring';

recordMetric('simulation.created', 1);
recordMetric('user.registration', 1);
recordMetric('api.calls', 1, 'count');
```

### Key Performance Indicators

Track these KPIs in Sentry:

**Technical KPIs**:
- Error rate (errors per request)
- API response time (p50, p95, p99)
- Database query time
- External API latency
- Memory usage
- Request throughput

**Business KPIs**:
- User registrations
- Simulations created
- Active users
- Feature usage

### Request Tracking

Track request counts per endpoint:

```typescript
import { trackRequestCount, getRequestCounts } from '@/lib/monitoring';

trackRequestCount('/api/simulation/run');

// Get all counts
const counts = getRequestCounts();
// { '/api/simulation/run': 1250, '/api/auth/login': 500 }
```

## Alerts and Notifications

### Sentry Alerts

Configure alerts in Sentry dashboard:

1. **Error Rate Alert**
   - Trigger: Error rate > 5% over 5 minutes
   - Action: Email + Slack notification
   - Priority: High

2. **Performance Alert**
   - Trigger: p95 response time > 2 seconds
   - Action: Email notification
   - Priority: Medium

3. **New Error Alert**
   - Trigger: First occurrence of new error
   - Action: Slack notification
   - Priority: High

4. **Memory Alert**
   - Trigger: High memory usage metric
   - Action: Email notification
   - Priority: Medium

### Notification Channels

Configure in Sentry:
- Email notifications
- Slack integration
- PagerDuty (for critical alerts)

## Troubleshooting

### Common Issues

#### 1. Sentry Not Capturing Errors

**Problem**: Errors not appearing in Sentry

**Solutions**:
- Verify `SENTRY_DSN` is set correctly
- Check Sentry is initialized (look for "Sentry initialized" in logs)
- Ensure error occurs in production mode
- Check Sentry project settings

#### 2. High Error Rate

**Problem**: Sudden increase in errors

**Steps**:
1. Check Sentry dashboard for error patterns
2. Look at error messages and stack traces
3. Check if errors are from specific endpoint
4. Review recent deployments
5. Check dependency health (database, Python API)

#### 3. Slow Performance

**Problem**: API endpoints are slow

**Steps**:
1. Check Sentry Performance tab for slow transactions
2. Look for slow database queries in logs
3. Check Python API health and response times
4. Review memory usage
5. Check for N+1 query problems

#### 4. Health Check Failures

**Problem**: `/api/health` returns unhealthy

**Steps**:
1. Check which dependency is failing
2. Test database connection manually
3. Test Python API connectivity
4. Review logs for connection errors
5. Verify environment variables

### Debug Mode

Enable Sentry debug mode in development:

```bash
# Already configured in sentry configs
NODE_ENV=development
```

This will log Sentry operations to console.

### Viewing Logs

**Development**:
```bash
npm run dev
# Logs appear in console
```

**Production (Docker)**:
```bash
docker logs retirezest-webapp
```

**Production (Kubernetes)**:
```bash
kubectl logs deployment/retirezest-webapp
```

## Best Practices

1. **Always add context to errors**
   ```typescript
   logger.error('Failed to create user', error, {
     endpoint: '/api/auth/register',
     email: user.email // Will be filtered if sensitive
   });
   ```

2. **Use performance tracking for critical paths**
   ```typescript
   await trackApiPerformance('/api/simulation/run', 'POST', async () => {
     // Critical operation
   });
   ```

3. **Set user context early**
   ```typescript
   // After authentication
   logger.setUser({ id: session.userId, email: session.email });
   ```

4. **Add breadcrumbs for complex flows**
   ```typescript
   logger.addBreadcrumb('Started checkout process', 'user.action');
   logger.addBreadcrumb('Payment validated', 'payment');
   logger.addBreadcrumb('Order created', 'order');
   ```

5. **Monitor health checks**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Alert on health check failures
   - Monitor health check response times

6. **Review Sentry regularly**
   - Check for new error types weekly
   - Review performance regressions
   - Triage and assign errors to team members

## Next Steps

After Phase 4 (Monitoring):
- **Phase 5**: Database optimization and indexing
- **Phase 6**: Production deployment and scaling

## Related Documentation

- [Error Codes Guide](./ERROR_CODES.md)
- [Incident Response Playbook](./INCIDENT-RESPONSE.md)
- [Phase 4 Progress Tracker](./PHASE4-PROGRESS.md)

---

*Last Updated*: 2025-12-05
*Updated By*: Claude Code
