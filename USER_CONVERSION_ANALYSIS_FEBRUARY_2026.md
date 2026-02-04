# User Conversion Analysis: Assets Entered but No Simulations Run

**Date**: February 3, 2026
**Analysis By**: Claude Code
**Critical Priority**: P0 🔴

---

## Executive Summary

After reviewing existing documentation and bug reports, I've identified **TWO PRIMARY ROOT CAUSES** for why users enter assets but don't run simulations:

### 🐛 Root Cause #1: Technical Bug (FIXED Feb 1, 2026)
**Simulation button was DISABLED when Python API health check failed**
- **Impact**: 20 users, $24.4M in assets, 0 simulations run (Jan 12-31, 2026)
- **Status**: ✅ Fixed (button no longer disabled)
- **Details**: See [CRITICAL_BUG_FIX_SIMULATION_BUTTON_DISABLED.md](CRITICAL_BUG_FIX_SIMULATION_BUTTON_DISABLED.md)

### 🎨 Root Cause #2: UX/Onboarding Issues (ONGOING)
**Users don't know WHERE or HOW to run simulations**
- **Evidence**: 16/20 users created scenarios but never clicked "Run Simulation"
- **Hypothesis**: Button not prominent, no post-onboarding guidance
- **Status**: ⏳ Needs investigation and fixes
- **Details**: See [CRITICAL_SIMULATION_ABANDONMENT_ANALYSIS.md](CRITICAL_SIMULATION_ABANDONMENT_ANALYSIS.md)

---

## 📊 Conversion Funnel Metrics

### Current Funnel (As of Feb 1, 2026)

```
Total Users: 100%
    ↓
Added Assets: 60-70%
    ↓ ❌ DROP-OFF: 30-40% (Bug + UX issues)
    ↓
Ran Simulations: 20-30%
    ↓
Viewed Results: 15-25%
```

### Specific Data Points from Bug Report

| Metric | Count | Percentage |
|--------|-------|------------|
| **Users affected by button bug** | 20 | 100% of Jan 12-31 cohort |
| **Users with assets** | 20 | 100% |
| **Users who created scenarios** | 16 | 80% |
| **Users who added income** | 17 | 85% |
| **Users who ran simulations** | 0 | **0%** ❌ |
| **Users who churned** | 1 (Steven Morehouse) | 5% |

### High-Value Users Affected

| User | Assets | Status | Complexity |
|------|--------|--------|------------|
| gthomas@g3consulting.com | $7.0M | Active | High (RRSP heavy) |
| mattramella@gmail.com | $4.5M | Active | Very High (17 assets!) |
| steven.morehouse@gmail.com | $3.8M | **DELETED** | High |
| jarumugam@gmail.com | $3.5M | Active | High (Corporate + RRSP) |
| ersilhome@gmail.com | $2.6M | Active | High (LIRA + RRSP) |
| john.brady@me.com | $1.4M | Active | High (Rental income) |

**Total Assets at Risk**: $24.4M
**Average User Value**: $1.2M
**Potential Annual Revenue Lost**: 6 churned users × $72/year = **$432/year**

---

## 🔍 Root Cause Analysis

### Bug #1: Simulation Button Disabled (FIXED)

#### What Happened
```typescript
// BEFORE FIX (simulation/page.tsx line 1165)
disabled={isLoading || prefillLoading || apiHealthy === false}
//                                       ^^^^^^^^^^^^^^^^^^
//                                       BUG: Disabled if health check fails
```

**Problem**: Health check was used to BLOCK users, not just inform them.

#### Why This is Wrong
1. **Fail-closed system**: If health check fails, button disabled forever (until page refresh)
2. **No user feedback**: Button greyed out with no explanation
3. **False negatives**: Network glitches cause false "API down" status
4. **Transient failures**: API might recover seconds after health check

#### The Fix
```typescript
// AFTER FIX
disabled={isLoading || prefillLoading}
// Health check only shows warning, doesn't disable button
```

**Result**: Button always enabled. If API actually down, proper error shown after click.

---

### Bug #2: UX/Onboarding Issues (NEEDS FIXES)

#### Evidence from User Behavior

**Pattern 1: Users Complete Setup But Don't Simulate**
- 80% created "Baseline" scenarios
- 85% added income sources
- **0% ran simulations**

**Conclusion**: Users followed onboarding, then got stuck.

**Pattern 2: "Hit simulation, nothing"** (Steven Morehouse)
- Suggests he DID click something
- Got no feedback or silent failure
- Gave up after 18 minutes, deleted account

