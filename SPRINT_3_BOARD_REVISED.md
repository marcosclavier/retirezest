# Sprint 3 Board (REVISED) - RetireZest

**Sprint**: Sprint 3
**Duration**: January 30 - February 12, 2026 (2 weeks)
**Sprint Goal**: Fix critical income timing bug, improve onboarding UX, and validate simulation accuracy based on user feedback
**Team Capacity**: 16 story points (core) + 11 story points (stretch)
**Status**: ✅ REVISED to align with backlog and Sprint 2 retrospective

---

## 🚨 Revision Notes

**Date Revised**: January 29, 2026

**Why Revised**:
1. **New critical user feedback** (US-038, US-039) received after original planning
2. **Sprint 2 retrospective** recommended conservative planning (60% capacity)
3. **Pre-sprint verification** discovered US-022 already complete
4. **User satisfaction crisis** requires immediate prioritization (1/5 score)

**Changes from Original Plan**:
- ❌ Removed: US-022 (already complete - commit 2487294)
- ✅ Added: US-038 (P0 - Income Timing Bug) - CRITICAL
- ✅ Added: US-039 (P1 - Pension Start Dates) - Related to US-038
- 📉 Reduced: Core commitment from 22 pts → 16 pts (conservative)
- 📋 Moved: US-013 and US-003 to stretch goals (not core)

---

## 🎯 Sprint Progress

**Core Commitment**: 16 story points
**Stretch Goals**: 11 story points
**Total Planned**: 27 story points

**Completed**: 0 story points (0%)
**In Progress**: 0 story points (0%)
**To Do**: 27 story points (100%)

**Current Day**: Day 0 (Jan 29, 2026 - Sprint Planning Revised)
**Sprint Start**: Day 1 (Jan 30, 2026)

---

## 📊 Kanban Board

### 📋 To Do - Core Stories (16 pts) 🎯

These stories MUST be completed by end of sprint.

---

#### US-038: Fix CPP/OAS Income Timing Bug [8 pts] 🔴 P0 CRITICAL
**Owner**: Development Team
**Priority**: P0 (Critical)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 100% of users with CPP/OAS

**Why P0 Critical**:
- User gave 1/5 satisfaction score (lowest possible)
- Reported simulation doesn't account for "when pics come due"
- Simulation accuracy bug affecting retirement projections
- User retention risk (dissatisfied user may churn)

**User Story**:
As a user, I want simulations to correctly account for when CPP/OAS income starts (based on my selected start ages) so that my retirement projections are accurate and I can trust the tool.

**User Feedback** (rightfooty218@gmail.com):
- Satisfaction: 1/5 ⚠️
- Feedback: "This by far the worst even worse than ai. It diesnt take it to account when pics come due sucks"
- Email sent: Jan 29, 2026 (awaiting clarification on "pics")

**Acceptance Criteria**:

**Investigation Phase**:
- [ ] Query user's simulation data from database
- [ ] Review CPP/OAS start age settings in user's profile
- [ ] Check if simulation shows $0 income before start ages
- [ ] Reproduce bug with same inputs
- [ ] Identify root cause in simulation engine
- [ ] Document expected vs actual behavior
- [ ] Confirm if "pics" = CPP/OAS or pensions

**Fix Phase - If CPP/OAS Issue**:
- [ ] CPP income starts at correct age (user-selected, default 65)
- [ ] CPP reduction applied correctly (0.6%/month before 65, max 36%)
- [ ] CPP increase applied correctly (0.7%/month after 65, max 42%)
- [ ] No CPP income before selected start age
- [ ] OAS income starts at correct age (65-70 only)
- [ ] OAS deferral bonus applied correctly (0.6%/month, max 36%)
- [ ] No OAS income before age 65 or selected start age
- [ ] Year-by-year table shows $0 before start ages

