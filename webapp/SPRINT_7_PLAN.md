# Sprint 7 Plan: Quality Assurance & Bug-Free Application

**Sprint Duration**: February 2-9, 2026 (7 days)
**Sprint Goal**: Achieve production-ready, bug-free application with zero critical issues
**Sprint Points**: 15 points
**Status**: 🔄 PLANNED

---

## Sprint Objective

**"Ship a bulletproof, bug-free RetireZest with < 500ms response times and 100% feature reliability"**

This sprint focuses exclusively on **quality assurance, performance optimization, and bug fixes** to ensure RetireZest is production-ready for our 67 active users and future growth.

---

## Sprint 7 Stories (15 Points)

### 🔴 P0 - Critical Performance Issues (6 points)

#### US-053: Optimize Dashboard Layout Query (3 points) 🆕
**Problem**: Dashboard layout queries User table on every page load, causing 1012ms latency
**Current State**:
- Query: `prisma.user.findUnique({ where: { id }, select: { email, emailVerified } })`
- Location: `app/(dashboard)/layout.tsx:24-27`
- Impact: Every dashboard page takes 4-6 seconds to load
- Root Cause: Network latency to Neon database + cold starts

**Solution**: Cache `emailVerified` status in JWT token
**Implementation**:
1. Add `emailVerified` field to TokenPayload interface (lib/auth.ts)
2. Update `createToken()` to include emailVerified
3. Update login route to fetch and include emailVerified
4. Remove database query from dashboard layout
5. Add token refresh logic when email verification status changes

**Acceptance Criteria**:
- [ ] Dashboard pages load in < 2 seconds
- [ ] No database query in layout component
- [ ] JWT token includes emailVerified field
- [ ] Verification banner still shows correctly
- [ ] Token refreshes after email verification

**Testing**:
- [ ] Test with unverified user
- [ ] Test email verification flow (token updates)
- [ ] Test dashboard page load times (< 2s)
- [ ] Verify no regression in verification banner

---

#### US-054: Optimize Login API Response Time (3 points) 🆕
**Problem**: Login API takes 6301ms to respond
**Current State**:
- Endpoint: `POST /api/auth/login`
- Log: `POST /api/auth/login 200 in 6301ms`
- Impact: Poor user experience, timeout risk

**Root Causes**:
1. bcrypt comparison is slow (intentional for security)
2. Multiple database queries during login
3. Potential N+1 queries or missing indexes

**Solution**: Optimize login flow
**Implementation**:
1. Profile the login route to identify bottlenecks
2. Consider caching user lookup results
3. Optimize bcrypt rounds (currently 10, consider reducing to 8 for dev)
4. Add database query logging to identify slow queries
5. Consider Redis caching for frequently accessed user data

**Acceptance Criteria**:
- [ ] Login response time < 2 seconds (target: 1 second)
- [ ] No timeout errors
- [ ] Security not compromised (bcrypt still used)
- [ ] Audit log still captures login events

**Testing**:
- [ ] Test login with correct credentials (< 2s)
- [ ] Test login with incorrect credentials
- [ ] Load test with 10 concurrent logins
- [ ] Verify audit logs still work

---

### 🟡 P1 - High Priority Quality Issues (5 points)

#### US-044: Improve Cash Flow Gap Messaging (2 points) [BACKLOG]
**Problem**: When users have cash flow gaps, messaging is unclear
**Current State**: Generic error or warning messages
**Goal**: Clear, actionable guidance on fixing cash flow issues

**Implementation**:
1. Detect specific gap types (income < expenses, asset depletion, etc.)
2. Show year-by-year breakdown of gaps
3. Provide specific recommendations:
   - "Increase retirement age to 67" (+$X/year impact)
   - "Reduce expenses by 10%" (+$Y/year impact)
   - "Defer CPP to age 70" (+$Z CPP benefit)
4. Add visualization showing gap years highlighted in red

**Acceptance Criteria**:
- [ ] Cash flow gaps show specific year ranges
- [ ] At least 3 actionable recommendations provided
- [ ] Recommendations show estimated financial impact
- [ ] Visualization highlights problem years

**Testing**:
- [ ] Test scenario with early gap (age 65-70)
- [ ] Test scenario with late gap (age 85+)
- [ ] Test scenario with multiple gaps
- [ ] Verify recommendations are accurate

---

