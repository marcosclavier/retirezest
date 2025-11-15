# Manual Testing Checklist
**Canadian Retirement Planning Application**
**Version:** 1.0 MVP
**Last Updated:** November 14, 2025
**Test Environment:** Local Development (http://localhost:3002)

---

## Testing Instructions

- [ ] Run the application locally: `npm run dev`
- [ ] Use a fresh browser or incognito mode for auth testing
- [ ] Test database state: Check `prisma/dev.db` before/after operations
- [ ] Document any bugs found in the "Issues Found" section at the bottom

---

## 1. Authentication Flow

### Registration
- [ ] Navigate to /register
- [ ] Register with valid email and password (8+ chars)
- [ ] **Expected:** Redirected to /dashboard, session created
- [ ] **Actual:** _______________

- [ ] Try to register with invalid email format
- [ ] **Expected:** Validation error shown
- [ ] **Actual:** _______________

- [ ] Try to register with weak password (< 8 chars)
- [ ] **Expected:** Validation error shown
- [ ] **Actual:** _______________

- [ ] Try to register with existing email
- [ ] **Expected:** Error message "User already exists"
- [ ] **Actual:** _______________

### Login
- [ ] Navigate to /login
- [ ] Login with valid credentials
- [ ] **Expected:** Redirected to /dashboard
- [ ] **Actual:** _______________

- [ ] Try to login with invalid credentials
- [ ] **Expected:** Error message shown
- [ ] **Actual:** _______________

- [ ] Try to login with non-existent email
- [ ] **Expected:** Error message shown
- [ ] **Actual:** _______________

### Logout
- [ ] Click logout button in header
- [ ] **Expected:** Redirected to /login, session cleared
- [ ] **Actual:** _______________

### Protected Routes
- [ ] While logged out, try to access /dashboard
- [ ] **Expected:** Redirected to /login
- [ ] **Actual:** _______________

- [ ] While logged out, try to access /dashboard/projection
- [ ] **Expected:** Redirected to /login
- [ ] **Actual:** _______________

### Session Persistence
- [ ] Login, then refresh the page
- [ ] **Expected:** Still logged in, no redirect
- [ ] **Actual:** _______________

---

## 2. Profile Management

### Profile Viewing
- [ ] Navigate to /dashboard/profile
- [ ] Verify personal information displays correctly
- [ ] **Expected:** Email, firstName, lastName, DOB, province, maritalStatus
- [ ] **Actual:** _______________

### Profile Editing
- [ ] Click "Edit Profile" button
- [ ] **Expected:** Form fields become editable
- [ ] **Actual:** _______________

- [ ] Update firstName and lastName
- [ ] Click "Save Changes"
- [ ] **Expected:** Success message, data persists, form exits edit mode
- [ ] **Actual:** _______________

- [ ] Edit profile, then click "Cancel"
- [ ] **Expected:** Changes reverted, form exits edit mode
- [ ] **Actual:** _______________

- [ ] Update dateOfBirth (select a valid date)
- [ ] Click "Save Changes"
- [ ] **Expected:** Age calculated and displayed, success message
- [ ] **Actual:** _______________

- [ ] Select province from dropdown
- [ ] Click "Save Changes"
- [ ] **Expected:** Province saved, success message
- [ ] **Actual:** _______________

- [ ] Select maritalStatus from dropdown
- [ ] Click "Save Changes"
- [ ] **Expected:** Marital status saved, success message
- [ ] **Actual:** _______________

### Profile Validation
- [ ] Try to save with future date of birth
- [ ] **Expected:** Validation error
- [ ] **Actual:** _______________

- [ ] Try to save with date before 1900
- [ ] **Expected:** Validation error
- [ ] **Actual:** _______________

### Profile Completion Indicator
- [ ] Check dashboard profile completion percentage
- [ ] Add more data (income, assets, expenses)
- [ ] Return to dashboard
- [ ] **Expected:** Percentage increases
- [ ] **Actual:** _______________

---

## 3. Financial Profile Management

### Income Sources

#### Add Income
- [ ] Navigate to /dashboard/profile/income
- [ ] Click "Add Income Source"
- [ ] Fill in all fields (source, type, amount, frequency, startDate)
- [ ] Click "Save"
- [ ] **Expected:** Income added to list, total income updated
- [ ] **Actual:** _______________

- [ ] Add multiple income sources (employment, pension, investment)
- [ ] **Expected:** All sources listed, total calculated correctly
- [ ] **Actual:** _______________

#### Edit Income
- [ ] Click edit icon on an income source
- [ ] Change amount value
- [ ] Click "Save"
- [ ] **Expected:** Income updated, total recalculated
- [ ] **Actual:** _______________

#### Delete Income
- [ ] Click delete icon on an income source
- [ ] Confirm deletion
- [ ] **Expected:** Income removed, total recalculated
- [ ] **Actual:** _______________

#### Income Calculations
- [ ] Add monthly income of $5,000
- [ ] **Expected:** Annual income shows $60,000
- [ ] **Actual:** _______________

- [ ] Add annual income of $50,000
- [ ] **Expected:** Annual income shows $50,000
- [ ] **Actual:** _______________

### Assets

#### Add Asset
- [ ] Navigate to /dashboard/profile/assets
- [ ] Click "Add Asset"
- [ ] Fill in RRSP with $100,000
- [ ] Click "Save"
- [ ] **Expected:** Asset added, total assets updated
- [ ] **Actual:** _______________

- [ ] Add TFSA ($50,000) and Non-Registered ($75,000)
- [ ] **Expected:** Total assets = $225,000
- [ ] **Actual:** _______________

#### Edit Asset
- [ ] Click edit on an asset
- [ ] Change currentValue
- [ ] Click "Save"
- [ ] **Expected:** Asset updated, total recalculated
- [ ] **Actual:** _______________

#### Delete Asset
- [ ] Click delete on an asset
- [ ] Confirm deletion
- [ ] **Expected:** Asset removed, total recalculated
- [ ] **Actual:** _______________

### Expenses

#### Add Expense
- [ ] Navigate to /dashboard/profile/expenses
- [ ] Click "Add Expense"
- [ ] Fill in Housing expense ($2,000/month)
- [ ] Click "Save"
- [ ] **Expected:** Expense added, monthly total updated
- [ ] **Actual:** _______________

- [ ] Add annual expense (Property Tax: $3,600/year)
- [ ] **Expected:** Monthly total shows $2,300 ($2,000 + $300)
- [ ] **Actual:** _______________

#### Edit Expense
- [ ] Click edit on an expense
- [ ] Change amount
- [ ] Click "Save"
- [ ] **Expected:** Expense updated, total recalculated
- [ ] **Actual:** _______________

#### Delete Expense
- [ ] Click delete on an expense
- [ ] Confirm deletion
- [ ] **Expected:** Expense removed, total recalculated
- [ ] **Actual:** _______________

### Debts

#### Add Debt
- [ ] Navigate to /dashboard/profile/debts
- [ ] Click "Add Debt"
- [ ] Fill in Mortgage ($200,000, 3% interest)
- [ ] Click "Save"
- [ ] **Expected:** Debt added, total debt updated
- [ ] **Actual:** _______________

#### Edit Debt
- [ ] Click edit on a debt
- [ ] Change currentBalance
- [ ] Click "Save"
- [ ] **Expected:** Debt updated, total recalculated
- [ ] **Actual:** _______________

#### Delete Debt
- [ ] Click delete on a debt
- [ ] Confirm deletion
- [ ] **Expected:** Debt removed, total recalculated
- [ ] **Actual:** _______________

### Data Persistence
- [ ] Add income, assets, expenses, and debts
- [ ] Close browser tab
- [ ] Open application and login again
- [ ] **Expected:** All data persists
- [ ] **Actual:** _______________

---

## 4. Government Benefits Calculators

### CPP Calculator

#### Basic Calculation
- [ ] Navigate to /dashboard/benefits/cpp
- [ ] Enter average income: $70,000
- [ ] Enter years of contributions: 35
- [ ] Set CPP start age: 65
- [ ] Set life expectancy: 85
- [ ] Click "Calculate CPP Benefits"
- [ ] **Expected:** Monthly benefit ~$1,100-1,200, total lifetime benefit shown
- [ ] **Actual:** _______________

#### Age 60 vs 65 vs 70 Comparison
- [ ] Calculate CPP at age 60
- [ ] **Expected:** Benefit reduced by ~36% (64% of age 65 amount)
- [ ] **Actual:** _______________

- [ ] Calculate CPP at age 65
- [ ] **Expected:** 100% of calculated benefit
- [ ] **Actual:** _______________

- [ ] Calculate CPP at age 70
- [ ] **Expected:** Benefit increased by ~42% (142% of age 65 amount)
- [ ] **Actual:** _______________

#### Break-Even Age
- [ ] Check break-even age between 60 vs 65
- [ ] **Expected:** Around age 74-77
- [ ] **Actual:** _______________

- [ ] Check break-even age between 65 vs 70
- [ ] **Expected:** Around age 80-82
- [ ] **Actual:** _______________

#### Optimal Age Recommendation
- [ ] Set life expectancy to 80
- [ ] **Expected:** Recommends earlier CPP (60-65)
- [ ] **Actual:** _______________

- [ ] Set life expectancy to 95
- [ ] **Expected:** Recommends later CPP (65-70)
- [ ] **Actual:** _______________

### OAS Calculator

#### Full Residency
- [ ] Navigate to /dashboard/benefits/oas
- [ ] Enter years in Canada: 40
- [ ] Enter age: 65
- [ ] Enter annual income: $50,000
- [ ] Click "Calculate OAS"
- [ ] **Expected:** Full OAS ~$713/month, no clawback
- [ ] **Actual:** _______________

#### Partial Residency
- [ ] Enter years in Canada: 20
- [ ] **Expected:** OAS = 50% of full amount (~$356/month)
- [ ] **Actual:** _______________

#### OAS Clawback
- [ ] Enter annual income: $100,000
- [ ] Enter years in Canada: 40
- [ ] Click "Calculate OAS"
- [ ] **Expected:** Clawback applies (15% of income over $90,997)
- [ ] **Actual:** _______________

- [ ] Calculate net OAS after clawback
- [ ] **Expected:** Net OAS = Full OAS - (0.15 × (100,000 - 90,997))
- [ ] **Actual:** _______________

#### Age 75+ Enhancement
- [ ] Enter age: 75
- [ ] Enter years in Canada: 40
- [ ] Click "Calculate OAS"
- [ ] **Expected:** Enhanced OAS amount (10% increase over age 65)
- [ ] **Actual:** _______________

#### OAS Deferral
- [ ] Enter deferral months: 12 (defer 1 year)
- [ ] **Expected:** OAS increased by 0.6% per month (7.2% for 1 year)
- [ ] **Actual:** _______________

### GIS Calculator

#### Single, Low Income
- [ ] Navigate to /dashboard/benefits/gis
- [ ] Select marital status: Single
- [ ] Enter annual income: $10,000 (only CPP/OAS)
- [ ] Click "Calculate GIS"
- [ ] **Expected:** Maximum or near-maximum GIS (~$1,086/month)
- [ ] **Actual:** _______________

#### GIS Reduction
- [ ] Increase annual income to $15,000
- [ ] Click "Calculate GIS"
- [ ] **Expected:** GIS reduced by $0.50 for every $1 of income
- [ ] **Actual:** _______________

#### Married vs Single
- [ ] Select marital status: Married
- [ ] Spouse receives OAS: Yes
- [ ] Enter same income
- [ ] **Expected:** Lower GIS amount (different max and threshold)
- [ ] **Actual:** _______________

#### Income Too High for GIS
- [ ] Enter annual income: $40,000
- [ ] **Expected:** GIS = $0 or "Not eligible"
- [ ] **Actual:** _______________

#### GIS Strategies
- [ ] Enter income with RRSP withdrawals
- [ ] **Expected:** Strategies shown (e.g., "Use TFSA instead of RRSP")
- [ ] **Actual:** _______________

---

## 5. Retirement Projection

### Basic Projection

#### Generate Projection
- [ ] Navigate to /dashboard/projection
- [ ] Click "Start Projection"
- [ ] Fill in basic inputs:
  - Current age: 55
  - Retirement age: 65
  - Life expectancy: 90
  - RRSP: $500,000
  - TFSA: $100,000
  - Non-Reg: $150,000
  - Annual expenses: $60,000
  - Investment return: 5%
  - Inflation: 2%
- [ ] Click "Generate Projection"
- [ ] **Expected:** Year-by-year projection displayed, charts rendered
- [ ] **Actual:** _______________

#### Projection Summary Metrics
- [ ] Check summary metrics displayed
- [ ] **Expected:**
  - Total assets at retirement
  - Average annual income in retirement
  - Total taxes paid
  - Remaining assets at life expectancy
  - Asset depletion warning (if applicable)
- [ ] **Actual:** _______________

### RRIF Conversion

#### Age 71 Conversion
- [ ] Run projection from age 60 to 90
- [ ] Find year where age = 71
- [ ] **Expected:**
  - RRSP balance converted to RRIF
  - RRIF minimum withdrawal enforced
  - Withdrawal = RRSP balance × 5.28% (age 71 rate)
- [ ] **Actual:** _______________

#### RRIF Minimum Increases with Age
- [ ] Check age 71 withdrawal percentage: 5.28%
- [ ] Check age 80 withdrawal percentage: 6.82%
- [ ] Check age 90 withdrawal percentage: 11.92%
- [ ] Check age 95+ withdrawal percentage: 20%
- [ ] **Expected:** Minimum percentage increases each year
- [ ] **Actual:** _______________

### Tax Calculations

#### Income Tax
- [ ] Run projection with $100,000 total income
- [ ] **Expected:** Federal + Provincial tax applied using brackets
- [ ] **Actual:** _______________

- [ ] Check marginal tax rate shown
- [ ] **Expected:** Based on total income level
- [ ] **Actual:** _______________

#### Tax Credits
- [ ] Check if basic personal amount applied
- [ ] **Expected:** $15,705 federal (2025) effectively tax-free
- [ ] **Actual:** _______________

### Asset Depletion

#### Assets Run Out Scenario
- [ ] Create projection with high expenses ($100k/year) and low assets ($200k)
- [ ] **Expected:**
  - Warning message shown
  - "Assets depleted at age XX" displayed
  - Remaining years with $0 assets highlighted
- [ ] **Actual:** _______________

#### Assets Remain Scenario
- [ ] Create projection with low expenses ($40k/year) and high assets ($1M)
- [ ] **Expected:**
  - Remaining assets at life expectancy shown
  - No depletion warning
- [ ] **Actual:** _______________

### Charts Display

#### All 5 Charts Render
- [ ] Asset Balance Over Time chart
- [ ] **Expected:** Line chart, assets decrease over time
- [ ] **Actual:** _______________

- [ ] Income vs Expenses chart
- [ ] **Expected:** Bar chart or area chart, both lines shown
- [ ] **Actual:** _______________

- [ ] Tax Breakdown chart
- [ ] **Expected:** Stacked area or bar showing annual taxes
- [ ] **Actual:** _______________

- [ ] Income Sources chart
- [ ] **Expected:** Stacked area showing CPP, OAS, withdrawals, etc.
- [ ] **Actual:** _______________

- [ ] Withdrawal Strategy chart
- [ ] **Expected:** Shows RRSP/TFSA/Non-Reg withdrawal order
- [ ] **Actual:** _______________

### Year-by-Year Table
- [ ] Scroll through year-by-year table
- [ ] **Expected:** All years from current age to life expectancy
- [ ] **Actual:** _______________

- [ ] Check columns: Age, Income, Taxes, Expenses, Assets
- [ ] **Expected:** All data accurate for each year
- [ ] **Actual:** _______________

### PDF Report Generation
- [ ] Click "Download PDF" button
- [ ] **Expected:**
  - Loading state shown
  - PDF downloads with filename Retirement_Plan_YYYY-MM-DD.pdf
- [ ] **Actual:** _______________

- [ ] Open PDF file
- [ ] **Expected:**
  - All sections rendered correctly
  - Charts included as images
  - Tables formatted properly
  - Multi-page if content exceeds 1 page
  - Disclaimers included
- [ ] **Actual:** _______________

---

## 6. Scenarios

### Create Scenario
- [ ] Navigate to /dashboard/scenarios
- [ ] Click "Create New Scenario"
- [ ] Enter scenario name: "Early Retirement"
- [ ] Fill in inputs (different from default)
- [ ] Click "Save Scenario"
- [ ] **Expected:** Scenario saved, appears in list
- [ ] **Actual:** _______________

### Load Scenario
- [ ] Click on a saved scenario
- [ ] **Expected:** Scenario details loaded, projection shown
- [ ] **Actual:** _______________

### Delete Scenario
- [ ] Click delete on a scenario
- [ ] Confirm deletion
- [ ] **Expected:** Scenario removed from list
- [ ] **Actual:** _______________

### Compare Scenarios
- [ ] Create 3 different scenarios (Early, Standard, Late retirement)
- [ ] Select all 3 for comparison
- [ ] **Expected:**
  - Comparison table shown
  - Side-by-side charts displayed
  - Key differences highlighted
- [ ] **Actual:** _______________

- [ ] Try to select more than 3 scenarios
- [ ] **Expected:** Warning or disable additional selections
- [ ] **Actual:** _______________

### Scenario Calculations
- [ ] Create "Early Retirement" (age 60) scenario
- [ ] Create "Late Retirement" (age 70) scenario
- [ ] Compare results
- [ ] **Expected:**
  - Early retirement = lower CPP, more years of withdrawals
  - Late retirement = higher CPP, fewer years of withdrawals
  - Different total outcomes
- [ ] **Actual:** _______________

---

## 7. Dashboard

### Net Worth Calculation
- [ ] Add assets: RRSP $100k, TFSA $50k
- [ ] Add debts: Mortgage $200k
- [ ] Navigate to dashboard
- [ ] **Expected:** Net Worth = -$50,000
- [ ] **Actual:** _______________

### Total Income Display
- [ ] Add monthly income $5,000
- [ ] Add annual income $10,000
- [ ] Navigate to dashboard
- [ ] **Expected:** Annual Income = $70,000 ($5k × 12 + $10k)
- [ ] **Actual:** _______________

### Monthly Expenses Display
- [ ] Add monthly expense $2,000
- [ ] Add annual expense $12,000
- [ ] Navigate to dashboard
- [ ] **Expected:** Monthly Expenses = $3,000 ($2k + $1k)
- [ ] **Actual:** _______________

### Profile Completion Percentage
- [ ] Fresh account (no data)
- [ ] **Expected:** Low percentage (0-20%)
- [ ] **Actual:** _______________

- [ ] Add personal info only
- [ ] **Expected:** ~20%
- [ ] **Actual:** _______________

- [ ] Add income, assets, expenses
- [ ] **Expected:** 70-80%
- [ ] **Actual:** _______________

- [ ] Complete all sections
- [ ] **Expected:** 100%
- [ ] **Actual:** _______________

### Next Steps Section
- [ ] With incomplete profile, check "Next Steps" section
- [ ] **Expected:** Shows top 3 missing sections with action buttons
- [ ] **Actual:** _______________

- [ ] Click action button
- [ ] **Expected:** Navigates to relevant page
- [ ] **Actual:** _______________

- [ ] With 100% complete profile
- [ ] **Expected:** Success message "Profile Complete!"
- [ ] **Actual:** _______________

### Quick Actions
- [ ] Click "Update Profile"
- [ ] **Expected:** Navigate to /dashboard/profile
- [ ] **Actual:** _______________

- [ ] Click "Calculate Benefits"
- [ ] **Expected:** Navigate to /dashboard/benefits
- [ ] **Actual:** _______________

- [ ] Click "View Projection"
- [ ] **Expected:** Navigate to /dashboard/projection
- [ ] **Actual:** _______________

### Welcome Message
- [ ] Check if user's firstName appears in welcome message
- [ ] **Expected:** "Welcome back, [FirstName]!"
- [ ] **Actual:** _______________

---

## 8. Help & FAQ

### Search Functionality
- [ ] Navigate to /dashboard/help
- [ ] Search for "RRSP"
- [ ] **Expected:** Results filtered to RRSP-related topics
- [ ] **Actual:** _______________

- [ ] Search for "tax"
- [ ] **Expected:** Tax-related topics shown
- [ ] **Actual:** _______________

- [ ] Search for "xyz" (nonsense)
- [ ] **Expected:** "No results found" message
- [ ] **Actual:** _______________

### Expandable Sections
- [ ] Click on a help topic
- [ ] **Expected:** Section expands to show detailed explanation
- [ ] **Actual:** _______________

- [ ] Click again
- [ ] **Expected:** Section collapses
- [ ] **Actual:** _______________

### Categories
- [ ] Verify all 5 categories present:
  - Account Types
  - Government Benefits
  - Financial Planning
  - Tax Concepts
  - Advanced Topics
- [ ] **Expected:** All categories have topics
- [ ] **Actual:** _______________

### External Links
- [ ] Click on Government of Canada resource links
- [ ] **Expected:** Opens in new tab, links are valid
- [ ] **Actual:** _______________

### Tooltips in Forms
- [ ] Navigate to /dashboard/projection
- [ ] Hover over info icons
- [ ] **Expected:** Tooltip appears with helpful information
- [ ] **Actual:** _______________

- [ ] Test on mobile (tap icon)
- [ ] **Expected:** Tooltip shows on tap
- [ ] **Actual:** _______________

---

## 9. Responsive Design

### Mobile (320px - 480px)
- [ ] Resize browser to 375px width
- [ ] Navigate through all pages
- [ ] **Expected:**
  - No horizontal scroll
  - Text readable
  - Buttons clickable
  - Forms usable
- [ ] **Actual:** _______________

- [ ] Check navigation menu
- [ ] **Expected:** Mobile-friendly (hamburger or stacked)
- [ ] **Actual:** _______________

- [ ] Check charts on mobile
- [ ] **Expected:** Charts resize, touch-friendly
- [ ] **Actual:** _______________

- [ ] Check tables on mobile
- [ ] **Expected:** Tables scroll horizontally or stack
- [ ] **Actual:** _______________

### Tablet (768px - 1024px)
- [ ] Resize to 768px width
- [ ] Navigate through all pages
- [ ] **Expected:** Layout adapts, 2-column grids work
- [ ] **Actual:** _______________

### Desktop (1920px+)
- [ ] Resize to 1920px width
- [ ] Navigate through all pages
- [ ] **Expected:** Content centered, max-width applied
- [ ] **Actual:** _______________

---

## 10. Browser Compatibility

### Chrome/Edge (Latest)
- [ ] Test all functionality
- [ ] **Expected:** Everything works perfectly
- [ ] **Actual:** _______________

### Firefox (Latest)
- [ ] Test all functionality
- [ ] **Expected:** Everything works perfectly
- [ ] **Actual:** _______________

### Safari (Latest)
- [ ] Test all functionality
- [ ] **Expected:** Everything works (check date pickers)
- [ ] **Actual:** _______________

### Mobile Safari (iOS)
- [ ] Test on iPhone
- [ ] **Expected:** Touch interactions work, forms usable
- [ ] **Actual:** _______________

### Mobile Chrome (Android)
- [ ] Test on Android device
- [ ] **Expected:** Touch interactions work, forms usable
- [ ] **Actual:** _______________

---

## 11. Performance

### Page Load Times
- [ ] Dashboard page load
- [ ] **Expected:** < 3 seconds
- [ ] **Actual:** _______________

- [ ] Projection page load
- [ ] **Expected:** < 3 seconds
- [ ] **Actual:** _______________

### Calculation Speed
- [ ] Generate complex projection (40+ years)
- [ ] **Expected:** < 5 seconds
- [ ] **Actual:** _______________

- [ ] Calculate all 3 benefits (CPP, OAS, GIS)
- [ ] **Expected:** < 2 seconds each
- [ ] **Actual:** _______________

### Form Responsiveness
- [ ] Type in input fields
- [ ] **Expected:** No lag, immediate response
- [ ] **Actual:** _______________

### Console Errors
- [ ] Open browser console (F12)
- [ ] Navigate through entire application
- [ ] **Expected:** No errors or warnings
- [ ] **Actual:** _______________

---

## 12. Data Validation & Edge Cases

### Extreme Values
- [ ] Enter age: 100
- [ ] **Expected:** Accepted or reasonable validation message
- [ ] **Actual:** _______________

- [ ] Enter age: 0
- [ ] **Expected:** Validation error
- [ ] **Actual:** _______________

- [ ] Enter retirement age < current age
- [ ] **Expected:** Validation error
- [ ] **Actual:** _______________

- [ ] Enter life expectancy < retirement age
- [ ] **Expected:** Validation error
- [ ] **Actual:** _______________

- [ ] Enter investment return: 50%
- [ ] **Expected:** Warning or validation
- [ ] **Actual:** _______________

- [ ] Enter investment return: -20%
- [ ] **Expected:** Accepted or warning
- [ ] **Actual:** _______________

### Special Characters
- [ ] Enter special characters in name fields (!@#$%)
- [ ] **Expected:** Sanitized or validation error
- [ ] **Actual:** _______________

### Empty Submissions
- [ ] Try to submit forms with required fields empty
- [ ] **Expected:** Validation errors shown
- [ ] **Actual:** _______________

---

## Issues Found

| # | Severity | Page/Feature | Description | Steps to Reproduce | Expected | Actual |
|---|----------|--------------|-------------|-------------------|----------|--------|
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |

**Severity Levels:**
- **Critical:** Application crashes, data loss, security issue
- **High:** Major feature broken, blocks user flow
- **Medium:** Feature works but with issues, workaround available
- **Low:** Minor cosmetic issue, doesn't affect functionality

---

## Test Results Summary

**Total Tests:** _____ / _____
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

**Tested By:** _____________________
**Test Date:** _____________________
**Environment:** _____________________
**Browser(s):** _____________________

---

## Sign-Off

**QA Approval:** ☐ Approved ☐ Needs Fixes
**Notes:**

_________________________________________________________________

**Signature:** _________________ **Date:** _________________
