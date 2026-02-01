# Sprint 5 Board - RetireZest

**Sprint**: Sprint 5
**Duration**: January 31 - February 13, 2026 (2 weeks / 10 days)
**Sprint Goal**: Address user feedback issues and improve simulation accuracy & transparency
**Team Capacity**: 18 story points (conservative 60% capacity)
**Status**: 🟡 PLANNED

---

## 📋 Sprint Overview

### Why Sprint 5?

Sprint 5 focuses on **user-driven improvements** based on real feedback:
- rightfooty218@gmail.com feedback (1/5 satisfaction) → US-040, US-041
- Mobile usability improvements → US-043
- Simulation accuracy & education → US-013, US-027
- Quick UX wins → US-042

### Sprint 4 Context

**Sprint 4 Outcome** (Jan 30, 2026 - completed in 1 day):
- **Committed**: 9 pts (US-038, US-009)
- **Completed**: 9 pts (100%)
- **Velocity**: 8 pts/day (exceptional - completed in 1 day vs 5 days planned)
- **Key Achievement**: Fixed critical CPP/OAS income timing bug affecting all 84 users

**Key Learning from Sprint 4**: Conservative planning + focused scope = exceptional execution

---

## 🎯 Sprint 5 Commitment

### Core Stories (18 pts)

| ID | Story | Points | Priority | Status | Owner |
|----|-------|--------|----------|--------|-------|
| **US-040** | **Investment Timeline Display** | **5** | **P1 🟡** | **📋 To Do** | Frontend Team |
| **US-041** | **Explain Compound Growth** | **3** | **P2 🟢** | **📋 To Do** | Frontend Team |
| **US-042** | **Align Withdrawal Strategy Names** | **2** | **P2 🟢** | **📋 To Do** | Full Stack |
| **US-013** | **RRIF Strategy Validation** | **8** | **P1 🟡** | **📋 To Do** | Backend Team |

**Total Committed**: 18 story points

### Stretch Goals (8 pts) - If capacity allows

| ID | Story | Points | Priority | Reason Stretch |
|----|-------|--------|----------|----------------|
| US-043 | Mobile: Change Withdrawal Strategy | 3 | P2 🟢 | Nice-to-have, not blocking |
| US-027 | Educational Guidance - Withdrawal Order | 5 | P1 🟡 | Lower urgency, educational content |

### Deferred to Sprint 6+

| ID | Story | Points | Priority | Reason Deferred |
|----|-------|--------|----------|-----------------|
| US-044 | Fix Cash Flow Gap Detection | 5 | P0 🔴 | Requires investigation, awaiting user response |
| US-039 | Pension Start Date Configuration | 5 | P1 🟡 | Lower priority than user feedback stories |
| US-003 | Database Migration - Pension Indexing | 8 | P1 🟡 | Already functional, backend persistence can wait |
| US-021 | Configurable Investment Yields | 8 | P1 🟡 | Lower priority than accuracy fixes |

---

## 📊 Kanban Board

### 📋 To Do (18 pts)

---

#### US-040: Investment Timeline Display [5 pts] 🟡 P1

**Priority**: P1 (High - User Feedback Driven)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 100% of users (transparency & trust)

**User Story**:
As a user, I want to see a visual timeline showing when my RRSP/LIRA converts to RRIF/LRIF, when each investment account will deplete, and how long my investments will last so that I can understand my retirement income timeline.

**User Feedback Source**:
- **User**: rightfooty218@gmail.com (Ontario, age 67, single)
- **Date**: January 30, 2026
- **Satisfaction Score**: 1/5 (Very Dissatisfied)
- **Complaint**: "Doesnt give end date for investments"
- **Impact**: User cannot plan because they don't know when accounts deplete

**Acceptance Criteria**:
- [ ] Show "RRSP/LIRA → RRIF/LRIF conversion at age 71" in timeline
- [ ] Tooltip: "Both RRSP and LIRA convert to RRIF/LRIF at age 71 per CRA rules"
- [ ] Display depletion dates for each account type (RRIF/LRIF, TFSA, Non-Reg)
- [ ] Show "Your investments last until age X" summary message
- [ ] Visual timeline/Gantt chart of account lifespans (optional but recommended)
- [ ] Mobile-friendly display (responsive design)
- [ ] Show key milestones: conversion, depletion, final year
- [ ] Handle edge cases: accounts that never deplete, accounts already empty
- [ ] Tooltips explaining each milestone
- [ ] Color-coded timeline (green = healthy, yellow = warning, red = depleted)

