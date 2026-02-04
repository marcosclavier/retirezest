# Sprint 8 Plan - Bug Fixes & User Conversion
**Sprint Duration**: February 10-16, 2026 (7 days)
**Sprint Goal**: "Fix critical employment income bug and unblock 19 users who entered assets but never ran simulations"

**Planning Date**: February 4, 2026
**Team Capacity**: 18 story points (focused sprint with 1 critical bug fix + UX improvements)
**Sprint Type**: Critical Bug Fix + User Conversion Optimization

---

## 🎯 Sprint Goal

**Primary Goal**: Fix the employment income bug (US-072) affecting all pre-retirement users and implement UX improvements to convert 19 active users with $20.6M in assets who haven't run simulations.

**Success Criteria**:
- ✅ Employment income bug fixed and deployed (US-072)
- ✅ Daniel Gonzalez's simulation shows correct results (tax > $0 in 2026-2027, success rate 95%+)
- ✅ 19 users receive re-engagement email (US-071)
- ✅ At least 5/19 users (26%) run their first simulation
- ✅ Simulation button redesigned and impossible to miss (US-066)
- ✅ Post-onboarding redirect implemented (US-067)

---

## 📊 Sprint 8 Backlog (FINALIZED)

### 🔴 P0 Critical Items (12 story points)

| ID | User Story | Story Points | Priority | Epic | Owner | Status |
|----|------------|--------------|----------|------|-------|--------|
| **US-072** | **Fix Employment Income Not Applied Before Retirement** | **3** | **P0 🔴** | **Epic 5: Simulation** | TBD | **📋 To Do** |
| **US-066** | **Make "Run Simulation" Button Prominent and Impossible to Miss** | **2** | **P0 🔴** | **Epic 1: Retention** | TBD | **📋 To Do** |
| **US-067** | **Add Post-Onboarding Redirect and Welcome Modal** | **2** | **P0 🔴** | **Epic 1: Retention** | TBD | **📋 To Do** |
| **US-068** | **Add Empty State on Results Tab** | **1** | **P0 🔴** | **Epic 1: Retention** | TBD | **📋 To Do** |
| **US-071** | **Re-engagement Email Campaign for 19 Users** | **2** | **P0 🔴** | **Epic 1: Retention** | TBD | **📋 To Do** |
| **US-044** | **Improve Cash Flow Gap Messaging** | **2** | **P1 🟡** | **Epic 4: UX** | TBD | **📋 To Do** |

**P0 Subtotal**: 12 story points

### 🟡 P1 Stretch Items (6 story points)

| ID | User Story | Story Points | Priority | Epic | Owner | Status |
|----|------------|--------------|----------|------|-------|--------|
| **US-069** | **Add Simulation Validation with Clear Error Messages** | **2** | **P1 🟡** | **Epic 1: Retention** | TBD | **📋 Stretch** |
| **US-070** | **Improve Simulation Loading State** | **1** | **P1 🟡** | **Epic 1: Retention** | TBD | **📋 Stretch** |
| **US-053** | **Optimize Dashboard Layout Query (JWT Caching)** | **3** | **P0 🔴** | **Epic 6: Quality** | TBD | **📋 Stretch** |

**P1 Stretch Subtotal**: 6 story points

**Total Committed**: 12 story points (P0 items)
**Total Sprint Capacity**: 18 story points (67% committed, 33% buffer)

---

## 🎯 Sprint Priorities

### Priority 1: Fix Employment Income Bug (US-072) - CRITICAL
**Impact**: Affects ALL users with employment income before retirement
**User**: Daniel Gonzalez (danjgonzalezm@gmail.com)
**Evidence**: Screenshot shows Tax = $0 in 2026-2027 despite $200K employment income
**Root Cause**: `/juan-retirement-app/modules/simulation.py:1357` - Missing `endAge` check
**Story Points**: 3
**Estimated Time**: 4 hours

**Acceptance Criteria**:
- [ ] Employment income applies from current age to retirement age - 1
- [ ] Tax > $0 in pre-retirement years (proves income is counted)
- [ ] Daniel's success rate increases from 1% to 95%+
- [ ] Test with multiple retirement age scenarios (55, 60, 65, 70)
- [ ] No regression in retirement income (CPP, OAS, pension)

**Tasks**:
1. Reproduce bug with Daniel's profile (age 64, retire 66, $200K employment)
2. Fix Python backend: Add `endAge` check to income logic
3. Special handling for employment income:
   - If `startAge` is null → default to `currentAge`
   - If `endAge` is null → default to `retirementAge`