#### US-048: Mobile Responsive Testing & Fixes (3 points) [BACKLOG]
**Problem**: Application not fully tested on mobile devices
**Current State**: Desktop-first design, unknown mobile UX

**Scope**:
1. Test all core user journeys on mobile (iPhone, Android)
2. Fix layout issues, button sizing, form inputs
3. Ensure charts render correctly on small screens
4. Test touch interactions (sliders, dropdowns, navigation)
5. Verify PDF generation works on mobile

**Pages to Test**:
- [ ] Homepage
- [ ] Login/Registration
- [ ] Onboarding wizard (all 11 steps)
- [ ] Dashboard
- [ ] Early Retirement calculator
- [ ] GIC Ladder Planner
- [ ] Simulation page
- [ ] Profile pages (assets, income, expenses, debts)
- [ ] Benefits calculators (CPP, OAS, GIS)

**Acceptance Criteria**:
- [ ] All pages render correctly on 375px width (iPhone SE)
- [ ] All interactive elements are touch-friendly (44px+ hit area)
- [ ] Forms are usable on mobile (no horizontal scroll)
- [ ] Charts scale down gracefully
- [ ] Navigation is mobile-optimized
- [ ] PDF generation works on mobile browsers

**Testing Devices**:
- iPhone 14 Pro (iOS 17)
- Samsung Galaxy S23 (Android 14)
- iPad Pro (tablet mode)

---

### 🟢 P2 - Medium Priority Features (4 points)

#### US-049: Subscription Status Ribbon (2 points) [BACKLOG]
**Goal**: Add persistent visual indicator of subscription tier
**Current State**: Users don't see their subscription status prominently

**Implementation**:
1. Add subscription ribbon to header/nav
2. Show "Free", "Premium", or "Enterprise" badge
3. For free users: Show remaining simulations (e.g., "3 of 10 today")
4. Click to upgrade (link to /subscribe)
5. Animated pulse for low simulation count (< 3 remaining)

**Design**:
- Free tier: Gray badge with simulation count
- Premium: Gold badge with "Premium" text
- Position: Top right corner near logout

**Acceptance Criteria**:
- [ ] Badge shows correct subscription tier
- [ ] Free users see simulation count
- [ ] Clicking badge navigates to /subscribe for free users
- [ ] Badge updates immediately after upgrade
- [ ] Responsive on mobile

---

#### US-050: Python API Monitoring & Health Checks (2 points) [BACKLOG]
**Goal**: Add health monitoring for Python simulation API
**Current State**: No monitoring, manual checks required

**Implementation**:
1. Add `/health` endpoint to Python API (FastAPI)
2. Add Next.js middleware to check Python API health
3. Show error banner if Python API is down
4. Add retry logic for simulation API calls
5. Log Python API errors to Sentry

