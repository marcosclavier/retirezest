# RetireZest - Agile Product Backlog

**Last Updated**: January 29, 2026 (Added US-038: Dashboard UX Investigation from user feedback)
**Product Owner**: JRCB
**Development Team**: RetireZest Team
**Sprint Duration**: 2 weeks

---

## 📋 Table of Contents

1. [Current Sprint](#current-sprint-sprint-1---jan-29---feb-11-2026)
2. [Product Backlog](#product-backlog)
3. [Epic Breakdown](#epics)
4. [User Story Template](#user-story-template)
5. [Definition of Done](#definition-of-done)
6. [Sprint Planning](#sprint-planning-process)

---

## 🎯 Current Sprint: Sprint 1 - Jan 29 - Feb 11, 2026

**Sprint Goal**: Monitor re-engagement campaign results and prevent future user churn

### Sprint Backlog

| ID | User Story | Story Points | Status | Assignee |
|----|------------|--------------|--------|----------|
| US-001 | Monitor re-engagement email campaign | 3 | ✅ Done | Team |
| US-002 | Track user reactivations from campaign | 5 | 🔄 In Progress | Team |
| US-003 | Implement database migration for pension indexing | 8 | 📋 To Do | Team |
| US-004 | Fix Resend API email ID tracking | 2 | 📋 To Do | Team |
| US-005 | Create admin dashboard for deletion analytics | 13 | 📋 Backlog | Team |

**Total Story Points**: 31 / 40 (Sprint Capacity)
**Velocity**: TBD (first sprint)

**Sprint Board**: [SPRINT_BOARD.md](SPRINT_BOARD.md)

---

## 🎯 Current Sprint: Sprint 2 - Complete! ✅

**Sprint Goal**: Enable premium monetization and improve withdrawal strategy UX to reduce user churn

**Status**: ✅ 105% Complete (21/20 pts) - Exceeded commitment!

---

## 🎯 Next Sprint: Sprint 3 - January 30 - February 12, 2026

**Sprint Goal**: Improve onboarding UX and validate simulation accuracy while establishing reliable sprint processes

**Sprint Planning Date**: January 29, 2026
**Pre-Sprint Verification**: ✅ Complete (AI-2.3 process followed)

### Sprint 3 Backlog

| ID | User Story | Story Points | Priority | Epic | Status |
|----|------------|--------------|----------|------|--------|
| US-009 | Onboarding - Skip Real Estate Step | 3 | P2 🟢 | Epic 4: UX | 📋 To Do |
| US-013 | RRIF Strategy Validation | 8 | P1 🟡 | Epic 5: Simulation | 📋 To Do |
| US-003 | Database Migration - Pension Indexing (Backend) | 8 | P1 🟡 | Epic 1: Retention | 📋 To Do |
| AI-2.7 | E2E Test for Withdrawal Strategy Selector | 3 | P1 🟡 | Epic 6: Testing | 📋 To Do |

**Total Story Points**: 22 committed / 40 capacity (55% utilization - conservative + stretch goals)
**Core Commitment**: 11 pts (US-009 + US-013)
**Stretch Goals**: 11 pts (US-003 + AI-2.7)

**Sprint Board**: [SPRINT_3_BOARD.md](SPRINT_3_BOARD.md)
**Pre-Planning Report**: [SPRINT_3_PRE_PLANNING_VERIFICATION.md](SPRINT_3_PRE_PLANNING_VERIFICATION.md)

**Key Focus Areas**:
- ✅ Onboarding: Unblock 12 users stuck at Step 6 (US-009)
- ✅ Accuracy: Validate RRIF strategies against CRA rules (US-013)
- ✅ Completion: Finish pension indexing backend (US-003)
- ✅ Quality: Prevent withdrawal strategy regressions (AI-2.7)
- ✅ Process: Enforce backlog hygiene (AI-2.2)

**Key Learnings from Sprint 2**:
- ✅ Pre-sprint verification prevents duplicate work (discovered US-022 complete)
- ✅ Small stories (1-3 pts) have higher success rate
- ✅ Conservative planning (50-60% capacity) improves quality
- ✅ Git history check is CRITICAL before starting work

---

## 🎯 Previous Sprint: Sprint 2 - Complete! ✅

**Sprint Goal**: Enable premium monetization and improve withdrawal strategy UX to reduce user churn

### Sprint 2 Backlog

| ID | User Story | Story Points | Priority | Epic | Status |
|----|------------|--------------|----------|------|--------|
| US-024 | Premium Account Verification & Payment Testing | 8 | P0 🔴 | Epic 9: Monetization | ✅ Done |
| BUILD-FIX | Fix Build Warnings & Vulnerabilities | 2 | P1 🟡 | Epic 6: Testing | ✅ Done |
| US-025 | Improve Withdrawal Strategy Discoverability | 3 | P1 🟡 | Epic 4: UX | ✅ Done |
| US-026 | Display Current Strategy Selection | 2 | P1 🟡 | Epic 4: UX | ✅ Done |
| US-029 | Fix Default Withdrawal Strategy | 1 | P0 🔴 | Epic 4: UX | ✅ Done |
| US-022 | What-If Scenario Slider Testing & Fixes | 5 | P1 🟡 | Epic 6: Testing | ✅ Done |
| US-027 | Educational Guidance - Withdrawal Order | 5 | P1 🟡 | Epic 4: UX | 📋 To Do |
| US-009 | Onboarding - Skip Real Estate Step | 3 | P2 🟢 | Epic 4: UX | 📋 To Do |
| US-021 | Configurable Investment Yields | 8 | P1 🟡 | Epic 3: Investment | 📋 Deferred |

**Total Story Points**: 20 committed / 40 capacity (50% utilization - conservative sprint)
**Completed**: 21 pts (105%!) - BUILD-FIX (2), US-024 (8), US-025 (3), US-026 (2), US-029 (1), US-022 (5)
**Note**: US-022 completed on Jan 29, 2026 (commit 2487294) but discovered during Sprint 3 planning
**Estimated Velocity**: Will be based on Sprint 1 completion

**Sprint Board**: [SPRINT_2_BOARD.md](SPRINT_2_BOARD.md)

**Key Focus Areas**:
- ✅ Revenue: Verify premium subscription system works (US-024)
- ✅ User Control: Allow custom investment return assumptions (US-021)
- ✅ Churn Prevention: Make withdrawal strategies more discoverable (US-025, US-026, US-027)
- ✅ Quality: Ensure What-If scenarios work correctly (US-022)
- ✅ Onboarding: Remove friction for users without real estate (US-009)

---

## 📚 Product Backlog

### High Priority (Next 1-2 Sprints)

#### Epic 1: User Retention & Engagement

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-001** | **Monitor Re-engagement Campaign** | **3** | **P0** | **✅ Done** |
| **Description** | As a product manager, I want to monitor the re-engagement email campaign results so that I can measure the effectiveness of our user recovery efforts |
| **Acceptance Criteria** | - [ ] Resend dashboard checked daily for opens/clicks<br>- [ ] Database queried for user logins<br>- [x] Email delivery confirmed (4/4 sent)<br>- [ ] Week 1 metrics documented |
| **Tasks** | - [x] Check Resend dashboard<br>- [ ] Run query_deleted_users.js daily<br>- [ ] Document open rates<br>- [ ] Document click rates<br>- [ ] Count reactivations |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-002** | **Track User Reactivations** | **5** | **P0** | **🔄 In Progress** |
| **Description** | As a product manager, I want to automatically track which deleted users reactivate their accounts so that I can measure campaign ROI |
| **Acceptance Criteria** | - [ ] Automated script checks for logins after email sent<br>- [ ] Dashboard shows reactivation status by user<br>- [ ] Conversion rate calculated automatically<br>- [ ] Results logged for future analysis |
| **Tasks** | - [x] Create query_deleted_users.js script<br>- [ ] Add reactivation tracking logic<br>- [ ] Create weekly report automation<br>- [ ] Build simple dashboard view |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-003** | **Database Migration - Pension Indexing** | **8** | **P1** | **📋 To Do** |
| **Description** | As a user, I want my pension indexing checkbox selection to be saved so that my retirement projections are accurate over time |
| **Acceptance Criteria** | - [ ] Prisma schema updated with inflationIndexed field<br>- [ ] Migration runs successfully in production<br>- [ ] API routes save/retrieve inflationIndexed value<br>- [ ] Existing pensions default to true<br>- [ ] UI checkbox state persists after save |
| **Tasks** | - [ ] Update Prisma schema<br>- [ ] Create migration file<br>- [ ] Test migration locally<br>- [ ] Update API routes (create, update, read)<br>- [ ] Test end-to-end flow<br>- [ ] Deploy to production |
| **Technical Notes** | Frontend already implemented in commit 997c924. Only backend persistence needed. |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-004** | **Fix Resend Email ID Tracking** | **2** | **P2** | **📋 To Do** |
| **Description** | As a developer, I want to properly capture Resend email IDs so that I can track individual email delivery and status |
| **Acceptance Criteria** | - [ ] Email IDs properly extracted from Resend API response<br>- [ ] IDs logged to database or file<br>- [ ] Can query email status by ID<br>- [ ] Documentation updated with correct API usage |
| **Tasks** | - [ ] Debug Resend API response format<br>- [ ] Update send_reengagement_emails.js<br>- [ ] Test email sending<br>- [ ] Verify ID capture<br>- [ ] Update documentation |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-005** | **Admin Dashboard - Deletion Analytics** | **13** | **P2** | **📋 Backlog** |
| **Description** | As a product manager, I want a dashboard showing deletion trends and reasons so that I can proactively identify and fix UX issues |
| **Acceptance Criteria** | - [ ] Dashboard shows deletion rate over time<br>- [ ] Chart displays deletion reasons breakdown<br>- [ ] Metrics show same-day deletion rate<br>- [ ] Compare before/after UX fixes<br>- [ ] Export data to CSV |
| **Tasks** | - [ ] Design dashboard UI mockup<br>- [ ] Create API endpoints for metrics<br>- [ ] Build chart components<br>- [ ] Add filters (date range, reason)<br>- [ ] Implement CSV export<br>- [ ] Add access control (admin only) |

---

#### Epic 2: French Language Support

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-006** | **French Translation - Core App** | **21** | **P3** | **📋 Backlog** |
| **Description** | As a French-speaking Canadian user, I want to use RetireZest in French so that I can comfortably plan my retirement in my native language |
| **Acceptance Criteria** | - [ ] All UI text translated to French<br>- [ ] Language toggle in settings<br>- [ ] User preference saved<br>- [ ] Email templates in French<br>- [ ] Documentation in French |
| **Tasks** | - [ ] Audit all UI strings<br>- [ ] Set up i18n framework (next-i18next)<br>- [ ] Create translation files<br>- [ ] Hire/contract translator<br>- [ ] Translate all strings<br>- [ ] Add language selector<br>- [ ] Test all pages in French<br>- [ ] Update onboarding flow |
| **Impact** | Could recover Maurice Poitras + 22% of Canadian market (Quebec) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-007** | **Quebec Tax Rules** | **13** | **P3** | **📋 Backlog** |
| **Description** | As a Quebec resident, I want accurate tax calculations using Quebec provincial tax rates so that my retirement projections are realistic |
| **Acceptance Criteria** | - [ ] Quebec tax brackets implemented<br>- [ ] QPP (Quebec Pension Plan) vs CPP calculations<br>- [ ] Provincial credits calculated correctly<br>- [ ] Tax forms reference Quebec tax system<br>- [ ] Validation against Revenu Québec |
| **Tasks** | - [ ] Research Quebec tax rates<br>- [ ] Implement Quebec tax calculation<br>- [ ] Add province selector to profile<br>- [ ] Update simulation engine<br>- [ ] Test with Quebec scenarios<br>- [ ] Validate against official calculators |

---

---

#### Epic 3: Investment & Account Configuration

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-021** | **Configurable Investment Yields (TFSA/RRSP/RRIF)** | **8** | **P1** | **📋 To Do** |
| **Description** | As a user, I want to configure custom interest rates for my TFSA, RRSP, and RRIF accounts so that my retirement projections reflect my actual investment strategy and risk tolerance |
| **Acceptance Criteria** | - [ ] UI allows setting yield % for TFSA accounts<br>- [ ] UI allows setting yield % for RRSP accounts<br>- [ ] UI allows setting yield % for RRIF accounts<br>- [ ] Default yields pre-populated (e.g., 5% balanced portfolio)<br>- [ ] Yields saved per account type<br>- [ ] Simulation engine uses custom yields<br>- [ ] Validation: yields between -10% and 20%<br>- [ ] Help text explains conservative vs aggressive yields |
| **Tasks** | - [ ] Add yield fields to Asset model (Prisma schema)<br>- [ ] Update database migration<br>- [ ] Add yield input fields to asset forms<br>- [ ] Implement yield validation (range check)<br>- [ ] Update simulation.py to use custom yields<br>- [ ] Add yield presets (Conservative 3%, Balanced 5%, Aggressive 7%)<br>- [ ] Create help documentation explaining yields<br>- [ ] Test with different yield scenarios<br>- [ ] Update API routes (create/update assets) |
| **Technical Notes** | Current system uses hardcoded 5% default. Need to make it configurable per account. |
| **User Impact** | High - Users want control over return assumptions. Different users have different risk profiles. |
| **Examples** | - Conservative investor: TFSA 3%, RRSP 3%, RRIF 3%<br>- Balanced investor: TFSA 5%, RRSP 5%, RRIF 5%<br>- Aggressive investor: TFSA 7%, RRSP 7%, RRIF 7%<br>- Mixed strategy: TFSA 6% (stocks), RRSP 4% (bonds), RRIF 4% (conservative) |

---

#### Epic 4: UX Improvements

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-008** | **Guided Wizard - Pre-fill from Profile** | **5** | **P1** | **✅ Done** |
| **Description** | As a user, I want the simulation wizard to pre-fill with my saved profile data so that I don't have to re-enter information I've already provided |
| **Acceptance Criteria** | - [x] Wizard loads profile data on initialization<br>- [x] Assets, income, expenses auto-populated<br>- [x] User can override pre-filled values<br>- [x] No errors during data loading |
| **Status** | Completed in commit 4ba194b |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-009** | **Onboarding - Skip Real Estate Step** | **3** | **P2** | **📋 To Do** |
| **Description** | As a user without property, I want to skip the real estate onboarding step so that I can complete setup faster |
| **Acceptance Criteria** | - [ ] "Skip for now" button visible on Step 6<br>- [ ] Clicking skip advances to next step<br>- [ ] Can return to add real estate later<br>- [ ] Progress bar shows step as optional<br>- [ ] No validation errors when skipped |
| **Impact** | 12 users currently stuck at Step 6 (86% complete) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-010** | **Default Withdrawal Strategy Update** | **2** | **P0** | **✅ Done** |
| **Description** | As a user, I want the default withdrawal strategy to be "minimize-income" so that I get tax-optimized results by default |
| **Acceptance Criteria** | - [x] Default strategy changed to minimize-income<br>- [x] Existing users unaffected<br>- [x] New users see minimize-income selected<br>- [x] Help text updated |
| **Status** | Completed in commit 81fcb19 |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-025** | **Improve Withdrawal Strategy Discoverability** | **3** | **P1** | **✅ Done** |
| **Description** | As a user, I want the withdrawal strategy selector to be more visible and prominent so that I understand it's an important decision that affects my retirement plan |
| **Acceptance Criteria** | - [x] Strategy selector moved to more prominent location<br>- [x] Visual hierarchy improved (larger, clearer label)<br>- [x] Help icon/tooltip added explaining importance<br>- [x] Strategy selector highlighted or emphasized (border, icon, etc.)<br>- [x] Mobile view optimized for easy access<br>- [x] User can easily find and change strategy<br>- [x] Strategy selection tracked in analytics |
| **Tasks** | - [x] Audit current strategy selector location and visibility<br>- [x] Design mockup for improved UI<br>- [x] Move selector to prominent location (visually separated)<br>- [x] Add visual emphasis (Target icon 🎯, blue border, background color)<br>- [x] Update label to be clearer ("Withdrawal Strategy" with subtitle)<br>- [x] Add tooltip explaining why strategy matters<br>- [x] Test on mobile devices<br>- [x] Responsive layout maintained |
| **Technical Notes** | **Implementation (commit 0a4dc70):**<br>- Added prominent blue border (2px) and background (blue-50/30)<br>- Added Target icon (🎯) for visual emphasis<br>- Increased font sizes (text-base font-semibold)<br>- Taller select trigger (min-h-[48px])<br>- Added explanatory text: "Critical decision: How to withdraw from accounts to optimize taxes and benefits"<br>- Added tip: "💡 Tip: Income Minimization (GIS-Optimized) preserves government benefits"<br>- File: `webapp/components/simulation/HouseholdForm.tsx` (+38 lines) |
| **User Impact** | Medium-High - Ian Crawford (deleted user) specifically mentioned "early RRIF withdrawals for wife with no income" which is a strategy option. Better discoverability prevents user frustration and account deletions. ✅ Now impossible to miss due to visual prominence. |
| **Dependencies** | - US-010 (Default strategy) - already completed<br>- US-026 (Display current strategy) - completed |
| **Completion** | ✅ Completed January 29, 2026 in commit 0a4dc70. Strategy selector now has prominent blue border, Target icon, larger fonts, and helpful messaging. All 6 acceptance criteria met. |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-026** | **Display Current Strategy Selection in Strategy Selector** | **2** | **P1** | **✅ Done** |
| **Description** | As a user, I want to clearly see which withdrawal strategy is currently selected (e.g., "minimize-income") so that I know what strategy my simulation will use |
| **Acceptance Criteria** | - [x] Current strategy value visible in selector/dropdown<br>- [x] Default "minimize-income" shows as selected<br>- [x] User-selected strategy persists and displays correctly<br>- [x] Strategy name displayed in human-readable format<br>- [x] Visual confirmation when strategy is changed<br>- [x] Current strategy shown in simulation results summary |
| **Tasks** | - [x] Verify strategy value binding in UI component<br>- [x] Ensure dropdown/select shows current value<br>- [x] Map technical names to display names (e.g., "minimize-income" → "Income Minimization (GIS-Optimized)")<br>- [x] Add visual indicator for default vs custom strategy<br>- [x] Show current strategy in results header<br>- [x] Test strategy persistence across page refreshes<br>- [x] Update SimulationWizard if needed |
| **Technical Notes** | Strategy mapping (from simulation/page.tsx:762-772):<br>```typescript<br>const strategyMap: Record<string, string> = {<br>  'minimize-income': 'Income Minimization (GIS-Optimized)',<br>  'balanced-income': 'Balanced Income',<br>  'early-rrif-withdrawal': 'Early RRIF Withdrawals (Income Splitting)',<br>  'max-tfsa-first': 'Maximize TFSA First',<br>  // ... other mappings<br>};<br>```<br><br>Ensure selector component uses this mapping to show friendly names. |
| **User Impact** | Medium - Users need clear feedback about which strategy they're using. Confusion about strategy selection leads to unexpected results and reduced trust in the tool. |
| **Dependencies** | - US-010 (Default strategy) - already completed<br>- US-025 (Improved discoverability) - should implement together for best UX |
| **Completion** | ✅ Completed January 29, 2026. See US-026_COMPLETION_REPORT.md |
| **Known Issues** | ✅ **Bug Fixed**: Default strategy was "balanced" instead of "minimize-income". Fixed in US-029. |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-029** | **Fix Default Withdrawal Strategy to minimize-income** | **1** | **P0** | **✅ Done** |
| **Description** | As a GIS-eligible retiree, I want the default withdrawal strategy to be "Income Minimization (GIS-Optimized)" so that I immediately understand the tool is designed to preserve government benefits |
| **Acceptance Criteria** | - [x] Default strategy in `defaultHouseholdInput` is `'minimize-income'`<br>- [x] Prefill API fallback strategy is `'minimize-income'` (not 'balanced')<br>- [x] Default indicator shows "(Default)" for minimize-income in results<br>- [x] Strategy selector shows "Income Minimization (GIS-Optimized)" when page loads<br>- [x] Smart recommendation logic still overrides for users with specific asset mixes<br>- [x] Manual test: New user with no profile sees minimize-income<br>- [x] Manual test: User with typical portfolio sees minimize-income |
| **Tasks** | - [x] Change default in `/webapp/lib/types/simulation.ts` line 565 from 'corporate-optimized' to 'minimize-income'<br>- [x] Change prefill API fallback in `/webapp/app/api/simulation/prefill/route.ts` line 480 from 'balanced' to 'minimize-income'<br>- [x] Change prefill API default for typical retiree in `/webapp/app/api/simulation/prefill/route.ts` line 525 from 'balanced' to 'minimize-income'<br>- [x] Test with new user profile (no assets)<br>- [x] Test with typical mixed portfolio<br>- [x] Verify smart recommendation still works for RRIF>40%, corporate>30%, etc.<br>- [x] Deploy to production |
| **Technical Notes** | **Root Cause**:<br>1. `defaultHouseholdInput.strategy` is set to 'corporate-optimized' (line 565 of simulation.ts)<br>2. Prefill API uses 'balanced' as fallback (line 480 of prefill/route.ts)<br>3. Prefill API uses 'balanced' for typical retirees (line 525)<br><br>**Fix**: Change all three locations to 'minimize-income'<br><br>**Why minimize-income?**<br>- GIS optimization is core product differentiator<br>- Benefits majority of Canadian retirees (OAS clawback avoidance)<br>- Safe default that works well for low/moderate income users<br>- Users can still select other strategies if needed<br><br>**Files to modify**:<br>1. `/webapp/lib/types/simulation.ts` (line 565)<br>2. `/webapp/app/api/simulation/prefill/route.ts` (lines 480, 525) |
| **User Impact** | **CRITICAL** - This bug affects ALL users and contributed to account deletions. Ian Crawford said "withdrawal strategies were not discoverable" - seeing "Balanced" instead of "Income Minimization (GIS-Optimized)" hides the GIS optimization feature entirely. Fixing this will immediately improve user understanding and trust. |
| **Bug Report** | See `US-026_BUG_REPORT.md` for detailed root cause analysis and evidence |
| **Dependencies** | - US-026 (completed) - UI now shows strategy correctly, just need to fix default value |
| **Priority Justification** | P0 (Critical) - This is a fundamental product issue that:<br>1. Hides core value proposition (GIS optimization)<br>2. Confuses users about strategy selection<br>3. Contributed to user account deletions<br>4. Affects 100% of new users<br>5. Simple 3-line fix with high impact |
| **Completion** | ✅ Completed January 29, 2026. See US-029_COMPLETION_REPORT.md. Changed 3 lines of code to fix default strategy. |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-038** | **Investigate & Fix Dashboard UX Issues (Low User Satisfaction)** | **5** | **P0** | **📋 To Do** |
| **Description** | As a product owner, I want to investigate why a user gave 1/5 satisfaction score on the dashboard and fix the underlying UX issues so that users have a positive experience with the dashboard |
| **User Feedback** | **Source**: UserFeedback database (ID: 1b6410b0-f96b-4ecc-8320-a6d92aebd61d)<br>**User**: rightfooty218@gmail.com (Ontario, free tier, 2 simulations run)<br>**Date**: January 29, 2026<br>**Satisfaction Score**: 1/5 ⚠️ (Lowest possible - indicates severe dissatisfaction)<br>**Priority**: 4 (High - automatically escalated due to low satisfaction)<br>**Feedback Type**: dashboard<br>**Trigger**: dashboard_feedback_panel at https://www.retirezest.com/dashboard<br>**Missing Features**: Empty array (no specific features checked)<br>**Comments**: None provided (incomplete feedback form)<br><br>**Critical Signal**: User gave lowest possible satisfaction score but provided no specific details. This indicates a serious UX problem that prevented user from even completing the feedback form. |
| **Acceptance Criteria** | **Investigation Phase:**<br>- [ ] Review dashboard UI/UX for major pain points<br>- [ ] Analyze user's profile and simulation history (rightfooty218@gmail.com)<br>- [ ] Check for technical errors in user's session (browser console, API logs)<br>- [ ] Review dashboard feedback panel usability (is it too complex?)<br>- [ ] Compare dashboard with best practices (loading time, navigation, clarity)<br>- [ ] Identify if issue is general or user-specific<br><br>**User Outreach (Optional):**<br>- [ ] Send follow-up email to rightfooty218@gmail.com asking for details<br>- [ ] Offer 1:1 call to understand frustration<br>- [ ] Track if user responds<br><br>**Fix Phase:**<br>- [ ] Implement fixes for identified issues<br>- [ ] Improve feedback form completion rate (make it easier)<br>- [ ] Add more specific feedback prompts (what was frustrating?)<br>- [ ] Test fixes with similar user profile<br>- [ ] Monitor satisfaction scores after deployment<br><br>**Prevention:**<br>- [ ] Add analytics to track dashboard interactions<br>- [ ] Set up alerts for low satisfaction scores (≤2)<br>- [ ] Create dashboard UX monitoring checklist<br>- [ ] Consider A/B testing for dashboard improvements |
| **Tasks** | **Week 1: Investigation (12 hours)**<br>- [ ] Query user's simulation history from database<br>- [ ] Review user's dashboard interactions (if analytics available)<br>- [ ] Check for API errors or performance issues in user's session<br>- [ ] Audit dashboard UI/UX:<br>  - [ ] Information architecture (is it clear?)<br>  - [ ] Navigation (can user find what they need?)<br>  - [ ] Visual hierarchy (is important info prominent?)<br>  - [ ] Loading performance (is it slow?)<br>  - [ ] Mobile responsiveness (does it work on phone?)<br>  - [ ] Error messages (are they helpful?)<br>  - [ ] Empty states (what if no simulations?)<br>  - [ ] Call-to-action clarity (what should user do next?)<br>- [ ] Compare with competitor dashboards (Wealthsimple, Questrade, etc.)<br>- [ ] Create issue report with findings<br><br>**Week 2: User Outreach (2 hours)**<br>- [ ] Draft personalized email to rightfooty218@gmail.com<br>- [ ] Express concern and desire to improve<br>- [ ] Ask specific questions about their experience<br>- [ ] Offer 15-minute call or detailed email response<br>- [ ] Track response and follow up<br><br>**Week 3: Fixes (8 hours)**<br>- [ ] Prioritize fixes based on investigation<br>- [ ] Implement quick wins (low-hanging fruit)<br>- [ ] Redesign problematic UI elements<br>- [ ] Improve feedback form:<br>  - [ ] Add "What frustrated you most?" open text field (required)<br>  - [ ] Simplify form (fewer questions = higher completion)<br>  - [ ] Add visual indicators (progress bar, "almost done")<br>  - [ ] Make submit button more prominent<br>- [ ] Add dashboard tour for first-time users<br>- [ ] Test fixes with free tier users<br><br>**Week 4: Monitoring (2 hours)**<br>- [ ] Deploy fixes to production<br>- [ ] Monitor satisfaction scores for 2 weeks<br>- [ ] Set up dashboard analytics (Mixpanel, Amplitude, or GA4)<br>- [ ] Create alert for satisfaction ≤2 (email notification)<br>- [ ] Document learnings and best practices |
| **Technical Notes** | **Feedback System Analysis:**<br><br>**Priority Calculation** (from `/webapp/app/api/feedback/submit/route.ts` lines 191-223):<br>```typescript<br>function calculatePriority(feedback, subscriptionTier): number {<br>  let score = 3; // Base priority<br>  if (feedback.satisfactionScore <= 2) score += 1; // +1 for low satisfaction<br>  if (feedback.npsScore <= 6) score += 1; // +1 for detractors<br>  if (subscriptionTier === 'premium') score += 1; // +1 for premium<br>  return Math.min(score, 5); // Cap at 5<br>}<br>```<br>**Why priority 4?** User gave 1/5 satisfaction (≤2), which adds +1 to base priority of 3 = 4<br><br>**Feedback Form Location:**<br>- Component: `/webapp/components/dashboard/DashboardFeedbackPanel.tsx`<br>- Triggered from: `/webapp/app/dashboard/page.tsx`<br>- API endpoint: `/webapp/app/api/feedback/submit/route.ts`<br><br>**User Profile Query:**<br>```sql<br>SELECT u.email, u.createdAt, u.subscriptionTier,<br>       s.id, s.scenarioName, s.householdInput, s.result<br>FROM User u<br>LEFT JOIN Scenario s ON u.id = s.userId<br>WHERE u.email = 'rightfooty218@gmail.com'<br>ORDER BY s.createdAt DESC;<br>```<br><br>**Dashboard Components to Review:**<br>1. `/webapp/app/dashboard/page.tsx` - Main dashboard page<br>2. `/webapp/components/dashboard/ScenarioList.tsx` - List of scenarios<br>3. `/webapp/components/dashboard/ProfileSummary.tsx` - User profile card<br>4. `/webapp/components/dashboard/QuickActions.tsx` - Action buttons<br>5. `/webapp/components/dashboard/DashboardFeedbackPanel.tsx` - Feedback form<br><br>**Potential Issues to Investigate:**<br>1. **Empty State**: If user has no/few simulations, is dashboard confusing?<br>2. **Navigation**: Can user easily start new simulation or view results?<br>3. **Performance**: Does dashboard load slowly (API calls, large data)?<br>4. **Mobile UX**: Is dashboard broken or hard to use on mobile?<br>5. **Feedback Form**: Is form too long/complex causing abandonment?<br>6. **Visual Design**: Is UI cluttered, confusing, or unprofessional?<br>7. **Error Handling**: Did user encounter errors that weren't handled well?<br>8. **Onboarding**: Does dashboard assume user knowledge they don't have?<br><br>**Similar Feedback Check:**<br>```bash<br>DATABASE_URL="..." node query_user_feedback.js | grep "Satisfaction: [12]/5"<br># Check if other users also gave low scores<br>```<br><br>**Analytics to Add:**<br>- Track dashboard page views<br>- Track time on dashboard<br>- Track clicks on action buttons<br>- Track feedback form starts vs completions<br>- Track satisfaction scores distribution<br>- Track user flow (where do they go from dashboard?)<br><br>**Dashboard Best Practices:**<br>- Clear hierarchy (most important info first)<br>- Quick actions above the fold<br>- Visual progress indicators<br>- Helpful empty states ("Get started by...")<br>- Fast loading (<2 seconds)<br>- Mobile-first responsive design<br>- Clear calls-to-action<br>- Contextual help/guidance |
| **User Impact** | **CRITICAL** - A 1/5 satisfaction score is the strongest negative signal possible. This user was so frustrated they couldn't even complete the feedback form. This likely indicates a systemic UX problem affecting multiple users (but only 1 brave enough to give feedback). Fixing dashboard UX is critical for user retention and word-of-mouth. |
| **Root Cause Hypothesis** | Based on incomplete feedback (no comments, no features selected), possible root causes:<br><br>1. **Dashboard is overwhelming/confusing** - User couldn't figure out what to do<br>2. **Feedback form is too complex** - User gave up before completing<br>3. **Technical error** - User encountered bug/error that broke experience<br>4. **Mobile UX broken** - Dashboard doesn't work on user's device<br>5. **Missing expected features** - User expected something that doesn't exist<br>6. **Poor onboarding** - User landed on dashboard without context<br>7. **Performance issues** - Dashboard too slow, user frustrated<br>8. **Empty state problem** - User has no data, dashboard unhelpful<br><br>**Most Likely**: Dashboard is confusing/overwhelming for new users with few simulations (user only ran 2 simulations). Empty/sparse dashboard may not guide user on what to do next. |
| **Dependencies** | - Access to user's simulation data (rightfooty218@gmail.com)<br>- Analytics tools (Mixpanel, Amplitude, or GA4) - optional but recommended<br>- Email sending capability (Resend API already set up)<br>- Dashboard UI components (existing) |
| **Priority Justification** | **P0 (Critical)** because:<br>1. **Strongest negative signal** - 1/5 is rock bottom satisfaction<br>2. **High priority by algorithm** - System flagged as priority 4<br>3. **User retention risk** - Dissatisfied users churn and don't return<br>4. **Word-of-mouth risk** - Negative experiences spread to friends/family<br>5. **Product reputation** - Dashboard is first impression after signup<br>6. **Pattern risk** - This may be symptom of broader UX issues<br>7. **Quick ROI** - Fixing dashboard UX benefits all users immediately |
| **Success Metrics** | **Investigation Phase:**<br>- [ ] Root cause identified within 2 weeks<br>- [ ] 3+ specific UX issues documented<br>- [ ] User responds to outreach email (stretch goal)<br><br>**Fix Phase:**<br>- [ ] Dashboard satisfaction score increases from 1/5 to >3.5/5 average<br>- [ ] Feedback form completion rate increases from 0% to >60%<br>- [ ] Zero 1/5 satisfaction scores in next 30 days<br>- [ ] Dashboard page bounce rate decreases by 20%<br>- [ ] User engagement metrics improve (time on page, actions taken)<br><br>**Long-term:**<br>- [ ] Dashboard satisfaction maintains >4/5 average<br>- [ ] Less than 5% of feedback scores are ≤2<br>- [ ] Support tickets about dashboard confusion decrease by 50%<br>- [ ] User retention improves (fewer churned users citing dashboard issues) |
| **Related Stories** | - US-028 (Help Section) - Dashboard could link to help content<br>- US-027 (Educational Guidance) - Dashboard could surface key guidance<br>- Feedback System (already implemented) - Improve form UX |
| **Next Steps** | 1. ✅ Create user story (US-038) and add to backlog<br>2. Query user's simulation history and profile data<br>3. Audit dashboard UI/UX comprehensively<br>4. Draft outreach email to rightfooty218@gmail.com<br>5. Prioritize quick wins for Sprint 3 or 4<br>6. Set up dashboard analytics for ongoing monitoring |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-027** | **Educational Guidance: Withdrawal Order to Save Taxes & Avoid Clawback** | **5** | **P1** | **📋 To Do** |
| **Description** | As a user, I want clear educational guidance about the optimal account withdrawal order (TFSA/RRSP/RRIF/NonReg) so that I can minimize taxes and avoid OAS/GIS clawback throughout my retirement |
| **Acceptance Criteria** | - [ ] Educational tooltip/modal explains withdrawal order strategy<br>- [ ] Visual diagram shows recommended withdrawal sequence<br>- [ ] Explanation of tax implications for each account type<br>- [ ] Guidance on OAS clawback threshold and avoidance<br>- [ ] Guidance on GIS income limits and preservation<br>- [ ] Examples showing tax savings from optimal order<br>- [ ] Context-sensitive help based on user's assets<br>- [ ] Mobile-friendly educational content<br>- [ ] Links to CRA resources for verification<br>- [ ] Accessible to users of all financial literacy levels |
| **Tasks** | - [ ] Research optimal withdrawal order strategies<br>- [ ] Create educational content outline<br>- [ ] Design visual diagram for withdrawal order<br>- [ ] Write clear explanations for each account type<br>- [ ] Document OAS clawback threshold (2026: ~$90,997)<br>- [ ] Document GIS income limits (2026: $22,272 single, $29,424 couple)<br>- [ ] Create examples with real numbers<br>- [ ] Design tooltip/modal component<br>- [ ] Implement contextual help integration<br>- [ ] Review content with tax professional or CPA<br>- [ ] User testing for clarity and comprehension<br>- [ ] Update documentation and help center |
| **Technical Notes** | **Current Withdrawal Strategy Implementation:**<br>Backend: `juan-retirement-app/modules/simulation.py`<br>- Lines 784-793: TFSA prioritization for GIS preservation<br>- Lines 625-642: GIS threshold targeting<br>- Lines 824-850: Income addition calculations<br><br>**Withdrawal Order Best Practices:**<br>1. **Before Age 65 (Pre-OAS/GIS)**:<br>   - TFSA first (tax-free, no impact on benefits)<br>   - NonReg second (capital gains only 50% taxable)<br>   - RRSP/RRIF last (100% taxable)<br><br>2. **Age 65-71 (OAS Started, Pre-RRIF)**:<br>   - TFSA first (preserves GIS eligibility)<br>   - RRSP early withdrawals if income low (income splitting)<br>   - NonReg carefully (watch OAS clawback threshold)<br><br>3. **Age 72+ (RRIF Mandatory)**:<br>   - RRIF minimum required<br>   - TFSA to top up (avoid exceeding clawback threshold)<br>   - NonReg as needed<br><br>**Tax Thresholds 2026:**<br>- OAS Clawback starts: ~$90,997<br>- GIS Single threshold: $22,272<br>- GIS Couple threshold: $29,424<br>- Federal Basic Personal Amount: ~$15,705<br><br>**Example Savings:**<br>Scenario: Couple, $600K assets, low pension income<br>- Poor order (RRSP first): $180K total tax, lose $45K GIS<br>- Optimal order (TFSA first): $120K total tax, keep $42K GIS<br>- **Savings: $60K + $42K = $102K over 30 years** |
| **User Impact** | **Very High** - Many users don't understand withdrawal order strategy. This is a critical knowledge gap that can cost tens of thousands of dollars in unnecessary taxes and lost government benefits. Educational guidance empowers users to make informed decisions. |
| **Examples** | **Example 1: GIS-Eligible Couple**<br>Assets: TFSA $100K, RRSP $150K, NonReg $50K<br>Income: CPP $15K, OAS $8K = $23K total<br>Need: $40K/year<br>Optimal Order:<br>1. TFSA ($17K/year) - keeps income at $23K → GIS eligible<br>2. When TFSA depleted, carefully balance RRIF + NonReg<br>Result: Receive $8K-12K GIS for 5-10 years<br><br>**Example 2: High-Asset Couple (OAS Clawback Risk)**<br>Assets: RRSP $800K, TFSA $200K, NonReg $300K<br>Income: CPP $28K, OAS $16K = $44K total<br>Need: $80K/year<br>Optimal Order:<br>1. TFSA ($36K/year) - no tax, no clawback impact<br>2. NonReg (capital gains) - only 50% taxable<br>3. RRIF minimum required at 72<br>Result: Avoid OAS clawback, save $15K-20K in taxes<br><br>**Example 3: Single Low-Income Retiree**<br>Assets: TFSA $80K, RRSP $120K<br>Income: CPP $10K, OAS $8K = $18K total<br>Need: $35K/year<br>Optimal Order:<br>1. TFSA ($17K/year) - stay under GIS threshold ($22,272)<br>2. RRIF minimum at 72<br>Result: Receive $4K GIS annually, maximize government benefits |
| **Dependencies** | - US-025 (Strategy Discoverability) - integrate guidance into strategy selector<br>- US-026 (Display Current Strategy) - show guidance when strategy selected<br>- US-023 (GIS Testing) - ensure GIS thresholds accurate |
| **Success Metrics** | - [ ] 80%+ of users view educational content before running simulation<br>- [ ] User comprehension survey shows >70% understand withdrawal order<br>- [ ] Reduction in support questions about withdrawal strategies<br>- [ ] Positive user feedback on helpfulness (>4/5 rating)<br>- [ ] Users able to explain why TFSA-first is often optimal |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-028** | **Update Help Section & Documentation Center** | **8** | **P2** | **📋 To Do** |
| **Description** | As a user, I want a comprehensive, up-to-date help section so that I can learn how to use RetireZest effectively and understand retirement planning concepts |
| **Acceptance Criteria** | - [ ] Help section accessible from main navigation<br>- [ ] Topics organized by category (Getting Started, Features, Concepts, FAQ)<br>- [ ] Search functionality works across all help articles<br>- [ ] Help content covers all major features<br>- [ ] Each help article has clear examples and screenshots<br>- [ ] Mobile-responsive help center<br>- [ ] Contextual help links from relevant pages<br>- [ ] Video tutorials for key workflows<br>- [ ] Glossary of retirement planning terms<br>- [ ] Contact support option visible |
| **Tasks** | - [ ] Audit existing help content (if any)<br>- [ ] Create help center structure/sitemap<br>- [ ] Write help articles for key features:<br>  - [ ] Profile setup and data entry<br>  - [ ] Asset management (TFSA, RRSP, RRIF, NonReg)<br>  - [ ] Income sources (CPP, OAS, pensions)<br>  - [ ] Expense tracking and one-time expenses<br>  - [ ] Withdrawal strategies explained<br>  - [ ] What-If scenarios<br>  - [ ] GIS eligibility and optimization<br>  - [ ] Health score interpretation<br>  - [ ] Reading simulation results<br>  - [ ] Premium features<br>- [ ] Create FAQ section with common questions<br>- [ ] Add retirement planning glossary<br>- [ ] Implement search functionality<br>- [ ] Add contextual help links throughout app<br>- [ ] Create video tutorials (5-10 minutes each)<br>- [ ] Design help center UI/UX<br>- [ ] Implement help center frontend<br>- [ ] User testing for clarity and completeness<br>- [ ] SEO optimization for help articles |
| **Technical Notes** | **Help Center Implementation Options:**<br><br>**Option 1: In-App Help Center**<br>- Create `/help` route in Next.js<br>- Help articles as MDX files<br>- Search using Algolia or custom solution<br>- Full control over design/UX<br><br>**Option 2: Third-Party Solution**<br>- Use Intercom, Zendesk, or Help Scout<br>- Faster implementation<br>- Built-in analytics and search<br>- Monthly subscription cost<br><br>**Option 3: Hybrid Approach**<br>- In-app contextual help (tooltips, modals)<br>- External documentation site (Docusaurus, GitBook)<br>- Video hosting on YouTube/Vimeo<br><br>**Recommended: Option 3 (Hybrid)**<br>- Best user experience<br>- Cost-effective<br>- Easy to maintain and update<br><br>**Content Categories:**<br>1. Getting Started (5 articles)<br>   - Welcome to RetireZest<br>   - Quick start guide<br>   - Understanding your first simulation<br>   - Common questions for new users<br>   - Tour of key features<br><br>2. Managing Your Profile (8 articles)<br>   - Personal information<br>   - Assets (TFSA, RRSP, RRIF, NonReg)<br>   - Income sources (CPP, OAS, pensions, employment)<br>   - Expenses (monthly, annual, one-time)<br>   - Real estate and property<br>   - Partner/spouse information<br>   - Settings and preferences<br>   - Data privacy and security<br><br>3. Running Simulations (6 articles)<br>   - How to run your first simulation<br>   - Understanding withdrawal strategies<br>   - Using What-If scenarios<br>   - Reading simulation results<br>   - Health score explained<br>   - Saving and comparing scenarios<br><br>4. Advanced Features (5 articles)<br>   - GIS optimization strategies<br>   - Tax optimization techniques<br>   - OAS clawback avoidance<br>   - Income splitting strategies<br>   - Premium features guide<br><br>5. Retirement Planning Concepts (10 articles)<br>   - TFSA vs RRSP vs RRIF<br>   - CPP and OAS benefits<br>   - Guaranteed Income Supplement (GIS)<br>   - RRIF minimum withdrawals<br>   - Tax brackets and optimization<br>   - Inflation and purchasing power<br>   - Estate planning basics<br>   - Withdrawal order strategies<br>   - Retirement age considerations<br>   - Market scenarios and risk<br><br>6. FAQ (15-20 questions)<br>   - Is my data secure?<br>   - How accurate are the simulations?<br>   - What withdrawal strategy should I use?<br>   - How does GIS optimization work?<br>   - Can I export my results?<br>   - What's the difference between scenarios?<br>   - How often should I update my profile?<br>   - etc. |
| **User Impact** | **Medium-High** - Good documentation reduces support burden, improves user onboarding, and builds trust. Users who understand the tool are more likely to remain active and recommend it to others. |
| **Dependencies** | - US-027 (Withdrawal Order Guidance) - include in help content<br>- US-025 (Strategy Discoverability) - document strategies in help<br>- All major features should be stable before documenting |
| **Success Metrics** | - [ ] Help center visited by 40%+ of new users<br>- [ ] Average help session duration >3 minutes (reading content)<br>- [ ] Support ticket volume decreases by 30%<br>- [ ] User satisfaction with help content >4/5<br>- [ ] 90%+ of users can find answers to common questions<br>- [ ] Search successfully finds relevant content 80%+ of time |

**Total Story Points**: 15 → 20 → 28 → 33
**User Stories**: US-008 (✅), US-009, US-010 (✅), US-025 (✅), US-026 (✅), US-027, US-028, US-029 (✅), US-038

---

#### Epic 5: Simulation Accuracy & Features

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-011** | **GIS Strategy Assessment Card** | **8** | **P1** | **✅ Done** |
| **Description** | As a low-income retiree, I want to see if I qualify for GIS and understand the strategy recommendations so that I can maximize my retirement income |
| **Acceptance Criteria** | - [x] Card shows GIS eligibility<br>- [x] Displays recommended strategy<br>- [x] Explains why strategy is recommended<br>- [x] Shows estimated GIS amounts<br>- [x] Accessible color contrast |
| **Status** | Completed in commit 4b78963 |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-012** | **Health Score Bug Fixes** | **5** | **P0** | **✅ Done** |
| **Description** | As a user, I want my simulation health score to accurately reflect my retirement plan success so that I can trust the recommendations |
| **Acceptance Criteria** | - [x] Health score calculation fixed<br>- [x] Status badges show correct status<br>- [x] plan_success flag calculated correctly<br>- [x] No negative account balances |
| **Status** | Completed in commit f265820 |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-013** | **RRIF Strategy Validation** | **8** | **P1** | **📋 To Do** |
| **Description** | As a sophisticated user, I want to validate that RRIF withdrawal strategies are working correctly so that I can trust the tax optimization |
| **Acceptance Criteria** | - [ ] All RRIF strategies tested with real scenarios<br>- [ ] Withdrawals match CRA minimum requirements<br>- [ ] OAS clawback avoidance verified<br>- [ ] Income splitting calculations correct<br>- [ ] Documentation of each strategy's logic |
| **Tasks** | - [ ] Create test scenarios for each strategy<br>- [ ] Run simulations and validate outputs<br>- [ ] Compare against manual calculations<br>- [ ] Document validation results<br>- [ ] Fix any discrepancies found |
| **Reference** | See RRIF_STRATEGY_VALIDATION_REPORT.md |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-031** | **Evaluate Early Retirement Feature Value** | **5** | **P2** | **📋 To Do** |
| **Description** | As a product owner, I want to evaluate whether the early retirement calculator provides meaningful value to users so that we can decide whether to invest in improving it or deprecate it |
| **Acceptance Criteria** | - [ ] Usage analytics reviewed (how many users access early retirement feature?)<br>- [ ] User feedback collected (surveys, interviews with users who used it)<br>- [ ] Feature accuracy assessed (does it provide accurate results?)<br>- [ ] Value proposition clarified (what problem does it solve?)<br>- [ ] Comparison with main simulation feature (is it redundant?)<br>- [ ] Recommendation made (keep, improve, or deprecate)<br>- [ ] Decision documented with rationale |
| **Tasks** | - [ ] Review analytics:<br>  - [ ] How many users access /early-retirement page?<br>  - [ ] Completion rate (how many fill out the form?)<br>  - [ ] Retention: Do users who use it stay longer?<br>  - [ ] Conversion: Does it lead to premium subscriptions?<br><br>- [ ] User research:<br>  - [ ] Survey users who used early retirement feature<br>  - [ ] Interview 3-5 users for qualitative feedback<br>  - [ ] Ask: "What value did you get from this feature?"<br>  - [ ] Ask: "How does it compare to the main simulation?"<br><br>- [ ] Technical assessment:<br>  - [ ] Review calculation accuracy<br>  - [ ] Compare with main simulation results<br>  - [ ] Identify any bugs or issues<br>  - [ ] Assess maintenance burden (code complexity)<br><br>- [ ] Feature comparison:<br>  - [ ] What does early retirement do that main simulation doesn't?<br>  - [ ] Is there overlap/redundancy?<br>  - [ ] Could main simulation replace it with minor changes?<br><br>- [ ] Recommendation:<br>  - [ ] Option A: Keep as-is (if high value, low maintenance)<br>  - [ ] Option B: Improve (if high potential, needs work)<br>  - [ ] Option C: Deprecate (if low value, high maintenance)<br>  - [ ] Document decision with data and rationale |
| **Technical Notes** | **Current Implementation:**<br>- Route: `/early-retirement`<br>- API: `/api/early-retirement/calculate`, `/api/early-retirement/profile`<br>- Component: `app/(dashboard)/early-retirement/page.tsx`<br><br>**Questions to Answer:**<br>1. Usage: How many monthly active users?<br>2. Accuracy: Does it match main simulation results?<br>3. Uniqueness: What's different from main simulation?<br>4. Maintenance: How much code is dedicated to this?<br>5. Value: Would users miss it if we removed it?<br><br>**Data Sources:**<br>- Google Analytics or similar (page views, time on page)<br>- Database: Count users who hit `/api/early-retirement/*`<br>- User feedback: In-app surveys, email outreach<br>- Support tickets: Any issues reported with early retirement?<br><br>**Hypothesis:**<br>Early retirement feature may be redundant if main simulation can handle early retirement scenarios. Evaluate if consolidation makes sense. |
| **User Impact** | **Medium** - If feature is low-value, deprecating it simplifies the product. If high-value, we should invest in improving it. Need data to decide. |
| **Success Metrics** | - [ ] Usage data collected for last 90 days<br>- [ ] At least 5 users surveyed<br>- [ ] Feature accuracy verified (matches main simulation within 5%)<br>- [ ] Clear recommendation made (keep/improve/deprecate)<br>- [ ] Decision documented and shared with team |
| **Dependencies** | - Analytics access (Google Analytics, Vercel Analytics, or similar)<br>- Database access to query API usage<br>- User contact list for surveys/interviews<br>- Product roadmap context (what else are we building?) |
| **Possible Outcomes** | **Outcome 1: High Value → Keep & Improve**<br>- Evidence: High usage (>20% of users), positive feedback, unique value<br>- Action: Add to roadmap for improvements<br>- Investment: 8-13 story points for enhancements<br><br>**Outcome 2: Medium Value → Keep As-Is**<br>- Evidence: Moderate usage (5-20% of users), neutral feedback<br>- Action: Maintain but don't prioritize improvements<br>- Investment: Bug fixes only<br><br>**Outcome 3: Low Value → Deprecate**<br>- Evidence: Low usage (<5% of users), negative/no feedback, redundant with main simulation<br>- Action: Plan deprecation over 2-3 months<br>- Investment: 2-3 story points for graceful sunset (notifications, redirects) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-029** | **Modularize Simulation Routine** | **13** | **P2** | **📋 Backlog** |
| **Description** | As a developer, I want the simulation routine refactored into smaller, modular functions so that the code is easier to maintain, test, and extend |
| **Acceptance Criteria** | - [ ] simulation.py refactored into logical modules (tax calculations, withdrawals, benefits, cash flow)<br>- [ ] Each module has clear single responsibility<br>- [ ] Module interfaces well-defined with type hints<br>- [ ] Unit tests added for each module (>80% coverage)<br>- [ ] No change in simulation output (regression tests pass)<br>- [ ] Code complexity reduced (cyclomatic complexity <10 per function)<br>- [ ] Documentation added for each module |
| **Tasks** | - [ ] Analyze current simulation.py structure (~2800 lines)<br>- [ ] Design modular architecture (modules: taxes, withdrawals, benefits, cash_flow, strategy)<br>- [ ] Extract tax calculation logic into taxes.py module<br>- [ ] Extract withdrawal logic into withdrawals.py module<br>- [ ] Extract government benefits logic into benefits.py module<br>- [ ] Extract cash flow calculations into cash_flow.py module<br>- [ ] Extract strategy logic into strategy.py module<br>- [ ] Create comprehensive regression test suite<br>- [ ] Refactor simulation.py to use new modules<br>- [ ] Run regression tests (compare old vs new output)<br>- [ ] Fix any discrepancies found<br>- [ ] Update unit tests for each module<br>- [ ] Update documentation and code comments<br>- [ ] Performance benchmark (ensure no slowdown) |
| **Technical Notes** | **Current State:**<br>- `juan-retirement-app/modules/simulation.py` is ~2800 lines<br>- Contains tax calculations, withdrawal strategies, GIS logic, RRIF calculations, cash flow, all in one file<br>- High cyclomatic complexity makes testing difficult<br>- Adding new features requires navigating large monolithic file<br><br>**Proposed Modular Architecture:**<br>```<br>juan-retirement-app/modules/<br>├── simulation.py (orchestrator, main run_simulation function)<br>├── taxes.py (federal/provincial tax calculations)<br>├── withdrawals.py (TFSA, RRSP, RRIF, NonReg withdrawal logic)<br>├── benefits.py (CPP, OAS, GIS calculations)<br>├── cash_flow.py (annual cash flow, balance tracking)<br>├── strategy.py (withdrawal strategy implementations)<br>└── types.py (shared type definitions)<br>```<br><br>**Key Functions to Extract:**<br>1. Tax Calculations (~300 lines)<br>   - calculate_federal_tax()<br>   - calculate_provincial_tax()<br>   - calculate_total_tax()<br><br>2. Withdrawal Logic (~500 lines)<br>   - withdraw_from_tfsa()<br>   - withdraw_from_rrsp()<br>   - withdraw_from_rrif()<br>   - withdraw_from_nonreg()<br>   - apply_withdrawal_strategy()<br><br>3. Government Benefits (~400 lines)<br>   - calculate_cpp()<br>   - calculate_oas()<br>   - calculate_gis()<br>   - apply_oas_clawback()<br><br>4. Cash Flow (~300 lines)<br>   - calculate_annual_cash_flow()<br>   - update_account_balances()<br>   - track_withdrawals()<br><br>5. Strategy Logic (~400 lines)<br>   - minimize_income_strategy()<br>   - balanced_income_strategy()<br>   - early_rrif_strategy()<br>   - max_tfsa_first_strategy()<br><br>**Benefits:**<br>- Easier to write unit tests for isolated functions<br>- Reduced cognitive load when reading code<br>- Easier to add new withdrawal strategies<br>- Easier to fix bugs (smaller search space)<br>- Better code reusability<br>- Easier onboarding for new developers<br><br>**Risks:**<br>- Regression bugs if refactoring introduces subtle changes<br>- Must maintain exact same simulation output<br>- Need comprehensive test coverage before refactoring |
| **User Impact** | **Low (Direct)** - No user-facing changes<br>**High (Indirect)** - Improved code quality enables faster feature development, fewer bugs, easier bug fixes |
| **Dependencies** | - US-015 (Unit Test Coverage) - should establish test baseline first<br>- US-013 (RRIF Strategy Validation) - ensures strategies work correctly before refactoring |
| **Success Metrics** | - [ ] All regression tests pass (100% output match)<br>- [ ] Code complexity reduced by 50%+<br>- [ ] Unit test coverage increased from <20% to >80%<br>- [ ] Average function length reduced from ~150 lines to <50 lines<br>- [ ] Developer velocity increases in Sprint 4+ (faster feature development) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-023** | **AI-Powered GIS Enhancement - Testing, Verification & Deployment** | **13** | **P1** | **📋 To Do** |
| **Description** | As a product owner, I want comprehensive testing, verification, and production deployment of the AI-powered GIS strategy enhancements so that low-income retirees receive accurate, trustworthy advice |
| **Acceptance Criteria** | - [ ] All GIS calculation logic verified against CRA 2026 rates<br>- [ ] TFSA prioritization strategy tested with multiple scenarios<br>- [ ] GIS threshold targeting validated (single vs couple thresholds)<br>- [ ] GIS income room calculations accurate<br>- [ ] Strategy effectiveness ratings (0-10) validated<br>- [ ] AI-generated recommendations reviewed for accuracy<br>- [ ] Key milestone timeline verified for correctness<br>- [ ] GISInsightsCard UI renders correctly with all data<br>- [ ] Edge cases tested (zero RRIF, high assets, age transitions)<br>- [ ] Production deployment completed with monitoring<br>- [ ] User acceptance testing with real scenarios<br>- [ ] Performance benchmarks met (<500ms for insights generation) |
| **Tasks** | - [ ] Review strategy_insights.py logic for accuracy<br>- [ ] Create comprehensive test suite (unit + integration)<br>- [ ] Test GIS feasibility calculation (30-year projection)<br>- [ ] Validate RRIF minimum percentage tables<br>- [ ] Test single vs couple threshold logic<br>- [ ] Test "preserve_gis" mode activation ($5K+ GIS)<br>- [ ] Verify TFSA prioritization in minimize-income strategy<br>- [ ] Test GIS impact analysis tracking<br>- [ ] Validate AI-generated recommendations quality<br>- [ ] Test GISInsightsCard component rendering<br>- [ ] Performance testing (load testing, response times)<br>- [ ] Create production deployment plan<br>- [ ] Deploy to production with feature flag<br>- [ ] Monitor production metrics (usage, errors, performance)<br>- [ ] Collect user feedback on insights quality<br>- [ ] Document deployment results and lessons learned |
| **Technical Notes** | **Backend Components:**<br>- `juan-retirement-app/modules/strategy_insights.py` - AI insights generation<br>- `juan-retirement-app/modules/simulation.py` - GIS optimization logic<br>- `juan-retirement-app/api/models/responses.py` - Data models<br><br>**Frontend Components:**<br>- `webapp/components/simulation/GISInsightsCard.tsx` - Insights UI<br>- `webapp/lib/types/simulation.ts` - TypeScript types<br><br>**Key Features to Validate:**<br>1. GIS feasibility calculation (lines 12-200 in strategy_insights.py)<br>2. TFSA prioritization (lines 784-793 in simulation.py)<br>3. GIS threshold targeting (lines 625-642 in simulation.py)<br>4. Income addition calculations (lines 824-850 in simulation.py)<br>5. Recommendation generation logic<br>6. Milestone timeline accuracy<br><br>**CRA 2026 Rates to Verify:**<br>- GIS threshold single: $22,272<br>- GIS threshold couple (both OAS): $29,424<br>- GIS threshold couple (one OAS): $53,808<br>- RRIF minimum percentages by age (65-95) |
| **User Impact** | **Critical** - This feature directly impacts financial decisions for low-income retirees. Incorrect GIS advice could cost users thousands of dollars in lost benefits. AI-generated insights must be accurate, trustworthy, and validated. |
| **Known Issues** | - Current implementation already deployed (Jan 2026) but needs comprehensive testing<br>- Test scripts exist: test_gis_improvements.py, run-gis-tests.js<br>- Documentation exists: GIS_STRATEGY_ASSESSMENT.md, GIS_STRATEGY_ENHANCEMENT_SUMMARY.md<br>- No formal verification against CRA calculations yet<br>- No user acceptance testing conducted<br>- Performance benchmarks not established |
| **Success Metrics** | - [ ] 100% accuracy on 20+ test scenarios vs CRA calculations<br>- [ ] AI recommendations rated 4.5/5+ by subject matter expert review<br>- [ ] Zero critical bugs in production for 30 days<br>- [ ] 95th percentile response time <500ms<br>- [ ] Positive user feedback (>80% find insights helpful)<br>- [ ] No user reports of incorrect GIS advice |
| **Dependencies** | - US-013 (RRIF Strategy Validation) - should complete first<br>- Access to CRA 2026 GIS benefit calculator for validation<br>- Subject matter expert (SME) review of AI recommendations<br>- Production monitoring infrastructure |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-036** | **RRIF Tax Withholding Strategy for Excess Withdrawals** | **8** | **P2** | **📋 To Do** |
| **Description** | As a retiree with RRIF accounts, I want to understand and optimize tax withholding when withdrawing more than the minimum so that I can manage cash flow and avoid large year-end tax bills or refunds |
| **Acceptance Criteria** | **Calculation & Display:**<br>- [ ] Simulation accurately calculates CRA withholding tax when RRIF withdrawals exceed minimum<br>- [ ] Withholding rates applied correctly: 10% (≤$5K), 20% ($5K-$15K), 30% (>$15K)<br>- [ ] Quebec withholding rates applied when province is Quebec: 5%/10%/15% (plus federal)<br>- [ ] Withholding tax shown separately from final tax owing in results<br>- [ ] Cash flow reflects net amount received (gross - withholding)<br><br>**Strategy Integration:**<br>- [ ] Withdrawal strategies account for withholding impact on cash flow<br>- [ ] Strategies can optimize to minimize excess withholding (e.g., spread withdrawals)<br>- [ ] Strategy recommendations explain withholding implications<br>- [ ] Comparison tool shows withholding differences between strategies<br><br>**User Education:**<br>- [ ] Help text explains RRIF withholding rules<br>- [ ] Tooltip shows withholding calculation breakdown<br>- [ ] Warning shown when large excess withdrawal triggers 30% withholding<br>- [ ] Guidance on how to reduce withholding (multiple smaller withdrawals vs one large)<br><br>**Edge Cases:**<br>- [ ] Handles RRIF conversions at age 71 (first year minimum = 0)<br>- [ ] Handles multiple RRIF accounts (withholding per account)<br>- [ ] Minimum withdrawal has zero withholding<br>- [ ] Year-end tax reconciliation accounts for withholding paid |
| **Tasks** | **Research & Planning:**<br>- [ ] Review CRA RRIF withholding tax rules (2026)<br>- [ ] Document provincial variations (especially Quebec)<br>- [ ] Identify how withholding affects cash flow vs final tax<br>- [ ] Research best practices for minimizing excess withholding<br><br>**Backend Implementation:**<br>- [ ] Add withholding calculation to RRIF withdrawal logic (`withdrawal_strategies.py`)<br>- [ ] Implement tiered withholding rates (10%/20%/30%)<br>- [ ] Add Quebec-specific withholding rates<br>- [ ] Track withholding separately from final tax owing<br>- [ ] Update simulation cash flow to reflect net withdrawals<br>- [ ] Add withholding to annual tax summary<br><br>**Frontend Implementation:**<br>- [ ] Display withholding tax in simulation results<br>- [ ] Add withholding breakdown tooltip/card<br>- [ ] Show net vs gross RRIF withdrawals<br>- [ ] Add warning for high withholding scenarios (>20%)<br>- [ ] Create educational content for RRIF withholding<br>- [ ] Update strategy comparison to show withholding impact<br><br>**Testing:**<br>- [ ] Test minimum withdrawal (0% withholding)<br>- [ ] Test $3K excess withdrawal (10% withholding)<br>- [ ] Test $10K excess withdrawal (20% withholding)<br>- [ ] Test $20K excess withdrawal (30% withholding)<br>- [ ] Test Quebec vs other provinces<br>- [ ] Test multiple RRIF accounts<br>- [ ] Test age 71 conversion year<br>- [ ] Validate against CRA examples<br><br>**Documentation:**<br>- [ ] Document withholding calculation logic<br>- [ ] Create user guide: "Managing RRIF Tax Withholding"<br>- [ ] Add FAQ: "Why is my RRIF withdrawal less than expected?"<br>- [ ] Document strategy implications |
| **Technical Notes** | **CRA Withholding Rules (2026):**<br><br>**Federal Rates (All Provinces Except Quebec):**<br>- Excess withdrawal ≤ $5,000: **10% withholding**<br>- Excess withdrawal $5,001 - $15,000: **20% withholding**<br>- Excess withdrawal > $15,000: **30% withholding**<br><br>**Quebec Rates:**<br>- Federal: 5% / 10% / 15% (same tiers)<br>- Provincial: 5% / 10% / 15% (same tiers)<br>- **Combined: 10% / 20% / 30%** (same as rest of Canada)<br><br>**Minimum Withdrawal:**<br>- RRIF minimum withdrawal has **ZERO withholding**<br>- Only amounts **exceeding** minimum are subject to withholding<br><br>**Example:**<br>```<br>RRIF Balance: $100,000<br>Age: 72<br>Minimum %: 7.48%<br>Minimum Amount: $7,480 (no withholding)<br><br>Scenario 1: Withdraw $10,000<br>  Excess: $2,520<br>  Withholding: $252 (10% of excess)<br>  Net: $9,748<br><br>Scenario 2: Withdraw $20,000<br>  Excess: $12,520<br>  Withholding: $2,504 (20% of excess)<br>  Net: $17,496<br><br>Scenario 3: Withdraw $30,000<br>  Excess: $22,520<br>  Withholding: $6,756 (30% of excess)<br>  Net: $23,244<br>```<br><br>**Key Insight:**<br>Withholding is NOT the final tax owing. It's a prepayment. At year-end:<br>- If actual tax < withholding → **Refund**<br>- If actual tax > withholding → **Additional tax owing**<br><br>**Files to Modify:**<br>- `juan-retirement-app/modules/rrif_calculations.py` - Add withholding logic<br>- `juan-retirement-app/modules/simulation.py` - Track withholding in cash flow<br>- `webapp/components/simulation/RRIFWithholdingCard.tsx` - New component (display withholding)<br>- `webapp/lib/types/simulation.ts` - Add withholding fields to types<br><br>**Calculation Logic:**<br>```python<br>def calculate_rrif_withholding(withdrawal_amount, minimum_amount, province):<br>    excess = max(0, withdrawal_amount - minimum_amount)<br>    <br>    if excess <= 5000:<br>        rate = 0.10<br>    elif excess <= 15000:<br>        rate = 0.20<br>    else:<br>        rate = 0.30<br>    <br>    # Quebec has same combined rate but different federal/provincial split<br>    withholding = excess * rate<br>    net_withdrawal = withdrawal_amount - withholding<br>    <br>    return {<br>        'gross': withdrawal_amount,<br>        'minimum': minimum_amount,<br>        'excess': excess,<br>        'withholding': withholding,<br>        'net': net_withdrawal,<br>        'rate': rate<br>    }<br>```<br><br>**Strategy Implications:**<br>1. **Income Minimization (GIS):** May deliberately keep withdrawals at minimum to avoid withholding<br>2. **RRIF Splitting:** Splitting reduces per-person withdrawal, may drop to lower withholding tier<br>3. **Balanced:** Should consider withholding impact on cash flow<br>4. **TFSA First:** Delays RRIF withdrawals, potentially reduces years of high withholding |
| **User Impact** | **High** - Withholding significantly impacts monthly cash flow. Users withdrawing $30K from RRIF might expect $30K but only receive $23K (30% withheld). This can cause budgeting issues if not understood. |
| **Known Issues** | **Current Implementation Gap:**<br>- Current simulation does NOT calculate withholding tax<br>- Users may be surprised by lower-than-expected RRIF withdrawals<br>- Cash flow projections may be overstated (not accounting for withholding)<br>- Strategies don't optimize for withholding minimization<br><br>**User Pain Points:**<br>- "Why did I only receive $17K when I withdrew $20K from my RRIF?"<br>- "How can I avoid the 30% withholding rate?"<br>- "Should I withdraw minimum and top up from TFSA instead?" |
| **Success Metrics** | - [ ] Withholding calculations match CRA examples (100% accuracy)<br>- [ ] Users understand withholding (survey: >80% say "clear")<br>- [ ] Strategies minimize unnecessary withholding (A/B test shows lower withholding with optimization)<br>- [ ] Cash flow projections accurate (within 2% of actual after withholding)<br>- [ ] Zero user complaints about unexpected withholding |
| **Dependencies** | - US-013 (RRIF Strategy Validation) - must complete first to ensure RRIF calculations correct<br>- Province data (ensure user province is captured in profile)<br>- RRIF minimum calculation already working<br>- Cash flow tracking in simulation |
| **Related Stories** | US-013 (RRIF Strategy Validation), US-027 (Educational Guidance) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-037** | **Real Estate Management in Withdrawal Strategies & Retirement Plans** | **8** | **P2** | **📋 To Do** |
| **Description** | As a homeowner planning for retirement, I want to understand how my real estate (primary residence, rental properties, vacation homes) is incorporated into withdrawal strategies and retirement planning so that I can make informed decisions about selling, downsizing, or leveraging home equity |
| **Acceptance Criteria** | **Real Estate in Simulation:**<br>- [ ] Primary residence tracked separately from investment assets<br>- [ ] Primary residence NOT used for retirement income (principal residence exemption)<br>- [ ] Rental properties generate rental income in simulation<br>- [ ] Rental properties have capital gains on sale (if user chooses to sell)<br>- [ ] Vacation/secondary properties can be sold for retirement funding<br>- [ ] Home equity lines of credit (HELOC) supported as income source<br>- [ ] Downsizing scenarios modeled (sell high-value home, buy lower-cost, pocket difference)<br><br>**Withdrawal Strategy Integration:**<br>- [ ] Strategies explain when/if to sell real estate<br>- [ ] Strategies optimize timing of real estate sales (tax implications)<br>- [ ] Reverse mortgage option presented (if applicable)<br>- [ ] Rental income factored into GIS/OAS clawback calculations<br>- [ ] Capital gains from property sales factored into tax calculations<br><br>**User Planning Tools:**<br>- [ ] "Downsizing Calculator" shows impact of selling primary residence<br>- [ ] "Rental Property Analysis" shows income vs expenses vs sale proceeds<br>- [ ] "Reverse Mortgage Estimator" shows loan amount vs interest cost<br>- [ ] Scenario comparison: keep home vs downsize vs reverse mortgage<br><br>**User Education:**<br>- [ ] Help content explains principal residence exemption<br>- [ ] Help content explains capital gains on rental/vacation properties<br>- [ ] Help content explains reverse mortgages (pros/cons)<br>- [ ] Help content explains downsizing timing strategies<br><br>**Edge Cases:**<br>- [ ] User has multiple properties (primary + rental + vacation)<br>- [ ] User plans to sell property at specific age/year<br>- [ ] User expects property appreciation over time<br>- [ ] User has mortgage on properties (debt tracking) |
| **Tasks** | **Research & Planning:**<br>- [ ] Review CRA rules: principal residence exemption<br>- [ ] Review CRA rules: rental property income and capital gains<br>- [ ] Research reverse mortgage products (CHIP, HomeEquity Bank)<br>- [ ] Research downsizing trends (when do retirees typically downsize?)<br>- [ ] Interview users: How do you plan to use your home in retirement?<br><br>**Backend Implementation:**<br>- [ ] Extend RealEstate data model:<br>  - [ ] Add `propertyType` (primary, rental, vacation)<br>  - [ ] Add `rentalIncome` (monthly)<br>  - [ ] Add `rentalExpenses` (property tax, maintenance, insurance)<br>  - [ ] Add `mortgageBalance` and `mortgagePayment`<br>  - [ ] Add `plannedSaleYear` (optional)<br>  - [ ] Add `expectedAppreciation` (% per year)<br>  - [ ] Add `reverseMortgage` (boolean + details)<br>- [ ] Implement rental income in simulation cash flow<br>- [ ] Implement capital gains calculation on property sale<br>- [ ] Implement principal residence exemption (zero tax on primary)<br>- [ ] Implement downsizing scenario (sell + buy smaller + pocket difference)<br>- [ ] Implement reverse mortgage cash flow (receive lump sum, pay interest)<br>- [ ] Integrate real estate into withdrawal strategies:<br>  - [ ] "Income Minimization" - may suggest delaying rental property sale to avoid GIS clawback<br>  - [ ] "Capital Gains Optimized" - may suggest selling rental property in low-income years<br>  - [ ] "Balanced" - may suggest downsizing at specific age<br><br>**Frontend Implementation:**<br>- [ ] Update real estate form to capture new fields<br>- [ ] Create "Real Estate Impact Card" in simulation results<br>- [ ] Create "Downsizing Calculator" component<br>- [ ] Create "Rental Property Analysis" component<br>- [ ] Add real estate to cash flow visualization (rental income, sale proceeds)<br>- [ ] Add real estate to strategy recommendations<br>- [ ] Create educational content: "Real Estate in Retirement"<br><br>**Testing:**<br>- [ ] Test primary residence (no income, no capital gains)<br>- [ ] Test rental property (income + expenses + capital gains on sale)<br>- [ ] Test vacation home (capital gains on sale)<br>- [ ] Test downsizing scenario (sell $800K, buy $400K, pocket $400K)<br>- [ ] Test reverse mortgage (receive $200K, pay 6% interest)<br>- [ ] Test multiple properties<br>- [ ] Test rental income impact on GIS/OAS clawback<br>- [ ] Validate capital gains calculations vs CRA rules<br><br>**Documentation:**<br>- [ ] Document real estate data model<br>- [ ] Create user guide: "Managing Real Estate in Retirement"<br>- [ ] Create FAQ: "Should I downsize or take a reverse mortgage?"<br>- [ ] Document strategy implications for real estate |
| **Technical Notes** | **CRA Rules - Real Estate:**<br><br>**1. Principal Residence Exemption:**<br>- Capital gains on sale of primary residence are **TAX-FREE** (100% exempt)<br>- Can only designate ONE property as principal residence per family<br>- Must be "ordinarily inhabited" by owner<br><br>**2. Rental Property:**<br>- Rental income is **fully taxable** (reported on T776)<br>- Expenses deductible: property tax, insurance, maintenance, mortgage interest<br>- Capital gains on sale: **50% taxable** (same as stocks)<br><br>**3. Vacation/Secondary Property:**<br>- Not eligible for principal residence exemption<br>- Capital gains on sale: **50% taxable**<br><br>**4. Reverse Mortgage:**<br>- Loan secured by home equity<br>- Receive lump sum or monthly payments<br>- No monthly payments required (interest compounds)<br>- Loan repaid when home is sold or owner passes away<br>- Interest rates: 6-8% typically<br>- Maximum loan: 55% of home value (age 55+)<br><br>**Example - Rental Property:**<br>```<br>Purchase Price: $300,000 (year 2000)<br>Sale Price: $600,000 (year 2026)<br>Capital Gain: $300,000<br>Taxable Gain: $150,000 (50%)<br>Tax (40% marginal rate): $60,000<br>Net Proceeds: $540,000<br><br>Annual Rental Income: $24,000<br>Annual Expenses: $8,000 (tax, insurance, maintenance)<br>Net Rental Income: $16,000/year (fully taxable)<br>```<br><br>**Example - Downsizing:**<br>```<br>Sell Primary Residence: $800,000 (no capital gains tax)<br>Buy Smaller Home: $400,000<br>Pocket Difference: $400,000<br>Use $400K to fund retirement:<br>  - Option 1: Invest in TFSA/RRIF<br>  - Option 2: Use as cash flow supplement<br>  - Option 3: Pay off debts<br>```<br><br>**Example - Reverse Mortgage:**<br>```<br>Home Value: $500,000<br>Age: 70<br>Max Loan: 55% of value = $275,000<br>Take Reverse Mortgage: $200,000<br>Interest Rate: 6%/year (compounding)<br><br>Year 1: Owe $212,000<br>Year 5: Owe $267,645<br>Year 10: Owe $358,170<br>Year 15: Owe $479,655<br><br>If home sold in Year 10:<br>  Home Value (3% appreciation): $671,958<br>  Loan Owed: $358,170<br>  Net Equity: $313,788<br>```<br><br>**Files to Modify:**<br>- `webapp/prisma/schema.prisma` - Extend RealEstate model<br>- `juan-retirement-app/modules/real_estate.py` - New module for real estate logic<br>- `juan-retirement-app/modules/simulation.py` - Integrate real estate into cash flow<br>- `webapp/components/RealEstateForm.tsx` - Update form for new fields<br>- `webapp/components/simulation/RealEstateImpactCard.tsx` - New component<br>- `webapp/lib/types/simulation.ts` - Add real estate types<br><br>**Prisma Schema Extension:**<br>```prisma<br>model RealEstate {<br>  id                  String   @id @default(cuid())<br>  userId              String<br>  propertyType        String   // "primary", "rental", "vacation"<br>  address             String?<br>  currentValue        Float<br>  purchasePrice       Float?<br>  purchaseYear        Int?<br>  expectedAppreciation Float   @default(2.0) // % per year<br>  <br>  // Rental properties<br>  monthlyRentalIncome  Float?<br>  monthlyExpenses      Float?<br>  <br>  // Mortgage<br>  mortgageBalance      Float?<br>  monthlyMortgagePayment Float?<br>  <br>  // Sale planning<br>  plannedSaleYear      Int?<br>  <br>  // Reverse mortgage<br>  hasReverseMortgage   Boolean  @default(false)<br>  reverseMortgageAmount Float?<br>  reverseMortgageRate  Float?<br>  reverseMortgageYear  Int?<br>  <br>  createdAt           DateTime @default(now())<br>  updatedAt           DateTime @updatedAt<br>  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)<br>}<br>```<br><br>**Strategy Implications:**<br>1. **Income Minimization (GIS):**<br>   - May recommend deferring rental property sale to avoid capital gains spike<br>   - May recommend downsizing primary residence to avoid GIS clawback from rental income<br><br>2. **Capital Gains Optimized:**<br>   - May recommend selling rental/vacation properties in low-income years<br>   - May recommend reverse mortgage instead of property sale (no capital gains)<br><br>3. **Balanced:**<br>   - May recommend downsizing at age 75-80 (reduce home maintenance burden)<br>   - May balance rental income with RRIF withdrawals |
| **User Impact** | **Critical** - Real estate is often the largest asset for retirees (50-70% of net worth). Proper planning for downsizing, rental income, or reverse mortgages can add $100K-$500K to retirement funding. |
| **Known Issues** | **Current Implementation Gap:**<br>- Real estate is tracked but NOT integrated into withdrawal strategies<br>- No rental income in simulation cash flow<br>- No downsizing scenarios modeled<br>- No reverse mortgage option<br>- No capital gains calculations for property sales<br>- No strategic guidance on when to sell/downsize<br><br>**User Pain Points:**<br>- "Should I sell my rental property now or wait?"<br>- "When is the best time to downsize?"<br>- "Should I take a reverse mortgage or sell my home?"<br>- "How much income will my rental property generate in retirement?" |
| **Success Metrics** | - [ ] Real estate income accurately reflected in cash flow (100% of users with rental properties)<br>- [ ] Downsizing scenarios show correct tax implications (0% tax on primary residence)<br>- [ ] Capital gains calculations match CRA rules (100% accuracy)<br>- [ ] Users understand real estate options (survey: >80% say "clear")<br>- [ ] Strategic recommendations for real estate rated helpful (>4/5 by users) |
| **Dependencies** | - US-009 (Skip Real Estate Step) - may conflict if users skip real estate but then want to model it<br>- Province data (capital gains tax rates vary slightly)<br>- Mortgage tracking (if not already implemented)<br>- Real estate data model update (Prisma migration) |
| **Related Stories** | US-009 (Skip Real Estate Step), US-013 (RRIF Strategy Validation), US-021 (Configurable Yields), US-027 (Educational Guidance) |

---

### Medium Priority (Sprints 3-4)

#### Epic 6: Testing & Quality

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-014** | **E2E Test Suite - Critical Paths** | **13** | **P2** | **📋 Backlog** |
| **Description** | As a developer, I want automated end-to-end tests for critical user flows so that I can deploy with confidence |
| **Acceptance Criteria** | - [ ] Onboarding flow fully tested<br>- [ ] Simulation creation tested<br>- [ ] Strategy comparison tested<br>- [ ] Profile updates tested<br>- [ ] Tests run in CI/CD pipeline |
| **Tasks** | - [ ] Set up Playwright/Cypress<br>- [ ] Write onboarding tests<br>- [ ] Write simulation tests<br>- [ ] Write profile tests<br>- [ ] Integrate with GitHub Actions<br>- [ ] Document test writing process |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-015** | **Unit Test Coverage - Backend** | **8** | **P3** | **📋 Backlog** |
| **Description** | As a developer, I want comprehensive unit tests for the simulation engine so that I can refactor safely |
| **Acceptance Criteria** | - [ ] >80% code coverage for simulation.py<br>- [ ] All tax calculations tested<br>- [ ] All withdrawal strategies tested<br>- [ ] Edge cases covered<br>- [ ] Tests run in CI/CD |
| **Tasks** | - [ ] Set up pytest framework<br>- [ ] Write tax calculation tests<br>- [ ] Write withdrawal strategy tests<br>- [ ] Write GIS calculation tests<br>- [ ] Add coverage reporting<br>- [ ] Fix any bugs found |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-022** | **What-If Scenario Slider Testing & Fixes** | **5** | **P1** | **✅ Done** |
| **Description** | As a user, I want the What-If scenario sliders to work correctly and provide accurate simulation comparisons so that I can confidently explore different retirement scenarios |
| **Acceptance Criteria** | - [x] All sliders respond correctly to user input<br>- [x] Slider values map correctly to adjustments (e.g., spending 50-150%, retirement age -5 to +5)<br>- [x] "Run What-If Scenario" button executes simulation successfully<br>- [x] Results display shows accurate comparison (original vs what-if)<br>- [x] Health score delta calculated correctly<br>- [x] Final estate delta calculated correctly<br>- [x] Error handling works for invalid scenarios<br>- [x] Reset button clears all adjustments<br>- [x] Slider state persists during interaction (no unexpected resets) |
| **Completion** | ✅ Completed January 29, 2026 (commit 2487294). Fixed state timing bug where `hasChanges` would not update correctly on first slider adjustment. See WHATIF_SLIDER_TEST_REPORT.md for complete testing documentation. |
| **Tasks** | - [ ] Audit WhatIfSliders.tsx component for bugs<br>- [ ] Test slider value mapping (spending, retirement age, CPP age, OAS age)<br>- [ ] Test /api/simulation/what-if endpoint with various adjustments<br>- [ ] Verify adjustment calculations (lines 43-45 in WhatIfSliders.tsx)<br>- [ ] Test edge cases (min/max values, boundary conditions)<br>- [ ] Fix checkHasChanges() function if needed (line 48-55)<br>- [ ] Test error handling for failed API calls<br>- [ ] Verify comparison UI renders correctly (health score, estate)<br>- [ ] Create automated E2E test for What-If feature<br>- [ ] Document known limitations and expected behavior |
| **Technical Notes** | Component located at: `webapp/components/simulation/WhatIfSliders.tsx`<br>API endpoint: `webapp/app/api/simulation/what-if/route.ts`<br>Potential issues:<br>- Slider value offsets (+5 for retirement/CPP sliders) may cause confusion<br>- handleAdjustmentChange may not trigger hasChanges update correctly<br>- Error state may not clear properly between runs<br>- What-If result may show stale data |
| **User Impact** | High - What-If scenarios are critical for users to explore different retirement strategies. Bugs here undermine confidence in the tool. |
| **Known Issues** | - **OAS Start Age slider does not update the displayed age value** (reported Jan 29, 2026 with screenshot)<br>  - Slider moves but "Age 65" text does not change<br>  - Help text updates correctly ("Start OAS 3 years earlier") but age badge is stuck<br>  - Likely issue: State binding or rendering bug in OAS slider component<br>  - Impact: User cannot see what OAS age they're selecting<br>- User reported issues via screenshot (needs investigation)<br>- Multiple test scripts exist but may not cover all scenarios<br>- Scripts: test-what-if-comprehensive.ts, test-what-if-accuracy.ts, test-what-if-sliders.ts |

---

| **US-035** | **E2E Testing - All Withdrawal Strategies** | **8** | **P2** | **📋 To Do** |
| **Description** | As a developer, I want comprehensive end-to-end tests for all 6 withdrawal strategies so that I can ensure each strategy produces correct results and behaves as documented |
| **Acceptance Criteria** | **Test Coverage:**<br>- [ ] All 6 withdrawal strategies tested end-to-end<br>- [ ] Each strategy tested with multiple household profiles<br>- [ ] Tax calculations verified for each strategy<br>- [ ] Withdrawal order validated for each strategy<br>- [ ] Edge cases tested (zero balances, high income, low income)<br>- [ ] Cross-strategy comparison validates differences<br><br>**Test Quality:**<br>- [ ] Tests run in CI/CD pipeline<br>- [ ] Tests are deterministic (no flaky tests)<br>- [ ] Clear assertions with meaningful error messages<br>- [ ] Test data represents realistic scenarios<br>- [ ] Performance benchmarks established<br><br>**Documentation:**<br>- [ ] Each strategy's expected behavior documented<br>- [ ] Test scenarios described in detail<br>- [ ] Known limitations documented<br>- [ ] Comparison matrix created (when to use each strategy) |
| **Tasks** | **Test Infrastructure:**<br>- [ ] Set up Playwright E2E test framework (if not already)<br>- [ ] Create test fixtures for 6 household profiles<br>- [ ] Create utility functions for strategy testing<br>- [ ] Set up test database with known data<br><br>**Strategy Tests (6 strategies):**<br><br>1. **Corporate Optimized** (US-035-1)<br>   - [ ] Test with corporate account ($100K)<br>   - [ ] Verify corporate accounts drawn first<br>   - [ ] Verify corporate tax minimization<br>   - [ ] Test with no corporate accounts (fallback behavior)<br><br>2. **Income Minimization (GIS-Optimized)** (US-035-2)<br>   - [ ] Test with low-income senior (GIS eligible)<br>   - [ ] Verify TFSA/capital gains prioritized<br>   - [ ] Verify taxable income stays below GIS clawback<br>   - [ ] Test with high income (GIS not applicable)<br>   - [ ] Verify OAS clawback avoided if possible<br><br>3. **RRIF Splitting** (US-035-3)<br>   - [ ] Test with couple (both >65)<br>   - [ ] Verify pension income splitting applied<br>   - [ ] Verify tax reduction vs no splitting<br>   - [ ] Test with single person (no splitting)<br>   - [ ] Test with age <65 (ineligible)<br><br>4. **Capital Gains Optimized** (US-035-4)<br>   - [ ] Test with large non-reg account ($200K+)<br>   - [ ] Verify capital gains drawn first<br>   - [ ] Verify 50% inclusion rate applied<br>   - [ ] Compare tax vs RRIF withdrawals<br>   - [ ] Test with zero non-reg balance<br><br>5. **TFSA First** (US-035-5)<br>   - [ ] Test with $50K TFSA balance<br>   - [ ] Verify TFSA fully depleted before RRIF<br>   - [ ] Verify zero tax on TFSA withdrawals<br>   - [ ] Test with zero TFSA balance<br>   - [ ] Verify flexibility benefit (no tax impact)<br><br>6. **Balanced** (US-035-6)<br>   - [ ] Test with all account types<br>   - [ ] Verify proportional withdrawals<br>   - [ ] Compare results to other strategies<br>   - [ ] Verify tax optimization is moderate<br>   - [ ] Confirm it's the default strategy<br><br>**Cross-Strategy Tests:**<br>- [ ] Same household, all 6 strategies, compare results<br>- [ ] Verify health scores differ appropriately<br>- [ ] Verify final estates differ<br>- [ ] Verify tax totals differ<br>- [ ] Document which strategy is best for which profile<br><br>**Regression Tests:**<br>- [ ] Test against known-good simulation results<br>- [ ] Verify Python backend changes don't break strategies<br>- [ ] Test with production data (anonymized)<br><br>**Documentation:**<br>- [ ] Create WITHDRAWAL_STRATEGIES_TEST_REPORT.md<br>- [ ] Document expected behavior for each strategy<br>- [ ] Create strategy selection guide<br>- [ ] Add test examples to documentation |
| **Technical Notes** | **Withdrawal Strategies (6 total):**<br><br>1. **Corporate Optimized** (`corporate-optimized`)<br>   - Prioritizes corporate account withdrawals<br>   - Minimizes corporate tax<br>   - Best for: Business owners with corporate accounts<br><br>2. **Income Minimization** (`minimize-income`)<br>   - Prioritizes TFSA and capital gains<br>   - Preserves GIS eligibility<br>   - Avoids OAS clawback<br>   - Best for: Low-income seniors, GIS recipients<br><br>3. **RRIF Splitting** (`rrif-splitting`)<br>   - Uses pension income splitting for couples<br>   - Requires both partners >65<br>   - Reduces household tax burden<br>   - Best for: Couples with large RRIF balances<br><br>4. **Capital Gains Optimized** (`capital-gains-optimized`)<br>   - Prioritizes non-registered accounts<br>   - Leverages 50% inclusion rate<br>   - Best for: High net worth, large non-reg accounts<br><br>5. **TFSA First** (`tfsa-first`)<br>   - Depletes TFSA before taxable accounts<br>   - Maximizes flexibility (no tax reporting)<br>   - Best for: Users wanting zero-tax withdrawals first<br><br>6. **Balanced** (`balanced`) - DEFAULT<br>   - Proportional withdrawals across accounts<br>   - Moderate tax optimization<br>   - Best for: Most users, simple approach<br><br>**Test Framework:**<br>- Use Playwright for E2E tests (`e2e/` directory)<br>- Test household profiles stored in `e2e/fixtures/`<br>- Simulation API: `/api/simulation/run`<br>- Python backend validation: `juan-retirement-app/modules/withdrawal_strategies.py`<br><br>**Test Data:**<br>Each test profile should include:<br>- Household info (names, ages, province)<br>- Assets (TFSA, RRSP, RRIF, NonReg, Corporate, RealEstate)<br>- Income (CPP, OAS, pensions, employment)<br>- Expenses (Go-Go, Slow-Go, No-Go)<br>- Expected results (for regression testing)<br><br>**Validation:**<br>- Compare health score (success_rate)<br>- Compare final estate<br>- Compare total taxes paid<br>- Compare withdrawal amounts by year<br>- Compare tax by year<br>- Verify correct account depletion order<br><br>**Related Code:**<br>- Frontend: `webapp/lib/types/simulation.ts` (strategyOptions)<br>- Backend: `juan-retirement-app/modules/withdrawal_strategies.py`<br>- Tests: `webapp/e2e/withdrawal-strategies.spec.ts` (to be created) |
| **User Impact** | **High** - Withdrawal strategy choice significantly impacts retirement outcomes. Incorrect strategy behavior leads to suboptimal plans, tax overpayment, or benefit loss. Users trust these strategies for critical financial decisions. |
| **Known Issues** | - No comprehensive E2E tests for strategies currently<br>- Strategy behavior not fully documented<br>- Users may not understand when to use each strategy<br>- No visual comparison tool for strategies<br>- Python backend changes may break strategies without detection<br>- RRIF Splitting strategy recently implemented (needs validation)<br>- Corporate Optimized strategy may have edge cases<br>- Income Minimization GIS calculations complex |
| **Success Metrics** | - [ ] 100% of 6 strategies have E2E tests<br>- [ ] All tests pass in CI/CD<br>- [ ] Zero strategy-related bugs in production<br>- [ ] Test coverage >90% for withdrawal logic<br>- [ ] Regression test suite catches breaking changes<br>- [ ] Strategy selection guide created<br>- [ ] User complaints about strategy behavior <1% |
| **Dependencies** | - Python backend (`juan-retirement-app/`) functional<br>- Simulation API (`/api/simulation/run`) working<br>- Playwright E2E framework set up<br>- Test fixtures and utilities created<br>- Access to anonymized production data for realistic tests |
| **Related Stories** | US-013 (RRIF Strategy Validation), US-022 (What-If Slider Testing), US-027 (Educational Guidance) |

---

#### Epic 7: Performance & Optimization

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-016** | **Simulation Performance - Large Datasets** | **8** | **P3** | **📋 Backlog** |
| **Description** | As a user with complex finances, I want simulations to run in <3 seconds so that I can iterate quickly on different scenarios |
| **Acceptance Criteria** | - [ ] Simulations complete in <3 seconds<br>- [ ] Progress indicator for long operations<br>- [ ] Database queries optimized<br>- [ ] Python backend performance profiled<br>- [ ] Caching implemented where appropriate |
| **Tasks** | - [ ] Profile current performance<br>- [ ] Identify bottlenecks<br>- [ ] Optimize database queries<br>- [ ] Add caching layer<br>- [ ] Test with large datasets<br>- [ ] Document performance benchmarks |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-017** | **Mobile Responsiveness - Simulation Results** | **5** | **P3** | **📋 Backlog** |
| **Description** | As a mobile user, I want simulation results to be readable and interactive on my phone so that I can review my plan anywhere |
| **Acceptance Criteria** | - [ ] Charts render correctly on mobile<br>- [ ] Tables are scrollable/collapsible<br>- [ ] Touch gestures work (pinch zoom)<br>- [ ] All buttons/links are tappable<br>- [ ] Text is readable without zooming |
| **Tasks** | - [ ] Audit mobile experience<br>- [ ] Fix chart responsiveness<br>- [ ] Add mobile-friendly tables<br>- [ ] Test on iOS and Android<br>- [ ] Optimize touch targets |

---

### Low Priority (Future Sprints)

#### Epic 8: Advanced Features

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-018** | **Scenario Comparison - Side-by-Side** | **13** | **P4** | **📋 Backlog** |
| **Description** | As a user, I want to compare 2-3 simulations side-by-side so that I can make informed decisions about retirement strategies |
| **Acceptance Criteria** | - [ ] Select up to 3 saved simulations<br>- [ ] View key metrics in comparison table<br>- [ ] Charts overlay different scenarios<br>- [ ] Highlight differences/tradeoffs<br>- [ ] Export comparison to PDF |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-019** | **Monte Carlo Simulation** | **21** | **P4** | **📋 Backlog** |
| **Description** | As a sophisticated user, I want to see probability distributions for my retirement outcomes so that I can understand risk levels |
| **Acceptance Criteria** | - [ ] Run 1000+ simulation iterations<br>- [ ] Show probability of success (10th, 50th, 90th percentile)<br>- [ ] Configurable variables (returns, inflation)<br>- [ ] Visual confidence intervals<br>- [ ] Performance optimized (<10 seconds) |

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-020** | **Social Security Integration (US)** | **34** | **P5** | **📋 Icebox** |
| **Description** | As a US user, I want to plan retirement with Social Security instead of CPP/OAS so that I can use RetireZest for US retirement planning |
| **Acceptance Criteria** | - [ ] SSA benefit calculator integrated<br>- [ ] Country selector in profile<br>- [ ] US tax calculations<br>- [ ] Medicare cost estimates<br>- [ ] State tax variations |
| **Notes** | Large effort, low ROI. Focus on Canadian market first. |

---

#### Epic 9: Security & Compliance

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-030** | **Comprehensive Security Controls Audit** | **13** | **P1** | **📋 To Do** |
| **Description** | As a product owner, I want a comprehensive security audit of the application to identify and remediate vulnerabilities so that user data remains protected and we comply with industry best practices |
| **Acceptance Criteria** | - [ ] Authentication security reviewed (password hashing, session management)<br>- [ ] Authorization controls audited (role-based access, admin controls)<br>- [ ] Input validation reviewed (SQL injection, XSS prevention)<br>- [ ] API security assessed (CSRF protection, rate limiting)<br>- [ ] Data encryption verified (at rest and in transit)<br>- [ ] Environment variable security confirmed (no secrets in code)<br>- [ ] Third-party dependencies audited (npm audit, known CVEs)<br>- [ ] OWASP Top 10 checklist completed<br>- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)<br>- [ ] File upload security reviewed (if applicable)<br>- [ ] Logging and monitoring for security events<br>- [ ] Incident response plan documented |
| **Tasks** | - [ ] Authentication Audit:<br>  - [ ] Review password hashing (bcrypt/argon2)<br>  - [ ] Check session token security<br>  - [ ] Verify password reset flow security<br>  - [ ] Test for session fixation vulnerabilities<br>  - [ ] Audit email verification process<br><br>- [ ] Authorization Audit:<br>  - [ ] Review admin access controls (requireAdmin)<br>  - [ ] Test for privilege escalation vulnerabilities<br>  - [ ] Verify user data isolation (users can't access others' data)<br>  - [ ] Check API endpoint authorization<br>  - [ ] Review premium feature gating security<br><br>- [ ] Input Validation:<br>  - [ ] Test all forms for XSS vulnerabilities<br>  - [ ] Review SQL injection prevention (Prisma parameterization)<br>  - [ ] Check for command injection risks<br>  - [ ] Validate file upload security (if any)<br>  - [ ] Test for path traversal vulnerabilities<br><br>- [ ] API Security:<br>  - [ ] Verify CSRF protection on all POST/PUT/DELETE routes<br>  - [ ] Implement rate limiting on sensitive endpoints<br>  - [ ] Review CORS configuration<br>  - [ ] Check for API enumeration vulnerabilities<br>  - [ ] Audit webhook security (Stripe webhooks)<br><br>- [ ] Data Protection:<br>  - [ ] Verify database encryption at rest (Neon/Vercel Postgres)<br>  - [ ] Confirm TLS/SSL for all connections<br>  - [ ] Review PII handling (email, financial data)<br>  - [ ] Check for sensitive data in logs<br>  - [ ] Audit account deletion flow (GDPR compliance)<br><br>- [ ] Infrastructure Security:<br>  - [ ] Review Vercel security settings<br>  - [ ] Audit environment variable management<br>  - [ ] Check for secrets in git history<br>  - [ ] Review deployment access controls<br>  - [ ] Verify database access restrictions<br><br>- [ ] Dependency Security:<br>  - [ ] Run npm audit and fix vulnerabilities<br>  - [ ] Review critical dependencies (Next.js, Prisma, Stripe)<br>  - [ ] Check for outdated packages with known CVEs<br>  - [ ] Implement Dependabot or Snyk monitoring<br><br>- [ ] Security Headers:<br>  - [ ] Configure Content-Security-Policy<br>  - [ ] Enable HSTS (Strict-Transport-Security)<br>  - [ ] Set X-Frame-Options to prevent clickjacking<br>  - [ ] Configure X-Content-Type-Options<br>  - [ ] Set Referrer-Policy<br><br>- [ ] Logging & Monitoring:<br>  - [ ] Log authentication failures (brute force detection)<br>  - [ ] Monitor admin access (audit trail)<br>  - [ ] Alert on suspicious activity (rate limit violations)<br>  - [ ] Log payment failures and webhook errors<br>  - [ ] Set up Sentry or similar error monitoring<br><br>- [ ] Compliance:<br>  - [ ] OWASP Top 10 checklist review<br>  - [ ] GDPR compliance verification (account deletion, data export)<br>  - [ ] PCI DSS considerations (Stripe handles cards, but verify)<br>  - [ ] Privacy policy review<br>  - [ ] Terms of service review |
| **Technical Notes** | **Critical Areas to Audit:**<br><br>**1. Authentication (app/api/auth/):**<br>- Login: `app/api/auth/login/route.ts`<br>- Register: `app/api/auth/register/route.ts`<br>- Password reset: `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`<br>- Email verification: `app/api/auth/verify-email/route.ts`<br>- Session management: Cookie-based or JWT?<br><br>**2. Authorization (lib/admin-auth.ts, middleware):**<br>- `requireAdmin()` function security<br>- User data isolation in Prisma queries<br>- Premium feature gating logic<br><br>**3. Sensitive Endpoints:**<br>- `/api/admin/*` - Admin-only access<br>- `/api/profile/*` - User data CRUD<br>- `/api/subscription/*` - Payment processing<br>- `/api/simulation/*` - Financial calculations<br>- `/api/webhooks/stripe` - Stripe webhook handler<br><br>**4. CSRF Protection:**<br>- `/api/csrf` endpoint provides token<br>- Verify all mutating operations validate CSRF token<br><br>**5. Environment Variables:**<br>- DATABASE_URL (should not be in code)<br>- STRIPE_SECRET_KEY (must be secure)<br>- RESEND_API_KEY (email service)<br>- JWT_SECRET or SESSION_SECRET<br><br>**6. Known Issues from Build:**<br>- 25 npm vulnerabilities (1 low, 14 moderate, 8 high, 2 critical)<br>- Need to prioritize and remediate<br><br>**7. Security Headers (next.config.js or middleware):**<br>```typescript<br>const securityHeaders = [<br>  { key: 'X-Frame-Options', value: 'DENY' },<br>  { key: 'X-Content-Type-Options', value: 'nosniff' },<br>  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },<br>  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },<br>  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." }<br>];<br>```<br><br>**8. Rate Limiting (consider implementing):**<br>- Login attempts: 5 per 15 minutes<br>- Password reset: 3 per hour<br>- API calls: 100 per minute per user<br>- Admin endpoints: 50 per minute |
| **User Impact** | **Critical** - Security breaches can result in:<br>- Loss of user trust and reputation damage<br>- Financial liability (GDPR fines, legal costs)<br>- User data exposure (PII, financial data)<br>- Service disruption from attacks<br>- Regulatory compliance issues |
| **Known Security Features (to verify):**<br>- ✅ CSRF protection exists (`/api/csrf`)<br>- ✅ Admin access control (`requireAdmin`)<br>- ✅ Prisma ORM (SQL injection protection)<br>- ✅ HTTPS enforced (Vercel)<br>- ⚠️ Rate limiting: Unknown<br>- ⚠️ Security headers: Unknown<br>- ⚠️ Input validation: Needs review<br>- ⚠️ Session security: Needs review |
| **Success Metrics** | - [ ] Zero critical vulnerabilities found<br>- [ ] All OWASP Top 10 risks mitigated<br>- [ ] 100% of npm critical/high vulnerabilities fixed<br>- [ ] Security headers score A+ on securityheaders.com<br>- [ ] Penetration testing completed (manual or automated)<br>- [ ] Security incident response plan documented<br>- [ ] All team members trained on security best practices |
| **Dependencies** | - Access to production environment (for header testing)<br>- Security testing tools (OWASP ZAP, Burp Suite, or similar)<br>- npm audit and Snyk/Dependabot setup<br>- Security expert review (internal or external consultant) |
| **References** | - OWASP Top 10: https://owasp.org/www-project-top-ten/<br>- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy<br>- Vercel Security: https://vercel.com/docs/security<br>- Prisma Security: https://www.prisma.io/docs/concepts/components/prisma-client/security |

---

#### Epic 10: Monetization & Revenue

| ID | User Story | Story Points | Priority | Status |
|----|------------|--------------|----------|--------|
| **US-024** | **Premium Account Verification & Payment Acceptance Testing** | **8** | **P0** | **📋 To Do** |
| **Description** | As a product owner, I want comprehensive testing and verification of the Stripe premium subscription system so that users can successfully subscribe and access premium features without payment failures |
| **Acceptance Criteria** | - [ ] Stripe checkout session creation works (monthly & yearly plans)<br>- [ ] Payment processing completes successfully for test cards<br>- [ ] Webhook handlers process subscription events correctly<br>- [ ] User account upgraded to premium after successful payment<br>- [ ] Premium features unlock immediately after payment<br>- [ ] Billing portal allows users to manage subscriptions<br>- [ ] Cancellation flow works correctly<br>- [ ] Failed payment handling works (retry logic, notifications)<br>- [ ] Subscription renewal works for existing subscribers<br>- [ ] Edge cases tested (promo codes, refunds, disputes)<br>- [ ] Production Stripe credentials configured correctly<br>- [ ] Monitoring and alerting set up for payment failures |
| **Tasks** | - [ ] Test monthly subscription ($5.99/month)<br>- [ ] Test yearly subscription ($47.00/year)<br>- [ ] Test Stripe Checkout redirect flow<br>- [ ] Verify webhook endpoint receives events<br>- [ ] Test checkout.session.completed webhook<br>- [ ] Test customer.subscription.created webhook<br>- [ ] Test customer.subscription.updated webhook<br>- [ ] Test customer.subscription.deleted webhook<br>- [ ] Test invoice.payment_succeeded webhook<br>- [ ] Test invoice.payment_failed webhook<br>- [ ] Verify user isPremium flag updates correctly<br>- [ ] Test premium feature gating (early retirement, scenarios, reports)<br>- [ ] Test billing portal redirect<br>- [ ] Test subscription cancellation<br>- [ ] Test subscription reactivation<br>- [ ] Test failed payment retry logic<br>- [ ] Load test checkout flow (100+ concurrent users)<br>- [ ] Verify Stripe Dashboard shows correct data<br>- [ ] Document common payment issues and resolutions<br>- [ ] Create monitoring dashboard for payment metrics |
| **Technical Notes** | **Frontend Components:**<br>- `app/(dashboard)/subscribe/page.tsx` - Subscription page<br>- `app/(dashboard)/subscribe/success/page.tsx` - Success page<br>- `app/(dashboard)/account/billing/page.tsx` - Billing portal<br><br>**Backend API Routes:**<br>- `app/api/subscription/create-checkout/route.ts` - Checkout session creation<br>- `app/api/subscription/billing-portal/route.ts` - Billing portal access<br>- `app/api/webhooks/stripe/route.ts` - Webhook event handling<br><br>**Stripe Configuration:**<br>- `lib/stripe.ts` - Stripe client and utilities<br>- Environment variables: STRIPE_SECRET_KEY, STRIPE_PREMIUM_MONTHLY_PRICE_ID, STRIPE_PREMIUM_YEARLY_PRICE_ID<br><br>**Price IDs to Verify:**<br>- Monthly: $5.99/month<br>- Yearly: $47.00/year (saves $25/year)<br><br>**Test Cards:**<br>- Success: 4242 4242 4242 4242<br>- Decline: 4000 0000 0000 0002<br>- Requires Auth: 4000 0025 0000 3155 |
| **User Impact** | **Critical** - Revenue depends on working payment system. Payment failures result in lost subscriptions and revenue. Users expect seamless checkout experience. |
| **Known Issues** | - Stripe integration already deployed to production<br>- Monthly/yearly plans configured<br>- Webhook endpoint exists but needs comprehensive testing<br>- No load testing conducted yet<br>- No monitoring dashboard for payment metrics<br>- Unclear if production credentials are configured correctly<br>- Test scripts exist: check-production-stripe.ts, get-stripe-prices.ts |
| **Success Metrics** | - [ ] 100% success rate on test card transactions<br>- [ ] <2% payment failure rate in production<br>- [ ] 100% of webhooks processed within 5 seconds<br>- [ ] Zero missed subscription activations<br>- [ ] 95% uptime for payment infrastructure<br>- [ ] <1% customer support tickets related to payment issues |
| **Dependencies** | - Stripe account with production access<br>- Production environment variables configured<br>- Webhook endpoint registered with Stripe<br>- Test credit cards for various scenarios |

---

| **US-032** | **Premium Benefits Verification & End-to-End Testing** | **8** | **P1** | **📋 To Do** |
| **Description** | As a product owner, I want to verify that all premium features work correctly end-to-end and that the premium value proposition is clear to users, so that premium subscribers get full value for their subscription |
| **Acceptance Criteria** | **Premium Feature Testing:**<br>- [ ] Early retirement calculator accessible only to premium users<br>- [ ] Multiple market scenarios (pessimistic, neutral, optimistic) work correctly<br>- [ ] CSV export functionality works for all data types<br>- [ ] PDF report generation works and includes all sections<br>- [ ] Full data export includes all user data<br>- [ ] Interactive retirement age slider functions correctly<br>- [ ] Detailed year-by-year projections display properly<br>- [ ] Advanced charts render correctly<br>- [ ] Priority email support auto-routes correctly<br><br>**Feature Gating:**<br>- [ ] Free users see upgrade prompts for premium features<br>- [ ] Premium users see no upgrade prompts<br>- [ ] Feature gate UI is clear and non-intrusive<br>- [ ] Upgrade flow from feature gate works seamlessly<br><br>**User Experience:**<br>- [ ] Premium badge shows on account page<br>- [ ] Premium features highlighted in UI<br>- [ ] Value proposition clear on subscription page<br>- [ ] Premium benefits documented in help section<br><br>**Edge Cases:**<br>- [ ] Subscription expiration handled gracefully<br>- [ ] Downgrade from premium to free works<br>- [ ] Mid-use feature access revoked correctly<br>- [ ] Premium features persist across sessions |
| **Tasks** | **E2E Premium User Journey:**<br>- [ ] Test signup → subscribe → use premium features flow<br>- [ ] Test free user → hit feature gate → upgrade → access feature<br>- [ ] Test premium user → cancel → downgrade → restricted access<br>- [ ] Test premium user → subscription expires → grace period → downgrade<br><br>**Individual Feature Testing:**<br>- [ ] Early retirement calculator (calculations accurate)<br>- [ ] Market scenarios (3 scenarios generate different results)<br>- [ ] CSV export (all columns present, data accurate)<br>- [ ] PDF report (all sections render, data matches dashboard)<br>- [ ] Data export (JSON structure complete, no PII leaks)<br>- [ ] Retirement age slider (smooth interaction, recalculates correctly)<br>- [ ] Year-by-year projections (accurate, complete, formatted)<br>- [ ] Advanced charts (responsive, interactive, data-driven)<br><br>**Feature Gate UI Testing:**<br>- [ ] Audit all premium feature gates in codebase<br>- [ ] Test each gate with free and premium accounts<br>- [ ] Verify upgrade modal appearance and messaging<br>- [ ] Test "Upgrade to Premium" button flows<br><br>**Documentation:**<br>- [ ] Create premium features testing checklist<br>- [ ] Document expected vs actual behavior for each feature<br>- [ ] Screenshot all premium features for reference<br>- [ ] Create premium feature demo video |
| **Technical Notes** | **Premium Features List:**<br>1. Early retirement calculator (`/early-retirement`)<br>2. Multiple market scenarios (pessimistic, neutral, optimistic)<br>3. CSV export (`/api/simulation/export/csv`)<br>4. PDF report generation (html2pdf.js)<br>5. Full data export (`/api/account/export`)<br>6. Interactive retirement age slider<br>7. Detailed year-by-year projections<br>8. Advanced charts (all chart components)<br>9. Priority email support<br><br>**Feature Gate Components:**<br>- `components/modals/UpgradeModal.tsx`<br>- Feature checks: `isPremium` flag in session<br>- Premium routes: Check `/app/(dashboard)` for premium-only pages<br><br>**Test Accounts Needed:**<br>- Free account (to test gates)<br>- Premium account (to test features)<br>- Expired premium account (to test downgrade)<br><br>**Data to Verify:**<br>- CSV: All account types, income sources, expenses<br>- PDF: Health score, charts, action plan, year-by-year<br>- Export: Complete user profile without sensitive data |
| **User Impact** | **High** - Premium users pay for features and expect them to work. Feature gates must not frustrate free users. Clear value proposition increases conversion rate. |
| **Known Issues** | - Premium features implemented incrementally<br>- No comprehensive E2E test suite for premium flow<br>- Feature gates may be inconsistent across app<br>- PDF generation may have formatting issues<br>- CSV export columns may be incomplete<br>- No automated testing for premium features<br>- Upgrade modal styling may vary across pages |
| **Success Metrics** | - [ ] 100% of premium features functional<br>- [ ] Zero critical bugs in premium features<br>- [ ] <5% premium support tickets about feature access<br>- [ ] 10%+ conversion rate from free to premium (via feature gates)<br>- [ ] 90%+ premium subscriber satisfaction (feature quality)<br>- [ ] <1% churn due to feature issues |
| **Dependencies** | - US-024 completed (payment system working)<br>- Premium Stripe subscription active for testing<br>- Access to Stripe test environment<br>- PDF generation library (html2pdf.js) functional<br>- CSV export tested with real user data |
| **Related Stories** | US-024 (Premium Payment Testing), US-008 (Wizard Pre-fill) |

---

| **US-033** | **PDF Report Content & Formatting Improvements** | **5** | **P2** | **📋 To Do** |
| **Description** | As a premium user, I want professional, well-formatted PDF reports that display correctly on both web and mobile devices, so that I can share my retirement plan with family, advisors, or save for my records |
| **Acceptance Criteria** | **Content Completeness:**<br>- [ ] Cover page with user name, generation date, and branding<br>- [ ] Executive summary (health score, key insights, final estate)<br>- [ ] Household information (names, ages, province, planning horizon)<br>- [ ] Assets breakdown (TFSA, RRSP, RRIF, NonReg, Real Estate)<br>- [ ] Income sources (CPP, OAS, GIS, pensions, employment)<br>- [ ] Expenses summary (Go-Go, Slow-Go, No-Go phases + one-time)<br>- [ ] Withdrawal strategy explanation<br>- [ ] Health score breakdown (success rate, years funded)<br>- [ ] All major charts (portfolio, tax, spending, benefits)<br>- [ ] Year-by-year projection table (key years)<br>- [ ] Action plan with prioritized recommendations<br>- [ ] Assumptions and methodology<br>- [ ] Disclaimer and contact information<br><br>**Formatting & Design:**<br>- [ ] Professional layout with proper spacing<br>- [ ] Page breaks in logical places<br>- [ ] Headers/footers with page numbers<br>- [ ] Consistent typography (fonts, sizes, weights)<br>- [ ] Brand colors and styling<br>- [ ] High-resolution charts (no pixelation)<br>- [ ] Tables formatted with borders and alignment<br>- [ ] Print-friendly (no wasted ink/space)<br>- [ ] Portrait orientation (standard letter size)<br><br>**Web & Mobile Rendering:**<br>- [ ] PDF renders correctly in Chrome, Safari, Firefox<br>- [ ] Mobile browsers can download and view PDF<br>- [ ] Tablets display PDF correctly<br>- [ ] File size optimized (<5MB for typical report)<br>- [ ] Loading state shows generation progress<br>- [ ] Error handling if generation fails<br><br>**User Experience:**<br>- [ ] "Generate PDF Report" button prominent in results<br>- [ ] Premium gate shows for free users<br>- [ ] Generation takes <10 seconds<br>- [ ] Filename includes user name and date<br>- [ ] Option to email PDF to self (future)<br>- [ ] Preview option before download (future) |
| **Tasks** | **Content Review:**<br>- [ ] Audit current PDF content (what's included?)<br>- [ ] Identify missing sections<br>- [ ] Review competitor PDF reports for best practices<br>- [ ] Get user feedback on desired content<br><br>**Design & Layout:**<br>- [ ] Design PDF template mockup (Figma/similar)<br>- [ ] Define typography system (fonts, sizes)<br>- [ ] Create color scheme (brand + print-friendly)<br>- [ ] Design chart rendering (size, placement)<br>- [ ] Plan page breaks and sections<br>- [ ] Design cover page<br>- [ ] Design footer with page numbers<br><br>**Implementation:**<br>- [ ] Refactor PDF generation code (currently ad-hoc)<br>- [ ] Implement template system (reusable components)<br>- [ ] Improve chart rendering (canvas → high-res image)<br>- [ ] Add missing content sections<br>- [ ] Implement proper page breaks<br>- [ ] Add headers/footers<br>- [ ] Optimize file size (compress images, remove bloat)<br>- [ ] Add loading state with progress indicator<br>- [ ] Implement error handling and retry logic<br><br>**Testing:**<br>- [ ] Test PDF generation with various data (small, large, edge cases)<br>- [ ] Test on Chrome, Safari, Firefox (desktop)<br>- [ ] Test on iOS Safari, Chrome Mobile, Android Chrome<br>- [ ] Test on tablets (iPad, Android tablet)<br>- [ ] Test printing from PDF (real printer)<br>- [ ] Test file sizes (<5MB goal)<br>- [ ] Test generation performance (<10 sec goal)<br>- [ ] User testing for readability and usefulness<br><br>**Documentation:**<br>- [ ] Document PDF generation process<br>- [ ] Create troubleshooting guide<br>- [ ] Add help article: "Understanding Your PDF Report"<br>- [ ] Screenshot sections for documentation |
| **Technical Notes** | **Current Implementation:**<br>- Library: `html2pdf.js` (now at v0.14.0, fixed XSS vulnerability)<br>- Component: Likely in dashboard or results page<br>- Approach: Renders HTML → converts to PDF<br><br>**Challenges:**<br>1. **Chart Rendering**: Recharts uses SVG/Canvas, may not export well<br>   - Solution: Convert charts to high-res images before PDF generation<br><br>2. **Page Breaks**: html2pdf.js has limited control<br>   - Solution: Use `page-break-before` CSS carefully<br>   - Test thoroughly to avoid orphaned content<br><br>3. **Mobile File Size**: Large PDFs fail on mobile<br>   - Solution: Compress images, optimize chart resolution<br>   - Target: 2-3 MB for typical report<br><br>4. **Generation Time**: Complex reports can take 15-30 seconds<br>   - Solution: Show progress indicator, optimize rendering<br>   - Consider server-side PDF generation (Puppeteer) for speed<br><br>**Alternative Libraries (if html2pdf.js insufficient):**<br>- **jsPDF**: More control, but lower-level API<br>- **pdfmake**: Good for tables and text, limited chart support<br>- **Puppeteer (server-side)**: Faster, more reliable, but requires backend<br><br>**Recommended Approach:**<br>1. Start with html2pdf.js improvements (already integrated)<br>2. If issues persist, consider server-side generation<br><br>**Content Sections (Prioritized):**<br>1. Cover page (branding, date)<br>2. Executive summary (1 page)<br>3. Household info (0.5 page)<br>4. Portfolio chart + breakdown (1 page)<br>5. Health score analysis (1 page)<br>6. Tax analysis chart (1 page)<br>7. Action plan (1-2 pages)<br>8. Year-by-year table (2-3 pages, key years only)<br>9. Assumptions and methodology (1 page)<br>10. Disclaimer (0.5 page)<br><br>**Total Pages**: 10-15 pages typical |
| **User Impact** | **High** - PDF reports are a key premium feature. Users expect professional quality comparable to financial planning tools. Poor formatting reduces perceived value. |
| **Known Issues** | - Current PDF generation may be basic/unformatted<br>- Charts may not render well<br>- Missing key sections (cover page, assumptions)<br>- No page numbers or headers/footers<br>- File sizes may be large<br>- Mobile rendering untested<br>- Generation may be slow<br>- No error handling for failures |
| **Success Metrics** | - [ ] 90%+ of premium users generate PDF reports<br>- [ ] <5% PDF generation failures<br>- [ ] Average file size <3MB<br>- [ ] Generation time <10 seconds<br>- [ ] User satisfaction with PDF quality >4/5<br>- [ ] <2% support tickets about PDF issues<br>- [ ] PDFs shared externally (indicates quality/trust) |
| **Dependencies** | - html2pdf.js library (v0.14.0, already updated in BUILD-FIX)<br>- jspdf library (v4.0.0, already updated in BUILD-FIX)<br>- Chart components functional<br>- Simulation data complete and accurate |
| **Related Stories** | US-032 (Premium Benefits Testing - includes PDF testing), US-024 (Premium Payment) |

---

| **US-034** | **Premium Features Review & Monetization Analysis** | **5** | **P1** | **📋 To Do** |
| **Description** | As a product owner, I want to review the effectiveness of premium features and analyze monetization performance so that I can optimize pricing, features, and conversion strategies |
| **Acceptance Criteria** | **Premium Feature Usage Analysis:**<br>- [ ] Track usage frequency of each premium feature<br>- [ ] Identify most/least used premium features<br>- [ ] Analyze feature adoption rate by cohort<br>- [ ] Compare expected vs actual feature usage<br><br>**Conversion & Retention Metrics:**<br>- [ ] Free-to-premium conversion rate<br>- [ ] Premium subscription churn rate<br>- [ ] Average time to conversion (days from signup)<br>- [ ] Conversion rate by feature gate touchpoint<br>- [ ] Monthly Recurring Revenue (MRR) growth<br>- [ ] Annual vs monthly plan split<br><br>**User Behavior Analysis:**<br>- [ ] Feature usage patterns (which features drive value?)<br>- [ ] Correlation between features and retention<br>- [ ] Premium user engagement vs free user engagement<br>- [ ] User feedback on premium features (support tickets, ratings)<br><br>**Monetization Optimization:**<br>- [ ] Evaluate pricing strategy ($5.99/mo, $47/yr)<br>- [ ] Compare to competitor pricing<br>- [ ] Identify opportunities for upsells/add-ons<br>- [ ] Assess value perception (is premium worth it?)<br>- [ ] Identify feature gaps (what premium users want)<br><br>**Financial Metrics:**<br>- [ ] Customer Acquisition Cost (CAC) for premium<br>- [ ] Lifetime Value (LTV) of premium subscribers<br>- [ ] LTV/CAC ratio (should be >3)<br>- [ ] Break-even point (when do we recover CAC?)<br>- [ ] Revenue per premium user<br>- [ ] Projected revenue at 100/500/1000 premium users |
| **Tasks** | **Data Collection:**<br>- [ ] Implement premium feature usage tracking (analytics events)<br>- [ ] Create premium user dashboard (analytics)<br>- [ ] Set up conversion funnel tracking<br>- [ ] Query Stripe for subscription metrics<br>- [ ] Survey premium users (feature satisfaction, value perception)<br><br>**Analysis:**<br>- [ ] Generate premium feature usage report<br>- [ ] Analyze conversion funnel (where do users drop off?)<br>- [ ] Calculate CAC, LTV, LTV/CAC ratio<br>- [ ] Benchmark against industry standards<br>- [ ] Identify most impactful conversion touchpoints<br>- [ ] Review competitor pricing and features<br><br>**Optimization Recommendations:**<br>- [ ] Prioritize features to build/improve based on data<br>- [ ] Recommend pricing adjustments (if needed)<br>- [ ] Suggest new premium features to add<br>- [ ] Identify low-value features to deprecate/move to free<br>- [ ] Optimize feature gate messaging<br>- [ ] Create retention strategies for premium users<br><br>**Documentation:**<br>- [ ] Write monetization analysis report<br>- [ ] Create premium features dashboard (ongoing tracking)<br>- [ ] Document pricing strategy and rationale<br>- [ ] Update product roadmap based on findings<br>- [ ] Present findings to stakeholders |
| **Technical Notes** | **Current Premium Features (9 total):**<br>1. **Early Retirement Calculator**: Unlimited calculations (free: 10/day)<br>   - Usage metric: API calls to `/api/early-retirement/calculate`<br>   - Value hypothesis: High - enables retirement planning<br><br>2. **Scenario Persistence**: Save/load simulations<br>   - Usage metric: API calls to `/api/scenarios/save`, `/api/scenarios/route`<br>   - Value hypothesis: Medium - convenience for repeat users<br><br>3. **CSV Export**: Download simulation data<br>   - Usage metric: Button clicks, downloads completed<br>   - Value hypothesis: Medium - useful for advisors<br><br>4. **PDF Report**: Professional retirement report<br>   - Usage metric: Button clicks, PDFs generated<br>   - Value hypothesis: High - shareable, professional<br><br>5. **Interactive Retirement Age Slider**: What-if scenarios<br>   - Usage metric: Slider interactions, simulations run<br>   - Value hypothesis: High - enables exploration<br><br>6. **Multiple Market Scenarios**: Pessimistic/neutral/optimistic<br>   - Usage metric: Scenario switches, comparisons made<br>   - Value hypothesis: Medium - risk assessment<br><br>7. **Detailed Year-by-Year Projections**: Full data<br>   - Usage metric: Table views, expansions<br>   - Value hypothesis: Medium - transparency<br><br>8. **Advanced Charts**: Enhanced visualizations<br>   - Usage metric: Chart interactions, views<br>   - Value hypothesis: Low-Medium - aesthetic value<br><br>9. **Priority Email Support**: Faster responses<br>   - Usage metric: Support tickets from premium users, response time<br>   - Value hypothesis: Low - rarely used<br><br>**Key Questions to Answer:**<br>1. Which premium feature drives the most conversions?<br>2. Do premium users use all 9 features, or just 1-2?<br>3. What's the average time from signup to conversion?<br>4. Do users convert on first feature gate, or after multiple encounters?<br>5. Is the yearly plan ($47) more popular than monthly ($5.99)?<br>6. What's the churn rate for premium subscribers?<br>7. Why do premium users churn? (exit survey)<br>8. Are we leaving money on the table (underpriced)?<br>9. Should we add more tiers (e.g., Pro, Enterprise)?<br>10. What features should we add to increase value?<br><br>**Financial Calculations:**<br>- CAC = (Marketing + Sales Cost) / New Premium Subscribers<br>- LTV = (Monthly Revenue × Gross Margin) / Churn Rate<br>- Target LTV/CAC: >3 (ideally 5-7)<br>- Break-even: When does revenue > CAC?<br><br>**Competitive Benchmarks:**<br>- NewRetirement: $120/year (~$10/month)<br>- Boldin (formerly NewRetirement): $95/year<br>- Personal Capital: Free (monetizes through wealth management)<br>- Wealthica: $50/year CAD (~$36 USD)<br>- RetireZest: $47/year (~$4/month) - competitive! |
| **User Impact** | **Critical** - Monetization success determines business viability. Underpriced = leaving money on table. Overpriced = low conversion. Wrong features = low retention. This analysis guides product strategy. |
| **Known Issues** | - No analytics tracking for premium feature usage yet<br>- Conversion funnel not instrumented<br>- No user satisfaction surveys<br>- Limited data (new feature, few premium users yet)<br>- CAC unknown (no marketing spend tracked)<br>- Competitive pricing research not done<br>- No A/B testing of pricing/features |
| **Success Metrics** | - [ ] Data-driven recommendation for pricing optimization<br>- [ ] Identify top 3 value-driving features<br>- [ ] Achieve LTV/CAC ratio >3<br>- [ ] Increase free-to-premium conversion by 20%<br>- [ ] Reduce premium churn to <5% monthly<br>- [ ] Premium user satisfaction >4.5/5<br>- [ ] Clear product roadmap for premium features<br>- [ ] Monetization dashboard created (ongoing tracking) |
| **Dependencies** | - US-024 (Premium Payment System) complete<br>- US-032 (Premium Benefits Testing) complete<br>- Analytics platform (Posthog/Mixpanel) integrated<br>- At least 20-50 premium users for meaningful data<br>- Access to Stripe subscription data<br>- User survey tool (Typeform, Google Forms) |
| **Related Stories** | US-024 (Premium Payment), US-032 (Premium Benefits Testing), US-033 (PDF Reports) |

---

## 🎯 Epics

### Epic 1: User Retention & Engagement
**Goal**: Reduce user churn by 40% through proactive issue identification and resolution
**Total Story Points**: 31
**Status**: 🔄 In Progress
**User Stories**: US-001, US-002, US-003, US-004, US-005

### Epic 2: French Language Support
**Goal**: Expand to Quebec market (~22% of Canadian population)
**Total Story Points**: 34
**Status**: 📋 Backlog
**User Stories**: US-006, US-007

### Epic 3: Investment & Account Configuration
**Goal**: Give users control over investment return assumptions and account settings
**Total Story Points**: 8
**Status**: 📋 Backlog
**User Stories**: US-021

### Epic 4: UX Improvements
**Goal**: Reduce onboarding abandonment and improve user satisfaction
**Total Story Points**: 15
**Status**: 🔄 In Progress
**User Stories**: US-008 (✅), US-009, US-010 (✅), US-025, US-026

### Epic 5: Simulation Accuracy & Features
**Goal**: Ensure simulation results are accurate and trustworthy
**Total Story Points**: 50 (was 34, +16 for US-036 and US-037)
**Status**: 🔄 In Progress
**User Stories**: US-011 (✅), US-012 (✅), US-013, US-023, US-031, US-036, US-037

### Epic 6: Testing & Quality
**Goal**: Achieve >80% test coverage and prevent regression bugs
**Total Story Points**: 34
**Status**: 📋 Backlog
**User Stories**: US-014, US-015, US-022, US-035

### Epic 7: Performance & Optimization
**Goal**: Improve app performance and mobile experience
**Total Story Points**: 13
**Status**: 📋 Backlog
**User Stories**: US-016, US-017

### Epic 8: Advanced Features
**Goal**: Add sophisticated features for power users
**Total Story Points**: 68
**Status**: 📋 Icebox
**User Stories**: US-018, US-019, US-020

### Epic 9: Security & Compliance
**Goal**: Ensure application security and protect user data
**Total Story Points**: 13
**Status**: 📋 To Do
**User Stories**: US-030

### Epic 10: Monetization & Revenue
**Goal**: Ensure reliable payment processing, subscription management, and premium feature delivery
**Total Story Points**: 26
**Status**: 📋 To Do
**User Stories**: US-024, US-032, US-033, US-034

---

## 📝 User Story Template

```markdown
### US-XXX: [Title]

**As a** [user role]
**I want** [goal/desire]
**So that** [benefit/value]

**Story Points**: [1, 2, 3, 5, 8, 13, 21, 34]
**Priority**: [P0-Critical, P1-High, P2-Medium, P3-Low, P4-Nice-to-have, P5-Icebox]
**Epic**: [Epic name]
**Sprint**: [Sprint number or Backlog]

#### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

#### Technical Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

#### Definition of Done
- [ ] Code complete
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Product owner approved

#### Notes
[Any additional context, dependencies, or technical notes]
```

---

## ✅ Definition of Done

A user story is considered "Done" when:

### Code Quality
- [ ] Code is written and committed to version control
- [ ] Code follows project style guidelines
- [ ] No compiler/linter warnings
- [ ] No console errors in browser

### Testing
- [ ] Unit tests written and passing (where applicable)
- [ ] Integration tests passing (where applicable)
- [ ] Manual testing completed
- [ ] Edge cases tested

### Review
- [ ] Code review completed by peer
- [ ] Feedback addressed
- [ ] Product owner reviewed feature

### Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] User-facing documentation updated (if needed)
- [ ] Code comments added for complex logic

### Deployment
- [ ] Deployed to staging environment
- [ ] Smoke tests passed in staging
- [ ] Deployed to production
- [ ] Verified working in production

### Acceptance
- [ ] All acceptance criteria met
- [ ] Product owner approved
- [ ] No critical bugs
- [ ] Performance acceptable

---

## 🏃 Sprint Planning Process

### Sprint Duration
**2 weeks** (10 business days)

### Sprint Ceremonies

#### 1. Sprint Planning (Monday, Week 1 - 2 hours)
- Review product backlog
- Select user stories for sprint
- Break down stories into tasks
- Estimate story points
- Define sprint goal
- Commit to sprint backlog

#### 2. Daily Standup (Every day - 15 minutes)
**Three Questions**:
1. What did I complete yesterday?
2. What will I work on today?
3. Are there any blockers?

#### 3. Sprint Review (Friday, Week 2 - 1 hour)
- Demo completed user stories
- Get feedback from stakeholders
- Update product backlog based on feedback

#### 4. Sprint Retrospective (Friday, Week 2 - 1 hour)
**Discuss**:
- What went well?
- What could be improved?
- Action items for next sprint

### Estimation

**Story Points** (Fibonacci sequence):
- **1**: Trivial (< 2 hours)
- **2**: Simple (2-4 hours)
- **3**: Moderate (4-8 hours)
- **5**: Substantial (1-2 days)
- **8**: Complex (2-3 days)
- **13**: Very complex (3-5 days)
- **21**: Epic (5-10 days) - should be broken down
- **34**: Too large - must be broken down

### Velocity Tracking

**Sprint 1 Baseline**: TBD
**Target Velocity**: 30-40 story points per 2-week sprint

Track velocity over sprints to improve estimation accuracy.

---

## 📊 Backlog Metrics

### Current Status (Jan 29, 2026)

**Total User Stories**: 35 ⬆️ New: US-036 (RRIF Tax Withholding), US-037 (Real Estate in Strategies)
**Completed**: 5 (14%)
**In Progress**: 0 (0%) - Sprint 2 complete
**To Do**: 30 (86%)

**By Priority**:
- P0 (Critical): 3 stories (2 done, 1 to do)
- P1 (High): 13 stories (2 done, 11 to do) ⬆️ New: US-034 (Monetization)
- P2 (Medium): 10 stories (1 done, 9 to do) ⬆️ New: US-036 (RRIF Withholding), US-037 (Real Estate)
- P3 (Low): 4 stories (0 done, 4 to do)
- P4 (Nice-to-have): 2 stories
- P5 (Icebox): 2 stories

**By Epic**:
- Epic 1 (User Retention): 5 stories, 31 pts (✅ 5 done - Sprint 1 complete)
- Epic 2 (French): 2 stories, 34 pts (all backlog)
- Epic 3 (Investment Config): 1 story, 8 pts (all to do)
- Epic 4 (UX): 7 stories, 28 pts (2 done, 5 to do)
- Epic 5 (Simulation): 7 stories, 68 pts (2 done, 5 to do) ⬆️ New: US-036 (RRIF Withholding), US-037 (Real Estate)
- Epic 6 (Testing): 4 stories, 34 pts (all backlog) ⬆️ New: US-035 (E2E Testing)
- Epic 7 (Performance): 2 stories, 13 pts (all backlog)
- Epic 8 (Advanced): 3 stories, 68 pts (all icebox)
- Epic 9 (Security): 1 story, 13 pts (all to do) ⬆️ NEW EPIC
- Epic 10 (Monetization): 4 stories, 26 pts (all to do)

---

## 🎯 Roadmap

### Q1 2026 (Jan-Mar)
**Focus**: User retention and core UX improvements

- ✅ Fix critical UX issues (deletion bugs)
- 🔄 Monitor re-engagement campaign
- 📋 Complete pension indexing backend
- 📋 Validate RRIF strategies
- 📋 Fix onboarding friction (Step 6)

### Q2 2026 (Apr-Jun)
**Focus**: Testing and quality improvements

- E2E test suite for critical paths
- Unit test coverage >80%
- Performance optimization
- Mobile responsiveness improvements

### Q3 2026 (Jul-Sep)
**Focus**: Market expansion

- French language support
- Quebec tax rules
- Marketing to Quebec users
- Re-engage Maurice Poitras

### Q4 2026 (Oct-Dec)
**Focus**: Advanced features

- Scenario comparison
- Monte Carlo simulation
- Advanced analytics dashboard

---

## 📞 Backlog Management

### Adding New Stories
1. Write user story following template
2. Define acceptance criteria
3. Estimate story points
4. Assign priority
5. Link to epic
6. Add to product backlog

### Refining Backlog
- **Weekly**: Review top 10 stories with product owner
- **Bi-weekly**: Re-prioritize based on user feedback
- **Monthly**: Update epic goals and roadmap

### Sources of New Stories
- User feedback (deletion reasons, support tickets)
- Analytics (user behavior, drop-off points)
- Technical debt
- Competitive analysis
- Team initiatives

---

**Document Version**: 1.0
**Created**: January 29, 2026
**Next Review**: February 5, 2026