4. Test fix: Verify tax > $0 in 2026-2027
5. Deploy to production
6. Re-run Daniel's simulation and notify him

**Technical Details**:
```python
# Current Bug (line 1357):
if income_start_age is None or age >= income_start_age:
    annual_amount = other_income.get('amount', 0.0)
    other_income_total += annual_amount  # ❌ No endAge check!

# Fixed Code:
income_type = other_income.get('type', '')
income_start_age = other_income.get('startAge')
income_end_age = other_income.get('endAge')

# Special handling for employment income
if income_type == 'employment':
    if income_start_age is None:
        income_start_age = person.current_age
    if income_end_age is None:
        income_end_age = person.retirement_age  # ✅ Default to retirement

# Check if income is active this year
is_active = True
if income_start_age is not None and age < income_start_age:
    is_active = False  # Not started yet
if income_end_age is not None and age >= income_end_age:
    is_active = False  # Already ended

if is_active:
    annual_amount = other_income.get('amount', 0.0)
    other_income_total += annual_amount
```

---

### Priority 2: Unblock 19 Users Who Haven't Run Simulations (US-066, US-067, US-068, US-071)

**Impact**: 19 active users with $20.6M in assets have entered data but haven't run simulations
**Root Cause**: Simulation button not prominent, no post-onboarding guidance
**Revenue Potential**: 19 users × $24/year = $456/year (if 50% convert)
**Story Points**: 7 (2 + 2 + 1 + 2)
**Estimated Time**: 7 hours

#### US-066: Make "Run Simulation" Button Prominent (2 pts, 2 hours)
**Goal**: Redesign button so users can't miss it

**Changes**:
- Move button to top of page (above scenario tabs)
- Change from ghost button to solid primary button
- Increase size: `h-14` (56px height)
- Add animation: pulse effect or glow
- Add descriptive text: "Ready to see your retirement plan? Run your first simulation"

**Before/After**:
```tsx
// Before (hidden in scenario form):
<Button variant="ghost">Run Simulation</Button>

// After (prominent at top):
<div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg mb-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Ready to see your retirement plan?
      </h2>
      <p className="text-blue-100">
        Run your first simulation to see if your plan is on track
      </p>
    </div>
    <Button
      size="lg"
      className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-8 animate-pulse"
    >
      🚀 Run Simulation Now
    </Button>
  </div>
</div>
```

---

#### US-067: Post-Onboarding Redirect & Welcome Modal (2 pts, 2 hours)
**Goal**: Guide users to simulation page after onboarding

**Changes**:
1. Redirect to `/simulation` after completing onboarding
2. Show welcome modal on first visit:
   - "Welcome! You're all set up"
   - "Click 'Run Simulation' to see your retirement plan"
   - "We'll show you if your plan is on track"
   - Don't show again after first visit

**Implementation**:
```tsx
// components/modals/WelcomeModal.tsx
export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to RetireZest! 🎉</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>You're all set up! Your profile and financial data have been saved.</p>
          <p className="font-semibold">Next step: Run your first simulation</p>
          <p>Click the "Run Simulation Now" button to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>See if your retirement plan is on track</li>
            <li>Get your retirement health score (0-100)</li>
            <li>Understand your cash flow year-by-year</li>
            <li>Identify potential issues early</li>
          </ul>
          <Button onClick={() => setOpen(false)} className="w-full">
            Got it! Let's run my simulation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

#### US-068: Empty State on Results Tab (1 pt, 1 hour)
**Goal**: Add helpful empty state when user clicks Results tab before running simulation

**Changes**:
```tsx
// app/(dashboard)/simulation/page.tsx
{activeTab === 'results' && !hasSimulationResults && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-blue-100 p-6 mb-4">
      <PlayIcon className="h-12 w-12 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold mb-2">No simulation results yet</h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      Run your first simulation to see your retirement health score,
      year-by-year cash flow, and personalized recommendations.
    </p>
    <Button
      onClick={() => setActiveTab('scenario')}
      size="lg"
      className="bg-blue-600 hover:bg-blue-700"
    >
      🚀 Run Your First Simulation
    </Button>
  </div>
)}
```

---

#### US-071: Re-engagement Email Campaign (2 pts, 2 hours)
**Goal**: Email 19 users who entered assets but haven't run simulations

**Email Template**:
```
Subject: Your retirement plan is 90% complete - take the next step

Hi [Name],

We noticed you've added $[TOTAL_ASSETS] to your RetireZest profile - great work
setting up your retirement data!

