# Sprint Board - RetireZest Sprint 2

**Sprint**: Sprint 2
**Duration**: February 12 - February 25, 2026 (2 weeks)
**Sprint Goal**: Enable premium monetization and improve withdrawal strategy UX to reduce user churn
**Team Capacity**: 40 story points

---

## 🎯 Sprint Progress

**Committed**: 34 story points
**Completed**: 0 story points (0%)
**In Progress**: 0 story points (0%)
**To Do**: 34 story points (100%)

---

## 📊 Kanban Board

### 📋 To Do (34 pts)

#### US-024: Premium Account Verification & Payment Acceptance Testing [8 pts] 🔴 P0
**Owner**: Full Stack Team
**Blocked**: No
**Epic**: Epic 9 - Monetization & Revenue

As a product owner, I want comprehensive testing and verification of the Stripe premium subscription system so that users can successfully subscribe and access premium features without payment failures.

**Tasks**:
- [ ] Test Stripe checkout session creation
- [ ] Verify price IDs (monthly $5.99, yearly $47.00)
- [ ] Test subscription webhook handling
- [ ] Verify payment success flow
- [ ] Test payment failure scenarios
- [ ] Verify subscription status updates in database
- [ ] Test premium feature access control
- [ ] Verify cancellation flow
- [ ] Test subscription renewal
- [ ] Test invoice generation
- [ ] Verify webhook retry logic
- [ ] Document test results

**Acceptance Criteria**:
- [ ] Checkout session creates successfully
- [ ] Payment succeeds with test card (4242 4242 4242 4242)
- [ ] Payment fails with decline card (4000 0000 0000 0002)
- [ ] Subscription status updates in database
- [ ] Premium features unlock after payment
- [ ] Webhooks handle all 10+ event types
- [ ] Cancellation works correctly
- [ ] Invoice emails sent
- [ ] Error handling works for all failure modes
- [ ] Production deployment verified

**Technical Notes**:
Files to test:
- `webapp/app/(dashboard)/subscribe/page.tsx` - Checkout UI
- `webapp/lib/stripe.ts` - Stripe utilities
- `webapp/app/api/subscription/create-checkout/route.ts` - Session creation
- `webapp/app/api/webhooks/stripe/route.ts` - Webhook handling

**Why P0**: Revenue generation depends on working payment system. This is the most critical feature for business viability.

---

#### US-021: Configurable Investment Yields (TFSA/RRSP/RRIF) [8 pts] 🟡 P1
**Owner**: Full Stack Team
**Blocked**: No
**Epic**: Epic 3 - Investment & Account Configuration

As a user, I want to configure custom interest rates for my TFSA, RRSP, and RRIF accounts so that my retirement projections reflect my actual investment strategy and risk tolerance.

**Tasks**:
- [ ] Update Prisma schema with yield fields
- [ ] Create database migration
- [ ] Add yield input fields to asset forms (UI)
- [ ] Implement yield validation (range: -10% to 20%)
- [ ] Update simulation.py to use custom yields
- [ ] Add yield presets (Conservative 3%, Balanced 5%, Aggressive 7%)
- [ ] Create help documentation explaining yields
- [ ] Test with different yield scenarios
- [ ] Update API routes (create/update assets)
- [ ] Deploy to production

**Acceptance Criteria**:
- [ ] UI allows setting yield % for TFSA accounts
- [ ] UI allows setting yield % for RRSP accounts
- [ ] UI allows setting yield % for RRIF accounts
- [ ] Default yields pre-populated (5% balanced)
- [ ] Yields saved per account type
- [ ] Simulation engine uses custom yields
- [ ] Validation enforces -10% to 20% range
- [ ] Help text explains conservative vs aggressive yields

**Technical Notes**:
Current system uses hardcoded 5% default in `simulation.py`. Need to:
1. Add `yield_rate` field to Asset model
2. Update withdrawal calculations to use custom rates
3. Add preset buttons for quick selection