**Testing**:
- [ ] Test CPP at age 60 (max reduction: 36%)
- [ ] Test CPP at age 65 (no adjustment)
- [ ] Test CPP at age 70 (max increase: 42%)
- [ ] Test OAS at age 65 (default)
- [ ] Test OAS at age 70 (max deferral: 36%)
- [ ] Test early retirement (retire before CPP/OAS start)
- [ ] Test delayed retirement (retire after CPP/OAS start)
- [ ] Verify health score calculations with corrected timing

**User Validation**:
- [ ] Re-run user's scenarios with fix
- [ ] Show user corrected results
- [ ] Request feedback on accuracy
- [ ] Monitor satisfaction score improvement

**Tasks**:
- [ ] **Day 1**: Query user simulation data (2 hours)
  ```sql
  SELECT * FROM Scenario WHERE userId = (SELECT id FROM User WHERE email = 'rightfooty218@gmail.com');
  ```
- [ ] **Day 1**: Review user's CPP/OAS settings (1 hour)
- [ ] **Day 1**: Reproduce bug with same inputs (2 hours)
- [ ] **Day 1**: Identify root cause in `simulation.py` (3 hours)
- [ ] **Day 2**: Fix CPP timing logic (4 hours)
- [ ] **Day 2**: Fix OAS timing logic (2 hours)
- [ ] **Day 2**: Test with multiple age scenarios (2 hours)
- [ ] **Day 2**: Deploy fix to production (1 hour)
- [ ] **Day 3**: Follow up with user (1 hour)
- [ ] **Day 3**: Create completion report (1 hour)
- [ ] **Day 3**: Update AGILE_BACKLOG.md (AI-2.2) (15 min)

**Files to Modify**:
- `juan-retirement-app/modules/simulation.py` (CPP/OAS timing logic)
- `juan-retirement-app/modules/government_benefits.py` (if exists)
- Test with user's exact simulation inputs

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do
**Blocker**: Waiting for user response to clarification email (sent Jan 29)
**Fallback**: If no response by Feb 1, investigate based on simulation data

---

#### US-009: Skip Real Estate Step in Onboarding [3 pts] 🟢 P2
**Owner**: Development Team
**Priority**: P2 (Medium)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 12 users blocked at Step 6 (86% onboarding complete)

**Why This Story**:
- **Quick win**: Only 3 pts, can complete in 6 hours
- **High ROI**: Unblocks 12 users immediately
- **Small, focused**: Clear scope, low risk
- **Sprint 2 learning**: Small stories (1-3 pts) have 100% success rate

**User Story**:
As a user, I want to skip the real estate step in onboarding so that I can complete my profile quickly if I don't own real estate.

**Acceptance Criteria**:
- [ ] "Skip for now" button added to Step 6 (Real Estate)
- [ ] Button styled consistently with existing UI
- [ ] Clicking "Skip" advances to Step 7 without saving data
- [ ] User can return to Step 6 later via Settings
- [ ] Profile completion shows 100% even if real estate skipped
- [ ] Help text: "You can add real estate later in Settings"
- [ ] Mobile-responsive button (tested on iPhone, Android)
- [ ] No console errors when skipping
- [ ] Analytics event tracked: "onboarding_real_estate_skipped"

**Tasks**:
- [ ] **Day 3**: Add "Skip for now" button to RealEstateForm (2 hours)
- [ ] **Day 3**: Update wizard navigation to handle skip (1 hour)
- [ ] **Day 3**: Update profile completion calculation (1 hour)
- [ ] **Day 3**: Add help text below skip button (30 min)
- [ ] **Day 3**: Test on mobile (iPhone, Android) (1 hour)
- [ ] **Day 3**: Add analytics event (30 min)
- [ ] **Day 3**: Manual testing with 3 test users (1 hour)
- [ ] **Day 3**: Deploy to production (30 min)
- [ ] **Day 3**: Update AGILE_BACKLOG.md (AI-2.2) (15 min)