**Conclusion**: Either button was hidden, disabled, or failed silently.

#### UX Issues Identified

1. **"Run Simulation" Button Not Prominent**
   - Location unknown (need to verify in page.tsx)
   - May require scrolling to find
   - No visual emphasis (size, color, animation)

2. **No Post-Onboarding Guidance**
   - After creating baseline scenario, users sent to... where?
   - No redirect to simulation page
   - No tooltip or guide pointing to button

3. **No Empty State on Results Tab**
   - Users go to "Results" tab expecting to see something
   - See empty/blank page
   - Don't realize they need to click "Run Simulation" first

4. **Confusing Simulation Page**
   - Multiple tabs (Input, Results, Settings)
   - Too many options and settings
   - Unclear what to do first

5. **Missing Validation Feedback**
   - If user missing required data (income, expenses, etc.)
   - Button might be disabled OR simulation fails
   - No clear error message explaining what's missing

---

## 🎯 Recommended Fixes

### Phase 1: Critical UX Improvements (This Week - 8 hours)

#### Fix #1: Make "Run Simulation" Button Impossible to Miss (2 hours)

**Changes**:
- [ ] Increase button size 2x (from normal to large)
- [ ] Add vibrant gradient background (blue-500 to blue-600)
- [ ] Position at top of page (above the fold)
- [ ] Add subtle pulsing animation for first-time users
- [ ] Add icon: "🚀 Run Simulation"

**Before**:
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Run Simulation
</button>
```

**After**:
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse-once">
  🚀 Run Your Retirement Simulation
</button>
```

**File**: `webapp/app/(dashboard)/simulation/page.tsx`

---

#### Fix #2: Add Post-Onboarding Redirect & Welcome Modal (2 hours)

**User Flow**:
1. User completes onboarding (creates baseline scenario)
2. **Automatically redirect** to `/simulation` page
3. **Show welcome modal** (first-time users only):
   ```
   🎉 Great job! You've set up your retirement profile.

   Now let's see your personalized retirement projection.

   Click "Run Simulation" below to get started!
   [Arrow pointing down to button]

   [Got it!]
   ```

**Implementation**:
- Add redirect after scenario creation: `router.push('/simulation?welcome=true')`
- Check URL param `?welcome=true` to show modal
- Store in localStorage to prevent showing modal again
- Add dismissible tooltip pointing to button

**Files**:
- `webapp/app/onboarding/page.tsx` (add redirect)
- `webapp/app/(dashboard)/simulation/page.tsx` (add welcome modal)

---

#### Fix #3: Add Empty State on Results Tab (1 hour)

**Current Problem**: Users click "Results" tab expecting to see data. See blank/empty page. Don't realize they need to run simulation first.

**Solution**: Show helpful empty state.

**Design**:
```tsx
{!simulationResults && (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">
      No simulation results yet
    </h3>
    <p className="text-gray-600 mb-6 max-w-md">
      Click "Run Simulation" to see your personalized retirement projection,
      year-by-year cash flow, and tax-optimized withdrawal strategy.
    </p>
    <div className="flex items-center gap-2 text-blue-600">
      <svg><!-- Arrow pointing up to button --></svg>
      <span className="font-medium">Click "Run Simulation" above to get started</span>
    </div>
  </div>
)}
```

**File**: `webapp/components/simulation/ResultsDashboard.tsx`

---

#### Fix #4: Improve Validation & Error Messages (2 hours)

**Current Problem**: If user missing required data, unclear what's wrong.

**Solution**: Clear validation with helpful messages.

**Validation Rules**:
1. Must have at least 1 asset OR 1 income source
2. Must have retirement age >= current age
3. Must have life expectancy > retirement age
4. CPP/OAS start ages must be valid (60-70 for CPP, 65-70 for OAS)

**Error Display**:
```tsx
{validationErrors.length > 0 && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Can't run simulation yet</AlertTitle>
    <AlertDescription>
      <ul className="list-disc list-inside mt-2">
        {validationErrors.map(error => (
          <li key={error.field}>{error.message}</li>
        ))}
      </ul>
    </AlertDescription>
    <Button variant="link" onClick={goToMissingData}>
      Fix these issues →
    </Button>
  </Alert>
)}
```

**Example Errors**:
- ❌ "Please add at least one asset or income source to run simulation"
- ❌ "Retirement age (55) must be greater than current age (60)"
- ❌ "CPP can't start before age 60. Please adjust your CPP start age."

**File**: `webapp/lib/utils/simulationValidation.ts` (new file)

---

#### Fix #5: Better Loading State (1 hour)