You're just ONE CLICK away from seeing your complete retirement projection:

[CTA Button: Run Your Free Simulation]

Here's what you'll discover:
✅ Is your retirement plan on track? (Your personal health score)
✅ Will you run out of money? (Year-by-year cash flow)
✅ How much can you spend? (Monthly budget recommendations)
✅ What's your best withdrawal strategy? (Tax optimization)

It takes 30 seconds to run your first simulation. No credit card required.

[CTA Button: See My Retirement Plan Now]

Have questions? Just hit reply - we're here to help!

Cheers,
RetireZest Team

P.S. Your data is already saved, so this literally takes one click.
```

**Implementation**:
1. Query database for users with assets but zero simulation runs
2. Use existing email service (Resend)
3. Track opens/clicks/simulations
4. Measure success: Goal is 26% conversion (5/19 users)

---

### Priority 3: Improve Cash Flow Gap Messaging (US-044)

**Impact**: Users see "Gap!" in year-by-year table without understanding why
**Story Points**: 2
**Estimated Time**: 2 hours

**Changes**:
1. Replace "Gap!" text with clear explanation:
   - "TFSA prioritized (intentional)"
   - "Withdrawing from RRSP first"
2. Add tooltip explaining withdrawal order strategy
3. Link to US-027 educational content (when available)

**Example**:
```tsx
// Before:
<TableCell className="text-red-600">Gap!</TableCell>

// After:
<TableCell>
  <div className="flex items-center gap-2">
    <span className="text-amber-600">TFSA preserved</span>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            Your withdrawal strategy prioritizes RRSP/RRIF first to minimize
            lifetime taxes. TFSA is preserved for later years when it's most
            tax-efficient.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</TableCell>