**User Impact**: High - Users want control over return assumptions. Different users have different risk profiles.

---

#### US-025: Improve Withdrawal Strategy Discoverability [3 pts] 🟡 P1
**Owner**: Frontend Team
**Blocked**: No
**Epic**: Epic 4 - UX Improvements

As a user, I want the withdrawal strategy selector to be more visible and prominent so that I understand it's an important decision that affects my retirement plan.

**Tasks**:
- [ ] Audit current strategy selector location and visibility
- [ ] Design mockup for improved UI
- [ ] Move selector to prominent location (above inputs or in hero section)
- [ ] Add visual emphasis (icon 🎯, border, background color)
- [ ] Update label to be clearer ("Withdrawal Strategy (Important)")
- [ ] Add tooltip explaining why strategy matters
- [ ] Test on mobile devices
- [ ] Update analytics to track strategy changes
- [ ] A/B test different UI approaches if possible

**Acceptance Criteria**:
- [ ] Strategy selector moved to more prominent location
- [ ] Visual hierarchy improved (larger, clearer label)
- [ ] Help icon/tooltip added explaining importance
- [ ] Strategy selector highlighted or emphasized
- [ ] Mobile view optimized for easy access
- [ ] User can easily find and change strategy
- [ ] Strategy selection tracked in analytics

**Technical Notes**:
File: `webapp/app/(dashboard)/simulation/page.tsx`
- Current strategy stored in `household.strategy`
- Default: "minimize-income"
- Suggested: Add Card component, icon, contextual help

**Why Important**: Ian Crawford (deleted user) couldn't find RRIF withdrawal option. Better discoverability prevents churn.

**Dependencies**: Works with US-026 and US-027 for complete UX improvement.

---

#### US-026: Display Current Strategy Selection in Strategy Selector [2 pts] 🟡 P1
**Owner**: Frontend Team
**Blocked**: No
**Epic**: Epic 4 - UX Improvements

As a user, I want to clearly see which withdrawal strategy is currently selected (e.g., "minimize-income") so that I know what strategy my simulation will use.

**Tasks**:
- [ ] Verify strategy value binding in UI component
- [ ] Ensure dropdown/select shows current value
- [ ] Map technical names to display names (e.g., "minimize-income" → "Income Minimization (GIS-Optimized)")
- [ ] Add visual indicator for default vs custom strategy
- [ ] Show current strategy in results header
- [ ] Test strategy persistence across page refreshes
- [ ] Update SimulationWizard if needed

**Acceptance Criteria**:
- [ ] Current strategy value visible in selector/dropdown
- [ ] Default "minimize-income" shows as selected
- [ ] User-selected strategy persists and displays correctly
- [ ] Strategy name displayed in human-readable format
- [ ] Visual confirmation when strategy is changed
- [ ] Current strategy shown in simulation results summary

**Technical Notes**:
Strategy mapping (from `simulation/page.tsx:762-772`):
```typescript
const strategyMap: Record<string, string> = {
  'minimize-income': 'Income Minimization (GIS-Optimized)',
  'balanced-income': 'Balanced Income',
  'early-rrif-withdrawal': 'Early RRIF Withdrawals (Income Splitting)',
  'max-tfsa-first': 'Maximize TFSA First',
};
```

**Dependencies**: Should implement together with US-025 for best UX.

---

#### US-027: Educational Guidance - Withdrawal Order to Save Taxes & Avoid Clawback [5 pts] 🟡 P1
**Owner**: Content Team + Frontend Team
**Blocked**: No
**Epic**: Epic 4 - UX Improvements

As a user, I want clear educational guidance about the optimal account withdrawal order (TFSA/RRSP/RRIF/NonReg) so that I can minimize taxes and avoid OAS/GIS clawback throughout my retirement.