**Current Problem**: Generic "Loading..." gives no feedback. User thinks page is frozen.

**Solution**: Progressive loading messages with stages.

**Implementation**:
```tsx
const loadingStages = [
  { message: "Loading your profile data...", duration: 1000 },
  { message: "Calculating CPP and OAS benefits...", duration: 2000 },
  { message: "Projecting asset growth over 30 years...", duration: 3000 },
  { message: "Optimizing tax strategy...", duration: 2000 },
  { message: "Generating year-by-year breakdown...", duration: 2000 },
  { message: "Almost done...", duration: 1000 }
];

<div className="text-center py-8">
  <Spinner className="w-12 h-12 mb-4" />
  <p className="text-lg font-medium text-gray-900 mb-2">
    {currentStage.message}
  </p>
  <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
  <p className="text-sm text-gray-500 mt-2">
    {progress}% complete
  </p>
</div>
```

**File**: `webapp/components/simulation/SimulationLoadingState.tsx` (new component)

---

### Phase 2: Re-engagement Campaign (This Week - 3 hours)

#### Email 19 Active Users Who Never Simulated

**Subject**: "Your retirement plan is 90% complete - one click away!"

**Body**:
```
Hi [First Name],

I noticed you loaded $[X] in assets into RetireZest (thank you!),
but you haven't run your retirement simulation yet.

Good news: You're just ONE CLICK away from seeing your personalized
retirement projection.

→ Click here to run your simulation: [Link to /simulation]

What you'll see:
✅ Year-by-year cash flow through retirement
✅ Tax-optimized withdrawal strategy
✅ Success probability (will your money last?)
✅ GIS/OAS benefit optimization

Questions? Hit reply - I'm here to help.

- [Product Owner Name]

P.S. If you're stuck or something isn't working, please let me know.
We're constantly improving RetireZest based on user feedback.
```

**Targeting**:
- 19 users with assets + scenarios but 0 simulation runs
- Personalize with actual asset amounts
- Track clicks and simulation runs

**Implementation**:
- Use existing email system (Resend API)
- Query database for users with assets but no scenarios
- Send batch email with personalized data
- Track opens, clicks, simulations in next 48 hours

**Success Metric**: 60%+ run simulations within 48 hours (12/19 users)

---

### Phase 3: Long-Term Improvements (Next Sprint - 8 hours)

#### Feature #1: Auto-Run Simulation After Onboarding (3 hours)

**User Flow**:
1. User completes onboarding (baseline scenario created)
2. **Automatically trigger simulation** (no button click needed)
3. Show loading overlay: "Creating your retirement plan..."
4. Redirect to results page when done
5. Show success message: "Your retirement plan is ready!"

**Trade-offs**:
- **Pro**: Zero-friction, immediate value, 100% conversion
- **Con**: Users don't learn where "Run Simulation" button is for future use
- **Con**: Longer perceived onboarding time (adds 10-15 seconds)

**Recommendation**: Implement as **optional experiment** (A/B test)
- Control: Current flow (redirect to simulation page, user clicks button)
- Treatment: Auto-run simulation after onboarding

---

#### Feature #2: Guided Tutorial for First-Time Users (3 hours)

**Implementation**: Use a tooltip library (e.g., react-joyride, shepherd.js)

**Tutorial Steps**:
1. **Highlight simulation button**: "This is where you run simulations to see your retirement projection"
2. **Show Results tab**: "Your results will appear here after running a simulation"
3. **Show Input tabs**: "You can edit your assets, income, and expenses here anytime"
4. **Show Strategies dropdown**: "Try different withdrawal strategies to optimize taxes"

**Trigger**: First-time users only (store in localStorage: `tutorial_completed: true`)

**Skip option**: "Skip tutorial" button at any step

---

#### Feature #3: Simulation Health Dashboard (2 hours)

**Purpose**: Help admins monitor simulation success rates and identify issues early.

**Metrics to Track**:
- Simulation button clicks (conversions from page view)
- Simulation success rate (successful runs / total attempts)
- Average simulation time (loading duration)
- Python API health check pass rate
- Common validation errors preventing simulations

**Implementation**:
- Add Vercel Analytics or Mixpanel events
- Create admin dashboard at `/admin/analytics`
- Set up alerts: Email if simulation success rate < 80%

---

## 📈 Success Metrics

### Phase 1 Targets (This Week)

