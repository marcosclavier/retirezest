# Sprint Board - RetireZest Sprint 3

**Sprint**: Sprint 3
**Duration**: January 30 - February 12, 2026 (2 weeks)
**Sprint Goal**: Improve onboarding UX and validate simulation accuracy while establishing reliable sprint processes
**Team Capacity**: 22 story points (core: 11 pts, stretch: 11 pts)

---

## 🎯 Sprint Progress

**Committed**: 22 story points (11 core + 11 stretch)
**Completed**: 0 story points (0%)
**In Progress**: 0 story points (0%)
**To Do**: 22 story points (100%)

**Current Day**: Day 0 (Jan 29, 2026 - Sprint Planning Complete)

---

## 📊 Kanban Board

### 📋 To Do (22 pts)

#### 🎯 Core Stories (11 pts)

#### US-009: Onboarding - Skip Real Estate Step [3 pts] 🟢 P2
**Owner**: Development Team
**Priority**: Medium (P2)
**Epic**: Epic 4: UX Improvements

As a user, I want to skip the real estate step in onboarding so that I can complete my profile quickly if I don't own real estate.

**User Impact**: 12 users currently stuck at Step 6 (86% onboarding complete)

**Acceptance Criteria**:
- [ ] "Skip for now" button added to Step 6 (Real Estate)
- [ ] Clicking "Skip" advances to Step 7 without saving real estate data
- [ ] User can return to Step 6 later to add real estate
- [ ] Profile completion shows 100% even if real estate skipped
- [ ] Help text explains "You can add real estate later in Settings"
- [ ] Mobile-responsive button design
- [ ] No console errors when skipping
- [ ] Analytics event tracked ("onboarding_real_estate_skipped")

**Technical Approach**:
- Modify `app/(onboarding)/wizard/page.tsx` to add skip button
- Update step validation logic to allow empty real estate data
- Add conditional rendering for skip button (only Step 6)
- Ensure profile completion calculation handles skipped steps

**Files to Modify**:
- `app/(onboarding)/wizard/page.tsx` (main wizard component)
- `components/wizard/RealEstateForm.tsx` (add skip button)
- `lib/wizard-utils.ts` (update completion calculation)

**Git History Check**:
```bash
git log --oneline --grep="US-009|skip.*real estate"
# Result: No existing implementation found
```

**Tasks**:
- [ ] Add "Skip for now" button to RealEstateForm component
- [ ] Update wizard navigation to handle skip action
- [ ] Update profile completion calculation
- [ ] Add help text for skip functionality
- [ ] Test skip button on mobile devices
- [ ] Add analytics event tracking
- [ ] Manual testing with 3 test users
- [ ] Update user-facing documentation (if needed)

**Estimated Effort**: 3 hours
**Status**: 📋 To Do

---

#### US-013: RRIF Strategy Validation [8 pts] 🟡 P1
**Owner**: Development Team
**Priority**: High (P1)
**Epic**: Epic 5: Simulation Accuracy

As a retirement planner, I want to verify that RRIF withdrawal strategies comply with CRA regulations so that users receive accurate tax planning advice.

**User Impact**: Affects all users with RRIFs (estimated 60% of user base)

**Acceptance Criteria**:
- [ ] RRIF minimum withdrawal percentages match CRA 2026 schedule
- [ ] RRIF maximum withdrawal limits validated (if applicable)
- [ ] Early RRIF withdrawal strategy (age <71) tested and validated
- [ ] Standard RRIF withdrawal strategy (age ≥71) tested and validated
- [ ] RRIF strategy interacts correctly with GIS optimization
- [ ] Edge cases tested (age 71 transition, spousal RRIFs)
- [ ] Validation report documents findings vs CRA rules
- [ ] Automated test suite for RRIF calculations
- [ ] Python backend RRIF logic verified
- [ ] Frontend RRIF display validated

**Technical Approach**:
1. Review CRA RRIF withdrawal schedule (2026)
2. Audit Python backend RRIF calculation logic
3. Create test cases for each age bracket (55-95)
4. Validate against CRA minimum withdrawal table
5. Test interaction with withdrawal strategies
6. Document any discrepancies vs CRA rules