**Tasks Breakdown**:

**Day 1-2** (8 hours):
- [ ] Design timeline UI mockup (2 hours)
  - Sketch layout for desktop & mobile
  - Choose visual representation (Gantt chart, milestone list, or both)
  - Define color scheme and iconography
- [ ] Analyze simulation results data structure (2 hours)
  - Review DataFrame columns (end_rrif_p1, end_tfsa_p1, end_nonreg_p1)
  - Identify year when each account reaches $0
  - Detect RRSP/LIRA → RRIF/LRIF conversion (age 71)
  - Calculate "investments last until age X"
- [ ] Create timeline calculation utility (4 hours)
  - Function: calculateInvestmentTimeline(simulationResults)
  - Return: { lrifConversionAge, depletionDates, finalAge }
  - Handle edge cases (never depletes, already empty)

**Day 3-4** (8 hours):
- [ ] Implement timeline component (6 hours)
  - Component: `InvestmentTimeline.tsx`
  - Props: simulationResults, userAge
  - Visual: Horizontal timeline with milestones
  - Responsive: Stack vertically on mobile
  - Accessibility: Screen reader friendly
- [ ] Add to simulation results page (1 hour)
  - Insert below health score, above year-by-year table
  - Pass simulation data to component
- [ ] Write unit tests (1 hour)
  - Test depletion calculation
  - Test LRIF conversion detection
  - Test edge cases

**Day 5** (3 hours):
- [ ] Manual testing with multiple scenarios (2 hours)
  - Test with rightfooty218's data ($392K at age 90)
  - Test with depleting accounts
  - Test with non-depleting accounts (high returns)
  - Test on mobile devices (iPhone, Android)
- [ ] Deploy to production (30 min)
- [ ] Update documentation (30 min)

**Files to Create**:
- `webapp/components/simulation/InvestmentTimeline.tsx` (new)
- `webapp/lib/timeline-utils.ts` (new - calculation logic)
- `webapp/__tests__/timeline-utils.test.ts` (new - unit tests)

**Files to Modify**:
- `webapp/app/(dashboard)/simulation/page.tsx` (add timeline component)

**Estimated Effort**: 19 hours (2.5 days)
**Assigned Days**: Day 1-5 (Jan 31 - Feb 4)

---

#### US-041: Explain Compound Growth [3 pts] 🟢 P2

**Priority**: P2 (Medium - User Feedback Driven)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: Users confused by growing balances despite withdrawals

**User Story**:
As a user, I want to understand why my investment balances might grow (e.g., $300K → $400K) even though I'm withdrawing money every year so that I can trust the simulation results and understand compound interest.

**User Feedback Source**:
- **User**: rightfooty218@gmail.com
- **Complaint**: "it say imwill have 1000000 complete wrong when I am 90"
- **Analysis**: User saw $392K at age 90 (up from $303K starting), confused why balance grew
- **Root Cause**: User doesn't understand compound interest (5% return > withdrawal rate)

**Acceptance Criteria**:
- [ ] Tooltip on final balance explaining growth rate vs. withdrawal rate
- [ ] Year-by-year breakdown showing: "Growth: $X, Withdrawals: -$Y, Net Change: $Z"
- [ ] Visual indicator (icon/badge) when growth exceeds withdrawals
- [ ] Help text: "Your 5% return ($15K/year) exceeds your $10K/year withdrawals"
- [ ] Link to compound interest explainer article (optional)
- [ ] Mobile-friendly tooltips
- [ ] Show on hover (desktop) and tap (mobile)

**Tasks Breakdown**:

**Day 6-7** (6 hours):
- [ ] Create GrowthExplainer component (3 hours)
  - Component: `GrowthExplainerTooltip.tsx`
  - Props: startingBalance, finalBalance, totalWithdrawals, avgReturnRate, years
  - Calculate: totalGrowth, growthPerYear, withdrawalsPerYear
  - Display: "Your $300K grew to $392K because your 5% returns ($15K/year) exceeded your $13K/year withdrawals"
- [ ] Add to year-by-year table (2 hours)
  - Add "Growth" column next to "Balance" column
  - Show: +$X (green) or -$X (red) for each year
  - Tooltip on column header explaining calculation
- [ ] Add summary card at top of results (1 hour)
  - "Why Your Balance Grew" card
  - Show: Total Growth, Total Withdrawals, Net Change
  - Icon: 📈 (growing) or 📉 (declining)

**Day 8** (3 hours):
- [ ] Manual testing (2 hours)
  - Test with rightfooty218's scenario
  - Test with depleting accounts
  - Test on mobile