**Tasks**:
- [ ] Research optimal withdrawal order strategies
- [ ] Create educational content outline
- [ ] Design visual diagram for withdrawal order
- [ ] Write clear explanations for each account type
- [ ] Document OAS clawback threshold (2026: ~$90,997)
- [ ] Document GIS income limits (2026: $22,272 single, $29,424 couple)
- [ ] Create examples with real numbers (3 scenarios)
- [ ] Design tooltip/modal component
- [ ] Implement contextual help integration
- [ ] Review content with tax professional or CPA
- [ ] User testing for clarity and comprehension
- [ ] Update documentation and help center

**Acceptance Criteria**:
- [ ] Educational tooltip/modal explains withdrawal order strategy
- [ ] Visual diagram shows recommended withdrawal sequence
- [ ] Explanation of tax implications for each account type
- [ ] Guidance on OAS clawback threshold and avoidance
- [ ] Guidance on GIS income limits and preservation
- [ ] Examples showing tax savings from optimal order
- [ ] Context-sensitive help based on user's assets
- [ ] Mobile-friendly educational content
- [ ] Links to CRA resources for verification
- [ ] Accessible to users of all financial literacy levels

**Technical Notes**:
**Withdrawal Order Best Practices**:

1. **Before Age 65 (Pre-OAS/GIS)**:
   - TFSA first (tax-free, no impact on benefits)
   - NonReg second (capital gains only 50% taxable)
   - RRSP/RRIF last (100% taxable)

2. **Age 65-71 (OAS Started, Pre-RRIF)**:
   - TFSA first (preserves GIS eligibility)
   - RRSP early withdrawals if income low (income splitting)
   - NonReg carefully (watch OAS clawback threshold)

3. **Age 72+ (RRIF Mandatory)**:
   - RRIF minimum required
   - TFSA to top up (avoid exceeding clawback threshold)
   - NonReg as needed

**Example Savings**:
Scenario: Couple, $600K assets, low pension income
- Poor order (RRSP first): $180K total tax, lose $45K GIS
- Optimal order (TFSA first): $120K total tax, keep $42K GIS
- **Savings: $60K + $42K = $102K over 30 years**

**User Impact**: Very High - Empowers users to make informed decisions worth tens of thousands of dollars.

**Dependencies**: Integrates with US-025 (strategy selector) and US-026 (current strategy display).

---

#### US-022: What-If Scenario Slider Testing & Fixes [5 pts] 🟡 P1
**Owner**: QA Team + Frontend Team
**Blocked**: No
**Epic**: Epic 6 - Testing & Quality

As a user, I want the What-If scenario sliders to work correctly and provide accurate simulation comparisons so that I can confidently explore different retirement scenarios.

**Tasks**:
- [ ] Test all 4 sliders (spending, retirement age, CPP age, OAS age)
- [ ] Verify slider value mapping (e.g., spending 50-150%, age -5 to +5)
- [ ] Test "Run What-If Scenario" button execution
- [ ] Verify results display shows accurate comparison
- [ ] Test health score delta calculation
- [ ] Test final estate delta calculation
- [ ] Test error handling for invalid scenarios
- [ ] Test reset button functionality
- [ ] Verify slider state persistence (no unexpected resets)
- [ ] Test edge cases (min/max values, boundary conditions)
- [ ] Fix any bugs discovered during testing
- [ ] Update documentation

**Acceptance Criteria**:
- [ ] All sliders respond correctly to user input
- [ ] Slider values map correctly to adjustments
- [ ] "Run What-If Scenario" button executes successfully
- [ ] Results display shows accurate comparison (original vs what-if)
- [ ] Health score delta calculated correctly
- [ ] Final estate delta calculated correctly
- [ ] Error handling works for invalid scenarios
- [ ] Reset button clears all adjustments
- [ ] Slider state persists during interaction

**Technical Notes**:
File: `webapp/components/simulation/WhatIfSliders.tsx`

