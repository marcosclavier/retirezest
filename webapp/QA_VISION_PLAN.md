# QA Vision & Bug-Free Application Plan

**Date**: February 1, 2026
**Goal**: Achieve production-ready, bug-free application state
**Sprint**: Post-Sprint 6 Quality Assurance Phase

---

## Vision Statement

RetireZest will be a **zero-critical-bug, production-ready application** with:
- **100% type safety** (TypeScript strict mode)
- **Zero console errors** in production
- **< 500ms API response time** (95th percentile)
- **100% feature test coverage** for core user journeys
- **AAA accessibility rating** (WCAG 2.1)
- **Mobile responsiveness** across all devices

---

## Current State Assessment (February 1, 2026)

### Server Status
✅ **Running**: http://localhost:3001
✅ **Database**: Connected (PostgreSQL via Neon)
✅ **Python API**: http://localhost:8000 (assumed running)

### Issues Detected

#### 1. **@next/swc Version Mismatch** 🔴 P1
**Severity**: Medium
**Impact**: Build inconsistency, potential runtime issues
**Location**: package.json dependencies
**Error**:
```
⚠ Mismatching @next/swc version, detected: 15.5.7 while Next.js is on 15.5.11
```
**Fix**: Update @next/swc to 15.5.11

---

#### 2. **Slow Database Query (1012ms)** 🔴 P0
**Severity**: Critical
**Impact**: User experience, dashboard load time > 4 seconds
**Location**: User lookup query
**Query**:
```sql
SELECT "public"."User"."id", "public"."User"."email", "public"."User"."emailVerified"
FROM "public"."User"
WHERE ("public"."User"."id" = $1 AND 1=1)
LIMIT $2 OFFSET $3
```
**Root Cause**: Missing index on User.id or database connection latency
**Fix**: Add index, optimize query, or implement caching

---

#### 3. **OpenTelemetry Warnings** 🟡 P3
**Severity**: Low (cosmetic)
**Impact**: Noisy logs, no functional impact
**Location**: Prisma instrumentation + Sentry integration
**Error**: "Critical dependency: the request of a dependency is an expression"
**Fix**: Suppress warnings via webpack configuration

---

### Features to Test

#### Core User Journeys
1. **Registration & Email Verification**
   - [ ] New user registration
   - [ ] Email verification flow
   - [ ] Simulation limit enforcement (3 free before verification)

2. **Onboarding Wizard**
   - [ ] All 11 steps complete successfully
   - [ ] Data persists to database
   - [ ] Baseline scenario creation (US-042)

3. **Dual Simulation Limit System** (US-052)
   - [ ] Unverified users: 3 lifetime simulations
   - [ ] Verified free tier: 10 simulations/day
   - [ ] Premium: Unlimited
   - [ ] Error messaging (403 Forbidden, 429 Too Many Requests)
   - [ ] Counter UI displays correct remaining count

4. **Early Retirement Calculator**
   - [ ] What-If Sliders (US-040)
   - [ ] CPP/OAS start age adjustments
   - [ ] Real-time calculation updates (500ms debounce)
   - [ ] Warning messages for early retirement

5. **GIC Ladder Planner** (US-013)
   - [ ] Add/edit/remove rungs
   - [ ] Calculate weighted average rate
   - [ ] Calculate maturity values
   - [ ] Display statistics

6. **LIRA Account Support** (US-041)
   - [ ] LIRA balance stored separately
   - [ ] Combined with RRSP for projections
   - [ ] RRIF conversion at age 71

7. **Subscription & Payments**
   - [ ] Stripe checkout session creation
   - [ ] Subscription status updates
   - [ ] Premium feature unlock
   - [ ] Webhook handling

---

## Quality Gates

### 1. Type Safety ✅
**Status**: Unknown
**Command**: `npx tsc --noEmit`
**Target**: 0 errors

### 2. Build Success ✅
**Status**: Unknown
**Command**: `npm run build`
**Target**: No errors, < 2 minute build time

