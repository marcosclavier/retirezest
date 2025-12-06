# Production Readiness Checklist

**Quick reference for production deployment readiness**

## Phase 1: Security (CRITICAL - 3 Days)

### 1.1 JWT Secret Handling ⏱️ 2h
- [ ] Add validation in `lib/auth.ts` - fails if JWT_SECRET not set
- [ ] Add minimum length check (32+ chars)
- [ ] Test app fails without valid JWT_SECRET
- [ ] Generate production secret: `openssl rand -base64 32`

### 1.2 Rate Limiting ⏱️ 6h
- [ ] Install: `npm install express-rate-limit`
- [ ] Create `lib/rate-limit.ts`
- [ ] Apply to login (5 attempts / 15 min)
- [ ] Apply to register (3 attempts / 1 hour)
- [ ] Test rate limits work correctly

### 1.3 Error Logging ⏱️ 8h
- [ ] Create `lib/logger.ts` with safe production logging
- [ ] Update all 14 API routes to use logger
- [ ] Remove sensitive data from production logs
- [ ] Test dev mode shows full errors
- [ ] Test prod mode hides sensitive details

### 1.4 CSRF Protection ⏱️ 6h
- [ ] Install: `npm install csrf-csrf`
- [ ] Create `lib/csrf.ts`
- [ ] Create CSRF endpoint `/api/csrf/route.ts`
- [ ] Create/update `middleware.ts` for validation
- [ ] Update all forms to include CSRF token
- [ ] Test API calls fail without token

---

## Phase 2: Testing (CRITICAL - 4 Days)

### 2.1 Test Infrastructure ⏱️ 2h
- [ ] Install: `npm install --save-dev vitest @vitest/ui @testing-library/react`
- [ ] Create `vitest.config.ts`
- [ ] Create `lib/test-utils.ts`
- [ ] Add test scripts to `package.json`

### 2.2 CPP Calculator Tests ⏱️ 8h
- [ ] Create `lib/calculations/__tests__/cpp.test.ts`
- [ ] 15+ test cases covering all scenarios
- [ ] Validate against government calculator
- [ ] All tests passing

### 2.3 OAS Calculator Tests ⏱️ 6h
- [ ] Create `lib/calculations/__tests__/oas.test.ts`
- [ ] 12+ test cases including clawback
- [ ] Validate residency calculations
- [ ] All tests passing

### 2.4 GIS Calculator Tests ⏱️ 5h
- [ ] Create `lib/calculations/__tests__/gis.test.ts`
- [ ] 10+ test cases for single/married
- [ ] Validate income exemptions
- [ ] All tests passing

### 2.5 Tax Calculator Tests ⏱️ 8h
- [ ] Create `lib/calculations/__tests__/tax.test.ts`
- [ ] 15+ test cases for federal/provincial
- [ ] Validate 2025 tax brackets
- [ ] Test withholding and capital gains
- [ ] All tests passing

### 2.6 Projection Engine Tests ⏱️ 10h
- [ ] Create `lib/calculations/__tests__/projection.test.ts`
- [ ] 12+ test cases for full projections
- [ ] Test RRIF conversions
- [ ] Test asset depletion detection
- [ ] Validate withdrawal strategies
- [ ] All tests passing

### 2.7 Coverage Report ⏱️ 2h
- [ ] Run `npm run test:coverage`
- [ ] Achieve 90%+ coverage on calculations
- [ ] Document any gaps

---

## Phase 3: Error Handling (HIGH - 3 Days)

### 3.1 Error Infrastructure ⏱️ 3h
- [ ] Create `lib/errors.ts` with custom error classes
- [ ] Define AppError, ValidationError, AuthError, etc.
- [ ] Create handleApiError function

### 3.2 API Routes Update ⏱️ 10h
- [ ] Update `/api/auth/login/route.ts`
- [ ] Update `/api/auth/register/route.ts`
- [ ] Update `/api/auth/logout/route.ts`
- [ ] Update `/api/profile/route.ts`
- [ ] Update `/api/profile/income/route.ts`
- [ ] Update `/api/profile/assets/route.ts`
- [ ] Update `/api/profile/expenses/route.ts`
- [ ] Update `/api/profile/debts/route.ts`
- [ ] Update `/api/scenarios/route.ts`
- [ ] Update `/api/scenarios/[id]/route.ts`
- [ ] Update `/api/projections/route.ts`
- [ ] Update `/api/projections/[id]/route.ts`
- [ ] Update `/api/simulation/run/route.ts`
- [ ] Update `/api/simulation/analyze/route.ts`

### 3.3 Middleware Logging ⏱️ 2h
- [ ] Add request/response logging to `middleware.ts`
- [ ] Log request duration
- [ ] Test logging works

### 3.4 Error Boundary ⏱️ 2h
- [ ] Create `app/error.tsx` for client errors
- [ ] Test error boundary catches errors
- [ ] Show user-friendly error messages

### 3.5 Prisma Logging ⏱️ 1h
- [ ] Update `lib/prisma.ts` to only log errors in prod
- [ ] Test logging configuration

### 3.6 Documentation ⏱️ 2h
- [ ] Create `docs/ERROR_CODES.md`
- [ ] Document all error codes
- [ ] Add client-side handling examples

---

## Phase 4: Monitoring (HIGH - 2 Days)