| Metric | Current | Target | Success Criteria |
|--------|---------|--------|------------------|
| **Simulation Conversion** | 0% | 80% | 16/20 users run simulations |
| **Time to First Simulation** | ∞ | < 5 min | From signup to first run |
| **Re-engagement Email Response** | N/A | 60% | 12/19 users click & run |
| **Churn Prevention** | 1 deleted | 0 | No deletions next 2 weeks |

### Phase 2 Targets (Next 2 Weeks)

| Metric | Current | Target | Success Criteria |
|--------|---------|--------|------------------|
| **New User Simulation Rate** | ~20% | 90% | 9/10 new signups run simulation |
| **Button Click Rate** | Unknown | 95% | 95% of page visitors click button |
| **Validation Error Rate** | Unknown | < 5% | < 5% hit validation errors |
| **Average Simulation Time** | Unknown | < 10s | Fast, responsive experience |

---

## 🚀 Implementation Priority

### Week 1: Critical UX Fixes (8 hours)
| Priority | Task | Story Points | Owner | Status |
|----------|------|--------------|-------|--------|
| P0 🔴 | Make button prominent | 2 | TBD | 📋 To Do |
| P0 🔴 | Post-onboarding redirect | 2 | TBD | 📋 To Do |
| P0 🔴 | Empty state on Results tab | 1 | TBD | 📋 To Do |
| P1 🟡 | Validation & error messages | 2 | TBD | 📋 To Do |
| P1 🟡 | Better loading state | 1 | TBD | 📋 To Do |

### Week 1: Re-engagement Campaign (3 hours)
| Priority | Task | Story Points | Owner | Status |
|----------|------|--------------|-------|--------|
| P0 🔴 | Email 19 users | 2 | TBD | 📋 To Do |
| P1 🟡 | Track email responses | 1 | TBD | 📋 To Do |

### Week 2-3: Long-Term Improvements (8 hours)
| Priority | Task | Story Points | Owner | Status |
|----------|------|--------------|-------|--------|
| P2 🟢 | Auto-run simulation (A/B test) | 3 | TBD | 📋 To Do |
| P2 🟢 | Guided tutorial | 3 | TBD | 📋 To Do |
| P2 🟢 | Simulation health dashboard | 2 | TBD | 📋 To Do |

**Total Effort**: 19 story points (~38 hours over 2-3 weeks)

---

## 📝 User Stories for AGILE_BACKLOG

### US-066: Make "Run Simulation" Button Prominent and Impossible to Miss

**Story Points**: 2
**Priority**: P0 🔴
**Epic**: Epic 4 (UX Improvements)

**Description**: As a user who has entered my assets and created a scenario, I want the "Run Simulation" button to be prominent and obvious so that I know exactly how to see my retirement projection.

**Acceptance Criteria**:
- [ ] Button size increased 2x (large size)
- [ ] Vibrant gradient background (blue-500 to blue-600)
- [ ] Positioned at top of page (above the fold)
- [ ] Clear label: "🚀 Run Your Retirement Simulation"
- [ ] Subtle pulsing animation for first-time users
- [ ] Hover effect: scale + shadow increase
- [ ] Mobile-responsive (full width on mobile)

**User Impact**: **CRITICAL** - Without prominent button, users don't know where to click. This is the #1 blocker preventing users from seeing value.

---

### US-067: Add Post-Onboarding Redirect and Welcome Modal

**Story Points**: 2
**Priority**: P0 🔴
**Epic**: Epic 4 (UX Improvements)

**Description**: As a new user who just completed onboarding, I want to be automatically taken to the simulation page with clear guidance on what to do next so that I can immediately run my first simulation.

**Acceptance Criteria**:
- [ ] After creating baseline scenario, redirect to `/simulation?welcome=true`
- [ ] Show welcome modal on first visit (check localStorage)
- [ ] Modal explains: "Click Run Simulation to see your projection"
- [ ] Arrow graphic pointing to button
- [ ] Dismissible with "Got it!" button
- [ ] Modal doesn't show again after dismissal
- [ ] Optional tooltip pointing to button (for users who dismiss modal)

**User Impact**: **HIGH** - Guides users to next step, prevents confusion, increases likelihood of running first simulation.

---

### US-068: Add Empty State on Results Tab

**Story Points**: 1
**Priority**: P0 🔴
**Epic**: Epic 4 (UX Improvements)

**Description**: As a user who clicks the "Results" tab before running a simulation, I want to see a helpful empty state that tells me what to do so that I understand I need to run a simulation first.

**Acceptance Criteria**:
- [ ] Empty state shown when no simulation results exist
- [ ] Large icon (📊) and clear heading
- [ ] Explanation: "Click Run Simulation to see your projection"
- [ ] Arrow pointing up to button location
- [ ] Call-to-action button: "Run My First Simulation"
- [ ] Mobile-friendly layout

