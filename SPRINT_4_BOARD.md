# Sprint 4 Board - RetireZest

**Sprint**: Sprint 4
**Duration**: February 13-19, 2026 (1 week / 5 days)
**Sprint Goal**: Complete Sprint 3 carryovers - Fix critical income timing bug and unblock onboarding
**Team Capacity**: 9 story points (conservative 60% capacity for 1-week sprint)
**Status**: 🟡 PLANNED

---

## 📋 Sprint Overview

### Why 1-Week Sprint?

Sprint 4 is a **focused 1-week sprint** to complete high-priority carryovers from Sprint 3:
- Sprint 3 ended with 0% completion (all work pivoted to ad-hoc GIC feature)
- Critical user issue (US-038) needs resolution
- 1-week sprint allows rapid iteration and course correction
- Conservative 60% capacity (9 pts) ensures realistic commitment

### Sprint 3 Context

**Sprint 3 Outcome** (Jan 30 - Feb 12, 2026):
- **Committed**: 16 pts core + 11 pts stretch = 27 pts total
- **Completed**: 0 pts (0%)
- **Ad-Hoc Work**: 8 pts (GIC Maturity Tracking - outside sprint scope)
- **Reason**: Critical user feedback (1/5 satisfaction) required immediate response
- **Carryovers**: US-038 (8 pts), US-009 (1 pt), US-039 (5 pts)

**Key Learning**: Balance sprint commitments with urgent user needs

---

## 🎯 Sprint 4 Commitment

### Core Stories (9 pts)

| ID | Story | Points | Priority | Status | Owner |
|----|-------|--------|----------|--------|-------|
| **US-038** | **Fix CPP/OAS Income Timing Bug** | **8** | **P0 🔴** | **📋 To Do** | Dev Team |
| **US-009** | **Skip Real Estate Step in Onboarding** | **1** | **P2 🟢** | **📋 To Do** | Dev Team |

**Total Committed**: 9 story points

### Deferred to Sprint 5

| ID | Story | Points | Priority | Reason Deferred |
|----|-------|--------|----------|-----------------|
| US-039 | Pension Start Date Configuration | 5 | P1 🟡 | Capacity constraint (9 + 5 = 14 > 9 pts) |
| US-013 | RRIF Strategy Validation | 8 | P1 🟡 | Stretch goal, better for 2-week sprint |
| US-003 | Pension Indexing Backend | 3 | P1 🟡 | Low priority, defer to later sprint |

---

## 🚨 Known Risks

### Risk #1: US-038 Blocked on User Response

**Problem**:
- US-038 requires user clarification ("pics come due" unclear)
- Email sent Jan 29, 2026 - no response yet
- 8 pts = 89% of sprint capacity

**Mitigation Strategy**:

**Day 1 (Feb 13)**:
- ✅ Check email for user response
- ✅ If response received: Proceed with user-confirmed fix

**Day 2 (Feb 14) - Fallback Activated**:
- ⚠️ If NO response by Day 2 morning:
  - Execute fallback: Query user simulation data
  - Reproduce issue with user's exact inputs
  - Investigate CPP/OAS timing logic in simulation.py
  - Fix based on investigation (not user confirmation)

**Day 3 (Feb 15) - Pivot Plan**:
- 🔄 If US-038 still blocked or cannot be resolved:
  - **Pivot**: Move US-038 back to backlog
  - **Alternative Plan**:
    - ✅ Complete US-009 (1 pt)
    - ✅ Add US-042: Strategy Name Alignment (2 pts)
    - ✅ Add US-043: Mobile Strategy Switching (3 pts)
    - Total: 6 pts (still under capacity)

**Risk Level**: 🔴 HIGH

---

## 📊 Kanban Board

### 📋 To Do (9 pts)

---

#### US-038: Fix CPP/OAS Income Timing Bug [8 pts] 🔴 P0 CRITICAL

**Status**: ⏸️ **BLOCKED** - Waiting for user response

**Priority**: P0 (Critical)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 100% of users with CPP/OAS

