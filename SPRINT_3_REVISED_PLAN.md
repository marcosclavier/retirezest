# Sprint 3 Revised Plan - RetireZest

**Date**: January 29, 2026
**Sprint Duration**: January 30 - February 12, 2026 (2 weeks)
**Status**: ✅ REVISED to align with backlog and Sprint 2 retrospective

---

## 🚨 Critical Changes from Original Plan

### Why We're Revising Sprint 3

**New Critical User Feedback Received (Jan 29, 2026)**:
- User rightfooty218@gmail.com gave 1/5 satisfaction score
- Reported: "It doesn't take it to account when pics come due"
- Created US-038 (P0, 8 pts) and US-039 (P1, 5 pts)
- **This is a simulation accuracy bug affecting all users**

**Sprint 2 Retrospective Learnings**:
- Conservative planning (60% capacity = 18 pts) works better
- Pre-sprint verification prevents duplicate work
- Small stories (1-3 pts) have 100% success rate
- Update backlog immediately when stories complete

**Original Sprint 3 Plan Issues**:
- Included US-022 (already complete - commit 2487294)
- Did not include US-038 (P0 critical from user feedback)
- Did not include US-039 (P1 related to user feedback)
- 22 pts committed (too aggressive based on Sprint 2 learnings)

---

## 🎯 Revised Sprint Goal

**Original Goal**:
"Improve onboarding UX and validate simulation accuracy while establishing reliable sprint processes"

**Revised Goal**:
**"Fix critical income timing bug, improve onboarding UX, and validate simulation accuracy based on user feedback"**

### Success Criteria

**Must Have (P0/P1)**:
1. ✅ User's income timing issue investigated and root cause identified (US-038)
2. ✅ Fix deployed if CPP/OAS timing issue confirmed (US-038)
3. ✅ Pension start date feature implemented if "pics" = pensions (US-039)
4. ✅ 12 users unblocked from onboarding Step 6 (US-009)

**Stretch Goals**:
5. ✅ RRIF strategies validated against CRA rules (US-013)
6. ✅ Pension indexing backend complete (US-003)

**Process Goals**:
7. ✅ Pre-sprint verification completed (AI-2.3)
8. ✅ Backlog updated immediately when stories complete (AI-2.2)
9. ✅ Sprint retrospective documents learnings

---

## 📊 Story Prioritization Analysis

### P0 Stories (Critical - Must Fix)

| ID | Story | Points | Reason | User Impact |
|----|-------|--------|--------|-------------|
| **US-038** | Income Timing Bug | 8 | User feedback: 1/5 satisfaction, simulation accuracy bug | 100% of users with CPP/OAS |

**Decision**: US-038 is P0 critical and MUST be in Sprint 3 core scope.

### P1 Stories (High Priority)

| ID | Story | Points | Reason | User Impact |
|----|-------|--------|--------|-------------|
| **US-039** | Pension Start Dates | 5 | Related to US-038, may be same issue | 30-40% of users with pensions |
| **US-013** | RRIF Validation | 8 | Simulation accuracy, affects 60% of users | High accuracy risk |
| **US-003** | Pension Indexing Backend | 8 | Frontend already done, complete the feature | Blocks pension accuracy |

### P2 Stories (Medium Priority)

| ID | Story | Points | Reason | User Impact |
|----|-------|--------|--------|-------------|
| **US-009** | Skip Real Estate Step | 3 | Quick UX win, 12 users blocked | Onboarding completion |

---

## 🗓️ Revised Sprint Commitment

### Core Stories (16 pts) - MUST COMPLETE

These stories are committed and must be completed by end of sprint.

#### 1. US-038: Fix Income Timing Bug (Investigation + Fix) [8 pts] 🔴 P0
**Owner**: Development Team
**Priority**: P0 (Critical)
**Epic**: Epic 4: UX Improvements

**Why This Story?**
- **P0 Critical**: User gave 1/5 satisfaction, reported simulation doesn't account for income timing
- **User feedback driven**: Directly addresses user complaint (rightfooty218@gmail.com)
- **High impact**: Affects 100% of users with CPP/OAS
- **Must investigate first**: Need to confirm if "pics" = CPP/OAS or pensions

**Acceptance Criteria**:
- [ ] User's simulation data queried and reviewed
- [ ] Root cause identified (CPP/OAS timing vs pension timing)
- [ ] If CPP/OAS: Fix income timing logic in simulation engine
- [ ] If pensions: Implement US-039 instead
- [ ] User notified of fix and asked to re-test
- [ ] Satisfaction score improved

**Tasks**:
- [ ] Query rightfooty218@gmail.com's simulation history
- [ ] Review CPP/OAS start age settings
- [ ] Check if CPP/OAS income starts at correct age
- [ ] Reproduce bug with same inputs
- [ ] Identify root cause in simulation.py
- [ ] Fix income timing logic
- [ ] Test with multiple age scenarios
- [ ] Deploy fix to production
- [ ] Follow up with user

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do
**Blocker**: Waiting for user response to clarification email

