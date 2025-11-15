# MVP Completion Task List

**Project:** Canadian Retirement Planning Application
**Current Status:** 70-75% Complete
**Target:** 100% MVP Complete
**Estimated Total Time:** 10-15 hours (1-2 weeks part-time)
**Last Updated:** November 14, 2025

---

## Executive Summary

The retirement planning application has strong foundations with all core calculation engines complete and most user-facing features implemented. To reach MVP completion, we need to address **3 critical gaps** and **several polish items**.

**Current State:**
- ✅ All calculation engines production-ready (CPP, OAS, GIS, Tax, Projection)
- ✅ Financial profile management complete (Income, Assets, Expenses, Debts)
- ✅ Dashboard and visualizations implemented
- ✅ Scenario comparison functional with database persistence
- ⚠️ Profile editing non-functional
- ❌ PDF reports missing
- ⚠️ Limited help/documentation

---

## Priority 1: Critical Features (Must-Have for MVP)

### Task 1.1: Implement Profile Editing Functionality

**Status:** 🔴 Critical - Blocking user flow
**Priority:** Highest
**Estimated Time:** 2-3 hours
**Complexity:** Low-Medium

**Current Issue:**
- Profile page (`app/(dashboard)/profile/page.tsx`) displays user data but "Edit Profile" and "Edit Retirement Details" buttons are non-functional
- Users cannot update personal information, province, retirement age, or other core settings

**Requirements:**

**Sub-task 1.1.1: Create Profile Edit API Route** (45 min)
- [ ] Create `app/api/profile/route.ts`
- [ ] Implement `PUT /api/profile` endpoint
- [ ] Add validation for profile updates
- [ ] Handle date of birth, province, marital status, first/last name
- [ ] Handle retirement planning fields (retirement age, years in Canada, life expectancy)
- [ ] Return updated user object

**Sub-task 1.1.2: Add Edit Forms to Profile Page** (90 min)
- [ ] Convert profile page to use state management
- [ ] Add edit mode toggle for personal information section
- [ ] Add edit mode toggle for retirement planning section
- [ ] Create form inputs with current values pre-filled
- [ ] Add form validation (Zod schema)
- [ ] Add save/cancel buttons
- [ ] Show success/error messages

**Sub-task 1.1.3: Connect to API** (30 min)
- [ ] Add PUT request to API on save
- [ ] Handle loading states
- [ ] Handle errors gracefully
- [ ] Refresh data after successful save
- [ ] Update auth context if name changes

**Files to Modify:**
- `app/api/profile/route.ts` (NEW)
- `app/(dashboard)/profile/page.tsx` (EDIT - convert to editable form)

**Acceptance Criteria:**
- ✅ User can click "Edit Profile" and modify personal information
- ✅ User can click "Edit Retirement Details" and modify planning parameters
- ✅ Changes persist to database
- ✅ Form validates inputs (age ranges, valid dates, etc.)
- ✅ Success message shown after save
- ✅ Cancel button reverts changes

---

### Task 1.2: Add PDF Report Generation

**Status:** 🔴 Critical - Missing core feature
**Priority:** Highest
**Estimated Time:** 4-6 hours
**Complexity:** Medium

**Current Issue:**
- No PDF export capability
- Users cannot print or share their retirement plan

**Requirements:**

**Sub-task 1.2.1: Choose and Install PDF Library** (30 min)
- [ ] Evaluate options:
  - Option A: `react-pdf` (@react-pdf/renderer) - Component-based, best for complex layouts
  - Option B: `jspdf` + `html2canvas` - Convert existing HTML to PDF
  - Option C: `html2pdf.js` - Simpler HTML to PDF conversion
- [ ] **Recommendation:** Use `jspdf` + `html2canvas` for fastest implementation
- [ ] Install dependencies: `npm install jspdf html2canvas`

**Sub-task 1.2.2: Create Report Template Component** (2 hours)
- [ ] Create `components/reports/RetirementReport.tsx`
- [ ] Design print-friendly layout (A4 page format)
- [ ] Include sections:
  - Executive Summary (1 page)
    - User name and date
    - Key findings (3-5 bullet points)
    - Retirement readiness score
    - Asset depletion warning (if applicable)
  - Financial Profile Summary (1 page)
    - Current assets breakdown
    - Income sources
    - Monthly expenses
    - Net worth
  - Government Benefits Projection (1 page)
    - CPP estimate
    - OAS estimate
    - GIS estimate (if applicable)
    - Total monthly benefits
  - Year-by-Year Projection (1-2 pages)
    - Table of key years (every 5 years + critical milestones)
    - Income vs expenses chart
    - Asset balance chart
  - Assumptions & Disclaimers (1 page)
    - Investment return assumptions
    - Inflation rate
    - Tax assumptions
    - Legal disclaimer