**Blocker Details**:
- Email sent to user (rightfooty218@gmail.com) on Jan 29, 2026
- Clarification needed: What does "pics come due" refer to?
  - Option A: CPP/OAS income timing
  - Option B: Pension start dates
  - Option C: GIC maturity events (already fixed)
- Awaiting user response

**User Feedback** (Jan 29, 2026):
- **Satisfaction Score**: 1/5 (lowest possible)
- **Comment**: "This by far the worst even worse than ai. It diesnt take it to account when pics come due sucks"
- **Email Status**: Sent clarification request, no response yet

**Acceptance Criteria**:

**Investigation Phase** (Day 1):
- [ ] Check for user response to clarification email
- [ ] If no response: Query user's simulation data from database
- [ ] Review user's CPP/OAS start age settings
- [ ] Reproduce bug with user's exact inputs
- [ ] Identify root cause in simulation engine
- [ ] Document expected vs actual behavior

**Fix Phase** (Day 1-2):
- [ ] CPP income starts at correct age (user-selected, default 65)
- [ ] CPP reduction applied correctly (0.6%/month before 65, max 36%)
- [ ] CPP increase applied correctly (0.7%/month after 65, max 42%)
- [ ] No CPP income before selected start age
- [ ] OAS income starts at correct age (65-70 only)
- [ ] OAS deferral bonus applied correctly (0.6%/month, max 36%)
- [ ] No OAS income before age 65 or selected start age
- [ ] Year-by-year table shows $0 before start ages

**Testing Phase** (Day 2):
- [ ] Test CPP at age 60, 65, 70
- [ ] Test OAS at age 65, 70
- [ ] Test early retirement (before CPP/OAS start)
- [ ] Verify health score calculations with corrected timing
- [ ] Re-run user's exact scenario and compare results

**User Validation** (Day 3):
- [ ] Deploy fix to production
- [ ] Notify user of fix
- [ ] Request re-testing and feedback
- [ ] Monitor satisfaction score improvement

**Tasks Breakdown**:

**Day 1** (8 hours):
- [ ] Morning: Check email for user response (30 min)
- [ ] If no response: Execute fallback plan
  - [ ] Query user simulation data (2 hours)
  ```sql
  SELECT * FROM Scenario
  WHERE userId = (SELECT id FROM User WHERE email = 'rightfooty218@gmail.com');
  ```
  - [ ] Review CPP/OAS settings in user profile (1 hour)
  - [ ] Reproduce bug with same inputs (2 hours)
  - [ ] Identify root cause in simulation.py (2.5 hours)

**Day 2** (8 hours):
- [ ] Fix CPP timing logic in Python backend (4 hours)
- [ ] Fix OAS timing logic in Python backend (2 hours)
- [ ] Test with multiple age scenarios (2 hours)
  - Age 60 CPP, Age 65 OAS
  - Age 65 CPP, Age 70 OAS
  - Age 70 CPP, Age 65 OAS

**Day 3** (2 hours):
- [ ] Deploy fix to production (1 hour)
- [ ] Create user notification email (30 min)
- [ ] Update AGILE_BACKLOG.md (30 min)

**Files to Modify**:
- `juan-retirement-app/modules/simulation.py` (CPP/OAS timing logic)
- `juan-retirement-app/modules/government_benefits.py` (if exists)
- Test scripts for validation

**Estimated Effort**: 2.5 days (18 hours - slightly over 2 days due to investigation)
**Assigned Days**: Day 1-3 (Feb 13-15)

---

#### US-009: Skip Real Estate Step in Onboarding [1 pt] 🟢 P2

**Status**: ✅ READY TO WORK

**Priority**: P2 (Medium)
**Epic**: Epic 4: UX Improvements & Features
**User Impact**: 12 users blocked at Step 6 (86% onboarding complete)

**Why This Story**:
- **Quick win**: Only 1 pt (recalculated from 3 pts for 1-week sprint)
- **High ROI**: Unblocks 12 users immediately
- **Low risk**: Clear scope, no dependencies
- **Sprint 2 learning**: Small stories have 100% success rate