---

#### 2. US-009: Skip Real Estate Step in Onboarding [3 pts] 🟢 P2
**Owner**: Development Team
**Priority**: P2 (Medium)
**Epic**: Epic 4: UX Improvements

**Why This Story?**
- **Quick win**: Only 3 pts, high ROI
- **User impact**: 12 users stuck at Step 6 (86% complete)
- **Easy implementation**: Simple skip button, no complex logic
- **High completion likelihood**: Small story, clear scope

**Acceptance Criteria**:
- [ ] "Skip for now" button added to Step 6 (Real Estate)
- [ ] Clicking "Skip" advances to Step 7
- [ ] Profile completion shows 100% even if skipped
- [ ] Help text explains skipping
- [ ] Mobile-responsive design
- [ ] Analytics event tracked

**Tasks**:
- [ ] Add skip button to RealEstateForm component
- [ ] Update wizard navigation logic
- [ ] Update profile completion calculation
- [ ] Add help text
- [ ] Test on mobile devices
- [ ] Add analytics tracking
- [ ] Manual testing with 3 users

**Estimated Effort**: 6 hours
**Status**: 📋 To Do

---

#### 3. US-039: Pension Start Date Configuration [5 pts] 🟡 P1
**Owner**: Development Team
**Priority**: P1 (High)
**Epic**: Epic 4: UX Improvements

**Why This Story?**
- **Related to US-038**: If "pics" = pensions, this solves the issue
- **Medium priority**: P1, affects 30-40% of users
- **Complements investigation**: Can implement while investigating US-038
- **Clear scope**: Well-defined 5-pt story

**Acceptance Criteria**:
- [ ] Pension data model includes `startAge` field
- [ ] Pension input form asks "When will pension start?"
- [ ] Simulation shows $0 pension before start age
- [ ] Simulation shows full pension starting from start age
- [ ] Inflation indexing works correctly
- [ ] Edge cases tested (already started, future pension)

**Tasks**:
- [ ] Update Prisma schema (add startAge field)
- [ ] Create database migration
- [ ] Update pension API routes
- [ ] Update Python backend (simulation.py)
- [ ] Add pension start age to input form
- [ ] Update TypeScript types
- [ ] Test with multiple scenarios
- [ ] Update documentation

**Estimated Effort**: 1 day (8 hours)
**Status**: 📋 To Do
**Dependency**: May be prioritized based on US-038 investigation results

---

### Stretch Goals (11 pts) - IF TIME ALLOWS

These stories are stretch goals. Complete if time permits.

#### 4. US-013: RRIF Strategy Validation [8 pts] 🟡 P1
**Owner**: Development Team
**Priority**: P1 (High)
**Epic**: Epic 5: Simulation Accuracy

**Why Stretch?**
- High value but not critical this sprint
- Takes 2 days (most of sprint)
- Better suited for dedicated focus in Sprint 4

**Acceptance Criteria**:
- [ ] RRIF minimum percentages match CRA 2026
- [ ] All RRIF strategies tested
- [ ] Edge cases validated
- [ ] Automated test suite created
- [ ] Validation report documented

**Estimated Effort**: 2 days (16 hours)
**Status**: 📋 To Do (Stretch)

---

#### 5. US-003: Pension Indexing Backend [3 pts] 🟡 P1
**Owner**: Development Team
**Priority**: P1 (High)
**Epic**: Epic 1: User Retention

**Why Stretch?**
- Frontend already done (commit 997c924)
- Backend persistence straightforward
- Can complete in 6 hours if time allows

**Acceptance Criteria**:
- [ ] Prisma schema updated with inflationIndexed field
- [ ] Migration runs successfully
- [ ] API routes save/retrieve inflationIndexed
- [ ] Existing pensions default to true

**Estimated Effort**: 6 hours
**Status**: 📋 To Do (Stretch)

---

## 📈 Sprint Metrics

### Capacity Planning

| Metric | Value | Rationale |
|--------|-------|-----------|
| **Team Capacity** | 30 pts/sprint | Based on Sprint 1 (31 pts) and Sprint 2 (16 pts) |
| **Conservative Target (60%)** | 18 pts | Sprint 2 retrospective recommendation |
| **Core Commitment** | 16 pts | US-038 (8) + US-009 (3) + US-039 (5) |
| **Stretch Goals** | 11 pts | US-013 (8) + US-003 (3) |
| **Total Planned** | 27 pts | Core (16) + Stretch (11) |

### Story Size Distribution

| Size | Count | Stories |
|------|-------|---------|
| **3 pts** | 2 | US-009, US-003 (stretch) |
| **5 pts** | 1 | US-039 |
| **8 pts** | 2 | US-038, US-013 (stretch) |

