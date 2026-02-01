# Sprint 5 Planning Summary

**Date**: January 30, 2026
**Sprint Duration**: 2 weeks (January 31 - February 13, 2026)
**Team Capacity**: 18 story points (conservative 60% of 30 pts)
**Sprint Goal**: Address user feedback issues and improve simulation accuracy & transparency

---

## Executive Summary

Sprint 5 focuses on **user-driven improvements** based on actual feedback from rightfooty218@gmail.com (1/5 satisfaction score) and deferred stories from Sprint 3.

### Key Priorities:
1. **User Feedback** - Implement US-040, US-041 from rightfooty218 analysis
2. **Quick Wins** - US-042 (strategy name alignment)
3. **Simulation Accuracy** - US-013 (RRIF validation)

---

## Sprint 4 Review

**Completed**: January 30, 2026 (1 day vs 5 days planned)
- ✅ US-038: Fix CPP/OAS Income Timing Bug (8 pts) - **DONE**
- ✅ US-009: Skip Real Estate Step (1 pt - pre-existing) - **VERIFIED**
- **Total**: 9/9 pts (100% completion)
- **Velocity**: 8 pts/day (exceptional)

**Key Achievement**: Fixed critical bug affecting all 84 users, deployed to production

---

## Sprint 5 Core Commitment (18 pts)

| ID | Story | Points | Priority | Owner | Days |
|----|-------|--------|----------|-------|------|
| **US-040** | **Investment Timeline Display** | **5** | **P1 🟡** | Frontend | Day 1-5 |
| **US-041** | **Explain Compound Growth** | **3** | **P2 🟢** | Frontend | Day 6-8 |
| **US-042** | **Align Withdrawal Strategy Names** | **2** | **P2 🟢** | Full Stack | Day 3 |
| **US-013** | **RRIF Strategy Validation** | **8** | **P1 🟡** | Backend | Day 1-2, 3-4, 6-8 |

**Total Committed**: 18 story points

---

## Story Details

### US-040: Investment Timeline Display [5 pts]

**User Feedback**: rightfooty218@gmail.com - "Doesnt give end date for investments"

**Deliverables**:
- Timeline showing LIRA→LRIF conversion at age 71
- Account depletion dates (RRSP, TFSA, Non-Reg)
- "Your investments last until age X" summary
- Visual Gantt chart or milestone list
- Mobile-responsive design

**Acceptance Criteria**:
- [ ] Show LIRA→LRIF conversion milestone
- [ ] Display depletion dates for each account
- [ ] Summary message about investment lifespan
- [ ] Visual timeline component
- [ ] Mobile-friendly
- [ ] Tooltips for each milestone

**Files to Create**:
- `webapp/components/simulation/InvestmentTimeline.tsx`
- `webapp/lib/timeline-utils.ts`
- `webapp/__tests__/timeline-utils.test.ts`

**Estimated Effort**: 19 hours (2.5 days)

---

### US-041: Explain Compound Growth [3 pts]

**User Feedback**: rightfooty218@gmail.com - "it say imwill have 1000000 complete wrong when I am 90"

**Root Cause**: User confused why balance grew from $303K to $392K despite withdrawals (5% return > withdrawal rate)

**Deliverables**:
- Tooltip explaining growth rate vs withdrawal rate
- Year-by-year "Growth vs. Withdrawals" breakdown
- Visual indicator when growth exceeds withdrawals
- Help text: "Your 5% return exceeds your withdrawals"

**Acceptance Criteria**:
- [ ] Tooltip on final balance
- [ ] Year-by-year breakdown with Growth column
- [ ] Visual badge/icon when growing
- [ ] Mobile-friendly tooltips
- [ ] Summary card: "Why Your Balance Grew"

**Files to Create**:
- `webapp/components/simulation/GrowthExplainerTooltip.tsx`

**Files to Modify**:
- `webapp/app/(dashboard)/simulation/page.tsx`
- `webapp/components/simulation/YearByYearTable.tsx`

**Estimated Effort**: 9 hours (1.5 days)