**Files to Review/Modify**:
- `juan-retirement-app/modules/rrif_calculations.py` (Python backend)
- `juan-retirement-app/modules/withdrawal_strategies.py` (strategy logic)
- `webapp/components/simulation/RRIFInsightsCard.tsx` (frontend display)
- `RRIF_STRATEGY_VALIDATION_REPORT.md` (existing analysis, needs completion)

**Reference Documents**:
- CRA RRIF Minimum Withdrawal Schedule: https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/registered-plans-directorate-newsletters/registered-plans-directorate-newsletter-no-95-1-rrif-minimum-amount.html
- RRIF_STRATEGY_VALIDATION_REPORT.md (existing analysis)

**Git History Check**:
```bash
git log --oneline --grep="US-013|RRIF.*validation"
# Result: RRIF_STRATEGY_VALIDATION_REPORT.md exists (analysis only, not completion)
```

**Tasks**:
- [ ] Download/verify CRA RRIF minimum withdrawal schedule (2026)
- [ ] Audit Python RRIF calculation logic against CRA rules
- [ ] Create test cases for ages 55, 60, 65, 71, 75, 80, 85, 90, 95
- [ ] Test "Early RRIF" strategy (age <71)
- [ ] Test standard RRIF strategy (age ≥71)
- [ ] Test RRIF + GIS optimization interaction
- [ ] Test edge cases (age 71 transition, spousal RRIF)
- [ ] Write automated test suite (Python pytest)
- [ ] Document findings in completion report
- [ ] Fix any discrepancies found

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do

---

#### 🎁 Stretch Goals (11 pts)

#### US-003: Database Migration - Pension Indexing (Backend) [8 pts] 🟡 P1
**Owner**: Development Team
**Priority**: High (P1)
**Epic**: Epic 1: User Retention & Engagement

As a user with a pension, I want my pension income to be indexed for inflation so that my retirement projections are realistic.

**Context**: Frontend implemented in commit 997c924, but backend persistence not complete.

**Acceptance Criteria**:
- [ ] Prisma schema updated with `inflationIndexed` field (Boolean)
- [ ] Database migration created and tested
- [ ] Migration deployed to development environment
- [ ] Migration deployed to production (Neon database)
- [ ] Backend API persists `inflationIndexed` value
- [ ] Backend simulation uses `inflationIndexed` in calculations
- [ ] Frontend checkbox value saved and loaded correctly
- [ ] Existing pensions default to `inflationIndexed: true` (CPP, OAS, QPP)
- [ ] Private pensions default to `inflationIndexed: false`
- [ ] No data loss during migration
- [ ] Rollback procedure documented

**Technical Approach**:
1. Update Prisma schema (`schema.prisma`)
2. Create migration with `npx prisma migrate dev`
3. Test migration locally
4. Update API routes to handle `inflationIndexed` field
5. Update backend simulation to apply inflation conditionally
6. Deploy migration to production with backup
7. Verify frontend/backend integration

**Files to Modify**:
- `webapp/prisma/schema.prisma` (add `inflationIndexed` field to IncomeSource)
- `webapp/app/api/simulation/route.ts` (persist inflationIndexed)
- `juan-retirement-app/modules/income_sources.py` (use inflationIndexed in calcs)
- `webapp/app/api/income-sources/route.ts` (CRUD operations)

**Git History Check**:
```bash
git log --oneline --grep="US-003|pension.*indexing|inflationIndexed"
# Result: 997c924 feat: Add pension indexing checkbox (frontend only)
```