**Analysis**: Good mix of small (3 pts) and medium (5-8 pts) stories. No large stories (13+ pts).

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **US-038 investigation takes longer than expected** | Medium | High | User already contacted for clarification; can pivot to US-039 if "pics" = pensions |
| **User doesn't respond to email** | Medium | Medium | Investigate based on simulation data; assume CPP/OAS issue |
| **Scope creep on US-038** | Low | High | Clear acceptance criteria; timebox investigation to 1 day |
| **Stretch goals not completed** | High | Low | Acceptable; stretch goals for Sprint 4 if not done |

---

## 🔄 Alignment with Retrospective Learnings

### Sprint 2 Retrospective: Key Learnings Applied

#### AI-2.1: Git History Check ✅
**Applied**: Pre-sprint verification completed (SPRINT_3_PRE_PLANNING_VERIFICATION.md)
- Confirmed US-022 already complete (not in Sprint 3)
- Confirmed US-009, US-013, US-039 not started (valid candidates)

#### AI-2.2: Update Backlog Immediately ✅
**Commitment**: Update AGILE_BACKLOG.md immediately when stories complete
- US-038: Update when investigation complete and fix deployed
- US-009: Update when skip button deployed
- US-039: Update when pension start date feature deployed

#### AI-2.3: Pre-Sprint Verification ✅
**Applied**: SPRINT_3_PRE_PLANNING_VERIFICATION.md created
- Verified 10 candidate stories
- Identified 2 already complete (US-022, US-024)
- Identified 2 new critical stories (US-038, US-039)

#### Conservative Planning (60% Capacity) ✅
**Applied**: Core commitment is 16 pts (53% of 30 pts capacity)
- Below 60% target for safety margin
- Stretch goals add 11 pts if time allows

#### Small Story Preference ✅
**Applied**: 2 of 3 core stories are ≤5 pts
- US-009: 3 pts (small, high success rate)
- US-039: 5 pts (medium, clear scope)
- US-038: 8 pts (critical, must do despite size)

---

## 📋 Sprint Execution Plan

### Week 1: Investigation + Quick Wins (Jan 30 - Feb 5)

**Day 1-2 (Jan 30-31): US-038 Investigation**
- Query user simulation data
- Identify root cause (CPP/OAS vs pension timing)
- Reproduce bug
- Document findings
- Plan fix

**Day 3 (Feb 3): US-009 Implementation**
- Add skip button to real estate form
- Test skip functionality
- Deploy to production
- ✅ Update backlog (AI-2.2)

**Day 4-5 (Feb 4-5): US-038 Fix or US-039 Implementation**
- If "pics" = CPP/OAS: Fix income timing in simulation.py
- If "pics" = pensions: Implement US-039 (pension start dates)
- Test thoroughly
- Deploy fix
- Follow up with user

### Week 2: Validation + Stretch Goals (Feb 6-12)

**Day 6-7 (Feb 6-9): US-039 Completion (if not done Week 1)**
- Complete pension start date implementation
- Test edge cases
- Deploy to production
- ✅ Update backlog (AI-2.2)

**Day 8-10 (Feb 10-12): Stretch Goals**
- If time allows: US-013 (RRIF Validation) or US-003 (Pension Indexing)
- Prioritize based on team energy and remaining capacity
- Don't force completion - defer to Sprint 4 if needed

---

## 🎯 Definition of Done

### Story-Level DoD

For each story to be considered "Done":

- [ ] All acceptance criteria met
- [ ] Code committed to version control
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Deployed to production
- [ ] **AGILE_BACKLOG.md updated with completion status (AI-2.2)**
- [ ] Completion report created (if >5 pts)

### Sprint-Level DoD

For Sprint 3 to be considered "Done":

- [ ] Core stories (16 pts) completed
- [ ] User satisfaction improved (US-038 follow-up)
- [ ] 12 users unblocked from onboarding (US-009)
- [ ] Sprint retrospective completed
- [ ] Sprint 4 planning prepared

---

## 📊 Success Metrics

### Sprint Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Core Stories Completed** | 100% (16 pts) | US-038, US-009, US-039 all done |
| **User Satisfaction** | >3/5 | Follow-up with rightfooty218@gmail.com |
| **Onboarding Completion** | +12 users | Users advance past Step 6 |
| **Stretch Goals** | >50% (6+ pts) | US-013 or US-003 completed |
| **Backlog Updated** | 100% | AI-2.2 enforced for all stories |

### User Impact Metrics

| Story | Users Affected | Expected Outcome |
|-------|----------------|------------------|
| **US-038** | 100% (CPP/OAS users) | Accurate income timing, improved satisfaction |
| **US-009** | 12 users (blocked) | Onboarding completion to 100% |
| **US-039** | 30-40% (pension users) | Accurate pension timing, improved projections |