---

### US-042: Align Withdrawal Strategy Names [2 pts]

**Quick Win**: Ensure consistency between frontend/backend

**Deliverables**:
- Frontend dropdown labels match backend identifiers
- TypeScript enum for strategy types
- No breaking changes

**Acceptance Criteria**:
- [ ] All 4 strategies aligned (income-minimization, tax-efficiency, balanced, legacy-maximization)
- [ ] TypeScript StrategyType enum created
- [ ] Dropdown uses consistent naming
- [ ] All simulations use correct strategy names

**Files to Modify**:
- `webapp/components/simulation/StrategySelector.tsx`
- `webapp/types/simulation.ts`

**Estimated Effort**: 4 hours (0.5 days)

---

### US-013: RRIF Strategy Validation [8 pts]

**Critical**: Ensure RRIF withdrawals comply with CRA minimum withdrawal rules

**Background**:
- RRSP converts to RRIF at age 71 (mandatory)
- RRIF minimum withdrawals: Age 71 = 5.28%, Age 80 = 6.82%, Age 90 = 11.92%, Age 95 = 20.00%
- Simulation must enforce CRA minimums

**Acceptance Criteria**:

**Investigation**:
- [ ] Review current RRIF withdrawal logic
- [ ] Identify if minimums are enforced
- [ ] Check CRA 2025 schedule accuracy
- [ ] Test multiple age scenarios

**Fix** (if needed):
- [ ] Update RRIF calculation to enforce minimums
- [ ] Apply age-based minimum withdrawal rates
- [ ] Allow excess withdrawals for spending needs
- [ ] Handle LIRA→LRIF conversion at age 71

**Testing**:
- [ ] Test age 71 (5.28% minimum)
- [ ] Test age 80 (6.82% minimum)
- [ ] Test age 90 (11.92% minimum)
- [ ] Test age 95 (20.00% minimum)
- [ ] Test spending < minimum withdrawal
- [ ] Test spending > minimum withdrawal

**Files to Review**:
- `juan-retirement-app/modules/simulation.py`
- `juan-retirement-app/modules/withdrawal.py`
- `juan-retirement-app/modules/models.py`

**Files to Create**:
- `juan-retirement-app/test_rrif_minimums.py`
- `RRIF_VALIDATION_REPORT.md`

**Estimated Effort**: 24 hours (3 days distributed)

---

## Stretch Goals (8 pts) - If Capacity Allows

| ID | Story | Points | Priority | Reason Stretch |
|----|-------|--------|----------|----------------|
| US-043 | Mobile: Change Withdrawal Strategy | 3 | P2 🟢 | Nice-to-have, not blocking |
| US-027 | Educational Guidance - Withdrawal Order | 5 | P1 🟡 | Lower urgency, educational |

---

## Deferred to Sprint 6+

| ID | Story | Points | Priority | Reason Deferred |
|----|-------|--------|----------|-----------------|
| US-044 | Fix Cash Flow Gap Detection | 5 | P0 🔴 | Requires investigation, awaiting user response |
| US-039 | Pension Start Date Configuration | 5 | P1 🟡 | Lower priority than user feedback |
| US-003 | Database Migration - Pension Indexing | 8 | P1 🟡 | Already functional, can wait |
| US-021 | Configurable Investment Yields | 8 | P1 🟡 | Lower priority than accuracy fixes |

---

## Sprint Metrics & Goals

### Burndown Target

| Day | Completed | Remaining | Key Milestones |
|-----|-----------|-----------|----------------|
| Day 0 (Jan 30) | 0 pts | 18 pts | Sprint planning |
| Day 3 (Feb 2) | 2 pts | 16 pts | US-042 complete |
| Day 5 (Feb 4) | 7 pts | 11 pts | US-040 complete |
| Day 8 (Feb 7) | 10 pts | 8 pts | US-041 complete |
| Day 9 (Feb 8) | 18 pts | 0 pts | US-013 complete - **SPRINT COMPLETE** |

### Success Criteria