Potential issues to investigate:
- Lines 43-45: Calculated values based on adjustments
- Lines 48-55: `checkHasChanges()` function accuracy
- Lines 198-207: Slider value mapping uses +5 offset

API endpoint: `/api/simulation/what-if`

**Why Important**: Users need reliable scenario exploration to make informed retirement decisions.

---

#### US-009: Onboarding - Skip Real Estate Step [3 pts] 🟢 P2
**Owner**: Frontend Team
**Blocked**: No
**Epic**: Epic 4 - UX Improvements

As a user without property, I want to skip the real estate onboarding step so that I can complete setup faster.

**Tasks**:
- [ ] Add "Skip for now" button to Step 6 (Real Estate)
- [ ] Implement skip logic (advance to next step)
- [ ] Update progress bar to show step as optional
- [ ] Ensure no validation errors when skipped
- [ ] Allow user to return and add real estate later
- [ ] Test skip flow end-to-end
- [ ] Update onboarding documentation

**Acceptance Criteria**:
- [ ] "Skip for now" button visible on Step 6
- [ ] Clicking skip advances to next step
- [ ] Can return to add real estate later
- [ ] Progress bar shows step as optional
- [ ] No validation errors when skipped

**Why Important**: 12 users currently stuck at Step 6 (86% complete). This is blocking conversions.

**Technical Notes**:
Files to modify:
- Onboarding wizard component
- Real estate step validation logic
- Progress tracking

---

## 📈 Burndown Chart (Text Version)

```
Story Points Remaining

34 |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
32 |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
30 |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
28 |■■■■■■■■■■■■■■■■■■■■■■■■■■■■
26 |■■■■■■■■■■■■■■■■■■■■■■■■■■
24 |■■■■■■■■■■■■■■■■■■■■■■■■
22 |■■■■■■■■■■■■■■■■■■■■■■
20 |■■■■■■■■■■■■■■■■■■■■
18 |■■■■■■■■■■■■■■■■■■
16 |■■■■■■■■■■■■■■■■
14 |■■■■■■■■■■■■■■
12 |■■■■■■■■■■■■
10 |■■■■■■■■■■
 8 |■■■■■■■■
 6 |■■■■■■
 4 |■■■■
 2 |■■
 0 |
   └─────────────────────────────────────────
   Day: 1  2  3  4  5  6  7  8  9  10
        ↑
      Start (Feb 12)

Ideal Burndown: 3.4 pts/day
Target: Complete all 34 pts by Feb 25
```

---

## 🔄 In Progress (0 pts)

*Sprint starts Feb 12 - stories will be moved here as work begins*

---

## ✅ Done (0 pts)

*Completed stories will appear here during sprint*

---

## 🚧 Blockers & Risks

### Current Blockers
**None** (Sprint not started yet)

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe API changes or issues | Low | High | Test thoroughly in sandbox, have rollback plan |
| Tax/CRA content review delays (US-027) | Medium | Medium | Start content writing early, have backup reviewer |
| Database migration issues (US-021) | Low | Medium | Test migration in staging first, have rollback script |
| User testing delays | Medium | Low | Schedule testing sessions in advance |

---

## 📅 Sprint Schedule

### Week 1: Feb 12 - Feb 18

| Day | Date | Focus | Events |
|-----|------|-------|--------|
| Wed | Feb 12 | Sprint Planning | Sprint 2 kickoff, team alignment |
| Thu | Feb 13 | US-024: Stripe testing | Daily standup |
| Fri | Feb 14 | US-021: Schema design | Daily standup |
| Mon | Feb 17 | US-025 + US-026: Strategy UX | Daily standup |
| Tue | Feb 18 | US-027: Content creation | Daily standup |

### Week 2: Feb 19 - Feb 25

