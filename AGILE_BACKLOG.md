# RetireZest - Agile Product Backlog

**Last Updated**: January 29, 2026 (Added US-022: What-If Scenario Slider Testing & Fixes)
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
| **US-022** | **What-If Scenario Slider Testing & Fixes** | **5** | **P1** | **📋 To Do** |
| **Description** | As a user, I want the What-If scenario sliders to work correctly and provide accurate simulation comparisons so that I can confidently explore different retirement scenarios |
| **Acceptance Criteria** | - [ ] All sliders respond correctly to user input<br>- [ ] Slider values map correctly to adjustments (e.g., spending 50-150%, retirement age -5 to +5)<br>- [ ] "Run What-If Scenario" button executes simulation successfully<br>- [ ] Results display shows accurate comparison (original vs what-if)<br>- [ ] Health score delta calculated correctly<br>- [ ] Final estate delta calculated correctly<br>- [ ] Error handling works for invalid scenarios<br>- [ ] Reset button clears all adjustments<br>- [ ] Slider state persists during interaction (no unexpected resets) |
| **Tasks** | - [ ] Audit WhatIfSliders.tsx component for bugs<br>- [ ] Test slider value mapping (spending, retirement age, CPP age, OAS age)<br>- [ ] Test /api/simulation/what-if endpoint with various adjustments<br>- [ ] Verify adjustment calculations (lines 43-45 in WhatIfSliders.tsx)<br>- [ ] Test edge cases (min/max values, boundary conditions)<br>- [ ] Fix checkHasChanges() function if needed (line 48-55)<br>- [ ] Test error handling for failed API calls<br>- [ ] Verify comparison UI renders correctly (health score, estate)<br>- [ ] Create automated E2E test for What-If feature<br>- [ ] Document known limitations and expected behavior |
| **Technical Notes** | Component located at: `webapp/components/simulation/WhatIfSliders.tsx`<br>API endpoint: `webapp/app/api/simulation/what-if/route.ts`<br>Potential issues:<br>- Slider value offsets (+5 for retirement/CPP sliders) may cause confusion<br>- handleAdjustmentChange may not trigger hasChanges update correctly<br>- Error state may not clear properly between runs<br>- What-If result may show stale data |
| **User Impact** | High - What-If scenarios are critical for users to explore different retirement strategies. Bugs here undermine confidence in the tool. |
| **Known Issues** | - User reported issues via screenshot (needs investigation)<br>- Multiple test scripts exist but may not cover all scenarios<br>- Scripts: test-what-if-comprehensive.ts, test-what-if-accuracy.ts, test-what-if-sliders.ts |

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
**Total Story Points**: 10
**Status**: 🔄 In Progress
**User Stories**: US-008 (✅), US-009, US-010 (✅)

### Epic 5: Simulation Accuracy & Features
**Goal**: Ensure simulation results are accurate and trustworthy
**Total Story Points**: 21
**Status**: 🔄 In Progress
**User Stories**: US-011 (✅), US-012 (✅), US-013

### Epic 6: Testing & Quality
**Goal**: Achieve >80% test coverage and prevent regression bugs
**Total Story Points**: 26
**Status**: 📋 Backlog
**User Stories**: US-014, US-015, US-022

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

**Total User Stories**: 22
**Completed**: 5 (23%)
**In Progress**: 2 (9%)
**To Do**: 15 (68%)

**By Priority**:
- P0 (Critical): 3 stories (2 done, 1 in progress)
- P1 (High): 6 stories (2 done, 4 to do) ⬆️ New: US-021, US-022
- P2 (Medium): 5 stories (1 done, 4 to do)
- P3 (Low): 4 stories (0 done, 4 to do)
- P4 (Nice-to-have): 2 stories
- P5 (Icebox): 2 stories

**By Epic**:
- Epic 1 (User Retention): 5 stories, 31 pts (1 done, 1 in progress)
- Epic 2 (French): 2 stories, 34 pts (all backlog)
- Epic 3 (Investment Config): 1 story, 8 pts (all to do)
- Epic 4 (UX): 3 stories, 10 pts (2 done, 1 to do)
- Epic 5 (Simulation): 3 stories, 21 pts (2 done, 1 to do)
- Epic 6 (Testing): 3 stories, 26 pts (all backlog) ⬆️ New: US-022
- Epic 7 (Performance): 2 stories, 13 pts (all backlog)
- Epic 8 (Advanced): 3 stories, 68 pts (all icebox)

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