- [ ] Add company branding/header
- [ ] Add page numbers
- [ ] Style for print (hide navigation, optimize spacing)

**Sub-task 1.2.3: Implement PDF Generation Logic** (90 min)
- [ ] Create `lib/reports/generatePDF.ts`
- [ ] Add function to capture component as image
- [ ] Add function to convert to PDF
- [ ] Handle multi-page layout
- [ ] Add filename generation (e.g., `Retirement_Plan_John_Smith_2025-11-14.pdf`)
- [ ] Optimize image quality vs file size

**Sub-task 1.2.4: Add Download Button to UI** (30 min)
- [ ] Add "Download Report" button to projection page
- [ ] Add "Download Report" button to dashboard
- [ ] Add "Generate PDF" button to scenarios page (for scenario comparison)
- [ ] Show loading state during generation
- [ ] Show success message
- [ ] Handle errors gracefully

**Sub-task 1.2.5: Create Report API Endpoint (Optional)** (30 min)
- [ ] Create `app/api/reports/route.ts` (if server-side generation preferred)
- [ ] Generate PDF on server
- [ ] Return PDF as downloadable blob
- [ ] Add rate limiting (prevent abuse)

**Files to Create:**
- `components/reports/RetirementReport.tsx` (NEW)
- `lib/reports/generatePDF.ts` (NEW)
- `app/api/reports/route.ts` (OPTIONAL)

**Files to Modify:**
- `app/(dashboard)/projection/page.tsx` (ADD download button)
- `app/(dashboard)/dashboard/page.tsx` (ADD download button)
- `app/(dashboard)/scenarios/page.tsx` (ADD download button)

**Acceptance Criteria:**
- ✅ User can click "Download Report" button
- ✅ PDF generates with all required sections
- ✅ PDF is properly formatted and readable
- ✅ PDF includes charts/visualizations
- ✅ File downloads with appropriate name
- ✅ Multi-page layout works correctly
- ✅ Disclaimer and assumptions included

---

### Task 1.3: Add Help Text and Tooltips

**Status:** 🟡 Important - Improves UX
**Priority:** High
**Estimated Time:** 3-4 hours
**Complexity:** Low-Medium

**Current Issue:**
- Complex financial terms lack explanation
- Users may not understand calculation inputs
- No guided help for new users

**Requirements:**

**Sub-task 1.3.1: Install Tooltip Component** (15 min)
- [ ] Install shadcn tooltip component: `npx shadcn-ui@latest add tooltip`
- [ ] Test tooltip functionality