| Day | Date | Focus | Events |
|-----|------|-------|--------|
| Wed | Feb 19 | US-022: What-If testing | Daily standup, Backlog refinement |
| Thu | Feb 20 | US-009: Skip button impl | Daily standup |
| Fri | Feb 21 | Integration testing | Daily standup |
| Mon | Feb 24 | Bug fixes & polish | Daily standup |
| Tue | Feb 25 | Final testing & docs | Sprint Review, Retrospective |

---

## 💬 Daily Standup Notes

### February 12, 2026

**Yesterday** (Sprint 1 ended):
- [Team to fill in]

**Today** (Sprint 2 starts):
- Sprint Planning
- Review Sprint 2 goals and stories
- Assign initial tasks

**Blockers**:
- None

**Notes**:
- Sprint 1 velocity will inform Sprint 3 planning
- Focus on revenue (US-024) and UX improvements

---

### February 13, 2026

**Yesterday**:
- [Team to fill in]

**Today**:
- [Team to fill in]

**Blockers**:
- [Team to fill in]

---

## 📊 Sprint Metrics

### Velocity
- **Committed**: 34 story points
- **Completed**: TBD (will track during sprint)
- **Sprint 1 Velocity**: [To be measured from Sprint 1 results]

### Quality Metrics
- **Bugs Found**: 0
- **Tests Written**: TBD
- **Test Pass Rate**: TBD
- **Code Review**: All changes to be reviewed

### Team Happiness
- **Morale**: TBD (check mid-sprint)
- **Collaboration**: TBD
- **Blockers**: 0 (as of planning)

---

## 🎯 Sprint Goals Review

### Primary Goal
🎯 Enable premium monetization and verify payment system works

### Secondary Goals
🎯 Improve withdrawal strategy UX to reduce user churn
🎯 Empower users with tax-saving educational guidance
🎯 Remove onboarding friction (12 users stuck)

### Success Criteria
- [ ] Premium subscription flow works end-to-end
- [ ] All payment test cases pass (success, failure, webhooks)
- [ ] Withdrawal strategy selector is prominent and clear
- [ ] Educational guidance helps users understand withdrawal order
- [ ] What-If sliders work reliably
- [ ] Users can skip real estate step
- [ ] All committed stories completed
- [ ] No critical bugs introduced
- [ ] Team morale remains high

---

## 📝 Sprint Retrospective (To be filled on Feb 25)

### What Went Well
- [Team to fill in after sprint]

### What Could Be Improved
- [Team to fill in after sprint]

### Action Items for Sprint 3
- [Team to fill in after sprint]

---

## 🔗 Quick Links

- **Product Backlog**: [AGILE_BACKLOG.md](AGILE_BACKLOG.md)
- **Sprint 1 Board**: [SPRINT_BOARD.md](SPRINT_BOARD.md)
- **GitHub Repo**: https://github.com/marcosclavier/retirezest
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 📋 Story Dependencies

```
US-024 (Premium Payments) - Independent, start immediately
    ↓
US-021 (Investment Yields) - Independent, can run parallel
    ↓
US-025 (Strategy Discoverability) ──┐
                                    ├─→ All integrate together
US-026 (Display Strategy) ──────────┤   for complete UX
                                    │
US-027 (Withdrawal Guidance) ───────┘
    ↓
US-022 (What-If Testing) - Independent, QA focus
    ↓
US-009 (Skip Real Estate) - Independent, quick win
```

**Recommended Execution Order**:
1. Start US-024 and US-021 in parallel (different teams)
2. Begin US-025, US-026, US-027 together (frontend/content collaboration)
3. QA starts US-022 mid-sprint
4. US-009 as quick win toward sprint end

---

**Sprint Status**: 📋 **PLANNED - Starts Feb 12, 2026**
**Total Stories**: 7
**Total Points**: 34 / 40 capacity (85% utilization)
**Last Updated**: January 29, 2026
**Next Standup**: February 12, 2026 @ 9:00 AM
**Sprint Review**: February 25, 2026 @ 2:00 PM
**Retrospective**: February 25, 2026 @ 3:00 PM