- [ ] Deploy to production (30 min)
- [ ] Update documentation (30 min)

**Files to Create**:
- `webapp/components/simulation/GrowthExplainerTooltip.tsx` (new)

**Files to Modify**:
- `webapp/app/(dashboard)/simulation/page.tsx` (add growth explainer)
- `webapp/components/simulation/YearByYearTable.tsx` (add Growth column)

**Estimated Effort**: 9 hours (1.5 days)
**Assigned Days**: Day 6-8 (Feb 5-7)

---

#### US-042: Align Withdrawal Strategy Names [2 pts] 🟢 P2

**Priority**: P2 (Medium - Quick Win)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: Confusion when strategy names don't match between pages

**User Story**:
As a user, I want withdrawal strategy names to be consistent between the frontend dropdown and backend simulation results so that I'm not confused about which strategy I selected.

**Acceptance Criteria**:
- [ ] Frontend dropdown labels match backend strategy identifiers
- [ ] Strategy descriptions updated for clarity
- [ ] No breaking changes to existing simulations
- [ ] All 4 strategies aligned:
  - "Income Minimization" (frontend) = "income-minimization" (backend)
  - "Tax Efficiency" (frontend) = "tax-efficiency" (backend)
  - "Balanced" (frontend) = "balanced" (backend)
  - "Legacy Maximization" (frontend) = "legacy-maximization" (backend)

**Tasks Breakdown**:

**Day 3** (4 hours):
- [ ] Audit current naming (1 hour)
  - Frontend: Check StrategySelector component
  - Backend: Check Python simulation.py
  - Database: Check Scenario table values
  - Document mismatches
- [ ] Update frontend labels (1.5 hours)
  - Align dropdown options with backend values
  - Update strategy descriptions
  - Ensure clarity and consistency
- [ ] Add TypeScript types (1 hour)
  - Create StrategyType enum
  - Prevent typos and ensure type safety
- [ ] Test strategy selection flow (30 min)
  - Create simulation with each strategy
  - Verify results show correct strategy name

**Files to Modify**:
- `webapp/components/simulation/StrategySelector.tsx`
- `webapp/types/simulation.ts` (add StrategyType enum)

**Estimated Effort**: 4 hours (0.5 days)
**Assigned Days**: Day 3 (Feb 2)

---

#### US-013: RRIF Strategy Validation [8 pts] 🟡 P1

**Priority**: P1 (High - Simulation Accuracy)
**Epic**: Epic 5: Simulation Accuracy
**User Impact**: RRIF withdrawals may not comply with CRA minimum withdrawal rules

**User Story**:
As a user with RRSP/LIRA/RRIF/LRIF accounts, I want withdrawals to comply with CRA minimum withdrawal percentages so that my retirement plan is legally compliant and accurate.

**Background**:
- RRSP and LIRA both convert to RRIF/LRIF at age 71 (mandatory per CRA)
- RRIF and LRIF have identical minimum withdrawal percentages set by CRA
- Age 71: 5.28%, Age 80: 6.82%, Age 90: 11.92%, Age 95: 20.00%
- Simulation must withdraw AT LEAST the minimum each year
- Excess withdrawals are allowed (for spending needs)
- Note: LIRA is stored in rrsp_balance and converts automatically (simulation.py:1375-1377)

**Acceptance Criteria**:

**Investigation Phase**:
- [ ] Review current RRIF withdrawal logic in Python backend
- [ ] Verify RRSP/LIRA → RRIF/LRIF conversion already implemented (simulation.py:1375-1377)
- [ ] Confirm LIRA stored in rrsp_balance converts at age 71 correctly
- [ ] Identify if minimum withdrawals are enforced
- [ ] Check CRA 2025 minimum withdrawal schedule accuracy
- [ ] Test with multiple ages (71, 80, 90, 95)

**Fix Phase** (if needed):
- [ ] Update RRIF/LRIF withdrawal calculation to enforce minimums
- [ ] Apply minimum withdrawal rate based on age
- [ ] Allow excess withdrawals for spending needs
- [ ] Ensure no withdrawals before age 71 (RRSP/LIRA phase)

**Testing Phase**:
- [ ] Test RRIF minimum withdrawals at age 71 (5.28%)
- [ ] Test RRIF minimum withdrawals at age 80 (6.82%)
- [ ] Test RRIF minimum withdrawals at age 90 (11.92%)
- [ ] Test RRIF minimum withdrawals at age 95 (20.00%)
- [ ] Test scenario where spending needs < minimum withdrawal
- [ ] Test scenario where spending needs > minimum withdrawal
- [ ] Verify excess withdrawals taxed correctly