**Sub-task 1.3.2: Create Help Content Database** (60 min)
- [ ] Create `lib/help/helpContent.ts`
- [ ] Define help text for all complex terms:
  - RRSP (Registered Retirement Savings Plan)
  - TFSA (Tax-Free Savings Account)
  - RRIF (Registered Retirement Income Fund)
  - YMPE (Year's Maximum Pensionable Earnings)
  - CPP (Canada Pension Plan)
  - OAS (Old Age Security)
  - GIS (Guaranteed Income Supplement)
  - Clawback
  - Marginal tax rate
  - Average tax rate
  - Non-registered account
  - Capital gains
  - Inflation rate
  - Investment return rate
- [ ] Add explanations for key calculations
- [ ] Include examples where helpful

**Sub-task 1.3.3: Add Tooltips to Forms** (90 min)
- [ ] Add tooltips to projection page inputs
  - Current age (why we need this)
  - Retirement age (implications of different ages)
  - Life expectancy (how to estimate)
  - CPP start age (trade-offs of different ages)
  - OAS start age (deferral benefits)
  - Investment return rate (realistic ranges)
  - Inflation rate (historical context)
- [ ] Add tooltips to benefits calculator
  - Average career income (how to calculate)
  - Years of contributions (what counts)
  - Years in Canada (residency requirements)
- [ ] Add tooltips to profile forms
  - Asset types and differences
  - Income categorization
  - Expense categories
  - Debt types

**Sub-task 1.3.4: Create FAQ Section** (60 min)
- [ ] Create `app/(dashboard)/help/page.tsx`
- [ ] Add common questions:
  - When should I start CPP?
  - How much should I have saved?
  - What is the RRIF minimum withdrawal?
  - How accurate are these projections?
  - What if I run out of money?
  - How is tax calculated?
  - What assumptions are used?
- [ ] Add navigation link to help page
- [ ] Add search functionality (optional)

**Sub-task 1.3.5: Add Info Icons Throughout UI** (30 min)
- [ ] Add info icon component (ℹ️)
- [ ] Place next to complex labels
- [ ] Consistent styling across all pages
- [ ] Mobile-friendly (tap to show on mobile)

**Files to Create:**
- `lib/help/helpContent.ts` (NEW)
- `app/(dashboard)/help/page.tsx` (NEW)
- `components/ui/InfoTooltip.tsx` (NEW - wrapper component)

**Files to Modify:**
- `app/(dashboard)/projection/page.tsx` (ADD tooltips)
- `app/(dashboard)/benefits/cpp/page.tsx` (ADD tooltips)
- `app/(dashboard)/benefits/oas/page.tsx` (ADD tooltips)
- `app/(dashboard)/benefits/gis/page.tsx` (ADD tooltips)
- `app/(dashboard)/profile/income/page.tsx` (ADD tooltips)
- `app/(dashboard)/profile/assets/page.tsx` (ADD tooltips)
- `app/(dashboard)/profile/expenses/page.tsx` (ADD tooltips)
- `app/(dashboard)/profile/debts/page.tsx` (ADD tooltips)
- `components/layout/header.tsx` (ADD help link)

**Acceptance Criteria:**
- ✅ All complex terms have tooltips with clear explanations
- ✅ FAQ page accessible from navigation
- ✅ Info icons appear consistently throughout UI
- ✅ Tooltips work on both desktop (hover) and mobile (tap)
- ✅ Help content is accurate and helpful
- ✅ Examples provided where appropriate

---

## Priority 2: Important Enhancements (Should-Have)

### Task 2.1: Improve Profile Completion Indicator

**Status:** 🟡 Enhancement
**Priority:** Medium
**Estimated Time:** 1 hour
**Complexity:** Low

**Current Issue:**
- Profile completion shows static percentage
- Doesn't dynamically update based on actual data

**Requirements:**
- [ ] Create `lib/utils/profileCompletion.ts`
- [ ] Calculate completion based on:
  - Personal info filled (20%)
  - At least one income source (15%)
  - Assets entered (20%)
  - Expenses tracked (15%)
  - Retirement details set (15%)
  - Benefits calculator used (15%)
- [ ] Display breakdown of what's missing
- [ ] Update dashboard to use dynamic calculation
- [ ] Add progress bar visualization

**Files to Create:**
- `lib/utils/profileCompletion.ts` (NEW)

**Files to Modify:**
- `app/(dashboard)/dashboard/page.tsx` (USE dynamic calculation)

---

### Task 2.2: Add Loading States and Skeletons

**Status:** 🟡 Enhancement
**Priority:** Medium
**Estimated Time:** 2 hours
**Complexity:** Low

**Current Issue:**
- Some pages show no feedback while loading data
- Empty states could be more informative

**Requirements:**
- [ ] Install shadcn skeleton component: `npx shadcn-ui@latest add skeleton`
- [ ] Add loading skeletons to:
  - Dashboard (while fetching financial data)
  - Income/Assets/Expenses/Debts pages (while loading lists)
  - Projection page (while calculating)
  - Scenarios page (while loading scenarios)
- [ ] Add spinner for PDF generation
- [ ] Add progress indicators for long operations
- [ ] Improve empty states with helpful CTAs

**Files to Modify:**
- All dashboard pages (ADD skeleton loading states)

---

### Task 2.3: Add Input Validation Improvements

**Status:** 🟡 Enhancement
**Priority:** Medium
**Estimated Time:** 2 hours
**Complexity:** Low-Medium

**Current Issue:**
- Some forms allow unrealistic values
- Age validations could be stricter
- No cross-field validation

**Requirements:**
- [ ] Enhance Zod schemas with:
  - Age must be 18-100
  - Retirement age must be > current age
  - Life expectancy must be > retirement age
  - CPP start age must be 60-70
  - OAS start age must be 65-75
  - Years in Canada must be ≤ current age - 18
  - Income/expense amounts must be > 0
  - Interest rates must be 0-30%
  - Investment returns must be -10% to 20% (realistic range)
- [ ] Add helpful error messages
- [ ] Add warnings for unusual values (e.g., very high expenses)
- [ ] Add real-time validation feedback

**Files to Modify:**
- All form pages with Zod schemas

---

### Task 2.4: Add Scenario Templates

**Status:** 🟢 Nice-to-Have
**Priority:** Medium-Low
**Estimated Time:** 2 hours
**Complexity:** Low

**Current Issue:**
- Creating scenarios requires entering all values manually
- Common scenarios should be pre-configured

**Requirements:**
- [ ] Create scenario templates:
  - "Retire Early (Age 60)"
  - "Standard Retirement (Age 65)"
  - "Delayed Retirement (Age 70)"
  - "Maximize CPP (Defer to 70)"
  - "Conservative Spending"
  - "Aggressive Spending"
- [ ] Add "Load Template" button to scenario creation
- [ ] Pre-fill form with template values
- [ ] Allow customization after loading

**Files to Create:**
- `lib/scenarios/templates.ts` (NEW)

**Files to Modify:**
- `app/(dashboard)/scenarios/page.tsx` (ADD template loading)

---

## Priority 3: Testing & Quality Assurance

### Task 3.1: Manual Testing Checklist

**Status:** 🟡 Required before launch
**Priority:** High
**Estimated Time:** 4-6 hours
**Complexity:** N/A

**Requirements:**

**Authentication Flow:**
- [ ] Register new user with valid data
- [ ] Register fails with invalid email
- [ ] Register fails with weak password
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout successfully
- [ ] Protected routes redirect to login
- [ ] Auth persists across page refresh

**Financial Profile:**
- [ ] Add income source (all types)
- [ ] Edit income source
- [ ] Delete income source
- [ ] Total income calculates correctly
- [ ] Add asset (all types)
- [ ] Edit asset
- [ ] Delete asset
- [ ] Asset totals calculate correctly
- [ ] Add expense (all categories)
- [ ] Edit expense
- [ ] Delete expense
- [ ] Monthly expense total correct
- [ ] Add debt (all types)
- [ ] Edit debt
- [ ] Delete debt
- [ ] Total debt calculates correctly
- [ ] Data persists after page refresh

**Benefits Calculators:**
- [ ] CPP calculator produces reasonable results
- [ ] Age 60 CPP < Age 65 CPP < Age 70 CPP
- [ ] OAS calculator handles partial residency
- [ ] OAS clawback applies at correct threshold
- [ ] GIS calculator works for single status
- [ ] GIS calculator works for married status
- [ ] GIS reduces as income increases
- [ ] All calculations match government calculators (±5%)

**Retirement Projection:**
- [ ] Projection generates year-by-year data
- [ ] Asset balances decrease over time (when withdrawing)
- [ ] RRIF conversion happens at age 71
- [ ] RRIF minimum withdrawals enforced
- [ ] Taxes calculate correctly
- [ ] Asset depletion detected and flagged
- [ ] Charts display properly
- [ ] All 5 charts render without errors
- [ ] Year-by-year table shows all data
- [ ] Summary metrics calculate correctly

**Scenarios:**
- [ ] Can create new scenario
- [ ] Scenario saves to database
- [ ] Can load saved scenarios
- [ ] Can delete scenario
- [ ] Can select up to 3 scenarios for comparison
- [ ] Comparison charts display correctly
- [ ] Summary table shows differences
- [ ] Different inputs produce different results

**Dashboard:**
- [ ] Net worth calculates correctly (assets - debts)
- [ ] Total income shows correctly
- [ ] Monthly expenses show correctly
- [ ] Profile completion percentage updates
- [ ] Quick action buttons navigate correctly
- [ ] Welcome message shows user name

**Responsive Design:**
- [ ] Test on mobile (320px - 480px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1920px+)
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile
- [ ] Charts resize properly
- [ ] Tables scroll horizontally on mobile

**Browser Compatibility:**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Performance:**
- [ ] Pages load in < 3 seconds
- [ ] Projections calculate in < 5 seconds
- [ ] No console errors
- [ ] No React warnings
- [ ] Forms respond immediately

---

### Task 3.2: Calculation Validation

**Status:** 🟡 Critical for accuracy
**Priority:** High
**Estimated Time:** 2-3 hours
**Complexity:** Medium

**Requirements:**

**Test Scenarios to Validate:**

**Scenario A: Average Canadian Retiree**
- Age: 65
- RRSP: $250,000
- TFSA: $95,000
- CPP contributions: 40 years at average wage
- Expected CPP: ~$1,100/month
- Expected OAS: ~$713/month
- [ ] Run calculation
- [ ] Compare to official government calculators
- [ ] Verify within 5% tolerance

**Scenario B: Early Retiree**
- Age: 60
- Portfolio: $800,000 (mixed accounts)
- CPP start: Age 70
- No pension
- [ ] Verify asset withdrawal strategy
- [ ] Verify TFSA withdrawn first
- [ ] Verify tax calculations
- [ ] Verify CPP enhancement at 70 (42% increase)

**Scenario C: Low-Income Senior**
- Age: 65
- Assets: $50,000
- CPP: $300/month
- OAS: $713/month (full residency)
- GIS: Should be eligible
- [ ] Verify GIS calculation
- [ ] Verify total monthly income
- [ ] Verify no clawback applies

**Scenario D: High-Income Professional**
- Age: 67
- RRSP: $1,000,000
- Non-registered: $500,000
- Annual income in retirement: $120,000
- [ ] Verify OAS clawback applies
- [ ] Verify high marginal tax rates
- [ ] Verify RRIF withdrawals
- [ ] Verify tax optimization

**Documentation:**
- [ ] Create `CALCULATION_VALIDATION.md`
- [ ] Document all test scenarios
- [ ] Record expected vs actual results
- [ ] Note any discrepancies
- [ ] Explain calculation differences

**Files to Create:**
- `CALCULATION_VALIDATION.md` (NEW)

---

### Task 3.3: Add Unit Tests (Optional but Recommended)

**Status:** 🟢 Nice-to-Have
**Priority:** Low-Medium
**Estimated Time:** 6-8 hours
**Complexity:** Medium

**Requirements:**

**Setup (1 hour):**
- [ ] Install Jest: `npm install --save-dev jest @types/jest`
- [ ] Install React Testing Library: `npm install --save-dev @testing-library/react @testing-library/jest-dom`
- [ ] Configure Jest for Next.js
- [ ] Create `jest.config.js`
- [ ] Add test scripts to `package.json`

**Calculation Engine Tests (3-4 hours):**
- [ ] Test CPP calculations (`lib/calculations/cpp.test.ts`)
  - Test age adjustment factors
  - Test dropout provisions
  - Test maximum amounts
  - Test edge cases (age 60, 65, 70)
- [ ] Test OAS calculations (`lib/calculations/oas.test.ts`)
  - Test full vs partial residency
  - Test clawback calculations
  - Test age 75+ enhancement
- [ ] Test GIS calculations (`lib/calculations/gis.test.ts`)
  - Test single vs married
  - Test income thresholds
  - Test reduction calculations
- [ ] Test tax calculations (`lib/calculations/tax.test.ts`)
  - Test federal brackets
  - Test provincial brackets
  - Test tax credits
  - Test marginal rates
- [ ] Test projection engine (`lib/calculations/projection.test.ts`)
  - Test year-by-year iteration
  - Test RRIF conversion
  - Test withdrawal strategies
  - Test asset depletion

**Component Tests (2-3 hours):**
- [ ] Test form validation
- [ ] Test calculation displays
- [ ] Test chart rendering
- [ ] Test button interactions

**Files to Create:**
- `jest.config.js` (NEW)
- `lib/calculations/*.test.ts` (NEW - 5 test files)
- `__tests__/components/*.test.tsx` (NEW)

---

## Priority 4: Documentation & Deployment

### Task 4.1: Update README

**Status:** 🟡 Important
**Priority:** Medium
**Estimated Time:** 1 hour
**Complexity:** Low

**Requirements:**
- [ ] Update `README.md` with:
  - Current feature set
  - Installation instructions
  - Environment variables required
  - How to run locally
  - How to run tests
  - Technology stack
  - Project structure
  - Contributing guidelines
  - License information
- [ ] Add screenshots
- [ ] Add demo credentials
- [ ] Add troubleshooting section

**Files to Modify:**
- `README.md` (UPDATE)

---

### Task 4.2: Create User Guide

**Status:** 🟢 Nice-to-Have
**Priority:** Low
**Estimated Time:** 2-3 hours
**Complexity:** Low

**Requirements:**
- [ ] Create `USER_GUIDE.md`
- [ ] Include sections:
  - Getting Started
  - Setting Up Your Profile
  - Understanding Your Financial Data
  - Using the Benefits Calculators
  - Creating Retirement Projections
  - Comparing Scenarios
  - Generating Reports
  - Frequently Asked Questions
  - Glossary of Terms
- [ ] Add screenshots for each section
- [ ] Add step-by-step instructions
- [ ] Include examples

**Files to Create:**
- `USER_GUIDE.md` (NEW)

---

### Task 4.3: Add Legal Disclaimers

**Status:** 🟡 Important for production
**Priority:** Medium
**Estimated Time:** 1 hour
**Complexity:** Low

**Requirements:**
- [ ] Create `app/(dashboard)/disclaimer/page.tsx`
- [ ] Add disclaimers:
  - Not professional financial advice
  - Calculations are estimates only
  - Consult with certified financial planner
  - Government benefit amounts subject to change
  - Tax calculations are approximate
  - Investment returns not guaranteed
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Add footer links to disclaimer pages
- [ ] Add disclaimer to PDF reports
- [ ] Add "I Agree" checkbox on first login

**Files to Create:**
- `app/(dashboard)/disclaimer/page.tsx` (NEW)
- `app/(dashboard)/privacy/page.tsx` (NEW)
- `app/(dashboard)/terms/page.tsx` (NEW)

**Files to Modify:**
- `components/layout/footer.tsx` (ADD disclaimer links)
- `components/reports/RetirementReport.tsx` (ADD disclaimer text)

---

### Task 4.4: Prepare for Production Deployment

**Status:** 🟢 Post-MVP
**Priority:** Low (for demo MVP)
**Estimated Time:** 4-6 hours
**Complexity:** Medium

**Requirements (when ready for production):**

**Security Hardening:**
- [ ] Add rate limiting to API routes
- [ ] Add CSRF protection
- [ ] Implement Content Security Policy
- [ ] Add input sanitization
- [ ] Enable HTTPS only
- [ ] Secure cookie settings
- [ ] Add API request validation

**Database Migration:**
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Update Prisma schema for PostgreSQL
- [ ] Set up database backups
- [ ] Add database connection pooling

**Environment Setup:**
- [ ] Create production environment variables
- [ ] Set up secrets management
- [ ] Configure logging
- [ ] Set up error monitoring (Sentry)
- [ ] Set up performance monitoring

**Deployment:**
- [ ] Choose hosting platform (Vercel, AWS, Azure)
- [ ] Set up CI/CD pipeline
- [ ] Configure domain name
- [ ] Set up SSL certificate
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Deploy to production

---

## Summary by Priority

| Priority | Tasks | Total Time | Impact |
|----------|-------|------------|--------|
| P1: Critical | 3 tasks | 9-13 hours | Blocks MVP completion |
| P2: Important | 4 tasks | 7 hours | Significantly improves UX |
| P3: Testing | 3 tasks | 12-17 hours | Ensures quality |
| P4: Documentation | 4 tasks | 8-11 hours | Prepares for launch |
| **TOTAL** | **14 tasks** | **36-48 hours** | **Full MVP+** |

---

## Recommended Execution Order

### Week 1: Core Completion
**Goal:** Complete all P1 (Critical) tasks

1. **Day 1-2:** Profile Editing (Task 1.1)
   - Implement API route
   - Add edit forms
   - Test thoroughly

2. **Day 3-4:** PDF Reports (Task 1.2)
   - Choose library
   - Create report template
   - Implement generation
   - Add download buttons

3. **Day 5:** Help & Tooltips (Task 1.3)
   - Add tooltip component
   - Create help content
   - Add to all forms

**End of Week 1 Status:** MVP Feature Complete ✅

### Week 2: Polish & Testing
**Goal:** Complete P2 (Important) and P3 (Testing) tasks

4. **Day 6:** Enhancements (Tasks 2.1-2.4)
   - Profile completion indicator
   - Loading states
   - Input validation
   - Scenario templates

5. **Day 7-8:** Manual Testing (Task 3.1)
   - Test all user flows
   - Test on multiple devices/browsers
   - Fix bugs found

6. **Day 9:** Calculation Validation (Task 3.2)
   - Test against government calculators
   - Document results
   - Fix any discrepancies

7. **Day 10:** Documentation (Tasks 4.1-4.3)
   - Update README
   - Add disclaimers
   - Create user guide

**End of Week 2 Status:** Production-Ready MVP ✅

### Optional Week 3: Advanced Features
**Goal:** Unit tests and production deployment prep

8. **Days 11-13:** Unit Tests (Task 3.3)
   - Set up testing framework
   - Write calculation tests
   - Write component tests
   - Achieve >80% coverage

9. **Days 14-15:** Production Prep (Task 4.4)
   - Security hardening
   - Database migration
   - Deployment setup

**End of Week 3 Status:** Enterprise-Ready Application ✅

---

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ All P1 tasks complete
- ✅ Profile editing works
- ✅ PDF reports generate
- ✅ Help text available
- ✅ Manual testing passed
- ✅ Calculations validated

### MVP+ (Ready for User Testing)
- ✅ All P1 + P2 tasks complete
- ✅ Loading states implemented
- ✅ Input validation enhanced
- ✅ Scenario templates available
- ✅ Comprehensive manual testing
- ✅ User guide created

### Production-Ready
- ✅ All P1 + P2 + P3 tasks complete
- ✅ Unit tests written and passing
- ✅ Documentation complete
- ✅ Legal disclaimers in place
- ✅ Security review completed
- ✅ Performance optimized

---

## Risk Assessment

### High Risk
- **PDF Generation Complexity:** May encounter browser compatibility issues
  - **Mitigation:** Test across browsers early, have fallback print-to-PDF option

- **Calculation Accuracy:** Discrepancies with official calculators
  - **Mitigation:** Thorough validation against government tools, document assumptions

### Medium Risk
- **Form Validation Edge Cases:** Complex cross-field validation
  - **Mitigation:** Comprehensive testing, clear error messages

- **Mobile Responsiveness:** Complex tables/charts on small screens
  - **Mitigation:** Progressive enhancement, mobile-first approach

### Low Risk
- **Tooltip Implementation:** Straightforward UI enhancement
- **Profile Editing:** Standard CRUD operation
- **Documentation:** Time-consuming but low technical risk

---

## Dependencies

### External Dependencies
- ✅ All npm packages already installed (except PDF library)
- ❌ PDF library needs installation (Task 1.2.1)
- ✅ shadcn/ui tooltip component (needs installation for Task 1.3.1)

### Internal Dependencies
- Profile editing (1.1) has no dependencies - can start immediately
- PDF reports (1.2) should be done after projection page is stable
- Help tooltips (1.3) requires tooltip component installation first
- Testing (3.1-3.3) requires all features complete

---

## Notes

1. **Time Estimates:** Based on single developer, include buffer for testing/debugging
2. **Complexity Ratings:**
   - Low: Straightforward implementation, clear requirements
   - Medium: Some technical challenges, multiple components involved
   - High: Complex logic, integration with multiple systems

3. **Priority Definitions:**
   - **Critical (P1):** Must have for MVP, blocks launch
   - **Important (P2):** Should have for good UX, can launch without
   - **Testing (P3):** Quality assurance, de-risks production
   - **Documentation (P4):** Prepares for wider adoption

4. **Flexibility:** Tasks can be reordered based on developer preference or discovered issues

---

## Checklist for "MVP Complete" Sign-Off

Before declaring MVP complete, verify:

- [ ] ✅ All P1 (Critical) tasks complete
- [ ] ✅ Profile editing fully functional
- [ ] ✅ PDF reports generate successfully
- [ ] ✅ Help text added to complex inputs
- [ ] ✅ All manual tests pass
- [ ] ✅ Calculations validated against government tools (within 5%)
- [ ] ✅ Responsive design works on mobile/tablet/desktop
- [ ] ✅ No critical bugs or console errors
- [ ] ✅ README updated with setup instructions
- [ ] ✅ Legal disclaimers in place
- [ ] ✅ User can complete full workflow: register → profile → benefits → projection → report

---

**Document Version:** 1.0
**Created:** November 14, 2025
**Status:** Ready for Execution
**Next Review:** After Week 1 completion