**Health Check Endpoint** (`/health`):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected",
  "timestamp": "2026-02-01T21:30:00Z"
}
```

**Acceptance Criteria**:
- [ ] Python API has /health endpoint
- [ ] Next.js checks health every 5 minutes
- [ ] Error banner shown if API is down
- [ ] Simulation calls retry up to 3 times
- [ ] Errors logged to Sentry

---

## QA Testing Checklist

### ✅ Automated Tests

#### TypeScript Compilation
- [x] `npx tsc --noEmit` - ✅ PASSED (0 errors)

#### Production Build
- [x] `npm run build` - ✅ PASSED (no errors, 2m 15s)

#### Unit Tests
- [ ] Run all Jest tests
- [ ] Verify 100% pass rate for critical paths

#### E2E Tests
- [ ] Playwright tests for onboarding
- [ ] Playwright tests for simulation flow
- [ ] Playwright tests for dual limit system

---

### 🧪 Manual Testing

#### Core User Journeys (P0)
1. **Registration & Email Verification**
   - [ ] Register new user
   - [ ] Receive verification email
   - [ ] Click verification link
   - [ ] Email status updates in database
   - [ ] JWT token refreshes with emailVerified=true

2. **Dual Simulation Limit System** (US-052)
   - [ ] Unverified user: 3 lifetime simulations enforced
   - [ ] 403 Forbidden error shown after 3 simulations
   - [ ] Verify email unlocks 10/day limit
   - [ ] Daily counter resets at midnight
   - [ ] 429 Too Many Requests after 10 simulations/day
   - [ ] Premium bypass both limits

3. **Onboarding Wizard**
   - [ ] All 11 steps complete successfully
   - [ ] Data persists between steps
   - [ ] Can navigate back/forward
   - [ ] Baseline scenario created (US-042)
   - [ ] Redirects to early-retirement page

4. **Early Retirement Calculator** (US-040)
   - [ ] What-If sliders work (retirement age, CPP/OAS start)
   - [ ] 500ms debounce prevents excessive API calls
   - [ ] Auto-correction: CPP min age 60, OAS min age 65
   - [ ] Warning messages show for early retirement
   - [ ] Calculations update in real-time

5. **GIC Ladder Planner** (US-013)
   - [ ] Add rung with amount, term, rate
   - [ ] Edit existing rung
   - [ ] Remove rung
   - [ ] Statistics calculate correctly:
     - Weighted average rate
     - Average maturity
     - Total invested
     - Maturity values with compound interest

6. **LIRA Account Support** (US-041)
   - [ ] LIRA balance stored separately from RRSP
   - [ ] Combined with RRSP for projections
   - [ ] Converts to RRIF at age 71
   - [ ] Minimum withdrawals calculated correctly

7. **Subscription & Payments**
   - [ ] Stripe checkout session created
   - [ ] Successful payment updates subscription tier
   - [ ] Premium features unlock immediately
   - [ ] Billing portal accessible
   - [ ] Webhooks processed correctly

---

### 🚀 Performance Testing

#### Page Load Times (Target: < 3s on 4G)
- [ ] Homepage: _____ seconds
- [ ] Login: _____ seconds
- [ ] Dashboard: _____ seconds (target: < 2s after US-053)
- [ ] Simulation page: _____ seconds
- [ ] Early retirement: _____ seconds

#### API Response Times
- [ ] POST /api/auth/login: _____ ms (target: < 2000ms after US-054)
- [ ] POST /api/simulation/run: _____ ms (target: < 5000ms)
- [ ] POST /api/early-retirement/profile: _____ ms (target: < 3000ms)
- [ ] GET /api/scenarios: _____ ms (target: < 500ms)

#### Database Query Performance
- [ ] Dashboard layout User query: _____ ms (target: 0ms after caching in JWT)
- [ ] Simulation run with includes: _____ ms (target: < 200ms)

---

### 📱 Mobile Responsiveness (US-048)

#### Tested Devices
- [ ] iPhone 14 Pro (390×844)
- [ ] iPhone SE (375×667)
- [ ] Samsung Galaxy S23 (360×800)
- [ ] iPad Pro (1024×1366)

#### Pages Tested
- [ ] Homepage
- [ ] Login/Register
- [ ] Dashboard
- [ ] Onboarding wizard
- [ ] Early retirement calculator
- [ ] GIC Ladder Planner
- [ ] Simulation page
- [ ] Profile pages
- [ ] Benefits calculators

#### Interaction Tests
- [ ] Touch targets ≥ 44px
- [ ] Sliders work on touch
- [ ] Dropdowns accessible
- [ ] Forms don't require horizontal scroll
- [ ] Charts render correctly
- [ ] Navigation drawer works

---

### ♿ Accessibility Testing

#### WCAG 2.1 Level AA Compliance
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] All interactive elements keyboard-navigable
- [ ] Focus indicators visible
- [ ] Alt text for all images
- [ ] Form labels associated correctly
- [ ] Error messages announced to screen readers

#### Tools
- [ ] Lighthouse accessibility audit (score > 95)
- [ ] axe DevTools scan (0 violations)
- [ ] Screen reader test (VoiceOver/NVDA)

---

### 🔒 Security Testing

#### Authentication & Authorization
- [ ] JWT tokens expire after 7 days
- [ ] Logout clears tokens correctly
- [ ] Password reset flow secure
- [ ] Email verification prevents token reuse
- [ ] CSRF protection works for mutations

#### Rate Limiting
- [ ] Simulation limits enforced (3 free, 10/day)
- [ ] Early retirement limit enforced (3/day free)
- [ ] API rate limits prevent abuse (1000 req/hour)

#### Data Privacy
- [ ] Passwords hashed with bcrypt
- [ ] Sensitive data not logged
- [ ] Soft delete preserves data for 30 days
- [ ] GDPR-compliant data export

---

## Known Issues & Technical Debt

### 🔴 Critical Issues (Sprint 7)
| ID | Issue | Location | Status | Assignee |
|----|-------|----------|--------|----------|
| QA-001 | @next/swc version mismatch warning | package.json | ✅ RESOLVED (benign) | Claude |
| QA-002 | Slow User lookup query (1012ms) | layout.tsx:24 | 📋 US-053 | - |
| QA-003 | Slow login response (6301ms) | /api/auth/login | 📋 US-054 | - |

### 🟡 Medium Issues (Backlog)
| ID | Issue | Location | Status | Assignee |
|----|-------|----------|--------|----------|
| QA-004 | OpenTelemetry warnings (cosmetic) | Webpack | 📋 BACKLOG | - |
| QA-005 | Cash flow gap messaging unclear | Simulation page | 📋 US-044 | - |
| QA-006 | Mobile responsiveness untested | All pages | 📋 US-048 | - |

### 🟢 Low Priority (Future Sprints)
| ID | Issue | Location | Status | Assignee |
|----|-------|----------|--------|----------|
| QA-007 | No Python API health checks | Python backend | 📋 US-050 | - |
| QA-008 | No subscription status ribbon | Header | 📋 US-049 | - |

---

## Success Criteria

### ✅ Sprint 7 Complete When:
1. **Performance**
   - [ ] Dashboard loads in < 2 seconds
   - [ ] Login completes in < 2 seconds
   - [ ] All API endpoints < 500ms (95th percentile)

2. **Quality**
   - [ ] TypeScript compilation: 0 errors
   - [ ] Production build: SUCCESS
   - [ ] All P0 bugs fixed
   - [ ] All P1 bugs fixed or in backlog

3. **Testing**
   - [ ] Core user journeys tested manually (100%)
   - [ ] Mobile responsiveness verified (US-048)
   - [ ] Accessibility audit passed (score > 95)

4. **Documentation**
   - [ ] QA test results documented
   - [ ] Known issues registry updated
   - [ ] Sprint 7 retrospective completed

---

## Sprint Timeline

| Day | Date | Focus | Deliverables |
|-----|------|-------|--------------|
| Day 1 | Feb 2 | US-053 (JWT caching) | Optimized dashboard layout |
| Day 2 | Feb 3 | US-054 (Login optimization) | Fast login (< 2s) |
| Day 3 | Feb 4 | US-044 (Cash flow messaging) | Clear gap messages |
| Day 4 | Feb 5 | US-048 (Mobile testing) | Mobile-responsive app |
| Day 5 | Feb 6 | US-049 (Subscription ribbon) | Visual subscription status |
| Day 6 | Feb 7 | US-050 (Python monitoring) | API health checks |
| Day 7 | Feb 8 | QA testing & documentation | Sprint 7 complete report |

---

## Velocity & Capacity

### Historical Velocity
- **Sprint 4**: 8 points (1 day) = 8 pts/day
- **Sprint 5**: 13 points (3 days) = 4.3 pts/day
- **Sprint 6**: 16 points (1 day) = 16 pts/day
- **Average**: 9.4 pts/day

### Sprint 7 Capacity
- **Duration**: 7 days
- **Estimated Capacity**: 15 points (conservative)
- **Confidence**: HIGH (QA-focused, less unknowns than feature dev)

---

## Risk Assessment

### 🔴 High Risk
1. **Network latency to Neon database** - May be unavoidable without migration
   - Mitigation: Caching in JWT (US-053)
2. **bcrypt performance** - Slow by design for security
   - Mitigation: Profile and optimize other parts of login flow (US-054)

### 🟡 Medium Risk
1. **Mobile testing scope** - Many pages to test
   - Mitigation: Prioritize critical user journeys first
2. **Python API health checks** - Requires backend changes
   - Mitigation: Simple /health endpoint, minimal risk

### 🟢 Low Risk
1. **Subscription ribbon** - Pure frontend, no backend changes
2. **Cash flow messaging** - Localized change, well-understood problem

---

## Dependencies

### External Dependencies
- [ ] Neon database availability (US-053, US-054)
- [ ] Stripe API for subscription testing (US-049)
- [ ] Python API availability (US-050)

### Internal Dependencies
- [ ] JWT token payload changes require database migration (US-053)
- [ ] Mobile testing requires real devices (US-048)

---

## Retrospective (To be completed after Sprint 7)

### What Went Well
- TBD

### What Could Be Improved
- TBD

### Action Items
- TBD

---

**Sprint 7 Status**: 🔄 READY TO START
**Last Updated**: February 1, 2026
**Next Review**: February 9, 2026 (Sprint 7 completion)