**Documentation**:
- [ ] Document CRA compliance in code comments
- [ ] Add comment to models.py: "LIRA stored in rrsp_balance, converts to RRIF/LRIF at 71"
- [ ] Document that RRIF and LRIF are treated identically per CRA tax rules
- [ ] Add tooltip in UI: "RRIF/LRIF minimum withdrawals enforced per CRA rules"
- [ ] Create test report with validation results

**Tasks Breakdown**:

**Week 1** (16 hours):
- [ ] Day 1-2: Investigation (8 hours)
  - Review juan-retirement-app/modules/simulation.py
  - Check RRIF withdrawal logic (search for "rrif" or "minimum")
  - Create test script: test_rrif_minimums.py
  - Run tests with 4 age scenarios (71, 80, 90, 95)
  - Document findings
- [ ] Day 3-4: Implementation (8 hours)
  - Update RRIF withdrawal calculation (if needed)
  - Add CRA 2025 minimum withdrawal table
  - Implement min withdrawal enforcement
  - Handle edge cases (excess withdrawals, early conversion)

**Week 2** (8 hours):
- [ ] Day 6-7: Testing (6 hours)
  - Automated tests: test_rrif_minimums.py
  - Manual testing with real user scenarios
  - Regression testing (ensure no breaks to existing simulations)
- [ ] Day 8: Documentation & Deployment (2 hours)
  - Create test report
  - Update code comments
  - Deploy to production
  - Update AGILE_BACKLOG.md

**Files to Review**:
- `juan-retirement-app/modules/simulation.py`
- `juan-retirement-app/modules/withdrawal.py` (if exists)
- `juan-retirement-app/modules/models.py`

**Files to Create**:
- `juan-retirement-app/test_rrif_minimums.py` (test script)
- `RRIF_VALIDATION_REPORT.md` (test results)

**Estimated Effort**: 24 hours (3 days)
**Assigned Days**: Day 1-2, 3-4, 6-7, 8 (distributed across sprint)

**Risk**: 🟡 MEDIUM - May discover complex issues requiring architectural changes

---

## 🔄 In Progress (0 pts)

*No stories in progress yet. Sprint starts Jan 31.*

---

## ✅ Done (0 pts)

*No stories completed yet. Sprint starts Jan 31.*

---

## 📈 Sprint Metrics

### Burndown Tracking

| Day | Date | Completed | Remaining | Daily Notes |
|-----|------|-----------|-----------|-------------|
| Day 0 | Jan 30 | 0 pts | 18 pts | Sprint planning complete |
| Day 1 | Jan 31 | 0 pts | 18 pts | US-013 investigation started |
| Day 2 | Feb 1 | 0 pts | 18 pts | US-040 design & development |
| Day 3 | Feb 2 | 2 pts | 16 pts | US-042 completed ✅ |
| Day 4 | Feb 3 | 2 pts | 16 pts | US-013 implementation |
| Day 5 | Feb 4 | 7 pts | 11 pts | US-040 completed ✅ |
| Day 6 | Feb 5 | 7 pts | 11 pts | US-041 development |
| Day 7 | Feb 6 | 7 pts | 11 pts | US-013 testing |
| Day 8 | Feb 7 | 10 pts | 8 pts | US-041 completed ✅ |
| Day 9 | Feb 8 | 18 pts | 0 pts | US-013 completed ✅ - SPRINT COMPLETE |
| Day 10 | Feb 9 | 18 pts | 0 pts | Sprint review & retrospective |

**Target**: Complete 18 pts by Day 9 (Feb 8)
**Buffer**: Day 10 for overflow or stretch goals

### Velocity

**Sprint 1-4 Average**: 20 pts/sprint (2-week sprints)
**Sprint 5 Target**: 18 pts (conservative 60% of 30 pts capacity)
**Sprint 5 Stretch**: 21-26 pts (if US-043 or US-027 added)

---

## 🎯 Sprint Goal Success Criteria

### Minimum Success (60% = 11 pts)
- ✅ US-040 completed (5 pts) - User feedback addressed
- ✅ US-041 completed (3 pts) - Education improved
- ✅ US-042 completed (2 pts) - Quick win
- ✅ US-013 investigation complete (1 pt partial credit)

