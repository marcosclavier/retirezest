# Sprint 8 - Remaining Tasks Summary

**Status**: 13/21 story points complete (62%)
**Phase**: Phase 1 Complete → Moving to Phase 2 (UX Improvements)

---

## ✅ COMPLETED: Phase 1 - Critical Bug Fixes (13 pts)

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-072 | Fix Employment Income Not Applied Before Retirement | 3 | ✅ Done |
| US-073 | Auto-Stop rental_income_annual When Property Is Sold | 2 | ✅ Done |
| US-075 | Connect Real Estate Downsizing UI to Simulation Engine | 5 | ✅ Done |
| US-074 | Auto-calculate endAge for Rental Income in other_incomes | 3 | ✅ Done |

**Impact**: All critical simulation accuracy bugs fixed! Real estate features now work end-to-end.

---

## 📋 REMAINING: Phase 2 - UX Improvements (5 pts)

### US-067: Post-Onboarding Redirect and Welcome Modal (2 pts) - P1 🟡

**Problem**: Users complete onboarding but don't know what to do next (80% created scenarios but didn't simulate).

**Solution**:
- Auto-redirect to `/simulation?welcome=true` after onboarding
- Show welcome modal pointing to "Run Simulation" button
- Arrow graphic + clear instructions
- Dismissible with localStorage tracking

**Implementation**:
```tsx
// onboarding/page.tsx
const handleComplete = async () => {
  await createBaselineScenario();
  router.push('/simulation?welcome=true');
};

// simulation/page.tsx
useEffect(() => {
  const isWelcome = searchParams.get('welcome') === 'true';
  const seen = localStorage.getItem('welcome_modal_seen');
  if (isWelcome && !seen) setShowWelcome(true);
}, []);
```

**Files to Modify**:
1. `webapp/app/onboarding/page.tsx` - Add redirect
2. `webapp/app/(dashboard)/simulation/page.tsx` - Add welcome modal trigger
3. `webapp/components/modals/WelcomeModal.tsx` - New component

**Success Metrics**:
- 90%+ of new users run simulation within 5 minutes of onboarding
- Modal dismissed within 10 seconds on average
- Simulation conversion increases from 0% to >80%

**Estimated Time**: 2-3 hours

---

### US-068: Empty State on Results Tab (1 pt) - P1 🟡

**Problem**: Users click "Results" tab before running simulation and see blank screen (confusion).

**Solution**:
- Show empty state with large icon (📊)
- Clear message: "No simulation results yet"
- Explanation + CTA button: "Run My First Simulation"
- Arrow pointing to button location

**Implementation**:
```tsx
// ResultsDashboard.tsx
export function ResultsDashboard({ results }) {
  if (!results) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <BarChart3 className="w-24 h-24 text-gray-300 mb-6" />
        <h3 className="text-2xl font-bold mb-2">
          No simulation results yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Click "Run Simulation" to see your personalized projection
        </p>
        <div className="flex items-center gap-2 text-blue-600">
          <ArrowUp className="w-5 h-5" />
          <span>Click "Run Simulation" above</span>
        </div>
        <Button onClick={scrollToButton}>
          Run My First Simulation
        </Button>
      </div>
    );
  }
  // Normal results display
  return ( ... );
}
```

**Files to Modify**:
1. `webapp/components/simulation/ResultsDashboard.tsx`

**Success Metrics**:
- Empty state shown to 100% of users who visit Results before simulation
- CTA button click rate >80%
- Reduction in "where are my results?" support tickets

**Estimated Time**: 1-2 hours

---

### US-044: Improve Cash Flow Gap Messaging (2 pts) - P1 🟡

**Problem**: User reported "cashflow gap detected in year 2033 despite $600K+ in assets" (TFSA not being used).

**Current Status**:
- **Investigation completed in Sprint 6** ✅
- Root cause identified: TFSA intentionally last in withdrawal strategies (by design)
- Conclusion: UX issue, not critical bug

**Solution**: Improve messaging to explain why gap exists
1. **Better Gap Message**:
   - "⚠️ Funding Gap: Your current withdrawal strategy prioritizes tax efficiency"
   - "💡 Available: $172K in TFSA (not yet accessed to preserve GIS benefits)"
   - "To access TFSA earlier, change to 'TFSA First' strategy"

2. **Strategy Explanation**:
   - Add tooltip on gap years explaining withdrawal order
   - Link to strategy comparison page
   - Suggest alternative strategies that access TFSA sooner

3. **Visual Improvements**:
   - Show available balances alongside gap warning
   - Color-code accounts (green = available, yellow = locked, red = depleted)
   - Add "Available Funds" breakdown in gap year

**Implementation**:
```tsx
// Year result with gap
{year.net_cash_flow < 0 && (
  <Alert variant="warning">
    <h4>⚠️ Funding Gap: {formatCurrency(Math.abs(year.net_cash_flow))}</h4>
    <p>Your current strategy prioritizes tax efficiency.</p>

    {/* Show available accounts */}
    <div className="mt-2 p-3 bg-blue-50 rounded">
      <p className="font-medium">💡 Available Funds:</p>
      <ul className="ml-4 mt-1">
        {year.tfsa_balance > 0 && (
          <li>TFSA: {formatCurrency(year.tfsa_balance)} (tax-free)</li>
        )}
        {year.rrif_balance > 0 && (
          <li>RRIF: {formatCurrency(year.rrif_balance)} (taxable)</li>
        )}
        {year.nonreg_balance > 0 && (
          <li>Non-Reg: {formatCurrency(year.nonreg_balance)} (cap gains)</li>
        )}
      </ul>
    </div>

    <p className="mt-2 text-sm">
      To access TFSA earlier, try the <strong>"TFSA First"</strong> strategy.
    </p>
    <Button size="sm" onClick={() => setStrategy('tfsa-first')}>
      Switch to TFSA First
    </Button>
  </Alert>
)}
```