### 4.1 Setup Sentry ⏱️ 1h
- [ ] Install: `npm install @sentry/nextjs`
- [ ] Run: `npx @sentry/wizard@latest -i nextjs`
- [ ] Get Sentry DSN from dashboard

### 4.2 Configure Sentry ⏱️ 3h
- [ ] Configure `sentry.server.config.ts`
- [ ] Configure `sentry.client.config.ts`
- [ ] Add environment variables to `.env`
- [ ] Test error reporting works

### 4.3 Integrate Logger ⏱️ 2h
- [ ] Update `lib/logger.ts` to send to Sentry
- [ ] Test errors appear in Sentry dashboard
- [ ] Verify sensitive data is scrubbed

### 4.4 Performance Monitoring ⏱️ 3h
- [ ] Add transaction tracking to projection endpoint
- [ ] Add transaction tracking to simulation endpoint
- [ ] Test performance data appears in Sentry

### 4.5 Health Check ⏱️ 1h
- [ ] Create `/api/health/route.ts`
- [ ] Test health check returns correct status
- [ ] Document health check endpoint

### 4.6 Alerts ⏱️ 2h
- [ ] Configure error rate alert (>10 errors / 5min)
- [ ] Configure new issue alert
- [ ] Configure performance alert (P95 > 2s)
- [ ] Test alerts by triggering conditions

### 4.7 User Feedback ⏱️ 2h
- [ ] Add Sentry feedback widget to `app/layout.tsx`
- [ ] Test feedback dialog appears on errors

### 4.8 Documentation ⏱️ 2h
- [ ] Create `MONITORING.md`
- [ ] Document alert procedures
- [ ] Document incident response

---

## Environment Setup

### Required Variables
```bash
# Create .env.example
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
NODE_ENV=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

- [ ] Create `.env.example` file
- [ ] Document all required variables
- [ ] Generate secure JWT_SECRET for production
- [ ] Set up Sentry project and get DSNs

---

## Pre-Deployment Verification

### Security ✅
- [ ] JWT_SECRET is secure (32+ chars)
- [ ] Rate limiting active on auth endpoints
- [ ] CSRF protection enabled
- [ ] Error logging sanitized
- [ ] No console.log in production
- [ ] Dependencies audited: `npm audit`
- [ ] No known vulnerabilities

### Testing ✅
- [ ] All calculation tests passing (90%+ coverage)
- [ ] API integration tests passing
- [ ] Manual QA completed
- [ ] Edge cases tested
- [ ] Performance tested

### Error Handling ✅
- [ ] All API routes use error handler
- [ ] Client error boundary works
- [ ] Errors logged correctly
- [ ] User-friendly error messages

### Monitoring ✅
- [ ] Sentry connected
- [ ] Errors appear in dashboard
- [ ] Performance tracking active
- [ ] Alerts configured
- [ ] Health check endpoint working

### Infrastructure ✅
- [ ] Docker build succeeds
- [ ] Database migrations applied
- [ ] Backups configured
- [ ] Rollback plan documented

---

## Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify all functionality works
- [ ] Check monitoring/alerts working
- [ ] Load test with realistic traffic
- [ ] Review error logs (should be clean)

---

## Production Deployment

### Pre-Deploy
- [ ] Staging tests all passed
- [ ] Team notified of deployment window
- [ ] Rollback plan reviewed
- [ ] Backup taken

### Deploy
- [ ] Deploy during low-traffic window
- [ ] Monitor logs in real-time
- [ ] Check health endpoint
- [ ] Verify key user flows work

### Post-Deploy (First 2 Hours)
- [ ] Monitor error rate (target: <0.1%)
- [ ] Check response times (P95 < 2s)
- [ ] Verify calculations working
- [ ] Test authentication flow
- [ ] Review Sentry dashboard

### Post-Deploy (First 24 Hours)
- [ ] Check error rate every 2 hours
- [ ] Monitor user feedback
- [ ] Review performance metrics
- [ ] Verify backups running

---

## Success Criteria ✅

Production is ready when:
- ✅ All security issues resolved
- ✅ Test coverage >80% on calculations
- ✅ All tests passing
- ✅ Error handling in all API routes
- ✅ Monitoring active and tested
- ✅ Staging tests passed
- ✅ Health check returns 200
- ✅ Zero critical errors in staging
- ✅ Response time P95 < 2s

---

## Time Estimates

| Phase | Days | Hours |
|-------|------|-------|
| Phase 1: Security | 3 | 22 |
| Phase 2: Testing | 4 | 41 |
| Phase 3: Error Handling | 3 | 20 |
| Phase 4: Monitoring | 2 | 16 |
| **Total** | **12** | **99** |

**With 1 developer @ 8 hours/day**: ~12 working days (~2.5 weeks)

---

## Quick Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test

# Type check
npm run build

# Security audit
npm audit

# Start dev server
npm run dev

# Deploy with Docker
docker-compose up -d --build
```

---

## Emergency Contacts

- [ ] Set up on-call schedule
- [ ] Document escalation path
- [ ] Set up emergency Slack channel
- [ ] Document rollback procedure

---

## Notes

- This checklist should be worked through sequentially
- Each phase builds on the previous
- Do not skip security or testing phases
- Document any deviations from the plan
- Update this checklist as you progress

---

**Last Updated**: December 5, 2025
**Next Review**: After Phase 1 completion