### Full Success (100% = 18 pts)
- ✅ US-040 completed (5 pts)
- ✅ US-041 completed (3 pts)
- ✅ US-042 completed (2 pts)
- ✅ US-013 completed (8 pts)
- ✅ rightfooty218@gmail.com re-engaged (responds positively to timeline feature)

### Stretch Success (>100% = 21-26 pts)
- ✅ All 18 pts completed
- ✅ US-043 completed (3 pts)
- ✅ US-027 started or completed (5 pts)
- ✅ User satisfaction improves (feedback scores >3/5)

---

## 🚧 Risks & Mitigation

### Risk #1: RRIF Validation Complexity (US-013)

**Risk**: RRIF minimum withdrawal logic may be more complex than expected, requiring architectural changes.

**Probability**: Medium
**Impact**: High (8 pts = 44% of sprint)

**Mitigation**:
- Front-load investigation (Day 1-2)
- Daily check-ins on progress
- Pivot plan: If US-013 blocked by Day 5, defer to Sprint 6 and pull in US-043 (3 pts)

### Risk #2: User Feedback Dependency

**Risk**: rightfooty218@gmail.com may not respond to clarification email, making it harder to validate US-040/US-041 fixes.

**Probability**: Medium
**Impact**: Low (can still implement based on analysis)

**Mitigation**:
- Implement features based on backend simulation analysis
- Test with user's exact data (already have from database)
- Send follow-up email after deployment with screenshots

### Risk #3: Scope Creep

**Risk**: Stories may expand during implementation (e.g., US-040 timeline becomes complex data visualization).

**Probability**: Low
**Impact**: Medium

**Mitigation**:
- Stick to MVP implementation
- Use simple visual designs (no fancy libraries)
- Defer enhancements to backlog as separate stories

---

## 📅 Daily Standup Template

### Daily Standup Questions

1. **What did I complete yesterday?**
2. **What am I working on today?**
3. **What blockers do I have?**

### Standup Schedule

**Time**: 9:00 AM EST daily
**Duration**: 15 minutes max
**Focus**: Track US-013 progress, user feedback stories

---

## 🎯 Definition of Done

### Story-Level DoD

- [ ] All acceptance criteria met
- [ ] Code reviewed (self-review minimum)
- [ ] TypeScript compilation passes (0 errors)
- [ ] ESLint warnings addressed (0 warnings)
- [ ] Manual testing completed
- [ ] Deployed to production
- [ ] User documentation updated (if needed)
- [ ] AGILE_BACKLOG.md updated (story marked ✅ Done)

### Sprint-Level DoD

- [ ] All committed stories completed (18 pts)
- [ ] Production deployment successful
- [ ] User feedback addressed (US-040, US-041)
- [ ] RRIF validation documented
- [ ] Sprint retrospective completed
- [ ] Sprint 6 planning initiated

---

## 📊 Sprint Health Dashboard

### Current Sprint Health: 🟢 HEALTHY

| Metric | Status | Notes |
|--------|--------|-------|
| **Scope Stability** | 🟢 STABLE | 18 pts committed, clear priorities |
| **Blocker Risk** | 🟢 LOW | No known blockers, all stories ready |
| **Team Capacity** | 🟢 HEALTHY | Conservative 60% capacity |
| **Dependencies** | 🟢 CLEAR | Stories are independent |
| **Technical Risk** | 🟡 MODERATE | US-013 may be complex |

**Overall Assessment**: Sprint 5 is well-planned with user-driven priorities and conservative capacity. Risk is moderate due to US-013 complexity.

---

## 🔗 Related Documents

- [SPRINT_4_COMPLETION_SUMMARY.md](SPRINT_4_COMPLETION_SUMMARY.md) - Previous sprint
- [AGILE_BACKLOG.md](AGILE_BACKLOG.md) - Product backlog
- [RIGHTFOOTY_FEEDBACK_ANALYSIS.md](RIGHTFOOTY_FEEDBACK_ANALYSIS.md) - User feedback analysis
- [SPRINT_BOARD.md](SPRINT_BOARD.md) - Sprint 1 board (reference)

---

## 📝 Sprint Retrospective (Planned for Feb 9)

### Retrospective Agenda

1. **What went well?**
2. **What didn't go well?**
3. **What did we learn?**
4. **Action items for Sprint 6**

### Focus Areas

- User feedback responsiveness (US-040, US-041)
- RRIF validation approach (US-013)
- Conservative capacity planning effectiveness
- Quick wins execution (US-042)

---

**Document Created**: January 30, 2026
**Sprint Start**: January 31, 2026
**Sprint End**: February 13, 2026
**Next Sprint Planning**: February 14, 2026