### 3. API Response Time ⏱️
**Status**: **FAILING** (1012ms query detected)
**Target**: < 100ms for simple queries, < 500ms for complex
**Current**: 1012ms for User lookup, 6301ms for login

### 4. Zero Console Errors ❌
**Status**: Unknown (need browser inspection)
**Target**: 0 errors in production mode

### 5. Lighthouse Score 🏆
**Status**: Unknown
**Target**:
  - Performance: > 90
  - Accessibility: > 95
  - Best Practices: > 95
  - SEO: > 90

---

## Test Plan

### Phase 1: Fix Critical Bugs (P0/P1)
1. ✅ Document current state (this file)
2. ⏳ Fix @next/swc version mismatch
3. ⏳ Optimize slow database query
4. ⏳ Run TypeScript compilation check
5. ⏳ Verify production build

### Phase 2: Functional Testing (P1/P2)
6. ⏳ Test dual simulation limit system (US-052)
7. ⏳ Test early retirement calculator (US-040)
8. ⏳ Test GIC ladder planner (US-013)
9. ⏳ Test LIRA account support (US-041)
10. ⏳ Test baseline scenario creation (US-042)

### Phase 3: Performance & UX (P2/P3)
11. ⏳ Lighthouse audit
12. ⏳ Mobile responsiveness check
13. ⏳ Accessibility audit
14. ⏳ Cross-browser testing (Chrome, Firefox, Safari)

### Phase 4: Documentation & Sign-off (P3)
15. ⏳ Update test documentation
16. ⏳ Create QA sign-off report
17. ⏳ Mark application as production-ready

---

## Known Issues Registry

| ID | Severity | Status | Issue | Location | Assigned |
|----|----------|--------|-------|----------|----------|
| QA-001 | P1 | 🔴 Open | @next/swc version mismatch | package.json | - |
| QA-002 | P0 | 🔴 Open | Slow User lookup query (1012ms) | Database | - |
| QA-003 | P3 | 🟡 Open | OpenTelemetry warnings | Webpack config | - |
| QA-004 | P1 | ⏳ Unknown | Login response time (6301ms) | /api/auth/login | - |
| QA-005 | P2 | ⏳ Unknown | Dashboard load time (4610ms) | /dashboard | - |

---

## Success Criteria

### Critical (Must Fix Before Production)
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed or documented with workarounds
- [ ] TypeScript compilation: 0 errors
- [ ] Production build: Success
- [ ] API response time: < 500ms (95th percentile)
- [ ] Zero critical console errors

### Important (Fix in Sprint 7)
- [ ] All P2 bugs triaged
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Mobile responsiveness verified
- [ ] Core user journeys tested

### Nice to Have (Backlog)
- [ ] P3 bugs documented
- [ ] Comprehensive E2E test suite
- [ ] Performance monitoring dashboard
- [ ] Automated regression testing

---

## Timeline

**Phase 1 (Bug Fixes)**: Today (Feb 1, 2026) - 2-4 hours
**Phase 2 (Functional Testing)**: Feb 2, 2026 - 1 day
**Phase 3 (Performance & UX)**: Feb 3, 2026 - 1 day
**Phase 4 (Documentation)**: Feb 4, 2026 - 2 hours

**Total Estimated Time**: 2-3 days

---

## Test Execution Log

### February 1, 2026 - 21:12 UTC
- ✅ Dev server started (port 3001)
- ✅ Initial assessment completed
- 🔴 Detected: @next/swc version mismatch
- 🔴 Detected: Slow query (1012ms)
- 🟡 Detected: OpenTelemetry warnings (benign)

---

## References

- **Sprint 6 Completion**: DUAL_LIMIT_SYSTEM_COMPLETE.md
- **Database Docs**: docs/DATABASE.md
- **API Docs**: docs/API_REFERENCE.md
- **Premium Features**: docs/PREMIUM_FEATURES_IMPLEMENTATION.md
- **Backlog**: AGILE_BACKLOG.md

---

**Status**: ⏳ IN PROGRESS
**Next Action**: Fix @next/swc version mismatch (QA-001)
**Updated**: February 1, 2026