**Files to Modify**:
1. `webapp/components/simulation/ResultsDashboard.tsx` - Enhanced gap messaging
2. `webapp/components/simulation/YearCard.tsx` - Available funds breakdown
3. `webapp/lib/analysis/gapAnalysis.ts` - Gap detection logic (add available balance context)

**Success Metrics**:
- Users understand why gap exists (strategy choice, not bug)
- Reduced support tickets about "false gaps"
- Users switch strategies to access funds earlier (if desired)
- No more confusion about available balances

**Estimated Time**: 2-3 hours

---

## ⏸️ ON HOLD: Phase 3 - User Outreach (2 pts)

### US-071: Re-engagement Email Campaign (2 pts) - P1 🟡

**Status**: On hold until Phase 2 complete

**Target**: 19 active users with $20.6M in assets who haven't run simulations

**Why On Hold**: Don't want to bring users back until UX improvements are live (US-067, US-068, US-044)

**Revenue at Risk**: $456/year (if 50% convert to premium)

**Implementation Plan**:
1. Email template: "Your retirement plan is waiting"
2. Personalized asset summary from onboarding
3. Clear CTA: "Run Your Free Simulation"
4. Deploy AFTER US-067 + US-068 are live

---

## 🎁 STRETCH GOALS (6 pts) - Optional

### US-069: Simulation Validation with Error Messages (2 pts) - P2 🟢

**Problem**: Users can run simulation with incomplete data (silent failures).

**Solution**:
- Validate before running simulation
- Show red alert with specific errors (bulleted list)
- "Fix these issues" button links to relevant tab
- Disable button with tooltip if validation fails

**Validation Rules**:
- At least 1 asset OR 1 income source
- Retirement age >= current age
- Life expectancy > retirement age
- CPP start age valid (60-70)
- OAS start age valid (65-70)

**Estimated Time**: 2-3 hours

---

### US-070: Improve Simulation Loading State (1 pt) - P2 🟢

**Problem**: Generic "Loading..." doesn't show progress (users think page is frozen).

**Solution**:
- Progressive loading messages:
  - "Calculating income streams..." (0-30%)
  - "Optimizing withdrawals..." (30-60%)
  - "Computing taxes and benefits..." (60-90%)
  - "Finalizing results..." (90-100%)
- Progress bar (0% → 100%)
- Estimated time remaining
- 30-second timeout with error message

**Estimated Time**: 1-2 hours

---

### US-053: Optimize Dashboard Query (JWT Caching) (3 pts) - P1 🟡

**Problem**: Dashboard layout query slow (JWT validation on every request).

**Solution**:
- Implement JWT caching layer
- Cache user session for 5 minutes
- Reduce database round trips
- Target: <200ms response time

**Estimated Time**: 3-4 hours

**Note**: Moved from Sprint 7 (deferred due to critical bugs)

---

## 📊 Sprint 8 Summary

### Completed (13/21 pts = 62%)
- ✅ Phase 1: All critical simulation bugs fixed
- ✅ Real estate features working end-to-end
- ✅ Employment income bug fixed
- ✅ Rental income auto-stop working

### Remaining (8 pts)
- 📋 Phase 2: UX Improvements (5 pts committed)
  - US-067: Post-onboarding redirect (2 pts)
  - US-068: Empty state (1 pt)
  - US-044: Gap messaging (2 pts)
- ⏸️ Phase 3: User outreach (2 pts on hold)
- 🎁 Stretch goals: (6 pts optional)

### Next Steps
1. **US-067** - Post-onboarding redirect (2-3 hours) ← Start here
2. **US-068** - Empty state (1-2 hours)
3. **US-044** - Gap messaging (2-3 hours)
4. **Deploy Phase 2** - Push to production
5. **US-071** - Re-engagement email (after Phase 2 live)

### Success Criteria
- ✅ All simulation accuracy bugs fixed
- ⏳ New user conversion >80% (vs current 0%)
- ⏳ 19 users re-engaged (at least 5/19 run simulations)
- ⏳ Cash flow gap messaging clear and helpful

---

## 🚀 Deployment Status

**Production Deployed** (February 4, 2026):
- Commit bc9a36f: US-075 (Real Estate UI → Simulation)
- Commit 197a816: Sprint 8 Day 4 progress report
- Commit 61a9c1f: US-074 (Auto-endAge for rental income)

**Vercel**: Auto-deployment in progress → https://retirezest.com

**Next Deployment**: After Phase 2 complete (US-067 + US-068 + US-044)

---

## 💡 Recommendations

### Priority Order (by Impact)
1. **US-067** (Post-onboarding redirect) - Highest impact, directly addresses 80% drop-off
2. **US-068** (Empty state) - Quick win, prevents confusion
3. **US-044** (Gap messaging) - Improves trust, reduces support tickets
4. **Deploy Phase 2** - Get improvements to production
5. **US-071** (Email campaign) - Re-engage 19 users AFTER UX is polished

### Time Estimate
- **Phase 2 Total**: 5-8 hours (all 3 stories)
- **With Testing**: 8-10 hours
- **With Documentation**: 10-12 hours

**Recommendation**: Complete Phase 2 in 1-2 days, then deploy and test before user outreach.

---

## 📝 Notes

- Phase 1 (critical bugs) took 4 days → 13 story points complete
- Phase 2 (UX improvements) should take 1-2 days → 5 story points
- User outreach (Phase 3) waits for UX polish
- Stretch goals are optional (add if time permits)

**Sprint 8 is 62% complete with all critical bugs fixed!** 🎉