**User Story**:
As a user, I want to skip the real estate step in onboarding so that I can complete my profile quickly if I don't own real estate.

**Acceptance Criteria**:
- [ ] "Skip for now" button added to Step 6 (Real Estate)
- [ ] Button styled consistently with existing UI
- [ ] Clicking "Skip" advances to Step 7 without saving data
- [ ] User can return to Step 6 later via Settings → Profile
- [ ] Profile completion shows 100% even if real estate skipped
- [ ] Help text: "You can add real estate later in Settings"
- [ ] Mobile-responsive button (tested on iPhone, Android)
- [ ] No console errors when skipping
- [ ] Analytics event tracked: "onboarding_real_estate_skipped"
- [ ] Zero TypeScript compilation errors
- [ ] Zero ESLint warnings

**Tasks Breakdown**:

**Day 3 or 4** (6 hours):
- [ ] Add "Skip for now" button to RealEstateForm component (2 hours)
- [ ] Update wizard navigation logic to handle skip (1 hour)
- [ ] Update profile completion calculation (if needed) (1 hour)
- [ ] Add help text below skip button (30 min)
- [ ] Test on mobile devices (iPhone, Android) (1 hour)
- [ ] Add analytics event tracking (30 min)
- [ ] Manual testing with 3 test users (1 hour)
- [ ] Deploy to production (30 min)
- [ ] Update AGILE_BACKLOG.md (15 min)

**Files to Modify**:
- `webapp/app/(onboarding)/wizard/page.tsx` (main wizard logic)
- `webapp/components/wizard/RealEstateForm.tsx` (add skip button)
- `webapp/lib/wizard-utils.ts` (update completion calculation, if needed)
- `webapp/lib/analytics.ts` (add event tracking)

**Technical Implementation**:
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

**Estimated Effort**: 6 hours
**Assigned Days**: Day 3 or Day 4 (Feb 15 or Feb 16)
**Dependencies**: None
**Risk**: 🟢 LOW

---

## 🔄 In Progress (0 pts)

*No stories in progress yet. Sprint starts Feb 13.*

---

## ✅ Done (0 pts)

*No stories completed yet. Sprint starts Feb 13.*

---

## 📈 Sprint Metrics

### Burndown Tracking

| Day | Date | Completed | Remaining | Daily Notes |
|-----|------|-----------|-----------|-------------|
| Day 0 | Feb 12 | 0 pts | 9 pts | Sprint planning complete |
| Day 1 | Feb 13 | 0 pts | 9 pts | US-038 investigation started |
| Day 2 | Feb 14 | 0 pts | 9 pts | US-038 fix implementation |
| Day 3 | Feb 15 | 8 pts | 1 pt | US-038 deployed, US-009 started |
| Day 4 | Feb 16 | 9 pts | 0 pts | US-009 completed ✅ |
| Day 5 | Feb 17 | 9 pts | 0 pts | Sprint review & retrospective |

**Target**: Complete 9 pts by Day 4 (Feb 16)

### Velocity

**Sprint 3 Velocity**: 0 pts (ad-hoc work: 8 pts outside sprint)
**Sprint 4 Target**: 9 pts (100% of commitment)
**Sprint 4 Stretch**: 10-12 pts (if US-042 or US-043 added)

---

## 🎯 Sprint Goal Success Criteria

### Minimum Success (60% = 5-6 pts)
- ✅ US-009 completed and deployed (1 pt)
- ✅ US-038 investigation complete, root cause identified (partial credit)

### Full Success (100% = 9 pts)
- ✅ US-038 fully completed, fix deployed, user notified (8 pts)
- ✅ US-009 fully completed and deployed (1 pt)
- ✅ User satisfaction improves from 1/5 to 3+/5

### Stretch Success (>100% = 10-12 pts)
- ✅ US-038 completed (8 pts)
- ✅ US-009 completed (1 pt)
- ✅ US-042 or US-043 started (2-3 pts partial credit)
- ✅ Sprint 3 retrospective finalized

---

## 📅 Daily Standup Template