**Migration Plan**:
```prisma
// schema.prisma
model IncomeSource {
  id               String   @id @default(cuid())
  userId           String
  type             String   // "pension", "cpp", "oas", "rrif", etc.
  amount           Float
  startAge         Int
  endAge           Int?
  inflationIndexed Boolean  @default(false) // NEW FIELD
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Data Migration Strategy**:
```sql
-- Set default values based on income type
UPDATE IncomeSource SET inflationIndexed = true WHERE type IN ('cpp', 'oas', 'qpp', 'gis');
UPDATE IncomeSource SET inflationIndexed = false WHERE type IN ('pension', 'other');
```

**Tasks**:
- [ ] Update Prisma schema with `inflationIndexed` field
- [ ] Create migration (`npx prisma migrate dev --name add_pension_indexing`)
- [ ] Test migration locally with test data
- [ ] Update API routes to persist `inflationIndexed`
- [ ] Update Python backend to use `inflationIndexed` in calculations
- [ ] Create database backup before production migration
- [ ] Deploy migration to production (`npx prisma db push`)
- [ ] Verify production data integrity
- [ ] Test frontend integration (save/load/simulate)
- [ ] Document rollback procedure

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do (Stretch Goal)

---

#### AI-2.7: E2E Test for Withdrawal Strategy Selector [3 pts] 🟡 P1
**Owner**: Development Team
**Priority**: High (P1)
**Epic**: Epic 6: Testing & Quality

As a developer, I want automated E2E tests for the withdrawal strategy selector so that we prevent regressions like US-029 (default strategy bug).

**Context**: US-029 revealed that default withdrawal strategy was wrong. This test prevents future regressions.

**Acceptance Criteria**:
- [ ] E2E test verifies default strategy is "minimize-income" (Income Minimization)
- [ ] E2E test verifies strategy selector is visible and prominent
- [ ] E2E test verifies all 4 strategies are selectable
- [ ] E2E test verifies strategy selection persists after navigation
- [ ] E2E test verifies selected strategy is used in simulation
- [ ] E2E test runs in CI/CD pipeline (if configured)
- [ ] Test uses Playwright (existing E2E framework)
- [ ] Test documented in E2E test suite README
- [ ] Test passes 100% (no flakiness)

**Technical Approach**:
1. Create new Playwright test file
2. Test default strategy on new user flow
3. Test strategy selection and persistence
4. Test strategy impact on simulation results
5. Add to CI/CD pipeline (if configured)

**Files to Create/Modify**:
- `webapp/tests/e2e/withdrawal-strategy.spec.ts` (new E2E test)
- `webapp/tests/e2e/README.md` (document new test)
- `.github/workflows/e2e-tests.yml` (add to CI/CD, if exists)

**Git History Check**:
```bash
git log --oneline --grep="AI-2.7|E2E.*withdrawal"
# Result: No existing E2E test for withdrawal strategy
```

**Test Scenarios**:
```typescript
// withdrawal-strategy.spec.ts
test('Default withdrawal strategy is minimize-income', async ({ page }) => {
  // Navigate to simulation page
  // Verify default strategy is "minimize-income"
  // Verify strategy selector is visible
});

test('User can select different withdrawal strategies', async ({ page }) => {
  // Select each of 4 strategies
  // Verify selection is applied
  // Run simulation
  // Verify strategy used in results
});

test('Selected strategy persists after navigation', async ({ page }) => {
  // Select strategy
  // Navigate away
  // Navigate back
  // Verify strategy selection persisted
});
```

**Tasks**:
- [ ] Create `withdrawal-strategy.spec.ts` E2E test file
- [ ] Write test: Default strategy is minimize-income
- [ ] Write test: Strategy selector is visible and prominent
- [ ] Write test: All 4 strategies are selectable
- [ ] Write test: Strategy selection persists after navigation
- [ ] Write test: Selected strategy used in simulation results
- [ ] Run tests locally (100% pass rate)
- [ ] Add to CI/CD pipeline (if configured)
- [ ] Document in E2E README

**Estimated Effort**: 3 hours
**Status**: 📋 To Do (Stretch Goal)

---

### 🔄 In Progress (0 pts)

**No stories in progress** (Sprint hasn't started yet)

---

### ✅ Done (0 pts)

**No stories completed yet**

---

## 📈 Burndown Chart (Text Version)

```
Story Points Remaining

22 |■ ← Start (Core: 11 pts + Stretch: 11 pts)
20 |
18 |
16 |
14 |
12 |
10 |
 8 |
 6 |
 4 |
 2 |
 0 | ← Target (100% completion by Feb 12)
   └─────────────────────────────────────────
   Day: 1  2  3  4  5  6  7  8  9  10
        ↑
      Today (Day 0 - Planning Complete)