```

---

## 🎯 Stretch Goals (If Time Permits)

### US-069: Simulation Validation (2 pts)
- Add validation before running simulation
- Clear error messages for missing data
- Example: "Please add at least one asset before running simulation"

### US-070: Loading State (1 pt)
- Add progress bar during simulation
- Show "Calculating year 2026... 2027... 2028..."
- Estimated time: "This usually takes 10-15 seconds"

### US-053: JWT Caching (3 pts)
- Cache `emailVerified` in JWT token
- Eliminate database query on every page load
- Reduce dashboard load time from 4-6 seconds to < 2 seconds

---

## 📊 Success Metrics

### Must-Have (Sprint Success Criteria):
- [ ] US-072 deployed: Daniel's simulation shows correct tax (> $0 in 2026-2027)
- [ ] Daniel's success rate increases from 1% to 95%+
- [ ] US-066 deployed: New button design live
- [ ] US-067 deployed: Welcome modal shows after onboarding
- [ ] US-068 deployed: Empty state shows on Results tab
- [ ] US-071 executed: 19 users receive re-engagement email
- [ ] At least 5/19 users (26%) run their first simulation

### Stretch Goals:
- [ ] US-044 deployed: Cash flow gap messaging improved
- [ ] US-069 deployed: Validation errors shown
- [ ] US-070 deployed: Loading state improved
- [ ] US-053 deployed: Dashboard load time < 2 seconds

### Quality Gates:
- [ ] TypeScript compilation: 0 errors
- [ ] Production build: SUCCESS
- [ ] All automated tests passing
- [ ] Zero regression bugs
- [ ] Employment income works for all retirement ages (55, 60, 65, 70)

---

## 🧪 Testing Strategy

### US-072 Testing (Critical):
1. **Test Case 1**: Daniel Gonzalez Profile
   - Age: 64, Retire: 66, Employment: $200K, Expenses: $58K
   - Expected: Tax > $0 in 2026-2027, success rate 95%+

2. **Test Case 2**: Early Retirement (Age 55)
   - Age: 50, Retire: 55, Employment: $100K
   - Expected: Income applies ages 50-54, stops at 55

3. **Test Case 3**: Late Retirement (Age 70)
   - Age: 65, Retire: 70, Employment: $80K
   - Expected: Income applies ages 65-69, stops at 70

4. **Test Case 4**: Multiple Income Sources
   - Employment: $100K (ends at retirement)
   - Rental: $24K (continues forever)
   - Expected: Employment stops, rental continues

5. **Regression Test**: Retirement Income
   - Ensure CPP, OAS, pension still work correctly
   - No impact on existing retirement income logic

---

## 📈 Expected Outcomes

### User Impact:
- **Daniel Gonzalez**: Gets accurate simulation results (1% → 95% success rate)
- **All pre-retirees**: Employment income now works correctly
- **19 users with assets**: Clear path to run first simulation
- **26% conversion**: 5/19 users run their first simulation (conservative estimate)

### Business Impact:
- **Revenue**: 5 new active users × $24/year × 50% premium conversion = $60/year recurring
- **Trust**: Fix critical bug before more users encounter it
- **Retention**: Re-engage 19 users at risk of churning
- **Product Quality**: Eliminate fundamental simulation accuracy issue

### Technical Impact:
- **Code Quality**: Fix income logic bug affecting all pre-retirees
- **User Experience**: Clear onboarding → simulation flow
- **Conversion**: Reduce drop-off between data entry and simulation

---

## 🚀 Deployment Plan

### Day 1-2 (Feb 10-11): US-072 - Employment Income Bug Fix
- **Day 1 Morning**: Reproduce bug in dev environment
- **Day 1 Afternoon**: Implement fix in Python backend
- **Day 2 Morning**: Test with 5 test cases
- **Day 2 Afternoon**: Deploy to production, re-run Daniel's simulation

### Day 3-4 (Feb 12-13): US-066, US-067, US-068 - Simulation Button UX
- **Day 3 Morning**: Implement prominent button (US-066)
- **Day 3 Afternoon**: Build welcome modal (US-067)
- **Day 4 Morning**: Add empty state (US-068)
- **Day 4 Afternoon**: Test and deploy all three together

### Day 5 (Feb 14): US-071 - Re-engagement Email
- **Morning**: Write and test email template
- **Afternoon**: Send emails to 19 users, track opens/clicks

### Day 6 (Feb 15): US-044 - Cash Flow Gap Messaging
- **Morning**: Implement improved messaging
- **Afternoon**: Test and deploy

### Day 7 (Feb 16): Stretch Goals + Sprint Review
- **Morning**: US-069, US-070, or US-053 (if time permits)
- **Afternoon**: Sprint review, retrospective, metrics analysis

---

## 🎯 Definition of Done

A user story is considered DONE when:
- [ ] Code implemented and peer-reviewed
- [ ] All acceptance criteria met
- [ ] Automated tests written and passing
- [ ] Manual testing completed (test cases documented)
- [ ] No TypeScript errors
- [ ] Production build succeeds
- [ ] Deployed to production
- [ ] User-facing documentation updated (if applicable)
- [ ] No regression bugs introduced

---

## 📋 Sprint Ceremonies

### Daily Standup (10 minutes, daily)
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

### Sprint Review (1 hour, Feb 16)
- Demo all completed stories
- Measure success metrics:
  - Daniel's simulation results (before/after)
  - Email campaign results (opens, clicks, simulations)
  - User feedback on prominent button
- Stakeholder feedback

### Sprint Retrospective (30 minutes, Feb 16)
- What went well?
- What could be improved?
- Action items for Sprint 9

---

## 🔗 Related Documents

- [AGILE_BACKLOG.md](AGILE_BACKLOG.md) - Full product backlog
- [DANIEL_GONZALEZ_CASHFLOW_GAP_ANALYSIS.md](DANIEL_GONZALEZ_CASHFLOW_GAP_ANALYSIS.md) - US-072 bug analysis
- [USER_CONVERSION_ANALYSIS_FEBRUARY_2026.md](USER_CONVERSION_ANALYSIS_FEBRUARY_2026.md) - US-066 through US-071 analysis
- [SPRINT_7_PLAN.md](webapp/SPRINT_7_PLAN.md) - Previous sprint (QA & Performance)
- [SPRINT_6_VERIFICATION_REPORT.md](SPRINT_6_VERIFICATION_REPORT.md) - Sprint 6 results

---

## 📊 Sprint Capacity

**Team Size**: 1 developer (JRCB)
**Sprint Duration**: 7 days
**Daily Capacity**: ~6 hours/day (42 hours total)
**Story Points**: 18 total capacity
**Committed**: 12 story points (67% utilization)
**Buffer**: 6 story points (33% for unexpected issues)

**Sprint 6 Velocity**: 16 pts/day (exceptional, 1-day sprint)
**Sprint 5 Velocity**: 4.3 pts/day (3-day sprint)
**Sprint 4 Velocity**: 8 pts/day (1-day sprint)
**Average Velocity**: ~2.6 pts/day (normalized for 7-day sprint)
**Expected Delivery**: 18 story points (all committed + stretch goals)

---

**Sprint Status**: 📋 PLANNED (Ready to start February 10, 2026)
**Last Updated**: February 4, 2026