### Daily Standup Questions

1. **What did I complete yesterday?**
2. **What am I working on today?**
3. **What blockers do I have?**

### Standup Schedule

**Time**: 9:00 AM EST daily
**Duration**: 15 minutes max
**Focus**: Unblock US-038, track progress

---

## 🔄 Mid-Sprint Check-In (Day 2.5 - Feb 14 afternoon)

**Purpose**: Assess US-038 progress and decide pivot if needed

**Check-In Questions**:
1. Has user responded to clarification email?
2. If no response, has fallback plan been executed?
3. Is US-038 root cause identified?
4. Is US-038 on track to complete by Day 3?
5. Do we need to pivot to US-042 + US-043?

**Decision Point**:
- ✅ If US-038 on track → Continue
- 🔄 If US-038 blocked → Pivot to alternative stories

---

## 📝 Sprint Retrospective (Day 5 - Feb 17)

### Retrospective Agenda

1. **What went well?**
2. **What didn't go well?**
3. **What did we learn?**
4. **Action items for Sprint 5**

### Focus Areas

- US-038 blocker resolution effectiveness
- 1-week sprint vs 2-week sprint effectiveness
- Sprint 3 → Sprint 4 carryover process
- Balancing sprint commitments with ad-hoc work

---

## 🎯 Definition of Done

### Story-Level DoD

- [ ] All acceptance criteria met
- [ ] Code reviewed (self-review minimum)
- [ ] TypeScript compilation passes (0 errors)
- [ ] ESLint warnings addressed (0 warnings preferred)
- [ ] Manual testing completed
- [ ] Deployed to production
- [ ] User documentation updated (if needed)
- [ ] AGILE_BACKLOG.md updated (story marked ✅ Done)

### Sprint-Level DoD

- [ ] All committed stories completed (9 pts)
- [ ] Production deployment successful
- [ ] User feedback collected (US-038)
- [ ] Sprint retrospective completed
- [ ] Sprint 5 planning initiated

---

## 📊 Sprint Health Dashboard

### Current Sprint Health: 🟡 MODERATE RISK

| Metric | Status | Notes |
|--------|--------|-------|
| **Scope Stability** | 🟢 STABLE | 9 pts committed, no changes |
| **Blocker Risk** | 🔴 HIGH | US-038 blocked on user response |
| **Team Capacity** | 🟢 HEALTHY | Conservative 60% capacity |
| **Dependencies** | 🟢 CLEAR | US-009 has no dependencies |
| **Technical Risk** | 🟡 MODERATE | US-038 requires investigation |

**Overall Assessment**: Sprint is at moderate risk due to US-038 blocker. Fallback and pivot plans in place.

---

## 🔗 Related Documents

- [SPRINT_3_BOARD_REVISED.md](SPRINT_3_BOARD_REVISED.md) - Previous sprint
- [SPRINT_3_RETROSPECTIVE.md](SPRINT_3_RETROSPECTIVE.md) - Sprint 3 learnings
- [AGILE_BACKLOG.md](AGILE_BACKLOG.md) - Product backlog
- [SPRINT_3_GIC_COMPLETION_UPDATE.md](SPRINT_3_GIC_COMPLETION_UPDATE.md) - Ad-hoc work context

---

## 📋 Action Items (AI-3.x Implementation)

Sprint 4 implements Sprint 3 Retrospective Action Items:

| Action Item | Status | Sprint 4 Implementation |
|-------------|--------|-------------------------|
| **AI-3.1** | 🔄 IN PROGRESS | Sprint Pivot Protocol tested with US-038 blocker |
| **AI-3.4** | ✅ COMPLETE | Fallback process for US-038 blocker documented |
| **AI-3.5** | 📋 PLANNED | Mid-sprint check-in scheduled (Day 2.5) |
| **AI-3.7** | 🔄 IN PROGRESS | Daily sprint board updates committed |

---

**Document Created**: January 30, 2026
**Sprint Start**: February 13, 2026
**Sprint End**: February 19, 2026
**Next Sprint Planning**: February 20, 2026