Expected Burn Rate: ~2.2 pts/day (22 pts / 10 working days)
Core Goal: Complete 11 pts (US-009 + US-013)
Stretch Goal: Complete additional 11 pts (US-003 + AI-2.7)
```

---

## 🚧 Blockers & Risks

### Current Blockers
**None** (Sprint planning just completed)

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| RRIF validation reveals calculation bugs | Medium | High | Timebox to 16 hrs, document issues for Sprint 4 if needed |
| Database migration fails in production | Low | Critical | Test locally, backup database, document rollback |
| US-009 breaks onboarding flow | Low | High | Extensive manual testing with 3 test users |
| E2E test framework not configured | Medium | Low | Use manual testing if E2E setup too complex |
| Stretch goals cause sprint overcommitment | Medium | Medium | Core stories (11 pts) are primary focus, stretch optional |

**Sprint 2 Learnings Applied**:
- Pre-sprint verification completed (AI-2.3) - no duplicate work
- Conservative core commitment (11 pts = 27.5% capacity)
- Stretch goals clearly separated (don't jeopardize core)
- Git history checked for all stories

---

## 📅 Sprint Schedule

### Week 1: Jan 30 - Feb 5

| Day | Date | Focus | Events |
|-----|------|-------|--------|
| Thu | Jan 30 | Sprint Planning review, start US-009 | Daily standup |
| Fri | Jan 31 | Complete US-009, start US-013 | Daily standup |
| Mon | Feb 3 | Continue US-013 (RRIF validation) | Daily standup, Backlog refinement |
| Tue | Feb 4 | Continue US-013 (RRIF testing) | Daily standup |
| Wed | Feb 5 | Complete US-013, start US-003 (if time) | Daily standup, Mid-sprint review |

### Week 2: Feb 6 - Feb 12

| Day | Date | Focus | Events |
|-----|------|-------|--------|
| Thu | Feb 6 | US-003 (Pension indexing migration) | Daily standup |
| Fri | Feb 7 | Complete US-003, start AI-2.7 (if time) | Daily standup |
| Mon | Feb 10 | AI-2.7 (E2E test) or buffer day | Daily standup |
| Tue | Feb 11 | Final testing, documentation | Daily standup |
| Wed | Feb 12 | Buffer day, sprint wrap-up | Sprint Review, Retrospective |

---

## 💬 Daily Standup Notes

### January 30, 2026 (Day 1)

**Yesterday**:
- Sprint 2 retrospective completed (14 action items)
- Sprint 3 planning completed (22 pts committed)
- Pre-sprint verification (AI-2.3) prevented duplicate work on US-022

**Today**:
- Review Sprint 3 board and goals with team
- Start US-009 (Skip Real Estate Step)
- Familiarize with codebase for onboarding flow

**Blockers**:
- None

**Notes**:
- Core focus: US-009 (3 pts) + US-013 (8 pts) = 11 pts
- Stretch goals: US-003 (8 pts) + AI-2.7 (3 pts) = 11 pts
- Remember to update backlog immediately after completion (AI-2.2)
- Use manual testing checklist for each story

---

### January 31, 2026 (Day 2)

**Yesterday**:
- [Team to fill in]

**Today**:
- [Team to fill in]

**Blockers**:
- [Team to fill in]

---

## 📊 Sprint Metrics

### Velocity
- **Committed**: 22 story points (11 core + 11 stretch)
- **Completed**: 0 story points (TBD)
- **Projected**: 11-22 story points (core-to-stretch range)
- **Burn Rate**: TBD (ideal: 2.2 pts/day)
- **Team Velocity**: Sprint 2 = 3 pts actual (16 pts reported but 13 pre-complete)

**Sprint 2 Lessons Applied**:
- Conservative core commitment (11 pts = 27.5% capacity)
- Pre-sprint verification prevents inflated metrics
- Focus on quality over quantity

### Quality Metrics
- **Bugs Found**: 0 (TBD)
- **Tests Written**: TBD
- **Test Pass Rate**: TBD
- **Code Review**: All changes to be reviewed
- **Manual Testing**: Checklist to be completed for each story

### Team Happiness
- **Morale**: TBD (will track throughout sprint)
- **Collaboration**: TBD
- **Blockers**: 0

---

## 🎯 Sprint Goals Review

### Primary Goal
✅ Improve onboarding UX by allowing users to skip real estate step (US-009)
✅ Validate RRIF strategies comply with CRA regulations (US-013)

### Secondary Goals (Stretch)
✅ Complete pension indexing backend implementation (US-003)
✅ Create E2E test to prevent withdrawal strategy regressions (AI-2.7)

### Success Criteria

**Core Success** (11 pts):
- [ ] US-009: 12 users unblocked from Step 6, onboarding completion rate improves
- [ ] US-013: RRIF strategies validated against CRA 2026 rules, discrepancies documented

**Stretch Success** (22 pts):
- [ ] US-003: Pension indexing persisted to database, frontend/backend integrated
- [ ] AI-2.7: E2E test prevents withdrawal strategy regressions (100% pass rate)

**Process Success** (Sprint 2 Retrospective Actions):
- [ ] AI-2.1: Git history checked before starting each story ✅
- [ ] AI-2.2: Backlog updated immediately when stories complete
- [ ] AI-2.3: Pre-sprint verification prevented duplicate work ✅
- [ ] Manual testing checklist used for each story
- [ ] UAT performed on user-facing features (US-009)
- [ ] No critical bugs introduced
- [ ] Team morale remains high

---

## 📝 Definition of Done (Sprint 3)

A user story is "Done" when:

### Code Quality
- [x] Code written and committed to version control
- [x] Code follows project style guidelines
- [x] **No ESLint warnings** (Sprint 2 standard maintained)
- [x] No console errors in browser
- [x] **Git history checked before starting work** (AI-2.1) 🆕

### Testing
- [x] Unit tests written and passing (where applicable)
- [x] Integration tests passing (where applicable)
- [x] **Manual testing checklist completed** (Sprint 2 standard)
- [x] Edge cases tested
- [x] **Performance tested with realistic data**

### Review
- [x] Code review completed by peer
- [x] Feedback addressed
- [x] **User Acceptance Testing performed** (for US-009)
- [x] Product owner reviewed feature

### Documentation
- [x] README updated (if needed)
- [x] API documentation updated (if needed)
- [x] User-facing documentation updated (if needed)
- [x] Code comments added for complex logic
- [x] **Rollback procedure documented** (for US-003 migration)
- [x] **Backlog updated immediately** (AI-2.2) 🆕

### Deployment
- [x] Deployed to staging environment (if applicable)
- [x] Smoke tests passed in staging
- [x] Deployed to production
- [x] Verified working in production

### Acceptance
- [x] All acceptance criteria met
- [x] Product owner approved
- [x] No critical bugs
- [x] Performance acceptable

---

## 🔗 Quick Links

- **Product Backlog**: [AGILE_BACKLOG.md](AGILE_BACKLOG.md)
- **Sprint 2 Board**: [SPRINT_2_BOARD.md](SPRINT_2_BOARD.md)
- **Sprint 2 Retrospective**: [SPRINT_2_RETROSPECTIVE.md](SPRINT_2_RETROSPECTIVE.md)
- **Sprint 3 Pre-Planning Verification**: [SPRINT_3_PRE_PLANNING_VERIFICATION.md](SPRINT_3_PRE_PLANNING_VERIFICATION.md)
- **Definition of Ready**: [DEFINITION_OF_READY.md](DEFINITION_OF_READY.md)
- **GitHub Repo**: https://github.com/marcosclavier/retirezest
- **Vercel Dashboard**: https://vercel.com/juans-projects-f3cf093e/webapp
- **Neon Database**: https://console.neon.tech

---

## 📋 Sprint 3 Action Items from Sprint 2 Retrospective

Sprint 3 implements these action items from Sprint 2 retrospective:

| ID | Action Item | Status | How Incorporated |
|----|-------------|--------|------------------|
| **AI-2.1** | Git History Check Before Starting Work | ✅ Implemented | Added to Definition of Ready, used in pre-sprint verification |
| **AI-2.2** | Update Backlog Immediately | 🔄 To Enforce | Added to Definition of Done, team commitment |
| **AI-2.3** | Pre-Sprint Verification | ✅ Complete | SPRINT_3_PRE_PLANNING_VERIFICATION.md created |
| **AI-2.4** | Manual Testing Checklist | 🔄 To Use | Part of DoD for US-009, US-013 |
| **AI-2.5** | Break Down Large Stories | ✅ Applied | All Sprint 3 stories ≤8 pts |
| **AI-2.7** | E2E Test for Withdrawal Strategy | ✅ Committed | Story in Sprint 3 (3 pts, stretch goal) |
| **AI-2.10** | Conservative Sprint Planning | ✅ Applied | 11 pts core (27.5% capacity) + 11 pts stretch |
| **AI-2.11** | Establish Baseline Velocity | 🔄 Tracking | Sprint 3 will establish true velocity |

**Deferred to Sprint 4**:
- AI-2.6: Performance optimization (8 hrs)
- AI-2.8: Database migration testing framework (10 hrs)
- AI-2.9: Comprehensive security audit (16 hrs)
- AI-2.12: Refine story estimation (ongoing)
- AI-2.13: Improve team communication (ongoing)
- AI-2.14: Celebrate wins (ongoing)

---

## 🎓 Sprint 3 Learning Goals

Based on Sprint 2 retrospective, Sprint 3 focuses on:

1. **Establishing True Baseline Velocity**: Sprint 2 reported 16 pts but only 3 were actually worked. Sprint 3 will establish accurate velocity with no pre-complete stories (thanks to AI-2.3).

2. **Core + Stretch Planning**: Test the hypothesis that 11-pt core commitment (27.5% capacity) with 11-pt stretch goals (55% total) provides sustainable pace with quality.

3. **Immediate Backlog Updates (AI-2.2)**: Enforce updating backlog within 1 hour of completing a story to prevent drift.

4. **Pre-Sprint Verification ROI**: Measure time saved by AI-2.3 process (already saved 12 hours by catching US-022).

5. **Manual Testing Effectiveness**: Track bugs caught by manual testing checklist vs automated tests.

6. **Database Migration Safety**: Document and validate rollback procedures for US-003.

---

## 🔍 Sprint 3 Key Insights

### Pre-Sprint Verification Success (AI-2.3)

**Before Sprint 3 Planning**:
- Ran git history checks on 10 candidate stories
- Discovered US-022 was already complete (commit 2487294)
- Prevented 12 hours of duplicate implementation
- Accurate velocity planning (no inflated metrics)

**Process Validation**: AI-2.3 is WORKING! This is the first sprint where we caught already-complete work BEFORE committing to it.

### Conservative Planning Approach

**Core Commitment**: 11 story points (27.5% of 40-pt capacity)
- US-009: Skip Real Estate Step [3 pts]
- US-013: RRIF Strategy Validation [8 pts]

**Stretch Goals**: Additional 11 points (55% total capacity if all complete)
- US-003: Pension Indexing Backend [8 pts]
- AI-2.7: E2E Test for Withdrawal Strategy [3 pts]

**Rationale**:
- Sprint 2 true velocity = 3 pts (after removing pre-complete work)
- 11-pt core is ~3.5x Sprint 2 velocity (challenging but achievable)
- Stretch goals provide opportunity without jeopardizing core success

### Story Breakdown Quality

All Sprint 3 stories meet Definition of Ready (DoR):
- ✅ Git history checked (AI-2.1)
- ✅ Clear acceptance criteria (6-10 criteria each)
- ✅ Technical approach documented
- ✅ Files to modify identified
- ✅ Estimated effort realistic (≤8 pts)
- ✅ No blockers or dependencies

**Improvement from Sprint 2**: No stories are already complete (verified via AI-2.3).

---

**Last Updated**: January 29, 2026 (Sprint 3 Planning Complete)
**Next Standup**: January 30, 2026 @ 9:00 AM EST
**Mid-Sprint Review**: February 5, 2026 @ 2:00 PM EST
**Sprint Review**: February 12, 2026 @ 2:00 PM EST
**Sprint Retrospective**: February 12, 2026 @ 3:00 PM EST