**Minimum Success** (60% = 11 pts):
- ✅ US-040 completed (5 pts)
- ✅ US-041 completed (3 pts)
- ✅ US-042 completed (2 pts)
- ✅ US-013 investigation complete (1 pt)

**Full Success** (100% = 18 pts):
- ✅ All 4 stories completed
- ✅ rightfooty218@gmail.com re-engaged (responds positively)

**Stretch Success** (>100% = 21-26 pts):
- ✅ All 18 pts + US-043 (3 pts) or US-027 (5 pts)
- ✅ User satisfaction improves (feedback scores >3/5)

---

## Risks & Mitigation

### Risk #1: RRIF Validation Complexity (US-013)

**Probability**: Medium
**Impact**: High (8 pts = 44% of sprint)

**Mitigation**:
- Front-load investigation (Day 1-2)
- Daily check-ins on progress
- Pivot plan: If blocked by Day 5, defer to Sprint 6 and pull in US-043 (3 pts)

### Risk #2: User Feedback Dependency

**Probability**: Medium
**Impact**: Low

**Mitigation**:
- Implement based on backend simulation analysis
- Test with user's exact data (already have from database)
- Send follow-up email after deployment

### Risk #3: Scope Creep

**Probability**: Low
**Impact**: Medium

**Mitigation**:
- Stick to MVP implementation
- Use simple visual designs
- Defer enhancements to backlog

---

## Sprint Health: 🟢 HEALTHY

| Metric | Status | Notes |
|--------|--------|-------|
| **Scope Stability** | 🟢 STABLE | 18 pts committed, clear priorities |
| **Blocker Risk** | 🟢 LOW | No known blockers |
| **Team Capacity** | 🟢 HEALTHY | Conservative 60% |
| **Dependencies** | 🟢 CLEAR | Stories are independent |
| **Technical Risk** | 🟡 MODERATE | US-013 may be complex |

**Overall**: Well-planned sprint with user-driven priorities

---

## Velocity Analysis

### Historical Velocity

| Sprint | Committed | Delivered | Completion | Duration |
|--------|-----------|-----------|------------|----------|
| Sprint 1 | 31 pts | 31 pts | 100% (Day 1) | 2 weeks |
| Sprint 2 | 20 pts | 21 pts | 105% | 2 weeks |
| Sprint 3 | 27 pts | 0 pts | 0% (pivoted) | 2 weeks |
| Sprint 4 | 9 pts | 9 pts | 100% (Day 1) | 1 week |

**Average Delivered** (excluding Sprint 3): 20 pts/sprint
**Sprint 5 Target**: 18 pts (conservative, allows buffer)

---

## Definition of Done

### Story-Level DoD
- [ ] All acceptance criteria met
- [ ] Code reviewed
- [ ] TypeScript compilation: 0 errors
- [ ] ESLint warnings: 0
- [ ] Manual testing completed
- [ ] Deployed to production
- [ ] Documentation updated
- [ ] AGILE_BACKLOG.md updated

### Sprint-Level DoD
- [ ] All 18 pts completed
- [ ] Production deployment successful
- [ ] User feedback addressed (US-040, US-041)
- [ ] RRIF validation documented
- [ ] Sprint retrospective completed
- [ ] Sprint 6 planning initiated

---

## Next Steps

1. ✅ **Sprint 5 Board Created** - [SPRINT_5_BOARD.md](SPRINT_5_BOARD.md)
2. ✅ **Backlog Updated** - Sprint 5 stories marked
3. ⏳ **Sprint Kickoff** - January 31, 2026
4. 📅 **Daily Standups** - 9:00 AM EST
5. 📅 **Sprint Review** - February 9, 2026
6. 📅 **Sprint Retrospective** - February 9, 2026

---

**Created**: January 30, 2026
**Sprint Start**: January 31, 2026
**Sprint End**: February 13, 2026
**Sprint Board**: [SPRINT_5_BOARD.md](SPRINT_5_BOARD.md)
**Product Backlog**: [AGILE_BACKLOG.md](AGILE_BACKLOG.md)