**Files to Modify**:
- `app/(onboarding)/wizard/page.tsx` (main wizard logic)
- `components/wizard/RealEstateForm.tsx` (add skip button)
- `lib/wizard-utils.ts` (update completion calculation)
- `lib/analytics.ts` (add event tracking)

**Technical Approach**:
```tsx
// components/wizard/RealEstateForm.tsx
<div className="mt-4 flex justify-between">
  <Button variant="outline" onClick={handleSkip}>
    Skip for now
  </Button>
  <Button onClick={handleNext}>Continue</Button>
</div>

<p className="text-sm text-gray-600 mt-2">
  You can add real estate later in Settings
</p>
```

**Estimated Effort**: 6 hours (1 day)
**Status**: 📋 To Do
**Dependencies**: None

---

#### US-039: Pension Start Date Configuration [5 pts] 🟡 P1
**Owner**: Development Team
**Priority**: P1 (High)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 30-40% of users with pensions

**Why This Story**:
- **Related to US-038**: If "pics" = pensions, this solves the issue
- **Medium priority**: P1, affects significant user segment
- **Clear scope**: Well-defined acceptance criteria, 5 pts
- **Can pivot**: If US-038 reveals "pics" = pensions, prioritize this

**User Story**:
As a user with pension income, I want to specify when my pension payments will start (age or specific year) and have this accurately reflected in my retirement simulations so that my projections show correct income timing.

**Acceptance Criteria**:

**Data Model & Input**:
- [ ] Pension model includes `startAge` field (integer, 50-85)
- [ ] Pension input form asks "When will pension payments start?"
- [ ] Default pension start age is 65 if not specified
- [ ] Validation: startAge must be ≥ current age
- [ ] Help text: "Enter the age when you will start receiving pension payments"

**Simulation Integration**:
- [ ] Simulation shows $0 pension income before start age
- [ ] Simulation shows full pension amount starting from start age
- [ ] Pension income properly indexed for inflation (if enabled)
- [ ] Pension income included in taxable income calculations
- [ ] Pension income factored into OAS/GIS clawback
- [ ] Year-by-year table shows correct pension timing
- [ ] Cash flow chart visualizes pension starting at correct age

**Edge Cases**:
- [ ] User already receiving pension (startAge = currentAge)
- [ ] Future pension (startAge 10+ years away)
- [ ] Multiple pensions with different start ages
- [ ] Partner has different pension start age

**Testing**:
- [ ] Test pension starting at age 55 (early retirement)
- [ ] Test pension starting at age 60 (common early)
- [ ] Test pension starting at age 65 (standard)
- [ ] Test pension already started (age 70, pension at 65)
- [ ] Test pension 5 years in future
- [ ] Verify inflation indexing works over time

**Tasks**:
- [ ] **Day 4**: Update Prisma schema (startAge field) (1 hour)
- [ ] **Day 4**: Create database migration (1 hour)
- [ ] **Day 4**: Update pension API routes (2 hours)
- [ ] **Day 5**: Update Python simulation.py (pension timing) (3 hours)
- [ ] **Day 5**: Update pension input form (2 hours)
- [ ] **Day 5**: Update TypeScript types (1 hour)
- [ ] **Day 6**: Test with multiple scenarios (3 hours)
- [ ] **Day 6**: Deploy to production (1 hour)
- [ ] **Day 6**: Create completion report (1 hour)
- [ ] **Day 6**: Update AGILE_BACKLOG.md (AI-2.2) (15 min)

**Files to Modify**:
- `webapp/prisma/schema.prisma` (add startAge)
- `juan-retirement-app/modules/simulation.py` (pension timing logic)
- `webapp/components/PensionForm.tsx` (add start age input)
- `webapp/lib/types/simulation.ts` (update types)
- `webapp/app/api/pensions/route.ts` (save/retrieve start age)