---

## 🔄 Deferred from Original Sprint 3 Plan

These stories were in the original Sprint 3 plan but are deferred:

| ID | Story | Points | Reason for Deferral |
|----|-------|--------|---------------------|
| **US-022** | What-If Slider Testing | 5 | Already complete (commit 2487294) |
| **AI-2.7** | E2E Test for Withdrawal Strategy | 3 | Lower priority than user feedback issues |
| **US-013** | RRIF Strategy Validation | 8 | Moved to stretch goal (not critical this sprint) |
| **US-003** | Pension Indexing Backend | 8 | Moved to stretch goal (can wait) |

**Note**: US-013 and US-003 are still in Sprint 3 as stretch goals, but not core commitments.

---

## 🚀 Sprint 4 Planning Preview

Based on Sprint 3 scope, here's what Sprint 4 might focus on:

**If US-013 not completed in Sprint 3**:
- US-013: RRIF Strategy Validation [8 pts] (deferred from Sprint 3)

**If US-003 not completed in Sprint 3**:
- US-003: Pension Indexing Backend [3 pts] (deferred from Sprint 3)

**Other High-Priority Stories**:
- US-021: Configurable Investment Yields [8 pts] (user-requested)
- US-027: Educational Guidance [5 pts] (needs content development)
- AI-2.7: E2E Test for Withdrawal Strategy [3 pts] (prevent regressions)

**Epic 4 (UX) Continues**:
- US-028: Comprehensive Help Section [8 pts]
- US-027: Educational Guidance [5 pts]

---

## 📝 Communication Plan

### Stakeholder Updates

**Daily Standup** (15 minutes):
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

**Mid-Sprint Check-in** (Feb 5):
- Review progress on US-038 investigation
- Confirm US-009 completion
- Adjust Sprint 3 scope if needed

**Sprint Review** (Feb 12):
- Demo US-038 fix to stakeholders
- Demo US-009 skip button
- Demo US-039 pension start dates (if complete)
- Show user satisfaction improvement

**Sprint Retrospective** (Feb 12):
- What went well?
- What could be improved?
- Action items for Sprint 4

### User Communication

**User rightfooty218@gmail.com**:
- ✅ Email sent (Jan 29) asking for clarification on "pics"
- Follow-up after US-038 investigation (Feb 3-5)
- Show corrected results after fix deployed (Feb 10-12)
- Request feedback on accuracy

**12 Users Blocked at Step 6**:
- No communication needed (passive unblock)
- Monitor analytics for onboarding completion increase

---

## 🎓 Lessons from Sprint 2 Applied

### What We Learned

1. **Conservative planning works**: 60% capacity = better quality
2. **Pre-sprint verification saves time**: Git history check prevents duplicate work
3. **Small stories succeed**: 1-3 pt stories have 100% completion rate
4. **Update backlog immediately**: Prevents confusion in future sprints
5. **User feedback is critical**: P0 issues must be prioritized immediately

### How We Applied It

1. ✅ **Conservative planning**: 16 pts core (53% capacity) instead of 22 pts (73%)
2. ✅ **Pre-sprint verification**: SPRINT_3_PRE_PLANNING_VERIFICATION.md created
3. ✅ **Small stories**: US-009 (3 pts) and US-003 (3 pts) in plan
4. ✅ **Update backlog commitment**: AI-2.2 enforced for all stories
5. ✅ **User feedback prioritized**: US-038 (P0) is core commitment

---

## 📅 Sprint 3 Timeline

```
Week 1: Investigation + Quick Wins
├─ Day 1-2: US-038 Investigation (rightfooty218@gmail.com)
├─ Day 3:   US-009 Implementation (Skip Real Estate)
└─ Day 4-5: US-038 Fix or US-039 Implementation

Week 2: Completion + Stretch Goals
├─ Day 6-7:   US-039 Completion (if not done)
├─ Day 8-10:  Stretch Goals (US-013 or US-003)
└─ Day 11:    Sprint Review & Retrospective
```

---

## ✅ Approval Checklist

Before starting Sprint 3, confirm:

- [x] Sprint goal revised to prioritize user feedback
- [x] US-038 (P0) is core commitment
- [x] US-039 (P1) is core commitment
- [x] US-009 (P2) is core commitment (quick win)
- [x] Core commitment is conservative (16 pts = 53% capacity)
- [x] Stretch goals identified (US-013, US-003)
- [x] Deferred stories documented (US-022 already complete)
- [x] Retrospective learnings applied (AI-2.1, AI-2.2, AI-2.3)
- [x] Success metrics defined
- [x] Communication plan established

---

**Document Owner**: Development Team
**Last Updated**: January 29, 2026
**Status**: ✅ Ready for Sprint 3 Kickoff (Jan 30, 2026)
