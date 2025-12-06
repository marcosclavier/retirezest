# Incident Response Playbook

This document provides procedures for responding to production incidents in RetireZest.

## Table of Contents

1. [Overview](#overview)
2. [Incident Severity Levels](#incident-severity-levels)
3. [Response Procedures](#response-procedures)
4. [Common Incidents](#common-incidents)
5. [Rollback Procedures](#rollback-procedures)
6. [Communication](#communication)
7. [Post-Incident Review](#post-incident-review)

## Overview

An incident is any event that degrades or disrupts service to users. This playbook provides step-by-step procedures for identifying, responding to, and resolving incidents.

### Incident Lifecycle

1. **Detection** - Incident is detected (alerts, monitoring, user reports)
2. **Assessment** - Severity is determined
3. **Response** - Incident response team is mobilized
4. **Resolution** - Issue is fixed or mitigated
5. **Recovery** - Service is restored
6. **Review** - Post-incident review is conducted

## Incident Severity Levels

### SEV-1: Critical

**Impact**: Complete service outage or data loss

**Examples**:
- Application is completely down
- Database is inaccessible
- Data breach or security incident
- Critical data loss or corruption

**Response Time**: Immediate (within 15 minutes)

**Actions**:
- Page on-call engineer immediately
- Notify all stakeholders
- Begin incident response immediately
- Post status updates every 30 minutes

### SEV-2: Major

**Impact**: Significant feature degradation affecting many users

**Examples**:
- Simulation engine not working
- Login failures for some users
- Major performance degradation (>5s response times)
- Python API completely down

**Response Time**: Within 1 hour

**Actions**:
- Notify on-call engineer
- Begin troubleshooting
- Post status updates every hour
- Consider rollback if recent deployment

### SEV-3: Minor

**Impact**: Partial feature degradation affecting few users

**Examples**:
- Slow response times (2-5s)
- Non-critical feature not working
- Intermittent errors (<5% error rate)

**Response Time**: Within 4 hours

**Actions**:
- Create ticket for investigation
- Monitor for escalation
- Fix in next deployment

### SEV-4: Low

**Impact**: Cosmetic issues or minor bugs

**Examples**:
- UI rendering issues
- Typos or copy errors
- Non-critical logging errors

**Response Time**: Next business day

**Actions**:
- Create ticket for backlog
- Schedule fix in upcoming sprint

## Response Procedures

### Step 1: Detect and Assess

1. **Identify the incident**
   - Alert triggered in Sentry
   - Health check failure
   - User report
   - Monitoring dashboard anomaly

2. **Gather initial information**
   - What is broken?
   - When did it start?
   - How many users are affected?
   - Is data at risk?

3. **Determine severity level**
   - Use severity definitions above
   - When in doubt, err on the side of higher severity

4. **Check health endpoints**
   ```bash
   curl https://app.retirezest.com/api/health
   ```

5. **Check Sentry dashboard**
   - Recent errors
   - Error rate trends
   - Performance metrics

### Step 2: Respond

1. **Assemble response team**
   - SEV-1/2: Page on-call engineer
   - SEV-3/4: Assign to engineer

2. **Create incident channel**
   - Slack: #incident-YYYY-MM-DD
   - Document all actions

3. **Begin investigation**
   - Check recent deployments
   - Review error logs
   - Check dependency health
   - Examine metrics

### Step 3: Mitigate

**Quick Mitigation Options**:

1. **Rollback deployment**
   ```bash
   # See Rollback Procedures section
   ```

2. **Restart services**
   ```bash
   # Kubernetes
   kubectl rollout restart deployment/retirezest-webapp

   # Docker
   docker-compose restart webapp
   ```

3. **Scale up resources**
   ```bash
   # Kubernetes
   kubectl scale deployment/retirezest-webapp --replicas=5
   ```

4. **Disable failing feature**
   - Use feature flags if available
   - Deploy hotfix to disable feature

### Step 4: Resolve

1. **Identify root cause**
   - Use Sentry stack traces
   - Review logs
   - Reproduce issue locally

2. **Develop fix**
   - Test fix locally
   - Get code review (if time permits)
   - Deploy to staging first (SEV-3/4)

3. **Deploy fix**
   ```bash
   # Follow normal deployment process
   # Or use emergency deployment for SEV-1
   ```

4. **Verify resolution**
   - Check health endpoints
   - Monitor error rates
   - Test affected functionality
   - Confirm with users if possible

### Step 5: Recover

1. **Monitor stability**
   - Watch for 30-60 minutes
   - Check for new errors
   - Monitor performance metrics

2. **Restore normal operations**
   - Scale down temporary resources
   - Re-enable disabled features

3. **Update status page**
   - Mark incident as resolved
   - Post resolution summary

### Step 6: Document

1. **Close incident**
   - Update incident ticket
   - Archive incident channel

2. **Schedule post-incident review**
   - Within 48 hours for SEV-1/2
   - Within 1 week for SEV-3

## Common Incidents

### Database Connection Failure

**Symptoms**:
- 503 errors from API endpoints
- Health check showing database down
- "Database connection pool exhausted" errors

**Investigation**:
```bash
# Check database status
kubectl get pods -l app=postgres

# Check connection pool
# Look for "connection pool" errors in logs
kubectl logs deployment/retirezest-webapp | grep "connection"

# Test database directly
psql $DATABASE_URL -c "SELECT 1"
```

**Resolution**:
1. Check database is running
2. Verify connection string is correct
3. Check connection pool settings
4. Restart application if needed
5. Scale database if under heavy load

### Python API Unavailable

**Symptoms**:
- Simulation endpoints returning 503
- Health check showing Python API down
- "Python API is not responding" errors

**Investigation**:
```bash
# Check Python API health
curl http://python-api:8000/health

# Check Python API logs
kubectl logs deployment/retirezest-python-api

# Check Python API pods
kubectl get pods -l app=python-api
```

**Resolution**:
1. Restart Python API
2. Check for errors in Python logs
3. Verify resource limits (CPU/memory)
4. Scale up Python API if needed

### High Error Rate

**Symptoms**:
- Sentry alert: Error rate > 5%
- Multiple different errors
- Performance degradation

**Investigation**:
1. Check Sentry for error patterns
2. Identify common error types
3. Check recent deployments
4. Review dependency health

**Resolution**:
1. If recent deployment: Consider rollback
2. If specific endpoint: Disable endpoint
3. If dependency issue: Fix dependency
4. If resource issue: Scale up

### Slow Performance

**Symptoms**:
- Slow response times (>2s)
- Timeout errors
- User complaints

**Investigation**:
```bash
# Check Sentry Performance tab
# Look for slow transactions

# Check database slow queries
# Review logs for slow query warnings

# Check resource usage
kubectl top pods

# Check Python API latency
curl -w "@curl-format.txt" -o /dev/null -s http://python-api:8000/api/run-simulation
```

**Resolution**:
1. Identify slow operations
2. Add database indexes if needed
3. Optimize slow queries
4. Scale up resources
5. Add caching

### Memory Leak

**Symptoms**:
- Gradually increasing memory usage
- Application crashes
- "Out of memory" errors

**Investigation**:
```bash
# Check memory usage over time
kubectl top pods --containers

# Enable heap profiling
NODE_OPTIONS=--max-old-space-size=4096 npm run dev
```

**Resolution**:
1. Restart affected pods (immediate)
2. Investigate with heap profiler
3. Identify and fix leak
4. Deploy fix

## Rollback Procedures

### Quick Rollback (Kubernetes)

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/retirezest-webapp

# Rollback to specific revision
kubectl rollout history deployment/retirezest-webapp
kubectl rollout undo deployment/retirezest-webapp --to-revision=3
```

### Quick Rollback (Docker)

```bash
# Pull previous image
docker pull retirezest/webapp:previous-tag

# Update docker-compose.yml with previous tag
# Restart services
docker-compose up -d
```

### Quick Rollback (Vercel/Cloud Platform)

```bash
# Use platform UI to rollback to previous deployment
# Or use CLI
vercel rollback
```

## Communication

### Internal Communication

**Incident Channel (Slack: #incident-YYYY-MM-DD)**:
- Post all investigation findings
- Document all actions taken
- Share current status
- Coordinate response efforts

**Status Updates**:
- SEV-1: Every 30 minutes
- SEV-2: Every hour
- SEV-3: Every 4 hours

**Template**:
```
[STATUS UPDATE - HH:MM]
Current Status: [Investigating/Mitigating/Resolving]
Impact: [Brief description]
Actions Taken: [List of actions]
Next Steps: [What we're doing next]
ETA: [Estimated resolution time]
```

### External Communication

**Status Page** (if available):
- Update status immediately
- Post updates on progress
- Announce resolution

**User Notifications** (for SEV-1/2):
- Email notification if outage >30 minutes
- In-app banner when service restored

**Template**:
```
Subject: Service Disruption - [Feature/Service Name]

We are currently experiencing issues with [feature/service].

Impact: [Brief description of user impact]
Status: We are actively working on a resolution
ETA: [If known, or "We will provide updates every hour"]

We apologize for the inconvenience and will update you shortly.

- The RetireZest Team
```

## Post-Incident Review

### Timeline

- SEV-1/2: Within 48 hours
- SEV-3: Within 1 week

### Attendees

- Incident responders
- Engineering team
- Product manager (for user-facing incidents)

### Agenda

1. **Timeline of Events**
   - What happened and when?
   - Detection time
   - Response time
   - Resolution time
   - Total impact duration

2. **Root Cause Analysis**
   - What was the underlying cause?
   - Why didn't we catch it earlier?
   - What was the trigger?

3. **What Went Well**
   - Quick detection
   - Effective communication
   - Rapid response

4. **What Went Wrong**
   - Delayed detection
   - Communication gaps
   - Process issues

5. **Action Items**
   - Prevent recurrence
   - Improve detection
   - Improve response
   - Documentation updates

### Post-Incident Report Template

```markdown
# Incident Report: [Brief Description]

**Date**: YYYY-MM-DD
**Severity**: SEV-X
**Duration**: X hours Y minutes
**Affected Users**: [Number or percentage]

## Summary
[One paragraph summary of the incident]

## Timeline
- HH:MM - Incident began
- HH:MM - First alert
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Detailed explanation of the root cause]

## Resolution
[How the incident was resolved]

## Impact
- Users affected: [Number]
- Services impacted: [List]
- Data loss: [None/Description]

## Action Items
1. [ ] [Action item with owner and due date]
2. [ ] [Action item with owner and due date]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
```

## Escalation

### When to Escalate

- Unable to identify root cause within 30 minutes (SEV-1)
- Unable to resolve within 2 hours (SEV-1)
- Incident severity is increasing
- Additional expertise needed

### Escalation Path

1. On-call engineer
2. Engineering lead
3. CTO
4. CEO (for data breaches or major outages)

### Contact Information

Maintain on-call rotation in PagerDuty or similar service.

## Prevention

### Proactive Measures

1. **Monitoring**
   - Set up comprehensive alerts
   - Monitor health checks
   - Track error rates

2. **Testing**
   - Load testing before major releases
   - Chaos engineering (failure injection)
   - Regular disaster recovery drills

3. **Deployment**
   - Gradual rollouts
   - Feature flags
   - Automated rollback on errors

4. **Documentation**
   - Keep runbooks updated
   - Document common issues
   - Maintain architecture diagrams

## Related Documentation

- [Monitoring Guide](./MONITORING.md)
- [Error Codes](./ERROR_CODES.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

*Last Updated*: 2025-12-05
*Updated By*: Claude Code