**Python Backend Logic**:
```python
def calculate_pension_income(pension, current_age):
    start_age = pension.get('startAge', 65)

    if current_age < start_age:
        return 0  # Pension hasn't started yet

    # Pension has started - return amount with indexing
    monthly_amount = pension['monthlyAmount']
    annual_amount = monthly_amount * 12

    if pension.get('inflationIndexed', True):
        years_since_start = current_age - start_age
        annual_amount *= (1.02) ** years_since_start

    return annual_amount
```

**Estimated Effort**: 1 day (8 hours)
**Status**: 📋 To Do
**Dependency**: May be prioritized based on US-038 investigation

---

### 🎁 To Do - Stretch Goals (11 pts)

These stories are stretch goals. Complete if time permits.

---

#### US-013: RRIF Strategy Validation [8 pts] 🟡 P1 (STRETCH)
**Owner**: Development Team
**Priority**: P1 (High) - Stretch Goal
**Epic**: Epic 5: Simulation Accuracy & Features
**User Impact**: 60% of users with RRIFs

**Why Stretch Goal**:
- High value but not critical this sprint
- Takes 2 days (significant effort)
- Better suited for focused Sprint 4 work
- US-038 is higher priority

**User Story**:
As a retirement planner, I want to verify that RRIF withdrawal strategies comply with CRA regulations so that users receive accurate tax planning advice.

**Acceptance Criteria**:
- [ ] RRIF minimum percentages match CRA 2026 schedule
- [ ] All RRIF strategies tested (6 total)
- [ ] Edge cases validated (age 71 transition, spousal RRIF)
- [ ] Automated test suite created (pytest)
- [ ] Validation report documented
- [ ] Any discrepancies fixed

**Tasks**:
- [ ] Download CRA RRIF minimum schedule (2026)
- [ ] Audit Python RRIF logic vs CRA rules
- [ ] Create test cases for ages 55-95
- [ ] Test all 6 withdrawal strategies
- [ ] Test RRIF + GIS interaction
- [ ] Write automated tests
- [ ] Document findings
- [ ] Fix any issues found

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do (Stretch)
**Defer to Sprint 4 if not completed**

---

#### US-003: Pension Indexing Backend [3 pts] 🟡 P1 (STRETCH)
**Owner**: Development Team
**Priority**: P1 (High) - Stretch Goal
**Epic**: Epic 1: User Retention & Engagement
**User Impact**: Users with pensions

**Why Stretch Goal**:
- Frontend already done (commit 997c924)
- Backend persistence is straightforward
- Can complete in 6 hours if time allows
- Not critical for Sprint 3

**User Story**:
As a user with a pension, I want my pension income to be indexed for inflation so that my retirement projections are realistic.

**Acceptance Criteria**:
- [ ] Prisma schema updated with `inflationIndexed` field
- [ ] Database migration runs successfully
- [ ] API routes save/retrieve inflationIndexed value
- [ ] Existing pensions default to true
- [ ] Frontend checkbox state persists

**Tasks**:
- [ ] Update Prisma schema (2 hours)
- [ ] Create and test migration (2 hours)
- [ ] Update API routes (1 hour)
- [ ] Test with existing pensions (1 hour)
- [ ] Deploy to production (1 hour)

**Estimated Effort**: 6 hours
**Status**: 📋 To Do (Stretch)
**Defer to Sprint 4 if not completed**

---

## 🔄 In Progress (0 pts)

No stories in progress yet. Sprint starts Jan 30, 2026.

---

## ✅ Done (0 pts)

No stories completed yet.

---

## 📈 Sprint Burndown

### Story Points Remaining by Day