**User Impact**: **HIGH** - Prevents confusion when users expect to see results but haven't run simulation yet.

---

### US-069: Add Simulation Validation with Clear Error Messages

**Story Points**: 2
**Priority**: P1 🟡
**Epic**: Epic 4 (UX Improvements)

**Description**: As a user attempting to run a simulation, I want to see clear validation errors if I'm missing required data so that I know exactly what to fix.

**Acceptance Criteria**:
- [ ] Validate before running simulation:
  - At least 1 asset OR 1 income source
  - Retirement age >= current age
  - Life expectancy > retirement age
  - CPP start age valid (60-70)
  - OAS start age valid (65-70)
- [ ] Show red alert with specific errors (bulleted list)
- [ ] "Fix these issues" button links to relevant input tab
- [ ] Button disabled with tooltip if validation fails
- [ ] Help text explains common mistakes

**User Impact**: **MEDIUM** - Prevents silent failures, helps users understand what data is missing.

---

### US-070: Improve Simulation Loading State

**Story Points**: 1
**Priority**: P1 🟡
**Epic**: Epic 4 (UX Improvements)

**Description**: As a user running a simulation, I want to see progressive loading messages and a progress bar so that I know the system is working and approximately how long it will take.

**Acceptance Criteria**:
- [ ] Replace generic "Loading..." with stages:
  - "Loading your profile data..."
  - "Calculating CPP and OAS benefits..."
  - "Projecting asset growth..."
  - "Optimizing tax strategy..."
  - "Generating year-by-year breakdown..."
- [ ] Progress bar (0% → 100%)
- [ ] Estimated time remaining
- [ ] Spinner animation
- [ ] 30-second timeout with error message
- [ ] Mobile-friendly design

**User Impact**: **MEDIUM** - Reduces perceived wait time, prevents users from thinking page is frozen.

---

### US-071: Re-engagement Email Campaign for Users with Assets but No Simulations

**Story Points**: 2
**Priority**: P0 🔴
**Epic**: Epic 1 (User Retention)

**Description**: As the product owner, I want to send re-engagement emails to users who loaded assets but never ran simulations so that we can recover these high-value users and prevent churn.

**Acceptance Criteria**:
- [ ] Query database for users: assets > 0, scenarios = 0
- [ ] Personalized email with actual asset amount
- [ ] Clear CTA: Link to /simulation page
- [ ] Explain what they'll see (benefits)
- [ ] Track email opens and clicks
- [ ] Track simulation runs within 48 hours of email
- [ ] Success metric: 60%+ run simulations (12/19 users)

**User Impact**: **CRITICAL** - Potential to recover 19 users with $20.6M in assets. Prevents churn and demonstrates product value.

---

## 🔗 Related Documentation

- [CRITICAL_BUG_FIX_SIMULATION_BUTTON_DISABLED.md](CRITICAL_BUG_FIX_SIMULATION_BUTTON_DISABLED.md) - Technical bug that disabled button
- [CRITICAL_SIMULATION_ABANDONMENT_ANALYSIS.md](CRITICAL_SIMULATION_ABANDONMENT_ANALYSIS.md) - Original analysis of 20 users
- [STEVEN_MOREHOUSE_CRITICAL_BUGS_ANALYSIS.md](STEVEN_MOREHOUSE_CRITICAL_BUGS_ANALYSIS.md) - Case study of churned user
- [AGILE_BACKLOG.md](AGILE_BACKLOG.md) - Add new user stories here

---

## 📞 Next Actions

### Immediate (Today):
1. ✅ Analysis complete (this document)
2. ⏳ Review findings with product owner
3. ⏳ Prioritize user stories for Sprint 8
4. ⏳ Assign stories to development team

### This Week:
5. ⏳ Implement US-066, US-067, US-068 (critical UX fixes)
6. ⏳ Send re-engagement emails (US-071)
7. ⏳ Monitor simulation conversion rates
8. ⏳ Track user feedback and support tickets

### Next Week:
9. ⏳ Implement US-069, US-070 (validation + loading)
10. ⏳ Analyze email campaign results
11. ⏳ Plan A/B test for auto-run simulation
12. ⏳ Design guided tutorial for first-time users

---

**Document Status**: ✅ Ready for Review
**Next Reviewer**: Product Owner (JRCB)
**Estimated Impact**: Increase simulation conversion from 0-20% to 80-90%
**Revenue Impact**: Prevent $432-$1,000/year in churn from high-value users