```
Day 0  (Jan 29): 27 pts (Planning)
Day 1  (Jan 30): 27 pts → 24 pts (US-038 investigation starts)
Day 2  (Jan 31): 24 pts → 20 pts (US-038 investigation complete)
Day 3  (Feb 3):  20 pts → 12 pts (US-009 complete, US-038 fix starts)
Day 4  (Feb 4):  12 pts → 8 pts  (US-038 complete)
Day 5  (Feb 5):  8 pts  → 6 pts  (US-039 starts)
Day 6  (Feb 6):  6 pts  → 3 pts  (US-039 complete)
Day 7  (Feb 9):  3 pts  → 3 pts  (Stretch goals start)
Day 8  (Feb 10): 3 pts  → 0 pts  (US-003 complete - stretch)
Day 9  (Feb 11): 0 pts  → 0 pts  (Buffer day)
Day 10 (Feb 12): 0 pts  → 0 pts  (Sprint Review & Retro)
```

**Note**: Stretch goals (US-013, US-003) may not be completed. That's acceptable.

---

## 🎯 Daily Goals

### Week 1: Investigation + Quick Wins

**Day 1 (Jan 30) - US-038 Investigation Start**
- Query user simulation data
- Review CPP/OAS settings
- Reproduce bug
- Goal: Understand root cause by EOD

**Day 2 (Jan 31) - US-038 Investigation Complete**
- Identify root cause in simulation.py
- Confirm if "pics" = CPP/OAS or pensions
- Plan fix approach
- Goal: Investigation complete, fix plan ready

**Day 3 (Feb 3) - Quick Win Day**
- Complete US-009 (Skip Real Estate) in morning
- Deploy US-009 to production
- Start US-038 fix in afternoon
- Goal: 1 story complete, US-038 50% done

**Day 4 (Feb 4) - US-038 Fix**
- Complete CPP/OAS timing fix
- Test with multiple scenarios
- Deploy to production
- Goal: US-038 complete

**Day 5 (Feb 5) - US-039 Start**
- Update Prisma schema
- Create migration
- Update Python backend
- Goal: US-039 50% done

### Week 2: Completion + Stretch Goals

**Day 6 (Feb 6) - US-039 Complete**
- Update frontend form
- Test edge cases
- Deploy to production
- Goal: Core stories 100% complete

**Day 7 (Feb 9) - Stretch Goal Start**
- Start US-003 (Pension Indexing) if time
- OR Start US-013 (RRIF Validation) if preferred
- Goal: Stretch goal 25% done

**Day 8 (Feb 10) - Stretch Goal Continue**
- Continue stretch goal work
- Goal: Stretch goal 75% done

**Day 9 (Feb 11) - Stretch Goal Complete or Defer**
- Complete stretch goal if possible
- If not done, defer to Sprint 4
- Goal: Stretch goal done OR clearly deferred

**Day 10 (Feb 12) - Sprint Review & Retro**
- Sprint Review: Demo completed stories
- Sprint Retrospective: What went well, what to improve
- Plan Sprint 4
- Goal: Sprint closed, Sprint 4 planned

---

## 🚧 Blockers & Risks

### Active Blockers

1. **US-038: Waiting for user response**
   - **Status**: Email sent Jan 29, awaiting reply
   - **Impact**: Investigation delayed until we know if "pics" = CPP/OAS or pensions
   - **Mitigation**: If no response by Feb 1, investigate simulation data directly
   - **Owner**: Development Team

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **User doesn't respond to email** | Medium | Medium | Investigate based on simulation data; assume CPP/OAS |
| **US-038 takes longer than 2 days** | Low | High | Timebox investigation to 1 day; move to Sprint 4 if needed |
| **Scope creep on US-038** | Low | Medium | Stick to acceptance criteria; defer extras to Sprint 4 |
| **Stretch goals not completed** | High | Low | Acceptable; defer to Sprint 4 |
| **US-039 conflicts with US-038 fix** | Low | Medium | Both stories address income timing; coordinate fixes |

---

## 📊 Team Capacity

### Sprint 3 Capacity Analysis

| Metric | Value | Notes |
|--------|-------|-------|
| **Sprint Duration** | 2 weeks (10 days) | Jan 30 - Feb 12, 2026 |
| **Historical Velocity** | Sprint 1: 31 pts, Sprint 2: 16 pts | Average: 23.5 pts |
| **Conservative Target (60%)** | 18 pts | Sprint 2 retro recommendation |
| **Core Commitment** | 16 pts | Below 60% for safety |
| **Stretch Goals** | 11 pts | If time allows |
| **Total Planned** | 27 pts | Core (16) + Stretch (11) |

### Story Size Distribution

| Size | Count | Percentage | Stories |
|------|-------|-----------|---------|
| **3 pts** | 2 | 40% (core) | US-009, US-003 (stretch) |
| **5 pts** | 1 | 20% (core) | US-039 |
| **8 pts** | 2 | 40% | US-038 (core), US-013 (stretch) |

**Analysis**: Good mix of small (3 pts) and medium (5-8 pts). No large stories (13+ pts). Aligns with Sprint 2 learning: small stories succeed.

---

## 🎓 Sprint 2 Retrospective Applied

### Process Improvements Implemented

#### AI-2.1: Git History Check ✅
**Status**: Applied
- Pre-sprint verification completed (SPRINT_3_PRE_PLANNING_VERIFICATION.md)
- Confirmed US-022 already complete (not in Sprint 3)
- Confirmed US-009, US-013, US-039 not started

#### AI-2.2: Update Backlog Immediately ✅
**Status**: Committed
- Every story completion includes AGILE_BACKLOG.md update
- Part of Definition of Done for all stories
- Prevents future backlog drift

#### AI-2.3: Pre-Sprint Verification ✅
**Status**: Applied
- SPRINT_3_PRE_PLANNING_VERIFICATION.md created before planning
- Verified 10 candidate stories
- Identified 2 already complete, 2 new critical stories

#### Conservative Planning (60% Capacity) ✅
**Status**: Applied
- Core commitment: 16 pts (53% of 30 pts capacity)
- Stretch goals: 11 pts
- Total: 27 pts (90% capacity max)

#### Small Story Preference ✅
**Status**: Applied
- 2 of 3 core stories are ≤5 pts (US-009: 3 pts, US-039: 5 pts)
- Only US-038 is 8 pts (critical, must do)

---

## 📋 Definition of Done

### Story-Level DoD

Each story is "Done" when:

- [ ] All acceptance criteria met
- [ ] Code committed to git
- [ ] Manual testing completed
- [ ] No console errors or ESLint warnings
- [ ] Deployed to production
- [ ] **AGILE_BACKLOG.md updated (AI-2.2)** ⭐
- [ ] Completion report created (if >5 pts)

### Sprint-Level DoD

Sprint 3 is "Done" when:

- [ ] Core stories completed (16 pts minimum)
- [ ] User satisfaction improved (US-038 follow-up)
- [ ] 12 users unblocked from onboarding (US-009)
- [ ] Sprint retrospective completed
- [ ] Sprint 4 planning prepared
- [ ] All documentation updated

---

## 🎯 Success Metrics

### Sprint Success

| Metric | Target | Status |
|--------|--------|--------|
| **Core Stories Completed** | 100% (16 pts) | 📋 To Do |
| **User Satisfaction** | >3/5 (was 1/5) | 📋 To Do |
| **Onboarding Completion** | +12 users | 📋 To Do |
| **Stretch Goals** | >50% (6+ pts) | 📋 To Do |
| **Backlog Updated (AI-2.2)** | 100% | 📋 To Do |

### User Impact

| Story | Users Affected | Expected Outcome |
|-------|----------------|------------------|
| **US-038** | 100% (CPP/OAS) | Accurate income timing, satisfaction ↑ |
| **US-009** | 12 users | Onboarding completion to 100% |
| **US-039** | 30-40% (pensions) | Accurate pension timing |

---

**Document Owner**: Development Team
**Created**: January 29, 2026
**Last Updated**: January 29, 2026
**Status**: ✅ Ready for Sprint 3 Kickoff (Jan 30, 2026)
